import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
}

test("home page has no WCAG violations", async ({ page }) => {
  await page.goto("/");
  await expectNoViolations(page);
});

test("every tailor tab has no WCAG violations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample" }).click();
  await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();
  for (const tab of ["Analysis", "Rewrite", "Cover letter", "Export"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expectNoViolations(page);
  }
});

test("history page has no WCAG violations", async ({ page }) => {
  await page.goto("/history");
  await expectNoViolations(page);
});
