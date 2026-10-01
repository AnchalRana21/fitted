import { describe, expect, it } from "vitest";
import { isHeading, parseSections } from "@/lib/parse/sections";

const TEXT = `Alex Morgan
alex.morgan@example.com · Pune, India
SUMMARY
Frontend developer with 3 years of experience building React apps.
EXPERIENCE
Frontend Developer, Acme Analytics (2023 – Present)
• Built dashboards in React used by 40 internal teams.

- Worked on the design system and fixed bugs.
Skills:
React, Next.js`;

describe("parseSections", () => {
  it("splits text into header and titled sections with stable ids", () => {
    const resume = parseSections(TEXT);
    expect(resume.sections.map((s) => [s.id, s.title])).toEqual([
      ["s0", "Header"],
      ["s1", "Summary"],
      ["s2", "Experience"],
      ["s3", "Skills"],
    ]);
    expect(resume.sections[2].bullets).toEqual([
      { id: "s2-b0", text: "Frontend Developer, Acme Analytics (2023 – Present)" },
      { id: "s2-b1", text: "Built dashboards in React used by 40 internal teams." },
      { id: "s2-b2", text: "Worked on the design system and fixed bugs." },
    ]);
  });

  it("uses one Resume section when there are no headings", () => {
    const resume = parseSections("Line one\nLine two");
    expect(resume.sections).toHaveLength(1);
    expect(resume.sections[0].title).toBe("Resume");
    expect(resume.sections[0].bullets).toHaveLength(2);
  });

  it("drops headings with no lines under them", () => {
    const resume = parseSections("Name\nPROJECTS\nEDUCATION\nB.Tech, 2022");
    expect(resume.sections.map((s) => s.title)).toEqual(["Header", "Education"]);
    expect(resume.sections[1].id).toBe("s1");
  });

  it("returns no sections for empty text", () => {
    expect(parseSections("  \n ").sections).toEqual([]);
  });
});

describe("isHeading", () => {
  it("matches common headings in any case, with or without a colon", () => {
    expect(isHeading("WORK EXPERIENCE")).toBe(true);
    expect(isHeading("Technical Skills:")).toBe(true);
    expect(isHeading("Built a skills matrix")).toBe(false);
  });
});
