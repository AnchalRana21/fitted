import { HistoryList } from "@/components/history/HistoryList";

export const metadata = { title: "History · Fitted" };

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-neutral-600">Saved in this browser only.</p>
      </div>
      <HistoryList />
    </div>
  );
}
