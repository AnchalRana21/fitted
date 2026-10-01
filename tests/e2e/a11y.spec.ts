import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("fitted-theme", t), theme);
    });

    test("home page has no WCAG violations", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expectNoViolations(page);
    });

    test("every tailor tab has no WCAG violations", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Try sample" }).click();
      await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();
      for (const tab of ["Analysis", "Rewrite", "Cover letter"]) {
        await page.getByRole("tab", { name: tab }).click();
        await expectNoViolations(page);
      }
    });

    test("history page has no WCAG violations", async ({ page }) => {
      await page.goto("/history");
      await expectNoViolations(page);
    });

    test("design-system page has no WCAG violations", async ({ page }) => {
      await page.goto("/design-system");
      await expect(page.getByRole("heading", { level: 1, name: "Fitted design system" })).toBeVisible();
      await expectNoViolations(page);
    });
  });
}
