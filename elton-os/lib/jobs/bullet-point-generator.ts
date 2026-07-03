import { generateJsonWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek"

export interface BulletInput {
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
}

export interface BulletPoint {
  id: string
  text: string
  style: "star" | "concise" | "numbered"
  category: string
  metrics?: string
}

export interface GeneratedBullets {
  experienceId: string
  company: string
  title: string
  bullets: BulletPoint[]
  suggestions: string[]
}

const VERB_ACTIONS = [
  "Piloté", "Dirigé", "Conçu", "Développé", "Transformé", "Structuré",
  "Lancé", "Négocié", "Optimisé", "Généré", "Accéléré", "Coordonné",
  "Implémenté", "Déployé", "Restructuré", "Mené", "Supervisé", "Animé",
  "Créé", "Établi", "Redressé", "Fidélisé", "Diversifié", "Rationalisé",
  "Digitalisé", "Professionnalisé", "Standardisé", "Harmonisé",
]

function inferSectorKeywords(title: string, sector?: string): string {
  const lower = title.toLowerCase()
  if (lower.includes("commercial") || lower.includes("sales") || lower.includes("business development")) {
    return "développement commercial, croissance du CA, conquête de parts de marché"
  }
  if (lower.includes("marketing") || lower.includes("digital")) {
    return "transformation digitale, génération de leads, branding"
  }
  if (lower.includes("finance") || lower.includes("financier") || lower.includes("cfo")) {
    return "gestion budgétaire, optimisation des coûts, EBITDA"
  }
  if (lower.includes("directeur") || lower.includes("general") || lower.includes("vp") || lower.includes("head")) {
    return "leadership stratégique, transformation, management transverse"
  }
  if (lower.includes("technique") || lower.includes("cto") || lower.includes("engineering")) {
    return "innovation produit, architecture technique, delivery"
  }
  return "gestion d'équipe, pilotage opérationnel, reporting"
}

function parseAchievements(raw?: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((a: string) => a.trim()).filter(Boolean) : [raw]
  } catch {
    return raw.split("\n").map((a) => a.trim().replace(/^[\s•\-*]+/, "")).filter((a) => a.length > 5)
  }
}

function generateStarBullets(input: BulletInput): BulletPoint[] {
  const bullets: BulletPoint[] = []
  const achievements = parseAchievements(input.achievements)
  const keywords = inferSectorKeywords(input.title, input.sector)

  if (achievements.length > 0) {
    achievements.forEach((ach, i) => {
      const verb = VERB_ACTIONS[i % VERB_ACTIONS.length]
      bullets.push({
        id: `star-ach-${i}`,
        text: `${verb} : ${ach}`,
        style: "star",
        category: "Réalisation",
        metrics: /\d+/.test(ach) ? extractMetrics(ach) : undefined,
      })
    })
  }

  const usedCategories = new Set<string>()
  const scenarios: Array<{ keyword: string; category: string }> = [
    { keyword: input.revenue || "", category: "Performance commerciale" },
    { keyword: input.teamSize || "", category: "Management" },
    { keyword: input.budget || "", category: "Gestion budgétaire" },
    { keyword: input.responsibilities || "", category: "Responsabilités" },
    { keyword: input.description || "", category: "Contexte" },
  ]

  for (const scenario of scenarios) {
    if (!scenario.keyword || usedCategories.has(scenario.category)) continue
    usedCategories.add(scenario.category)

    const verb = VERB_ACTIONS[bullets.length % VERB_ACTIONS.length]
    const metric = scenario.keyword.match(/\d+[\s%kKkMmMBbEe]*/) || ""

    if (scenario.category === "Performance commerciale") {
      bullets.push({
        id: `star-${scenario.category.toLowerCase().replace(/\s+/g, "-")}`,
        text: `${verb} un chiffre d'affaires de ${scenario.keyword}, ${keywords.split(",")[0]}`,
        style: "star",
        category: scenario.category,
        metrics: String(metric),
      })
    } else if (scenario.category === "Management") {
      bullets.push({
        id: `star-${scenario.category.toLowerCase().replace(/\s+/g, "-")}`,
        text: `${verb} une équipe de ${scenario.keyword} personnes, en assurant le recrutement, la formation et la montée en compétences`,
        style: "star",
        category: scenario.category,
        metrics: String(metric),
      })
    } else if (scenario.category === "Gestion budgétaire") {
      bullets.push({
        id: `star-${scenario.category.toLowerCase().replace(/\s+/g, "-")}`,
        text: `${verb} un budget de ${scenario.keyword}, avec une optimisation des ressources et un suivi mensuel des écarts`,
        style: "star",
        category: scenario.category,
        metrics: String(metric),
      })
    }
  }

  if (bullets.length < 3) {
    const genericBullets = [
      `Contribué à la définition et à l'exécution de la stratégie ${keywords.split(",")[0]}`,
      `Assuré le reporting régulier auprès de la direction générale sur les indicateurs clés`,
      `Développé et entretenu un réseau de partenaires stratégiques pour accélérer la croissance`,
    ]
    genericBullets.slice(0, 4 - bullets.length).forEach((text, i) => {
      bullets.push({
        id: `star-generic-${i}`,
        text,
        style: "star",
        category: "Général",
      })
    })
  }

  return bullets
}

function generateConciseBullets(input: BulletInput): BulletPoint[] {
  const starBullets = generateStarBullets(input)
  return starBullets.map((b, i) => ({
    ...b,
    id: `concise-${i}`,
    text: b.text.split(",")[0] + (b.metrics ? ` (${b.metrics})` : ""),
    style: "concise" as const,
  }))
}

