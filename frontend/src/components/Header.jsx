import { Menu } from "lucide-react";

export default function Header({
  menuButtonRef,
  isLoadingConversations,
  isDrawerOpen,
  onOpenMenu,
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenMenu}
          className="icon-button md:hidden"
          aria-label="Open conversation menu"
          aria-controls="conversation-sidebar"
          aria-expanded={isDrawerOpen}
        >
          <Menu size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <h1 className="truncate text-sm font-medium text-secondary">
          {isLoadingConversations ? "Loading conversations..." : "Career research"}
        </h1>
      </div>
    </header>
  );
}
