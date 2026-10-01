import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-run.json";
import { diffParts } from "@/lib/diff";
import { parseSections } from "@/lib/parse/sections";

const join = (parts: { text: string }[]) => parts.map((p) => p.text).join("");

describe("diffParts", () => {
  const resume = parseSections(sample.resumeText);
  const originals = new Map(resume.sections.flatMap((s) => s.bullets.map((b) => [b.id, b.text] as const)));

  it("reconstructs both sides exactly for every sample suggestion", () => {
    expect(sample.rewrite.suggestions.length).toBeGreaterThan(0);
    for (const s of sample.rewrite.suggestions) {
      const original = originals.get(s.bulletId)!;
      expect(original).toBeDefined();
      const result = diffParts(original, s.newText);
      expect(join(result.original)).toBe(original);
      expect(join(result.suggested)).toBe(s.newText);
    }
  });

  it("does not leave a space before trailing punctuation", () => {
    const result = diffParts(
      "Built dashboards in React used by 40 internal teams.",
      "Built React dashboards used by 40 internal teams to explore analytics data.",
    );
    expect(join(result.original)).not.toContain(" .");
    expect(join(result.original)).toBe("Built dashboards in React used by 40 internal teams.");
    expect(join(result.suggested)).toBe("Built React dashboards used by 40 internal teams to explore analytics data.");
  });

  it("merges adjacent parts and never marks bare whitespace as changed", () => {
    const result = diffParts("a b c", "a x y c");
    for (const side of [result.original, result.suggested]) {
      for (const p of side) if (!p.text.trim()) expect(p.changed).toBe(false);
      side.forEach((p, i) => {
        if (i > 0) expect(p.changed).not.toBe(side[i - 1].changed);
      });
    }
  });

  it("trims whitespace from highlight edges and bridges small gaps", () => {
    const o = "Weather app using Next.js and a public API.";
    const n = "Built a weather app in Next.js that shows data from a public API.";
    const result = diffParts(o, n);
    expect(join(result.original)).toBe(o);
    expect(join(result.suggested)).toBe(n);
    for (const side of [result.original, result.suggested]) {
      for (const p of side.filter((x) => x.changed)) expect(p.text).toBe(p.text.trim());
    }
    expect(result.suggested.filter((p) => p.changed).map((p) => p.text)).toContain("Built a weather");
  });

  it("highlights only the added words at the end", () => {
    const result = diffParts(
      "Built React dashboards used by 40 internal teams.",
      "Built React dashboards used by 40 internal teams to explore analytics data.",
    );
    expect(result.suggested.filter((p) => p.changed).map((p) => p.text)).toEqual(["to explore analytics data"]);
  });
});
