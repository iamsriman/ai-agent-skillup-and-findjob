import { useCallback, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/chat.js";
import { deleteConversation, getConversationMessages, listConversations } from "../api/conversations.js";
import ChatInput from "../components/ChatInput.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function toUiMessages(messages, conversationId) {
  if (!Array.isArray(messages)) throw new Error("The server returned an invalid conversation.");

  return messages.flatMap((message, index) => {
    if (!message || typeof message.content !== "string") return [];
    const role = message.role === "human" ? "user" : message.role === "ai" ? "assistant" : null;
    if (!role) return [];
    return [{ id: `${conversationId}-${index}`, role, content: message.content }];
  });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [notice, setNotice] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const sendLock = useRef(false);
  const menuButtonRef = useRef(null);
  const historyRequest = useRef(0);

  const refreshConversations = useCallback(async () => {
    const result = await listConversations();
    if (!Array.isArray(result)) throw new Error("The server returned an invalid conversation list.");
    setConversations(result);
    return result;
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingConversations(true);
    listConversations()
      .then((result) => {
        if (!Array.isArray(result)) throw new Error("The server returned an invalid conversation list.");
        if (isCurrent) setConversations(result);
      })
      .catch((error) => {
        if (isCurrent && error.status !== 401) setNotice(error.message || "Unable to load your conversations.");
      })
      .finally(() => {
        if (isCurrent) setIsLoadingConversations(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const startNewChat = useCallback(() => {
    if (sendLock.current) return;
    historyRequest.current += 1;
    setActiveId(null);
    setMessages([]);
    setInput("");
    setNotice("");
    setIsDrawerOpen(false);
  }, []);

  async function selectConversation(conversationId) {
    if (sendLock.current) return;
    const requestId = ++historyRequest.current;
    setActiveId(conversationId);
    setMessages([]);
    setInput("");
    setNotice("");
    setIsDrawerOpen(false);

    try {
      const result = await getConversationMessages(conversationId);
      if (requestId !== historyRequest.current) return;
      setMessages(toUiMessages(result?.messages, conversationId));
    } catch (error) {
      if (requestId !== historyRequest.current || error.status === 401) return;
      if (error.status === 404) {
        setActiveId(null);
        setMessages([]);
        setNotice("That conversation is no longer available. Start a new chat.");
        try {
          await refreshConversations();
        } catch (refreshError) {
          setNotice(refreshError.message);
        }
        return;
      }
      setNotice(error.message || "Unable to load this conversation.");
      setActiveId(null);
    }
  }

  async function removeConversation(conversationId) {
    setNotice("");
    try {
      await deleteConversation(conversationId);
      setConversations((current) => current.filter((conv) => conv.id !== conversationId));
      if (activeId === conversationId) startNewChat();
    } catch (error) {
      if (error.status === 401) return;
      if (error.status === 404) {
        try {
          await refreshConversations();
        } catch (refreshError) {
          setNotice(refreshError.message);
          return;
        }
        if (activeId === conversationId) startNewChat();
        setNotice("That conversation is no longer available.");
        return;
      }
      setNotice(error.message || "Unable to delete this conversation.");
    }
  }

  async function submitMessage(rawMessage, retryMessage = null) {
    const messageText = rawMessage.trim();
    if (!messageText || sendLock.current) return;

    sendLock.current = true;
    let userMessageId = retryMessage?.id;

    if (retryMessage) {
      setMessages((current) =>
        current.map((message) =>
          message.id === retryMessage.id ? { ...message, failed: false, error: undefined } : message,
        ),
      );
    } else {
      userMessageId = crypto.randomUUID();
      setMessages((current) => [
        ...current,
        { id: userMessageId, role: "user", content: messageText },
      ]);
      setInput("");
    }

    setNotice("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(messageText, activeId);
      if (!result || typeof result.response !== "string" || result.success !== true || typeof result.conversation_id !== "string") {
        throw new Error("The assistant returned an unexpected response.");
      }

      const nextConversationId = result.conversation_id;
      if (!activeId) setActiveId(nextConversationId);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: result.response },
      ]);

      await refreshConversations();
    } catch (error) {
      if (error.status === 401) return;
      if (error.status === 404) {
        setActiveId(null);
        setMessages([]);
        setNotice("That conversation is no longer available. Start a new chat.");
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === userMessageId
            ? { ...message, failed: true, error: error.message || "Couldn't send this message." }
            : message,
        ),
      );

      if (error.message === "Can't reach the server. Check that the backend is running.") {
        setNotice(error.message);
      } else if (error.status === 502) {
        setNotice("The assistant had trouble responding. Try again.");
      } else if (error.message) {
        setNotice(error.message);
      }
    } finally {
      sendLock.current = false;
      setIsLoading(false);
    }
  }

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <main className="flex h-dvh min-h-[420px] overflow-hidden bg-canvas text-ink">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        user={user}
        isLoading={isLoading}
        isOpen={isDrawerOpen}
        triggerRef={menuButtonRef}
        onClose={closeDrawer}
        onNewChat={startNewChat}
        onSelect={selectConversation}
        onDelete={removeConversation}
        onLogout={logout}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <Header
          menuButtonRef={menuButtonRef}
          isLoadingConversations={isLoadingConversations}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          {notice && (
            <div
              role="alert"
              className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-chat items-center justify-between gap-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              <span>{notice}</span>
              {notice.startsWith("Can't reach") && (
                <button
                  type="button"
                  onClick={() => {
                    setNotice("");
                    setIsLoadingConversations(true);
                    refreshConversations()
                      .catch((error) => setNotice(error.message || "Unable to refresh."))
                      .finally(() => setIsLoadingConversations(false));
                  }}
                  className="shrink-0 font-semibold underline underline-offset-2"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <ChatWindow messages={messages} isLoading={isLoading} onSuggestion={submitMessage} onRetry={(message) => submitMessage(message.content, message)} />

          <footer className="shrink-0 border-t border-line bg-canvas px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-5">
            <div className="mx-auto max-w-chat">
              <ChatInput value={input} onChange={setInput} onSubmit={() => submitMessage(input)} isLoading={isLoading} />
              <p className="mt-2 text-center text-xs text-muted">Check important career and job details with the original sources.</p>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
