import type { Resume } from "@/lib/schemas";

const HEADINGS = new Set([
  "summary",
  "profile",
  "professional summary",
  "about",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "employment history",
  "projects",
  "personal projects",
  "skills",
  "technical skills",
  "education",
  "certifications",
  "achievements",
  "awards",
  "publications",
  "volunteering",
  "languages",
  "interests",
]);

const BULLET_MARK = /^[-•*▪◦●–·]\s*/;

function normalize(line: string): string {
  return line.toLowerCase().replace(/[:\s]+$/, "").trim();
}

export function isHeading(line: string): boolean {
  return HEADINGS.has(normalize(line));
}

function toTitle(line: string): string {
  const clean = line.replace(/[:\s]+$/, "").trim();
  if (clean !== clean.toUpperCase()) return clean;
  return clean.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Split resume text into sections. One non-empty line becomes one bullet. */
export function parseSections(text: string): Resume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const raw: { title: string; lines: string[] }[] = [];
  let sawHeading = false;

  for (const line of lines) {
    if (isHeading(line)) {
      sawHeading = true;
      raw.push({ title: toTitle(line), lines: [] });
      continue;
    }
    if (raw.length === 0) raw.push({ title: "Header", lines: [] });
    const content = line.replace(BULLET_MARK, "").trim();
    if (content) raw[raw.length - 1].lines.push(content);
  }

  if (!sawHeading && raw.length === 1) raw[0].title = "Resume";

  return {
    sections: raw
      .filter((section) => section.lines.length > 0)
      .map((section, i) => ({
        id: `s${i}`,
        title: section.title,
        bullets: section.lines.map((text, j) => ({ id: `s${i}-b${j}`, text })),
      })),
  };
}
