"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { CoverLetterPanel } from "@/components/cover-letter/CoverLetterPanel";
import { DiffEditor } from "@/components/diff-editor/DiffEditor";
import { LivePreview } from "@/components/export/LivePreview";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/Tabs";
import { useStream } from "@/hooks/useStream";
import { applyDecisions, initialDecisions, type Decisions } from "@/lib/apply";
import { getRun, saveRun, type Run } from "@/lib/runs";
import { AnalysisSchema, RewriteSchema, type Analysis } from "@/lib/schemas";
import type { DeepPartial } from "@/lib/types";
import { SummaryBar } from "./SummaryBar";

const MAIN = "mx-auto max-w-6xl px-4 py-6 sm:px-6";

function StateCard({ title, children, live }: { title: string; children: ReactNode; live?: boolean }) {
  return (
    <main className={MAIN}>
      <Card className="mx-auto max-w-lg space-y-3 p-6 text-center sm:p-8" role={live ? "status" : undefined}>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {children}
      </Card>
    </main>
  );
}

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

  // Decisions as they were when the rewrite first appeared on screen (saved, or freshly streamed).
  // Only lines whose decision changes after that flash in the preview.
  const [baseline, setBaseline] = useState<Decisions | null>(null);
  if (run?.rewrite && baseline === null) setBaseline(run.decisions);

  if (loadFailed) {
    return (
      <StateCard title={"Couldn't open this run"}>
        <p className="text-sm text-ink-2">Your browser blocked access to saved runs. Private browsing can do this.</p>
        <Link href="/" className={buttonClasses("secondary", "sm")}>
          Start a new one
        </Link>
      </StateCard>
    );
  }
  if (run === undefined) {
    return (
      <StateCard title="Opening your run" live>
        <p className="text-sm text-ink-2">Loading…</p>
      </StateCard>
    );
  }
  if (run === null) {
    return (
      <StateCard title="Run not found">
        <p className="text-sm text-ink-2">Runs are saved in this browser only.</p>
        <Link href="/" className={buttonClasses("secondary", "sm")}>
          Start a new one
        </Link>
      </StateCard>
    );
  }

  const analysisData = run.analysis ?? (analysis.partial as DeepPartial<Analysis> | null);
  const streamedScore = (analysis.partial as DeepPartial<Analysis> | null)?.score;
  const partialScore = typeof streamedScore === "number" ? streamedScore : undefined;
  const finalResume = applyDecisions(run.resume, run.decisions);
  const suggestions = run.rewrite?.suggestions ?? [];
  const accepted = suggestions.filter((s) => run.decisions[s.bulletId]?.status === "accepted").length;
  const changedIds = new Set(
    Object.entries(run.decisions)
      .filter(([bulletId, d]) => {
        const before = baseline?.[bulletId];
        return d.status === "accepted" && (before?.status !== d.status || before.text !== d.text);
      })
      .map(([bulletId]) => bulletId),
  );

  return (
    <main className={`${MAIN} space-y-6`}>
      <SummaryBar
        run={run}
        partialScore={partialScore}
        finalResume={finalResume}
        accepted={accepted}
        total={suggestions.length}
        saveFailed={saveFailed}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-4 sm:p-5">
          {/* Panels stay mounted (TabPanel forceMounts) so the cover-letter stream and diff edits survive tab switches. */}
          <Tabs defaultValue="analysis">
            <TabList aria-label="Tailoring steps">
              <Tab value="analysis">Analysis</Tab>
              <Tab value="rewrite">Rewrite</Tab>
              <Tab value="cover-letter">Cover letter</Tab>
            </TabList>
            <TabPanel value="analysis">
              <AnalysisPanel
                data={analysisData}
                status={run.analysis ? "done" : analysis.status}
                error={analysis.error}
                onRetry={() => void analysis.start({ resume: run.resume, job: run.job })}
              />
            </TabPanel>
            <TabPanel value="rewrite">
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
            </TabPanel>
            <TabPanel value="cover-letter">
              <CoverLetterPanel
                resume={run.resume}
                job={run.job}
                saved={run.coverLetter}
                onSave={(coverLetter: Run["coverLetter"]) => update({ coverLetter })}
              />
            </TabPanel>
          </Tabs>
        </Card>
        <LivePreview resume={finalResume} changedIds={changedIds} />
      </div>
    </main>
  );
}
