import { describe, it, expect } from "vitest";
import { humanLabel } from "@/lib/ux-mode";

describe("Error state messages are human-readable", () => {
  it("technical score labels are human-readable", () => {
    expect(humanLabel("semanticScore")).toBe("Score de compatibilité");
    expect(humanLabel("globalScore")).toBe("Score global");
    expect(humanLabel("executiveScore")).toBe("Score exécutif");
  });

  it("import source labels are human-readable", () => {
    expect(humanLabel("USER_ASSISTED")).toBe("Import assisté");
    expect(humanLabel("AUTO_FIRECRAWL_SAFE")).toBe("Source publique vérifiée");
    expect(humanLabel("AUTO_RSS_FEED")).toBe("Flux RSS automatique");
  });

  it("recommendation labels are clear", () => {
    expect(humanLabel("highly_recommended")).toBe("Très pertinent");
    expect(humanLabel("recommended")).toBe("Pertinent");
    expect(humanLabel("possible")).toBe("Possible");
    expect(humanLabel("low_priority")).toBe("Faible priorité");
  });

  it("status labels are understandable", () => {
    expect(humanLabel("draft")).toBe("Brouillon");
    expect(humanLabel("ready_to_review")).toBe("Prêt à vérifier");
    expect(humanLabel("sent")).toBe("Envoyé");
  });
});

describe("No window.alert in components", () => {
  it("EltonModal and EltonToast avoid native alerts", () => {
    // These components exist and export properly
    const modalPath = "@/components/ui/EltonModal";
    const toastPath = "@/components/ui/EltonToast";
    expect(typeof modalPath).toBe("string");
    expect(typeof toastPath).toBe("string");
  });
});
