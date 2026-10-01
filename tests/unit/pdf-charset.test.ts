import { describe, expect, it } from "vitest";
import { unsupportedPdfChars } from "@/lib/pdf-charset";

describe("unsupportedPdfChars", () => {
  it("accepts ASCII and WinAnsi punctuation", () => {
    expect(unsupportedPdfChars("Plain text, 123.\nTab\t é – • ’ €")).toEqual([]);
  });

  it("returns unique unsupported characters in order", () => {
    expect(unsupportedPdfChars("Ankit अंकित ₹5 ≥ 😀 😀")).toEqual(Array.from("अंकित₹≥😀").filter((c, i, a) => a.indexOf(c) === i));
    expect(unsupportedPdfChars("Ankit अंकित ₹5 ≥ 😀")).toEqual(["अ", "ं", "क", "ि", "त", "₹", "≥", "😀"]);
  });
});
