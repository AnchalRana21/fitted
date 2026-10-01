import { ExportActions } from "@/components/export/ExportActions";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Stat } from "@/components/ui/Stat";
import type { Run } from "@/lib/runs";
import type { Resume } from "@/lib/schemas";

type Props = {
  run: Run;
  /** Score from the analysis stream, shown until the finished analysis is saved. */
  partialScore?: number;
  finalResume: Resume;
  accepted: number;
  total: number;
  saveFailed: boolean;
};

export function SummaryBar({ run, partialScore, finalResume, accepted, total, saveFailed }: Props) {
  return (
    <Card className="flex flex-wrap items-center gap-x-6 gap-y-4 p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <ScoreRing size="md" score={run.analysis?.score ?? partialScore} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">Tailoring for</p>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{run.title}</h1>
        </div>
      </div>
      {(run.rewrite || run.analysis) && (
        <div className="flex gap-6">
          {run.rewrite && <Stat value={`${accepted} of ${total}`} label="Changes accepted" />}
          {run.analysis && <Stat value={run.analysis.matchedSkills.length} label="Skills matched" />}
        </div>
      )}
      <ExportActions resume={finalResume} className="sm:ml-auto" />
      {saveFailed && (
        <Alert tone="warning" role="status" className="basis-full">
          Couldn&apos;t save this run in your browser. It will be lost if you reload.
        </Alert>
      )}
    </Card>
  );
}
