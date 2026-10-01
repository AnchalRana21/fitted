"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
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
    return <p role="alert">Couldn&apos;t read saved runs in this browser. Private browsing can block storage.</p>;
  }
  if (runs === null) return <p role="status">Loading…</p>;
  if (runs.length === 0) {
    return (
      <p className="text-neutral-700">
        No tailored resumes yet. <Link href="/" className="underline">Start one</Link>.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {deleteFailed && <p role="alert">Couldn&apos;t delete this run.</p>}
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {runs.map((run) => (
          <li key={run.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/tailor/${run.id}`} className="font-medium hover:underline">
                {run.title}
              </Link>
              <p className="text-sm text-neutral-600">
                {new Date(run.createdAt).toLocaleString()}
                {run.analysis && ` · Match ${run.analysis.score}/100`}
              </p>
            </div>
            <Button variant="ghost" aria-label={`Delete ${run.title}`} onClick={() => remove(run)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
