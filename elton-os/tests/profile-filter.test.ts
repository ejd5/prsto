import { describe, it, expect } from "vitest";
import {
  filterJobForTargetProfile,
  batchFilterJobs,
  type TargetProfile,
} from "@/lib/jobs/profile-filter";

const DEFAULT_TARGET: TargetProfile = {
  title: "Directeur Commercial",
  functions: ["Directeur Commercial", "Directeur Général"],
  sectors: ["Industrie", "SaaS", "Distribution B2B"],
  location: "Aix en Provence, France",
  yearsExp: 20,
  languages: ["Français", "Anglais"],
  skills: ["négociation", "management", "stratégie commerciale"],
};

// ─── Acceptance ────────────────────────────

describe("filterJobForTargetProfile — acceptance", () => {
  it("accepts Directeur Commercial France", () => {
    const r = filterJobForTargetProfile(
      "Directeur Commercial France",
      "Recherche Directeur Commercial H/F pour piloter la stratégie commerciale, management d'équipe, P&L, développement France.",
      "Paris",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(75);
  });

  it("accepts Sales Director", () => {
    const r = filterJobForTargetProfile(
      "Sales Director France",
      "Lead a team of 15 sales reps, own the revenue number, drive growth across France.",
      "Paris, Île-de-France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(70);
  });

  it("accepts VP Sales France (international, France market)", () => {
    const r = filterJobForTargetProfile(
      "VP Sales France",
      "Executive leadership role for French market. Manage P&L, strategy, team of 50+ across France and Southern Europe.",
      "London, UK",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(65);
  });

  it("accepts Country Manager", () => {
    const r = filterJobForTargetProfile(
      "Country Manager France",
      "General management of French operations, P&L ownership, business development, équipe de 30 personnes.",
      "Paris",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(70);
  });

  it("accepts Head of Sales", () => {
    const r = filterJobForTargetProfile(
      "Head of Sales — Southern Europe",
      "Build and lead the sales team, drive revenue growth across France and Italy.",
      "Marseille",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(80);
  });

  it("accepts Chief Revenue Officer", () => {
    const r = filterJobForTargetProfile(
      "Chief Revenue Officer",
      "C-level role. Own all revenue, strategy, go-to-market for SaaS company.",
      "Paris, France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(75);
  });

  it("accepts Directeur Régional des Ventes", () => {
    const r = filterJobForTargetProfile(
      "Directeur Régional des Ventes Sud-Est",
      "Piloter l'activité commerciale sur la région PACA et Auvergne-Rhône-Alpes, management équipe.",
      "Aix-en-Provence",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(80);
  });

  it("accepts General Manager France", () => {
    const r = filterJobForTargetProfile(
      "General Manager — France",
      "Full P&L responsibility, lead cross-functional team, drive strategy and growth.",
      "Paris",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(70);
  });
});

// ─── Rejection ─────────────────────────────

describe("filterJobForTargetProfile — rejection", () => {
  it("rejects stage / internship", () => {
    const r = filterJobForTargetProfile(
      "Stage Commercial — Assistant Sales",
      "Stage de 6 mois en assistant commercial.",
      "Paris",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
    expect(r.rejectionReasons.some((rr) => rr.includes("Poste exclu"))).toBe(true);
  });

  it("rejects alternance", () => {
    const r = filterJobForTargetProfile(
      "Alternance Business Development",
      "Alternance 12 mois en développement commercial.",
      "Lyon",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects junior roles", () => {
    const r = filterJobForTargetProfile(
      "Junior Account Manager",
      "Débutant accepté. Formation assurée.",
      "Paris",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects SDR / BDR", () => {
    const r = filterJobForTargetProfile(
      "Sales Development Representative",
      "Generate qualified leads for the sales team.",
      "New York, NY",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
    expect(r.rejectionReasons.some((rr) => rr.includes("Poste exclu"))).toBe(true);
  });

  it("rejects software engineers", () => {
    const r = filterJobForTargetProfile(
      "Senior Software Engineer — Backend",
      "Build and maintain backend services in Node.js and Go.",
      "San Francisco, CA",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects data scientists", () => {
    const r = filterJobForTargetProfile(
      "Data Scientist — Machine Learning",
      "Build ML models for customer analytics.",
      "Paris",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects product managers", () => {
    const r = filterJobForTargetProfile(
      "Product Manager — Growth",
      "Own the product roadmap for growth features.",
      "San Francisco",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects administrative roles", () => {
    const r = filterJobForTargetProfile(
      "Administrative Business Partner",
      "Provide administrative support to the executive team.",
      "Palo Alto, CA",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });
});

// ─── Location priority ─────────────────────

describe("filterJobForTargetProfile — location priority", () => {
  it("PACA gets max points (25)", () => {
    const r = filterJobForTargetProfile(
      "Directeur Commercial PACA",
      "Développement commercial sur la région Provence.",
      "Marseille, PACA",
      DEFAULT_TARGET,
    );
    expect(r.locationPriority).toBe(1);
    expect(r.reasons.some((s) => s.includes("PACA"))).toBe(true);
  });

  it("IDF gets 18 points", () => {
    const r = filterJobForTargetProfile(
      "Sales Director",
      "Lead sales for France.",
      "Paris, Île-de-France",
      DEFAULT_TARGET,
    );
    expect(r.locationPriority).toBe(2);
    expect(r.reasons.some((s) => s.includes("IDF") || s.includes("France"))).toBe(true);
  });

  it("Europe gets 12 points", () => {
    const r = filterJobForTargetProfile(
      "VP Sales EMEA",
      "Lead sales across Europe.",
      "Remote, Europe",
      DEFAULT_TARGET,
    );
    expect(r.locationPriority).toBe(3);
  });

  it("International gets 5 points", () => {
    const r = filterJobForTargetProfile(
      "Director of Sales Development",
      "Lead SDR team.",
      "San Francisco, CA",
      DEFAULT_TARGET,
    );
    expect(r.locationPriority).toBe(4);
  });
});

// ─── batchFilterJobs ───────────────────────

describe("batchFilterJobs", () => {
  it("filters a batch correctly", () => {
    const jobs = [
      { title: "Directeur Commercial France", description: "Pilotage équipe, P&L, stratégie", location: "Paris", company: "ACME" },
      { title: "Stage Marketing", description: "Stage 6 mois", location: "Paris", company: "ACME" },
      { title: "Software Engineer", description: "Node.js, React", location: "SF", company: "ACME" },
      { title: "Country Manager France", description: "Opérations France, P&L", location: "Aix", company: "ACME" },
      { title: "SDR", description: "Prospection", location: "NYC", company: "ACME" },
    ];

    const result = batchFilterJobs(jobs, DEFAULT_TARGET);
    expect(result.kept.length).toBe(2);
    expect(result.rejected).toBe(3);
    expect(result.kept[0].title).toBe("Directeur Commercial France");
    expect(result.kept[1].title).toBe("Country Manager France");
    // Les 3 rejets doivent avoir une raison commençant par "Poste exclu"
    const rejectKeys = Object.keys(result.rejectedReasons);
    expect(rejectKeys.every((k) => k.startsWith("Poste exclu"))).toBe(true);
    expect(Object.values(result.rejectedReasons).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("handles empty array", () => {
    const result = batchFilterJobs([], DEFAULT_TARGET);
    expect(result.kept).toHaveLength(0);
    expect(result.rejected).toBe(0);
  });
});

// ─── International compatibility ───────────

describe("filterJobForTargetProfile — international", () => {
  it("accepts Country Manager France chez société US", () => {
    const r = filterJobForTargetProfile(
      "Country Manager France",
      "Lead operations in France for a US-based company. French market focus.",
      "New York, NY",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(55);
  });

  it("accepts Sales Director France — Remote Europe", () => {
    const r = filterJobForTargetProfile(
      "Sales Director France",
      "Lead sales in France. Remote Europe accepted.",
      "Remote Europe",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Head of Sales, French Market", () => {
    const r = filterJobForTargetProfile(
      "Head of Sales, French Market",
      "Drive growth across the French market. French-speaking required.",
      "London, UK",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Business Development Director, Francophone markets", () => {
    const r = filterJobForTargetProfile(
      "Business Development Director — French-speaking markets",
      "Develop business in francophone Africa and Europe. Fluent French required.",
      "Remote",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Remote EMEA, candidates based in France", () => {
    const r = filterJobForTargetProfile(
      "VP Sales EMEA",
      "Remote EMEA role. Lead sales across EMEA, manage team, drive revenue growth. Candidates based in France or UK accepted.",
      "Remote, EMEA",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("rejects Sales Director US — US only", () => {
    const r = filterJobForTargetProfile(
      "Sales Director US",
      "Lead US sales team. US only, must be based in New York.",
      "New York, NY",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Head of Sales London — onsite only", () => {
    const r = filterJobForTargetProfile(
      "Head of Sales",
      "Lead UK sales. Must be based in London. Onsite 5 days.",
      "London, UK",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Country Manager Germany — German native required", () => {
    const r = filterJobForTargetProfile(
      "Country Manager Germany",
      "Lead German operations. German native required.",
      "Berlin, Germany",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects VP Sales — relocation required to US", () => {
    const r = filterJobForTargetProfile(
      "VP Sales",
      "Leadership role. Relocation required to San Francisco.",
      "San Francisco, CA",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Sales Manager Spain — Spanish native required", () => {
    const r = filterJobForTargetProfile(
      "Sales Manager",
      "Lead Spanish market. Spanish native required.",
      "Madrid, Spain",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Hybrid London 3 days/week sans France", () => {
    const r = filterJobForTargetProfile(
      "Head of Partnerships",
      "Hybrid London 3 days/week. Must be based in London.",
      "London, UK",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });
});

// ─── Edge cases ────────────────────────────

describe("filterJobForTargetProfile — edge cases", () => {
  it("handles empty title", () => {
    const r = filterJobForTargetProfile("", "Some description", "Paris", DEFAULT_TARGET);
    expect(r.shouldKeep).toBe(false);
    expect(r.rejectionReasons.length).toBeGreaterThan(0);
  });

  it("handles null location", () => {
    const r = filterJobForTargetProfile(
      "Directeur Commercial",
      "Pilotage équipe commerciale.",
      null,
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.locationPriority).toBe(3); // Unknown → default France
  });

  it("accepts English title for French role", () => {
    const r = filterJobForTargetProfile(
      "Sales Director — France",
      "Manage the French sales team, drive revenue growth, partner with marketing.",
      "Paris, France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(70);
  });

  it("scores Directeur Général high", () => {
    const r = filterJobForTargetProfile(
      "Directeur Général France",
      "Direction générale de la filiale française. P&L complet, équipe 100 personnes, stratégie, développement.",
      "Aix-en-Provence",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
    expect(r.relevanceScore).toBeGreaterThanOrEqual(80);
    expect(r.locationPriority).toBe(1);
  });
});

// ─── Régression V2.2.5.3: standalone "remote" ──

describe("filterJobForTargetProfile — regression: remote standalone NOT sufficient", () => {
  it("rejects Remote only + United States (no France)", () => {
    const r = filterJobForTargetProfile(
      "Sales Director",
      "Remote position. Lead sales team.",
      "United States",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Remote only + Brazil", () => {
    const r = filterJobForTargetProfile(
      "VP Sales",
      "Remote role. Drive revenue.",
      "São Paulo, Brazil",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Remote only + India", () => {
    const r = filterJobForTargetProfile(
      "Head of Sales",
      "Remote. Build team.",
      "Bangalore, India",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Remote only + Japan", () => {
    const r = filterJobForTargetProfile(
      "Revenue Director",
      "Remote role.",
      "Tokyo, Japan",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("accepts Remote from France", () => {
    const r = filterJobForTargetProfile(
      "Sales Director France",
      "Remote from France. Lead French market.",
      "Remote France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Remote Europe", () => {
    const r = filterJobForTargetProfile(
      "Head of Sales",
      "Remote Europe. Manage team, drive revenue.",
      "Remote Europe",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts candidates based in France", () => {
    const r = filterJobForTargetProfile(
      "Business Development Director",
      "Candidates based in France accepted. Drive growth.",
      "Remote",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });
});

// ─── Régression V2.2.5.3: localisations internationales ──

describe("filterJobForTargetProfile — regression: localisations hors zone rejetées", () => {
  it("rejects Salt Lake City, Utah, United States", () => {
    const r = filterJobForTargetProfile(
      "Manager, Banking Operations",
      "Manage operations team.",
      "Salt Lake City, Utah, United States",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects New York, United States", () => {
    const r = filterJobForTargetProfile(
      "Customer Marketing Manager",
      "Marketing role.",
      "New York, New York, United States",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects São Paulo, Brazil", () => {
    const r = filterJobForTargetProfile(
      "Operations Manager",
      "Brazil operations.",
      "São Paulo, Brazil",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Bangalore, India", () => {
    const r = filterJobForTargetProfile(
      "Finance Manager",
      "India operations.",
      "Bengaluru, India",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Tokyo, Japan", () => {
    const r = filterJobForTargetProfile(
      "APAC Manager",
      "Japan market.",
      "Tokyo, Japan",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects London, United Kingdom sans mention France", () => {
    const r = filterJobForTargetProfile(
      "Head of Sales",
      "Lead UK sales team.",
      "London, United Kingdom",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  it("rejects Berlin, Germany sans mention France", () => {
    const r = filterJobForTargetProfile(
      "Country Manager",
      "Lead German operations.",
      "Berlin, Germany",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(false);
  });

  // Acceptés (localisations FR/Europe compatibles)
  it("accepts Paris, France", () => {
    const r = filterJobForTargetProfile(
      "Directeur Commercial",
      "Pilotage stratégie France.",
      "Paris, France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Marseille, France", () => {
    const r = filterJobForTargetProfile(
      "Sales Director",
      "Lead PACA region.",
      "Marseille, France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Aix-en-Provence, France", () => {
    const r = filterJobForTargetProfile(
      "Directeur Commercial PACA",
      "Développement commercial.",
      "Aix-en-Provence, France",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts Dublin avec French Fluency", () => {
    const r = filterJobForTargetProfile(
      "Business Development Director, French Fluency",
      "Driver les ventes. French-speaking leadership role. Gestion équipe, P&L, stratégie commerciale. Basé à Dublin.",
      "Dublin, Ireland",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });

  it("accepts EMEA avec French market responsibility", () => {
    const r = filterJobForTargetProfile(
      "VP Sales EMEA",
      "Lead EMEA sales. French market responsibility. France key market.",
      "London, UK",
      DEFAULT_TARGET,
    );
    expect(r.shouldKeep).toBe(true);
  });
});

// ─── Régression V2.2.5.3: HTML cleaning ──

import { detectInternationalCompatibility } from "@/lib/jobs/profile-filter";

describe("detectInternationalCompatibility — regression: HTML cleaning", () => {
  it("cleans HTML and detects Bilingual French + Remote Europe", () => {
    const r = detectInternationalCompatibility(
      "Sales Director",
      "<div>Bilingual French/English required &amp; Remote Europe</div><p>Lead team</p>",
      "Remote",
    );
    expect(r.isFranceMarket).toBe(false);
    expect(r.isFrenchProfileRequired).toBe(true);
    expect(r.isRemoteFromFranceCompatible).toBe(true);
    expect(r.shouldKeepInternational).toBe(true);
  });

  it("rejects standalone Remote with United States only in HTML", () => {
    const r = detectInternationalCompatibility(
      "Sales Manager",
      "<div>Remote</div><p>United States only. Must be based in NY.</p>",
      "New York, NY",
    );
    expect(r.isRemoteFromFranceCompatible).toBe(false);
    expect(r.shouldKeepInternational).toBe(false);
  });

  it("cleans HTML entities (&amp;, &lt;, &gt;)", () => {
    const r = detectInternationalCompatibility(
      "Country Manager",
      "&lt;div&gt;French market &amp; clients fran&ccedil;ais&lt;/div&gt;",
      "France",
    );
    expect(r.isFranceMarket).toBe(true);
  });

  it("handles empty HTML", () => {
    const r = detectInternationalCompatibility(
      "Sales Director",
      "<div></div><p></p>",
      "Paris",
    );
    // Paris = France localisation → should be fine
    expect(r.isInternational).toBe(false);
  });
});
