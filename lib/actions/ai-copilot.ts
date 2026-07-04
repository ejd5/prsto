"use server";

import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";

export interface CopilotResponse {
  content: string;
  source: "ai" | "local" | "no_key";
  error?: string;
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return "NC";
  const cur = currency || "€";
  const f = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString();
  if (min && max) return `${f(min)}–${f(max)} ${cur}`;
  return `${f(min || max || 0)} ${cur}`;
}

async function buildBriefContext(): Promise<string> {
  const [profile, opps, jobs, analyses, jobScores, pipeline] = await Promise.all([
    prisma.profile.findFirst({
      select: { fullName: true, title: true, sectors: true, functions: true },
    }),
    prisma.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, title: true, company: true, score: true,
        salaryMin: true, salaryMax: true, salaryCurrency: true,
        status: true, createdAt: true,
        analysis: { select: { scoreGlobal: true } },
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, title: true, company: true, globalScore: true,
        salaryMin: true, salaryMax: true, currency: true,
        status: true, createdAt: true,
        score: { select: { matchScore: true } },
      },
    }),
    prisma.analysis.findMany({
      select: { scoreGlobal: true, analysedAt: true },
      take: 20,
    }),
    prisma.jobScore.findMany({
      select: { matchScore: true },
      take: 20,
    }),
    prisma.pipelineTask.findMany({
      select: { column: true },
      take: 50,
    }),
  ]);

  const parts: string[] = [];

  if (profile) {
    parts.push(`Candidat : ${profile.fullName || "—"}`);
    parts.push(`Titre : ${profile.title || "—"}`);
    if (profile.sectors) parts.push(`Secteurs : ${profile.sectors}`);
  }

  // Fusionner les opportunités et les jobs
  const allItems = [
    ...opps.map((o) => ({
      title: o.title,
      company: o.company,
      score: o.score ?? o.analysis?.scoreGlobal ?? null,
      salaryMin: o.salaryMin,
      salaryMax: o.salaryMax,
      salaryCurrency: o.salaryCurrency,
      status: o.status || "nouveau",
    })),
    ...jobs.map((j) => ({
      title: j.title,
      company: j.company ?? "",
      score: j.globalScore ?? j.score?.matchScore ?? null,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      salaryCurrency: j.currency,
      status: j.status,
    })),
  ].slice(0, 8);

  if (allItems.length > 0) {
    parts.push("\nOpportunités récentes :");
    for (const item of allItems.slice(0, 5)) {
      const score = item.score ?? "?";
      const sal = formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency);
      parts.push(`- ${item.title} @ ${item.company} | Score: ${score} | Salaire: ${sal} | Statut: ${item.status}`);
    }
  }

  const allScores = [
    ...analyses.map(a => a.scoreGlobal).filter((s): s is number => s !== null),
    ...jobScores.map(s => s.matchScore).filter((s): s is number => s !== null),
  ];
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  if (avgScore) parts.push(`\nScore moyen global : ${avgScore}%`);

  const sent = pipeline.filter(p => ["envoye", "relance_1", "relance_2"].includes(p.column)).length;
  const interviews = pipeline.filter(p => ["entretien_rh", "entretien_direction", "offre"].includes(p.column)).length;
  parts.push(`Pipeline : ${sent} envoyées, ${interviews} entretiens/offres`);

  return parts.join("\n");
}

async function generateLocalResponse(
  query: string,
  context: string,
): Promise<string> {
  const q = query.toLowerCase();

  if (q.includes("brief") || q.includes("opportunit") || q.includes("synthèse")) {
    return `📋 **Synthèse de votre situation**\n\n${context.split("\n").slice(2).join("\n") || "Aucune donnée disponible. Commencez par importer votre profil et des opportunités."}\n\n_Consultez votre tableau de bord pour plus de détails._`;
  }

  if (q.includes("marché") || q.includes("salaire") || q.includes("tendance")) {
    const lines = context.split("\n").filter(l => l.includes("Salaire:") || l.includes("Score:"));
    if (lines.length > 0) {
      return `📊 **Aperçu des opportunités actuelles :**\n\n${lines.slice(0, 5).join("\n")}\n\n_Actualisez votre Market Radar pour des données marché plus précises._`;
    }
    return `📊 **Market Intelligence**\n\nImportez des offres depuis le Market Radar ou via l'extension Chrome pour obtenir une analyse personnalisée du marché.`;
  }

  if (q.includes("cv") || q.includes("document") || q.includes("lettre")) {
    return `📄 **Génération de documents**\n\nRendez-vous dans le **[Signal Feed](/opportunites)**, sélectionnez une offre, puis cliquez sur *Préparer la candidature* pour générer votre CV adapté et lettre de motivation.`;
  }

  if (q.includes("entretien") || q.includes("interview") || q.includes("prépar")) {
    return `🎙️ **Préparation entretien**\n\nUtilisez le module **[Interview Studio](/entretiens)** pour préparer vos entretiens avec des questions probables et des argumentaires STAR personnalisés.`;
  }

  if (q.includes("recommandation") || q.includes("conseil") || q.includes("next")) {
    return `🧠 **Recommandations :**\n\n1. Complétez votre **Profil** et **Proof Vault**\n2. Lancez un scan **Market Radar**\n3. Analysez les opportunités les mieux notées\n4. Générez vos documents de candidature\n5. Suivez votre pipeline`;
  }

  if (q.includes("sourcing") || q.includes("import") || q.includes("recherche")) {
    return `🔍 **Sourcing d'opportunités**\n\nUtilisez l'**extension Chrome** PRSTO Importer pour capturer des offres depuis LinkedIn, Indeed, APEC, ou le **copier-coller** dans l'onglet Import Express.`;
  }

  if (q.includes("bonjour") || q.includes("salut") || q.includes("hello")) {
    return `Bonjour ! Je suis votre copilote de recherche. Je peux vous aider à :\n- Synthétiser vos opportunités\n- Analyser le marché\n- Préparer des entretiens\n- Générer des documents\n\nQue souhaitez-vous faire ?`;
  }

  return `Je suis votre assistant PRSTO. Voici un résumé de votre contexte actuel :\n\n${context.split("\n").slice(0, 6).join("\n") || "Commencez par configurer votre profil."}\n\nQue souhaitez-vous faire ?`;
}

export async function getCopilotResponse(query: string): Promise<CopilotResponse> {
  const context = await buildBriefContext();

  const settings = await prisma.setting.findFirst();
  const hasApiKey = !!(settings?.apiKey?.trim() && settings.aiProvider && settings.aiProvider !== "none");

  if (hasApiKey) {
    const systemPrompt = `Tu es le copilote IA d'PRSTO, un système de recherche d'emploi pour cadres dirigeants.

Contexte actuel du candidat :
${context}

Réponds de façon concise et utile. Utilise des emojis. Sois précis.
N'invente RIEN. Si tu n'as pas assez de données, dis-le honnêtement.
Format : texte simple, pas de JSON.`;

    const result = await generateWithDeepSeek({
      systemPrompt,
      userPrompt: query,
      temperature: 0.3,
      maxTokens: 800,
    });

    if (result.success && result.content) {
      return { content: result.content, source: "ai" };
    }
  }

  const content = await generateLocalResponse(query, context);
  return {
    content,
    source: hasApiKey ? "local" : "no_key",
    error: hasApiKey ? "Mode dégradé (fallback local)" : undefined,
  };
}
