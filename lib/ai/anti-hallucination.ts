// ─── Enhanced Anti-Hallucination ───
// Pure functions — no AI, no network
// Post-AI validation cross-referencing against Profile, CV Master, Proof Vault

// ─── Types ────────────────────────────────────────

export type HallucinationSeverity = "critical" | "warning";

export interface HallucinationAlert {
  type: HallucinationType;
  excerpt: string;
  reason: string;
  severity: HallucinationSeverity;
}

export type HallucinationType =
  | "skill_invented"
  | "number_unverified"
  | "diploma_unverified"
  | "certification_unverified"
  | "company_invented"
  | "role_invented"
  | "superlative_excess"
  | "pl_responsibility"
  | "team_size_unverified"
  | "country_market_unverified";

export interface CandidateVerificationData {
  fullName: string;
  title: string;
  skills: Array<{ name: string; category: string }>;
  experiences: Array<{
    company: string;
    title: string;
    country?: string | null;
    description?: string | null;
    responsibilities?: string | null;
    teamSize?: number | null;
    revenue?: string | null;
    budget?: string | null;
  }>;
  education: string;
  certifications: string;
  proofEntries: Array<{ category: string; title: string; value: string }>;
  masterCVText: string;
  profileText: string;
}

// ─── Detection helpers ────────────────────────────

