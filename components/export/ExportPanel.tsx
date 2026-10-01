"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { unsupportedPdfChars } from "@/lib/pdf-charset";
import { resumeFileName, resumeToMarkdown, resumeToPlainText } from "@/lib/resume";
import type { Resume } from "@/lib/schemas";
import { ResumePreview } from "./ResumePreview";

export function ExportPanel({ resume }: { resume: Resume }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const badChars = unsupportedPdfChars(resumeToPlainText(resume));

  async function downloadPdf() {
    if (badChars.length > 0) return;
    setBusy(true);
    setFailed(false);
    try {
      // Loaded on demand: the PDF renderer is large and only needed here.
      const [{ pdf }, { ResumePdf }] = await Promise.all([import("@react-pdf/renderer"), import("./ResumePdf")]);
      const blob = await pdf(<ResumePdf resume={resume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resumeFileName(resume);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-700">This is your resume with the changes you accepted.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={downloadPdf} disabled={busy || badChars.length > 0}>
          {busy ? "Preparing PDF…" : "Download PDF"}
        </Button>
        <CopyButton text={resumeToMarkdown(resume)} label="Copy as Markdown" />
      </div>
      {badChars.length > 0 && (
        <p role="alert" className="text-sm text-red-700">
          The PDF can&apos;t show some characters in your resume ({badChars.slice(0, 8).join(" ")}). Copy as Markdown
          instead, or replace them.
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-red-700">
          Couldn&apos;t build the PDF. Try again, or copy the Markdown instead.
        </p>
      )}
      <h2 className="text-base font-semibold">Resume preview</h2>
      <ResumePreview resume={resume} />
    </div>
  );
}
