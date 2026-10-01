import { beforeEach, describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
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

function throwingStream(error: unknown) {
  return {
    async *[Symbol.asyncIterator]() {
      throw error;
    },
    finalMessage: async () => {
      throw error;
    },
    abort: vi.fn(),
  };
}

describe("abort and error handling", () => {
  beforeEach(() => streamMock.mockReset());

  it("passes the abort signal to the SDK (structured)", async () => {
    const signal = new AbortController().signal;
    streamMock.mockReturnValueOnce(fakeStream(['{"score": 1}']));
    await collect(streamStructured({ ...opts, signal }));
    expect(streamMock.mock.calls[0][1]).toEqual({ signal });
  });

  it("passes the abort signal to the SDK (text)", async () => {
    const signal = new AbortController().signal;
    streamMock.mockReturnValueOnce(fakeStream(["hi"]));
    await collect(streamText({ system: "s", user: "u", effort: "low", signal }));
    expect(streamMock.mock.calls[0][1]).toEqual({ signal });
  });

  it("emits nothing when the request is aborted (structured)", async () => {
    streamMock.mockReturnValueOnce(throwingStream(new Anthropic.APIUserAbortError()));
    expect(await collect(streamStructured(opts))).toEqual([]);
    expect(streamMock).toHaveBeenCalledTimes(1);
  });

  it("emits nothing when the request is aborted (text)", async () => {
    streamMock.mockReturnValueOnce(throwingStream(new Anthropic.APIUserAbortError()));
    expect(await collect(streamText({ system: "s", user: "u", effort: "low" }))).toEqual([]);
  });

  it("maps rate limit errors to upstream_busy", async () => {
    const error = new Anthropic.RateLimitError(429, undefined, "slow down", new Headers());
    streamMock.mockReturnValueOnce(throwingStream(error));
    expect((await collect(streamStructured(opts))).at(-1)).toMatchObject({
      type: "error",
      code: "upstream_busy",
    });
  });

  it("maps mid-stream overloaded errors (no status) to upstream_busy", async () => {
    const error = new Anthropic.APIError(undefined, undefined, "overloaded", undefined, "overloaded_error");
    streamMock.mockReturnValueOnce(throwingStream(error));
    expect((await collect(streamStructured(opts))).at(-1)).toMatchObject({
      type: "error",
      code: "upstream_busy",
    });
  });

  it("maps mid-stream rate_limit_error (no status) to upstream_busy", async () => {
    const error = new Anthropic.APIError(undefined, undefined, "limit", undefined, "rate_limit_error");
    streamMock.mockReturnValueOnce(throwingStream(error));
    expect((await collect(streamText({ system: "s", user: "u", effort: "low" }))).at(-1)).toMatchObject({
      type: "error",
      code: "upstream_busy",
    });
  });

  it("maps unknown errors to upstream_error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    streamMock.mockReturnValueOnce(throwingStream(new Error("boom")));
    expect((await collect(streamStructured(opts))).at(-1)).toMatchObject({
      type: "error",
      code: "upstream_error",
    });
    spy.mockRestore();
  });

  it("aborts the upstream stream when the consumer stops early", async () => {
    const stream = fakeStream(['{"sco', 're": 1}']);
    streamMock.mockReturnValueOnce(stream);
    const gen = streamText({ system: "s", user: "u", effort: "low" });
    await gen.next();
    await gen.return(undefined);
    expect(stream.abort).toHaveBeenCalled();
  });

  it("aborts the upstream stream when the structured consumer stops early", async () => {
    const stream = fakeStream(['{"score": 1}']);
    streamMock.mockReturnValueOnce(stream);
    const gen = streamStructured(opts);
    await gen.next();
    await gen.return(undefined);
    expect(stream.abort).toHaveBeenCalled();
  });

  it("resets accumulated text on a second text block", async () => {
    const stream = {
      async *[Symbol.asyncIterator]() {
        yield {
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "" },
        };
        yield {
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text: '{"score": 1' },
        };
        yield {
          type: "content_block_start",
          index: 1,
          content_block: { type: "text", text: "" },
        };
        yield {
          type: "content_block_delta",
          index: 1,
          delta: { type: "text_delta", text: '{"score": 2}' },
        };
      },
      finalMessage: async () => ({
        stop_reason: "end_turn",
        content: [
          { type: "text", text: '{"score": 1' },
          { type: "text", text: '{"score": 2}' },
        ],
      }),
      abort: vi.fn(),
    };
    streamMock.mockReturnValueOnce(stream);
    const events = await collect(streamStructured(opts));
    expect(events.at(-1)).toEqual({ type: "done", data: { score: 2 } });
  });

  it("reports max_tokens as truncated without retrying", async () => {
    streamMock.mockReturnValueOnce(fakeStream(['{"score": 1'], "max_tokens"));
    const events = await collect(streamStructured(opts));
    expect(streamMock).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toMatchObject({ type: "error", code: "truncated" });
  });

  it("streamText reports max_tokens as truncated", async () => {
    streamMock.mockReturnValueOnce(fakeStream(["partial"], "max_tokens"));
    const events = await collect(streamText({ system: "s", user: "u", effort: "low" }));
    expect(events.at(-1)).toMatchObject({ type: "error", code: "truncated" });
    expect(events.some((e) => e.type === "done")).toBe(false);
  });

  it("streamText reports refusals", async () => {
    streamMock.mockReturnValueOnce(fakeStream([""], "refusal"));
    const events = await collect(streamText({ system: "s", user: "u", effort: "low" }));
    expect(events.at(-1)).toMatchObject({ type: "error", code: "refusal" });
  });
});
