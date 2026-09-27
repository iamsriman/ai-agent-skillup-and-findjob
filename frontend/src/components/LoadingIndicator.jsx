export default function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 text-sm text-[#607268]" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#42906a] [animation-delay:-0.24s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#42906a] [animation-delay:-0.12s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#42906a]" />
      </span>
      Researching current opportunities...
    </div>
  );
}
