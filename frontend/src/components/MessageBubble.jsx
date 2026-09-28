import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({ message, onRetry }) {
  const isUser = message.role === "user";

  return (
    <article
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
      aria-label={isUser ? "Your message" : "Assistant response"}
    >
      <div
        className={`min-w-0 break-words text-[15px] leading-[1.65] ${
          isUser
            ? "max-w-[88%] rounded-bubble bg-user-message px-4 py-3 text-user-message-text sm:max-w-[78%]"
            : "w-full max-w-full text-ink"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.failed && (
          <div className={`mt-3 flex flex-wrap items-center gap-3 text-sm ${isUser ? "text-user-message-text" : "text-danger"}`}>
            <span>{message.error || "Couldn't send this message."}</span>
            <button
              type="button"
              onClick={() => onRetry(message)}
              className={`rounded px-2 py-1 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                isUser ? "text-white" : "text-danger"
              }`}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
