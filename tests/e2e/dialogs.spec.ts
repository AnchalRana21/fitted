import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import sample from "../../fixtures/sample-run.json";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function forbidNativeDialogs(page: Page) {
  page.on("dialog", () => {
    throw new Error("native dialog opened");
  });
}

/** Saves the sample run, then opens History with its row visible. */
async function openHistoryWithSample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample" }).click();
  await expect(page.getByRole("img", { name: "Match score 72 out of 100" })).toBeVisible();
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByText("Match 72/100")).toBeVisible();
}

test("history delete: Cancel keeps the run and returns focus to its Delete button", async ({ page }) => {
  forbidNativeDialogs(page);
  await openHistoryWithSample(page);
  const deleteButton = page.getByRole("button", { name: /^Delete Sample/ });
  await deleteButton.click();
  const dialog = page.getByRole("alertdialog", { name: "Delete this run?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Sample:/ })).toBeVisible();
  await expect(deleteButton).toBeFocused();
});

test("history delete: Escape closes without deleting", async ({ page }) => {
  forbidNativeDialogs(page);
  await openHistoryWithSample(page);
  await page.getByRole("button", { name: /^Delete Sample/ }).click();
  const dialog = page.getByRole("alertdialog", { name: "Delete this run?" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Sample:/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /^Sample:/ })).toBeVisible();
});

test("history delete: removing the only run focuses the empty state's Start one link", async ({ page }) => {
  forbidNativeDialogs(page);
  await openHistoryWithSample(page);
  await expect(page.getByRole("link", { name: /^Sample:/ })).toHaveCount(1);
  await page.getByRole("button", { name: /^Delete Sample/ }).click();
  await page.getByRole("alertdialog", { name: "Delete this run?" }).getByRole("button", { name: "Delete run" }).click();
  await expect(page.getByText("No tailored resumes yet")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start one" })).toBeFocused();
});

test("cover letter: replacing asks first; Cancel keeps edits, confirm rewrites", async ({ page }) => {
  forbidNativeDialogs(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Try sample" }).click();
  await page.getByRole("tab", { name: "Cover letter" }).click();
  const letter = page.locator("#cover-letter");
  await expect(letter).toHaveValue(sample.coverLetter);
  const edited = `${sample.coverLetter}\nP.S. My own edit.`;
  await letter.fill(edited);

  const write = page.getByRole("button", { name: "Write a new version" });
  await write.click();
  const dialog = page.getByRole("alertdialog", { name: "Replace your cover letter?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(letter).toHaveValue(edited);

  await write.click();
  await dialog.getByRole("button", { name: "Write new version" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(letter).toHaveValue(sample.coverLetter);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  test(`history delete dialog has no WCAG violations (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("fitted-theme", t), theme);
    await openHistoryWithSample(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.getByRole("button", { name: /^Delete Sample/ }).click();
    await expect(page.getByRole("alertdialog", { name: "Delete this run?" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
    expect(results.violations).toEqual([]);
  });
}
