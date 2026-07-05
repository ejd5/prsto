/**
 * Skills Normalizer
 * Groups, deduplicates, and categorizes skills for CV display.
 * Separates "savoir-faire" (technical/business) from "savoir-être" (soft/leadership).
 */

interface RawSkill {
  name: string;
  category: string;
  level?: string;
}

interface SkillGroup {
  name: string;
  skills: string[];
}

// Keywords that suggest a skill is "savoir-être" (soft/leadership)
const SOFT_SKILLS_TRIGGERS = [
  "leadership", "lead",
  "management d'équipe", "team management",
  "management transversal",
  "communication", "influence",
  "décision", "priorisation", "résilience",
  "esprit d'équipe", "collaboration",
  "autonomie", "proactivité",
  "créativité",
  "pédagogie", "mentorat",
  "organisation", "rigueur", "méthode",
  "coaching", "coacher",
  "négociation soft",
];

// Keywords that suggest a skill is "savoir-faire" (business/technical know-how)
const KNOW_HOW_TRIGGERS = [
  "direction", "pilotage", "stratégie", "stratégique",
  "commercial", "business", "vente", "sales",
  "négociation", "développement",
  "croissance", "revenue", "p&l", "budget",
  "crm", "salesforce", "pipeline", "forecast", "kpi",
  "marketing", "digital", "transformation",
  "international", "export",
  "supply", "logistique", "production",
  "finance", "juridique", "legal",
  "rh", "recrutement", "talent", "formation",
  "relation client", "client", "account",
  "opérationnel", "operationnel",
  "data", "analyse", "reporting",
  "innovation", "change",
  "marché", "market", "secteur",
];

const SKILL_GROUPS: Record<string, string[]> = {
  "Direction commerciale": ["direction commerciale", "direction des ventes", "directeur commercial", "sales director", "head of sales", "commercial leadership"],
  "Pilotage P&L": ["p&l", "profit & loss", "budget", "pilotage budgétaire"],
  "Négociation": ["négociation", "négociation commerciale", "négociation grands comptes", "negotiation"],
  "Développement commercial": ["développement commercial", "business development"],
  "Growth / Revenue": ["revenue growth", "growth", "revenue", "rgm", "pricing"],
  "CRM / Pipeline": ["crm", "salesforce", "hubspot", "pipeline", "forecast"],
  "Transformation": ["transformation commerciale", "transformation", "change management", "conduite du changement"],
  "Relation client": ["relation client", "account management", "grands comptes", "key account"],
  "International": ["international", "export", "développement international", "global"],
  "Stratégie": ["stratégie", "stratégie commerciale", "strategic planning", "go-to-market", "gtm"],
};

const SOFT_SKILLS_GROUPS: Record<string, string[]> = {
  "Leadership": ["leadership", "lead", "leader"],
  "Management d'équipe": ["management d'équipe", "team management", "management opérationnel"],
  "Communication & Influence": ["communication", "influence", "persuasion"],
  "Décision & Priorisation": ["décision", "decision", "priorisation"],
  "Résilience": ["résilience", "resilience", "adaptabilité"],
  "Organisation & Rigueur": ["organisation", "rigueur", "méthode"],
};

function resolveGroup(name: string): { groupName: string; isSoft: boolean } {
  const lower = name.toLowerCase();

  // Check soft skills groups first
  for (const [group, keywords] of Object.entries(SOFT_SKILLS_GROUPS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return { groupName: group, isSoft: true };
    }
  }

  // Check explicit know-how groups
  for (const [group, keywords] of Object.entries(SKILL_GROUPS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) || kw.includes(lower)) return { groupName: group, isSoft: false };
    }
  }

  // Auto-classify based on triggers
  const isSoft = SOFT_SKILLS_TRIGGERS.some((k) => lower.includes(k));
  const isKnowHow = KNOW_HOW_TRIGGERS.some((k) => lower.includes(k));

  if (isSoft) return { groupName: "Savoir-être", isSoft: true };
  if (isKnowHow) return { groupName: "Savoir-faire", isSoft: false };

  return { groupName: "Compétences", isSoft: false };
}

/**
 * Normalize and categorize skills into know-how / soft skills.
 */
export function normalizeSkills(skills: RawSkill[]): {
  knowHow: SkillGroup[];
  softSkills: SkillGroup[];
} {
  const knowHowMap = new Map<string, Set<string>>();
  const softSkillsMap = new Map<string, Set<string>>();

  for (const skill of skills) {
    const { groupName, isSoft } = resolveGroup(skill.name);
    const target = isSoft ? softSkillsMap : knowHowMap;
    if (!target.has(groupName)) target.set(groupName, new Set());
    target.get(groupName)!.add(skill.name.trim());
  }

  const knowHow: SkillGroup[] = [];
  const softSkills: SkillGroup[] = [];

  const KNOW_HOW_PRIORITY = [
    "Direction commerciale", "Pilotage P&L", "Négociation",
    "Développement commercial", "Growth / Revenue", "CRM / Pipeline",
    "Transformation", "Relation client", "International", "Stratégie",
    "Savoir-faire", "Compétences",
  ];

  const SOFT_PRIORITY = [
    "Leadership", "Management d'équipe", "Communication & Influence",
    "Décision & Priorisation", "Résilience", "Savoir-être",
  ];

  for (const [group, skills] of knowHowMap.entries()) {
    knowHow.push({ name: group, skills: Array.from(skills).sort() });
  }
  knowHow.sort((a, b) => {
    const ai = KNOW_HOW_PRIORITY.indexOf(a.name);
    const bi = KNOW_HOW_PRIORITY.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  for (const [group, skills] of softSkillsMap.entries()) {
    softSkills.push({ name: group, skills: Array.from(skills).sort() });
  }
  softSkills.sort((a, b) => {
    const ai = SOFT_PRIORITY.indexOf(a.name);
    const bi = SOFT_PRIORITY.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return {
    knowHow: knowHow.slice(0, 8),
    softSkills: softSkills.slice(0, 4),
  };
}

/**
 * Render skills section for CV.
 * Always includes both savoir-faire and savoir-être sections if data exists.
 */
export function renderSkillsSection(skills: RawSkill[], mode: "premium" | "simple" = "premium"): string {
  const { knowHow, softSkills } = normalizeSkills(skills);
  const lines: string[] = [];

  if (knowHow.length > 0) {
    lines.push("SAVOIR-FAIRE STRATÉGIQUE");
    for (const group of knowHow) {
      lines.push(`• ${group.name} : ${group.skills.join(", ")}`);
    }
  } else {
    lines.push("SAVOIR-FAIRE STRATÉGIQUE");
    lines.push("• Expertise professionnelle détaillée dans le CV maître");
  }

  if (softSkills.length > 0) {
    lines.push("");
    lines.push("SAVOIR-ÊTRE EXÉCUTIF");
    for (const group of softSkills) {
      lines.push(`• ${group.name} : ${group.skills.join(", ")}`);
    }
  } else {
    lines.push("");
    lines.push("SAVOIR-ÊTRE EXÉCUTIF");
    lines.push("• Leadership d'équipes commerciales");
    lines.push("• Culture du résultat et de la performance");
    lines.push("• Décision et priorisation en contexte exigeant");
  }

  return lines.join("\n");
}
