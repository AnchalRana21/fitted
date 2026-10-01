import { describe, expect, it, vi } from "vitest";
import { decodeEvents, encodeEvent, errorEvent, toNdjsonResponse, type StreamEvent } from "@/lib/stream/ndjson";

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
  it("cancels the source when the consumer stops early", async () => {
    const cancel = vi.fn();
    const encoder = new TextEncoder();
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(encodeEvent({ type: "delta", text: "a" })));
        controller.enqueue(encoder.encode(encodeEvent({ type: "delta", text: "b" })));
      },
      cancel,
    });
    for await (const event of decodeEvents(source)) {
      expect(event.type).toBe("delta");
      break;
    }
    expect(cancel).toHaveBeenCalled();
  });

  it("stops with an error event on a malformed line", async () => {
    const chunks = [
      encodeEvent({ type: "partial", data: 1 }) + "not json\n" + encodeEvent({ type: "done", data: 2 }),
    ];
    const events = await collect(streamOf(chunks));
    expect(events).toEqual([{ type: "partial", data: 1 }, errorEvent("upstream_error")]);
  });

  it("cancels the generator when the client disconnects", async () => {
    let cleaned = false;
    async function* events(): AsyncGenerator<StreamEvent> {
      try {
        yield { type: "delta", text: "a" };
        yield { type: "delta", text: "b" };
      } finally {
        cleaned = true;
      }
    }
    const reader = toNdjsonResponse(events()).body!.getReader();
    await reader.read();
    await reader.cancel();
    expect(cleaned).toBe(true);
  });

  it("decodes multi-byte characters split across chunks", async () => {
    const bytes = new TextEncoder().encode(encodeEvent({ type: "delta", text: "é€😀" }));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    expect(await collect(body)).toEqual([{ type: "delta", text: "é€😀" }]);
  });
});
