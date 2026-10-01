import sample from "@/fixtures/sample-run.json";
import type { Rewrite } from "@/lib/schemas";
import type { StreamEvent } from "@/lib/stream/ndjson";
import { tryParsePartial } from "./partial";

const STEP_MS = 30;
const STEPS = 8;

export function isMockMode(): boolean {
  return process.env.MOCK_AI === "1";
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function* replayStructured(data: unknown): AsyncGenerator<StreamEvent> {
  const text = JSON.stringify(data);
  for (let i = 1; i < STEPS; i++) {
    await wait(STEP_MS);
    const partial = tryParsePartial(text.slice(0, Math.floor((text.length * i) / STEPS)));
    if (partial !== undefined) yield { type: "partial", data: partial };
  }
  yield { type: "done", data };
}

export function mockAnalysis(): AsyncGenerator<StreamEvent> {
  return replayStructured(sample.analysis);
}

export function mockRewrite(transform: (rewrite: Rewrite) => Rewrite): AsyncGenerator<StreamEvent> {
  return replayStructured(transform(sample.rewrite));
}

export async function* mockCoverLetter(): AsyncGenerator<StreamEvent> {
  const words = sample.coverLetter.split(/(?<=\s)/);
  for (let i = 0; i < words.length; i += 12) {
    await wait(STEP_MS);
    yield { type: "delta", text: words.slice(i, i + 12).join("") };
  }
  yield { type: "done", data: sample.coverLetter };
}
