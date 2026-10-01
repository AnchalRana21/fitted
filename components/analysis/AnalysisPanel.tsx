import type { StreamError, StreamStatus } from "@/hooks/useStream";
import type { Analysis } from "@/lib/schemas";
import type { DeepPartial } from "@/lib/types";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ScoreGauge } from "./ScoreGauge";

const FIT_LABEL = { under: "Below the role's level", match: "Right level for the role", over: "Above the role's level" };

const CHIP = {
  match: "bg-emerald-50 text-emerald-900 border-emerald-200",
  missing: "bg-amber-50 text-amber-900 border-amber-200",
  neutral: "bg-neutral-100 text-neutral-800 border-neutral-200",
};

function SkillGroup({ title, items, tone }: { title: string; items?: (string | undefined)[]; tone: keyof typeof CHIP }) {
  const list = (items ?? []).filter((item): item is string => Boolean(item));
  if (list.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {list.map((item, i) => (
          <li key={`${i}-${item}`} className={`rounded-full border px-3 py-1 text-sm ${CHIP[tone]}`}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

type Props = {
  data: DeepPartial<Analysis> | null;
  status: StreamStatus;
  error: StreamError | null;
  onRetry: () => void;
};

export function AnalysisPanel({ data, status, error, onRetry }: Props) {
  const statusText = status === "streaming" ? "Analyzing your resume…" : status === "done" ? "Analysis ready" : "";
  return (
    <div className="space-y-6">
      <p role="status" className="sr-only">
        {statusText}
      </p>
      {!data ? (
        error ? (
          <ErrorNotice error={error} onRetry={onRetry} />
        ) : (
          <div className="flex animate-pulse items-center gap-6" aria-hidden="true">
            <div className="h-28 w-28 rounded-full bg-neutral-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-neutral-200" />
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
            </div>
          </div>
        )
      ) : (
        <>
          {error && <ErrorNotice error={error} onRetry={onRetry} />}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ScoreGauge score={data.score} />
            <div className="space-y-2">
              {data.seniorityFit && (
                <p className="text-sm font-medium text-neutral-800">{FIT_LABEL[data.seniorityFit]}</p>
              )}
              <p className="text-neutral-800">{data.summary}</p>
            </div>
          </div>
          <SkillGroup title="Skills you already show" items={data.matchedSkills} tone="match" />
          <SkillGroup title="Skills the job asks for that your resume doesn't show" items={data.missingSkills} tone="missing" />
          <SkillGroup title="Keywords to work in, where true" items={data.keywordGaps} tone="neutral" />
        </>
      )}
    </div>
  );
}
