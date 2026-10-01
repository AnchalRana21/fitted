export type FileKind = "pdf" | "docx";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const ACCEPTED_FILES = `.pdf,.docx,${PDF},${DOCX}`;

export function detectKind(name: string, type: string): FileKind | null {
  const lower = name.toLowerCase();
  if (type === PDF || lower.endsWith(".pdf")) return "pdf";
  if (type === DOCX || lower.endsWith(".docx")) return "docx";
  return null;
}
