import { describe, it, expect } from "vitest";
import { humanLabel } from "@/lib/ux-mode";

describe("humanLabel", () => {
  it("maps semanticScore to simple label", () => {
    expect(humanLabel("semanticScore")).toBe("Score de compatibilité");
  });

  it("maps technical terms to plain language", () => {
    expect(humanLabel("USER_ASSISTED")).toBe("Import assisté");
    expect(humanLabel("AUTO_FIRECRAWL_SAFE")).toBe("Source publique vérifiée");
    expect(humanLabel("AUTO_RSS_FEED")).toBe("Flux RSS automatique");
    expect(humanLabel("AUTO_OFFICIAL_API")).toBe("API officielle");
    expect(humanLabel("AUTO_BROWSER_AGENT")).toBe("Agent navigateur");
  });

  it("maps recommendation codes", () => {
    expect(humanLabel("highly_recommended")).toBe("Très pertinent");
    expect(humanLabel("recommended")).toBe("Pertinent");
    expect(humanLabel("possible")).toBe("Possible");
    expect(humanLabel("low_priority")).toBe("Faible priorité");
  });

  it("maps pipeline statuses", () => {
    expect(humanLabel("draft")).toBe("Brouillon");
    expect(humanLabel("ready_to_review")).toBe("Prêt à vérifier");
    expect(humanLabel("approved")).toBe("Approuvé");
    expect(humanLabel("sent")).toBe("Envoyé");
    expect(humanLabel("rejected")).toBe("Non retenu");
  });

  it("maps feature names", () => {
    expect(humanLabel("Firecrawl Safe")).toBe("Source publique");
    expect(humanLabel("Safe Source Registry")).toBe("Sources vérifiées");
    expect(humanLabel("Market Radar")).toBe("Scanner");
    expect(humanLabel("Proof Vault")).toBe("Preuves");
  });

  it("returns same string for unknown terms", () => {
    expect(humanLabel("unknown_term")).toBe("unknown_term");
    expect(humanLabel("")).toBe("");
  });
});
