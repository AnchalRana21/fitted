import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOKENS } from "@/lib/design-tokens";

const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

function parseBlock(selectorPattern: RegExp): Record<string, string> {
  const match = selectorPattern.exec(css);
  if (!match) throw new Error(`Block not found: ${selectorPattern}`);
  const out: Record<string, string> = {};
  for (const m of match[1].matchAll(/--c-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2].toLowerCase();
  return out;
}

const light = parseBlock(/^:root\s*\{([^}]*)\}/m);
const dark = parseBlock(/^\[data-theme="dark"\]\s*\{([^}]*)\}/m);
const documented = TOKENS.flatMap((g) => g.tokens);

describe("design tokens documented on /design-system", () => {
  it("parses tokens from both theme blocks", () => {
    expect(Object.keys(light).length).toBeGreaterThan(0);
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it("documents exactly the tokens defined in globals.css", () => {
    expect(documented.map((t) => t.name).sort()).toEqual(Object.keys(light).sort());
  });

  it.each(documented.map((t) => [t.name, t] as const))("%s matches light and dark values", (name, token) => {
    expect(token.light.toLowerCase()).toBe(light[name]);
    expect(token.dark.toLowerCase()).toBe(dark[name]);
  });
});
