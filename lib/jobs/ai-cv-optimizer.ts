import { generateJsonWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek"

export interface CvOptimizationResult {
  summary: {
    originalScore: number
    improvedScore: number
    totalSuggestions: number
  }
  suggestions: CvSuggestion[]
}

export interface CvSuggestion {
  id: string
  type: "keyword" | "summary" | "experience" | "skills" | "section" | "format"
  section: string
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  original?: string
  suggested?: string
  rationale: string
}

export interface OptimizerInput {
  cvText: string
  jobTitle: string
  jobDescription: string
  company?: string
  profile?: {
    fullName: string
    title: string
    summary: string
    sectors?: string
    functions?: string
    education?: string
  }
  experiences?: Array<{
    company: string
    title: string
    sector?: string
    startDate: string
    endDate?: string
    description?: string
    responsibilities?: string
    teamSize?: string
    revenue?: string
    budget?: string
    achievements?: string
  }>
  skills?: Array<{
    name: string
    category: string
    level: string
  }>
}

const EXECUTIVE_ROLES = [
  "directeur commercial", "country manager", "vp sales", "sales director",
  "directeur général", "chief commercial officer", "cco", "cfo", "ceo",
  "directeur développement", "business unit director",
]

function extractJobRequirements(jd: string): string[] {
  const lines = jd.toLowerCase().split("\n")
  const requirements: string[] = []
  let inRequirements = false
  for (const line of lines) {
    if (/requis|required|qualifications|profil|compétences|about you|you have|you are/i.test(line)) {
      inRequirements = true
      continue
    }
    if (inRequirements) {
      if (/poste|mission|responsabilités|about the role|what you'll do/i.test(line) && requirements.length > 0) {
        break
      }
      const clean = line.replace(/^[\s•\-*]+/, "").trim()
      if (clean.length > 15) requirements.push(clean)
    }
  }
  return requirements.slice(0, 15)
}

function generateKeywordSuggestions(
  input: OptimizerInput,
  missingKeywords: { word: string; category: string }[]
): CvSuggestion[] {
  const suggestions: CvSuggestion[] = []
  const categories = [...new Set(missingKeywords.map((k) => k.category))]
  const topMissing = missingKeywords.slice(0, 15)

  if (topMissing.length === 0) return suggestions

  suggestions.push({
    id: "kw-insert-0",
    type: "keyword",
    section: "Compétences",
    priority: "critical",
    title: `${topMissing.length} mots-clés manquants détectés`,
    description: `Ces termes-clés de l'offre sont absents de votre CV. Intégrez-les dans vos descriptions.`,
    rationale: `Les ATS filtrent sur les mots-clés. Votre score passera de ${Math.max(0, 100 - topMissing.length * 3)}% à ~${Math.min(100, 100 - Math.max(0, topMissing.length - 10) * 2)}% après ajout.`,
  })

  const categoryGroups: Record<string, string[]> = {}
  for (const kw of topMissing) {
    if (!categoryGroups[kw.category]) categoryGroups[kw.category] = []
    categoryGroups[kw.category].push(kw.word)
  }

  Object.entries(categoryGroups).forEach(([category, words], i) => {
    suggestions.push({
      id: `kw-cat-${i}`,
      type: "keyword",
      section: "Compétences",
      priority: categories[0] === category ? "high" : "medium",
      title: `Ajouter des compétences ${category.toLowerCase()}`,
      description: `Mots-clés : ${words.slice(0, 8).join(", ")}${words.length > 8 ? ` et ${words.length - 8} autres` : ""}`,
      original: undefined,
      suggested: `Exemple : "Pilotage de la ${category.toLowerCase()} avec ${words[0] || ""}"`,
      rationale: `Ces termes sont dans la description de poste mais absents de votre CV.`,
    })
  })

  return suggestions
}

function generateSummarySuggestions(input: OptimizerInput): CvSuggestion[] {
  const suggestions: CvSuggestion[] = []
  const jobLower = input.jobDescription.toLowerCase()
  const cvLower = input.cvText.toLowerCase()
  const profileTitle = input.profile?.title || ""
  const targetRole = input.jobTitle

  const roleMatch = EXECUTIVE_ROLES.some((r) => targetRole.toLowerCase().includes(r) || profileTitle.toLowerCase().includes(r))
  const hasSummary = cvLower.includes("résumé") || cvLower.includes("profil") || cvLower.includes("objectif") || cvLower.includes("summary") || cvLower.includes("profile")

  if (!hasSummary) {
    suggestions.push({
      id: "summary-add",
      type: "summary",
      section: "Résumé / Objectif",
      priority: "critical",
      title: "Ajouter un résumé exécutif",
      description: "Votre CV ne contient pas de résumé ou profil en tête. C'est la première chose que les recruteurs lisent.",
      suggested: `Résumé exécutif ciblé ${targetRole} — 3-4 lignes mettant en avant votre valeur ajoutée pour ce poste.`,
      rationale: "Un résumé exécutif augmente le temps de lecture de 40% et améliore le scoring ATS.",
    })
  }

  if (roleMatch && !hasSummary) {
    suggestions.push({
      id: "summary-exec-0",
      type: "summary",
      section: "Résumé / Objectif",
      priority: "high",
      title: "Résumé orienté résultats exécutifs",
      description: "Personnalisez votre résumé pour ce poste de direction avec des résultats chiffrés.",
      suggested: `« ${profileTitle || targetRole} avec X ans d'expérience, spécialisé dans... » + chiffres clés.`,
      rationale: "Les cadres dirigeants doivent montrer leur impact dès les premières lignes.",
    })
  }

  return suggestions
}

function generateExperienceSuggestions(input: OptimizerInput): CvSuggestion[] {
  const suggestions: CvSuggestion[] = []
  const experiences = input.experiences || []
  const jobLower = input.jobDescription.toLowerCase()

  for (const exp of experiences) {
    const hasAchievements = exp.achievements && exp.achievements.length > 20
    const hasNumbers = /\d+/.test(exp.description || "")

    if (!hasAchievements) {
      suggestions.push({
        id: `exp-ach-${exp.company}`,
        type: "experience",
        section: "Expérience professionnelle",
        priority: exp.title.toLowerCase().includes("directeur") ? "high" : "medium",
        title: `Ajouter des réalisations chiffrées — ${exp.company}`,
        description: `Aucune réalisation détectée pour votre poste chez ${exp.company}.`,
        original: exp.description?.slice(0, 200),
        suggested: `Chez ${exp.company} en tant que ${exp.title}, j'ai :\n• Augmenté le CA de X% en Y mois\n• Dirigé une équipe de N personnes\n• Piloté un budget de Z €`,
        rationale: "Les recruteurs recherchent des résultats prouvés, pas des descriptions de responsabilités.",
      })
    }

    if (!hasNumbers && exp.description && exp.description.length > 30) {
      suggestions.push({
        id: `exp-num-${exp.company}`,
        type: "experience",
        section: "Expérience professionnelle",
        priority: "high",
        title: `Quantifier les résultats — ${exp.company}`,
        description: `Votre description chez ${exp.company} manque de chiffres.`,
        original: exp.description?.slice(0, 200),
        suggested: "Ajoutez : CA généré, % de croissance, taille d'équipe, budget géré, nombre de clients.",
        rationale: "Les CV avec des résultats chiffrés ont 60% plus de chances d'être retenus.",
      })
    }

    const hasRelevantKeywords = jobLower.includes(exp.company.toLowerCase()) ||
      exp.sector && jobLower.includes(exp.sector.toLowerCase())

    if (!hasRelevantKeywords && exp.sector) {
      suggestions.push({
        id: `exp-context-${exp.company}`,
        type: "experience",
        section: "Expérience professionnelle",
        priority: "medium",
        title: `Contextualiser l'expérience ${exp.company}`,
        description: `L'offre mentionne un secteur ${exp.sector ? "différent du vôtre" : "non spécifié"}. Mettez en avant les compétences transférables.`,
        rationale: "Montrez comment votre expérience sectorielle s'applique au contexte du poste.",
      })
    }
  }

  if (experiences.length < 3) {
    suggestions.push({
      id: "exp-depth-0",
      type: "experience",
      section: "Expérience professionnelle",
      priority: "high",
      title: "Ajouter plus de détails sur les postes récents",
      description: `${experiences.length} expérience(s) détectée(s). Pour un poste de direction, détaillez chaque poste avec des sous-sections.`,
      rationale: "Les recruteurs veulent voir une progression de carrière sur 10-15 ans minimum.",
    })
  }

  return suggestions
}

function generateSkillSuggestions(
  input: OptimizerInput,
  missingKeywords: { word: string; category: string }[]
): CvSuggestion[] {
  const suggestions: CvSuggestion[] = []
  const skills = input.skills || []
  const skillNames = skills.map((s) => s.name.toLowerCase())
  const jobLower = input.jobDescription.toLowerCase()

  if (skills.length === 0) {
    suggestions.push({
      id: "skills-add-0",
      type: "skills",
      section: "Compétences",
      priority: "critical",
      title: "Ajouter une section Compétences",
      description: "Aucune compétence listée dans votre profil. Créez une section structurée par catégories.",
      suggested: "Exemple :\n• Management : Leadership, Gestion d'équipe, Conduite du changement\n• Commercial : Négociation, Développement business, Key Account Management\n• Stratégique : Business Plan, Transformation digitale, Innovation",
      rationale: "Les ATS et recruteurs scannent les sections Compétences en priorité.",
    })
  }

  const executiveSkills = ["leadership", "stratégie", "direction", "management", "pilotage", "négociation", "business development", "transformation"]
  const missingExecSkills = executiveSkills.filter((s) => !skillNames.includes(s) && jobLower.includes(s))

  if (missingExecSkills.length > 0) {
    suggestions.push({
      id: "skills-exec-0",
      type: "skills",
      section: "Compétences",
      priority: "high",
      title: `Ajouter ${missingExecSkills.length} compétences-clés exécutives`,
      description: `Compétences demandées par l'offre mais absentes : ${missingExecSkills.join(", ")}`,
      suggested: `Ajoutez : ${missingExecSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}`,
      rationale: "Ces compétences sont recherchées pour les postes de direction.",
    })
  }

  const sectorSkills = missingKeywords.filter((k) => k.category === "Commerce" || k.category === "Stratégique")
  if (sectorSkills.length > 0) {
    suggestions.push({
      id: "skills-sector-0",
      type: "skills",
      section: "Compétences",
      priority: "medium",
      title: "Ajouter des compétences sectorielles",
      description: `${sectorSkills.slice(0, 8).map((k) => k.word).join(", ")}`,
      rationale: "Ces compétences sont spécifiques au secteur du poste ciblé.",
    })
  }

  return suggestions
}

function generateSectionSuggestions(cvText: string): CvSuggestion[] {
  const suggestions: CvSuggestion[] = []
  const lower = cvText.toLowerCase()

  const requiredSections = [
    { name: "Résumé / Objectif", patterns: ["résumé", "profil", "objectif", "summary", "profile"] },
    { name: "Expérience professionnelle", patterns: ["expérience", "career", "work experience", "employment", "parcours"] },
    { name: "Formation / Diplômes", patterns: ["formation", "diplôme", "education"] },
    { name: "Compétences", patterns: ["compétences", "skills", "expertise"] },
    { name: "Langues", patterns: ["langues", "languages", "langue"] },
    { name: "Certifications", patterns: ["certification", "certificat"] },
  ]

  const sectionOrder = [
    "Résumé / Objectif",
    "Expérience professionnelle",
    "Compétences",
    "Formation / Diplômes",
    "Certifications",
    "Langues",
  ]

  for (const section of requiredSections) {
    const found = section.patterns.some((p) => lower.includes(p))
    if (!found) {
      suggestions.push({
        id: `section-${section.name.toLowerCase().replace(/[^a-z]/g, "-")}`,
        type: "section",
        section: section.name,
        priority: "high",
        title: `Section manquante : ${section.name}`,
        description: `Votre CV ne contient pas de section ${section.name}.`,
        rationale: `Les recruteurs s'attendent à trouver ${section.name} dans un CV cadre dirigeant.`,
      })
    }
  }

  if (requiredSections.filter((s) => s.patterns.some((p) => lower.includes(p))).length < 3) {
    suggestions.push({
      id: "section-order-0",
      type: "section",
      section: "Structure",
      priority: "high",
      title: "Réorganiser les sections du CV",
      description: `Ordre recommandé : ${sectionOrder.join(" → ")}`,
      rationale: "Les ATS analysent les CV de haut en bas. Mettez l'essentiel en premier.",
    })
  }

  return suggestions
}

function generateFormatSuggestions(cvText: string): CvSuggestion[] {
  const suggestions: CvSuggestion[] = []
  const lines = cvText.split("\n").filter(Boolean)
  const words = cvText.split(/\s+/).filter(Boolean)

  if (words.length < 300) {
    suggestions.push({
      id: "format-length-0",
      type: "format",
      section: "Format",
      priority: "high",
      title: "CV trop court",
      description: `${words.length} mots détectés. Visez 600-900 mots pour un CV cadre dirigeant.`,
      suggested: "Ajoutez des détails sur vos réalisations, le contexte, les chiffres et l'impact.",
      rationale: "Un CV trop court manque de profondeur pour convaincre.",
    })
  }

  if (words.length > 1500) {
    suggestions.push({
      id: "format-length-1",
      type: "format",
      section: "Format",
      priority: "medium",
      title: "CV trop long",
      description: `${words.length} mots. Pour un poste de direction, visez 1-2 pages maximum.`,
      suggested: "Condensez les expériences les plus anciennes (plus de 10 ans) et gardez 2 lignes par poste ancien.",
      rationale: "Les recruteurs passent 6 secondes sur un CV. Allez à l'essentiel.",
    })
  }

  const hasBullets = /[•\-*]\s/.test(cvText)
  if (!hasBullets) {
    suggestions.push({
      id: "format-bullets-0",
      type: "format",
      section: "Format",
      priority: "medium",
      title: "Utiliser des puces pour les réalisations",
      description: "Votre CV utilise des paragraphes continus. Les puces améliorent la lisibilité.",
      suggested: "Transformez chaque responsabilité/réalisation en puce commençant par un verbe d'action.",
      rationale: "Les puces augmentent la lisibilité et le temps de lecture.",
    })
  }

  const hasNumbers = /\d+/.test(cvText)
  if (!hasNumbers) {
    suggestions.push({
      id: "format-numbers-0",
      type: "format",
      section: "Format",
      priority: "critical",
      title: "Ajouter des chiffres et données chiffrées",
      description: "Aucun chiffre détecté dans votre CV. Les recruteurs veulent voir des résultats concrets.",
      suggested: "Ajoutez des pourcentages, montants, durées, tailles d'équipe, nombres de clients.",
      rationale: "Les CV chiffrés sont 60% plus susceptibles d'obtenir un entretien.",
    })
  }

  return suggestions
}

async function optimizeCvWithAI(input: OptimizerInput): Promise<CvOptimizationResult | null> {
  const config = await getDeepSeekConfig()
  if (!config) return null

  const expSummary = (input.experiences || []).map(e =>
    `- ${e.title} @ ${e.company} (${e.startDate}–${e.endDate || "aujourd'hui"})${e.revenue ? ` | CA: ${e.revenue}` : ""}${e.teamSize ? ` | Équipe: ${e.teamSize}` : ""}${e.budget ? ` | Budget: ${e.budget}` : ""}${e.achievements ? `\n  Réalisations: ${e.achievements.slice(0, 300)}` : ""}`
  ).join("\n")

  const skillSummary = (input.skills || []).map(s => `- ${s.name} (${s.category}, ${s.level})`).join("\n")

  const result = await generateJsonWithDeepSeek<{
    suggestions: Array<{
      type: "keyword" | "summary" | "experience" | "skills" | "section" | "format"
      section: string
      priority: "critical" | "high" | "medium" | "low"
      title: string
      description: string
      original?: string
      suggested?: string
      rationale: string
    }>
  }>({
    systemPrompt: `Tu es un consultant en optimisation de CV pour cadres dirigeants.
Analyse un CV par rapport à une offre d'emploi et génère des suggestions d'amélioration concrètes.

RÈGLES :
- Sois précis et actionnable, pas de conseils génériques
- Priorise les suggestions critiques (manque de chiffres, résumé absent) vs mineures
- Inspire-toi des réalisations existantes pour proposer des reformulations`,
    userPrompt: `Analyse ce CV pour le poste de ${input.jobTitle}${input.company ? ` chez ${input.company}` : ""} et génère des suggestions d'amélioration.

PROFIL CANDIDAT :
- Titre : ${input.profile?.title || "Non spécifié"}
- Secteurs : ${input.profile?.sectors || "Non spécifié"}
- Fonctions : ${input.profile?.functions || "Non spécifié"}
- Formation : ${input.profile?.education || "Non spécifié"}

OFFRE D'EMPLOI :
${input.jobDescription.slice(0, 2500)}

EXPÉRIENCES :
${expSummary.slice(0, 2000)}

COMPÉTENCES :
${skillSummary.slice(0, 1000)}

TEXTE DU CV :
${input.cvText.slice(0, 2000)}

Retourne UNIQUEMENT un objet JSON avec cette structure :
{
  "suggestions": [
    {
      "type": "keyword|summary|experience|skills|section|format",
      "section": "Compétences|Résumé / Objectif|Expérience professionnelle|Format|Structure",
      "priority": "critical|high|medium|low",
      "title": "titre court",
      "description": "description détaillée",
      "original": "texte original (optionnel)",
      "suggested": "texte suggéré (optionnel)",
      "rationale": "justification"
    }
  ]
}

Min 5 suggestions. JSON uniquement.`,
    temperature: 0.3,
  })

  if (result.success && result.data && result.data.suggestions.length > 0) {
    const suggestions = result.data.suggestions.map((s, i) => ({
      ...s,
      id: `ai-${i}`,
    }))

    const criticalCount = suggestions.filter((s) => s.priority === "critical").length
    const highCount = suggestions.filter((s) => s.priority === "high").length
    const mediumCount = suggestions.filter((s) => s.priority === "medium").length

    const penalty = criticalCount * 7 + highCount * 3 + mediumCount * 1
    const originalScore = Math.max(35, 95 - penalty)
    const improvedScore = Math.min(99, originalScore + (criticalCount * 5 + highCount * 2))

    return {
      summary: {
        originalScore,
        improvedScore,
        totalSuggestions: suggestions.length,
      },
      suggestions,
    }
  }
  return null
}

export async function optimizeCv(input: OptimizerInput): Promise<CvOptimizationResult> {
  const aiResult = await optimizeCvWithAI(input)
  if (aiResult) return aiResult
  return optimizeCvHeuristic(input)
}

async function optimizeCvHeuristic(input: OptimizerInput): Promise<CvOptimizationResult> {
  const jdLower = input.jobDescription.toLowerCase()
  const cvLower = input.cvText.toLowerCase()

  const jdTokens = new Set(
    input.jobDescription.toLowerCase()
      .replace(/[^a-zàâäéèêëïîôöùûüÿç\s-]/gi, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4)
  )
  const cvTokens = new Set(
    input.cvText.toLowerCase()
      .replace(/[^a-zàâäéèêëïîôöùûüÿç\s-]/gi, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4)
  )

  const missingKeywords: { word: string; category: string }[] = []
  for (const token of jdTokens) {
    if (!cvTokens.has(token)) {
      let category = "Général"
      if (/leadership|management|direction|pilotage|encadrement|manager|diriger/.test(token)) category = "Leadership"
      else if (/vente|sales|commercial|négociation|client|prospection|business|growth/.test(token)) category = "Commerce"
      else if (/stratégie|transformation|croissance|développement|marché|innovation/.test(token)) category = "Stratégique"
      else if (/budget|finance|p&l|profit|revenue|rentabilité|marge|ebitda|ca/.test(token)) category = "Finance"
      else if (/digital|data|technologie|système|crm|salesforce|ai|intelligence/.test(token)) category = "Digital / Tech"
      missingKeywords.push({ word: token, category })
    }
  }

  const deDupedKeywords: { word: string; category: string }[] = []
  const seen = new Set<string>()
  for (const kw of missingKeywords) {
    const key = kw.word.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      deDupedKeywords.push(kw)
    }
  }

  let suggestions: CvSuggestion[] = []
  let baseScore = 50

  suggestions.push(...generateSectionSuggestions(input.cvText))
  suggestions.push(...generateFormatSuggestions(input.cvText))
  suggestions.push(...generateSummarySuggestions(input))
  suggestions.push(...generateKeywordSuggestions(input, deDupedKeywords))
  suggestions.push(...generateSkillSuggestions(input, deDupedKeywords))
  suggestions.push(...generateExperienceSuggestions(input))

  suggestions = suggestions
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

  const criticalCount = suggestions.filter((s) => s.priority === "critical").length
  const highCount = suggestions.filter((s) => s.priority === "high").length
  const mediumCount = suggestions.filter((s) => s.priority === "medium").length

  const penalty = criticalCount * 7 + highCount * 3 + mediumCount * 1
  const originalScore = Math.max(35, 95 - penalty)
  const improvedScore = Math.min(99, originalScore + (criticalCount * 5 + highCount * 2))

  return {
    summary: {
      originalScore,
      improvedScore,
      totalSuggestions: suggestions.length,
    },
    suggestions,
  }
}
