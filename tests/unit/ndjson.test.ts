import { describe, expect, it } from "vitest";
import { decodeEvents, encodeEvent, toNdjsonResponse, type StreamEvent } from "@/lib/stream/ndjson";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(body: ReadableStream<Uint8Array>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const event of decodeEvents(body)) out.push(event);
  return out;
}

describe("ndjson", () => {
  it("decodes events split across chunks", async () => {
    const a = encodeEvent({ type: "partial", data: { score: 1 } });
    const b = encodeEvent({ type: "done", data: { score: 2 } });
    const all = a + b;
    const events = await collect(streamOf([all.slice(0, 5), all.slice(5, a.length + 3), all.slice(a.length + 3)]));
    expect(events).toEqual([
      { type: "partial", data: { score: 1 } },
      { type: "done", data: { score: 2 } },
    ]);
  });

  it("round-trips through a Response", async () => {
    async function* events(): AsyncGenerator<StreamEvent> {
      yield { type: "delta", text: "Hi" };
      yield { type: "done", data: "Hi" };
    }
    const response = toNdjsonResponse(events());
    expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");
    expect(await collect(response.body!)).toEqual([
      { type: "delta", text: "Hi" },
      { type: "done", data: "Hi" },
    ]);
  });

  it("turns a thrown generator into an error event", async () => {
    async function* events(): AsyncGenerator<StreamEvent> {
      yield { type: "delta", text: "Hi" };
      throw new Error("boom");
    }
    const out = await collect(toNdjsonResponse(events()).body!);
    expect(out.at(-1)).toMatchObject({ type: "error", code: "upstream_error" });
  });
});
