"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { describeError, type ErrorCode } from "@/lib/errors";
import { decodeEvents } from "@/lib/stream/ndjson";

export type StreamStatus = "idle" | "streaming" | "done" | "error";
export type StreamError = { code: ErrorCode; message: string };

type State<T> = {
  status: StreamStatus;
  partial: unknown;
  text: string;
  data: T | null;
  error: StreamError | null;
};

function idle<T>(): State<T> {
  return { status: "idle", partial: null, text: "", data: null, error: null };
}

/**
 * POST `body` to an NDJSON route and expose the stream as state.
 * On failure, partial output is kept so the user doesn't lose what arrived.
 */
export function useStream<T>(url: string, schema: z.ZodType<T>, onDone?: (data: T) => void) {
  const [state, setState] = useState<State<T>>(idle);
  const controllerRef = useRef<AbortController | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const start = useCallback(
    async (body: unknown) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ ...idle<T>(), status: "streaming" });

      const fail = (code: ErrorCode, message = describeError(code)) =>
        setState((s) => ({ ...s, status: "error", error: { code, message } }));

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const err = (await res.json().catch(() => null)) as { code?: ErrorCode; reset?: number } | null;
          const code = err?.code ?? "upstream_error";
          return fail(code, describeError(code, err?.reset));
        }
        for await (const event of decodeEvents(res.body)) {
          if (event.type === "partial") setState((s) => ({ ...s, partial: event.data }));
          else if (event.type === "delta") setState((s) => ({ ...s, text: s.text + event.text }));
          else if (event.type === "error") return fail(event.code, event.message);
          else {
            const parsed = schema.safeParse(event.data);
            if (!parsed.success) return fail("invalid_output");
            setState((s) => ({
              ...s,
              status: "done",
              data: parsed.data,
              text: typeof parsed.data === "string" ? parsed.data : s.text,
            }));
            onDoneRef.current?.(parsed.data);
            return;
          }
        }
        fail("network");
      } catch {
        if (!controller.signal.aborted) fail("network");
      }
    },
    [url, schema],
  );

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState(idle<T>());
  }, []);

  return { ...state, start, reset };
}
