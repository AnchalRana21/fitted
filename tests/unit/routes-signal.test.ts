import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { structured, text } = vi.hoisted(() => ({
  structured: vi.fn(async function* () {}),
  text: vi.fn(async function* () {}),
}));

vi.mock("@/lib/ai/structured", () => ({ streamStructured: structured }));
vi.mock("@/lib/ai/text", () => ({ streamText: text }));
vi.mock("@/lib/ratelimit", async () => ({
  ...(await vi.importActual<typeof import("@/lib/ratelimit")>("@/lib/ratelimit")),
  checkRateLimit: vi.fn(async () => ({ ok: true })),
}));

import { POST as analyze } from "@/app/api/analyze/route";
import { POST as coverLetter } from "@/app/api/cover-letter/route";

const resume = { sections: [{ id: "s1", title: "Experience", bullets: [{ id: "s1-b0", text: "Built dashboards." }] }] };
const job = "Frontend Engineer. Build dashboards in React and TypeScript for clinicians.";

function request(body: unknown, signal?: AbortSignal) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

describe("AI routes (live mode)", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK_AI", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "x");
    structured.mockClear();
    text.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("analyze passes the request signal to streamStructured", async () => {
    const req = request({ resume, job }, new AbortController().signal);
    await analyze(req);
    expect(structured).toHaveBeenCalledOnce();
    expect((structured.mock.calls[0] as unknown[])[0]).toMatchObject({ signal: req.signal });
    expect(((structured.mock.calls[0] as unknown[])[0] as { signal: AbortSignal }).signal).toBe(req.signal);
  });

  it("cover-letter passes the request signal to streamText", async () => {
    const req = request({ resume, job, tone: "formal" }, new AbortController().signal);
    await coverLetter(req);
    expect(text).toHaveBeenCalledOnce();
    expect(((text.mock.calls[0] as unknown[])[0] as { signal: AbortSignal }).signal).toBe(req.signal);
  });

  it("analyze returns 503 no_api_key without credentials", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    const res = await analyze(request({ resume, job }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("no_api_key");
    expect(structured).not.toHaveBeenCalled();
  });
});
