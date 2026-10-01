import sample from "@/fixtures/sample-run.json";
import { finalizeRewrite } from "@/lib/ai/verify";
import { initialDecisions } from "@/lib/apply";
import { parseSections } from "@/lib/parse/sections";
import { jobTitle } from "@/lib/resume";
import { newRun, type Run } from "@/lib/runs";
import { AnalysisSchema, RewriteSchema } from "@/lib/schemas";

/** A finished run built from the fixture. Costs no API calls. */
export function sampleRun(): Run {
  const resume = parseSections(sample.resumeText);
  const rewrite = finalizeRewrite(RewriteSchema.parse(sample.rewrite), resume);
  return {
    ...newRun(resume, sample.job),
    title: `Sample: ${jobTitle(sample.job)}`,
    analysis: AnalysisSchema.parse(sample.analysis),
    rewrite,
    decisions: initialDecisions(rewrite),
    coverLetter: { tone: "formal", text: sample.coverLetter },
  };
}
