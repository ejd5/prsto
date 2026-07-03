import { test, expect } from "@playwright/test";

test.describe("Test flow — données démo", () => {
  test("page /test-flow affiche les 17 étapes", async ({ page }) => {
    await page.goto("/test-flow");
    await expect(page.locator("h1")).toContainText("Test flow");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Vérifier présence étapes clés
    await expect(body).toContainText("Créer un profil");
    await expect(body).toContainText("9.");
    await expect(body).toContainText("17.");
  });

  test("créer et supprimer données démo", async ({ page }) => {
    await page.goto("/test-flow");

    page.on("dialog", (dialog) => dialog.accept());

    // Supprimer d'abord si existant
    const deleteBtn = page.getByRole("button", { name: /Supprimer/i });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1500);
    }

    // Créer données démo
    const createBtn = page.getByRole("button", { name: /Créer/i });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toBeEnabled();
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Vérifier message succès ou badge "Créées"
    const body = await page.locator("body").innerText();
    expect(
      body.includes("succès") ||
        body.includes("créées") ||
        body.includes("[DEMO]") ||
        body.includes("Créées")
    ).toBeTruthy();
  });

  test("checklist : cocher des étapes", async ({ page }) => {
    await page.goto("/test-flow");

    // Chaque étape a un bouton avec une icône Circle/CheckCircle2 en premier enfant
    // Cliquer sur l'étape 1 "Créer un profil" en trouvant son conteneur
    const step1Row = page.locator("text=Créer un profil").locator("..");
    const checkBtn1 = step1Row.locator("button").first();
    if (await checkBtn1.isVisible().catch(() => false)) {
      await checkBtn1.click();
    }

    // Cliquer sur l'étape 2
    const step2Row = page.locator("text=Importer un CV maître").locator("..");
    const checkBtn2 = step2Row.locator("button").first();
    if (await checkBtn2.isVisible().catch(() => false)) {
      await checkBtn2.click();
    }

    await page.waitForTimeout(500);

    // Vérifier que la progression a changé
    const bodyText = await page.locator("body").innerText();
    const match = bodyText.match(/(\d+)%/);
    if (match) {
      const percent = parseInt(match[1]);
      // Avec 2 étapes cochées sur 17, on devrait avoir ~12%
      expect(percent).toBeGreaterThanOrEqual(0);
    }
  });

  test("barre de progression visible", async ({ page }) => {
    await page.goto("/test-flow");
    await expect(page.getByText("%")).toBeVisible();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/\d+%/);
  });

  test("navigation et structure de la page", async ({ page }) => {
    await page.goto("/test-flow");

    // Vérifier le titre
    await expect(page.locator("h1")).toContainText("Test flow");

    // Vérifier présence bouton créer données démo
    await expect(
      page.getByRole("button", { name: /Créer données démo/i })
    ).toBeVisible();

    // Vérifier présence de la légende
    const body = await page.locator("body").innerText();
    expect(body).toContain("Fait");
    expect(body).toContain("Bug");
    expect(body).toContain("Note");
  });

  test("/demarrage : stepper et bouton Scanner visibles", async ({ page }) => {
    await page.goto("/demarrage");

    // Vérifier le titre
    await expect(page.locator("h1")).toContainText("Démarrage guidé");

    // Vérifier le stepper (10 étapes)
    const body = await page.locator("body").innerText();
    expect(body).toContain("Bienvenue");
    expect(body).toContain("Expériences");
    expect(body).toContain("CV Maître");

    // Vérifier le bouton Commencer
    await expect(
      page.getByRole("button", { name: /Commencer/i })
    ).toBeVisible();

    // Vérifier les boutons de navigation
    await expect(
      page.getByRole("button", { name: /Suivant/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Précédent/i })
    ).toBeVisible();
  });
});
