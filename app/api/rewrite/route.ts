import { isMockMode, mockRewrite } from "@/lib/ai/mock";
import { REWRITE_SYSTEM, rewriteUser } from "@/lib/ai/prompts";
import { streamStructured } from "@/lib/ai/structured";
import { finalizeRewrite } from "@/lib/ai/verify";
import { guardAiRequest } from "@/lib/api/guard";
import { RewriteRequestSchema, RewriteSchema, type Rewrite } from "@/lib/schemas";
import { toNdjsonResponse } from "@/lib/stream/ndjson";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const guard = await guardAiRequest(req, RewriteRequestSchema);
  if (!guard.ok) return guard.response;
  const { resume, job, analysis } = guard.body;
  const transform = (rewrite: Rewrite) => finalizeRewrite(rewrite, resume);

  const events = isMockMode()
    ? mockRewrite(transform)
    : streamStructured({
        schema: RewriteSchema,
        system: REWRITE_SYSTEM,
        user: rewriteUser(resume, job, analysis),
        effort: "medium",
        transform,
        signal: req.signal,
      });
  return toNdjsonResponse(events);
}
