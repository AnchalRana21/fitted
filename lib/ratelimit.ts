import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 15 AI calls a day is about 5 full runs with cover letters.
const DAILY_CALLS = 15;
// Caps total daily spend on the public demo. The Anthropic Console spend limit is the final backstop.
const GLOBAL_DAILY_CALLS = 150;
const GLOBAL_KEY = "global";
// Upstash treats a timeout as allowed (fail open on slowness), while thrown errors fail closed below.
const TIMEOUT_MS = 3000;

type Limiters = { perClient: Ratelimit; global: Ratelimit };

let limiters: Limiters | null | undefined;

function getLimiters(): Limiters | null {
  if (limiters !== undefined) return limiters;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiters = null;
    return limiters;
  }
  const redis = new Redis({ url, token });
  limiters = {
    perClient: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DAILY_CALLS, "24 h"),
      prefix: "fitted",
      timeout: TIMEOUT_MS,
    }),
    global: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(GLOBAL_DAILY_CALLS, "24 h"),
      prefix: "fitted:global",
      timeout: TIMEOUT_MS,
    }),
  };
  return limiters;
}

/** Assumes Vercel's edge sets x-real-ip / x-forwarded-for; elsewhere these headers can be spoofed. */
export function clientKey(headers: Headers): string {
  const ip = headers.get("x-real-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${ip || "anonymous"}`;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "limited"; reset: number }
  | { ok: false; reason: "unavailable" };

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const active = getLimiters();
  if (!active) return { ok: true };
  try {
    const perClient = await active.perClient.limit(key);
    if (!perClient.success) return { ok: false, reason: "limited", reset: perClient.reset };
    const global = await active.global.limit(GLOBAL_KEY);
    if (!global.success) return { ok: false, reason: "limited", reset: global.reset };
    return { ok: true };
  } catch (error) {
    console.error("Rate limiter unavailable", error);
    return { ok: false, reason: "unavailable" };
  }
}
