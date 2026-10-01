import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ratelimit", async () => ({
  ...(await vi.importActual<typeof import("@/lib/ratelimit")>("@/lib/ratelimit")),
  checkRateLimit: vi.fn(),
}));

import { guardAiRequest } from "@/lib/api/guard";
import { checkRateLimit } from "@/lib/ratelimit";
import { AnalyzeRequestSchema } from "@/lib/schemas";

const body = {
  resume: { sections: [{ id: "s0", title: "Experience", bullets: [{ id: "s0-b0", text: "Built dashboards." }] }] },
  job: "Frontend Engineer. Build dashboards in React and TypeScript for clinicians.",
};

function request(raw: string) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw,
  });
}

const check = vi.mocked(checkRateLimit);

beforeEach(() => {
  check.mockReset();
  vi.stubEnv("MOCK_AI", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("guardAiRequest limits", () => {
  it("returns 429 with reset when limited", async () => {
    check.mockResolvedValue({ ok: false, reason: "limited", reset: 123 });
    const result = await guardAiRequest(request(JSON.stringify(body)), AnalyzeRequestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
      expect(await result.response.json()).toMatchObject({ code: "rate_limited", reset: 123 });
    }
  });

  it("returns 503 upstream_busy when the limiter is unavailable", async () => {
    check.mockResolvedValue({ ok: false, reason: "unavailable" });
    const result = await guardAiRequest(request(JSON.stringify(body)), AnalyzeRequestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
      expect(await result.response.json()).toMatchObject({ code: "upstream_busy" });
    }
  });

  it("never calls the limiter in mock mode", async () => {
    vi.stubEnv("MOCK_AI", "1");
    const result = await guardAiRequest(request(JSON.stringify(body)), AnalyzeRequestSchema);
    expect(result.ok).toBe(true);
    expect(check).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const result = await guardAiRequest(request("not json"), AnalyzeRequestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
    expect(check).not.toHaveBeenCalled();
  });
});
