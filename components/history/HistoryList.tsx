"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteRun, listRuns, type Run } from "@/lib/runs";

export function HistoryList() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  useEffect(() => {
    let live = true;
    listRuns().then(
      (result) => {
        if (live) setRuns(result);
      },
      () => {
        if (live) setLoadFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  async function remove(run: Run) {
    if (!window.confirm(`Delete "${run.title}"? This can't be undone.`)) return;
    setDeleteFailed(false);
    try {
      await deleteRun(run.id);
    } catch {
      setDeleteFailed(true);
      return;
    }
    setRuns((prev) => prev?.filter((r) => r.id !== run.id) ?? null);
  }

  if (loadFailed) {
    return (
      <Alert tone="danger" role="alert">
        Couldn&apos;t read saved runs in this browser. Private browsing can block storage.
      </Alert>
    );
  }
  if (runs === null) {
    return (
      <p role="status" className="text-sm text-ink-3">
        Loading…
      </p>
    );
  }
  if (runs.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-ink-2">No tailored resumes yet.</p>
        <Link href="/" className={buttonClasses("primary", "sm")}>
          Start one
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {deleteFailed && (
        <Alert tone="danger" role="alert">
          Couldn&apos;t delete this run.
        </Alert>
      )}
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {runs.map((run) => (
          <Card as="li" key={run.id} className="flex min-w-0 items-center gap-4 p-4 transition-shadow hover:shadow-md">
            <div className="min-w-0 flex-1">
              <Link href={`/tailor/${run.id}`} className="block truncate rounded-sm font-semibold text-ink hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {run.title}
              </Link>
              <p className="text-xs text-ink-3">{new Date(run.createdAt).toLocaleString()}</p>
            </div>
            {run.analysis ? (
              <Badge tone="primary" className="shrink-0">Match {run.analysis.score}/100</Badge>
            ) : (
              <Badge className="shrink-0">No score yet</Badge>
            )}
            <Button variant="ghost" size="sm" className="shrink-0" aria-label={`Delete ${run.title}`} onClick={() => remove(run)}>
              Delete
            </Button>
          </Card>
        ))}
      </ul>
    </div>
  );
}
