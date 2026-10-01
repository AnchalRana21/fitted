"use client";

import { useState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

export function CopyButton({
  text,
  label,
  variant = "secondary",
  size,
}: {
  text: string;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant={variant} size={size} onClick={copy} disabled={!text}>
        {label}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
      </span>
      {state === "copied" && (
        <span aria-hidden="true" className="text-xs text-ink-3">
          Copied
        </span>
      )}
      {state === "failed" && (
        <span aria-hidden="true" className="text-xs text-danger">
          Copy failed
        </span>
      )}
    </span>
  );
}
