"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import type { Decision } from "@/lib/apply";
import { cn } from "@/lib/cn";
import { diffParts } from "@/lib/diff";

type Props = {
  original: string;
  newText: string;
  reason: string;
  verify: boolean;
  decision?: Decision;
  onChange?: (decision: Decision) => void;
};

const STATE = {
  pending: "border-border bg-surface",
  accepted: "border-secondary bg-secondary-subtle/40",
  rejected: "border-dashed border-border bg-surface-muted",
};

const LABEL = "text-[11px] font-semibold uppercase tracking-wide text-ink-3";

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
  const parts = diffParts(original, shown);

  return (
    <article
      aria-label={`Suggestion: ${original}`}
      className={cn("space-y-3 rounded-md border p-4 text-ink transition-colors", STATE[decision?.status ?? "pending"])}
    >
      {(decision?.status === "rejected" || verify) && (
        <div className="flex flex-wrap gap-2">
          {decision?.status === "rejected" && <Badge tone="neutral">Rejected</Badge>}
          {verify && <Badge tone="warning">Check this: it adds a detail not found in your resume</Badge>}
        </div>
      )}
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <h4 className={LABEL}>Original</h4>
          <p className="mt-1">
            {parts.original.map((part, i) =>
              part.changed ? (
                <del key={i} className="text-danger decoration-danger/60">
                  {part.text}
                </del>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </p>
        </div>
        <div>
          <h4 className={LABEL}>Suggested</h4>
          {editing ? (
            <>
              <label htmlFor={editId} className="sr-only">
                Edit suggestion
              </label>
              <Textarea
                id={editId}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1 min-h-24"
              />
            </>
          ) : (
            <p className="mt-1">
              {parts.suggested.map((part, i) =>
                part.changed ? (
                  <ins
                    key={i}
                    className="rounded-sm bg-secondary-subtle px-0.5 text-secondary-text underline decoration-secondary/50 underline-offset-2"
                  >
                    {part.text}
                  </ins>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm text-ink-2">{reason}</p>
      {decision && onChange && (
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <Fragment key="edit">
              <Button
                size="sm"
                disabled={!draft.trim()}
                onClick={() => {
                  returnFocus.current = true;
                  onChange({ status: "accepted", text: draft.trim() });
                  setEditing(false);
                }}
              >
                Save and accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
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
                variant={decision.status === "accepted" ? "success" : "secondary"}
                size="sm"
                aria-pressed={decision.status === "accepted"}
                onClick={() => onChange({ ...decision, status: decision.status === "accepted" ? "pending" : "accepted" })}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className={cn(decision.status === "rejected" && "bg-surface-muted")}
                aria-pressed={decision.status === "rejected"}
                onClick={() => onChange({ ...decision, status: decision.status === "rejected" ? "pending" : "rejected" })}
              >
                Reject
              </Button>
              <Button
                ref={editButtonRef}
                variant="ghost"
                size="sm"
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
