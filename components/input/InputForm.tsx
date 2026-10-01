"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { parseSections } from "@/lib/parse/sections";
import { newRun, saveRun, type Run } from "@/lib/runs";
import { sampleRun } from "@/lib/sample";
import { LIMITS, ResumeSchema } from "@/lib/schemas";
import { FileDrop } from "./FileDrop";

const fieldClass =
  "mt-2 h-72 w-full rounded-lg border border-neutral-400 bg-white p-3 text-base placeholder:text-neutral-500 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 md:text-sm";

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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="resume-heading">
          <h2 id="resume-heading" className="text-base font-semibold">
            Your resume
          </h2>
          <div className="mt-2">
            <FileDrop onText={setResumeText} />
          </div>
          <label htmlFor="resume-text" className="mt-4 block text-sm font-medium">
            Resume text
          </label>
          <textarea
            id="resume-text"
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value);
              setError(null);
            }}
            placeholder="Paste your resume, or upload a file above"
            className={fieldClass}
          />
        </section>
        <section aria-labelledby="job-heading">
          <h2 id="job-heading" className="text-base font-semibold">
            The job
          </h2>
          <label htmlFor="job-text" className="mt-2 block text-sm font-medium">
            Job description
          </label>
          <textarea
            id="job-text"
            value={job}
            onChange={(e) => {
              setJob(e.target.value);
              setError(null);
            }}
            aria-describedby="job-count"
            placeholder="Paste the full job description"
            className={`${fieldClass} md:h-[25.5rem]`}
          />
          <p id="job-count" className={`mt-1 text-xs ${jobTooLong ? "text-red-700" : "text-neutral-600"}`}>
            {job.length.toLocaleString()} / {LIMITS.jobChars.toLocaleString()} characters
          </p>
          {jobTooLong && (
            <p role="alert" className="sr-only">
              Job description is over the 15,000 character limit.
            </p>
          )}
        </section>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {showHint && (
        <p id="submit-hint" className="text-xs text-neutral-600">
          Add at least {LIMITS.minResumeChars} characters of resume text and {LIMITS.minJobChars} of job description.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!canSubmit} aria-describedby={showHint ? "submit-hint" : undefined}>
          {busy === "submit" ? "Starting…" : "Tailor my resume"}
        </Button>
        <Button variant="secondary" onClick={onSample} disabled={busy !== null}>
          {busy === "sample" ? "Starting…" : "Try sample"}
        </Button>
      </div>
    </form>
  );
}
