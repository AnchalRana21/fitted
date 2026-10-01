"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { parseSections } from "@/lib/parse/sections";
import { newRun, saveRun, type Run } from "@/lib/runs";
import { sampleRun } from "@/lib/sample";
import { LIMITS, ResumeSchema } from "@/lib/schemas";
import { FileDrop } from "./FileDrop";

function TrustNote({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-secondary">
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </span>
  );
}

export function InputForm() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [job, setJob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "submit" | "sample">(null);

  const jobTooLong = job.length > LIMITS.jobChars;
  const canSubmit =
    resumeText.trim().length >= LIMITS.minResumeChars &&
    job.trim().length >= LIMITS.minJobChars &&
    !jobTooLong &&
    !busy;
  const showHint = !canSubmit && !busy && !jobTooLong;

  async function openRun(run: Run, source: "submit" | "sample") {
    setBusy(source);
    try {
      await saveRun(run);
      router.push(`/tailor/${run.id}`);
    } catch {
      setError("Couldn't save in this browser. Private browsing can block storage; try a normal window.");
      setBusy(null);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = ResumeSchema.safeParse(parseSections(resumeText));
    if (!parsed.success) {
      setError("Couldn't read that resume. Check that it has text and is under 30,000 characters.");
      return;
    }
    await openRun(newRun(parsed.data, job.trim()), "submit");
  }

  async function onSample() {
    await openRun(sampleRun(), "sample");
  }

  return (
    <Card raised className="p-5 sm:p-8">
      <form onSubmit={onSubmit}>
        <div className="grid gap-8 md:grid-cols-2">
          <section aria-labelledby="resume-heading">
            <h2 id="resume-heading" className="text-base font-semibold text-ink">
              Your resume
            </h2>
            <p className="mt-0.5 text-sm text-ink-3">Upload a PDF or Word file, or paste the text.</p>
            <div className="mt-4">
              <FileDrop onText={setResumeText} />
            </div>
            <Field id="resume-text" label="Resume text" className="mt-4">
              <Textarea
                id="resume-text"
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setError(null);
                }}
                placeholder="Paste your resume, or upload a file above"
                className="h-48 md:h-64"
              />
            </Field>
          </section>
          <section aria-labelledby="job-heading">
            <h2 id="job-heading" className="text-base font-semibold text-ink">
              The job
            </h2>
            <p className="mt-0.5 text-sm text-ink-3">Paste the full job description.</p>
            <Field id="job-text" label="Job description" className="mt-4">
              <Textarea
                id="job-text"
                value={job}
                onChange={(e) => {
                  setJob(e.target.value);
                  setError(null);
                }}
                aria-describedby="job-count"
                aria-invalid={jobTooLong || undefined}
                placeholder="Paste the full job description"
                className={cn("h-48 md:h-[24.75rem]", jobTooLong && "border-danger focus:border-danger focus:ring-danger/15")}
              />
              <p id="job-count" className={cn("text-xs tabular-nums", jobTooLong ? "font-medium text-danger" : "text-ink-3")}>
                {job.length.toLocaleString()} / {LIMITS.jobChars.toLocaleString()} characters
              </p>
            </Field>
            {jobTooLong && (
              <p role="alert" className="sr-only">
                Job description is over the 15,000 character limit.
              </p>
            )}
          </section>
        </div>
        {error && (
          <Alert tone="danger" className="mt-6">
            {error}
          </Alert>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={!canSubmit} aria-describedby={showHint ? "submit-hint" : undefined}>
            {busy === "submit" ? "Starting…" : "Tailor my resume"}
          </Button>
          <Button variant="secondary" onClick={onSample} disabled={busy !== null}>
            {busy === "sample" ? "Starting…" : "Try sample"}
          </Button>
          <div className="flex flex-wrap gap-x-5 gap-y-2 sm:ml-auto">
            <TrustNote>Never invents experience</TrustNote>
            <TrustNote>Saved only in your browser</TrustNote>
          </div>
          {showHint && (
            <p id="submit-hint" className="basis-full text-xs text-ink-3">
              Add at least {LIMITS.minResumeChars} characters of resume text and {LIMITS.minJobChars} of job description.
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
