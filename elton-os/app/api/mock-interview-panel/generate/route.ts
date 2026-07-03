import { NextRequest, NextResponse } from "next/server";
import { generateWithZai } from "@/lib/ai/zai-client";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/mock-interview-panel/generate
 *
 * Body: { jobTitle: string, company?: string }
 * Response: { success, questions: Array<{ role, question, context }> }
 *
 * Génère 5 questions sur-mesure pour un Panel Comex (CEO, CFO, DRH, Pair, Investisseur)
 * en utilisant la mémoire Prisma du dirigeant (profil, preuves, opportunités).
 */

const PANEL_ROLES = [
  { id: "ceo", name: "CEO / N+1", focus: "vision stratégique, leadership, alignement avec la direction", color: "#E4B118", bgGradient: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)" },
  { id: "cfo", name: "CFO / DAF", focus: "P&L, gestion financière, ROI, gestion des risques", color: "#0E3A29", bgGradient: "linear-gradient(135deg, #0E3A29 0%, #1A5A3E 100%)" },
  { id: "drh", name: "DRH / Chief People Officer", focus: "management d'équipe, culture, soft skills", color: "#6A8F6D", bgGradient: "linear-gradient(135deg, #6A8F6D 0%, #8FB092 100%)" },
  { id: "pair", name: "Pair Comex / futur collègue", focus: "collaboration, expertise métier, intégration", color: "#2563EB", bgGradient: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)" },
  { id: "investisseur", name: "Board Member / Investisseur", focus: "création de valeur, exit, gouvernance", color: "#DC2626", bgGradient: "linear-gradient(135deg, #DC2626 0%, #F87171 100%)" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const jobTitle: string = (body?.jobTitle ?? "Directeur Général").toString();
    const company: string = (body?.company ?? "").toString();

    // Charger le profil du dirigeant pour contextualiser les questions
    const profile = await prisma.profile.findFirst({
      include: { skills: { select: { name: true } } },
    });

    const profileContext = profile
      ? `Profil: ${profile.title || "?"}, ${profile.yearsExp || "?"} ans d'expérience, secteurs: ${profile.sectors || "?"}, langues: ${profile.languages || "?"}`
      : "Profil non renseigné";

    const systemPrompt = `Tu es un simulateur d'entretien Comex pour cadres dirigeants. Tu génères 5 questions d'entretien réalistes, une par rôle du panel, pour un poste de "${jobTitle}"${company ? ` chez ${company}` : ""}.

Contexte du candidat: ${profileContext}

Génère exactement 5 questions, une pour chaque rôle :
1. CEO/N+1 — vision stratégique, leadership
2. CFO/DAF — P&L, finance, ROI
3. DRH — management, culture, people
4. Pair Comex — collaboration, expertise métier
5. Investisseur/Board — création de valeur, exit

Chaque question doit être :
- Spécifique au poste "${jobTitle}"
- Réaliste (ce qu'un vrai Comex demanderait)
- Difficile mais juste
- Contextualisée au profil du candidat si possible

Réponds en JSON valide avec ce format exact :
{
  "questions": [
    { "role": "ceo", "question": "La question...", "context": "Indice bref" },
    { "role": "cfo", "question": "...", "context": "..." },
    { "role": "drh", "question": "...", "context": "..." },
    { "role": "pair", "question": "...", "context": "..." },
    { "role": "investisseur", "question": "...", "context": "..." }
  ]
}

Ne retourne QUE le JSON, pas de texte avant ou après.`;

    // Essayer Z.AI d'abord, puis NVIDIA
    let result = await generateWithZai({
      systemPrompt,
      userPrompt: `Génère les 5 questions pour le poste de ${jobTitle}.`,
      timeout: 40000,
    });

    if (!result.success || !result.content) {
      result = await generateWithDeepSeek({
        systemPrompt,
        userPrompt: `Génère les 5 questions pour le poste de ${jobTitle}.`,
        temperature: 0.7,
        maxTokens: 1000,
        timeout: 30000,
      });
    }

    if (!result.success || !result.content) {
      return NextResponse.json(
        { success: false, error: "Génération IA échec" },
        { status: 500 }
      );
    }

    // Parser le JSON
    let questions;
    try {
      // Nettoyer le contenu (parfois le JSON est dans des ```json blocks)
      let jsonStr = result.content.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      questions = parsed.questions || parsed;
    } catch {
      // Fallback : questions génériques si le parsing échoue
      questions = [
        { role: "ceo", question: `Pourquoi ce poste de ${jobTitle} maintenant ? Quel est votre projet à 100 jours ?`, context: "Préparez votre pitch vision" },
        { role: "cfo", question: "Comment allez-vous structurer votre P&L la première année ? Quels KPIs prioritaires ?", context: "Pensez ROI et cash-flow" },
        { role: "drh", question: "Comment gérez-vous un conflit entre deux membres clés du Comex ?", context: "Méthode STAR recommandée" },
        { role: "pair", question: "Comment comptez-vous collaborer avec votre futur pair technique ?", context: "Montrez votre adaptabilité" },
        { role: "investisseur", question: "Quelle est votre stratégie de création de valeur sur 3 ans pour nos actionnaires ?", context: "Pensez exit strategy" },
      ];
    }

    // Enrichir avec les métadonnées des rôles
    const enrichedQuestions = questions.map((q: { role: string; question: string; context?: string }) => {
      const roleMeta = PANEL_ROLES.find(r => r.id === q.role) || PANEL_ROLES[0];
      // Map role id to iconName for the frontend
      const iconNameMap: Record<string, string> = {
        ceo: "Crown",
        cfo: "DollarSign",
        drh: "Users",
        pair: "Briefcase",
        investisseur: "TrendingUp",
      };
      return {
        role: {
          id: roleMeta.id,
          name: roleMeta.name.split(" / ")[0],
          title: roleMeta.name,
          description: roleMeta.focus,
          iconName: iconNameMap[roleMeta.id] || "Sparkles",
          color: roleMeta.color || "#E4B118",
          bgGradient: roleMeta.bgGradient || "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)",
        },
        question: q.question,
        context: q.context,
      };
    });

    return NextResponse.json({
      success: true,
      questions: enrichedQuestions,
    });
  } catch (err) {
    console.error("[/api/mock-interview-panel/generate] Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
