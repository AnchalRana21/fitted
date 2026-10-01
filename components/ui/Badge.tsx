import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-2 border-border",
  primary: "bg-primary-subtle text-primary-text border-transparent",
  success: "bg-secondary-subtle text-secondary-text border-transparent",
  warning: "bg-warning-subtle text-warning-text border-transparent",
  danger: "bg-danger-subtle text-danger border-transparent",
};

export function Badge({ tone = "neutral", pill = false, className, children }: { tone?: Tone; pill?: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border font-medium",
        pill ? "rounded-full px-3 py-1 text-[13px]" : "rounded-sm px-2 py-0.5 text-xs",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
