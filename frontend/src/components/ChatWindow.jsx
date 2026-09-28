import MessageList from "./MessageList.jsx";

const suggestions = [
  "Which skills should I learn for data engineering?",
  "What skills are in demand for AI engineering?",
  "Find current Python developer opportunities.",
];

export default function ChatWindow({ messages, isLoading, onSuggestion, onRetry }) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto" aria-label="Chat messages">
      {messages.length === 0 ? (
        <div className="mx-auto flex w-full max-w-chat flex-col px-5 pb-8 pt-10 sm:px-8 sm:pt-16">
          <h1 className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[28px]">
            What would you like to explore?
          </h1>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Ask about skills, career paths, salaries, or current job openings.
          </p>
          <div className="mt-7 flex flex-col items-start gap-2">
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onSuggestion(question)}
                className="rounded-control border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-secondary transition-colors hover:border-accent/40 hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageList messages={messages} isLoading={isLoading} onRetry={onRetry} />
      )}
      {messages.length === 0 && isLoading && (
        <div className="mx-auto w-full max-w-chat px-5 sm:px-8">
          <MessageList messages={[]} isLoading onRetry={onRetry} />
        </div>
      )}
      {messages.length === 0 && !isLoading && null}
    </section>
  );
}
