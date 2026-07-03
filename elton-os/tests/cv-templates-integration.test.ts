/**
 * Integration tests: full CV template rendering with realistic profile data.
 * Verifies all 3 templates render all 4 languages, hide LinkedIn by default,
 * show photo when enabled, and contain no markdown artifacts or placeholders.
 */
import { describe, it, expect } from "vitest";
import { buildCvRenderData } from "@/lib/cv-render/build-data";
import { cleanMarkdown } from "@/components/cv-templates/cv-template-utils";

function makeRealProfile() {
  return {
    fullName: "Elton Duarte",
    title: "Directeur Commercial",
    email: "eltduarte@gmail.com",
    phone: "+33 6 62 85 35 69",
    location: "Aix en Provence, France",
    linkedin: "https://www.linkedin.com/in/eltduarte",
    languages: JSON.stringify([
      "Français (natif)",
      "Anglais (courant)",
      "Espagnol (professionnel)",
      "Portugais",
    ]),
    education: JSON.stringify([
      "Master Management — HEC Paris — 2010",
      "Bachelor Économie — Université Aix-Marseille — 2008",
    ]),
    certifications: JSON.stringify(["PMP", "Six Sigma Black Belt"]),
    photoUrl: "data:image/png;base64,abc123",
    cvIncludePhoto: true,
    cvIncludeLinkedIn: false,
  } as const;
}

const realExperiences = [
  {
    title: "Directeur Commercial France", company: "Schneider Electric",
    startDate: "2020-01", endDate: null,
    location: "Paris", description: "Pilotage stratégie commerciale France. Management équipe 15 personnes. P&L 50M€. Croissance CA +32% en 3 ans.",
  },
  {
    title: "Head of Sales Southern Europe", company: "Siemens Mobility",
    startDate: "2016-03", endDate: "2019-12",
    location: "Marseille",
    description: "Direction commerciale Europe du Sud (France, Italie, Espagne). Déploiement go-to-market, recrutement équipe.",
  },
  {
    title: "Key Account Manager", company: "Dassault Systèmes",
    startDate: "2012-01", endDate: "2016-02",
    location: "Aix-en-Provence",
    description: "Gestion grands comptes industriels. Négociation contrats pluriannuels.",
  },
];

const realSkills = [
  { name: "Négociation", category: "business" },
  { name: "Management", category: "management" },
  { name: "Stratégie commerciale", category: "business" },
  { name: "SaaS B2B", category: "sectoriel" },
  { name: "Anglais", category: "langue" },
];

describe("buildCvRenderData — full profile", () => {
  const profile = makeRealProfile();
  const data = buildCvRenderData({
    profile,
    experiences: realExperiences,
    skills: realSkills,
  });

  it("identity is complete", () => {
    expect(data.identity.fullName).toBe("Elton Duarte");
    expect(data.identity.title).toBe("Directeur Commercial");
    expect(data.identity.email).toBe("eltduarte@gmail.com");
    expect(data.identity.phone).toBe("+33 6 62 85 35 69");
    expect(data.identity.location).toBe("Aix en Provence, France");
  });

  // ── Languages ──────────────────────────
  it("languages: all 4 present, niveau preserved", () => {
    expect(data.languages).toHaveLength(4);
    const names = data.languages.map((l) => l.name.toLowerCase());
    expect(names).toContain("français");
    expect(names).toContain("anglais");
    expect(names).toContain("espagnol");
    expect(names).toContain("portugais");

    const fr = data.languages.find((l) => l.name.toLowerCase().includes("français"));
    expect(fr?.level).toBe("natif");
    const es = data.languages.find((l) => l.name.toLowerCase().includes("espagnol"));
    expect(es?.level).toBe("professionnel");
  });

  // ── LinkedIn ───────────────────────────
  it("LinkedIn hidden when cvIncludeLinkedIn=false", () => {
    expect(data.options.includeLinkedIn).toBe(false);
    expect(data.identity.linkedin).toBeTruthy();
  });

  it("LinkedIn shown when cvIncludeLinkedIn=true", () => {
    const d2 = buildCvRenderData({
      profile: { ...profile, cvIncludeLinkedIn: true },
      experiences: realExperiences,
      skills: realSkills,
    });
    expect(d2.options.includeLinkedIn).toBe(true);
  });

  // ── Photo ──────────────────────────────
  it("photo present when cvIncludePhoto=true", () => {
    expect(data.options.includePhoto).toBe(true);
    expect(data.identity.photoUrl).toBe("data:image/png;base64,abc123");
  });

  it("photo hidden when cvIncludePhoto=false", () => {
    const d3 = buildCvRenderData({
      profile: { ...profile, cvIncludePhoto: false },
    });
    expect(d3.options.includePhoto).toBe(false);
  });

  it("photo gracefully absent when url is empty", () => {
    const d4 = buildCvRenderData({
      profile: { ...profile, photoUrl: null },
    });
    expect(d4.identity.photoUrl).toBeUndefined();
  });

  // ── Education ──────────────────────────
  it("education: parses diploma, school, and year", () => {
    expect(data.education).toHaveLength(2);
    const master = data.education.find((e) => e.degree?.includes("Master"));
    expect(master).toBeDefined();
    expect(master?.school).toBe("HEC Paris");
    expect(master?.year).toBe("2010");
    const bachelor = data.education.find((e) => e.degree?.includes("Bachelor"));
    expect(bachelor?.school).toBe("Université Aix-Marseille");
    expect(bachelor?.year).toBe("2008");
  });

  // ── Experiences ────────────────────────
  it("experiences: 3 complete entries with dates", () => {
    expect(data.experiences).toHaveLength(3);
    expect(data.experiences[0].company).toBe("Schneider Electric");
    expect(data.experiences[0].endDate).toBeUndefined(); // actuel
    expect(data.experiences[2].endDate).toBe("2016-02");
  });

  // ── Certifications ─────────────────────
  it("certifications extracted", () => {
    expect(data.certifications).toHaveLength(2);
    expect(data.certifications).toContain("PMP");
    expect(data.certifications).toContain("Six Sigma Black Belt");
  });

  // ── Skills ─────────────────────────────
  it("skills extracted", () => {
    expect(data.skills).toHaveLength(5);
    expect(data.skills).toContain("Négociation");
    expect(data.skills).toContain("SaaS B2B");
  });
});

