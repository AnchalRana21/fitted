import type { Resume, Rewrite, Suggestion } from "@/lib/schemas";

export type DecisionStatus = "pending" | "accepted" | "rejected";
export type Decision = { status: DecisionStatus; text: string };
export type Decisions = Record<string, Decision>;

export function initialDecisions(rewrite: Rewrite): Decisions {
  return Object.fromEntries(rewrite.suggestions.map((s) => [s.bulletId, { status: "pending", text: s.newText }]));
}

export function applyDecisions(resume: Resume, decisions: Decisions): Resume {
  return {
    sections: resume.sections.map((section) => ({
      ...section,
      bullets: section.bullets.map((bullet) => {
        const decision = decisions[bullet.id];
        return decision?.status === "accepted" ? { ...bullet, text: decision.text } : bullet;
      }),
    })),
  };
}

/** Accept pending suggestions in `suggestions`, except ones flagged for checking. */
export function acceptAllSafe(decisions: Decisions, suggestions: Suggestion[]): Decisions {
  const next = { ...decisions };
  for (const s of suggestions) {
    const current = next[s.bulletId];
    if (current?.status === "pending" && !s.verify) next[s.bulletId] = { ...current, status: "accepted" };
  }
  return next;
}

export function resetDecisions(decisions: Decisions, suggestions: Suggestion[]): Decisions {
  const next = { ...decisions };
  for (const s of suggestions) next[s.bulletId] = { status: "pending", text: s.newText };
  return next;
}
