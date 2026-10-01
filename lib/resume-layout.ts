/** Pure helpers that decide how a resume line is laid out on export. */

export type SectionKind = "summary" | "skills" | "experience" | "other";

export function sectionKind(title: string): SectionKind {
  if (/summary|profile|about|objective/i.test(title)) return "summary";
  if (/skill/i.test(title)) return "skills";
  if (/experience|employment/i.test(title)) return "experience";
  return "other";
}

const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?";
const POINT = `(?:${MONTH}\\s+)?(?:19|20)\\d{2}`;
const END = `(?:${POINT}|Present|Current|Now)`;
const RANGE = `${POINT}(?:(?:\\s*[–—-]\\s*|\\s+to\\s+)${END})?`;
const TRAILING_DATES = new RegExp(`^(.*?)[\\s,|·—–-]*(?:\\(\\s*(${RANGE})\\s*\\)|\\b(${RANGE}))\\s*$`, "i");

/** Split a trailing date range ("Jul 2025 – Present", "(2023 – Present)", "2022") off a line. */
export function splitDates(text: string): { main: string; dates: string } | null {
  const match = TRAILING_DATES.exec(text);
  if (!match) return null;
  const main = match[1].trim();
  const dates = (match[2] ?? match[3]).trim();
  return main ? { main, dates } : null;
}

const LABEL = /^([^:]{1,40}):\s+/;

/** Split a short "Label:" prefix off a line. */
export function splitLabel(text: string): { lead: string; rest: string; sep: string } | null {
  const match = LABEL.exec(text);
  if (!match || match[1].trim().split(/\s+/).length > 5) return null;
  return { lead: `${match[1]}:`, sep: " ", rest: text.slice(match[0].length) };
}

/** The part of a line to bold: before the last " — ", else a short "Label:". */
export function splitLead(text: string): { lead: string; rest: string; sep: string } | null {
  const sep = " — ";
  const at = text.lastIndexOf(sep);
  if (at > 0) return { lead: text.slice(0, at), sep, rest: text.slice(at + sep.length) };
  return splitLabel(text);
}

function looksLikeContact(line: string): boolean {
  return /@|http|linkedin|github/i.test(line) || /\d{7,}/.test(line.replace(/[\s+-]/g, ""));
}

export function headerParts(lines: string[]): { name: string; headline?: string; contacts: string[] } {
  const [name = "", ...rest] = lines;
  if (rest.length > 0 && !looksLikeContact(rest[0])) {
    const [headline, ...contacts] = rest;
    return { name, headline, contacts };
  }
  return { name, contacts: rest };
}
