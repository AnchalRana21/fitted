import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as analyze } from "@/app/api/analyze/route";
import { POST as coverLetter } from "@/app/api/cover-letter/route";
import { POST as rewrite } from "@/app/api/rewrite/route";
import type { Analysis, Rewrite } from "@/lib/schemas";
import { decodeEvents, type StreamEvent } from "@/lib/stream/ndjson";

const resume = { sections: [{ id: "s1", title: "Experience", bullets: [{ id: "s1-b0", text: "Built dashboards." }] }] };
const job = "Frontend Engineer. Build dashboards in React and TypeScript for clinicians.";
const analysis: Analysis = {
  score: 72,
  matchedSkills: [],
  missingSkills: [],
  keywordGaps: [],
  seniorityFit: "match",
  summary: "ok",
};

function post(handler: (req: Request) => Promise<Response>, body: unknown) {
  return handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function lastEvent(res: Response): Promise<StreamEvent> {
  const events: StreamEvent[] = [];
  for await (const event of decodeEvents(res.body!)) events.push(event);
  return events[events.length - 1];
}

describe("AI routes (MOCK_AI=1)", () => {
  beforeEach(() => vi.stubEnv("MOCK_AI", "1"));
  afterEach(() => vi.unstubAllEnvs());

  it("analyze streams the sample analysis", async () => {
    const last = await lastEvent(await post(analyze, { resume, job }));
    expect(last.type).toBe("done");
    expect((last as { data: Analysis }).data.score).toBe(72);
  });

  it("rewrite only keeps suggestions for bullets in the request resume", async () => {
    const last = await lastEvent(await post(rewrite, { resume, job, analysis }));
    expect(last.type).toBe("done");
    const suggestions = (last as { data: Rewrite }).data.suggestions;
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].bulletId).toBe("s1-b0");
  });

  it("cover-letter streams a non-empty letter", async () => {
    const last = await lastEvent(await post(coverLetter, { resume, job, tone: "formal" }));
    expect(last.type).toBe("done");
    const data = (last as { data: unknown }).data;
    expect(typeof data).toBe("string");
    expect((data as string).length).toBeGreaterThan(0);
  });

  it("returns 400 for an invalid body", async () => {
    const res = await post(analyze, {});
    expect(res.status).toBe(400);
  });
});
