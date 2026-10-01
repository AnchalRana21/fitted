import { z } from "zod";

export const LIMITS = {
  jobChars: 15_000,
  resumeChars: 30_000,
  fileBytes: 5 * 1024 * 1024,
  minJobChars: 50,
  minResumeChars: 100,
} as const;

export const BulletSchema = z.strictObject({ id: z.string(), text: z.string() });

export const SectionSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  bullets: z.array(BulletSchema),
});

export const ResumeSchema = z
  .strictObject({ sections: z.array(SectionSchema).min(1) })
  .refine(
    (resume) =>
      resume.sections.flatMap((s) => [s.title, ...s.bullets.map((b) => b.text)]).join("\n").length <=
      LIMITS.resumeChars,
    "Resume is too long",
  );

export const AnalysisSchema = z.strictObject({
  score: z.number().int().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  keywordGaps: z.array(z.string()),
  seniorityFit: z.enum(["under", "match", "over"]),
  summary: z.string(),
});

export const SuggestionSchema = z.strictObject({
  bulletId: z.string(),
  newText: z.string(),
  reason: z.string(),
  verify: z.boolean(),
});

export const RewriteSchema = z.strictObject({ suggestions: z.array(SuggestionSchema) });

export const ToneSchema = z.enum(["formal", "friendly", "concise"]);

export const JobSchema = z.string().trim().min(LIMITS.minJobChars).max(LIMITS.jobChars);

export const AnalyzeRequestSchema = z.strictObject({ resume: ResumeSchema, job: JobSchema });
export const RewriteRequestSchema = AnalyzeRequestSchema.extend({ analysis: AnalysisSchema });
export const CoverLetterRequestSchema = AnalyzeRequestSchema.extend({ tone: ToneSchema });

export type Bullet = z.infer<typeof BulletSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Rewrite = z.infer<typeof RewriteSchema>;
export type Tone = z.infer<typeof ToneSchema>;
