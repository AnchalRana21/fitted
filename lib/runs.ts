import { del, get, keys, set } from "idb-keyval";
import type { Decisions } from "@/lib/apply";
import { jobTitle } from "@/lib/resume";
import type { Analysis, Resume, Rewrite, Tone } from "@/lib/schemas";

export type Run = {
  id: string;
  createdAt: number;
  title: string;
  resume: Resume;
  job: string;
  analysis?: Analysis;
  rewrite?: Rewrite;
  decisions: Decisions;
  coverLetter?: { tone: Tone; text: string };
};

const PREFIX = "run:";

export function newRun(resume: Resume, job: string): Run {
  return { id: crypto.randomUUID(), createdAt: Date.now(), title: jobTitle(job), resume, job, decisions: {} };
}

export async function saveRun(run: Run): Promise<void> {
  await set(PREFIX + run.id, run);
}

export async function getRun(id: string): Promise<Run | null> {
  return (await get<Run>(PREFIX + id)) ?? null;
}

export async function listRuns(): Promise<Run[]> {
  const runKeys = (await keys()).filter((k): k is string => typeof k === "string" && k.startsWith(PREFIX));
  const runs = await Promise.all(runKeys.map((k) => get<Run>(k)));
  return runs.filter((r): r is Run => Boolean(r)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteRun(id: string): Promise<void> {
  await del(PREFIX + id);
}
