import { describe, expect, it } from "vitest";
import { headerParts, sectionKind, splitDates, splitLead } from "@/lib/resume-layout";

describe("sectionKind", () => {
  it("classifies section titles", () => {
    expect(sectionKind("Summary")).toBe("summary");
    expect(sectionKind("Professional Summary")).toBe("summary");
    expect(sectionKind("PROFILE")).toBe("summary");
    expect(sectionKind("About")).toBe("summary");
    expect(sectionKind("Objective")).toBe("summary");
    expect(sectionKind("Technical Skills")).toBe("skills");
    expect(sectionKind("Professional Experience")).toBe("experience");
    expect(sectionKind("Employment History")).toBe("experience");
    expect(sectionKind("Projects")).toBe("other");
    expect(sectionKind("Education")).toBe("other");
    expect(sectionKind("Resume")).toBe("other");
  });
});

describe("splitDates", () => {
  it("splits a trailing month-year range", () => {
    expect(splitDates("Globex — Remote | Frontend Engineer Jul 2025 – Present")).toEqual({
      main: "Globex — Remote | Frontend Engineer",
      dates: "Jul 2025 – Present",
    });
  });

  it("splits a parenthesised range", () => {
    expect(splitDates("Frontend Developer, Acme Analytics (2023 – Present)")).toEqual({
      main: "Frontend Developer, Acme Analytics",
      dates: "2023 – Present",
    });
  });

  it("trims separators before the range", () => {
    expect(splitDates("Engineer, Globex | Mar 2021 - Dec 2022")).toEqual({
      main: "Engineer, Globex",
      dates: "Mar 2021 - Dec 2022",
    });
    expect(splitDates("Engineer, Globex · 2019 to 2021")).toEqual({ main: "Engineer, Globex", dates: "2019 to 2021" });
    expect(splitDates("Engineer — Sept. 2020 — Current")).toEqual({ main: "Engineer", dates: "Sept. 2020 — Current" });
    expect(splitDates("Intern, Initech, January 2020 – March 2020")).toEqual({
      main: "Intern, Initech",
      dates: "January 2020 – March 2020",
    });
  });

  it("accepts a single trailing year or month-year", () => {
    expect(splitDates("Intern, Initech Jun 2024")).toEqual({ main: "Intern, Initech", dates: "Jun 2024" });
    expect(splitDates("B.Tech Computer Science, 2022")).toEqual({ main: "B.Tech Computer Science", dates: "2022" });
  });

  it("returns null without a trailing date", () => {
    expect(splitDates("Built dashboards in React.")).toBeNull();
    expect(splitDates("Master of Science, 2021–2023 — State University")).toBeNull();
    expect(splitDates("Summary 20245")).toBeNull();
    expect(splitDates("2024")).toBeNull();
  });
});

describe("splitLead", () => {
  it("bolds a short label", () => {
    expect(splitLead("Frontend: React, Next.js")).toEqual({ lead: "Frontend:", sep: " ", rest: "React, Next.js" });
  });

  it("splits at the last spaced em dash", () => {
    expect(splitLead("Master of Science (MSc), 2021–2023 — State University, Springfield, USA")).toEqual({
      lead: "Master of Science (MSc), 2021–2023",
      sep: " — ",
      rest: "State University, Springfield, USA",
    });
    expect(splitLead("Acme Academy — Web Development — Responsive site building")).toEqual({
      lead: "Acme Academy — Web Development",
      sep: " — ",
      rest: "Responsive site building",
    });
  });

  it("reconstructs the original text", () => {
    for (const text of ["Testing & tooling: Playwright, Git", "Weather app — Next.js and a public API"]) {
      const parts = splitLead(text);
      expect(parts && parts.lead + parts.sep + parts.rest).toBe(text);
    }
  });

  it("returns null for plain lines, long labels and URLs", () => {
    expect(splitLead("Built dashboards in React.")).toBeNull();
    expect(splitLead("One two three four five six: too many words")).toBeNull();
    expect(splitLead("https://example.com/portfolio")).toBeNull();
    expect(splitLead("Built a dashboard—fast")).toBeNull();
  });
});

describe("headerParts", () => {
  it("splits name, headline and contacts", () => {
    expect(
      headerParts(["Alex Morgan", "Frontend Engineer — React · TypeScript", "Pune, India · alex@example.com · +1 555 010 0199", "example.com/in/alex"]),
    ).toEqual({
      name: "Alex Morgan",
      headline: "Frontend Engineer — React · TypeScript",
      contacts: ["Pune, India · alex@example.com · +1 555 010 0199", "example.com/in/alex"],
    });
  });

  it("treats contact-like second lines as contacts", () => {
    for (const line of ["alex@example.com", "https://alex.dev", "linkedin.com/in/alex", "github.com/alex", "+1 555-010-0199"]) {
      expect(headerParts(["Alex Morgan", line])).toEqual({ name: "Alex Morgan", contacts: [line] });
    }
  });

  it("handles short headers", () => {
    expect(headerParts(["Alex Morgan"])).toEqual({ name: "Alex Morgan", contacts: [] });
    expect(headerParts([])).toEqual({ name: "", contacts: [] });
  });
});
