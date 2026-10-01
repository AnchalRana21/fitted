import { describe, expect, it } from "vitest";
import { extractFileText, ParseError } from "@/lib/parse/file";
import { detectKind } from "@/lib/parse/kind";

describe("detectKind", () => {
  it("detects by MIME type or extension", () => {
    expect(detectKind("cv.PDF", "")).toBe("pdf");
    expect(detectKind("cv", "application/pdf")).toBe("pdf");
    expect(detectKind("cv.docx", "")).toBe("docx");
    expect(detectKind("cv.txt", "text/plain")).toBeNull();
  });
});

describe("extractFileText", () => {
  it("rejects unsupported types", async () => {
    await expect(extractFileText(new File(["x"], "cv.txt"))).rejects.toMatchObject({ code: "unsupported_type" });
  });

  it("rejects files over 5 MB", async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "cv.pdf", { type: "application/pdf" });
    await expect(extractFileText(big)).rejects.toBeInstanceOf(ParseError);
    await expect(extractFileText(big)).rejects.toMatchObject({ code: "too_large" });
  });
});
