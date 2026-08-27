import Link from "next/link";

export default function Header({ onAddAgent, dark, onToggleDark }) {
  return (
    <header className="relative z-10 flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-7 sm:py-4 dark:border-white/10">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-paper shadow-[3px_3px_0_#e56743]">MA</span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink/50 dark:text-paper/45">Local system</p>
          <h1 className="font-display text-xl leading-none text-ink dark:text-paper">Multi Agents</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/agent-profile"
          className="header-action group rounded-full border border-ink/20 bg-white/60 px-2.5 py-2 font-mono text-[10px] sm:px-4 sm:text-[11px] font-semibold uppercase tracking-wider text-ink transition-colors hover:border-accent/50 hover:bg-accent/10 dark:bg-white/5 dark:text-paper dark:hover:border-accent/50 dark:hover:bg-accent/15"
          title="Agent Profile"
        >
          <span className="mr-1.5 inline-block text-accent transition-transform duration-300 group-hover:rotate-90 group-hover:text-ink dark:group-hover:text-paper">+</span>Agents profile
        </Link>

        <button onClick={onToggleDark} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className={`theme-toggle header-action group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border transition-all duration-300 ${dark ? "border-accent bg-accent text-white shadow-[0_0_0_4px_rgba(229,103,67,.14)]" : "border-ink/20 bg-white/60 text-ink hover:border-ink"}`}>
          <span className={`absolute text-sm transition-all duration-300 ${dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}>☼</span>
          <span className={`absolute text-sm transition-all duration-300 ${dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>☾</span>
        </button>
      </div>
    </header>
  );
}
