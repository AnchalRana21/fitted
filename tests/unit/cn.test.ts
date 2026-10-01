import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins and drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
  it("lets later utilities win over earlier conflicting ones", () => {
    expect(cn("px-4 bg-surface", "bg-primary")).toBe("px-4 bg-primary");
  });
  it("treats animate-flash as an animation so a later animation replaces it", () => {
    expect(cn("animate-flash", "animate-pulse")).toBe("animate-pulse");
  });
});
