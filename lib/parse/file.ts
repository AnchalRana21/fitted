import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { LIMITS } from "@/lib/schemas";
import { detectKind } from "./kind";

export type ParseErrorCode = "unsupported_type" | "too_large" | "no_text";

export class ParseError extends Error {
  constructor(
    public code: ParseErrorCode,
    message: string,
  ) {
    super(message);
  }
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function docxText(bytes: Uint8Array): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

export async function extractFileText(file: File): Promise<string> {
  const kind = detectKind(file.name, file.type);
  if (!kind) throw new ParseError("unsupported_type", "Upload a PDF or DOCX file.");
  if (file.size > LIMITS.fileBytes) throw new ParseError("too_large", "File is larger than 5 MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = kind === "pdf" ? await pdfText(bytes) : await docxText(bytes);
  if (text.trim().length < LIMITS.minJobChars) {
    throw new ParseError("no_text", "No text found in this file. If it's a scanned PDF, paste the text instead.");
  }
  return text;
}
