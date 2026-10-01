import type { z } from "zod";
import { isMockMode } from "@/lib/ai/mock";
import { LIMITS } from "@/lib/schemas";
import { ERROR_MESSAGES, type ErrorCode } from "@/lib/errors";
import { checkRateLimit, clientKey } from "@/lib/ratelimit";

export function errorResponse(code: ErrorCode, status: number, extra?: Record<string, unknown>): Response {
  return Response.json({ ...extra, code, message: ERROR_MESSAGES[code] }, { status });
}

type GuardResult<T> = { ok: true; body: T } | { ok: false; response: Response };

/** Shared checks for every AI route: credentials, body shape, rate limit. */
export async function guardAiRequest<T>(req: Request, schema: z.ZodType<T>): Promise<GuardResult<T>> {
  const mock = isMockMode();
  if (!mock && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return { ok: false, response: errorResponse("no_api_key", 503) };
  }

  if (Number(req.headers.get("content-length")) > LIMITS.requestBytes) {
    return { ok: false, response: errorResponse("bad_request", 413) };
  }

  const parsed = schema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) return { ok: false, response: errorResponse("bad_request", 400) };

  if (!mock) {
    const limit = await checkRateLimit(clientKey(req.headers));
    if (!limit.ok) {
      return {
        ok: false,
        response:
          limit.reason === "limited"
            ? errorResponse("rate_limited", 429, { reset: limit.reset })
            : errorResponse("upstream_busy", 503),
      };
    }
  }
  return { ok: true, body: parsed.data };
}
