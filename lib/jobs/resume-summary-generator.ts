import { generateJsonWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek"

export interface SummaryInput {
  fullName: string
  title: string
  summary?: string
  yearsExp?: number | null
  sectors?: string
  functions?: string
  education?: string
  certifications?: string
  languages?: string
  location?: string
  mobility?: string
  preferredTone?: string
  targetRole?: string
  company?: string
  experiences?: Array<{
    title: string
    company: string
    startDate: string
    endDate?: string
    achievements?: string
    revenue?: string
    teamSize?: string
    budget?: string
  }>
  skills?: Array<{
    name: string
    category: string
    level: string
  }>
}

export interface GeneratedSummary {
  id: string
  tone: string
  toneLabel: string
  text: string
  length: "short" | "medium" | "long"
  characters: number
  target: "cv" | "linkedin" | "cover-letter"
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [value]
  } catch {
    return value.split(",").map((s) => s.trim()).filter(Boolean)
  }
}

function getCurrentPosition(input: SummaryInput): string {
  return input.title || input.summary?.split(".")[0]?.trim() || "Cadre dirigeant"
}

function getSectorLabel(sectors: string[]): string {
  const mapping: Record<string, string> = {
    industrie: "l'industrie",
    saas: "le SaaS",
    "distribution b2b": "la distribution B2B",
    retail: "le retail",
    services: "les services",
    tech: "la tech",
    finance: "la finance",
    santé: "la santé",
    luxe: "le luxe",
    énergie: "l'énergie",
    conseil: "le conseil",
  }
  return sectors.map((s) => mapping[s.toLowerCase().trim()] || s).join(", ")
}

function extractTopAchievements(input: SummaryInput): string[] {
  const achievements: string[] = []
  for (const exp of input.experiences || []) {
    if (exp.revenue) achievements.push(`Chiffre d'affaires : ${exp.revenue}`)
    if (exp.teamSize) achievements.push(`Encadrement : ${exp.teamSize}`)
    if (exp.budget) achievements.push(`Budget : ${exp.budget}`)
  }

  const skillNames = (input.skills || []).filter((s) => s.level === "expert" || s.level === "confirmé").map((s) => s.name)
  const topSkills = skillNames.slice(0, 5)
  if (topSkills.length > 0) achievements.push(`Expertise : ${topSkills.join(", ")}`)

  return achievements.slice(0, 4)
}

function getYearsRange(input: SummaryInput): string {
  if (input.yearsExp) return `${input.yearsExp} ans d'expérience`
  return "plus de 15 ans d'expérience"
}

function generateShort(input: SummaryInput, tone: string): string {
  const position = getCurrentPosition(input)
  const sectors = parseJsonArray(input.sectors)

  const templates: Record<string, string> = {
    formel: `${position} avec ${getYearsRange(input)} dans ${sectors.length > 0 ? getSectorLabel(sectors) : "le secteur B2B"}. Expertise en développement commercial, management d'équipes et pilotage de la performance.`,
    direct: `${position}. ${getYearsRange(input)} — ${sectors.length > 0 ? getSectorLabel(sectors) : "B2B"}. Résultats : croissance du CA, transformation commerciale, développement de portefeuille.`,
    inspirant: `Leader commercial confirmé, je transforme les organisations pour générer une croissance durable. ${getYearsRange(input)} au service de la performance dans ${sectors.length > 0 ? getSectorLabel(sectors) : "l'univers B2B"}.`,
  }

  return templates[tone] || templates.formel
}

function generateMedium(input: SummaryInput, tone: string, targetRole?: string): string {
  const position = getCurrentPosition(input)
  const sectors = parseJsonArray(input.sectors)
  const functions = parseJsonArray(input.functions)
  const education = parseJsonArray(input.education)
  const achievements = extractTopAchievements(input)
  const location = input.location || "France"

  const targetClause = targetRole ? ` pour un poste de ${targetRole}` : ""
  const sectorsClause = sectors.length > 0 ? ` dans ${getSectorLabel(sectors)}` : ""
  const funcsClause = functions.length > 0 ? `. Expert en ${functions.slice(0, 2).join(" et ")}` : ""
  const eduClause = education.length > 0 ? `. Formation : ${education.slice(0, 2).join(", ")}` : ""
  const achievClause = achievements.length > 0 ? `\n\nRésultats clés : ${achievements.join(" | ")}` : ""

  const templates: Record<string, string> = {
    formel: `${position} basé${input.fullName.endsWith("e") ? "e" : ""} à ${location}${targetClause}, fort${input.fullName.endsWith("e") ? "e" : ""} de ${getYearsRange(input)}${sectorsClause}${funcsClause}.${eduClause} Engagé${input.fullName.endsWith("e") ? "e" : ""} dans une démarche de transformation et de création de valeur, je pilote des P&L, développe des parts de marché et manage des équipes multiculturelles.${achievClause}`,
    direct: `${position} — ${getYearsRange(input)}${sectorsClause}${targetClause ? " " + targetClause : ""}.${funcsClause}${eduClause}${achievClause}\n\nObjectif : apporter une vision stratégique, structurer la croissance et générer des résultats mesurables dans un environnement exigeant.`,
    inspirant: `Mon ambition : ${targetRole ? "devenir le " + targetRole + " qui" : "être le leader qui"} fait la différence. ${getYearsRange(input)} à provoquer des transformations commerciales${sectorsClause}.${funcsClause}${eduClause}${achievClause}\n\nConvaincu que la performance naît de l'alignement entre stratégie, exécution et talents.`,
  }

  return templates[tone] || templates.formel
}

