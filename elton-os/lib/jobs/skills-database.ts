import { generateJsonWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek"

export interface SkillDefinition {
  name: string
  category: SkillCategory
  aliases: string[]
  level: "foundation" | "intermediate" | "advanced" | "expert"
  sectors: string[]
  functions: string[]
  certifications?: string[]
  description: string
}

export type SkillCategory =
  | "leadership"
  | "commercial"
  | "strategique"
  | "finance"
  | "digital"
  | "sectoriel"
  | "langue"
  | "certification"
  | "operationnel"

export interface SectorProfile {
  id: string
  label: string
  criticalSkills: string[]
  recommendedSkills: string[]
}

export interface FunctionProfile {
  id: string
  label: string
  criticalSkills: string[]
  recommendedSkills: string[]
}

export interface SkillGapAnalysis {
  present: UserSkill[]
  missing: MissingSkill[]
  strengths: string[]
  recommendations: string[]
  coverageByCategory: Record<string, { present: number; total: number; percent: number }>
}

export interface UserSkill {
  name: string
  category: string
  level: string
  match: "exact" | "alias" | "partial"
}

export interface MissingSkill {
  name: string
  category: SkillCategory
  importance: "critical" | "recommended"
  reason: string
  suggestedAction: string
  relatedTo?: string[]
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  leadership: "Leadership & Management",
  commercial: "Commercial & Sales",
  strategique: "Stratégie & Business",
  finance: "Finance & P&L",
  digital: "Digital & Technologie",
  sectoriel: "Sectoriel",
  langue: "Langues",
  certification: "Certifications",
  operationnel: "Opérationnel",
}

const SKILL_DATABASE: SkillDefinition[] = [
  // ── Leadership ──
  { name: "Leadership transformationnel", category: "leadership", aliases: ["leadership", "transformation leadership", "change management"], level: "expert", sectors: ["*"], functions: ["direction", "management"], description: "Capacité à inspirer et guider des équipes dans la transformation" },
  { name: "Management d'équipe", category: "leadership", aliases: ["team management", "gestion d'équipe", "management d'équipe", "encadrement"], level: "expert", sectors: ["*"], functions: ["direction", "management"], description: "Management direct d'équipes de 10 à 100+ personnes" },
  { name: "Conduite du changement", category: "leadership", aliases: ["change management", "gestion du changement", "transformation"], level: "advanced", sectors: ["*"], functions: ["direction", "management"], description: "Accompagnement des équipes dans les transformations" },
  { name: "Gestion de crise", category: "leadership", aliases: ["crisis management", "gestion de crise", "turnaround"], level: "advanced", sectors: ["*"], functions: ["direction"], description: "Pilotage en contexte de crise ou retournement" },
  { name: "Mentoring", category: "leadership", aliases: ["mentorat", "coaching", "talent development"], level: "intermediate", sectors: ["*"], functions: ["direction", "management"], description: "Développement des talents et succession planning" },
  { name: "Recrutement", category: "leadership", aliases: ["recruitment", "talent acquisition", "sourcing"], level: "intermediate", sectors: ["*"], functions: ["management", "direction"], description: "Recrutement et intégration de talents" },

  // ── Commercial ──
  { name: "Développement commercial", category: "commercial", aliases: ["business development", "développement commercial b2b", "growth"], level: "expert", sectors: ["*"], functions: ["commercial", "direction"], description: "Développement du portefeuille clients et conquête de parts de marché" },
  { name: "Négociation", category: "commercial", aliases: ["negotiation", "négociation commerciale", "deal making"], level: "expert", sectors: ["*"], functions: ["commercial", "direction"], description: "Négociation de contrats complexes et partenariats stratégiques" },
  { name: "Key Account Management", category: "commercial", aliases: ["grands comptes", "KAM", "account management", "gestion de comptes clés"], level: "advanced", sectors: ["*"], functions: ["commercial"], description: "Gestion et développement des comptes stratégiques" },
  { name: "Avant-vente", category: "commercial", aliases: ["presales", "avant-vente technique", "solution selling"], level: "intermediate", sectors: ["tech", "saas", "industrie"], functions: ["commercial"], description: "Accompagnement technique et commercial avant-vente" },
  { name: "CRM Management", category: "commercial", aliases: ["crm", "salesforce", "hubspot", "customer relationship management", "pipedrive"], level: "advanced", sectors: ["*"], functions: ["commercial", "direction"], description: "Maîtrise des outils CRM et pilotage de l'activité commerciale" },
  { name: "Force de vente", category: "commercial", aliases: ["sales management", "pilotage commercial", "sales operations", "animation force de vente"], level: "advanced", sectors: ["*"], functions: ["commercial", "direction"], description: "Animation et pilotage d'une force de vente terrain" },
  { name: "International Sales", category: "commercial", aliases: ["vente internationale", "export", "global sales", "business development international"], level: "advanced", sectors: ["industrie", "tech", "luxe"], functions: ["commercial", "direction"], description: "Développement commercial à l'international" },

  // ── Stratégique ──
  { name: "Stratégie d'entreprise", category: "strategique", aliases: ["stratégie", "business strategy", "corporate strategy", "planification stratégique"], level: "expert", sectors: ["*"], functions: ["direction"], description: "Définition et exécution de la stratégie d'entreprise" },
  { name: "Business Plan", category: "strategique", aliases: ["business plan", "plan d'affaires", "budget prévisionnel"], level: "advanced", sectors: ["*"], functions: ["direction", "finance"], description: "Élaboration de business plans et feuilles de route" },
  { name: "Transformation digitale", category: "strategique", aliases: ["digital transformation", "transformation numérique", "digitalisation"], level: "advanced", sectors: ["*"], functions: ["direction", "management"], description: "Pilotage de la transformation digitale de l'entreprise" },
  { name: "Développement de partenariats", category: "strategique", aliases: ["partenariats", "partnerships", "alliances stratégiques", "business alliances"], level: "advanced", sectors: ["*"], functions: ["direction", "commercial"], description: "Développement et gestion de partenariats stratégiques" },
  { name: "Innovation", category: "strategique", aliases: ["innovation management", "innovation stratégique", "new business development"], level: "intermediate", sectors: ["*"], functions: ["direction"], description: "Management de l'innovation et du développement de nouveaux business" },
  { name: "M&A", category: "strategique", aliases: ["fusion acquisition", "merger acquisition", "corporate development", "due diligence"], level: "intermediate", sectors: ["*"], functions: ["direction", "finance"], description: "Participation à des opérations de fusion-acquisition" },
  { name: "RSE", category: "strategique", aliases: ["csr", "sustainable development", "développement durable", "esg"], level: "intermediate", sectors: ["*"], functions: ["direction"], description: "Pilotage de la stratégie RSE / ESG" },

  // ── Finance ──
  { name: "Gestion budgétaire", category: "finance", aliases: ["budget management", "budgeting", "pilotage budgétaire", "budget"], level: "expert", sectors: ["*"], functions: ["direction", "finance"], description: "Élaboration et suivi du budget, analyse des écarts" },
  { name: "P&L Management", category: "finance", aliases: ["profit & loss", "compte de résultat", "p&l", "pilotage de la performance"], level: "expert", sectors: ["*"], functions: ["direction", "finance"], description: "Responsabilité de la profitabilité et pilotage du P&L" },
  { name: "Analyse financière", category: "finance", aliases: ["financial analysis", "reporting financier", "analyse financière"], level: "advanced", sectors: ["*"], functions: ["direction", "finance"], description: "Analyse des performances financières et reporting" },
  { name: "Contrôle de gestion", category: "finance", aliases: ["controlling", "management control", "contrôle budgétaire"], level: "advanced", sectors: ["*"], functions: ["finance", "direction"], description: "Mise en place et suivi du contrôle de gestion" },
  { name: "EBITDA Management", category: "finance", aliases: ["ebitda", "margin management", "gestion de marge", "profitabilité"], level: "advanced", sectors: ["*"], functions: ["direction", "finance"], description: "Optimisation de l'EBITDA et de la profitabilité" },
  { name: "Cost Management", category: "finance", aliases: ["cost control", "optimisation des coûts", "réduction des coûts", "cost optimization"], level: "advanced", sectors: ["*"], functions: ["direction", "finance", "management"], description: "Optimisation et réduction des coûts opérationnels" },

  // ── Digital ──
  { name: "Salesforce", category: "digital", aliases: ["salesforce crm", "salesforce administration", "sfdc"], level: "advanced", sectors: ["*"], functions: ["commercial", "direction"], description: "Maîtrise avancée de Salesforce CRM" },
  { name: "HubSpot", category: "digital", aliases: ["hubspot crm", "hubspot marketing", "hubspot sales"], level: "intermediate", sectors: ["*"], functions: ["commercial"], description: "Maîtrise de HubSpot CRM" },
  { name: "Power BI", category: "digital", aliases: ["powerbi", "microsoft power bi", "bi reporting"], level: "advanced", sectors: ["*"], functions: ["direction", "management"], description: "Création de tableaux de bord et reporting avec Power BI" },
  { name: "Tableau Software", category: "digital", aliases: ["tableau", "tableau desktop", "tableau server"], level: "intermediate", sectors: ["*"], functions: ["direction"], description: "Data visualisation avec Tableau" },
  { name: "Data Analytics", category: "digital", aliases: ["analyse de données", "data analysis", "business intelligence", "bi"], level: "advanced", sectors: ["*"], functions: ["direction", "management"], description: "Analyse de données pour la prise de décision" },
  { name: "IA / Machine Learning", category: "digital", aliases: ["intelligence artificielle", "ai", "machine learning", "deep learning"], level: "intermediate", sectors: ["*"], functions: ["direction"], description: "Compréhension et application de l'IA en entreprise" },
  { name: "ERP / SAP", category: "digital", aliases: ["sap", "erp", "sage", "oracle"], level: "intermediate", sectors: ["*"], functions: ["direction", "finance"], description: "Maîtrise des ERP (SAP, Oracle, Sage)" },
  { name: "Notion / Monday / Asana", category: "digital", aliases: ["project management tools", "gestion de projet", "notion", "monday", "asana", "trello"], level: "intermediate", sectors: ["*"], functions: ["management"], description: "Outils de gestion de projet et collaboration" },

  // ── Sectoriel ──
  { name: "Industrie / B2B Industriel", category: "sectoriel", aliases: ["industrie", "manufacturing", "industrial b2b", "b2b industriel"], level: "advanced", sectors: ["industrie"], functions: ["*"], description: "Expertise du secteur industriel et B2B" },
  { name: "SaaS / Tech", category: "sectoriel", aliases: ["saas", "software", "tech b2b", "editeur", "logiciel"], level: "advanced", sectors: ["saas", "tech"], functions: ["*"], description: "Expertise du secteur SaaS et des éditeurs de logiciels" },
  { name: "Distribution B2B", category: "sectoriel", aliases: ["distribution", "wholesale", "distribution b2b", "n&d"], level: "advanced", sectors: ["distribution b2b"], functions: ["*"], description: "Expertise de la distribution B2B et Négoces" },
  { name: "Retail & Grande Consommation", category: "sectoriel", aliases: ["retail", "grande consommation", "fmcg", "distribution"], level: "advanced", sectors: ["retail"], functions: ["*"], description: "Expertise du retail et grande consommation" },
  { name: "Luxe & Premium", category: "sectoriel", aliases: ["luxe", "luxury", "premium"], level: "intermediate", sectors: ["luxe"], functions: ["*"], description: "Expertise du secteur du luxe" },
  { name: "Conseil", category: "sectoriel", aliases: ["consulting", "conseil en management", "stratégie"], level: "intermediate", sectors: ["conseil"], functions: ["*"], description: "Expertise du conseil en management" },
  { name: "Énergie / Utilities", category: "sectoriel", aliases: ["énergie", "energy", "utilities"], level: "intermediate", sectors: ["énergie"], functions: ["*"], description: "Expertise du secteur de l'énergie" },
  { name: "Finance / Banque / Assurance", category: "sectoriel", aliases: ["finance", "banque", "assurance", "banking", "insurance"], level: "intermediate", sectors: ["finance"], functions: ["*"], description: "Expertise du secteur financier" },
  { name: "Santé / Pharma", category: "sectoriel", aliases: ["santé", "healthcare", "pharma", "médical"], level: "intermediate", sectors: ["santé"], functions: ["*"], description: "Expertise du secteur santé / pharma" },

  // ── Langues ──
  { name: "Anglais courant", category: "langue", aliases: ["english fluent", "business english", "anglais professionnel"], level: "advanced", sectors: ["*"], functions: ["*"], description: "Anglais professionnel courant (C1/C2)" },
  { name: "Anglais bilingue", category: "langue", aliases: ["english bilingual", "bilingual", "anglais langue maternelle"], level: "expert", sectors: ["*"], functions: ["*"], description: "Anglais bilingue ou langue maternelle" },
  { name: "Allemand", category: "langue", aliases: ["german", "deutsch", "allemand professionnel"], level: "intermediate", sectors: ["*"], functions: ["*"], description: "Allemand professionnel" },
  { name: "Espagnol", category: "langue", aliases: ["spanish", "español", "espagnol professionnel"], level: "intermediate", sectors: ["*"], functions: ["*"], description: "Espagnol professionnel" },
  { name: "Italien", category: "langue", aliases: ["italian", "italiano", "italien professionnel"], level: "intermediate", sectors: ["*"], functions: ["*"], description: "Italien professionnel" },
  { name: "Chinois", category: "langue", aliases: ["chinese", "mandarin", "chinois professionnel"], level: "intermediate", sectors: ["*"], functions: ["*"], description: "Chinois professionnel" },

  // ── Certifications ──
  { name: "MBA", category: "certification", aliases: ["mba", "executive mba", "master of business administration"], level: "expert", sectors: ["*"], functions: ["*"], description: "Master of Business Administration" },
  { name: "INSEAD", category: "certification", aliases: ["insead", "insead executive"], level: "expert", sectors: ["*"], functions: ["*"], description: "Formation INSEAD" },
  { name: "HEC Paris", category: "certification", aliases: ["hec", "hec paris", "hec executive"], level: "expert", sectors: ["*"], functions: ["*"], description: "Formation HEC Paris" },
  { name: "ESCP", category: "certification", aliases: ["escp", "escp europe"], level: "expert", sectors: ["*"], functions: ["*"], description: "Formation ESCP" },
  { name: "ESSEC", category: "certification", aliases: ["essec", "essec business school"], level: "expert", sectors: ["*"], functions: ["*"], description: "Formation ESSEC" },
  { name: "PMP / Agile", category: "certification", aliases: ["pmp", "project management", "agile", "scrum", "certification gestion de projet"], level: "advanced", sectors: ["*"], functions: ["management"], description: "Certification en gestion de projet" },
  { name: "Salesforce Certified", category: "certification", aliases: ["salesforce certified", "salesforce admin", "salesforce consultant"], level: "advanced", sectors: ["*"], functions: ["commercial"], description: "Certification Salesforce" },
  { name: "DGCCRF / Conformité", category: "certification", aliases: ["dgccrf", "conformité", "compliance", "rgpd"], level: "intermediate", sectors: ["*"], functions: ["direction"], description: "Connaissance des réglementations commerciales" },
  { name: "Green Belt / Black Belt", category: "certification", aliases: ["six sigma", "lean", "green belt", "black belt", "amélioration continue"], level: "intermediate", sectors: ["industrie"], functions: ["management", "direction"], description: "Certification Lean Six Sigma" },
]

const SECTOR_PROFILES: SectorProfile[] = [
  { id: "industrie", label: "Industrie", criticalSkills: ["Management d'équipe", "Gestion budgétaire", "P&L Management", "Développement commercial", "Négociation"], recommendedSkills: ["Conduite du changement", "Green Belt / Black Belt", "ERP / SAP", "International Sales", "Industrie / B2B Industriel"] },
  { id: "saas", label: "SaaS / Tech", criticalSkills: ["Développement commercial", "CRM Management", "Transformation digitale", "P&L Management", "Force de vente"], recommendedSkills: ["Avant-vente", "Salesforce", "Data Analytics", "SaaS / Tech", "IA / Machine Learning"] },
  { id: "distribution b2b", label: "Distribution B2B", criticalSkills: ["Négociation", "Développement commercial", "Force de vente", "Gestion budgétaire", "Management d'équipe"], recommendedSkills: ["Distribution B2B", "Key Account Management", "ERP / SAP", "P&L Management"] },
  { id: "retail", label: "Retail & Gde Conso", criticalSkills: ["Développement commercial", "Négociation", "Force de vente", "P&L Management", "Management d'équipe"], recommendedSkills: ["Retail & Grande Consommation", "CRM Management", "Conduite du changement", "Transformation digitale"] },
  { id: "tech", label: "Tech", criticalSkills: ["Développement commercial", "Transformation digitale", "CRM Management", "Stratégie d'entreprise", "Avant-vente"], recommendedSkills: ["SaaS / Tech", "Salesforce", "Data Analytics", "IA / Machine Learning", "International Sales"] },
  { id: "finance", label: "Finance / Banque", criticalSkills: ["Analyse financière", "Gestion budgétaire", "P&L Management", "Contrôle de gestion", "Stratégie d'entreprise"], recommendedSkills: ["Finance / Banque / Assurance", "M&A", "RSE", "EBITDA Management", "Conformité"] },
  { id: "conseil", label: "Conseil", criticalSkills: ["Stratégie d'entreprise", "Business Plan", "Transformation digitale", "Conduite du changement", "Leadership transformationnel"], recommendedSkills: ["Conseil", "M&A", "Data Analytics", "RSE", "Innovation"] },
]

const FUNCTION_PROFILES: FunctionProfile[] = [
  { id: "direction", label: "Direction Générale / Commerciale", criticalSkills: ["Stratégie d'entreprise", "P&L Management", "Leadership transformationnel", "Développement commercial", "Gestion budgétaire"], recommendedSkills: ["M&A", "Transformation digitale", "Business Plan", "RSE", "Conduite du changement"] },
  { id: "commercial", label: "Commercial / Sales", criticalSkills: ["Développement commercial", "Négociation", "Force de vente", "CRM Management", "Key Account Management"], recommendedSkills: ["Avant-vente", "International Sales", "Salesforce", "HubSpot", "Stratégie d'entreprise"] },
  { id: "management", label: "Management / Opérations", criticalSkills: ["Management d'équipe", "Conduite du changement", "Gestion budgétaire", "Recrutement", "Reporting"], recommendedSkills: ["Power BI", "Notion / Monday / Asana", "Green Belt / Black Belt", "Innovation", "Data Analytics"] },
  { id: "finance", label: "Finance / Administration", criticalSkills: ["Analyse financière", "Contrôle de gestion", "P&L Management", "Gestion budgétaire", "EBITDA Management"], recommendedSkills: ["ERP / SAP", "M&A", "Cost Management", "Power BI", "Conformité"] },
]

export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return SKILL_DATABASE.filter((s) => s.category === category)
}

