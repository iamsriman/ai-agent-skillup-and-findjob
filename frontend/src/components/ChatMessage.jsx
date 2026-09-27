import JobCard from "./JobCard.jsx";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e5f2e9] text-[#236247]">
          <span className="text-xs font-extrabold">S</span>
        </div>
      )}
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm sm:max-w-[78%] sm:px-5 ${
          isUser
            ? "rounded-br-md bg-[#174f3b] text-white"
            : "rounded-bl-md border border-[#e8eee8] bg-white text-[#34443c]"
        }`}
      >
        <div className="message-copy whitespace-pre-wrap break-words">{message.content}</div>
        {Array.isArray(message.jobs) && message.jobs.length > 0 && (
          <div className="mt-4 grid gap-3">
            {message.jobs.map((job, index) => (
              <JobCard key={`${job.apply_link || job.title}-${index}`} job={job} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dfe7e1] text-xs font-bold text-[#486052]">
          You
        </div>
      )}
    </article>
  );
}