function buildVerifiedSet(candidate: CandidateVerificationData): string {
  return [
    candidate.fullName,
    candidate.title,
    candidate.education,
    candidate.certifications,
    candidate.masterCVText,
    candidate.profileText,
    ...candidate.skills.map(s => `${s.name} ${s.category}`),
    ...candidate.experiences.flatMap(e => [e.company, e.title, e.description || "", e.responsibilities || ""]),
    ...candidate.proofEntries.map(p => `${p.category} ${p.title} ${p.value}`),
  ].join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normal(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// ─── Main validation ──────────────────────────────

export function validateNoHallucinationEnhanced(
  content: string,
  candidate: CandidateVerificationData,
): { clean: boolean; alerts: HallucinationAlert[]; criticalCount: number; canExport: boolean } {
  const alerts: HallucinationAlert[] = [];
  const verifiedText = buildVerifiedSet(candidate);
  const verifiedTextNorm = normal(verifiedText);
  const verifiedSkills = candidate.skills.map(s => normal(s.name));
  const verifiedCompanies = candidate.experiences.map(e => normal(e.company));
  const verifiedTitles = candidate.experiences.map(e => normal(e.title));
  const verifiedCountries = candidate.experiences.map(e => normal(e.country || "")).filter(Boolean);
  const verifiedProofValues = candidate.proofEntries.map(p => normal(p.value));
  const verifiedEdu = normal(candidate.education);
  const verifiedCerts = normal(candidate.certifications);

  // ── 1. Missing skill ────────────────────────────
  const skillClaims = content.match(/(?:ma[îi]trise|expertise|compétence|expérience)\s+(?:en|de|des|du|le|la|l'|d')\s+[\w\sàâäéèêëîïôöùûüçœ]+/gi) || [];
  for (const claim of skillClaims) {
    const skillPart = normal(claim.replace(/^(?:ma[îi]trise|expertise|compétence|expérience)\s+(?:en|de|des|du|le|la|l'|d')\s+/i, "").trim());
    const found = verifiedSkills.some(s => s.includes(skillPart) || skillPart.includes(s));
    if (!found && skillPart.length > 2 && !verifiedTextNorm.includes(skillPart)) {
      alerts.push({ type: "skill_invented", excerpt: claim, reason: `Compétence "${claim}" non trouvée dans les compétences vérifiées`, severity: "critical" });
    }
  }

  // ── 2. Unverified number ────────────────────────
  const numPatterns = [
    /(\d{1,3}(?:\s)?(?:millions?|M€|milliards?|k€|K€)\s?(?:d'euros|€|EUR)?)/gi,
    /(?:CA|chiffre d'affaires|revenu|revenue|budget|généré)[\s\w]+?(\d{1,4}(?:\s)?[KkMm]?€?)/gi,
    /(?:augmentation|croissance|growth|hausse)\s+(?:de\s+)?(\d{1,3}\s?%)/gi,
    /(?:résultat|profit|marge|EBITDA)\s+(?:de\s+)?(\d{1,3}(?:\s)?[KkMm]?€?)/gi,
  ];
  for (const pattern of numPatterns) {
    const matches = content.match(pattern) || [];
    for (const m of matches) {
      const normM = normal(m);
      if (!verifiedTextNorm.includes(normM)) {
        const numMatch = m.match(/\d+/);
        if (numMatch && !verifiedProofValues.some(v => v.includes(numMatch[0]))) {
          alerts.push({ type: "number_unverified", excerpt: m, reason: `Chiffre "${m}" non vérifié dans le Proof Vault`, severity: "critical" });
        }
      }
    }
  }

  // ── 3. Unverified diploma ───────────────────────
  const diplomaPatterns = [
    /(?:MBA|Master|Mastère|Bachelor|PhD|Doctorat|Bac\s*\+\s*\d|Grande École|INSEAD|HEC|ESSEC|ESCP|Sciences\s*Po|Polytechnique|Centrale|Mines|Ponts|ENSAE|Dauphine|Sorbonne|EM\s*Lyon|EDHEC|KEDGE|NEOMA|SKEMA)[\w\s,-]*/gi,
  ];
  for (const pattern of diplomaPatterns) {
    const matches = content.match(pattern) || [];
    for (const m of matches) {
      const normM = normal(m);
      if (!verifiedEdu.includes(normM) && !verifiedCerts.includes(normM) && !verifiedTextNorm.includes(normM)) {
        const significantSchools = /INSEAD|HEC|ESSEC|ESCP|Polytechnique|Centrale|Harvard|Stanford|MIT|Oxford|Cambridge|LSE|IMD|Wharton|Columbia|Kellogg|Booth/i;
        const severity = significantSchools.test(m) ? "critical" : "warning";
        alerts.push({ type: "diploma_unverified", excerpt: m, reason: `Diplôme/école "${m}" non vérifié`, severity });
      }
    }
  }

  // ── 4. Unverified certification ─────────────────
  const certPatterns = /(?:certifi(?:é|ée|cation)|accrédit(?:é|ée|ation)|labellisé|PMI|PMP|SCRUM|Agile|Prince2|ITIL|Six\s*Sigma|Lean|Black\s*Belt)[\w\s,-]*/gi;
  const certMatches = content.match(certPatterns) || [];
  for (const m of certMatches) {
    const normM = normal(m);
    if (!verifiedCerts.includes(normM) && !verifiedTextNorm.includes(normM)) {
      alerts.push({ type: "certification_unverified", excerpt: m, reason: `Certification "${m}" non vérifiée`, severity: "warning" });
    }
  }

  // ── 5. Invented company ─────────────────────────
  const companyPatterns = /(?:chez|at|pour|for|au sein de|within)\s+([A-ZÉÈÊËÀÂÎÏÔÖÙÛÜÇŒÆ][\w\s&.-]{3,40})/gi;
  let cm;
  while ((cm = companyPatterns.exec(content)) !== null) {
    const companyName = normal(cm[1].trim());
    const found = verifiedCompanies.some(c => c.includes(companyName) || companyName.includes(c));
    if (!found && companyName.length > 3 && !verifiedTextNorm.includes(companyName)) {
      alerts.push({ type: "company_invented", excerpt: cm[0], reason: `Entreprise "${cm[1].trim()}" non trouvée dans l'historique`, severity: "critical" });
    }
  }

  // ── 6. Invented role ────────────────────────────
  const rolePatterns = /(?:en tant que|as a|comme)\s+([\w\sàâäéèêëîïôöùûüçœ-]{4,60})/gi;
  let rm;
  while ((rm = rolePatterns.exec(content)) !== null) {
    const roleName = normal(rm[1].trim());
    const found = verifiedTitles.some(t => t.includes(roleName) || roleName.includes(t));
    if (!found && roleName.length > 4 && !verifiedTextNorm.includes(roleName)) {
      alerts.push({ type: "role_invented", excerpt: rm[0], reason: `Poste "${rm[1].trim()}" non trouvé dans l'historique`, severity: "critical" });
    }
  }

  // ── 7. Excessive superlatives ───────────────────
  const superlatives = [
    /\b(?:meilleur|best|numéro\s*1|#1|leader incontesté|unique|seul|premier|first ever|inégalé|incomparable|exceptionnel|world.class|top.1%)\b/gi,
    /\b(?:tous les|toutes les|chaque|every single|aucun autre|nobody else|jamais|never)\b/gi,
  ];
  let superlativeCount = 0;
  for (const pattern of superlatives) {
    const matches = content.match(pattern) || [];
    superlativeCount += matches.length;
  }
  if (superlativeCount >= 3) {
    alerts.push({ type: "superlative_excess", excerpt: `${superlativeCount} superlatifs détectés`, reason: "Trop de superlatifs — crédibilité réduite", severity: "warning" });
  }

  // ── 8. P&L responsibility ───────────────────────
  const plPatterns = /(?:responsable|en charge|géré|managé|piloté|ownership|accountable)\s+(?:du|de la|des?|le|la|les?)?\s*(?:P&L|compte d'exploitation|profit and loss|budget|chiffre d'affaires|CA|revenue|résultat|EBITDA)/gi;
  const plMatches = content.match(plPatterns) || [];
  for (const pl of plMatches) {
    const normPL = normal(pl);
    if (!verifiedTextNorm.includes(normPL)) {
      const hasPLLike = verifiedProofValues.some(v =>
        /\d+\s*[KkMm]?€/.test(v) || /million|milliard|budget|chiffre d'affaires/i.test(v)
      );
      if (!hasPLLike) {
        alerts.push({ type: "pl_responsibility", excerpt: pl, reason: `Responsabilité P&L "${pl}" non prouvée dans le Proof Vault`, severity: "critical" });
      }
    }
  }

  // ── 9. Team size unverified ─────────────────────
  const teamPatterns = /(?:équipe|team|dirigé|managé|encadré|supervisé|leadership)\s+(?:une\s+)?(?:équipe\s+)?(?:de\s+)?(\d{1,3}(?:\s)?(?:personnes|people|collaborateurs|employés|FTE|ETP))/gi;
  let tm;
  while ((tm = teamPatterns.exec(content)) !== null) {
    const normTM = normal(tm[0]);
    const sizeMatch = tm[1].replace(/\s/g, "");
    const verifiedTeamSizes = candidate.experiences.map(e => e.teamSize?.toString() || "").filter(Boolean);
    const found = verifiedTeamSizes.includes(sizeMatch) || verifiedTextNorm.includes(normTM);
    if (!found) {
      alerts.push({ type: "team_size_unverified", excerpt: tm[0], reason: `Taille d'équipe "${tm[0]}" non vérifiée`, severity: "warning" });
    }
  }

  // ── 10. Country/market unverified ───────────────
  const marketPatterns = /(?:marché|market|pays|country|zone|region|lancé|déployé|implanté|ouvert)\s+(?:en|au|aux|dans|sur|in|at)\s+([A-ZÉÈÊËÀÂÎÏÔÖÙÛÜÇŒÆ][\w\s-]{3,30})/gi;
  let ccm;
  while ((ccm = marketPatterns.exec(content)) !== null) {
    const countryName = normal(ccm[1].trim());
    const found = verifiedCountries.some(c => c.includes(countryName) || countryName.includes(c));
    if (!found && countryName.length > 3 && !["france", "europe", "international", "monde"].includes(normal(countryName))) {
      if (!verifiedTextNorm.includes(countryName)) {
        alerts.push({ type: "country_market_unverified", excerpt: ccm[0], reason: `Expérience pays/marché "${ccm[1].trim()}" non vérifiée`, severity: "warning" });
      }
    }
  }

  // ─── Summary ────────────────────────────────────
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const clean = criticalCount === 0;

  return {
    clean,
    alerts,
    criticalCount,
    canExport: clean && alerts.filter(a => a.severity === "warning").length <= 3,
  };
}

// ─── Block export check ───────────────────────────

export function getExportBlockReason(
  halluResult: { clean: boolean; criticalCount: number; canExport: boolean; alerts: HallucinationAlert[] },
): string | null {
  if (!halluResult.canExport) {
    const criticals = halluResult.alerts.filter(a => a.severity === "critical");
    const warnings = halluResult.alerts.filter(a => a.severity === "warning");
    const reasons: string[] = [];
    if (criticals.length > 0) reasons.push(`${criticals.length} alerte(s) critique(s)`);
    if (warnings.length > 3) reasons.push(`${warnings.length} alertes warning (max 3)`);
    return `Export bloqué : ${reasons.join(", ")}. Validez le document avant export.`;
  }
  return null;
}
