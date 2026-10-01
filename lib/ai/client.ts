import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

// Models that accept server-side refusal fallbacks in "default" mode.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-opus-5", "claude-fable-5-1"]);

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** If the model declines, the API re-runs the request on a fallback model in the same call. */
export function fallbackParams() {
  return FALLBACK_MODELS.has(MODEL)
    ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
    : {};
}
