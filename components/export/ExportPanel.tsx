"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { resumeFileName, resumeToMarkdown } from "@/lib/resume";
import type { Resume } from "@/lib/schemas";
import { ResumePreview } from "./ResumePreview";

export function ExportPanel({ resume }: { resume: Resume }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function downloadPdf() {
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
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        <Button onClick={downloadPdf} disabled={busy}>
          {busy ? "Preparing PDF…" : "Download PDF"}
        </Button>
        <CopyButton text={resumeToMarkdown(resume)} label="Copy as Markdown" />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-red-700">
          Couldn&apos;t build the PDF. Try again, or copy the Markdown instead.
        </p>
      )}
      <ResumePreview resume={resume} />
    </div>
  );
}
