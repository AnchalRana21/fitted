import { mockAnalysis, isMockMode } from "@/lib/ai/mock";
import { ANALYZE_SYSTEM, analyzeUser } from "@/lib/ai/prompts";
import { streamStructured } from "@/lib/ai/structured";
import { guardAiRequest } from "@/lib/api/guard";
import { AnalysisSchema, AnalyzeRequestSchema } from "@/lib/schemas";
import { toNdjsonResponse } from "@/lib/stream/ndjson";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const guard = await guardAiRequest(req, AnalyzeRequestSchema);
  if (!guard.ok) return guard.response;
  const { resume, job } = guard.body;

  const events = isMockMode()
    ? mockAnalysis()
    : streamStructured({ schema: AnalysisSchema, system: ANALYZE_SYSTEM, user: analyzeUser(resume, job), effort: "medium", signal: req.signal });
  return toNdjsonResponse(events);
}
