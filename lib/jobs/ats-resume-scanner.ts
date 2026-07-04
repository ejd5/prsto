import { generateJsonWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek"

export interface AtsScanResult {
  globalScore: number
  keywordMatch: number
  formatScore: number
  sectionCoverage: number
  matchedKeywords: AtsKeyword[]
  missingKeywords: AtsKeyword[]
  sectionScores: SectionScore[]
  suggestions: string[]
  rawJobKeywords: string[]
  rawCvKeywords: string[]
}

export interface AtsKeyword {
  word: string
  category: string
  importance: "critical" | "important" | "bonus"
}

export interface SectionScore {
  section: string
  score: number
  present: boolean
  suggestion: string
}

interface ScanInput {
  cvText: string
  jobTitle: string
  jobDescription: string
  company?: string
}

const REQUIRED_SECTIONS = [
  "Résumé / Objectif",
  "Expérience professionnelle",
  "Formation / Diplômes",
  "Compétences",
  "Langues",
]

const CRITICAL_KEYWORDS: Record<string, string[]> = {
  leadership: [
    "leadership", "direction", "management", "encadrement", "pilotage",
    "stratégie", "vision", "gestion d'équipe", "team management",
    "manager", "diriger", "animer", "superviser",
  ],
  finance: [
    "p&l", "profit and loss", "budget", "chiffre d'affaires",
    "croissance", "résultat", "ebitda", "marge",
    "rentabilité", "ca", "revenue", "cost management",
  ],
  commercial: [
    "vente", "sales", "business development", "développement commercial",
    "négociation", "negotiation", "portefeuille", "client",
    "account management", "key account", "grands comptes",
    "prospection", "acquisition", "growth",
  ],
  strategic: [
    "transformation", "croissance", "développement", "expansion",
    "marché", "market", "business plan", "feuille de route",
    "roadmap", "innovation", "reorganisation", "fusion",
    "acquisition", "partenariat", "international",
  ],
}

const COMMON_NOISE = [
  "le", "la", "les", "des", "du", "de", "un", "une", "et", "est",
  "sont", "dans", "pour", "sur", "avec", "par", "pas", "plus",
  "tout", "fait", "faire", "été", "être", "avoir", "aux", "ces",
  "ses", "mes", "tes", "nos", "vos", "leurs", "ce", "cette",
  "que", "qui", "quoi", "dont", "où", "the", "a", "an", "in",
  "on", "at", "to", "for", "of", "and", "or", "is", "are",
  "was", "were", "been", "have", "has", "had", "will", "would",
  "could", "should", "may", "might", "shall", "can", "do",
  "does", "did", "doing", "with", "without", "from", "about",
  "into", "through", "during", "before", "after", "above",
  "below", "between", "among", "such", "each", "every",
  "both", "few", "more", "most", "other", "some", "any",
  "also", "very", "just", "then", "now", "here", "well",
  "only", "even", "still", "already", "yet", "however",
  "therefore", "thus", "because", "since", "while",
]

const EXECUTIVE_TITLE_PATTERNS = [
  /directeur\s+(commercial|des\s+ventes|général|développement|business\s+unit|marketing|financier|juridique|rh|régional|associé|technique|industriel)/i,
  /sales\s+(director|vice\s+president|head|manager|leader)/i,
  /vp\s+sales|vice\s+president\s+sales|head\s+of\s+sales/i,
  /country\s+manager|regional\s+(director|manager|head)/i,
  /chief\s+(commercial|revenue|operating|executive|marketing|financial)/i,
  /cro|cco|ceo|cfo|coo/i,
  /managing\s+director|general\s+manager|business\s+unit\s+head/i,
  /directeur\s+de\s+(business\s+unit|la\s+stratégie|la\s+transformation)/i,
]

function tokenize(text: string, minLen = 3): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôöùûüÿç\s-]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length >= minLen && !COMMON_NOISE.includes(t))
  return [...new Set(tokens)]
}

