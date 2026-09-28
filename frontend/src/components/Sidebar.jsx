import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus, Trash2, X } from "lucide-react";

export default function Sidebar({
  conversations,
  activeId,
  user,
  isLoading,
  isOpen,
  triggerRef,
  onClose,
  onNewChat,
  onSelect,
  onDelete,
  onLogout,
}) {
  const closeRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
      const closeOnEscape = (event) => {
        if (event.key === "Escape") onClose();
      };
      window.addEventListener("keydown", closeOnEscape);
      wasOpen.current = true;
      return () => window.removeEventListener("keydown", closeOnEscape);
    }

    if (wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = false;
  }, [isOpen, onClose, triggerRef]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-ink/30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        id="conversation-sidebar"
        aria-label="Conversation navigation"
        aria-modal={isOpen ? "true" : undefined}
        role={isOpen ? "dialog" : undefined}
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(84vw,280px)] flex-col border-r border-line bg-sidebar transition-transform duration-150 md:static md:z-auto md:w-[272px] md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <span className="font-display text-[21px] font-semibold tracking-[-0.04em] text-ink">
            SkillMap
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="icon-button md:hidden"
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={onNewChat}
            disabled={isLoading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MessageSquarePlus size={17} strokeWidth={1.8} aria-hidden="true" />
            New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <h2 className="px-2 pb-2 pt-1 text-xs font-medium text-muted">
            Your conversations
          </h2>
          {conversations.length === 0 ? (
            <p className="px-2 py-3 text-sm leading-6 text-muted">
              Your conversations will appear here.
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeId}
                  disabled={isLoading}
                  onSelect={() => onSelect(conversation.id)}
                  onDelete={() => onDelete(conversation.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-line p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {user?.name || user?.email || "Signed in"}
            </p>
            {user?.name && user?.email && (
              <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full rounded-control border border-line px-3 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

function ConversationItem({ conversation, isActive, disabled, onSelect, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="group relative">
      {confirming ? (
        <div className="rounded-control border border-line bg-surface p-2">
          <p className="px-1 text-xs text-secondary">Delete this conversation?</p>
          <div className="mt-2 flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded px-2 py-1 text-xs text-secondary hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            className={`flex min-h-10 w-full items-center rounded-control py-2 pl-3 pr-10 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "bg-active text-ink"
                : "text-secondary hover:bg-hover"
            }`}
          >
            <span className="truncate">{conversation.title || "Untitled conversation"}</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setConfirming(true)}
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-control text-muted opacity-100 transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            aria-label={`Delete ${conversation.title || "conversation"}`}
          >
            <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </>
      )}
    </li>
  );
}
