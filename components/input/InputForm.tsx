"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { parseSections } from "@/lib/parse/sections";
import { newRun, saveRun } from "@/lib/runs";
import { sampleRun } from "@/lib/sample";
import { LIMITS, ResumeSchema } from "@/lib/schemas";
import { FileDrop } from "./FileDrop";

const fieldClass =
  "mt-2 h-72 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20";

export function InputForm() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [job, setJob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const jobTooLong = job.length > LIMITS.jobChars;
  const canSubmit =
    resumeText.trim().length >= LIMITS.minResumeChars &&
    job.trim().length >= LIMITS.minJobChars &&
    !jobTooLong &&
    !busy;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = ResumeSchema.safeParse(parseSections(resumeText));
    if (!parsed.success) {
      setError("Couldn't read that resume. Check that it has text and is under 30,000 characters.");
      return;
    }
    setBusy(true);
    const run = newRun(parsed.data, job.trim());
    await saveRun(run);
    router.push(`/tailor/${run.id}`);
  }

  async function onSample() {
    setBusy(true);
    const run = sampleRun();
    await saveRun(run);
    router.push(`/tailor/${run.id}`);
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
            onChange={(e) => setResumeText(e.target.value)}
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
            onChange={(e) => setJob(e.target.value)}
            placeholder="Paste the full job description"
            className={`${fieldClass} md:h-[25.5rem]`}
          />
          <p aria-live="polite" className={`mt-1 text-xs ${jobTooLong ? "text-red-700" : "text-neutral-600"}`}>
            {job.length.toLocaleString()} / {LIMITS.jobChars.toLocaleString()} characters
          </p>
        </section>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!canSubmit}>
          Tailor my resume
        </Button>
        <Button variant="secondary" onClick={onSample} disabled={busy}>
          Try sample
        </Button>
      </div>
    </form>
  );
}
