import { diffWordsWithSpace } from "diff";

export type Part = { text: string; changed: boolean };

function merge(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (const p of parts) {
    if (!p.text) continue;
    const last = out[out.length - 1];
    if (last && last.changed === p.changed) last.text += p.text;
    else out.push({ ...p });
  }
  return out;
}

/** Joins two changed parts that are separated only by unchanged whitespace. */
function bridge(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const gap = parts[i + 1];
    const next = parts[i + 2];
    if (p.changed && gap && !gap.changed && !gap.text.trim() && next?.changed) {
      parts[i + 2] = { text: p.text + gap.text + next.text, changed: true };
      i++;
    } else {
      out.push(p);
    }
  }
  return out;
}

/** Moves leading and trailing whitespace out of changed parts so highlights never start or end with a space. */
function trim(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (const p of parts) {
    if (!p.changed) {
      out.push(p);
      continue;
    }
    const lead = p.text.length - p.text.trimStart().length;
    const trail = p.text.length - p.text.trimEnd().length;
    out.push({ text: p.text.slice(0, lead), changed: false });
    out.push({ text: p.text.slice(lead, p.text.length - trail), changed: true });
    out.push({ text: p.text.slice(p.text.length - trail), changed: false });
  }
  return out;
}

const tidy = (parts: Part[]) => merge(trim(bridge(merge(parts))));

/** Word-level diff split into the original side and the suggested side. Each side joins back to its input exactly. */
export function diffParts(original: string, suggested: string): { original: Part[]; suggested: Part[] } {
  const out = { original: [] as Part[], suggested: [] as Part[] };
  for (const part of diffWordsWithSpace(original, suggested)) {
    const changed = (part.added || part.removed) && part.value.trim() !== "";
    if (!part.added) out.original.push({ text: part.value, changed });
    if (!part.removed) out.suggested.push({ text: part.value, changed });
  }
  return { original: tidy(out.original), suggested: tidy(out.suggested) };
}
