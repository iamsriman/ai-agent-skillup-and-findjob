export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[#e7ece7] px-5 py-4 sm:px-8">
      <a className="flex items-center gap-3 no-underline" href="/" aria-label="SkillMap AI home">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#174f3b] text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M5 18.5 10 13l3 2.5L19 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M14.5 8H19v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          <span className="block font-['Manrope'] text-base font-extrabold tracking-tight text-[#173a2e] sm:text-lg">
            SkillMap AI
          </span>
          <span className="hidden text-xs text-[#718078] sm:block">
            Skill-to-Career Mapping Assistant
          </span>
        </span>
      </a>
      <div className="flex items-center gap-2 rounded-full border border-[#e7ece7] bg-white px-3 py-1.5 text-xs font-semibold text-[#4e685b]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Ready to help
      </div>
    </header>
  );
}
