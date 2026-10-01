"use client";

import { useState, type DragEvent } from "react";
import { ACCEPTED_FILES, detectKind } from "@/lib/parse/kind";
import { LIMITS } from "@/lib/schemas";

type State = { status: "idle" | "reading" | "done" | "error"; message?: string; name?: string };

export function FileDrop({ onText }: { onText: (text: string) => void }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [dragging, setDragging] = useState(false);

  async function handle(file: File) {
    if (!detectKind(file.name, file.type)) return setState({ status: "error", message: "Upload a PDF or DOCX file." });
    if (file.size > LIMITS.fileBytes) return setState({ status: "error", message: "File is larger than 4 MB." });

    setState({ status: "reading", name: file.name });
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/parse", { method: "POST", body: form });
      const json = (await res.json()) as { text?: string; code?: string; message?: string };
      if (!res.ok || !json.text) {
        setState({ status: "error", message: json.message ?? "Couldn't read this file." });
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
      className={`rounded-lg border-2 border-dashed p-6 text-center text-sm ${
        dragging ? "border-emerald-700 bg-emerald-50" : "border-neutral-300 bg-white"
      }`}
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
      <label htmlFor="resume-file" className="cursor-pointer text-neutral-700">
        Drop a PDF or DOCX here, or <span className="font-medium text-emerald-800 underline">browse</span>
      </label>
      <p role="status" className={`mt-2 ${state.status === "error" ? "text-red-700" : "text-neutral-600"}`}>
        {state.status === "reading" && `Reading ${state.name}…`}
        {state.status === "done" && `Loaded ${state.name}. Check the text below.`}
        {state.status === "error" && state.message}
      </p>
    </div>
  );
}
