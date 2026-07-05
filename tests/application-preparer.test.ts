import { describe, it, expect } from "vitest";
import {
  buildLocalResume,
  buildLocalLetter,
} from "@/lib/jobs/application-preparer";
import type { CandidateSummary } from "@/lib/jobs/application-preparer";

/* ─── Candidate fixture ─────────────────────── */

function makeCandidate(overrides: Partial<CandidateSummary> = {}): CandidateSummary {
  return {
    profileId: "test-profile",
    fullName: "Jean Dupont",
    title: "Directeur Commercial",
    summary: "15 ans d'expérience en direction commerciale B2B, pilotage d'équipes de 50+ personnes.",
    location: "Paris",
    email: "jean@example.com",
    phone: "06 12 34 56 78",
    sectors: "IT, Télécoms, SaaS",
    functions: "Direction commerciale",
    yearsExp: 15,
    languages: "Français (natif), Anglais (courant)",
    education: "Master ESCP",
    certifications: "Certification SalesForce",
    cvText: null,
    skills: [
      { name: "Management", category: "soft", level: "expert" },
      { name: "Négociation", category: "soft", level: "expert" },
      { name: "Salesforce", category: "tech", level: "avancé" },
    ],
    experiences: [
      {
        title: "Directeur Commercial",
        company: "TechCorp",
        sector: "IT",
        startDate: "2018-03",
        endDate: null,
        description: "Pilotage équipe 50 personnes",
        achievements: "+30% CA en 3 ans",
      },
      {
        title: "Responsable Grands Comptes",
        company: "SaaS France",
        sector: "SaaS",
        startDate: "2013-01",
        endDate: "2018-02",
        description: "Gestion portefeuille grands comptes",
        achievements: "15M€ de revenus annuels",
      },
    ],
    proofEntries: [
      { category: "chiffres", title: "CA", value: "+30% en 3 ans" },
    ],
    ...overrides,
  };
}

/* ─── buildLocalResume ───────────────────────── */

describe("buildLocalResume", () => {
  const candidateText = `Nom : Jean Dupont
Titre : Directeur Commercial
Localisation : Paris, France
Langues : Français (natif), Anglais (courant)

Expériences :
- 2018-03 - présent | Directeur Commercial | TechCorp | Pilotage d'une équipe de 50 personnes
- 2013-01 - 2018-02 | Responsable Grands Comptes | SaaS France | Gestion d'un portefeuille grands comptes

Compétences :
- Management d'équipe
- Négociation commerciale
- Stratégie de croissance
- Pilotage budgétaire
- Salesforce CRM`;

  const offerText = `Titre : Directeur Commercial H/F
Entreprise : Acme Corp
Description : Nous recherchons un Directeur Commercial pour piloter notre expansion en France.`;

  it("generates a structured resume with name and title", async () => {
    const resume = await buildLocalResume(candidateText, offerText);
    expect(resume).toContain("Jean Dupont");
    expect(resume).toContain("Directeur Commercial");
    expect(resume).toContain("Paris");
  });

  it("includes key resume sections", async () => {
    const resume = await buildLocalResume(candidateText, offerText);
    expect(resume).toContain("direction commerciale");
    expect(resume).toContain("EXPÉRIENCES PROFESSIONNELLES");
    expect(resume).toContain("SAVOIR-FAIRE STRATÉGIQUE");
    expect(resume).toContain("SAVOIR-ÊTRE EXÉCUTIF");
  });

  it("includes parsed experience lines", async () => {
    const resume = await buildLocalResume(candidateText, offerText);
    expect(resume).toContain("TechCorp");
    expect(resume).toContain("SaaS France");
  });

  it("includes parsed skills in grouped sections", async () => {
    const resume = await buildLocalResume(candidateText, offerText);
    expect(resume).toContain("Management");
    expect(resume).toContain("Négociation");
  });

  it("includes language section with deduplicated entries", async () => {
    const resume = await buildLocalResume(candidateText, offerText);
    expect(resume).toContain("LANGUES");
    expect(resume).toContain("Français");
    expect(resume).toContain("Anglais");
  });

  it("handles minimal candidate text (no experience, no skills)", async () => {
    const minimal = "Nom : Marie Test\nTitre : Consultante";
    const resume = await buildLocalResume(minimal, offerText);
    expect(resume).toContain("Marie Test");
    expect(resume).toContain("Consultante");
    expect(resume.length).toBeGreaterThan(50);
  });

  it("handles empty candidate text gracefully", async () => {
    const resume = await buildLocalResume("", offerText);
    expect(resume).toContain("Candidat");
    expect(resume.length).toBeGreaterThan(50);
  });

  it("targets the offer title in executive summary", async () => {
    const resume = await buildLocalResume(candidateText, offerText);
    expect(resume).toContain("Directeur Commercial H/F");
  });

  it("uses fallback name when candidate text is not in French format", async () => {
    const en = `Name: John Smith
Title: Sales Director
Location: London, UK

Experiences:
- 2019 -- present | Sales Lead | GlobalCorp | Leading EMEA sales

Skills:
- Enterprise sales
- Team leadership`;

    const resume = await buildLocalResume(en, "Titre : Sales Director\nEntreprise : EMEA Corp");
    expect(resume).toContain("Candidat");
    expect(resume).toContain("Sales Director");
  });
});

