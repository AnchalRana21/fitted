import { headerParts, sectionKind, splitDates, splitLabel, splitLead } from "@/lib/resume-layout";
import type { Resume } from "@/lib/schemas";

export function resumeToPromptText(resume: Resume): string {
  return resume.sections
    .map((s) => [`## ${s.title}`, ...s.bullets.map((b) => `[${b.id}] ${b.text}`)].join("\n"))
    .join("\n\n");
}

export function resumeToPlainText(resume: Resume): string {
  return resume.sections.map((s) => [s.title, ...s.bullets.map((b) => b.text)].join("\n")).join("\n\n");
}

/** A line naming a role or degree: short and containing a year. */
export function isRoleLine(text: string): boolean {
  return text.length < 120 && /\b(19|20)\d{2}\b/.test(text);
}

function boldLead(text: string, parts: { lead: string; sep: string; rest: string } | null): string {
  return parts ? `**${parts.lead}**${parts.sep}${parts.rest}` : text;
}

function sectionMarkdown(title: string, lines: string[]): string {
  const kind = sectionKind(title);
  if (kind === "summary") return lines.join(" ");
  if (kind === "skills") return lines.map((t) => boldLead(t, splitLabel(t))).join("\n\n");
  if (kind === "other") return lines.map((t) => boldLead(t, splitLead(t))).join("\n\n");
  let out = "";
  for (const text of lines) {
    if (isRoleLine(text)) {
      const parts = splitDates(text);
      out += `${out ? "\n\n" : ""}${parts ? `**${parts.main}** — ${parts.dates}` : `**${text}**`}`;
    } else {
      out += `${out ? "\n" : ""}- ${text}`;
    }
  }
  return out;
}

export function resumeToMarkdown(resume: Resume): string {
  const blocks = resume.sections.map((s) => {
    const lines = s.bullets.map((b) => b.text);
    if (s.title === "Header") {
      const { name, headline, contacts } = headerParts(lines);
      return [...(name ? [`# ${name}`] : []), ...(headline ? [headline] : []), ...contacts].join("\n");
    }
    return `## ${s.title}\n\n${sectionMarkdown(s.title, lines)}`;
  });
  return `${blocks.filter(Boolean).join("\n\n")}\n`;
}

export function resumeFileName(resume: Resume): string {
  const header = resume.sections.find((s) => s.title === "Header");
  const slug = (header?.bullets[0]?.text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "tailored"}-resume.pdf`;
}

export function jobTitle(job: string): string {
  const line = job.split("\n").map((l) => l.trim()).find(Boolean) ?? "Untitled job";
  return line.length > 60 ? `${line.slice(0, 59)}…` : line;
}
