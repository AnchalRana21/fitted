import { afterEach, describe, expect, it, vi } from "vitest";
import { guardAiRequest } from "@/lib/api/guard";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";
import { AnalyzeRequestSchema } from "@/lib/schemas";

const body = {
  resume: { sections: [{ id: "s0", title: "Experience", bullets: [{ id: "s0-b0", text: "Built dashboards." }] }] },
  job: "Frontend Engineer. Build dashboards in React and TypeScript for clinicians.",
};

function request(json: unknown) {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    body: JSON.stringify(json),
  });
}

afterEach(() => vi.unstubAllEnvs());

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("ip:1.2.3.4");
    expect(clientKey(new Headers())).toBe("ip:anonymous");
  });
});

describe("checkRateLimit", () => {
  it("allows everything when Upstash is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    expect(await checkRateLimit("ip:1.2.3.4")).toEqual({ ok: true });
  });
});

describe("guardAiRequest", () => {
  it("returns 503 when no API key is set and mock mode is off", async () => {
    vi.stubEnv("MOCK_AI", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    const result = await guardAiRequest(request(body), AnalyzeRequestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
      expect(await result.response.json()).toMatchObject({ code: "no_api_key" });
    }
  });

  it("returns 400 for an invalid body", async () => {
    vi.stubEnv("MOCK_AI", "1");
    const result = await guardAiRequest(request({ job: "short" }), AnalyzeRequestSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("passes a valid body through", async () => {
    vi.stubEnv("MOCK_AI", "1");
    const result = await guardAiRequest(request(body), AnalyzeRequestSchema);
    expect(result).toEqual({ ok: true, body });
  });
});
