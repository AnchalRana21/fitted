"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { Textarea } from "@/components/ui/Field";
import { useStream } from "@/hooks/useStream";
import type { Resume, Tone } from "@/lib/schemas";

const TextSchema = z.string();
const TONES: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
];

type Saved = { tone: Tone; text: string } | undefined;
type Props = { resume: Resume; job: string; saved: Saved; onSave: (coverLetter: Saved) => void };

export function CoverLetterPanel({ resume, job, saved, onSave }: Props) {
  const [tone, setTone] = useState<Tone>(saved?.tone ?? "formal");
  const [text, setText] = useState(saved?.text ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toneAtStart = useRef<Tone>(tone);
  const stream = useStream("/api/cover-letter", TextSchema, (data) => {
    setText(data);
    onSave({ tone: toneAtStart.current, text: data });
  });

  const generating = stream.status === "streaming";
  const showStream = generating || (stream.status === "error" && stream.text !== "");
  const shown = showStream ? stream.text : text;
  const start = () => {
    toneAtStart.current = tone;
    void stream.start({ resume, job, tone });
  };
  const generate = () => {
    if (text) setConfirmOpen(true);
    else start();
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Tone</legend>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <label
              key={t.value}
              className="relative cursor-pointer rounded-full border border-border-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors not-has-checked:hover:bg-surface-muted not-has-checked:hover:text-ink has-checked:border-primary has-checked:bg-primary-subtle has-checked:text-primary-text has-disabled:cursor-not-allowed has-disabled:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name="tone"
                value={t.value}
                checked={tone === t.value}
                disabled={generating}
                onChange={() => setTone(t.value)}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={generate} disabled={generating}>
          {generating ? "Writing…" : text ? "Write a new version" : "Write cover letter"}
        </Button>
        <CopyButton text={shown} label="Copy text" size="sm" />
      </div>
      {stream.error && <ErrorNotice error={stream.error} onRetry={generate} />}
      <p role="status" className="sr-only">
        {generating ? "Writing your cover letter…" : stream.status === "done" ? "Cover letter ready" : ""}
      </p>
      <label htmlFor="cover-letter" className="sr-only">
        Cover letter
      </label>
      <Textarea
        id="cover-letter"
        value={shown}
        readOnly={generating}
        aria-busy={generating}
        onChange={(e) => {
          if (stream.status === "error") stream.reset();
          setText(e.target.value);
        }}
        onBlur={() => {
          if (text !== (saved?.text ?? "")) onSave(text ? { tone, text } : undefined);
        }}
        placeholder="Pick a tone and press Write cover letter."
        className="h-96 p-4"
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replace your cover letter?"
        description="Writing a new version replaces the current letter, including any edits you made."
        confirmLabel="Write new version"
        onConfirm={start}
      />
    </div>
  );
}
