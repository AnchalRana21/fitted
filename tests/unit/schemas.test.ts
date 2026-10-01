import { describe, expect, it } from "vitest";
import { AnalysisSchema, AnalyzeRequestSchema, LIMITS, ResumeSchema } from "@/lib/schemas";

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
});