function generateLong(input: SummaryInput, tone: string, targetRole?: string): string {
  const medium = generateMedium(input, tone, targetRole)
  const languages = parseJsonArray(input.languages)
  const certs = parseJsonArray(input.certifications)
  const mobility = input.mobility || ""

  const extras: string[] = []
  if (languages.length > 0) extras.push(`Langues : ${languages.join(", ")}`)
  if (certs.length > 0) extras.push(`Certifications : ${certs.slice(0, 3).join(", ")}`)
  if (mobility) extras.push(`Mobilité : ${mobility}`)

  if (extras.length > 0) {
    return `${medium}\n\n${extras.join(" | ")}`
  }

  return medium
}

async function generateSummaryWithAI(input: SummaryInput, tone: string, target: "cv" | "linkedin" | "cover-letter"): Promise<string | null> {
  const config = await getDeepSeekConfig()
  if (!config) return null

  const expHighlights = (input.experiences || []).slice(0, 3).map(e =>
    `${e.title} @ ${e.company} (${e.startDate}–${e.endDate || "aujourd'hui"})${e.achievements ? ` — ${e.achievements.slice(0, 200)}` : ""}`
  ).join("\n")

  const skillHighlights = (input.skills || []).filter(s => s.level === "expert" || s.level === "confirmé").slice(0, 8).map(s => s.name).join(", ")

  const lengthHint = target === "linkedin" ? "2-3 phrases max (150 caractères)" : target === "cover-letter" ? "4-5 phrases (200-300 mots)" : "3-4 phrases (150-200 mots)"

  const toneDescriptions: Record<string, string> = {
    formel: "professionnel et structuré, ton institutionnel",
    direct: "percutant, orienté résultats, chiffres en avant",
    inspirant: "visionnaire, engageant, storytelling exécutif",
  }

  const result = await generateJsonWithDeepSeek<{ text: string }>({
    systemPrompt: `Tu es un rédacteur de résumés exécutifs pour cadres dirigeants (Directeur Commercial, VP Sales, Country Manager).
Écris en français. Ton : ${toneDescriptions[tone] || toneDescriptions.formel}.
RÈGLE ABSOLUE : n'invente RIEN. Utilise UNIQUEMENT les données fournies.`,
    userPrompt: `Génère un résumé exécutif ${target === "linkedin" ? "LinkedIn" : target === "cover-letter" ? "de lettre de motivation" : "de CV"} pour :

Nom : ${input.fullName}
Poste actuel : ${input.title}
Expérience : ${input.yearsExp || "15+"} ans
Secteurs : ${input.sectors || "Non spécifié"}
Localisation : ${input.location || "France"}
${input.targetRole ? `Poste ciblé : ${input.targetRole}` : ""}
${input.company ? `Entreprise ciblée : ${input.company}` : ""}

Expériences récentes :
${expHighlights || "Non renseignées"}

Compétences clés : ${skillHighlights || "Non renseignées"}

Longueur : ${lengthHint}

Retourne UNIQUEMENT un JSON : {"text": "le résumé généré"}

Pas de markdown. JSON uniquement.`,
    temperature: tone === "inspirant" ? 0.6 : 0.3,
  })

  if (result.success && result.data?.text) {
    return result.data.text
  }
  return null
}

export async function generateSummary(input: SummaryInput, tone: string = "formel"): Promise<GeneratedSummary> {
  const tones: Record<string, string> = {
    formel: "Formel — professionnel et structuré",
    direct: "Direct — percutant et orienté résultats",
    inspirant: "Inspirant — visionnaire et engageant",
  }

  const aiText = await generateSummaryWithAI(input, tone, "cv")
  const text = aiText || generateMedium(input, tone, input.targetRole)
  return {
    id: `summary-${tone}-medium`,
    tone,
    toneLabel: tones[tone] || tone,
    text,
    length: "medium",
    characters: text.length,
    target: "cv",
  }
}

export async function generateAllVariants(input: SummaryInput): Promise<GeneratedSummary[]> {
  const results: GeneratedSummary[] = []
  const tones = ["formel", "direct", "inspirant"]
  const targets: Array<{ id: "cv" | "linkedin" | "cover-letter"; label: string }> = [
    { id: "cv", label: "CV" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "cover-letter", label: "Lettre de motivation" },
  ]

  for (const tone of tones) {
    const toneLabels: Record<string, string> = {
      formel: "Formel",
      direct: "Direct",
      inspirant: "Inspirant",
    }

    for (const target of targets) {
      let text: string
      let length: "short" | "medium" | "long"

      const aiText = await generateSummaryWithAI(input, tone, target.id)

      if (target.id === "linkedin") {
        text = aiText || generateShort(input, tone)
        length = "short"
      } else if (target.id === "cover-letter") {
        text = aiText || generateLong(input, tone, input.targetRole)
        length = "long"
      } else {
        text = aiText || generateMedium(input, tone, input.targetRole)
        length = "medium"
      }

      results.push({
        id: `summary-${tone}-${target.id}`,
        tone,
        toneLabel: toneLabels[tone],
        text,
        length,
        characters: text.length,
        target: target.id,
      })
    }
  }

  return results
}

export async function adaptForJob(input: SummaryInput, jobTitle: string, company?: string): Promise<GeneratedSummary> {
  const adapted = { ...input, targetRole: jobTitle, company }
  const aiText = await generateSummaryWithAI(adapted, input.preferredTone || "formel", "cv")
  const text = aiText || generateMedium(adapted, input.preferredTone || "formel", jobTitle)
  return {
    id: `summary-adapted-${Date.now()}`,
    tone: input.preferredTone || "formel",
    toneLabel: `Ciblé — ${jobTitle}`,
    text,
    length: "medium",
    characters: text.length,
    target: "cv",
  }
}
