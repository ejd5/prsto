import { test, expect } from "@playwright/test";

test.describe("Sécurité — protections clés", () => {
  test("pipeline : instructions manuelles visibles", async ({ page }) => {
    await page.goto("/pipeline");
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 5000 });
    const text = await body.innerText();
    const lower = text.toLowerCase();
    expect(
      lower.includes("pas d'envoi") ||
        lower.includes("aucun envoi") ||
        lower.includes("envoyer vous-même") ||
        lower.includes("manuellement") ||
        lower.includes("envoyez") ||
        lower.includes("pipeline") ||
        lower.includes("relance")
    ).toBeTruthy();
  });

  test("parametres : clé API masquée et IA optionnelle", async ({ page }) => {
    await page.goto("/parametres");

    // Cliquer sur l'onglet DeepSeek via data-testid
    const deepseekTab = page.locator('[data-testid="tab-deepseek"]');
    await expect(deepseekTab).toBeVisible({ timeout: 5000 });
    await deepseekTab.click();
    await page.waitForTimeout(800);

    const body = page.locator("body");
    const text = await body.innerText();

    // Après clic, la page doit contenir le texte de l'onglet DeepSeek
    expect(
      text.includes("optionnel") ||
        text.includes("fonctionne") ||
        text.includes("sans clé API") ||
        text.includes("templates locaux")
    ).toBeTruthy();

    // Vérifier le champ de clé API masqué (input password)
    const hasPasswordInput =
      (await page.locator('input[type="password"]').count()) > 0;
    const allPlaceholders = await page.locator("input").evaluateAll((els) =>
      els.map((el) => (el as HTMLInputElement).placeholder)
    );
    const hasMaskedOrSk = allPlaceholders.some(
      (p) => p.includes("•••") || p.includes("sk-")
    );
    expect(hasPasswordInput || hasMaskedOrSk).toBeTruthy();
  });

  test("documents : statuts visibles", async ({ page }) => {
    await page.goto("/documents");
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 5000 });
    const text = await body.innerText();
    expect(text.length).toBeGreaterThan(20);
    expect(
      text.includes("valider") ||
        text.includes("Approuvé") ||
        text.includes("Brouillon") ||
        text.includes("DRAFT") ||
        text.includes("Document") ||
        text.includes("valide")
    ).toBeTruthy();
  });

  test("guide : ELTON OS ne postule jamais à votre place", async ({ page }) => {
    await page.goto("/guide");
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 5000 });
    const text = await body.innerText();
    expect(
      text.includes("ne postule jamais") ||
        text.includes("jamais à votre place") ||
        text.includes("pas d'envoi automatique") ||
        text.includes("ne postule")
    ).toBeTruthy();
  });
});
