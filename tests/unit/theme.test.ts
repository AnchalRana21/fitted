import { describe, expect, it } from "vitest";
import { resolveTheme, THEME_SCRIPT } from "@/lib/theme";

describe("resolveTheme", () => {
  it("prefers a stored choice", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("falls back to the system setting", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("bogus", false)).toBe("light");
  });
  it("ships an inline script that sets data-theme", () => {
    expect(THEME_SCRIPT).toContain("data-theme");
    expect(THEME_SCRIPT).toContain("fitted-theme");
  });
  it("still consults the system preference when storage is blocked", () => {
    expect(THEME_SCRIPT).toContain("prefers-color-scheme");
  });
});
