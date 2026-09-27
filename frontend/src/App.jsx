import { useState } from "react";
import ChatInput from "./components/ChatInput.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import Header from "./components/Header.jsx";
import { sendMessage } from "./services/api.js";

const FRIENDLY_ERROR = "Sorry, I couldn't complete the request. Please try again.";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submitMessage(rawMessage) {
    const message = rawMessage.trim();
    if (!message || isLoading) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: message },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendMessage(message);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: result.response },
      ]);
    } catch (error) {
      console.error("SkillMap AI chat request failed:", error);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: FRIENDLY_ERROR },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-0 sm:p-6">
      <div className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-[#fbfcfa] sm:h-[min(900px,calc(100dvh-48px))] sm:rounded-[28px] sm:border sm:border-[#e2e9e2] sm:shadow-panel">
        <Header />
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSuggestion={submitMessage}
        />
        <footer className="border-t border-[#e7ece7] bg-[#fbfcfa] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => submitMessage(input)}
              isLoading={isLoading}
            />
            <p className="mt-2 text-center text-[11px] text-[#98a49b]">
              SkillMap AI can make mistakes. Verify important career and job details.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
