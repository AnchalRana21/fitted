import { describe, expect, it } from "vitest";
import { finalizeRewrite, introducesNewClaims } from "@/lib/ai/verify";
import type { Resume } from "@/lib/schemas";

describe("introducesNewClaims", () => {
  const original = "Built dashboards in React used by 40 teams at Acme. Skills: Jest, Next.js";

  it("allows rewording with known facts", () => {
    expect(introducesNewClaims(original, "Built React dashboards for 40 teams at Acme.")).toBe(false);
    expect(introducesNewClaims(original, "Wrote Jest tests for Next.js pages.")).toBe(false);
  });

  it("flags new numbers", () => {
    expect(introducesNewClaims(original, "Cut bugs by 30%.")).toBe(true);
  });

  it("flags new skills even in lower case", () => {
    expect(introducesNewClaims(original, "Built dashboards with react and graphql.")).toBe(true);
  });

  it("flags new proper nouns but not the first word of a sentence", () => {
    expect(introducesNewClaims(original, "Shipped dashboards at Globex.")).toBe(true);
    expect(introducesNewClaims(original, "Improved dashboards. Shipped them faster.")).toBe(false);
  });
});

describe("introducesNewClaims extras", () => {
  it("flags newly added skill aliases", () => {
    expect(introducesNewClaims("Built APIs in Python", "Built APIs in Python and postgres")).toBe(true);
  });

  it("handles non-ASCII proper nouns", () => {
    expect(introducesNewClaims("Worked in Zürich", "Led a team in Zürich")).toBe(false);
    expect(introducesNewClaims("Worked in Zürich", "Led a team in Ørsted")).toBe(true);
  });

  it("never flags the pronoun I", () => {
    expect(introducesNewClaims("Built dashboards", "Built dashboards that I designed.")).toBe(false);
  });

  it("compares numbers and symbol skills exactly", () => {
    const original = "Used React, Next.js and C# for 1,200 users";
    expect(introducesNewClaims(original, "Used C#, React and Next.js for 1,200 users.")).toBe(false);
    expect(introducesNewClaims(original, "Used C#, React and Next.js for 1200 users.")).toBe(true);
  });
});

describe("finalizeRewrite", () => {
  const resume: Resume = {
    sections: [{ id: "s0", title: "Experience", bullets: [{ id: "s0-b0", text: "Built dashboards in React." }] }],
  };

  it("drops unknown and duplicate bullet ids and ORs the verify flag", () => {
    const result = finalizeRewrite(
      {
        suggestions: [
          { bulletId: "s0-b0", newText: "Built React dashboards for 12 teams.", reason: "r", verify: false },
          { bulletId: "s0-b0", newText: "Duplicate", reason: "r", verify: false },
          { bulletId: "nope", newText: "Unknown", reason: "r", verify: false },
        ],
      },
      resume,
    );
    expect(result.suggestions).toEqual([
      { bulletId: "s0-b0", newText: "Built React dashboards for 12 teams.", reason: "r", verify: true },
    ]);
  });
});
