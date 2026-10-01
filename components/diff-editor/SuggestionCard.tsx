"use client";

import { diffWords } from "diff";
import { Fragment, useEffect, useId, useRef, useState } from "react";
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

const BORDER = { pending: "border-neutral-200", accepted: "border-emerald-600", rejected: "border-neutral-200 border-dashed bg-neutral-50" };

export function SuggestionCard({ original, newText, reason, verify, decision, onChange }: Props) {
  const editId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(decision?.text ?? newText);
  const [seenText, setSeenText] = useState(decision?.text);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  if (decision?.text !== seenText) {
    setSeenText(decision?.text);
    setEditing(false);
    setDraft(decision?.text ?? newText);
  }
  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);
  const shown = decision?.text ?? newText;
  const parts = diffWords(original, shown);

  return (
    <article
      aria-label={`Suggestion: ${original}`}
      className={`space-y-3 rounded-lg border-2 bg-white p-4 ${BORDER[decision?.status ?? "pending"]}`}
    >
      {decision?.status === "rejected" && <p className="text-xs font-medium text-neutral-600">Rejected</p>}
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
                part.removed ? (
                  <del key={i} className="text-red-700">
                    {part.value}
                  </del>
                ) : (
                  <span key={i}>{part.value}</span>
                )
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
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1 h-24 w-full rounded border border-neutral-300 p-2"
              />
            </>
          ) : (
            <p className="mt-1">
              {parts.map((part, i) =>
                part.removed ? null : (
                  part.added ? (
                    <ins
                      key={i}
                      className="rounded bg-emerald-100 text-emerald-950 underline decoration-emerald-700 underline-offset-2"
                    >
                      {part.value}
                    </ins>
                  ) : (
                    <span key={i}>{part.value}</span>
                  )
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
            <Fragment key="edit">
              <Button
                disabled={!draft.trim()}
                onClick={() => {
                  returnFocus.current = true;
                  onChange({ status: "accepted", text: draft.trim() });
                  setEditing(false);
                }}
              >
                Save and accept
              </Button>
              <Button variant="ghost" onClick={() => {
                  returnFocus.current = true;
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </Fragment>
          ) : (
            <Fragment key="view">
              <Button
                variant={decision.status === "accepted" ? "primary" : "secondary"}
                aria-pressed={decision.status === "accepted"}
                onClick={() => onChange({ ...decision, status: decision.status === "accepted" ? "pending" : "accepted" })}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                className={decision.status === "rejected" ? "bg-neutral-200" : ""}
                aria-pressed={decision.status === "rejected"}
                onClick={() => onChange({ ...decision, status: decision.status === "rejected" ? "pending" : "rejected" })}
              >
                Reject
              </Button>
              <Button
                ref={editButtonRef}
                variant="ghost"
                onClick={() => {
                  setDraft(decision.text);
                  setEditing(true);
                }}
              >
                Edit
              </Button>
            </Fragment>
          )}
        </div>
      )}
    </article>
  );
}
