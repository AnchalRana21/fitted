import { z } from "zod";

export const LIMITS = {
  jobChars: 15_000,
  resumeChars: 30_000,
  fileBytes: 4 * 1024 * 1024,
  minJobChars: 50,
  minParsedChars: 50,
  minResumeChars: 100,
  idChars: 32,
  titleChars: 100,
  maxSections: 30,
  maxBullets: 400,
  listItems: 50,
  itemChars: 200,
  summaryChars: 2000,
  newTextChars: 1000,
  requestBytes: 100 * 1024,
} as const;

export const BulletSchema = z.strictObject({ id: z.string().max(LIMITS.idChars), text: z.string() });

export const SectionSchema = z.strictObject({
  id: z.string().max(LIMITS.idChars),
  title: z.string().max(LIMITS.titleChars),
  bullets: z.array(BulletSchema),
});

export const ResumeSchema = z
  .strictObject({ sections: z.array(SectionSchema).min(1).max(LIMITS.maxSections) })
  .refine(
    (resume) =>
      resume.sections
        .flatMap((s) => [s.id, s.title, ...s.bullets.flatMap((b) => [b.id, b.text])])
        .join("\n").length <= LIMITS.resumeChars,
    "Resume is too long",
  )
  .refine(
    (resume) => resume.sections.reduce((n, s) => n + s.bullets.length, 0) <= LIMITS.maxBullets,
    "Resume has too many bullets",
  );

const ListSchema = z.array(z.string().max(LIMITS.itemChars)).max(LIMITS.listItems);

export const AnalysisSchema = z.strictObject({
  score: z.number().int().min(0).max(100),
  matchedSkills: ListSchema,
  missingSkills: ListSchema,
  keywordGaps: ListSchema,
  seniorityFit: z.enum(["under", "match", "over"]),
  summary: z.string().max(LIMITS.summaryChars),
});

export const SuggestionSchema = z.strictObject({
  bulletId: z.string().max(LIMITS.idChars),
  newText: z.string().max(LIMITS.newTextChars),
  reason: z.string().max(LIMITS.itemChars * 2),
  verify: z.boolean(),
});

export const RewriteSchema = z.strictObject({ suggestions: z.array(SuggestionSchema).max(LIMITS.listItems) });

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
