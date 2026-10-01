import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Resume } from "@/lib/schemas";
import { ResumePreview } from "./ResumePreview";

export function LivePreview({ resume, changedIds }: { resume: Resume; changedIds?: Set<string> }) {
  return (
    <Card as="section" aria-labelledby="preview-heading" className="p-4 sm:p-5 lg:sticky lg:top-20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="preview-heading" className="text-sm font-semibold text-ink">
          Live preview
        </h2>
        <Badge tone="success">Updates as you accept</Badge>
      </div>
      {/*
        Deliberate literal colours: the preview is white "paper" in both themes because it mirrors the PDF.
        The flash token is pinned to its light value so highlighted lines stay readable on paper in dark mode.
      */}
      <div
        role="region"
        tabIndex={0}
        aria-label="Resume preview"
        className="max-h-[calc(100vh-12rem)] overflow-auto rounded-md border border-border bg-[#ffffff] p-6 text-[#0d1b2a] [--c-secondary-subtle:#d9f3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-8"
      >
        <ResumePreview resume={resume} changedIds={changedIds} />
      </div>
    </Card>
  );
}
