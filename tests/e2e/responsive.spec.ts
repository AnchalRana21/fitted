import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.use({ viewport: { width: 390, height: 844 } });

async function expectNoOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("header fits on one row at phone width", async ({ page }) => {
  await page.goto("/");
  await expectNoOverflow(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "History" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Design system" })).toBeVisible();
  const box = await page.locator("header").boundingBox();
  expect(box?.height).toBeLessThanOrEqual(57);
  const navOverflow = await nav.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(navOverflow).toBeLessThanOrEqual(0);
});

for (const theme of ["light", "dark"] as const) {
  test(`populated history list fits at phone width (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("fitted-theme", t), theme);
    await page.goto("/");
    await page.getByRole("button", { name: "Try sample" }).click();
    await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();
    await page.goto("/history");
    const del = page.getByRole("button", { name: /^Delete / }).first();
    await expect(del).toBeVisible();
    await expectNoOverflow(page);
    const box = await del.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });
}
