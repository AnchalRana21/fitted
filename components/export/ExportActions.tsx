"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/cn";
import { unsupportedPdfChars } from "@/lib/pdf-charset";
import { resumeFileName, resumeToMarkdown, resumeToPlainText } from "@/lib/resume";
import type { Resume } from "@/lib/schemas";

export function ExportActions({ resume, className }: { resume: Resume; className?: string }) {
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
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button size="sm" onClick={downloadPdf} disabled={busy || badChars.length > 0}>
        {busy ? "Preparing PDF…" : "Download PDF"}
      </Button>
      <CopyButton text={resumeToMarkdown(resume)} label="Copy as Markdown" size="sm" />
      {badChars.length > 0 && (
        <Alert tone="warning" className="basis-full">
          The PDF can&apos;t show some characters in your resume ({badChars.slice(0, 8).join(" ")}). Copy as Markdown
          instead, or replace them.
        </Alert>
      )}
      {failed && (
        <Alert tone="danger" className="basis-full">
          Couldn&apos;t build the PDF. Try again, or copy the Markdown instead.
        </Alert>
      )}
    </div>
  );
}
