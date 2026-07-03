import { test, expect } from "@playwright/test";

test.describe.serial("Parcours candidature complet", () => {
  test("00 — créer données démo via /test-flow", async ({ page }) => {
    await page.goto("/test-flow");

    page.on("dialog", (dialog) => dialog.accept());

    // Supprimer d'abord pour repartir propre
    const deleteBtn = page.getByRole("button", { name: /Supprimer/i });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(2000);
    }

    // Créer données démo
    const createBtn = page.getByRole("button", { name: /Créer/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Vérifier message de succès
    const body = await page.locator("body").innerText();
    expect(
      body.includes("succès") ||
        body.includes("créées") ||
        body.includes("[DEMO]")
    ).toBeTruthy();
  });

  test("01 — opportunités : liste et détail", async ({ page }) => {
    await page.goto("/opportunites");
    await expect(page.locator("h1")).toContainText("Opportunités");

    const body = page.locator("body");
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(50);

    // Cliquer sur le premier lien d'opportunité si présent
    const oppLink = page.locator('a[href*="/opportunites/"]').first();
    if (await oppLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await oppLink.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("02 — analyse : page charge", async ({ page }) => {
    await page.goto("/analyse");
    await expect(page.locator("h1")).toContainText("Analyse");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(20);
  });

  test("03 — documents : page charge", async ({ page }) => {
    await page.goto("/documents");
    await expect(page.locator("h1")).toContainText("Documents");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(20);
  });

  test("04 — documents/templates : page charge", async ({ page }) => {
    await page.goto("/documents/templates");
    await expect(page.locator("body")).toContainText("Templates");
    await expect(page.locator("body")).toBeVisible();
  });

  test("05 — quality-check : page charge", async ({ page }) => {
    await page.goto("/quality-check");
    await expect(page.locator("body")).toContainText("Assistant qualité");
    await expect(page.locator("body")).toBeVisible();
  });

  test("06 — pipeline : page charge et colonnes visibles", async ({ page }) => {
    await page.goto("/pipeline");
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 5000 });
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(20);
    const lower = text.toLowerCase();
    expect(
      lower.includes("postuler") ||
        lower.includes("attente") ||
        lower.includes("entretien") ||
        lower.includes("pipeline")
    ).toBeTruthy();
  });

  test("07 — performance : KPIs chargent", async ({ page }) => {
    await page.goto("/performance");
    await expect(page.locator("h1")).toContainText("Performance");
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(30);
  });

  test("08 — entretiens : page charge", async ({ page }) => {
    await page.goto("/entretiens");
    await expect(page.locator("h1")).toContainText("Entretiens");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(20);
  });

  test("09 — cleanup : supprimer données démo", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/test-flow");
    const deleteBtn = page.getByRole("button", { name: /Supprimer/i });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();
    await page.waitForTimeout(2000);

    // Vérifier message de succès suppression
    const body = await page.locator("body").innerText();
    expect(
      body.includes("supprimé") ||
        body.includes("nettoy") ||
        body.includes("succès")
    ).toBeTruthy();
  });
});
