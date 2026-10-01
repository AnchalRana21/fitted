import { cn } from "@/lib/cn";

export function Stat({ value, label, className }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-lg font-semibold tracking-tight text-ink">{value}</p>
      <p className="text-xs text-ink-3">{label}</p>
    </div>
  );
}
