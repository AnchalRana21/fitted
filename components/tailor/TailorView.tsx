"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { CoverLetterPanel } from "@/components/cover-letter/CoverLetterPanel";
import { DiffEditor } from "@/components/diff-editor/DiffEditor";
import { ExportPanel } from "@/components/export/ExportPanel";
import { useStream } from "@/hooks/useStream";
import { applyDecisions, initialDecisions } from "@/lib/apply";
import { getRun, saveRun, type Run } from "@/lib/runs";
import { AnalysisSchema, RewriteSchema, type Analysis } from "@/lib/schemas";
import type { DeepPartial } from "@/lib/types";

const TABS = [
  { value: "analysis", label: "Analysis" },
  { value: "rewrite", label: "Rewrite" },
  { value: "cover-letter", label: "Cover letter" },
  { value: "export", label: "Export" },
];

export function TailorView({ id }: { id: string }) {
  const [run, setRun] = useState<Run | null | undefined>(undefined);
  const started = useRef({ analysis: false, rewrite: false });

  useEffect(() => {
    getRun(id).then(setRun);
  }, [id]);

  useEffect(() => {
    if (run) void saveRun(run);
  }, [run]);

  const update = useCallback((patch: Partial<Run>) => {
    setRun((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const analysis = useStream("/api/analyze", AnalysisSchema, (data) => update({ analysis: data }));
  const rewrite = useStream("/api/rewrite", RewriteSchema, (data) =>
    update({ rewrite: data, decisions: initialDecisions(data) }),
  );

  // Run analysis, then rewrite, once each per visit, unless already saved.
  useEffect(() => {
    if (!run) return;
    if (!run.analysis && !started.current.analysis) {
      started.current.analysis = true;
      void analysis.start({ resume: run.resume, job: run.job });
    } else if (run.analysis && !run.rewrite && !started.current.rewrite) {
      started.current.rewrite = true;
      void rewrite.start({ resume: run.resume, job: run.job, analysis: run.analysis });
    }
  }, [run, analysis, rewrite]);

  if (run === undefined) return <p role="status">Loading…</p>;
  if (run === null) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Run not found</h1>
        <p className="text-neutral-700">
          Runs are saved in this browser only. <Link href="/" className="underline">Start a new one</Link>.
        </p>
      </div>
    );
  }

  const analysisData = run.analysis ?? (analysis.partial as DeepPartial<Analysis> | null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-neutral-600">Tailoring for</p>
        <h1 className="text-2xl font-semibold tracking-tight">{run.title}</h1>
      </div>
      <Tabs.Root defaultValue="analysis">
        <Tabs.List aria-label="Tailoring steps" className="flex gap-1 overflow-x-auto border-b border-neutral-200">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 data-[state=active]:border-emerald-700 data-[state=active]:text-neutral-950"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="analysis" className="pt-6">
          <AnalysisPanel
            data={analysisData}
            status={run.analysis ? "done" : analysis.status}
            error={analysis.error}
            onRetry={() => void analysis.start({ resume: run.resume, job: run.job })}
          />
        </Tabs.Content>
        <Tabs.Content value="rewrite" className="pt-6">
          <DiffEditor
            resume={run.resume}
            rewrite={run.rewrite}
            partial={rewrite.partial}
            status={run.rewrite ? "done" : rewrite.status}
            error={rewrite.error}
            waitingForAnalysis={!run.analysis}
            decisions={run.decisions}
            onChange={(decisions: Run["decisions"]) => update({ decisions })}
            onRetry={() =>
              run.analysis && void rewrite.start({ resume: run.resume, job: run.job, analysis: run.analysis })
            }
          />
        </Tabs.Content>
        <Tabs.Content value="cover-letter" className="pt-6">
          <CoverLetterPanel
            resume={run.resume}
            job={run.job}
            saved={run.coverLetter}
            onSave={(coverLetter: Run["coverLetter"]) => update({ coverLetter })}
          />
        </Tabs.Content>
        <Tabs.Content value="export" className="pt-6">
          <ExportPanel resume={applyDecisions(run.resume, run.decisions)} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
