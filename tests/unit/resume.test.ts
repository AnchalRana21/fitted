import { describe, expect, it } from "vitest";
import {
  isRoleLine,
  jobTitle,
  resumeFileName,
  resumeToMarkdown,
  resumeToPlainText,
  resumeToPromptText,
} from "@/lib/resume";
import type { Resume } from "@/lib/schemas";

const resume: Resume = {
  sections: [
    { id: "s0", title: "Header", bullets: [{ id: "s0-b0", text: "Alex Morgan" }, { id: "s0-b1", text: "alex@example.com" }] },
    {
      id: "s1",
      title: "Experience",
      bullets: [
        { id: "s1-b0", text: "Frontend Developer, Acme (2023 – Present)" },
        { id: "s1-b1", text: "Built dashboards in React." },
      ],
    },
  ],
};

describe("resume helpers", () => {
  it("tags every line with its id for prompts", () => {
    expect(resumeToPromptText(resume)).toBe(
      "## Header\n[s0-b0] Alex Morgan\n[s0-b1] alex@example.com\n\n## Experience\n[s1-b0] Frontend Developer, Acme (2023 – Present)\n[s1-b1] Built dashboards in React.",
    );
  });

  it("renders plain text", () => {
    expect(resumeToPlainText(resume)).toContain("Experience\nFrontend Developer");
  });

  it("renders markdown with the name as the title and role lines in bold", () => {
    expect(resumeToMarkdown(resume)).toBe(
      "# Alex Morgan\nalex@example.com\n\n## Experience\n\n**Frontend Developer, Acme (2023 – Present)**\n- Built dashboards in React.\n",
    );
  });

  it("detects role lines by a year", () => {
    expect(isRoleLine("Frontend Developer, Acme (2023 – Present)")).toBe(true);
    expect(isRoleLine("Built dashboards in React.")).toBe(false);
  });

  it("builds a file name from the name line", () => {
    expect(resumeFileName(resume)).toBe("alex-morgan-resume.pdf");
    expect(resumeFileName({ sections: [{ id: "s0", title: "Resume", bullets: [] }] })).toBe("tailored-resume.pdf");
  });

  it("uses the first non-empty job line as the title, capped at 60 characters", () => {
    expect(jobTitle("\n  Frontend Engineer — Brightline\nMore")).toBe("Frontend Engineer — Brightline");
    expect(jobTitle("x".repeat(80))).toBe(`${"x".repeat(59)}…`);
  });
});
