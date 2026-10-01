// Captures README screenshots. Expects `MOCK_AI=1 npm run start -- --port 3100` to be running.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:3100";
const OUT = "docs/screenshots";
const settle = (page, ms = 600) => page.waitForTimeout(ms);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

async function newPage(theme, viewport) {
  const context = await browser.newContext({ viewport, colorScheme: theme });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("fitted-theme", t);
    } catch {}
  }, theme);
  return { context, page: await context.newPage() };
}

for (const theme of ["light", "dark"]) {
  {
    const { context, page } = await newPage(theme, { width: 1280, height: 860 });
    await page.goto(BASE, { waitUntil: "load" });
    await settle(page);
    await page.screenshot({ path: `${OUT}/home-${theme}.png` });
    await context.close();
  }
  {
    const { context, page } = await newPage(theme, { width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "load" });
    await page.getByRole("button", { name: "Try sample" }).click();
    await page.getByRole("img", { name: /Match score/ }).waitFor();
    await page.getByRole("tab", { name: "Rewrite" }).click();
    const first = page.getByRole("tabpanel", { name: "Rewrite" }).getByRole("button", { name: "Accept", exact: true }).first();
    await first.click();
    await settle(page, 2500);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${OUT}/workspace-${theme}.png`, fullPage: true });
    await context.close();
  }
}

{
  const { context, page } = await newPage("light", { width: 1280, height: 860 });
  await page.goto(`${BASE}/design-system`, { waitUntil: "load" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/design-system-light.png` });
  await context.close();
}

await browser.close();
