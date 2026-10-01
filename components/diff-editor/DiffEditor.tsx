"use client";

import type { StreamError } from "@/hooks/useStream";
import { acceptAllSafe, resetDecisions, type Decisions } from "@/lib/apply";
import type { Resume, Rewrite, Suggestion } from "@/lib/schemas";
import type { DeepPartial } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SuggestionCard } from "./SuggestionCard";

type Props = {
  resume: Resume;
  rewrite?: Rewrite;
  partial: unknown;
  error: StreamError | null;
  waitingForAnalysis: boolean;
  decisions: Decisions;
  onChange: (decisions: Decisions) => void;
  onRetry: () => void;
};

export function DiffEditor(props: Props) {
  const { resume, rewrite, partial, error, waitingForAnalysis, decisions, onChange, onRetry } = props;
  const originals = new Map(resume.sections.flatMap((s) => s.bullets.map((b) => [b.id, b.text] as const)));

  if (!rewrite) {
    if (error) return <ErrorNotice error={error} onRetry={onRetry} />;
    if (waitingForAnalysis) return <p role="status" className="text-sm text-ink-2">Suggestions start once the analysis is done.</p>;
    const seen = new Set<string>();
    const drafts = ((partial as DeepPartial<Rewrite> | null)?.suggestions ?? []).filter((s) => {
      if (!s?.bulletId || !s.newText || !originals.has(s.bulletId) || seen.has(s.bulletId)) return false;
      seen.add(s.bulletId);
      return true;
    });
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm font-medium text-ink">
          Writing suggestions… {drafts.length > 0 && `${drafts.length} so far`}
        </p>
        {drafts.map((s) => (
          <SuggestionCard
            key={s.bulletId}
            original={originals.get(s.bulletId!)!}
            newText={s.newText!}
            reason={s.reason ?? ""}
            verify={false}
          />
        ))}
      </div>
    );
  }

  if (rewrite.suggestions.length === 0) {
    return <p className="text-sm text-ink-2">No changes suggested. Your resume already fits this job well.</p>;
  }

  const accepted = rewrite.suggestions.filter((s) => decisions[s.bulletId]?.status === "accepted").length;
  const bySection = resume.sections
    .map((section) => ({
      section,
      suggestions: rewrite.suggestions.filter((s) => section.bullets.some((b) => b.id === s.bulletId)),
    }))
    .filter((group) => group.suggestions.length > 0);

  const setOne = (s: Suggestion) => (decision: Decisions[string]) => onChange({ ...decisions, [s.bulletId]: decision });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink" aria-live="polite">
          {accepted} of {rewrite.suggestions.length} changes accepted.
        </p>
        <p className="text-xs text-ink-3">Changes marked &quot;Check this&quot; are never accepted in bulk.</p>
      </div>
      {bySection.map(({ section, suggestions }) => (
        <section key={section.id} aria-labelledby={`heading-${section.id}`} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id={`heading-${section.id}`} className="text-base font-semibold text-ink">
              {section.title}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Accept all safe changes in ${section.title}`}
                onClick={() => onChange(acceptAllSafe(decisions, suggestions))}
              >
                Accept all safe
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Reset changes in ${section.title}`}
                onClick={() => onChange(resetDecisions(decisions, suggestions))}
              >
                Reset
              </Button>
            </div>
          </div>
          {suggestions.map((s) => (
            <SuggestionCard
              key={s.bulletId}
              original={originals.get(s.bulletId) ?? ""}
              newText={s.newText}
              reason={s.reason}
              verify={s.verify}
              decision={decisions[s.bulletId]}
              onChange={setOne(s)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