export function getSkillsBySector(sector: string): { critical: SkillDefinition[]; recommended: SkillDefinition[] } {
  const profile = SECTOR_PROFILES.find((sp) => sp.id === sector)
  if (!profile) return { critical: [], recommended: [] }
  return {
    critical: profile.criticalSkills.map((name) => SKILL_DATABASE.find((s) => s.name === name)).filter(Boolean) as SkillDefinition[],
    recommended: profile.recommendedSkills.map((name) => SKILL_DATABASE.find((s) => s.name === name)).filter(Boolean) as SkillDefinition[],
  }
}

export function getSkillsByFunction(func: string): { critical: SkillDefinition[]; recommended: SkillDefinition[] } {
  const profile = FUNCTION_PROFILES.find((fp) => fp.id === func)
  if (!profile) return { critical: [], recommended: [] }
  return {
    critical: profile.criticalSkills.map((name) => SKILL_DATABASE.find((s) => s.name === name)).filter(Boolean) as SkillDefinition[],
    recommended: profile.recommendedSkills.map((name) => SKILL_DATABASE.find((s) => s.name === name)).filter(Boolean) as SkillDefinition[],
  }
}

export function searchSkills(query: string): SkillDefinition[] {
  const lower = query.toLowerCase()
  return SKILL_DATABASE.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.aliases.some((a) => a.includes(lower)) ||
      s.description.toLowerCase().includes(lower)
  )
}

