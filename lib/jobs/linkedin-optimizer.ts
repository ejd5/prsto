import { generateJsonWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek"

export interface LinkedInInput {
  fullName: string
  title: string
  summary: string
  headline?: string
  location?: string
  sectors?: string
  functions?: string
  education?: string
  certifications?: string
  languages?: string
  linkedin?: string
  profilePhoto?: boolean
  bannerImage?: boolean
  customUrl?: boolean
  recommendations?: number
  experiences?: Array<{
    company: string
    title: string
    sector?: string
    startDate: string
    endDate?: string
    description?: string
    achievements?: string
  }>
  skills?: Array<{
    name: string
    category: string
    level: string
  }>
}

export interface LinkedInAnalysis {
  overallScore: number
  sections: LinkedInSection[]
  suggestions: LinkedInSuggestion[]
  strengths: string[]
  optimizedHeadline?: string
  optimizedSummary?: string
  profileCompleteness?: ProfileCompleteness
  keywordMatch?: KeywordMatchResult
}

export interface LinkedInSection {
  name: string
  score: number
  status: "good" | "needs-work" | "missing"
  details: string
}

export interface LinkedInSuggestion {
  id: string
  section: string
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  suggestedAction: string
}

export interface ProfileCompleteness {
  score: number
  hasPhoto: boolean
  hasBanner: boolean
  hasCustomUrl: boolean
  hasRecommendations: boolean
  hasLocation: boolean
  hasEducation: boolean
  hasCertifications: boolean
  hasLanguages: boolean
  details: string
}

export interface KeywordMatchResult {
  matched: string[]
  missing: string[]
  coveragePercent: number
  suggestions: string[]
}

// ── Patterns enrichis ──

const LINKEDIN_HEADLINE_BEST_PRACTICES = [
  // Titres et séniorité
  { pattern: /directeur|director|manager|head|vp|chief|leader|lead|senior|président|responsable|président|fondateur|co-founder|partner/i, points: 15 },
  // Séparateurs (bonne pratique)
  { pattern: /[|•–—]/, points: 10 },
  // Résultats & performance
  { pattern: /résultat|performance|growth|croissance|chiffre|result|revenue|CA|EBITDA|marge|margin|P&L|pipeline|ROI|impact/i, points: 12 },
  // Chiffres (crédibilité)
  { pattern: /[0-9]/, points: 8 },
  // Expertise & spécialisation
  { pattern: /expert|spécialiste|spécialisé|passionné|passionate|dedicated|specialist|specialized/i, points: 5 },
  // Secteur / vertical
  { pattern: /SaaS|B2B|BtoB|B2C|retail|distribution|industrie|tech|fintech|digital|e-commerce|luxury|services|conseil|consulting/i, points: 8 },
  // Géographie
  { pattern: /international|europe|global|monde|france|european|export|mondial/i, points: 6 },
  // Équipe & leadership
  { pattern: /équipe|team|management|animation|coaching|recrutement|directing|diriger/i, points: 6 },
  // Transformation & stratégie
  { pattern: /transformation|stratégie|stratégique|vision|croissance organique|scale-up|turnover|restructuration/i, points: 6 },
  // Outils & technos
  { pattern: /salesforce|hubspot|CRMit|Sales Navigator|Power BI|Tableau|pipedrive|outreach/i, points: 4 },
]

const LINKEDIN_SUMMARY_BEST_PRACTICES = [
  { pattern: /\n\n/, label: "Paragraphes séparés", points: 10 },
  { pattern: /[0-9]/, label: "Chiffres inclus", points: 15 },
  { pattern: /[|•\-–]/, label: "Liste ou puces", points: 10 },
  { pattern: /résultat|réalisation|achievement|accomplish|réussi|success|performance/i, label: "Mention de résultats", points: 15 },
  { pattern: /transformation|stratégie|stratégique|vision|stratégic/i, label: "Langage stratégique", points: 10 },
  { pattern: /équipe|team|leader|management|manager|dirige|direction/i, label: "Mention de leadership", points: 10 },
  { pattern: /client|marché|portefeuille|business|partenaire|grands? ?comptes|key accounts/i, label: "Orientation client", points: 10 },
  { pattern: /B2B|BtoB|SaaS|international|export|digital/i, label: "Mots-clés secteur", points: 8 },
  { pattern: /CA|chiffre d'affaires|EBITDA|P&L|marge|budget|pipeline|revenu/i, label: "Indicateurs business", points: 8 },
]

const EXPERIENCE_DESCRIPTION_KEYWORDS = [
  { pattern: /[0-9]/, label: "Résultats chiffrés", points: 15 },
  { pattern: /\n\n|•|[\-–]/, label: "Structure en puces", points: 10 },
  { pattern: /responsable|piloté|dirigé|géré|supervisé|managé|défini|élaboré|mis en place/i, label: "Verbes d'action", points: 10 },
  { pattern: /équipe|team|force de vente|commerciaux|recrutement|animation|coaching|management/i, label: "Leadership d'équipe", points: 12 },
  { pattern: /résultat|réalisation|croissance|augment|réduit|obtenu|lancé|créé|développé|déployé/i, label: "Accomplissements", points: 15 },
  { pattern: /client|marché|portefeuille|business|partenaire|grands? ?comptes/i, label: "Orientation business", points: 10 },
  { pattern: /CA|chiffre d'affaires|EBITDA|P&L|marge|budget|KPI|revenue|pipeline/i, label: "Indicateurs financiers", points: 10 },
  { pattern: /B2B|BtoB|SaaS|international|export|digital|e-commerce|distribution|réseau/i, label: "Contexte sectoriel", points: 8 },
  { pattern: /transformation|restructuration|scale-up|croissance organique|digitalisation|optimisation/i, label: "Projets de transformation", points: 8 },
  { pattern: /Salesforce|CRM|HubSpot|Sales Navigator|Power BI|Tableau|ERP/i, label: "Outils métier", points: 6 },
]

const COMMERCIAL_DIRECTOR_TOP_KEYWORDS = [
  "développement commercial", "business development", "stratégie commerciale", "sales strategy",
  "grands comptes", "key accounts", "B2B", "BtoB", "négociation", "contract negotiation",
  "pipeline management", "forecast", "prévisions", "reporting", "tableau de bord",
  "animation d'équipe", "team leadership", "recrutement", "coaching", "formation",
  "P&L", "EBITDA", "marge", "CA", "chiffre d'affaires", "budget", "KPI",
  "transformation commerciale", "digitalisation", "CRM", "Salesforce", "Sales Navigator",
  "international", "export", "Europe", "multi-pays", "partenariats", "distribution",
  "go-to-market", "GTM", "lancement", "fidélisation", "rétention", "satisfaction client",
]

// ── Utilitaires ──

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
}

function extractKeywords(text: string): string[] {
  const words = normalizeText(text).split(/\s+/).filter(w => w.length > 2)
  const stopWords = new Set(["une", "sur", "dans", "avec", "pour", "par", "les", "des", "est", "pas", "que", "qui", "aux", "ces", "leur", "leurs", "nos", "votre", "notre", "tout", "tous", "plus", "moins", "très", "alors", "donc", "ainsi"])
  return [...new Set(words.filter(w => !stopWords.has(w)))]
}

// ── Analyseurs ──

function analyzeHeadline(input: LinkedInInput): { score: number; details: string } {
  const headline = input.headline || input.title || ""
  let score = 30
  const hits: string[] = []

  if (!headline || headline.length < 10) {
    return { score: 15, details: "Headline trop courte ou absente. Utilisez les 220 caractères disponibles." }
  }

  for (const bp of LINKEDIN_HEADLINE_BEST_PRACTICES) {
    if (bp.pattern.test(headline)) {
      score += bp.points
      hits.push(bp.pattern.source.slice(0, 40))
    }
  }

  if (countWords(headline) >= 8) score += 10
  if (headline.length > 100) score += 5
  if (headline.length > 160) score += 5

  return {
    score: Math.min(100, score),
    details: `Headline de ${countWords(headline)} mots, ${headline.length} caractères (max 220). ${hits.length} bonnes pratiques détectées.`,
  }
}

function analyzeSummary(input: LinkedInInput): { score: number; details: string } {
  const summary = input.summary || ""
  if (!summary || summary.length < 50) {
    return { score: 10, details: "Résumé LinkedIn trop court ou absent. Le résumé est la 2e chose lue après la headline." }
  }

  const words = countWords(summary)
  let score = 20
  const hits: string[] = []

  if (words >= 40 && words <= 150) score += 15
  else if (words > 150) score += 5

  for (const bp of LINKEDIN_SUMMARY_BEST_PRACTICES) {
    if (bp.pattern.test(summary)) {
      score += bp.points
      hits.push(bp.label)
    }
  }

  return {
    score: Math.min(100, score),
    details: `Résumé de ${words} mots. ${hits.length}/${LINKEDIN_SUMMARY_BEST_PRACTICES.length} critères validés.`,
  }
}

function analyzeExperiences(input: LinkedInInput): {
  score: number; details: string
  expAnalyses: Array<{ company: string; score: number; details: string }>
} {
  const exps = input.experiences || []
  if (exps.length === 0) {
    return { score: 0, details: "Aucune expérience", expAnalyses: [] }
  }

  const expAnalyses = exps.map((exp) => {
    const desc = exp.description || ""
    const achievements = exp.achievements || ""
    const combined = `${desc} ${achievements}`
    let score = 30
    const hits: string[] = []

    if (combined.length < 50) {
      return { company: exp.company, score: 15, details: "Description trop courte" }
    }

    if (countWords(combined) >= 30) score += 10

    for (const kw of EXPERIENCE_DESCRIPTION_KEYWORDS) {
      if (kw.pattern.test(combined)) {
        score += kw.points
        hits.push(kw.label)
      }
    }

    return {
      company: exp.company,
      score: Math.min(100, score),
      details: `${countWords(combined)} mots. ${hits.length}/${EXPERIENCE_DESCRIPTION_KEYWORDS.length} critères.`,
    }
  })

  const avgScore = Math.round(expAnalyses.reduce((sum, e) => sum + e.score, 0) / expAnalyses.length)
  return { score: avgScore, details: `${exps.length} expériences, score moyen ${avgScore}%`, expAnalyses }
}

function analyzeSkills(input: LinkedInInput): { score: number; details: string; missingTopKeywords: string[] } {
  const skills = input.skills || []
  const skillNames = skills.map(s => normalizeText(s.name))
  const missingTop = COMMERCIAL_DIRECTOR_TOP_KEYWORDS.filter(k => {
    const nk = normalizeText(k)
    return !skillNames.some(sn => sn.includes(nk) || nk.includes(sn))
  })

  if (skills.length === 0) return { score: 5, details: "Aucune compétence listée.", missingTopKeywords: COMMERCIAL_DIRECTOR_TOP_KEYWORDS.slice(0, 10) }
  if (skills.length >= 5 && skills.length <= 15) return { score: 60, details: `${skills.length} compétences — bonne base, visez 15-20. ${missingTop.length} mots-clés métier absents.`, missingTopKeywords: missingTop.slice(0, 8) }
  if (skills.length > 15) return { score: 85, details: `${skills.length} compétences — excellent. ${missingTop.length} mots-clés métiers absents.`, missingTopKeywords: missingTop.slice(0, 5) }
  return { score: 40, details: `${skills.length} compétences — ajoutez-en davantage. ${missingTop.length} mots-clés métier absents.`, missingTopKeywords: missingTop.slice(0, 8) }
}

function analyzeProfileCompleteness(input: LinkedInInput): ProfileCompleteness {
  let score = 30
  const checks: string[] = []

  const hasPhoto = input.profilePhoto ?? false
  const hasBanner = input.bannerImage ?? false
  const hasCustomUrl = input.customUrl ?? false
  const hasRecommendations = (input.recommendations ?? 0) > 0
  const hasLocation = !!(input.location)
  const hasEducation = !!(input.education && input.education.length > 5)
  const hasCertifications = !!(input.certifications && input.certifications.length > 5)
  const hasLanguages = !!(input.languages && input.languages.length > 5)

  if (hasPhoto) { score += 15; checks.push("photo de profil") }
  if (hasBanner) { score += 8; checks.push("banner") }
  if (hasCustomUrl) { score += 8; checks.push("URL personnalisée") }
  if (hasRecommendations) { score += 10; checks.push(`${input.recommendations} recommandation(s)`) }
  if (hasLocation) { score += 8; checks.push("localisation") }
  if (hasEducation) { score += 8; checks.push("formation") }
  if (hasCertifications) { score += 8; checks.push("certifications") }
  if (hasLanguages) { score += 5; checks.push("langues") }

  return {
    score: Math.min(100, score),
    hasPhoto, hasBanner, hasCustomUrl, hasRecommendations,
    hasLocation, hasEducation, hasCertifications, hasLanguages,
    details: checks.length > 0 ? `${checks.join(", ")} renseignés.` : "Champs clés manquants.",
  }
}

// ── Génération (P1 + P4) ──

export function generateOptimizedHeadline(input: LinkedInInput): string {
  const headline = input.headline || input.title || ""
  const title = input.title || "Professionnel"
  const sectors = input.sectors || ""
  const functions = input.functions || ""
  const expSummary = (input.experiences || []).slice(0, 3).map(e => e.company).join(", ")

  // Si la headline actuelle est déjà bonne (>160 char et >10 mots), on l'enrichit légèrement
  if (headline.length > 100 && countWords(headline) >= 6) {
    // Ajouter des mots-clés manquants
    const missingKeywords = COMMERCIAL_DIRECTOR_TOP_KEYWORDS.filter(k =>
      !headline.toLowerCase().includes(k.toLowerCase())
    ).slice(0, 3)

    if (missingKeywords.length > 0) {
      return `${headline} | ${missingKeywords.join(" | ")}`
    }
    return headline
  }

  // Sinon, générer une headline complète
  const parts: string[] = [title]

  if (sectors) parts.push(`Expert ${sectors}`)
  if (functions) parts.push(functions)

  // Ajouter des mots-clés pertinents basés sur le profil
  const suggestedKeywords = COMMERCIAL_DIRECTOR_TOP_KEYWORDS
    .filter(k => !headline.toLowerCase().includes(k.toLowerCase()))
    .slice(0, 4)
  parts.push(...suggestedKeywords)

  if (expSummary) parts.push(`Expérience : ${expSummary}`)

  return parts.filter(Boolean).join(" | ").slice(0, 220)
}

export function generateOptimizedSummary(input: LinkedInInput): string {
  const name = input.fullName || ""
  const title = input.title || ""
  const sectors = input.sectors || ""
  const location = input.location || ""
  const summary = input.summary || ""
  const skills = (input.skills || []).slice(0, 8).map(s => s.name).join(", ")
  const exps = (input.experiences || []).slice(0, 3)
  const languages = input.languages || ""

  if (summary.length > 200) {
    // Le résumé existe déjà, on ne le régénère pas mais on suggère des améliorations
    return summary
  }

  const lines: string[] = []

  // 1) Accroche
  lines.push(`${title} avec plus de 15 ans d'expérience dans ${sectors || "le développement commercial"}.`)
  if (location) lines.push(`Basé(e) à ${location}.`)

  // 2) Réalisations clés
  lines.push("")
  lines.push("🏆 Réalisations clés :")
  for (const exp of exps) {
    const company = exp.company || "une entreprise"
    const role = exp.title || "un poste"
    const achievement = exp.achievements || exp.description || "croissance du chiffre d'affaires"
    lines.push(`• ${role} chez ${company} : ${achievement.slice(0, 120)}`)
  }

  // 3) Compétences
  lines.push("")
  lines.push(`💡 Expertises : ${skills || "stratégie commerciale, management d'équipe, développement business"}.`)
  if (languages) lines.push(`🌍 Langues : ${languages.slice(0, 100)}.`)

  // 4) Valeur ajoutée
  lines.push("")
  lines.push(`Ce qui me distingue : une approche data-driven du développement commercial, couplée à un leadership transformationnel. J'accompagne les entreprises dans leur croissance en structurant des équipes performantes et en optimisant les processus de vente.`)

  // 5) Call-to-action
  lines.push("")
  lines.push("📩 Contactez-moi pour échanger sur vos enjeux de croissance commerciale ou pour une mission de direction.")

  return lines.join("\n").slice(0, 2600)
}

// ── Matching mots-clés (P2) ──

export function matchKeywordsWithJobDescriptions(
  input: LinkedInInput,
  jobDescriptions: string[]
): KeywordMatchResult {
  // Collecter tous les mots de toutes les offres d'emploi
  const allJobWords = new Set<string>()
  const jobText = jobDescriptions.join(" ").toLowerCase()

  // Extraire les bigrammes et trigrammes des offres (plus pertinent que mots simples)
  const jobWords = jobText.split(/[\s,.;:!?(){}[\]"']+/).filter((w: string) => w.length > 2)
  const stopWords = new Set(["the", "and", "for", "you", "are", "with", "this", "that", "from", "have", "will", "your", "not", "can", "our", "its", "has", "been", "more", "very", "also", "all", "new", "about", "some", "than", "each", "other", "over", "just", "most", "like", "les", "des", "une", "est", "dans", "pour", "pas", "que", "qui", "sur", "avec", "par", "plus", "tout", "aux", "ces", "leur", "nous", "vous", "bien", "fait", "être"])
  const filteredWords = jobWords.filter((w: string) => !stopWords.has(w))
  for (const w of filteredWords) allJobWords.add(w)

  // Récupérer tous les mots du profil
  const profileText = [
    input.headline || "", input.title || "", input.summary || "",
    ...(input.experiences || []).map(e => `${e.description || ""} ${e.achievements || ""}`),
    ...(input.skills || []).map(s => s.name),
  ].join(" ")
  const profileWords = new Set(extractKeywords(profileText))

  // Trouver les mots-clés d'offre présents/absents dans le profil
  const matched: string[] = []
  const missing: string[] = []
  const priorityKeywords = COMMERCIAL_DIRECTOR_TOP_KEYWORDS.filter(k =>
    jobText.includes(normalizeText(k))
  )

  for (const kw of priorityKeywords.slice(0, 20)) {
    if (profileWords.has(normalizeText(kw)) || profileText.toLowerCase().includes(kw.toLowerCase())) {
      matched.push(kw)
    } else {
      missing.push(kw)
    }
  }

  // Si pas assez de keywords trouvés via le matching, élargir avec les mots simples
  if (matched.length < 5) {
    for (const w of allJobWords) {
      if (profileWords.has(normalizeText(w)) && !matched.includes(w)) {
        matched.push(w)
      } else if (!missing.includes(w) && w.length > 3) {
        missing.push(w)
      }
    }
  }

  const coverage = priorityKeywords.length > 0
    ? Math.round((matched.length / priorityKeywords.length) * 100)
    : matched.length + missing.length > 0
      ? Math.round((matched.length / (matched.length + missing.length)) * 100)
      : 0

  return {
    matched: [...new Set(matched)].slice(0, 15),
    missing: [...new Set(missing)].slice(0, 10),
    coveragePercent: Math.min(100, coverage),
    suggestions: missing.slice(0, 5).map(k =>
      `Ajoutez "${k}" dans votre profil (headline, résumé ou compétences)`
    ),
  }
}

// ── Analyse AI ──

async function analyzeLinkedInWithAI(input: LinkedInInput): Promise<LinkedInAnalysis | null> {
  const config = await getDeepSeekConfig()
  if (!config) return null

  const expSummary = (input.experiences || []).map(e =>
    `- ${e.title} @ ${e.company} (${e.startDate}–${e.endDate || "aujourd'hui"})${e.description ? `: ${e.description.slice(0, 200)}` : ""}`
  ).join("\n")

  const skillSummary = (input.skills || []).map(s => `- ${s.name} (${s.level})`).join("\n")

  const result = await generateJsonWithDeepSeek<{
    overallScore: number
    sections: { name: string; score: number; status: "good" | "needs-work" | "missing"; details: string }[]
    suggestions: { section: string; priority: "critical" | "high" | "medium" | "low"; title: string; description: string; suggestedAction: string }[]
    strengths: string[]
    optimizedHeadline?: string
    optimizedSummary?: string
  }>({
    systemPrompt: `Tu es un expert en optimisation de profils LinkedIn pour cadres dirigeants et directeurs commerciaux.
Analyse un profil LinkedIn et retourne un scoring détaillé avec suggestions d'amélioration.
Tu dois aussi générer une headline et un résumé optimisés.

RÈGLES POUR UN DIRECTEUR COMMERCIAL :
- La headline (220 car max) doit contenir : titre, secteur (B2B/SaaS/Retail...), indicateurs (CA, P&L, EBITDA), valeur ajoutée, mots-clés recruteurs
- Le résumé doit raconter une histoire : 1) Accroche 2) Réalisations chiffrées (CA, équipe, transformation) 3) Expertises 4) Valeur ajoutée 5) Call-to-action
- Les expériences doivent avoir des descriptions avec chiffres, puces, et périmètre (taille équipe, CA géré, budget)
- 15-20 compétences est l'idéal, inclure : Salesforce, négociation, pipeline management, CRM, leadership
- Un profil complet (photo, banner, URL personnalisée, recommandations) est 40x plus susceptible d'être contacté`,
    userPrompt: `Analyse ce profil LinkedIn pour optimiser sa visibilité et son impact :

Nom : ${input.fullName}
Titre/Headline : ${input.headline || input.title}
Résumé actuel : ${input.summary?.slice(0, 500) || "Absent"}
Localisation : ${input.location || "Non spécifié"}
Secteurs : ${input.sectors || "Non spécifié"}
Photo : ${input.profilePhoto ? "Oui" : "Non"}
Banner : ${input.bannerImage ? "Oui" : "Non"}

EXPÉRIENCES :
${expSummary.slice(0, 2000) || "Aucune"}

COMPÉTENCES (${(input.skills || []).length}) :
${skillSummary.slice(0, 1000) || "Aucune"}

Retourne UNIQUEMENT un JSON :
{
  "overallScore": 0-100,
  "sections": [
    {"name": "Headline|Résumé|Expériences|Compétences|Profil complété", "score": 0-100, "status": "good|needs-work|missing", "details": "..."}
  ],
  "suggestions": [
    {"section": "...", "priority": "critical|high|medium|low", "title": "...", "description": "...", "suggestedAction": "..."}
  ],
  "strengths": ["force 1", "force 2", "..."],
  "optimizedHeadline": "Headline optimisée (220 car max, format : Titre | Secteur | Expertises | Indicateurs | Valeur)",
  "optimizedSummary": "Résumé optimisé complet (5 parties : accroche, réalisations, expertises, valeur ajoutée, CTA)"
}

JSON uniquement. Pas de markdown.`,
    temperature: 0.3,
  })

  if (result.success && result.data) {
    const data = result.data as LinkedInAnalysis
    // Fallback si l'IA n'a pas généré headline/summary
    if (!data.optimizedHeadline) data.optimizedHeadline = generateOptimizedHeadline(input)
    if (!data.optimizedSummary) data.optimizedSummary = generateOptimizedSummary(input)
    return data
  }
  return null
}

// ── Analyse principale ──

export async function analyzeLinkedInProfile(input: LinkedInInput): Promise<LinkedInAnalysis> {
  const aiResult = await analyzeLinkedInWithAI(input)

  // Analyse rule-based en parallèle (toujours, pour le keyword matching et la complétude)
  const headline = analyzeHeadline(input)
  const summary = analyzeSummary(input)
  const experiences = analyzeExperiences(input)
  const skills = analyzeSkills(input)
  const completeness = analyzeProfileCompleteness(input)

  const profileCompleteness = completeness
  const overallScore = Math.round(
    headline.score * 0.25 +
    summary.score * 0.25 +
    experiences.score * 0.25 +
    skills.score * 0.15 +
    completeness.score * 0.1
  )

  const sections: LinkedInSection[] = [
    { name: "Headline", score: headline.score, status: headline.score >= 60 ? "good" : headline.score >= 30 ? "needs-work" : "missing", details: headline.details },
    { name: "Résumé", score: summary.score, status: summary.score >= 60 ? "good" : summary.score >= 30 ? "needs-work" : "missing", details: summary.details },
    { name: "Expériences", score: experiences.score, status: experiences.score >= 60 ? "good" : experiences.score >= 30 ? "needs-work" : "missing", details: experiences.details },
    { name: "Compétences", score: skills.score, status: skills.score >= 60 ? "good" : skills.score >= 30 ? "needs-work" : "missing", details: skills.details },
    { name: "Profil complété", score: completeness.score, status: completeness.score >= 60 ? "good" : completeness.score >= 30 ? "needs-work" : "missing", details: completeness.details },
  ]

  // Si l'IA a réussi, enrichir avec les données rule-based
  if (aiResult) {
    aiResult.profileCompleteness = profileCompleteness
    // Garder les suggestions IA mais ajouter des suggestions basées sur la complétude
    if (!completeness.hasPhoto) {
      aiResult.suggestions.push({
        id: "li-photo-missing",
        section: "Profil complété",
        priority: "critical",
        title: "Ajouter une photo de profil professionnelle",
        description: "Les profils avec photo reçoivent 14x plus de vues et 36x plus de messages.",
        suggestedAction: "Utilisez une photo récente, en tenue professionnelle, sur fond neutre. Format carré, visage centré.",
      })
    }
    if (skills.missingTopKeywords.length > 0) {
      aiResult.suggestions.push({
        id: "li-keywords-missing",
        section: "Compétences",
        priority: "high",
        title: `${skills.missingTopKeywords.length} mots-clés métier absents`,
        description: "Les recruteurs filtrent par mots-clés. Ajoutez ces compétences pour apparaître dans leurs recherches.",
        suggestedAction: `Ajoutez dans vos compétences : ${skills.missingTopKeywords.slice(0, 6).join(", ")}`,
      })
    }
    return aiResult
  }

  // Fallback rule-based
  const generatedHeadline = generateOptimizedHeadline(input)
  const generatedSummary = generateOptimizedSummary(input)

  const suggestions: LinkedInSuggestion[] = []

  if (headline.score < 60) {
    suggestions.push({
      id: "li-headline-0",
      section: "Headline",
      priority: "critical",
      title: "Optimiser la headline LinkedIn",
      description: `Headline actuelle : "${input.headline || input.title}". Utilisez les 220 caractères avec : poste, secteur, valeur ajoutée, mots-clés.`,
      suggestedAction: generatedHeadline,
    })
  }

  if (summary.score < 60) {
    suggestions.push({
      id: "li-summary-0",
      section: "Résumé",
      priority: "critical",
      title: "Revoir le résumé LinkedIn",
      description: "Le résumé doit raconter une histoire : qui vous êtes, vos résultats, votre valeur ajoutée.",
      suggestedAction: "Structure : 1) Accroche 2) Réalisations (3-4 bullets chiffrées) 3) Expertises 4) Valeur ajoutée 5) Call-to-action",
    })
  }

  if (experiences.score < 60) {
    suggestions.push({
      id: "li-exp-0",
      section: "Expériences",
      priority: "high",
      title: "Ajouter des descriptions aux expériences",
      description: `${experiences.expAnalyses.filter((e) => e.score < 50).map((e) => e.company).join(", ")} ${experiences.expAnalyses.filter((e) => e.score < 50).length > 1 ? "ont des descriptions insuffisantes" : "a une description insuffisante"}.`,
      suggestedAction: "Pour chaque poste, ajoutez 3-5 puces avec : périmètre (CA, équipe), réalisations chiffrées, contexte de transformation.",
    })
  }

  if (skills.score < 50) {
    suggestions.push({
      id: "li-skills-0",
      section: "Compétences",
      priority: "high",
      title: "Ajouter des compétences",
      description: skills.score < 20 ? "Aucune compétence détectée." : `Ajoutez des compétences pour la recherche LinkedIn. ${skills.missingTopKeywords.length} mots-clés métier absents.`,
      suggestedAction: `Visez 15-20 compétences. Mots-clés manquants : ${skills.missingTopKeywords.slice(0, 8).join(", ")}`,
    })
  }

  if (completeness.score < 70 || !completeness.hasPhoto) {
    if (!completeness.hasPhoto) {
      suggestions.push({
        id: "li-photo-0",
        section: "Profil complété",
        priority: "critical",
        title: "Ajouter une photo de profil",
        description: "Les profils avec photo reçoivent 14x plus de vues et 36x plus de messages.",
        suggestedAction: "Photo professionnelle récente, fond neutre, visage centré, format carré.",
      })
    }
    if (completeness.score < 70) {
      suggestions.push({
        id: "li-profile-0",
        section: "Profil complété",
        priority: "medium",
        title: "Compléter les champs du profil",
        description: "Un profil LinkedIn complet est 40x plus susceptible d'être contacté.",
        suggestedAction: completeness.details,
      })
    }
  }

  const strengths: string[] = []
  if (headline.score >= 70) strengths.push("Headline bien construite et riche en mots-clés")
  if (summary.score >= 70) strengths.push("Résumé engageant et structuré")
  if (experiences.score >= 70) strengths.push("Expériences détaillées avec chiffres et contexte")
  if (skills.score >= 70) strengths.push("Compétences nombreuses et pertinentes pour les recruteurs")
  if (completeness.score >= 80) strengths.push("Profil bien complété (photo, formations, certifications)")
  if (completeness.hasPhoto) strengths.push("Photo de profil professionnelle")

  return {
    overallScore,
    sections,
    suggestions: suggestions.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    }),
    strengths,
    optimizedHeadline: generatedHeadline,
    optimizedSummary: generatedSummary,
    profileCompleteness: completeness,
  }
}
