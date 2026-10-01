import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary shadow-sm hover:bg-primary-hover",
  secondary: "border border-border-strong bg-surface text-ink shadow-sm hover:bg-surface-muted",
  ghost: "text-ink-2 hover:bg-surface-muted hover:text-ink",
  success: "bg-secondary text-on-secondary shadow-sm hover:bg-secondary-hover",
  danger: "bg-danger text-on-danger shadow-sm hover:bg-danger-hover",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-sm",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type="button" className={buttonClasses(variant, size, className)} {...props} />;
}
