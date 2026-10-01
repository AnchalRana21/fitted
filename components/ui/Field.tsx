import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClasses =
  "w-full rounded-md border border-input bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-3 shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60 md:text-sm";

export function Field({
  id,
  label,
  hint,
  hintId,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  hintId?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-ink-3">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClasses, "min-h-40 resize-y leading-relaxed", className)} {...props} />;
}
