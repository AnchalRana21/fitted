import { resumeToPlainText } from "@/lib/resume";
import type { Resume, Rewrite, Suggestion } from "@/lib/schemas";

// Tools and skills a rewrite must not add on its own. Words that are also
// common English ("go", "rest", "spring") are left out to avoid false flags.
const SKILL_TERMS = new Set([
  "react", "vue", "angular", "svelte", "next.js", "nuxt", "node.js", "typescript", "javascript",
  "python", "java", "rust", "c#", "c++", "kotlin", "swift", "sql", "postgresql", "mysql",
  "mongodb", "redis", "graphql", "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
  "jest", "vitest", "cypress", "playwright", "tailwind", "figma", "django", "flask", "fastapi",
  "kafka", "spark", "tensorflow", "pytorch", "llm", "rag", "redux", "webpack", "vite",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .map((t) => t.replace(/\.+$/, ""))
      .filter(Boolean),
  );
}

function numbers(text: string): Set<string> {
  return new Set(text.match(/\d+(?:[.,]\d+)*%?/g) ?? []);
}

/** Capitalized words, skipping the first word of each sentence. */
function properNouns(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).flatMap((sentence) => {
    const trimmed = sentence.trim();
    return [...trimmed.matchAll(/\b[A-Z][A-Za-z0-9+#.]*/g)]
      .filter((match) => match.index !== 0)
      .map((match) => match[0].replace(/\.+$/, "").toLowerCase());
  });
}

/** True when `suggestion` states a number, skill or name not found in `original`. */
export function introducesNewClaims(original: string, suggestion: string): boolean {
  const known = tokens(original);
  const knownNumbers = numbers(original);
  for (const n of numbers(suggestion)) if (!knownNumbers.has(n)) return true;
  for (const t of tokens(suggestion)) if (SKILL_TERMS.has(t) && !known.has(t)) return true;
  for (const word of properNouns(suggestion)) if (!known.has(word)) return true;
  return false;
}

/** Keep one suggestion per real bullet and flag any that add claims. */
export function finalizeRewrite(rewrite: Rewrite, resume: Resume): Rewrite {
  const ids = new Set(resume.sections.flatMap((s) => s.bullets.map((b) => b.id)));
  const original = resumeToPlainText(resume);
  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];

  for (const s of rewrite.suggestions) {
    if (!ids.has(s.bulletId) || seen.has(s.bulletId)) continue;
    seen.add(s.bulletId);
    suggestions.push({ ...s, verify: s.verify || introducesNewClaims(original, s.newText) });
  }
  return { suggestions };
}
