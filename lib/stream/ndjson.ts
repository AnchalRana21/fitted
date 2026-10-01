import { ERROR_MESSAGES, type ErrorCode } from "@/lib/errors";

export type StreamEvent =
  | { type: "partial"; data: unknown }
  | { type: "delta"; text: string }
  | { type: "done"; data: unknown }
  | { type: "error"; code: ErrorCode; message: string };

export function errorEvent(code: ErrorCode): StreamEvent {
  return { type: "error", code, message: ERROR_MESSAGES[code] };
}

export function encodeEvent(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/** Pull-based, so a client disconnect stops the generator (and the upstream call). */
export function toNdjsonResponse(events: AsyncIterable<StreamEvent>): Response {
  const encoder = new TextEncoder();
  const iterator = events[Symbol.asyncIterator]();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(encodeEvent(value)));
      } catch (error) {
        console.error(error);
        controller.enqueue(encoder.encode(encodeEvent(errorEvent("upstream_error"))));
        controller.close();
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function parseLine(line: string): StreamEvent | null {
  try {
    return JSON.parse(line) as StreamEvent;
  } catch {
    return null;
  }
}

export async function* decodeEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.pipeThrough(new TextDecoderStream() as ReadableWritablePair<string, Uint8Array>).getReader();
  let buffer = "";
  let finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          const event = parseLine(line);
          if (!event) {
            yield errorEvent("upstream_error");
            return;
          }
          yield event;
        }
        newline = buffer.indexOf("\n");
      }
    }
    if (buffer.trim()) {
      const event = parseLine(buffer);
      yield event ?? errorEvent("upstream_error");
    }
    finished = true;
  } finally {
    if (!finished) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
