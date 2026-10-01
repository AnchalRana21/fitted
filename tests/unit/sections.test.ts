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

describe("parseSections edge cases", () => {
  const texts = (input: string) =>
    parseSections(input).sections.flatMap((s) => s.bullets.map((b) => b.text));

  it("only treats dash and star as bullet markers before whitespace", () => {
    expect(texts("-5% latency")).toEqual(["-5% latency"]);
    expect(texts("- Worked")).toEqual(["Worked"]);
    expect(texts("•Built")).toEqual(["Built"]);
  });

  it("drops lone dash and star lines", () => {
    expect(texts("Name\n-\nReal")).toEqual(["Name", "Real"]);
    expect(texts("Name\n*\nReal")).toEqual(["Name", "Real"]);
  });

  it("handles CRLF line endings", () => {
    expect(texts("Line one\r\nLine two")).toEqual(["Line one", "Line two"]);
  });

  it("produces no bullet for a marker-only line", () => {
    expect(texts("Name\n•\nReal line")).toEqual(["Name", "Real line"]);
  });

  it("treats a heading with trailing colon and spaces as a heading", () => {
    const resume = parseSections("Name\nEXPERIENCE:  \nDid things");
    expect(resume.sections.map((s) => s.title)).toEqual(["Header", "Experience"]);
  });
});

describe("isHeading", () => {
  it("matches common headings in any case, with or without a colon", () => {
    expect(isHeading("WORK EXPERIENCE")).toBe(true);
    expect(isHeading("Technical Skills:")).toBe(true);
    expect(isHeading("Built a skills matrix")).toBe(false);
    expect(isHeading("Work  Experience")).toBe(true);
  });
});

describe("parseSections rejoins wrapped lines", () => {
  const bullets = (input: string, section = 1) =>
    parseSections(input).sections[section].bullets.map((b) => b.text);

  it("joins a lowercase continuation and keeps a new sentence separate", () => {
    const resume = parseSections(
      "Alex Morgan\nSUMMARY\nFrontend developer building React apps. Own features\nend to end with tests.\nDegree in computer science.",
    );
    expect(resume.sections[1].bullets).toEqual([
      { id: "s1-b0", text: "Frontend developer building React apps. Own features end to end with tests." },
      { id: "s1-b1", text: "Degree in computer science." },
    ]);
  });

  it("joins a wrapped bullet", () => {
    expect(bullets("Alex Morgan\nEXPERIENCE\n• Built dashboards used by teams across the\ncompany every day.\n• Wrote tests.")).toEqual([
      "Built dashboards used by teams across the company every day.",
      "Wrote tests.",
    ]);
  });

  it("joins after a trailing comma or a short function word", () => {
    expect(bullets("Alex Morgan\nSKILLS\nFrontend: React, Next.js,\nTypeScript\nTesting: Jest")).toEqual([
      "Frontend: React, Next.js, TypeScript",
      "Testing: Jest",
    ]);
    expect(bullets("Alex Morgan\nPROJECTS\nWeather app built with\nNext.js and a public API.")).toEqual([
      "Weather app built with Next.js and a public API.",
    ]);
  });

  it("keeps a hyphen when a word was split", () => {
    expect(bullets("Alex Morgan\nEXPERIENCE\n• Handle work across a multi-\ncontributor repository.")).toEqual([
      "Handle work across a multi-contributor repository.",
    ]);
  });

  it("keeps separate lines separate", () => {
    expect(bullets("Alex Morgan\nEDUCATION\nMaster of X, 2021–2023 — Uni, City, India\nCoursework: A, B")).toEqual([
      "Master of X, 2021–2023 — Uni, City, India",
      "Coursework: A, B",
    ]);
    expect(bullets("Alex Morgan\nEXPERIENCE\nEngineer, Acme (2021 – 2023) and\n• Built things.")).toEqual([
      "Engineer, Acme (2021 – 2023) and",
      "Built things.",
    ]);
    expect(bullets("Alex Morgan\nEXPERIENCE\nEngineer, Acme (2021 – 2023)\nbuilding things")).toEqual([
      "Engineer, Acme (2021 – 2023)",
      "building things",
    ]);
  });

  it("never joins header lines", () => {
    expect(bullets("Alex Morgan,\nalex@example.com\nSUMMARY\nHi.", 0)).toEqual(["Alex Morgan,", "alex@example.com"]);
  });

  it("keeps ids sequential after joining", () => {
    const resume = parseSections("Alex Morgan\nSKILLS\nReact,\nNext.js\nJest\nGit");
    expect(resume.sections[1].bullets.map((b) => b.id)).toEqual(["s1-b0", "s1-b1", "s1-b2"]);
  });
});
