import { test, expect } from "@playwright/test";

test.describe("1. Dashboard lisible", () => {
  test("01.1 — Dashboard charge sans crash", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    const text = await page.locator("body").innerText();
    expect(text).toContain("ELTON OS");
    expect(text.length).toBeGreaterThan(50);
  });

  test("01.2 — Navigation principale visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    await expect(sidebar).toContainText("Home");
    await expect(sidebar).toContainText("AI Briefing");
    await expect(sidebar).toContainText("Signal Feed");
    await expect(sidebar).toContainText("Market Watch");
    await expect(sidebar).toContainText("Recruiter Intel");
    await expect(sidebar).toContainText("Interview Studio");
    await expect(sidebar).toContainText("Documents AI");
    await expect(sidebar).toContainText("Strategy Lab");
    await expect(sidebar).toContainText("Decision Support");
  });

  test("01.3 — Bouton Sourcing / Import Express visible", async ({ page }) => {
    await page.goto("/dashboard/jobs", { waitUntil: "domcontentloaded" });
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 10000 });
    await expect(body).toContainText("Import Express");
  });

  test("01.4 — Profil page accessible", async ({ page }) => {
    const res = await page.goto("/profil", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 10000 });
    expect((await body.innerText()).length).toBeGreaterThan(30);
  });

  test("01.5 — Aucun texte d'erreur brut", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    // Allow some known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("404") && !e.includes("Failed to load")
    );
    expect(criticalErrors.length).toBe(0);
  });
});