function extractPhrases(text: string, minWords = 2, maxWords = 4): string[] {
  const words = text.toLowerCase().replace(/[^a-zàâäéèêëïîôöùûüÿç\s-]/gi, " ").split(/\s+/).filter(Boolean)
  const phrases: string[] = []
  for (let n = minWords; n <= maxWords; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ")
      if (phrase.length >= 6) phrases.push(phrase)
    }
  }
  return [...new Set(phrases)]
}

function detectExecutiveKeywords(text: string): AtsKeyword[] {
  const found: AtsKeyword[] = []
  const lower = text.toLowerCase()

  // Check for executive title patterns
  for (const pattern of EXECUTIVE_TITLE_PATTERNS) {
    const match = lower.match(pattern)
    if (match) {
      found.push({ word: match[0], category: "Titre exécutif", importance: "critical" })
    }
  }

  // Check critical skill categories
  for (const [category, keywords] of Object.entries(CRITICAL_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        found.push({ word: kw, category: getCategoryLabel(category), importance: "critical" })
      }
    }
  }

  return found
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    leadership: "Leadership",
    finance: "Finance & P&L",
    commercial: "Commerce",
    strategic: "Stratégique",
  }
  return labels[cat] || cat
}

function categorizeKeyword(word: string): string {
  const lower = word.toLowerCase()
  for (const [category, keywords] of Object.entries(CRITICAL_KEYWORDS)) {
    if (keywords.includes(lower)) return getCategoryLabel(category)
  }
  if (/[0-9]/.test(word)) return "Chiffres"
  if (/[a-z]/.test(lower) && lower.length > 5) return "Compétence"
  return "Général"
}

