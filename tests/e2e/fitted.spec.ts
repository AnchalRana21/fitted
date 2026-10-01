import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import sample from "../../fixtures/sample-run.json";

async function fillAndSubmit(page: Page) {
  await page.goto("/");
  await page.getByLabel("Resume text").fill(sample.resumeText);
  await page.getByLabel("Job description").fill(sample.job);
  await page.getByRole("button", { name: "Tailor my resume" }).click();
}

test("sample run: review, accept and export", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample" }).click();
  await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();

  await page.getByRole("tab", { name: "Rewrite" }).click();
  await expect(page.getByRole("article")).toHaveCount(5);
  await expect(page.getByRole("tabpanel", { name: "Rewrite" }).getByText("Check this: it adds a detail")).toHaveCount(1);

  const first = page.getByRole("article").first();
  await first.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(first.getByRole("button", { name: "Accept", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("tab", { name: "Export" }).click();
  // Tab panels stay mounted (hidden when inactive), so scope to the Export panel.
  const exportPanel = page.getByRole("tabpanel", { name: "Export" });
  await expect(exportPanel.getByText(sample.rewrite.suggestions[0].newText)).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("alex-morgan-resume.pdf");
  const bytes = await fs.promises.readFile(await download.path());
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(1000);
});

test("pasted resume streams analysis and suggestions from the API", async ({ page }) => {
  await fillAndSubmit(page);
  await expect(page.getByRole("heading", { name: "Frontend Engineer — Brightline Health" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();
  await page.getByRole("tab", { name: "Rewrite" }).click();
  await expect(page.getByRole("article")).toHaveCount(5);
  await expect(page.getByText(/0 of 5 changes accepted/)).toBeVisible();
});

test("accept-all skips flagged suggestions and is keyboard operable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample" }).click();
  await page.getByRole("tab", { name: "Rewrite" }).click();
  const acceptAll = page.getByRole("button", { name: "Accept all safe changes in Experience" });
  await acceptAll.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/2 of 5 changes accepted/)).toBeVisible();
});

test("uploaded PDF fills the resume text", async ({ page, context }) => {
  const maker = await context.newPage();
  await maker.setContent(`<pre style="font-family: Helvetica">${sample.resumeText}</pre>`);
  const buffer = await maker.pdf();
  await maker.close();

  await page.goto("/");
  await page.locator("#resume-file").setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer });
  await expect(page.getByText("Loaded resume.pdf")).toBeVisible();
  await expect(page.getByLabel("Resume text")).toHaveValue(/Acme Analytics/);
});

test("rate limit shows the reset time and offers the sample", async ({ page }) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ code: "rate_limited", message: "x", reset: Date.now() + 3_600_000 }),
    }),
  );
  await fillAndSubmit(page);
  // Next.js's route announcer also has role="alert", so match by text.
  const alert = page.getByRole("alert").filter({ hasText: "free AI runs" });
  await expect(alert).toContainText("You've used today's free AI runs");
  await expect(alert.getByRole("link", { name: "Try the sample from the home page" })).toBeVisible();
});

test("history lists and deletes runs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample" }).click();
  await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText("Match 72/100")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /^Delete Sample/ }).click();
  await expect(page.getByText("No tailored resumes yet")).toBeVisible();
});
