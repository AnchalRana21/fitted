"use client";

import { diffWords } from "diff";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Decision } from "@/lib/apply";

type Props = {
  original: string;
  newText: string;
  reason: string;
  verify: boolean;
  decision?: Decision;
  onChange?: (decision: Decision) => void;
};

const BORDER = { pending: "border-neutral-200", accepted: "border-emerald-600", rejected: "border-neutral-200 opacity-70" };

export function SuggestionCard({ original, newText, reason, verify, decision, onChange }: Props) {
  const editId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(decision?.text ?? newText);
  const shown = decision?.text ?? newText;
  const parts = diffWords(original, shown);

  return (
    <article
      aria-label={`Suggestion: ${original}`}
      className={`space-y-3 rounded-lg border-2 bg-white p-4 ${BORDER[decision?.status ?? "pending"]}`}
    >
      {verify && (
        <p className="inline-block rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
          Check this: it adds a detail not found in your resume
        </p>
      )}
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Original</h4>
          <p className="mt-1">
            {parts.map((part, i) =>
              part.added ? null : (
                <span key={i} className={part.removed ? "text-red-700 line-through" : ""}>
                  {part.value}
                </span>
              ),
            )}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Suggested</h4>
          {editing ? (
            <>
              <label htmlFor={editId} className="sr-only">
                Edit suggestion
              </label>
              <textarea
                id={editId}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1 h-24 w-full rounded border border-neutral-300 p-2"
              />
            </>
          ) : (
            <p className="mt-1">
              {parts.map((part, i) =>
                part.removed ? null : (
                  <span key={i} className={part.added ? "rounded bg-emerald-100 text-emerald-950" : ""}>
                    {part.value}
                  </span>
                ),
              )}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm text-neutral-600">{reason}</p>
      {decision && onChange && (
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                onClick={() => {
                  onChange({ status: "accepted", text: draft.trim() || newText });
                  setEditing(false);
                }}
              >
                Save and accept
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={decision.status === "accepted" ? "primary" : "secondary"}
                aria-pressed={decision.status === "accepted"}
                onClick={() => onChange({ ...decision, status: "accepted" })}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                aria-pressed={decision.status === "rejected"}
                onClick={() => onChange({ ...decision, status: "rejected" })}
              >
                Reject
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(decision.text);
                  setEditing(true);
                }}
              >
                Edit
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  );
}
