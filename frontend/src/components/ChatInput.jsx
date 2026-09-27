import { useRef } from "react";

export default function ChatInput({ value, onChange, onSubmit, isLoading }) {
  const inputRef = useRef(null);
  const canSend = value.trim().length > 0 && !isLoading;

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  }

  function handleChange(event) {
    onChange(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 144)}px`;
  }

  return (
    <form
      className="rounded-2xl border border-[#dfe8df] bg-white p-2 shadow-[0_12px_36px_-28px_rgba(23,58,46,0.45)] focus-within:border-[#8db8a0] focus-within:ring-4 focus-within:ring-[#e3f1e7]"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSubmit();
      }}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          className="max-h-36 min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-sm leading-6 text-[#263a30] outline-none placeholder:text-[#9aa79e] focus:ring-0"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a skill, career demand, salary, or jobs..."
          aria-label="Your question"
          rows={1}
          disabled={isLoading}
        />
        <button
          className="mb-1 inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#174f3b] px-4 text-sm font-semibold text-white transition hover:bg-[#103d2c] disabled:cursor-not-allowed disabled:bg-[#b8c9be]"
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
        >
          <span className="hidden sm:inline">Send</span>
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
