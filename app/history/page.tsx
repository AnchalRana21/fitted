import Link from "next/link";
import { HistoryList } from "@/components/history/HistoryList";
import { buttonClasses } from "@/components/ui/Button";

export const metadata = { title: "History · Fitted" };

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">History</h1>
            <p className="text-sm text-ink-3">Saved in this browser only.</p>
          </div>
          <Link href="/" className={buttonClasses("primary", "sm")}>
            New run
          </Link>
        </div>
        <HistoryList />
      </div>
    </main>
  );
}
