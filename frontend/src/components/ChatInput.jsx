import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function ChatInput({ value, onChange, onSubmit, isLoading }) {
  const inputRef = useRef(null);
  const canSend = value.trim().length > 0 && !isLoading;

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  }

  return (
    <form
      className="rounded-card border border-line bg-surface p-2 transition-colors focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-focus"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit();
      }}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          className="max-h-40 min-h-11 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-muted focus:ring-0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          aria-label="Your question"
          rows={1}
          disabled={isLoading}
        />
        <button
          className="mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-control bg-accent text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-disabled"
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
        >
          <ArrowUp size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
