import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const linkClass =
  "rounded-full px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md text-base font-semibold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-primary text-xs font-bold text-on-primary">F</span>
          Fitted
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/history" className={linkClass}>History</Link>
          <Link href="/design-system" className={`${linkClass} hidden sm:inline-flex`}>Design system</Link>
          <a href="https://github.com/AnchalRana21/fitted" rel="noopener noreferrer" className={`${linkClass} hidden sm:inline-flex`}>GitHub</a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
