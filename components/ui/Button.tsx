import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

const STYLES: Record<Variant, string> = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
  ghost: "text-neutral-700 hover:bg-neutral-100",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${STYLES[variant]} ${className}`}
      {...props}
    />
  );
}
