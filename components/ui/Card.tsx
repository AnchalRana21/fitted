import type { ComponentProps, ElementType } from "react";
import { cn } from "@/lib/cn";

type CardProps<T extends ElementType> = { as?: T; raised?: boolean; className?: string } & Omit<ComponentProps<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({ as, raised = false, className, ...props }: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn("rounded-lg border border-border bg-surface", raised ? "shadow-lg" : "shadow-sm", className)}
      {...props}
    />
  );
}
