import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-run.json";
import { mockAnalysis, mockCoverLetter, mockRewrite } from "@/lib/ai/mock";
import { parseSections } from "@/lib/parse/sections";
import { sampleRun } from "@/lib/sample";
import { AnalysisSchema, RewriteSchema } from "@/lib/schemas";
import type { StreamEvent } from "@/lib/stream/ndjson";

async function collect(gen: AsyncIterable<StreamEvent>) {
  const out: StreamEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}

describe("sample fixture", () => {
  it("only references bullet ids the parser produces", () => {
    const ids = new Set(parseSections(sample.resumeText).sections.flatMap((s) => s.bullets.map((b) => b.id)));
    for (const s of sample.rewrite.suggestions) expect(ids.has(s.bulletId)).toBe(true);
  });

  it("matches the schemas", () => {
    expect(AnalysisSchema.safeParse(sample.analysis).success).toBe(true);
    expect(RewriteSchema.safeParse(sample.rewrite).success).toBe(true);
  });

  it("builds a complete run with exactly one flagged suggestion", () => {
    const run = sampleRun();
    expect(run.analysis?.score).toBe(72);
    expect(run.rewrite?.suggestions).toHaveLength(5);
    expect(run.rewrite?.suggestions.filter((s) => s.verify)).toHaveLength(1);
    expect(Object.values(run.decisions).every((d) => d.status === "pending")).toBe(true);
    expect(run.title).toBe("Sample: Frontend Engineer — Brightline Health");
  });
});

describe("mock mode", () => {
  it("streams partial analysis then the full fixture", async () => {
    const events = await collect(mockAnalysis());
    expect(events.some((e) => e.type === "partial")).toBe(true);
    expect(events.at(-1)).toEqual({ type: "done", data: sample.analysis });
  });

  it("applies the transform to the rewrite", async () => {
    const events = await collect(mockRewrite((r) => ({ suggestions: r.suggestions.slice(0, 1) })));
    expect(events.at(-1)).toMatchObject({ type: "done", data: { suggestions: [{ bulletId: "s1-b0" }] } });
  });

  it("streams the cover letter as deltas", async () => {
    const events = await collect(mockCoverLetter());
    const text = events.filter((e) => e.type === "delta").map((e) => (e.type === "delta" ? e.text : "")).join("");
    expect(text).toBe(sample.coverLetter);
  });
});
