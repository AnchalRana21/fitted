import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { expect, it } from "vitest";
import sample from "@/fixtures/sample-run.json";
import { ResumePdf } from "@/components/export/ResumePdf";
import { parseSections } from "@/lib/parse/sections";

it("renders a PDF", async () => {
  // ResumePdf renders a <Document> at its root, which renderToBuffer requires.
  const element = createElement(ResumePdf, { resume: parseSections(sample.resumeText) }) as unknown as ReactElement<DocumentProps>;
  const buf = await renderToBuffer(element);
  expect(buf.subarray(0, 4).toString()).toBe("%PDF");
});
