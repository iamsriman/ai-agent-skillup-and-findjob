export default function LoadingIndicator() {
  return (
    <div className="flex items-center gap-3 py-1 text-sm text-muted" role="status">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent [animation-delay:240ms]" />
      </span>
      Thinking...
    </div>
  );
}
