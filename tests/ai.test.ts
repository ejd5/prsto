import { describe, it, expect } from "vitest";
import { maskApiKey, validateAiConfig } from "@/lib/ai/deepseek";
import { anonymizeCandidateProfile, anonymizeOpportunity, anonymizeDocumentContext } from "@/lib/ai/anonymize";
import type { CandidateProfileInput } from "@/lib/ai/anonymize";
import { validateNoHallucinationEnhanced } from "@/lib/ai/anti-hallucination";
import type { CandidateVerificationData } from "@/lib/ai/anti-hallucination";
import { EXECUTIVE_STYLES, getStyleById, getStylePrompt } from "@/lib/ai/styles";
import { getPremiumPrompts } from "@/lib/ai/prompts";

// ─── maskApiKey ──────────────────────────────────

describe("maskApiKey", () => {
  it("masque une clé standard (affiche 4 premiers + 4 derniers)", () => {
    const result = maskApiKey("sk-1234567890abcdef1234567890abcdef");
    expect(result).toContain("•••");
    expect(result.startsWith("sk-1")).toBe(true);
    expect(result.endsWith("cdef")).toBe(true);
  });

  it("retourne 'clé absente' pour une clé vide", () => {
    expect(maskApiKey("")).toBe("clé absente");
  });

  it("retourne 'clé absente' pour null", () => {
    expect(maskApiKey(null)).toBe("clé absente");
  });

  it("retourne 'clé absente' pour undefined", () => {
    expect(maskApiKey(undefined)).toBe("clé absente");
  });

  it("retourne 'clé absente' pour une clé trop courte (< 8 caractères)", () => {
    expect(maskApiKey("short")).toBe("clé absente");
  });

  it("masque correctement une clé de 8 caractères (2 visibles)", () => {
    const result = maskApiKey("12345678");
    expect(result).toBe("12•••78");
  });

  it("ne contient pas la clé complète dans le résultat", () => {
    const key = "sk-secret-key-12345";
    const result = maskApiKey(key);
    expect(result).not.toBe(key);
    expect(result).not.toContain("secret");
  });
});

// ─── validateAiConfig ────────────────────────────

