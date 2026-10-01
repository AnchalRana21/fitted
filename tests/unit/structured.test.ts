import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { StreamEvent } from "@/lib/stream/ndjson";

const streamMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/client", () => ({
  MODEL: "test-model",
  fallbackParams: () => ({}),
  getClient: () => ({ beta: { messages: { stream: streamMock } } }),
}));

import { streamStructured } from "@/lib/ai/structured";
import { streamText } from "@/lib/ai/text";

function fakeStream(chunks: string[], stopReason = "end_turn") {
  return {
    async *[Symbol.asyncIterator]() {
      yield { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } };
      for (const text of chunks) yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } };
    },
    finalMessage: async () => ({ stop_reason: stopReason, content: [{ type: "text", text: chunks.join("") }] }),
    abort: vi.fn(),
  };
}

async function collect(gen: AsyncIterable<StreamEvent>) {
  const out: StreamEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}

const Schema = z.strictObject({ score: z.number().int().min(0).max(100) });
const opts = { schema: Schema, system: "s", user: "u", effort: "medium" as const };

describe("streamStructured", () => {
  beforeEach(() => streamMock.mockReset());

  it("emits partial data then the validated result", async () => {
    streamMock.mockReturnValueOnce(fakeStream(['{"sco', 're": 7', "2}"]));
    const events = await collect(streamStructured(opts));
    expect(events[0].type).toBe("partial");
    expect(events.at(-1)).toEqual({ type: "done", data: { score: 72 } });
  });

  it("applies the transform to the final result", async () => {
    streamMock.mockReturnValueOnce(fakeStream(['{"score": 10}']));
    const events = await collect(streamStructured({ ...opts, transform: (d) => ({ score: d.score + 1 }) }));
    expect(events.at(-1)).toEqual({ type: "done", data: { score: 11 } });
  });

  it("retries once when the output fails validation", async () => {
    streamMock.mockReturnValueOnce(fakeStream(['{"score": 900}'])).mockReturnValueOnce(fakeStream(['{"score": 5}']));
    const events = await collect(streamStructured(opts));
    expect(streamMock).toHaveBeenCalledTimes(2);
    expect(events.at(-1)).toEqual({ type: "done", data: { score: 5 } });
  });

  it("gives up after two invalid outputs", async () => {
    streamMock.mockReturnValue(fakeStream(['{"score": 900}']));
    const events = await collect(streamStructured(opts));
    expect(events.at(-1)).toMatchObject({ type: "error", code: "invalid_output" });
  });

  it("reports refusals without retrying", async () => {
    streamMock.mockReturnValueOnce(fakeStream([""], "refusal"));
    const events = await collect(streamStructured(opts));
    expect(streamMock).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toMatchObject({ type: "error", code: "refusal" });
  });
});

describe("streamText", () => {
  beforeEach(() => streamMock.mockReset());

  it("emits deltas then the full text", async () => {
    streamMock.mockReturnValueOnce(fakeStream(["Dear ", "team"]));
    const events = await collect(streamText({ system: "s", user: "u", effort: "low" }));
    expect(events).toEqual([
      { type: "delta", text: "Dear " },
      { type: "delta", text: "team" },
      { type: "done", data: "Dear team" },
    ]);
  });
});
