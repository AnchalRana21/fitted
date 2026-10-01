import { parse } from "partial-json";

/** Parse JSON that may be cut off mid-way. Undefined when nothing usable yet. */
export function tryParsePartial(text: string): unknown {
  if (!text.trim()) return undefined;
  try {
    return parse(text);
  } catch {
    return undefined;
  }
}
