import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const draft = await prisma.applicationDraft.findUnique({
      where: { id },
      select: { generationLogs: true },
    });
    if (!draft) return NextResponse.json({ error: "Draft introuvable" }, { status: 404 });

    const logs = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
    const arr = Array.isArray(logs) ? logs : [logs];
    const cached = arr.find((l: { type?: string }) => l.type === "executive_analysis");

    return NextResponse.json({ success: true, cached: cached || null });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const draft = await prisma.applicationDraft.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            score: { select: { semanticAnalysisJson: true, globalScore: true } },
            source: { select: { name: true } },
          },
        },
      },
    });
    if (!draft || !draft.job) return NextResponse.json({ error: "Draft introuvable" }, { status: 404 });

    // Vérifier le cache
    const logs = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
    const arr = Array.isArray(logs) ? logs : [logs];
    const cached = arr.find((l: { type?: string }) => l.type === "executive_analysis");
    if (cached) return NextResponse.json({ success: true, analysis: cached, fromCache: true });

    // Extraire les données du semantic matcher
    let semData: Record<string, unknown> = {};
    if (draft.job.score?.semanticAnalysisJson) {
      try { semData = JSON.parse(draft.job.score.semanticAnalysisJson); } catch { /* ignore */ }
    }

    const profile = await prisma.profile.findFirst({
      select: { fullName: true, title: true, summary: true, yearsExp: true, sectors: true, mobility: true, languages: true },
    });

    // Construire le prompt pour DeepSeek
    const context = {
      poste: draft.job.title,
      entreprise: draft.job.company || "N/A",
      localisation: draft.job.location || "N/A",
      source: draft.job.source?.name || "N/A",
      score: draft.job.score?.globalScore ?? "N/A",
      candidat: profile?.fullName || "Candidat",
      titreCandidat: profile?.title || "N/A",
      experience: profile?.yearsExp ? `${profile.yearsExp} ans` : "N/A",
      secteurs: profile?.sectors || "N/A",
      mobilite: profile?.mobility || "N/A",
      langues: profile?.languages || "N/A",
      forces: semData.positiveSignals || [],
      risques: semData.riskSignals || [],
      manques: semData.missingSignals || [],
      scores: semData.scores || {},
      explication: semData.explanation || "",
    };

    const prompt = `Tu es un expert en recrutement de cadres dirigeants avec 20 ans d'expérience en cabinet. Tu analyses une offre pour un candidat.

PROFIL DU CANDIDAT :
- Nom : ${context.candidat}
- Titre actuel : ${context.titreCandidat}
- Expérience : ${context.experience}
- Secteurs : ${context.secteurs}
- Mobilité : ${context.mobilite}
- Langues : ${context.langues}

OFFRE :
- Poste : ${context.poste}
- Entreprise : ${context.entreprise}
- Localisation : ${context.localisation}
- Source : ${context.source}
- Score global : ${context.score}/100

DONNÉES D'ANALYSE EXISTANTES :
- Forces détectées : ${JSON.stringify(context.forces)}
- Risques : ${JSON.stringify(context.risques)}
- Signaux manquants : ${JSON.stringify(context.manques)}
- Scores par dimension : ${JSON.stringify(context.scores)}
- Explication : ${context.explication}

Génère UNIQUEMENT le JSON suivant (pas de markdown, pas de texte autour) :

{
  "angleAttaque": "string — 2-3 phrases : comment le candidat doit se positionner face à cette offre. Spécifique, pas générique.",
  "leviersNegociation": ["3 leviers sur lesquels le candidat peut négocier (salaire, titre, TT, avantages, scope...)"],
  "questionsEntretien": ["5 questions stratégiques à poser en entretien qui démontrent sa valeur et sa compréhension du poste"],
  "piegesEviter": ["3 choses à ne surtout PAS dire ou faire en entretien pour ce poste"],
  "positionnementMarche": "string — 2 phrases : comment cette offre se positionne par rapport au marché (salaire, séniorité, attractivité)",
  "resumeExecutif": "string — 3-4 phrases : synthèse actionnable. Commence par 'Cette offre est [recommandée/intéressante/à écarter] pour votre profil car...' et termine par une recommandation claire."
}

RÈGLES :
- Sois incisif et concret, pas de blabla
- Base-toi sur les données fournies, n'invente rien sur le candidat
- Ton exécutif et direct, comme un conseiller de confiance
- En français
- Format JSON strict, pas de markdown, pas de texte avant/après`;

    let analysis: Record<string, unknown> | null = null;

    const result = await generateWithDeepSeek({
      systemPrompt: "Tu es un expert en recrutement de cadres dirigeants. Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.",
      userPrompt: prompt,
      temperature: 0.5,
      maxTokens: 2500,
    });

    if (result.success && result.content) {
      try {
        // Nettoyer la réponse
        let json = result.content.trim();
        if (json.startsWith("```")) json = json.replace(/```json?\n?/g, "").replace(/```/g, "");
        analysis = JSON.parse(json);
      } catch { /* fallback */ }
    }

    // Fallback si DeepSeek échoue
    if (!analysis) {
      analysis = {
        angleAttaque: `Mettez en avant votre expérience en ${context.secteurs || "direction commerciale"} et votre capacité à générer des résultats mesurables.`,
        leviersNegociation: ["Rémunération variable", "Télétravail", "Périmètre du poste"],
        questionsEntretien: [
          "Quels sont les objectifs prioritaires pour les 6 premiers mois ?",
          "Comment l'équipe est-elle structurée et quel est le style de management ?",
          "Quels sont les principaux défis du marché actuellement ?",
          "Comment mesurez-vous la réussite sur ce poste ?",
          "Quelle est la trajectoire d'évolution prévue pour ce rôle ?",
        ],
        piegesEviter: [
          "Ne pas critiquer vos anciens employeurs",
          "Éviter de donner un chiffre de salaire en premier",
          "Ne pas montrer de doute sur vos compétences clés",
        ],
        positionnementMarche: `Cette offre s'inscrit dans le marché actuel pour un profil de direction commerciale. Le niveau de rémunération est à évaluer selon la taille de l'entreprise.`,
        resumeExecutif: `Cette offre est intéressante pour votre profil. Votre expérience correspond au poste. Nous recommandons de postuler et de préparer soigneusement l'entretien.`,
      };
    }

    // Stocker dans generationLogs
    const genLogs = draft.generationLogs ? JSON.parse(draft.generationLogs) : [];
    const logsArr = Array.isArray(genLogs) ? genLogs : [genLogs];
    logsArr.push({
      type: "executive_analysis",
      generatedAt: new Date().toISOString(),
      ...analysis,
    });
    if (logsArr.length > 100) logsArr.splice(0, logsArr.length - 100);

    await prisma.applicationDraft.update({
      where: { id },
      data: { generationLogs: JSON.stringify(logsArr) },
    });

    return NextResponse.json({ success: true, analysis: { type: "executive_analysis", ...analysis }, fromCache: false });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