function detectSections(text: string): string[] {
  const found: string[] = []
  const patterns: [string, RegExp][] = [
    ["Résumé / Objectif", /(résumé|profil|objectif|summary|profile|objective)/i],
    ["Expérience professionnelle", /(expérience|expériences professionnelles|career|work experience|employment|parcours)/i],
    ["Formation / Diplômes", /(formation|diplôme|diplômes|education|degree|studies|études)/i],
    ["Compétences", /(compétences|compétence|skills|expertise|savoir-faire|compétences clés)/i],
    ["Langues", /(langues|languages|langue)/i],
    ["Certifications", /(certification|certifications|certificat|certificate)/i],
    ["Centres d'intérêt", /(centres d'intérêt|intérêts|interests|loisirs|hobbies)/i],
    ["Réalisations", /(réalisations|achievements|accomplishments|résultats|results|performance)/i],
    ["Publications", /(publication|publications|brevet|brevets|patent)/i],
    ["Références", /(références|references|recommendations)/i],
  ]
  for (const [name, pattern] of patterns) {
    if (pattern.test(text)) found.push(name)
  }
  return found
}

function scoreSectionCoverage(foundSections: string[]): number {
  let covered = 0
  for (const section of REQUIRED_SECTIONS) {
    if (foundSections.some((f) => f.toLowerCase().includes(section.toLowerCase().slice(0, 8)))) {
      covered++
    }
  }
  return Math.round((covered / REQUIRED_SECTIONS.length) * 100)
}

function scoreFormat(cvText: string): number {
  let score = 100
  const lines = cvText.split("\n").filter(Boolean)
  const words = cvText.split(/\s+/).filter(Boolean)

  if (words.length < 200) score -= 30
  else if (words.length < 400) score -= 10
  else if (words.length > 1500) score -= 5

  if (lines.length < 20) score -= 15
  if (cvText.length > 15000) score -= 10

  const hasBullets = /[•\-*]\s/.test(cvText)
  if (!hasBullets) score -= 15

  const hasNumbers = /\d+/.test(cvText)
  if (!hasNumbers) score -= 10

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cvText)
  if (!hasEmail) score -= 5

  const hasPhone = /(\+\d{1,3}[\s-]?)?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/.test(cvText)
  if (!hasPhone) score -= 5

  return Math.max(0, Math.min(100, score))
}

function generateSectionSuggestions(foundSections: string[]): { section: string; score: number; present: boolean; suggestion: string }[] {
  return REQUIRED_SECTIONS.map((section) => {
    const present = foundSections.some((f) => f.toLowerCase().includes(section.toLowerCase().slice(0, 8)))
    const suggestions: Record<string, string> = {
      "Résumé / Objectif": "Ajoutez un résumé exécutif de 3-4 lignes en haut du CV avec votre valeur ajoutée et objectif de carrière.",
      "Expérience professionnelle": "Détaillez chaque poste avec des réalisations chiffrées, le périmètre (CA, équipe) et le contexte.",
      "Formation / Diplômes": "Mentionnez vos diplômes, formations exécutives (MBA, INSEAD, HEC) et certifications en cours.",
      "Compétences": "Listez vos compétences clés : leadership, négociation, stratégie, transformation digitale, management.",
      "Langues": "Indiquez votre niveau pour chaque langue (courant, bilingue, langue maternelle) avec certifications si possible.",
    }
    return {
      section,
      score: present ? 100 : 0,
      present,
      suggestion: suggestions[section] || "",
    }
  })
}

function computeKeywordMatch(cvTokens: string[], jobTokens: string[]): { matched: string[]; missing: string[]; score: number } {
  const cvSet = new Set(cvTokens)
  const matched = jobTokens.filter((t) => cvSet.has(t))
  const missing = jobTokens.filter((t) => !cvSet.has(t))
  const score = jobTokens.length > 0 ? Math.round((matched.length / jobTokens.length) * 100) : 0
  return { matched, missing, score }
}

async function scanResumeWithAI(input: ScanInput): Promise<AtsScanResult | null> {
  const config = await getDeepSeekConfig()
  if (!config) return null

  const result = await generateJsonWithDeepSeek<{
    globalScore: number
    keywordMatch: number
    formatScore: number
    sectionCoverage: number
    matchedKeywords: { word: string; category: string; importance: "critical" | "important" | "bonus" }[]
    missingKeywords: { word: string; category: string; importance: "critical" | "important" | "bonus" }[]
    sectionScores: { section: string; score: number; present: boolean; suggestion: string }[]
    suggestions: string[]
    rawJobKeywords: string[]
    rawCvKeywords: string[]
  }>({
    systemPrompt: `Tu es un expert ATS (Applicant Tracking System) pour le recrutement de cadres dirigeants en France.
Analyse un CV par rapport à une offre d'emploi et retourne un scoring ATS précis.

RÈGLES :
- Sois exigeant comme un vrai recruteur executive search
- Les mots-clés critiques = leadership, P&L, management d'équipe, développement commercial, transformation
- Détecte les sections du CV (résumé, expérience, formation, compétences, langues)
- Note la qualité du format (puces, chiffres, longueur, contact)
- Suggère des améliorations concrètes`,
    userPrompt: `Analyse ce CV pour le poste de ${input.jobTitle}${input.company ? ` chez ${input.company}` : ""}.

OFFRE D'EMPLOI :
${input.jobDescription.slice(0, 3000)}

CV DU CANDIDAT :
${input.cvText.slice(0, 3000)}

Retourne UNIQUEMENT un objet JSON valide avec cette structure :
{
  "globalScore": (0-100, note globale ATS),
  "keywordMatch": (0-100, correspondance des mots-clés),
  "formatScore": (0-100, qualité du format),
  "sectionCoverage": (0-100, sections présentes),
  "matchedKeywords": [{"word": "...", "category": "Leadership|Finance|Commerce|Stratégique|Digital|Compétence|Général", "importance": "critical|important|bonus"}],
  "missingKeywords": [{"word": "...", "category": "...", "importance": "critical|important|bonus"}],
  "sectionScores": [{"section": "Résumé / Objectif|Expérience professionnelle|Formation / Diplômes|Compétences|Langues", "score": 0-100, "present": true/false, "suggestion": "..."}],
  "suggestions": ["suggestion 1", "suggestion 2", "..."],
  "rawJobKeywords": ["mot-clé1", "mot-clé2", "..."],
  "rawCvKeywords": ["mot-clé1", "mot-clé2", "..."]
}

Ne mets PAS de markdown. Pas de commentaires. JSON uniquement.`,
    temperature: 0.3,
  })

  if (result.success && result.data) {
    return {
      globalScore: result.data.globalScore,
      keywordMatch: result.data.keywordMatch,
      formatScore: result.data.formatScore,
      sectionCoverage: result.data.sectionCoverage,
      matchedKeywords: result.data.matchedKeywords,
      missingKeywords: result.data.missingKeywords,
      sectionScores: result.data.sectionScores,
      suggestions: result.data.suggestions,
      rawJobKeywords: result.data.rawJobKeywords,
      rawCvKeywords: result.data.rawCvKeywords,
    }
  }
  return null
}

export async function scanResume(input: ScanInput): Promise<AtsScanResult> {
  const aiResult = await scanResumeWithAI(input)
  if (aiResult) return aiResult
  return scanResumeHeuristic(input)
}

function scanResumeHeuristic(input: ScanInput): AtsScanResult {
  const cvTokens = tokenize(input.cvText)
  const jobTokens = tokenize(input.jobDescription)
  const cvPhrases = extractPhrases(input.cvText)
  const jobPhrases = extractPhrases(input.jobDescription)

  const keywordResult = computeKeywordMatch(cvTokens, jobTokens)
  const phraseResult = computeKeywordMatch(cvPhrases, jobPhrases)

  const foundSections = detectSections(input.cvText)
  const sectionScores = generateSectionSuggestions(foundSections)
  const sectionCoverage = scoreSectionCoverage(foundSections)
  const formatScore = scoreFormat(input.cvText)

  const execKeywords = detectExecutiveKeywords(input.cvText)
  const jobExecKeywords = detectExecutiveKeywords(input.jobDescription)

  const matchedExecKeywords = execKeywords.filter((ek) =>
    jobExecKeywords.some((jk) => jk.category === ek.category)
  )
  const missingExecKeywords = jobExecKeywords.filter((jk) =>
    !execKeywords.some((ek) => ek.category === jk.category)
  )

  const allMatched: AtsKeyword[] = [
    ...matchedExecKeywords,
    ...keywordResult.matched.slice(0, 30).map((w) => ({
      word: w,
      category: categorizeKeyword(w),
      importance: "important" as const,
    })),
  ]

  const allMissing: AtsKeyword[] = [
    ...missingExecKeywords,
    ...keywordResult.missing.slice(0, 30).map((w) => ({
      word: w,
      category: categorizeKeyword(w),
      importance: jobExecKeywords.some((jk) => jk.word === w) ? "critical" as const : "important" as const,
    })),
  ]

  const keywordMatch = keywordResult.score
  let suggestions: string[] = []

  if (keywordMatch < 40) {
    suggestions.push("Votre CV contient peu de mots-clés de l'offre. Ajoutez les termes spécifiques au poste.")
  }
  if (phraseResult.score < 30) {
    suggestions.push("Peu de phrases-clés communes. Adaptez vos descriptions d'expérience au contexte du poste.")
  }
  if (missingExecKeywords.length > 0) {
    const cats = [...new Set(missingExecKeywords.map((k) => k.category))]
    suggestions.push(`Compétences exécutives manquantes : ${cats.join(", ")}. Ajoutez des réalisations dans ces domaines.`)
  }
  if (!foundSections.some((s) => /chiffre|réalis|result|performance/i.test(s))) {
    suggestions.push("Ajoutez une section Réalisations avec des résultats chiffrés (CA, croissance, EBITDA).")
  }

  const globalScore = Math.round(keywordMatch * 0.5 + sectionCoverage * 0.2 + formatScore * 0.2 + phraseResult.score * 0.1)

  return {
    globalScore,
    keywordMatch,
    formatScore,
    sectionCoverage,
    matchedKeywords: allMatched.slice(0, 50),
    missingKeywords: allMissing.slice(0, 50),
    sectionScores,
    suggestions,
    rawJobKeywords: jobTokens.slice(0, 100),
    rawCvKeywords: cvTokens.slice(0, 100),
  }
}
