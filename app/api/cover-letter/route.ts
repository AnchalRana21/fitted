import { isMockMode, mockCoverLetter } from "@/lib/ai/mock";
import { coverLetterSystem, coverLetterUser } from "@/lib/ai/prompts";
import { streamText } from "@/lib/ai/text";
import { guardAiRequest } from "@/lib/api/guard";
import { CoverLetterRequestSchema } from "@/lib/schemas";
import { toNdjsonResponse } from "@/lib/stream/ndjson";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const guard = await guardAiRequest(req, CoverLetterRequestSchema);
  if (!guard.ok) return guard.response;
  const { resume, job, tone } = guard.body;

  const events = isMockMode()
    ? mockCoverLetter()
    : streamText({ system: coverLetterSystem(tone), user: coverLetterUser(resume, job), effort: "low", signal: req.signal });
  return toNdjsonResponse(events);
}
