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

export function resumeToMarkdown(resume: Resume): string {
  const blocks = resume.sections.map((s) => {
    if (s.title === "Header") {
      const [name = "", ...rest] = s.bullets.map((b) => b.text);
      return [`# ${name}`, ...rest].join("\n");
    }
    const lines = s.bullets.map((b) => (isRoleLine(b.text) ? `**${b.text}**` : `- ${b.text}`));
    return `## ${s.title}\n\n${lines.join("\n")}`;
  });
  return `${blocks.join("\n\n")}\n`;
}

export function resumeFileName(resume: Resume): string {
  const header = resume.sections.find((s) => s.title === "Header");
  const slug = (header?.bullets[0]?.text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "tailored"}-resume.pdf`;
}

export function jobTitle(job: string): string {
  const line = job.split("\n").map((l) => l.trim()).find(Boolean) ?? "Untitled job";
  return line.length > 60 ? `${line.slice(0, 59)}…` : line;
}