export function getAllCategories(): { key: SkillCategory; label: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const skill of SKILL_DATABASE) {
    counts[skill.category] = (counts[skill.category] || 0) + 1
  }
  return Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key: key as SkillCategory,
    label,
    count: counts[key] || 0,
  }))
}

async function analyzeSkillGapsWithAI(
  userSkills: { name: string; category: string; level: string }[],
  targetSector?: string,
  targetFunction?: string
): Promise<SkillGapAnalysis | null> {
  const config = await getDeepSeekConfig()
  if (!config) return null

  const skillSummary = userSkills.map(s => `- ${s.name} (${s.category}, niveau: ${s.level})`).join("\n")

  const result = await generateJsonWithDeepSeek<{
    present: { name: string; category: string; level: string; match: "exact" | "alias" | "partial" }[]
    missing: { name: string; category: string; importance: "critical" | "recommended"; reason: string; suggestedAction: string; relatedTo?: string[] }[]
    strengths: string[]
    recommendations: string[]
    coverageByCategory: Record<string, { present: number; total: number; percent: number }>
  }>({
    systemPrompt: `Tu es un expert en analyse de compétences pour cadres dirigeants en France.
Analyse les compétences d'un candidat par rapport à un secteur et une fonction cibles.

Secteurs possibles : Industrie, SaaS, Distribution B2B, Retail, Tech, Finance, Conseil, Santé, Luxe, Énergie
Fonctions possibles : Direction Générale/Commerciale, Commercial/Sales, Management/Opérations, Finance/Administration

Compétences clés pour un Directeur Commercial / VP Sales :
- Criticales : Leadership, P&L, Développement commercial, Négociation, Management d'équipe, Stratégie
- Importantes : Transformation digitale, Conduite du changement, CRM, Force de vente, Business Plan`,
    userPrompt: `Analyse les gaps de compétences pour ce profil :

${
  targetSector ? `Secteur cible : ${targetSector}` : "Pas de secteur spécifié"
}
${
  targetFunction ? `Fonction cible : ${targetFunction}` : "Pas de fonction spécifiée"
}

COMPÉTENCES DU CANDIDAT (${userSkills.length}) :
${skillSummary || "Aucune compétence renseignée"}

Retourne UNIQUEMENT un JSON :
{
  "present": [{"name": "...", "category": "Leadership & Management", "level": "expert|advanced|intermediate|foundation", "match": "exact|alias|partial"}],
  "missing": [{"name": "...", "category": "...", "importance": "critical|recommended", "reason": "...", "suggestedAction": "...", "relatedTo": ["alias1", "alias2"]}],
  "strengths": ["force 1", "force 2"],
  "recommendations": ["recommandation 1"],
  "coverageByCategory": {"Leadership & Management": {"present": 2, "total": 6, "percent": 33}}
}

Sois précis. N'invente pas de compétences. JSON uniquement.`,
    temperature: 0.3,
  })

  if (result.success && result.data) {
    return {
      present: result.data.present,
      missing: result.data.missing as MissingSkill[],
      strengths: result.data.strengths,
      recommendations: result.data.recommendations,
      coverageByCategory: result.data.coverageByCategory,
    }
  }
  return null
}

