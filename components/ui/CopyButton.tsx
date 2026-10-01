"use client";

import { useState } from "react";
import { Button } from "./Button";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" onClick={copy} disabled={!text}>
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </Button>
  );
}
