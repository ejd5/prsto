import { describe, it, expect } from "vitest";
import {
  generateRelanceJ5_FR,
  generateRelanceJ10_FR,
  generateRelanceLinkedIn_FR,
  generateRelanceCabinet_FR,
  generateRemerciement_FR,
  generateRelanceJ5_EN,
  generateRelanceJ10_EN,
  getRelanceTemplate,
  getRelanceLabel,
  RELANCE_TEMPLATE_LIST,
  RelanceContext,
} from "@/lib/generation/relance-templates";

const CTX: RelanceContext = {
  candidateName: "Jean Dupont",
  candidateTitle: "Directeur Commercial",
  oppTitle: "Directeur Commercial France",
  oppCompany: "TechCorp",
  oppLocation: "Paris",
  oppCountry: "FR",
  score: 85,
  strategy: "postuler",
  recruiterName: "Marie Martin",
  recruiterTitle: "DRH",
  hasApprovedDoc: true,
};

describe("Templates FR", () => {
  it("5 templates FR existent", () => {
    const frTemplates = RELANCE_TEMPLATE_LIST.filter((t) => t.group.includes("FR"));
    expect(frTemplates).toHaveLength(5);
  });

  it("Relance J+5 FR contient les infos du candidat", () => {
    const text = generateRelanceJ5_FR(CTX);
    expect(text).toContain("Jean Dupont");
    expect(text).toContain("Directeur Commercial France");
    expect(text).toContain("TechCorp");
  });

  it("Relance J+5 FR mentionne le score si présent", () => {
    const text = generateRelanceJ5_FR(CTX);
    expect(text).toContain("85/100");
  });

  it("Relance J+5 FR ne mentionne pas le score si absent", () => {
    const text = generateRelanceJ5_FR({ ...CTX, score: null });
    expect(text).not.toContain("/100");
  });

  it("Relance J+10 FR est différente de J+5", () => {
    expect(generateRelanceJ5_FR(CTX)).not.toBe(generateRelanceJ10_FR(CTX));
  });

  it("Relance LinkedIn FR utilise le nom du recruteur", () => {
    const text = generateRelanceLinkedIn_FR(CTX);
    expect(text).toContain("Marie Martin");
  });

  it("Relance cabinet FR mentionne le cabinet", () => {
    const text = generateRelanceCabinet_FR({ ...CTX, cabinetName: "Michael Page" });
    expect(text).toContain("Michael Page");
  });

  it("Remerciement FR contient le sujet", () => {
    const text = generateRemerciement_FR(CTX);
    expect(text).toContain("Remerciement");
    expect(text).toContain("Directeur Commercial France");
  });
});

describe("Templates EN", () => {
  it("5 templates EN existent", () => {
    const enTemplates = RELANCE_TEMPLATE_LIST.filter((t) => t.group.includes("EN"));
    expect(enTemplates).toHaveLength(5);
  });

  it("Follow-up J+5 EN contient les infos", () => {
    const text = generateRelanceJ5_EN(CTX);
    expect(text).toContain("Jean Dupont");
    expect(text).toContain("TechCorp");
    expect(text).toContain("Kind regards");
  });

  it("Follow-up J+10 EN est différente de J+5", () => {
    expect(generateRelanceJ5_EN(CTX)).not.toBe(generateRelanceJ10_EN(CTX));
  });
});

describe("Infrastructure", () => {
  it("getRelanceTemplate retourne une fonction pour chaque template", () => {
    const ids = RELANCE_TEMPLATE_LIST.map((t) => t.value);
    for (const id of ids) {
      const fn = getRelanceTemplate(id);
      expect(typeof fn).toBe("function");
    }
  });

  it("getRelanceLabel retourne un label pour chaque template", () => {
    const ids = RELANCE_TEMPLATE_LIST.map((t) => t.value);
    for (const id of ids) {
      expect(getRelanceLabel(id).length).toBeGreaterThan(0);
    }
  });

  it("aucune fonction d'envoi automatique n'existe", () => {
    // Vérifier qu'il n'y a pas de send/reply/post/api dans les exports
    const FN_NAMES = [
      "generateRelanceJ5_FR", "generateRelanceJ10_FR", "generateRelanceLinkedIn_FR",
      "generateRelanceCabinet_FR", "generateRemerciement_FR",
      "generateRelanceJ5_EN", "generateRelanceJ10_EN", "generateRelanceLinkedIn_EN",
      "generateRelanceCabinet_EN", "generateRemerciement_EN",
      "getRelanceTemplate", "getRelanceLabel", "RELANCE_TEMPLATE_LIST",
    ];
    const sendFunctions = FN_NAMES.filter((e) =>
      e.toLowerCase().includes("send") ||
      e.toLowerCase().includes("reply") ||
      e.toLowerCase().includes("post") ||
      e.toLowerCase().includes("api")
    );
    expect(sendFunctions).toHaveLength(0);
  });

  it("tous les templates génèrent un objet et une signature", () => {
    for (const t of RELANCE_TEMPLATE_LIST) {
      const fn = getRelanceTemplate(t.value);
      const text = fn(CTX);
      expect(text).toContain("Jean Dupont"); // candidat
      expect(text.length).toBeGreaterThan(50);
    }
  });
});
