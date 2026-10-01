import { isRoleLine } from "@/lib/resume";
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

const BULLET_MARK = /^(?:[•▪◦●·]\s*|[-–*](?:\s+|$))/;

function normalize(line: string): string {
  return line.toLowerCase().replace(/[:\s]+$/, "").replace(/\s+/g, " ").trim();
}

export function isHeading(line: string): boolean {
  return HEADINGS.has(normalize(line));
}

function toTitle(line: string): string {
  const clean = line.replace(/[:\s]+$/, "").trim();
  if (clean !== clean.toUpperCase()) return clean;
  return clean.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const JOIN_WORDS = new Set(["and", "or", "of", "to", "the", "a", "an", "with", "for", "in", "on", "by", "from", "as", "at", "into", "than"]);

/** Whether `line` (which had no bullet marker) continues `prev`, wrapped by PDF text extraction. */
function continues(prev: string, line: string): boolean {
  if (isRoleLine(prev)) return false;
  if (/^\p{Ll}/u.test(line)) return true;
  if (/[,;\-—(/]$/.test(prev)) return true;
  const lastWord = prev.split(/\s+/).at(-1)?.toLowerCase() ?? "";
  return JOIN_WORDS.has(lastWord);
}

function join(prev: string, line: string): string {
  return /\p{L}-$/u.test(prev) ? `${prev}${line}` : `${prev} ${line}`;
}

/** Split resume text into sections. One non-empty line becomes one bullet, unless it continues a wrapped line. */
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
    const section = raw[raw.length - 1];
    const marked = BULLET_MARK.test(line);
    const content = line.replace(BULLET_MARK, "").trim();
    if (!content) continue;
    const prev = section.lines.at(-1);
    if (!marked && section.title !== "Header" && prev !== undefined && continues(prev, content)) {
      section.lines[section.lines.length - 1] = join(prev, content);
    } else {
      section.lines.push(content);
    }
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
