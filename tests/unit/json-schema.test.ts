import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toApiSchema } from "@/lib/ai/json-schema";
import { tryParsePartial } from "@/lib/ai/partial";
import { AnalysisSchema } from "@/lib/schemas";

describe("toApiSchema", () => {
  it("removes constraints the API rejects but keeps property names", () => {
    const schema = toApiSchema(
      z.strictObject({ score: z.number().int().min(0).max(100), minimum: z.string().min(1) }),
    );
    expect(schema).toEqual({
      type: "object",
      properties: { score: { type: "integer" }, minimum: { type: "string" } },
      required: ["score", "minimum"],
      additionalProperties: false,
    });
  });

  it("produces a closed object for the analysis schema", () => {
    const schema = toApiSchema(AnalysisSchema) as { additionalProperties: boolean; required: string[] };
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain("score");
    expect(JSON.stringify(schema)).not.toContain("maximum");
  });
});

describe("tryParsePartial", () => {
  it("parses incomplete JSON", () => {
    expect(tryParsePartial('{"score": 72, "matchedSkills": ["Rea')).toEqual({ score: 72, matchedSkills: ["Rea"] });
  });

  it("returns undefined for empty or unusable text", () => {
    expect(tryParsePartial("")).toBeUndefined();
    expect(tryParsePartial("not json")).toBeUndefined();
  });
});
