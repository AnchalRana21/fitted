import { expect, test } from "@playwright/test";

test("follows the system dark setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("toggle switches theme and persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("design-system page documents the tokens", async ({ page }) => {
  await page.goto("/design-system");
  await expect(page.getByRole("heading", { level: 1, name: "Fitted design system" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Colour", exact: true })).toBeVisible();
});
