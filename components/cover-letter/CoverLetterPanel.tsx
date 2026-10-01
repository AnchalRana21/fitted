"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
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
  const toneAtStart = useRef<Tone>(tone);
  const stream = useStream("/api/cover-letter", TextSchema, (data) => {
    setText(data);
    onSave({ tone: toneAtStart.current, text: data });
  });

  const generating = stream.status === "streaming";
  const showStream = generating || (stream.status === "error" && stream.text !== "");
  const shown = showStream ? stream.text : text;
  const generate = () => {
    if (text && !window.confirm("Replace your current cover letter?")) return;
    toneAtStart.current = tone;
    void stream.start({ resume, job, tone });
  };

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap items-center gap-4">
        <legend className="mb-2 text-sm font-semibold">Tone</legend>
        {TONES.map((t) => (
          <label key={t.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tone"
              value={t.value}
              checked={tone === t.value}
              disabled={generating}
              onChange={() => setTone(t.value)}
              className="accent-emerald-700"
            />
            {t.label}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={generating}>
          {generating ? "Writing…" : text ? "Write a new version" : "Write cover letter"}
        </Button>
        <CopyButton text={shown} label="Copy text" />
      </div>
      {stream.error && <ErrorNotice error={stream.error} onRetry={generate} />}
      <p role="status" className="sr-only">
        {generating ? "Writing your cover letter…" : stream.status === "done" ? "Cover letter ready" : ""}
      </p>
      <label htmlFor="cover-letter" className="sr-only">
        Cover letter
      </label>
      <textarea
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
        className="h-96 w-full rounded-lg border border-neutral-400 bg-white p-4 text-sm leading-relaxed placeholder:text-neutral-500"
      />
    </div>
  );
}
