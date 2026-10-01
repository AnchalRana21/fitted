import { describe, expect, it } from "vitest";
import { acceptAllSafe, applyDecisions, initialDecisions, resetDecisions } from "@/lib/apply";
import type { Resume, Suggestion } from "@/lib/schemas";

const resume: Resume = {
  sections: [
    {
      id: "s0",
      title: "Experience",
      bullets: [
        { id: "s0-b0", text: "Old one" },
        { id: "s0-b1", text: "Old two" },
      ],
    },
  ],
};
const suggestions: Suggestion[] = [
  { bulletId: "s0-b0", newText: "New one", reason: "r", verify: false },
  { bulletId: "s0-b1", newText: "New two with 50%", reason: "r", verify: true },
];

describe("decisions", () => {
  it("starts every suggestion as pending", () => {
    expect(initialDecisions({ suggestions })).toEqual({
      "s0-b0": { status: "pending", text: "New one" },
      "s0-b1": { status: "pending", text: "New two with 50%" },
    });
  });

  it("applies only accepted decisions, using their (possibly edited) text", () => {
    const result = applyDecisions(resume, {
      "s0-b0": { status: "accepted", text: "Edited one" },
      "s0-b1": { status: "rejected", text: "New two with 50%" },
    });
    expect(result.sections[0].bullets.map((b) => b.text)).toEqual(["Edited one", "Old two"]);
  });

  it("accept-all skips suggestions flagged for checking", () => {
    const next = acceptAllSafe(initialDecisions({ suggestions }), suggestions);
    expect(next["s0-b0"].status).toBe("accepted");
    expect(next["s0-b1"].status).toBe("pending");
  });

  it("reset restores pending status and the suggested text", () => {
    const next = resetDecisions({ "s0-b0": { status: "accepted", text: "Edited" } }, suggestions.slice(0, 1));
    expect(next["s0-b0"]).toEqual({ status: "pending", text: "New one" });
  });
});
