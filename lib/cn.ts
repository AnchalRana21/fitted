import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our token utilities so `bg-surface` and `bg-primary` count as the same group.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas", "surface", "surface-muted", "band", "ink", "ink-2", "ink-3", "border", "border-strong", "input",
        "primary", "primary-hover", "on-primary", "primary-subtle", "primary-text",
        "secondary", "on-secondary", "secondary-subtle", "secondary-text",
        "danger", "danger-subtle", "warning-text", "warning-subtle",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
