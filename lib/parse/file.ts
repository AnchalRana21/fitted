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

const MAX_PDF_PAGES = 20;

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  return magic.every((b, i) => bytes[i] === b);
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new ParseError("too_large", "PDF has more than 20 pages. Paste the text instead.");
  }
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
  if (file.size > LIMITS.fileBytes) throw new ParseError("too_large", "File is larger than 4 MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!startsWith(bytes, kind === "pdf" ? PDF_MAGIC : ZIP_MAGIC)) {
    throw new ParseError("unsupported_type", "This file isn't a valid PDF or DOCX.");
  }
  const text = kind === "pdf" ? await pdfText(bytes) : await docxText(bytes);
  if (text.trim().length < LIMITS.minParsedChars) {
    throw new ParseError("no_text", "No text found in this file. If it's a scanned PDF, paste the text instead.");
  }
  return text;
}
