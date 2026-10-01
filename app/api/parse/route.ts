import { extractFileText, ParseError } from "@/lib/parse/file";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