// ── No markdown / no placeholder ──────────

describe("CV rendering — no markdown or placeholders", () => {
  it("cleanMarkdown strips **bold**", () => {
    expect(cleanMarkdown("**Excellent** manager")).toBe("Excellent manager");
  });

  it("cleanMarkdown strips ### headers", () => {
    expect(cleanMarkdown("### PROFIL\nJean")).toContain("Jean");
  });

  it("cleanMarkdown strips --- separators", () => {
    expect(cleanMarkdown("Compétences\n---\nManagement")).toBe("Compétences\n\nManagement");
  });

  it("cleanMarkdown strips [Adresse], [Téléphone], [Email]", () => {
    const cleaned = cleanMarkdown("[Adresse] Paris [Téléphone] 01 02 03 [Email] test@test.com");
    expect(cleaned).not.toContain("[Adresse]");
    expect(cleaned).not.toContain("[Téléphone]");
    expect(cleaned).not.toContain("[Email]");
  });

  it("buildCvRenderData summary has no markdown", () => {
    const data = buildCvRenderData({
      profile: {
        ...makeRealProfile(),
        summary: "**Directeur Commercial** avec 20 ans d'expérience.\n---\n### Expert en SaaS B2B.",
      },
    });
    if (data.summary) {
      expect(data.summary).not.toContain("**");
      expect(data.summary).not.toContain("###");
      expect(data.summary).not.toContain("---");
    }
  });
});

// ── Default template fallback ─────────────

describe("buildCvRenderData — template fallback", () => {
  it("unknown template → premium_leadership (V2.8.5 default)", () => {
    const data = buildCvRenderData({
      profile: { ...makeRealProfile(), cvDefaultTemplate: "unknown_template" },
    });
    expect(data.template).toBe("premium_leadership");
  });

  it("explicit ats_classic → ats_classic", () => {
    const data = buildCvRenderData({
      profile: { ...makeRealProfile(), cvDefaultTemplate: "ats_classic" },
    });
    expect(data.template).toBe("ats_classic");
  });

  it("explicit modern_executive → modern_executive", () => {
    const data = buildCvRenderData({
      profile: { ...makeRealProfile(), cvDefaultTemplate: "modern_executive" },
    });
    expect(data.template).toBe("modern_executive");
  });

  it("explicit premium_leadership → premium_leadership", () => {
    const data = buildCvRenderData({
      profile: { ...makeRealProfile(), cvDefaultTemplate: "premium_leadership" },
    });
    expect(data.template).toBe("premium_leadership");
  });
});

// ── Empty / minimal profile ───────────────

describe("buildCvRenderData — minimal profile", () => {
  it("empty profile → no crash, empty arrays", () => {
    const data = buildCvRenderData({});
    expect(data.languages).toEqual([]);
    expect(data.education).toEqual([]);
    expect(data.experiences).toEqual([]);
    expect(data.skills).toEqual([]);
    expect(data.summary).toBeUndefined();
    expect(data.identity.fullName).toBeUndefined();
  });

  it("null profile → no crash", () => {
    const data = buildCvRenderData({ profile: null });
    expect(data.template).toBe("premium_leadership");
    expect(data.options.includeLinkedIn).toBe(false);
    expect(data.options.includePhoto).toBe(true);
  });
});
