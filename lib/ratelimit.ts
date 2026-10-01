import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 15 AI calls a day is about 5 full runs with cover letters.
const DAILY_CALLS = 15;

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  limiter =
    url && token
      ? new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(DAILY_CALLS, "24 h"),
          prefix: "fitted",
        })
      : null;
  return limiter;
}

export function clientKey(headers: Headers): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${ip || "anonymous"}`;
}

export async function checkRateLimit(key: string): Promise<{ ok: true } | { ok: false; reset: number }> {
  const active = getLimiter();
  if (!active) return { ok: true };
  const result = await active.limit(key);
  return result.success ? { ok: true } : { ok: false, reset: result.reset };
}