/* ─── buildLocalLetter ──────────────────────── */

describe("buildLocalLetter", () => {
  const c = makeCandidate();

  it("generates a long-form cover letter with standard structure", async () => {
    const letter = await buildLocalLetter(c, "Directeur Commercial H/F", "Acme Corp", "long");
    expect(letter).toContain("Objet : Candidature");
    expect(letter).toContain("Directeur Commercial H/F");
    expect(letter).toContain("Acme Corp");
    expect(letter).toContain("Jean Dupont");
    expect(letter).toContain("Madame, Monsieur");
    expect(letter).toContain("Cordialement");
    expect(letter).not.toContain("**");
    expect(letter).not.toContain("---");
    expect(letter).not.toContain("##");
  });

  it("generates a short-form cover paragraph", async () => {
    const letter = await buildLocalLetter(c, "Sales Manager", "GlobalCorp", "short");
    expect(letter).toContain("Sales Manager");
    expect(letter).toContain("GlobalCorp");
    expect(letter).toContain("Jean Dupont");
    expect(letter.length).toBeLessThan(400);
  });

  it("handles missing company name gracefully", async () => {
    const letter = await buildLocalLetter(c, "Consultant", "", "long");
    expect(letter).toContain("Consultant");
    expect(letter).toContain("Candidature");
    expect(letter).not.toMatch(/chez \n/);
  });

  it("handles missing candidate title gracefully", async () => {
    const bare = makeCandidate({ title: "", fullName: "Alice Martin" });
    const letter = await buildLocalLetter(bare, "Chargé de mission", "Org", "long");
    expect(letter).toContain("Alice Martin");
    expect(letter).toContain("direction commerciale");
  });

  it("handles minimal candidate (no location, no phone)", async () => {
    const bare = makeCandidate({ fullName: "Bob", title: "Dev", location: null, phone: null });
    const letter = await buildLocalLetter(bare, "Lead Dev", "Startup", "short");
    expect(letter).toContain("Bob");
    expect(letter).toContain("Lead Dev");
    expect(letter).toContain("Startup");
  });

  it("includes candidate contact details (when available) in long mode", async () => {
    const letter = await buildLocalLetter(c, "Manager", "Corp", "long");
    expect(letter).toContain("Paris");
  });

  it("contains no em dashes (ChatGPT artifact)", async () => {
    const letter = await buildLocalLetter(c, "Directeur Commercial H/F", "Acme Corp", "long");
    expect(letter).not.toContain("—");
    expect(letter).not.toContain("–");
  });

  it("contains no cliché phrases", async () => {
    const letter = await buildLocalLetter(c, "Directeur Commercial H/F", "Acme Corp", "long");
    expect(letter).not.toContain("vif intérêt");
    expect(letter).not.toContain("Dans l'attente de votre retour");
    expect(letter).not.toContain("je vous prie d'agréer");
    expect(letter).not.toContain("salutations distinguées");
    expect(letter).not.toContain("Rigoureux, orienté résultats");
    expect(letter).not.toContain("je me permets");
  });

  it("has a clean subject line without em dash", async () => {
    const letter = await buildLocalLetter(c, "Directeur Commercial H/F", "Acme Corp", "long");
    expect(letter).toContain("Objet : Candidature au poste de Directeur Commercial H/F");
    expect(letter).not.toMatch(/Objet\s*:\s*Candidature\s*[—–]/);
  });

  it("short mode also has no em dashes or clichés", async () => {
    const letter = await buildLocalLetter(c, "Sales Manager", "GlobalCorp", "short");
    expect(letter).not.toContain("—");
    expect(letter).not.toContain("–");
    expect(letter).not.toContain("vif intérêt");
  });
});

/* ─── Integration: fallback chain ────────────── */

describe("CV/letter generation fallback integration", () => {
  it("buildLocalResume and buildLocalLetter produce non-empty output", async () => {
    const candidateText = "Nom : Test\nTitre : Manager\nLocalisation : Lyon\nLangues : Français\n\nExpériences :\n- 2020 -- présent | Manager | Corp | Description\n\nCompétences :\n- Leadership\n- Gestion";
    const resume = await buildLocalResume(candidateText, "Titre : Chef de projet\nEntreprise : ACME");
    expect(resume.length).toBeGreaterThan(100);
    expect(resume).not.toContain("Échec");

    const c = makeCandidate();
    const letter = await buildLocalLetter(c, "Chef de projet", "ACME", "long");
    expect(letter.length).toBeGreaterThan(100);
    expect(letter).not.toContain("Échec");
  });

  it("CV fallback handles missing resume sections gracefully", async () => {
    const bare = "Nom : Thomas Simple\nTitre : Junior";
    const resume = await buildLocalResume(bare, "Titre : Assistant\nEntreprise : PME");
    expect(resume).toContain("Thomas Simple");
    expect(resume).toContain("SAVOIR-FAIRE");
    expect(resume).toContain("EXPÉRIENCES PROFESSIONNELLES");
    expect(resume.length).toBeGreaterThan(80);
  });
});
