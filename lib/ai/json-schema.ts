import { z } from "zod";

// Keywords structured output does not accept. Zod still enforces them when the
// final response is validated, so dropping them here loses nothing.
const UNSUPPORTED = new Set([
  "$schema",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "uniqueItems",
]);

// Inside `properties`, keys are field names, not keywords, so they are kept.
function strip(node: unknown, inProperties = false): unknown {
  if (Array.isArray(node)) return node.map((n) => strip(n));
  if (node === null || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (!inProperties && UNSUPPORTED.has(key)) continue;
    out[key] = strip(value, !inProperties && key === "properties");
  }
  return out;
}

export function toApiSchema(schema: z.ZodType): Record<string, unknown> {
  return strip(z.toJSONSchema(schema)) as Record<string, unknown>;
}
