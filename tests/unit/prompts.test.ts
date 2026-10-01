import { describe, expect, it } from "vitest";
import { analyzeUser, coverLetterSystem, REWRITE_SYSTEM, rewriteUser } from "@/lib/ai/prompts";
import type { Analysis, Resume } from "@/lib/schemas";

const resume: Resume = {
  sections: [{ id: "s0", title: "Experience", bullets: [{ id: "s0-b0", text: "Built dashboards." }] }],
};
const analysis: Analysis = {
  score: 60,
  matchedSkills: ["React"],
  missingSkills: ["GraphQL"],
  keywordGaps: [],
  seniorityFit: "match",
  summary: "",
};

describe("prompts", () => {
  it("wraps resume and job in tags with bullet ids", () => {
    const text = analyzeUser(resume, "Job text");
    expect(text).toContain("<resume>\n## Experience\n[s0-b0] Built dashboards.\n</resume>");
    expect(text).toContain("<job_description>\nJob text\n</job_description>");
  });

  it("adds the analysis gaps to the rewrite prompt", () => {
    const text = rewriteUser(resume, "Job text", analysis);
    expect(text).toContain("Missing skills: GraphQL");
    expect(text).toContain("Keyword gaps: none");
  });

  it("states the honesty rules", () => {
    expect(REWRITE_SYSTEM).toContain("Never invent");
    expect(coverLetterSystem("concise")).toContain("under 200 words");
  });
});
