"use client";

import { useState } from "react";
import { Button } from "./Button";

export function CopyButton({ text, label }: { text: string; label: string }) {
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
      <Button variant="secondary" onClick={copy} disabled={!text}>
        {label}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
      </span>
      {state === "copied" && (
        <span aria-hidden="true" className="text-xs text-neutral-600">
          Copied
        </span>
      )}
      {state === "failed" && (
        <span aria-hidden="true" className="text-xs text-red-700">
          Copy failed
        </span>
      )}
    </span>
  );
}
