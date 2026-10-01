import { describe, expect, it } from "vitest";
import { AnalysisSchema, AnalyzeRequestSchema, LIMITS, ResumeSchema, RewriteRequestSchema } from "@/lib/schemas";

const resume = {
  sections: [{ id: "s0", title: "Experience", bullets: [{ id: "s0-b0", text: "Built dashboards in React." }] }],
};
const job = "Frontend Engineer. Build dashboards in React and TypeScript for clinicians.";

describe("schemas", () => {
  it("accepts a valid analyze request", () => {
    expect(AnalyzeRequestSchema.safeParse({ resume, job }).success).toBe(true);
  });

  it("rejects extra keys", () => {
    expect(AnalyzeRequestSchema.safeParse({ resume, job, extra: 1 }).success).toBe(false);
  });

  it("rejects a job description over the limit", () => {
    const long = "a".repeat(LIMITS.jobChars + 1);
    expect(AnalyzeRequestSchema.safeParse({ resume, job: long }).success).toBe(false);
  });

  it("rejects a resume with no sections", () => {
    expect(ResumeSchema.safeParse({ sections: [] }).success).toBe(false);
  });

  it("rejects a resume over the character limit", () => {
    const big = { sections: [{ id: "s0", title: "X", bullets: [{ id: "b", text: "a".repeat(LIMITS.resumeChars + 1) }] }] };
    expect(ResumeSchema.safeParse(big).success).toBe(false);
  });

  it("rejects a score out of range", () => {
    const analysis = { score: 140, matchedSkills: [], missingSkills: [], keywordGaps: [], seniorityFit: "match", summary: "" };
    expect(AnalysisSchema.safeParse(analysis).success).toBe(false);
  });

  it("rejects ids that are too long", () => {
    const longId = { sections: [{ id: "s0", title: "X", bullets: [{ id: "a".repeat(33), text: "Built it." }] }] };
    expect(AnalyzeRequestSchema.safeParse({ resume: longId, job }).success).toBe(false);
  });

  it("rejects too many sections", () => {
    const sections = Array.from({ length: 31 }, (_, i) => ({ id: `s${i}`, title: "X", bullets: [] }));
    expect(ResumeSchema.safeParse({ sections }).success).toBe(false);
  });

  it("rejects too many bullets in total", () => {
    const sections = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`,
      title: "X",
      bullets: Array.from({ length: 81 }, (_, j) => ({ id: `b${i}-${j}`, text: "a" })),
    }));
    expect(ResumeSchema.safeParse({ sections }).success).toBe(false);
  });

  it("rejects an analysis with too many list items", () => {
    const analysis = {
      score: 50,
      matchedSkills: [],
      missingSkills: Array.from({ length: 51 }, () => "x"),
      keywordGaps: [],
      seniorityFit: "match",
      summary: "ok",
    };
    expect(RewriteRequestSchema.safeParse({ resume, job, analysis }).success).toBe(false);
  });
});
