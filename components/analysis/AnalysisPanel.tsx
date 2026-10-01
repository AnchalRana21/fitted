import type { StreamError, StreamStatus } from "@/hooks/useStream";
import type { Analysis } from "@/lib/schemas";
import type { DeepPartial } from "@/lib/types";
import { Badge, type Tone } from "@/components/ui/Badge";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { Skeleton } from "@/components/ui/Skeleton";

const FIT_LABEL = { under: "Below the role's level", match: "Right level for the role", over: "Above the role's level" };

function SkillGroup({ title, items, tone }: { title: string; items?: (string | undefined)[]; tone: Tone }) {
  const list = (items ?? []).filter((item): item is string => Boolean(item));
  if (list.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {list.map((item, i) => (
          <li key={`${i}-${item}`}>
            <Badge pill tone={tone}>
              {item}
            </Badge>
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
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="mt-6 h-4 w-40" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
        )
      ) : (
        <>
          {error && <ErrorNotice error={error} onRetry={onRetry} />}
          <div className="space-y-2">
            {data.seniorityFit && <Badge tone="primary">{FIT_LABEL[data.seniorityFit]}</Badge>}
            {data.summary && <p className="text-[15px] leading-relaxed text-ink">{data.summary}</p>}
          </div>
          <SkillGroup title="Skills you already show" items={data.matchedSkills} tone="success" />
          <SkillGroup title="Skills the job asks for that your resume doesn't show" items={data.missingSkills} tone="warning" />
          <SkillGroup title="Keywords to work in, where true" items={data.keywordGaps} tone="neutral" />
        </>
      )}
    </div>
  );
}
