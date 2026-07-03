import { describe, it, expect } from "vitest";
import { normalizeCompensationTarget } from "@/lib/cv-render/normalize-compensation";

describe("normalizeCompensationTarget", () => {
  // ─── Valeurs valides ─────────────────────

  it("accepts empty string", () => {
    const r = normalizeCompensationTarget("");
    expect(r.isValid).toBe(true);
    expect(r.min).toBeNull();
    expect(r.max).toBeNull();
    expect(r.displayValue).toBe("");
  });

  it("accepts free text negotiation", () => {
    const r = normalizeCompensationTarget("À discuter selon package");
    expect(r.isValid).toBe(true);
    expect(r.min).toBeNull();
    expect(r.displayValue).toBe("À discuter selon package");
  });

  it("accepts confidentiel", () => {
    const r = normalizeCompensationTarget("confidentiel");
    expect(r.isValid).toBe(true);
  });

  it("accepts 120-180K€ + variable 30%", () => {
    const r = normalizeCompensationTarget("120-180K€ + variable 30%");
    expect(r.isValid).toBe(true);
    expect(r.min).toBe(120);
    expect(r.max).toBe(180);
    expect(r.hasVariable).toBe(true);
    expect(r.displayValue).toContain("120");
    expect(r.displayValue).toContain("180");
  });

  it("accepts simple 150K€", () => {
    const r = normalizeCompensationTarget("150K€");
    expect(r.isValid).toBe(true);
    expect(r.min).toBe(150);
    expect(r.max).toBeNull();
  });

  it("accepts 120000 - 180000 EUR", () => {
    const r = normalizeCompensationTarget("120000 - 180000 EUR");
    expect(r.isValid).toBe(true);
    expect(r.min).toBe(120);
    expect(r.max).toBe(180);
  });

  it("detects USD currency", () => {
    const r = normalizeCompensationTarget("$150K-$200K + bonus");
    expect(r.isValid).toBe(true);
    expect(r.currency).toBe("USD");
    expect(r.hasVariable).toBe(true);
  });

  it("accepts 80K-120K€", () => {
    const r = normalizeCompensationTarget("80K-120K€");
    expect(r.isValid).toBe(true);
    expect(r.min).toBe(80);
    expect(r.max).toBe(120);
  });

  // ─── Valeurs invalides ───────────────────

  it("rejects 800-180K€ (mixed format)", () => {
    const r = normalizeCompensationTarget("800-180K€ + variable 30%");
    expect(r.isValid).toBe(false);
    expect(r.warning).toBeDefined();
    expect(r.warning!.toLowerCase()).toContain("incohérent");
  });

  it("rejects min > max (180-120K€)", () => {
    const r = normalizeCompensationTarget("180-120K€");
    expect(r.isValid).toBe(false);
    expect(r.warning).toBeDefined();
    expect(r.warning!.toLowerCase()).toContain("dépasse");
  });

  it("rejects aberrantly high value in K (5000K€)", () => {
    const r = normalizeCompensationTarget("5000K€");
    expect(r.isValid).toBe(false);
    expect(r.warning).toBeDefined();
    expect(r.warning!.toLowerCase()).toContain("anormalement");
  });

  // ─── Edge cases ──────────────────────────

  it("handles whitespace-only input", () => {
    const r = normalizeCompensationTarget("   ");
    expect(r.isValid).toBe(true);
    expect(r.min).toBeNull();
    expect(r.displayValue).toBe("");
  });

  it("handles text without numbers", () => {
    const r = normalizeCompensationTarget("selon profil et expérience");
    expect(r.isValid).toBe(true);
    expect(r.min).toBeNull();
  });

  it("handles single number with K", () => {
    const r = normalizeCompensationTarget("200K€ fixe");
    expect(r.isValid).toBe(true);
    expect(r.min).toBe(200);
    expect(r.max).toBeNull();
  });

  it("handles dots as thousands separator", () => {
    const r = normalizeCompensationTarget("120.000-180.000€");
    expect(r.isValid).toBe(true);
    expect(r.min).toBe(120);
    expect(r.max).toBe(180);
  });
});