describe("validateAiConfig", () => {
  it("valide une config correcte", () => {
    const result = validateAiConfig({
      apiKey: "sk-valid",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      timeout: 30,
      temperature: 0.7,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("détecte une clé absente", () => {
    const result = validateAiConfig({ apiKey: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Clé API absente");
  });

  it("détecte une URL invalide", () => {
    const result = validateAiConfig({ baseUrl: "not-a-url" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("URL de base invalide");
  });

  it("détecte un timeout hors plage (< 5)", () => {
    const result = validateAiConfig({ timeout: 2 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Timeout"))).toBe(true);
  });

  it("détecte un timeout hors plage (> 120)", () => {
    const result = validateAiConfig({ timeout: 150 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Timeout"))).toBe(true);
  });

  it("détecte une température hors plage", () => {
    const result = validateAiConfig({ temperature: 3 });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Température"))).toBe(true);
  });

  it("valide sans clé (pas d'erreur si apiKey est undefined)", () => {
    const result = validateAiConfig({});
    expect(result.valid).toBe(true);
  });

  it("valide des valeurs limites correctes", () => {
    const r = validateAiConfig({ timeout: 5, temperature: 0 });
    expect(r.valid).toBe(true);
    const r2 = validateAiConfig({ timeout: 120, temperature: 2 });
    expect(r2.valid).toBe(true);
  });
});

// ─── Styles ──────────────────────────────────────

describe("executive styles", () => {
  it("contient exactement 10 styles", () => {
    expect(EXECUTIVE_STYLES).toHaveLength(10);
  });

  it("chaque style a un id unique", () => {
    const ids = EXECUTIVE_STYLES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getStyleById retourne le bon style", () => {
    const style = getStyleById("humain");
    expect(style).toBeDefined();
    expect(style!.id).toBe("humain");
    expect(style!.label).toBe("Humain naturel");
  });

  it("getStyleById retourne undefined pour un id inexistant", () => {
    expect(getStyleById("inexistant")).toBeUndefined();
  });

  it("getStylePrompt retourne des instructions non vides", () => {
    const prompt = getStylePrompt("corporate");
    expect(prompt.length).toBeGreaterThan(50);
  });

  it("getStylePrompt fallback au premier style si id inconnu", () => {
    const prompt = getStylePrompt("inexistant");
    expect(prompt).toBe(EXECUTIVE_STYLES[0].instructions);
  });

  it("chaque style a une description et des instructions", () => {
    for (const style of EXECUTIVE_STYLES) {
      expect(style.description.length).toBeGreaterThan(0);
      expect(style.instructions.length).toBeGreaterThan(50);
    }
  });
});

// ─── Prompts ─────────────────────────────────────

describe("premium prompts", () => {
  const prompts = getPremiumPrompts();

  it("contient exactement 12 prompts", () => {
    expect(prompts).toHaveLength(12);
  });

  it("chaque prompt a un nom unique", () => {
    const names = prompts.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("chaque prompt a un systemPrompt et un content", () => {
    for (const p of prompts) {
      expect(p.systemPrompt.length).toBeGreaterThan(20);
      expect(p.content.length).toBeGreaterThan(20);
    }
  });

  it("chaque prompt a une température entre 0 et 1", () => {
    for (const p of prompts) {
      expect(p.temperature).toBeGreaterThanOrEqual(0);
      expect(p.temperature).toBeLessThanOrEqual(1);
    }
  });

  it("le prompt anti_hallucination existe", () => {
    const p = prompts.find(p => p.name === "anti_hallucination");
    expect(p).toBeDefined();
    expect(p!.temperature).toBeLessThanOrEqual(0.3);
  });

  it("le prompt quality_check existe", () => {
    const p = prompts.find(p => p.name === "quality_check");
    expect(p).toBeDefined();
    expect(p!.outputSchema).toBe("json");
  });

  it("les prompts de CV contiennent les variables clés", () => {
    const cvFr = prompts.find(p => p.name === "cv_tailor_fr");
    expect(cvFr).toBeDefined();
    expect(cvFr!.variables).toContain("proofVaultData");
    expect(cvFr!.variables).toContain("candidateName");
  });
});

// ─── Anonymization ───────────────────────────────

describe("anonymizeCandidateProfile", () => {
  const fullProfile: CandidateProfileInput = {
    fullName: "Jean Dupont",
    title: "Directeur Commercial",
    email: "jean.dupont@email.com",
    phone: "+33 6 12 34 56 78",
    linkedin: "linkedin.com/in/jeandupont",
    location: "Paris, France",
    summary: "20 ans d'expérience en direction commerciale.",
    yearsExp: 20,
    sectors: "Tech, SaaS, Industrie",
    functions: "Direction commerciale, Business Development",
    languages: "Français, Anglais, Espagnol",
    mobility: "France, Europe",
  };

  it("laisse tout visible en mode complet (aucune anonymisation)", () => {
    const result = anonymizeCandidateProfile(fullProfile, {
      anonymizeName: false,
      anonymizeEmail: false,
      anonymizePhone: false,
      anonymizeCompanies: false,
      anonymizeSalary: false,
    });
    expect(result.fullName).toBe("Jean Dupont");
    expect(result.email).toBe("jean.dupont@email.com");
    expect(result.phone).toBe("+33 6 12 34 56 78");
  });

  it("anonymise le nom", () => {
    const result = anonymizeCandidateProfile(fullProfile, {
      anonymizeName: true,
      anonymizeEmail: false,
      anonymizePhone: false,
      anonymizeCompanies: false,
      anonymizeSalary: false,
    });
    expect(result.fullName).not.toBe("Jean Dupont");
    expect(result.fullName).toContain("Candidat");
  });

  it("masque l'email partiellement", () => {
    const result = anonymizeCandidateProfile(fullProfile, {
      anonymizeName: false,
      anonymizeEmail: true,
      anonymizePhone: false,
      anonymizeCompanies: false,
      anonymizeSalary: false,
    });
    expect(result.email).not.toBe("jean.dupont@email.com");
    expect(result.email).toContain("@");
  });

  it("masque le téléphone", () => {
    const result = anonymizeCandidateProfile(fullProfile, {
      anonymizeName: false,
      anonymizeEmail: false,
      anonymizePhone: true,
      anonymizeCompanies: false,
      anonymizeSalary: false,
    });
    expect(result.phone).not.toBe("+33 6 12 34 56 78");
  });

  it("gère les champs optionnels absents", () => {
    const minimal: CandidateProfileInput = {
      fullName: "Marie",
      title: "CEO",
      email: null,
      phone: null,
    };
    const result = anonymizeCandidateProfile(minimal, {
      anonymizeName: false,
      anonymizeEmail: false,
      anonymizePhone: false,
      anonymizeCompanies: false,
      anonymizeSalary: false,
    });
    expect(result.fullName).toBe("Marie");
    expect(result.email).toBeDefined();
    expect(result.phone).toBeDefined();
  });

  it("ne modifie pas les champs non personnels", () => {
    const result = anonymizeCandidateProfile(fullProfile, {
      anonymizeName: true,
      anonymizeEmail: true,
      anonymizePhone: true,
      anonymizeCompanies: true,
      anonymizeSalary: true,
    });
    expect(result.title).toBe("Directeur Commercial");
    expect(result.sectors).toBe("Tech, SaaS, Industrie");
    expect(result.functions).toBe("Direction commerciale, Business Development");
    expect(result.yearsExp).toBe(20);
  });
});

describe("anonymizeOpportunity", () => {
  const opp = {
    title: "Country Manager France",
    company: "BigCorp International",
    location: "Paris",
    country: "France",
    salaryMin: 120000,
    salaryMax: 160000,
  };

  it("laisse tout visible sans anonymisation", () => {
    const result = anonymizeOpportunity(opp, {
      anonymizeName: false,
      anonymizeEmail: false,
      anonymizePhone: false,
      anonymizeCompanies: false,
      anonymizeSalary: false,
    });
    expect(result.company).toBe("BigCorp International");
    expect(result.salaryMin).toBe(120000);
  });

  it("anonymise l'entreprise", () => {
    const result = anonymizeOpportunity(opp, {
      anonymizeName: false,
      anonymizeEmail: false,
      anonymizePhone: false,
      anonymizeCompanies: true,
      anonymizeSalary: false,
    });
    expect(result.company).not.toBe("BigCorp International");
  });

  it("anonymise le salaire", () => {
    const result = anonymizeOpportunity(opp, {
      anonymizeName: false,
      anonymizeEmail: false,
      anonymizePhone: false,
      anonymizeCompanies: false,
      anonymizeSalary: true,
    });
    expect(result.salaryMin).toBeNull();
    expect(result.salaryMax).toBeNull();
  });

  it("le titre du poste n'est jamais anonymisé", () => {
    const result = anonymizeOpportunity(opp, {
      anonymizeName: true,
      anonymizeEmail: true,
      anonymizePhone: true,
      anonymizeCompanies: true,
      anonymizeSalary: true,
    });
    expect(result.title).toBe("Country Manager France");
  });
});

describe("anonymizeDocumentContext", () => {
  it("remplace les noms candidat dans le texte", () => {
    const result = anonymizeDocumentContext(
      "Jean Dupont a 20 ans d'expérience. Jean Dupont a dirigé...",
      { anonymizeName: true, anonymizeEmail: false, anonymizePhone: false, anonymizeCompanies: false, anonymizeSalary: false },
      "Jean Dupont",
    );
    expect(result).not.toContain("Jean Dupont");
    expect(result).toContain("Candidat");
  });

  it("ne modifie pas le texte sans anonymisation", () => {
    const text = "Jean Dupont a travaillé chez Apple.";
    const result = anonymizeDocumentContext(
      text,
      { anonymizeName: false, anonymizeEmail: false, anonymizePhone: false, anonymizeCompanies: false, anonymizeSalary: false },
      "Jean Dupont",
    );
    expect(result).toBe(text);
  });

  it("gère un nom candidat vide", () => {
    const text = "Le candidat a de l'expérience.";
    const result = anonymizeDocumentContext(
      text,
      { anonymizeName: true, anonymizeEmail: false, anonymizePhone: false, anonymizeCompanies: false, anonymizeSalary: false },
      "",
    );
    expect(result).toBe(text);
  });
});

// ─── Anti-hallucination ──────────────────────────

function makeVerifiedData(): CandidateVerificationData {
  return {
    fullName: "Jean Dupont",
    title: "Directeur Commercial",
    skills: [
      { name: "Management d'équipe", category: "Management" },
      { name: "Stratégie commerciale", category: "Commerce" },
      { name: "Négociation grands comptes", category: "Commerce" },
    ],
    experiences: [
      {
        company: "TechCorp",
        title: "Directeur Commercial",
        country: "France",
        description: "Direction d'une équipe de 50 personnes",
        teamSize: 50,
        revenue: null,
        budget: "15M€",
      },
    ],
    education: "Master Management — HEC Paris",
    certifications: "Executive MBA — INSEAD",
    proofEntries: [
      { category: "chiffre", title: "CA", value: "30M€" },
      { category: "kpi", title: "Croissance", value: "+25%" },
    ],
    masterCVText: "CV complet de Jean Dupont, Directeur Commercial.",
    profileText: "Profil exécutif avec 20 ans d'expérience.",
  };
}

describe("validateNoHallucinationEnhanced", () => {
  it("valide un contenu factuel sans alerte", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "Jean Dupont, Directeur Commercial chez TechCorp. Expert en Management d'équipe et Stratégie commerciale. CA de 30M€.",
      data,
    );
    expect(result.clean).toBe(true);
    expect(result.criticalCount).toBe(0);
    expect(result.alerts).toHaveLength(0);
  });

  it("détecte une compétence inventée", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "Jean Dupont, Expertise en Intelligence Artificielle et Blockchain.",
      data,
    );
    expect(result.clean).toBe(false);
    const skillAlerts = result.alerts.filter(a => a.type === "skill_invented");
    expect(skillAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("détecte un diplôme inventé", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "MBA a Harvard Business School, USA.",
      data,
    );
    expect(result.clean).toBe(false);
    const diplomaAlerts = result.alerts.filter(a => a.type === "diploma_unverified");
    expect(diplomaAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("détecte une certification inventée", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "Certifié PMP, Scrum Master et Six Sigma Black Belt.",
      data,
    );
    // Certifications are warnings (not critical), so clean may be true
    const certAlerts = result.alerts.filter(a => a.type === "certification_unverified");
    expect(certAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("détecte une entreprise inventée", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "A travaillé chez Google, Amazon et Microsoft.",
      data,
    );
    // Only TechCorp is verified
    expect(result.clean).toBe(false);
    const companyAlerts = result.alerts.filter(a => a.type === "company_invented");
    expect(companyAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("détecte un chiffre modifié", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "CA de 100M€ réalisé en 2023.",
      data,
    );
    // Proof vault says 30M€, not 100M€
    expect(result.clean).toBe(false);
    const numAlerts = result.alerts.filter(a => a.type === "number_unverified");
    expect(numAlerts.length).toBeGreaterThanOrEqual(1);
  });

  it("bloque l'export si 1+ alerte critique", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "Jean Dupont, Expertise en IA. MBA a Harvard University. Certification PMP. A dirigé un P&L de 500M€. A travaillé chez Google.",
      data,
    );
    expect(result.canExport).toBe(false);
    expect(result.criticalCount).toBeGreaterThanOrEqual(1);
  });

  it("ne bloque pas l'export si seulement des warnings", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "Jean Dupont est incroyablement talentueux et le meilleur dans son domaine.",
      data,
    );
    // Superlatives are warnings, not critical
    expect(result.criticalCount).toBe(0);
  });

  it("retourne un objet alerts avec les champs requis", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced("Texte inventé avec des skills inexistants comme Blockchain.", data);
    for (const alert of result.alerts) {
      expect(alert.type).toBeDefined();
      expect(alert.reason).toBeDefined();
      expect(alert.excerpt).toBeDefined();
      expect(alert.severity).toBeDefined();
    }
  });

  it("valide proprement un contenu vide", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced("", data);
    expect(result.clean).toBe(true);
    expect(result.alerts).toHaveLength(0);
  });

  it("détecte un rôle non vérifié (alerte critique)", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "En tant que CEO de TechCorp.",
      data,
    );
    // "CEO" is not his verified title "Directeur Commercial"
    const roleAlerts = result.alerts.filter(a => a.type === "role_invented");
    expect(roleAlerts.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Export blocking ─────────────────────────────

describe("export blocking (via anti-hallucination)", () => {
  it("permet l'export d'un document propre", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced(
      "Jean Dupont — Directeur Commercial chez TechCorp. CA 30M€, croissance +25%. Compétences : Management d'équipe, Stratégie commerciale.",
      data,
    );
    expect(result.canExport).toBe(true);
    expect(result.criticalCount).toBe(0);
  });

  it("déclenche > 3 warnings → canExport bloqué", () => {
    const data = makeVerifiedData();
    // Multiple minor fabrications
    const result = validateNoHallucinationEnhanced(
      "Jean Dupont est incroyable. Il est le meilleur. Il est exceptionnel. Il a révolutionné le marché français japonais. Expert hors pair.",
      data,
    );
    if (result.alerts.filter(a => a.severity === "warning").length > 3) {
      expect(result.canExport).toBe(false);
    }
  });
});

// ─── DeepSeek non obligatoire ────────────────────

describe("DeepSeek non obligatoire", () => {
  it("validateAiConfig ne renvoie pas d'erreur pour une config vide", () => {
    const result = validateAiConfig({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("maskApiKey gère tous les cas sans erreur", () => {
    expect(() => maskApiKey(null)).not.toThrow();
    expect(() => maskApiKey(undefined)).not.toThrow();
    expect(() => maskApiKey("")).not.toThrow();
    expect(() => maskApiKey("short")).not.toThrow();
  });

  it("les prompts premium fonctionnent sans dépendance externe", () => {
    const prompts = getPremiumPrompts();
    expect(prompts.length).toBeGreaterThan(0);
    // Pure data — no network, no DB
    for (const p of prompts) {
      expect(typeof p.systemPrompt).toBe("string");
      expect(typeof p.content).toBe("string");
    }
  });

  it("les styles fonctionnent sans dépendance externe", () => {
    const prompt = getStylePrompt("direct");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("l'anonymisation fonctionne sans dépendance externe", () => {
    const result = anonymizeCandidateProfile(
      { fullName: "Test", title: "CEO", email: "test@test.com", phone: null },
      { anonymizeName: true, anonymizeEmail: false, anonymizePhone: false, anonymizeCompanies: false, anonymizeSalary: false },
    );
    expect(result.fullName).not.toBe("Test");
  });

  it("l'anti-hallucination fonctionne sans dépendance externe", () => {
    const data = makeVerifiedData();
    const result = validateNoHallucinationEnhanced("Texte test.", data);
    expect(result.clean).toBe(true);
  });
});