function generateNumberedBullets(input: BulletInput): BulletPoint[] {
  const bullets: BulletPoint[] = []
  const achievements = parseAchievements(input.achievements)

  if (achievements.length > 0) {
    achievements.forEach((ach, i) => {
      bullets.push({
        id: `num-ach-${i}`,
        text: `${i + 1}. ${ach}`,
        style: "numbered",
        category: "Réalisation clé",
        metrics: /\d+/.test(ach) ? extractMetrics(ach) : undefined,
      })
    })
  }

  if (bullets.length < 3) {
    const contexts = [
      { prefix: "Contexte", text: `${input.title} chez ${input.company}${input.sector ? ` — secteur ${input.sector}` : ""}` },
    ]
    if (input.revenue) contexts.push({ prefix: "Périmètre", text: `CA : ${input.revenue}` })
    if (input.teamSize) contexts.push({ prefix: "Équipe", text: `${input.teamSize} personnes` })
    if (input.budget) contexts.push({ prefix: "Budget", text: input.budget })

    contexts.forEach((ctx, i) => {
      bullets.push({
        id: `num-ctx-${i}`,
        text: `${bullets.length + 1}. ${ctx.prefix} : ${ctx.text}`,
        style: "numbered",
        category: "Contexte",
      })
    })
  }

  return bullets.sort((a, b) => parseInt(a.text) - parseInt(b.text))
}

function extractMetrics(text: string): string {
  const numbers = text.match(/[\d]+[\s%kKmMBbEe€$]*/g)
  return numbers ? numbers.slice(0, 3).join(", ") : ""
}

function generateSuggestions(input: BulletInput): string[] {
  const suggestions: string[] = []
  if (!input.achievements || input.achievements.length < 5) {
    suggestions.push("Ajoutez des réalisations chiffrées (croissance du CA, % d'augmentation, nombre de clients)")
  }
  if (!input.revenue) {
    suggestions.push("Indiquez le chiffre d'affaires ou le portefeuille géré")
  }
  if (!input.teamSize) {
    suggestions.push("Précisez la taille de l'équipe managée")
  }
  if (input.responsibilities && input.responsibilities.length > 200) {
    suggestions.push("Réduisez la description des responsabilités ; concentrez-vous sur les résultats")
  }
  return suggestions
}

async function generateBulletPointsWithAI(input: BulletInput): Promise<GeneratedBullets | null> {
  const config = await getDeepSeekConfig()
  if (!config) return null

  const result = await generateJsonWithDeepSeek<{
    bullets: Array<{ text: string; style: "star" | "concise" | "numbered"; category: string }>
    suggestions: string[]
  }>({
    systemPrompt: `Tu es un rédacteur de CV executive. Génère des bullet points percutants pour des cadres dirigeants.
RÈGLES :
- Commence chaque bullet par un verbe d'action fort (Piloté, Dirigé, Transformé, Généré, Accéléré)
- Inclus des chiffres concrets quand les données le permettent
- Structure : STAR (Situation, Task, Action, Result)
- Pas de phrases génériques ou vagues
- Ton exécutif, orienté résultats`,
    userPrompt: `Génère des bullet points de CV pour cette expérience :

Poste : ${input.title}
Entreprise : ${input.company}
Secteur : ${input.sector || "Non spécifié"}
Période : ${input.startDate} → ${input.endDate || "aujourd'hui"}

Description : ${input.description?.slice(0, 500) || "Non fournie"}
Responsabilités : ${input.responsibilities?.slice(0, 500) || "Non fournies"}
Réalisations : ${input.achievements?.slice(0, 500) || "Non fournies"}
CA géré : ${input.revenue || "Non spécifié"}
Taille d'équipe : ${input.teamSize || "Non spécifié"}
Budget : ${input.budget || "Non spécifié"}

Retourne UNIQUEMENT un JSON :
{
  "bullets": [
    {"text": "bullet point complet", "style": "star", "category": "Réalisation|Performance commerciale|Management|Stratégie|Gestion budgétaire"},
    {"text": "...", "style": "concise", "category": "..."},
    {"text": "...", "style": "numbered", "category": "..."}
  ],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Génère 4-6 bullet points. JSON uniquement.`,
    temperature: 0.4,
  })

  if (result.success && result.data) {
    return {
      experienceId: `${input.company}-${input.title}`,
      company: input.company,
      title: input.title,
      bullets: result.data.bullets.map((b, i) => ({
        ...b,
        id: `ai-${i}`,
        metrics: b.text.match(/[\d]+[\s%kKmMBbEe€$]*/g)?.slice(0, 3).join(", ") || undefined,
      })),
      suggestions: result.data.suggestions,
    }
  }
  return null
}

export async function generateBulletPoints(input: BulletInput): Promise<GeneratedBullets> {
  const aiResult = await generateBulletPointsWithAI(input)
  if (aiResult) return aiResult

  const star = generateStarBullets(input)
  const concise = generateConciseBullets(input)
  const numbered = generateNumberedBullets(input)

  return {
    experienceId: `${input.company}-${input.title}`,
    company: input.company,
    title: input.title,
    bullets: [...star, ...concise, ...numbered],
    suggestions: generateSuggestions(input),
  }
}

export async function generateAllBulletPoints(inputs: BulletInput[]): Promise<GeneratedBullets[]> {
  const results: GeneratedBullets[] = []
  for (const input of inputs) {
    results.push(await generateBulletPoints(input))
  }
  return results
}
