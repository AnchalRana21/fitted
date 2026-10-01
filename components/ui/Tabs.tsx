"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const Tabs = RadixTabs.Root;

export function TabList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn("flex gap-1 overflow-x-auto border-b border-border", className)} {...props} />;
}

export function Tab({ className, ...props }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-[state=active]:border-primary data-[state=active]:text-primary-text",
        className,
      )}
      {...props}
    />
  );
}

/** Always mounted so in-progress streams and edits survive tab switches. */
export function TabPanel({ className, ...props }: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content forceMount className={cn("pt-5 data-[state=inactive]:hidden", className)} {...props} />;
}
