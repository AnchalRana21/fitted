import { extractFileText, ParseError } from "@/lib/parse/file";
import { LIMITS } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length")) > LIMITS.fileBytes + 64 * 1024) {
    return Response.json({ code: "too_large", message: "File is larger than 4 MB." }, { status: 413 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ code: "bad_request", message: "Attach a file in the 'file' field." }, { status: 400 });
  }
  try {
    return Response.json({ text: await extractFileText(file) });
  } catch (error) {
    if (error instanceof ParseError) {
      return Response.json({ code: error.code, message: error.message }, { status: 422 });
    }
    console.error(error);
    return Response.json({ code: "parse_failed", message: "Couldn't read this file. Paste the text instead." }, { status: 422 });
  }
}
