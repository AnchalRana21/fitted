import { errorEvent, type StreamEvent } from "@/lib/stream/ndjson";
import { fallbackParams, getClient, MODEL } from "./client";
import { apiErrorEvent, type Effort } from "./structured";

type Options = { system: string; user: string; effort: Effort; maxTokens?: number };

/** Stream plain text as deltas. The final `done` event carries the full text. */
export async function* streamText(opts: Options): AsyncGenerator<StreamEvent> {
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    ...fallbackParams(),
    output_config: { effort: opts.effort },
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  let finished = false;
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "delta", text: event.delta.text };
      }
    }
    const message = await stream.finalMessage();
    finished = true;
    if (message.stop_reason === "refusal") {
      yield errorEvent("refusal");
      return;
    }
    // After a fallback, only the last text block is the answer.
    yield { type: "done", data: message.content.filter((b) => b.type === "text").at(-1)?.text ?? "" };
  } catch (error) {
    finished = true;
    yield apiErrorEvent(error);
  } finally {
    if (!finished) stream.abort();
  }
}