export async function analyzeSkillGaps(
  userSkills: { name: string; category: string; level: string }[],
  targetSector?: string,
  targetFunction?: string
): Promise<SkillGapAnalysis> {
  const aiResult = await analyzeSkillGapsWithAI(userSkills, targetSector, targetFunction)
  if (aiResult) return aiResult

  const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase()))
  const userSkillAliases = new Map<string, string>()
  for (const us of userSkills) {
    const def = SKILL_DATABASE.find(
      (d) => d.name.toLowerCase() === us.name.toLowerCase() || d.aliases.some((a) => a === us.name.toLowerCase())
    )
    if (def) userSkillAliases.set(def.name.toLowerCase(), us.name)
  }

  const present: UserSkill[] = []
  const missing: MissingSkill[] = []
  const seen = new Set<string>()

  const relevantSkills = SKILL_DATABASE.filter((s) => {
    if (targetSector && s.sectors[0] !== "*" && !s.sectors.includes(targetSector)) return false
    if (targetFunction && s.functions[0] !== "*" && !s.functions.includes(targetFunction)) return false
    return true
  })

  for (const skill of relevantSkills) {
    const skillLower = skill.name.toLowerCase()
    if (seen.has(skillLower)) continue
    seen.add(skillLower)

    const isPresent =
      userSkillNames.has(skillLower) ||
      skill.aliases.some((a) => userSkillNames.has(a.toLowerCase()))

    if (isPresent) {
      const match = userSkills.find(
        (us) =>
          us.name.toLowerCase() === skillLower ||
          skill.aliases.some((a) => a.toLowerCase() === us.name.toLowerCase())
      )
      present.push({
        name: skill.name,
        category: CATEGORY_LABELS[skill.category],
        level: match?.level || "non spécifié",
        match: userSkillNames.has(skillLower) ? "exact" : "alias",
      })
    } else {
      const sectorProfile = targetSector ? SECTOR_PROFILES.find((sp) => sp.id === targetSector) : null
      const funcProfile = targetFunction ? FUNCTION_PROFILES.find((fp) => fp.id === targetFunction) : null

      const isCritical =
        sectorProfile?.criticalSkills.includes(skill.name) ||
        funcProfile?.criticalSkills.includes(skill.name) ||
        false

      const isRecommended =
        sectorProfile?.recommendedSkills.includes(skill.name) ||
        funcProfile?.recommendedSkills.includes(skill.name) ||
        false

      if (isCritical || isRecommended) {
        const reasons: string[] = []
        if (sectorProfile?.criticalSkills.includes(skill.name)) reasons.push(`Critique pour le secteur ${sectorProfile.label}`)
        if (funcProfile?.criticalSkills.includes(skill.name)) reasons.push(`Critique pour la fonction ${funcProfile.label}`)
        if (sectorProfile?.recommendedSkills.includes(skill.name)) reasons.push(`Recommandé dans le secteur ${sectorProfile.label}`)
        if (funcProfile?.recommendedSkills.includes(skill.name)) reasons.push(`Recommandé pour la fonction ${funcProfile.label}`)

        missing.push({
          name: skill.name,
          category: skill.category,
          importance: isCritical ? "critical" : "recommended",
          reason: reasons.join(" ; ") || `Compétence pertinente pour votre profil`,
          suggestedAction: skill.certifications?.length
            ? `Envisagez ${skill.certifications[0]}`
            : `Ajoutez "${skill.name}" à votre profil`,
          relatedTo: skill.aliases.slice(0, 3),
        })
      }
    }
  }

  const missingByCategory: Record<string, { present: number; total: number }> = {}
  for (const skill of present) {
    if (!missingByCategory[skill.category]) missingByCategory[skill.category] = { present: 0, total: 0 }
    missingByCategory[skill.category].present++
  }
  for (const skill of relevantSkills) {
    const cat = CATEGORY_LABELS[skill.category]
    if (!missingByCategory[cat]) missingByCategory[cat] = { present: 0, total: 0 }
    missingByCategory[cat].total++
  }

  const coverageByCategory: Record<string, { present: number; total: number; percent: number }> = {}
  for (const [cat, data] of Object.entries(missingByCategory)) {
    coverageByCategory[cat] = {
      ...data,
      percent: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }
  }

  const strengths = present
    .filter((p) => p.level === "expert" || p.level === "advanced")
    .slice(0, 5)
    .map((p) => `${p.name} (${p.level})`)

  const recommendations = missing
    .filter((m) => m.importance === "critical")
    .slice(0, 5)
    .map((m) => `Ajouter : ${m.name}`)

  return { present, missing, strengths, recommendations, coverageByCategory }
}

export { SKILL_DATABASE, SECTOR_PROFILES, FUNCTION_PROFILES, CATEGORY_LABELS }
