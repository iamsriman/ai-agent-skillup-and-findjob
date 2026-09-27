import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";

const suggestions = [
  "What is the demand for Python?",
  "Find GenAI jobs for freshers",
  "What skills are required for AI Engineer jobs?",
  "What is the salary trend for FastAPI?",
  "Find Python jobs in Hyderabad",
];

export default function ChatWindow({ messages, isLoading, onSuggestion }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {messages.length === 0 ? (
            <div className="py-3 sm:py-9">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce9de] bg-[#f4faf5] px-3 py-1.5 text-xs font-semibold text-[#47705a]">
                <span>✦</span> Your career research companion
              </div>
              <h1 className="max-w-2xl font-['Manrope'] text-3xl font-extrabold leading-tight tracking-tight text-[#173a2e] sm:text-5xl">
                Map your skills to real career opportunities.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#718078] sm:text-base">
                Explore skill demand, salary trends, and current job openings with research from the web.
              </p>
              <div className="mt-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8a9a90]">
                  Try asking
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((question) => (
                    <button
                      className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[#e3eae3] bg-white px-4 py-3 text-left text-sm text-[#40554a] transition hover:border-[#b5d1bc] hover:bg-[#f8fcf8]"
                      key={question}
                      onClick={() => onSuggestion(question)}
                      type="button"
                    >
                      {question}
                      <span className="text-[#91a297] transition group-hover:translate-x-0.5 group-hover:text-[#367453]" aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e5f2e9] text-xs font-extrabold text-[#236247]">
                S
              </div>
              <div className="rounded-2xl rounded-bl-md border border-[#e8eee8] bg-white px-4 py-3 shadow-sm">
                <LoadingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </section>
  );
}
