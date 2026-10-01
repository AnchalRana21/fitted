"use client";

import { useState, type DragEvent } from "react";
import { ACCEPTED_FILES, detectKind } from "@/lib/parse/kind";
import { cn } from "@/lib/cn";
import { LIMITS } from "@/lib/schemas";

type State = { status: "idle" | "reading" | "done" | "error"; message?: string; name?: string };

export function FileDrop({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [dragging, setDragging] = useState(false);

  async function handle(file: File) {
    if (state.status === "reading") return;
    if (!detectKind(file.name, file.type)) return setState({ status: "error", message: "Upload a PDF or DOCX file." });
    if (file.size > LIMITS.fileBytes) return setState({ status: "error", message: "File is larger than 4 MB." });

    setState({ status: "reading", name: file.name });
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/parse", { method: "POST", body: form });
      const json = (await res.json().catch(() => ({}))) as { text?: string; code?: string; message?: string };
      if (!res.ok || !json.text) {
        setState({
          status: "error",
          message: json.message ?? (res.status === 413 ? "File is larger than 4 MB." : "Couldn't read this file. Paste the text instead."),
        });
        if (json.code === "no_text") document.getElementById("resume-text")?.focus();
        return;
      }
      onText(json.text);
      setState({ status: "done", name: file.name });
    } catch {
      setState({ status: "error", message: "Upload failed. Check your connection and try again." });
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void handle(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-md border-2 border-dashed px-4 py-6 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
        dragging ? "border-primary bg-primary-subtle" : "border-input bg-surface-muted",
      )}
    >
      <input
        id="resume-file"
        type="file"
        accept={ACCEPTED_FILES}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
          e.target.value = "";
        }}
      />
      <label htmlFor="resume-file" className="block cursor-pointer text-ink-2">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-2 size-6 text-ink-3"
        >
          <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
        Drop a PDF or DOCX here, or{" "}
        <span className="font-semibold text-primary-text underline underline-offset-2">browse</span>
        <span className="mt-1 block text-xs text-ink-3">Up to 4 MB</span>
      </label>
      <p
        role="status"
        className={cn(
          "text-sm",
          state.status !== "idle" && "mt-3",
          state.status === "reading" && "text-ink-2",
          state.status === "done" && "inline-flex items-center gap-1.5 font-medium text-secondary-text",
          state.status === "error" && "text-danger",
        )}
      >
        {state.status === "done" && (
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {state.status === "reading" && `Reading ${state.name}…`}
        {state.status === "done" && `Loaded ${state.name}. Check the text below.`}
        {state.status === "error" && state.message}
      </p>
    </div>
  );
}
