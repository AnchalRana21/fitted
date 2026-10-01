import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
import { errorEvent, type StreamEvent } from "@/lib/stream/ndjson";
import { fallbackParams, getClient, MODEL } from "./client";
import { toApiSchema } from "./json-schema";
import { tryParsePartial } from "./partial";

export type Effort = "low" | "medium" | "high";

type Options<T> = {
  schema: z.ZodType<T>;
  system: string;
  user: string;
  effort: Effort;
  maxTokens?: number;
  transform?: (data: T) => T;
};

const PARTIAL_INTERVAL_MS = 100;

export function apiErrorEvent(error: unknown): StreamEvent {
  if (error instanceof Anthropic.RateLimitError || (error instanceof Anthropic.APIError && error.status === 529)) {
    return errorEvent("upstream_busy");
  }
  console.error(error);
  return errorEvent("upstream_error");
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function* attempt<T>(opts: Options<T>): AsyncGenerator<StreamEvent, "ok" | "failed" | "invalid"> {
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 32000,
    ...fallbackParams(),
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: toApiSchema(opts.schema) } },
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  let text = "";
  let lastEmit = 0;
  let finished = false;
  try {
    for await (const event of stream) {
      // A fallback model starts a new text block; restart from it.
      if (event.type === "content_block_start" && event.content_block.type === "text") text = "";
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        text += event.delta.text;
        const now = Date.now();
        if (now - lastEmit >= PARTIAL_INTERVAL_MS) {
          const partial = tryParsePartial(text);
          if (partial !== undefined) {
            lastEmit = now;
            yield { type: "partial", data: partial };
          }
        }
      }
    }
    const message = await stream.finalMessage();
    finished = true;
    if (message.stop_reason === "refusal") {
      yield errorEvent("refusal");
      return "failed";
    }
    if (message.stop_reason === "max_tokens") {
      yield errorEvent("truncated");
      return "failed";
    }
    const final = message.content.filter((b) => b.type === "text").at(-1)?.text ?? "";
    const parsed = opts.schema.safeParse(parseJson(final));
    if (!parsed.success) return "invalid";
    yield { type: "done", data: opts.transform ? opts.transform(parsed.data) : parsed.data };
    return "ok";
  } catch (error) {
    finished = true;
    yield apiErrorEvent(error);
    return "failed";
  } finally {
    if (!finished) stream.abort();
  }
}

/** Stream a structured response. Retries once if the final output fails validation. */
export async function* streamStructured<T>(opts: Options<T>): AsyncGenerator<StreamEvent> {
  for (let i = 0; i < 2; i++) {
    const result = yield* attempt(opts);
    if (result !== "invalid") return;
  }
  yield errorEvent("invalid_output");
}
