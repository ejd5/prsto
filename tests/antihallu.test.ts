import { describe, it, expect } from "vitest";
import {
  CV_TEMPLATES,
  CVData,
} from "@/lib/cv-templates/templates";

// ─── CV de test avec données contrôlées ──────────────

const CLEAN_CV: CVData = {
  fullName: "Alice Martin",
  title: "Directrice Commerciale",
  email: "alice@example.com",
  phone: "07 00 00 00 00",
  linkedin: "linkedin.com/in/alicemartin",
  location: "Lyon, France",
  summary: "10 ans en direction commerciale.",
  languages: ["Français (natif)", "Anglais (courant)"],
  skills: [
    { name: "Management", category: "management", level: "Expert" },
    { name: "Négociation", category: "commerce", level: "Avancé" },
  ],
  experiences: [
    {
      company: "BigCorp",
      title: "Directrice Commerciale",
      period: "2020-présent",
      location: "Lyon",
      description: "Pilotage d'une équipe de 30 commerciaux.",
      achievements: ["CA 25M€ en 2023"],
    },
  ],
  education: [
    { degree: "Master Management", school: "EM Lyon", year: "2012" },
  ],
  certifications: ["PMP"],
};

describe("Anti-hallucination CV", () => {
  it("les compétences absentes ne sont PAS ajoutées au CV", () => {
    // Le CV ne doit jamais mentionner "Python" ou "React" — compétences non présentes dans CLEAN_CV
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).not.toMatch(/\bpython\b/i);
      expect(text).not.toMatch(/\breact\b/i);
      expect(text).not.toMatch(/\bjava\b/i);
    }
  });

  it("les diplômes inventés ne sont PAS ajoutés", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).not.toMatch(/HEC/i);   // Seulement EM Lyon
      expect(text).not.toMatch(/INSEAD/i);
      expect(text).not.toMatch(/Harvard/i);
    }
  });

  it("les entreprises inventées ne sont PAS ajoutées", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).not.toMatch(/Google/i);
      expect(text).not.toMatch(/Amazon/i);
      expect(text).not.toMatch(/McKinsey/i);
    }
  });

  it("les chiffres inventés ne sont PAS ajoutés", () => {
    // Seul "25M€" est légitime (dans achievements). "50M€" ou "100M€" doivent être absents
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).not.toMatch(/50M€/);
      expect(text).not.toMatch(/100M€/);
      expect(text).not.toMatch(/200M€/);
    }
  });

  it("le nom est toujours présent (casse variable selon template)", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text.toLowerCase()).toContain("alice martin");
    }
  });

  it("le CV contient uniquement les données fournies en entrée", () => {
    // Vérification structurelle : le texte ne doit contenir que des infos issues de CLEAN_CV
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);

      // Vérifie que le texte ne contient pas de patterns inventés classiques
      const fakePatterns = [
        /prix[\s\w]+202[0-9]/i,       // Prix non mentionné
        /publication/i,                 // Jamais mentionné
        /brevet/i,                      // Jamais mentionné
      ];
      for (const pattern of fakePatterns) {
        expect(text).not.toMatch(pattern);
      }
    }
  });

  it("les langues non listées sont absentes", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).not.toMatch(/Espagnol/i);
      expect(text).not.toMatch(/Chinois/i);
      expect(text).not.toMatch(/Japonais/i);
    }
  });

  it("la localisation réelle est préservée", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).toMatch(/Lyon/i);
    }
  });

  it("pas de technologies ou outils inventés", () => {
    for (const t of CV_TEMPLATES) {
      const text = t.renderText(CLEAN_CV);
      expect(text).not.toMatch(/\bSQL\b/i);
      expect(text).not.toMatch(/\bDocker\b/i);
      expect(text).not.toMatch(/\bAWS\b/i);
    }
  });
});
