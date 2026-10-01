import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "danger" | "warning" | "info" | "success";

const TONES: Record<AlertTone, string> = {
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warning-subtle text-warning-text",
  info: "bg-primary-subtle text-primary-text",
  success: "bg-secondary-subtle text-secondary-text",
};

/** role "alert" interrupts screen readers; use "status" for non-urgent notes. */
export function Alert({
  tone = "danger",
  role = "alert",
  title,
  children,
  actions,
  className,
}: {
  tone?: AlertTone;
  role?: "alert" | "status";
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div role={role} className={cn("rounded-md px-4 py-3 text-sm", TONES[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : undefined}>{children}</div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
