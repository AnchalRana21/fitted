import { diffWordsWithSpace } from "diff";

export type Part = { text: string; changed: boolean };

function push(parts: Part[], text: string, changed: boolean) {
  if (!text) return;
  const last = parts[parts.length - 1];
  if (last && last.changed === changed) last.text += text;
  else parts.push({ text, changed });
}

/** Word-level diff split into the original side and the suggested side. Each side joins back to its input exactly. */
export function diffParts(original: string, suggested: string): { original: Part[]; suggested: Part[] } {
  const out = { original: [] as Part[], suggested: [] as Part[] };
  for (const part of diffWordsWithSpace(original, suggested)) {
    const changed = (part.added || part.removed) && part.value.trim() !== "";
    if (!part.added) push(out.original, part.value, changed);
    if (!part.removed) push(out.suggested, part.value, changed);
  }
  return out;
}
