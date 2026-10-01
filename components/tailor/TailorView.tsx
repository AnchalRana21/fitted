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

  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let live = true;
    getRun(id)
      .then((r) => {
        if (live) setRun(r);
      })
      .catch(() => {
        if (live) setLoadFailed(true);
      });
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    if (run) saveRun(run).catch(() => setSaveFailed(true));
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

  if (loadFailed) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Couldn&apos;t open this run</h1>
        <p className="text-neutral-700">
          Your browser blocked access to saved runs. Private browsing can do this.{" "}
          <Link href="/" className="underline">Start a new one</Link>.
        </p>
      </div>
    );
  }
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
        {saveFailed && (
          <p role="status" className="mt-1 text-sm text-amber-800">
            Couldn&apos;t save this run in your browser. It will be lost if you reload.
          </p>
        )}
      </div>
      {/* Panels stay mounted (forceMount) so the cover-letter stream and diff edits, which live inside the panels, survive tab switches. */}
      <Tabs.Root defaultValue="analysis">
        <Tabs.List aria-label="Tailoring steps" className="flex gap-1 overflow-x-auto border-b border-neutral-200">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 data-[state=active]:border-emerald-700 data-[state=active]:text-neutral-950"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="analysis" forceMount className="pt-6 data-[state=inactive]:hidden">
          <AnalysisPanel
            data={analysisData}
            status={run.analysis ? "done" : analysis.status}
            error={analysis.error}
            onRetry={() => void analysis.start({ resume: run.resume, job: run.job })}
          />
        </Tabs.Content>
        <Tabs.Content value="rewrite" forceMount className="pt-6 data-[state=inactive]:hidden">
          <DiffEditor
            resume={run.resume}
            rewrite={run.rewrite}
            partial={rewrite.partial}
            error={rewrite.error}
            waitingForAnalysis={!run.analysis}
            decisions={run.decisions}
            onChange={(decisions: Run["decisions"]) => update({ decisions })}
            onRetry={() => {
              if (run.analysis) void rewrite.start({ resume: run.resume, job: run.job, analysis: run.analysis });
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="cover-letter" forceMount className="pt-6 data-[state=inactive]:hidden">
          <CoverLetterPanel
            resume={run.resume}
            job={run.job}
            saved={run.coverLetter}
            onSave={(coverLetter: Run["coverLetter"]) => update({ coverLetter })}
          />
        </Tabs.Content>
        <Tabs.Content value="export" forceMount className="pt-6 data-[state=inactive]:hidden">
          <ExportPanel resume={applyDecisions(run.resume, run.decisions)} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
