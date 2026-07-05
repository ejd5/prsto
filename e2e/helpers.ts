import { expect, type Page } from "@playwright/test";

/**
 * Create demo data via /test-flow page.
 */
export async function setupDemoData(page: Page) {
  await page.goto("/test-flow");

  // Handle confirm dialogs (test-flow still uses native confirm)
  page.on("dialog", (dialog) => dialog.accept());

  // Wait for page to render
  await page.waitForTimeout(2000);

  // Delete existing demo data first if "Supprimer" button exists
  const deleteBtn = page.getByRole("button", { name: /Supprimer/i });
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(3000);
    await page.goto("/test-flow");
    await page.waitForTimeout(2000);
  }

  // Click "Créer données démo" button
  const createBtn = page.getByRole("button", { name: /Créer les données démo|Créer données démo|Créer/i }).first();
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  // Wait for creation — check for toast via DOM (not dialog)
  await page.waitForTimeout(5000);

  // Navigate away and back to confirm data exists
  await page.goto("/dashboard/jobs");
  await page.waitForTimeout(3000);
}

/**
 * Delete demo data after tests.
 */
export async function teardownDemoData(page: Page) {
  await page.goto("/test-flow");
  page.on("dialog", (dialog) => dialog.accept());

  const deleteBtn = page.getByRole("button", { name: /Supprimer/i });
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(3000);
  }
}

/**
 * Navigate to a page and wait for body to be visible.
 */
export async function navigateAndWait(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 15000 });
  expect(res?.status()).toBe(200);
  const body = page.locator("body");
  await expect(body).toBeVisible({ timeout: 10000 });
  return body;
}
