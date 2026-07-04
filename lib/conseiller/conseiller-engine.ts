"use server";

import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";
import { getLocalAnswer } from "./conseiller-knowledge";

const ALLOWED_TOPICS = [
  "prsto", "elton os", "elton", "boardroom", "application", "appli", "outil", "logiciel",
  "recherche d'emploi", "recherche emploi", "job search", "candidature", "postuler",
  "entretien", "interview", "pitch", "recruteur", "recrutement", "chasseur",
  "cv", "curriculum", "lettre de motivation", "cover letter", "email", "linkedin",
  "profil", "compétence", "skill", "langue", "formation", "diplôme", "certification",
  "salaire", "rémunération", "négociation", "package", "prétention",
  "offre", "opportunité", "job", "poste", "mission", "stage", "cdi", "cdd",
  "pipeline", "kanban", "suivi", "relance", "workflow",
  "score", "matching", "analyse", "briefing", "dashboard", "tableau de bord",
  "import", "scraper", "extension", "chrome", "source", "firecrawl",
  "proof vault", "preuve", "réalisation", "résultat",
  "cv maître", "cv-maitre", "template", "modèle", "style", "document",
  "marché", "marché de l'emploi", "marché du travail", "secteur", "industrie",
  "carrière", "carriere", "mobilité", "transition", "reconversion",
  "coach", "conseil", "conseiller", "guide", "aide", "tutoriel",
  "paramètre", "parametre", "configuration", "api", "deepseek", "openrouter",
  "stratégie", "strategie", "plan", "objectif", "priorité",
  "réseau", "reseau", "contact", "crm", "relation",
  "test", "évaluation", "assessment", "compétence technique",
  "contrat", "période d'essai", "préavis", "démission", "démission",
  "simulation", "scenario", "plan d'action",
  "motivation", "objection", "point fort", "point faible",
  "checklist", "logistique", "préparation", "organisation",
  "question", "réponse", "reponse", "star", "méthode", "méthode",
  "mail", "inmail", "message", "communication",
  "métier", "metier", "fonction", "poste", "role",
  "compétence", "competence", "savoir-être", "soft skill", "hard skill",
  "marché caché", "marché visible", "ciblage", "cibler",
  "taux", "conversion", "indicateur", "kpi", "performance",
  "bonjour", "salut", "merci", "au revoir", "rebonjour",
];

function isTopicAllowed(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (q.length < 3) return true;
  for (const topic of ALLOWED_TOPICS) {
    if (q.includes(topic)) return true;
  }
  return false;
}

export interface ConseillerResponse {
  content: string;
  source: "ai" | "local" | "no_key" | "error" | "blocked";
}

export async function askConseiller(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<ConseillerResponse> {
  // Block off-topic questions
  if (!isTopicAllowed(message)) {
    return {
      content: `Je suis votre **Conseiller Carrière PRSTO** — je réponds uniquement sur PRSTO et la recherche d'emploi cadre dirigeant.

Je ne peux pas répondre aux questions sur d'autres sujets. Posez-moi une question sur :
- L'utilisation d'PRSTO (outils, fonctionnalités, chemins)
- La recherche d'emploi (CV, entretiens, stratégie, ciblage, négociation)
- Des conseils personnalisés pour votre carrière

Que puis-je faire pour vous aujourd'hui ? 👔`,
      source: "blocked",
    };
  }

  // Try local answer first (common questions — instant)
  const localAnswer = getLocalAnswer(message);
  if (localAnswer) {
    return { content: localAnswer, source: "local" };
  }

  // No local match → call AI API
  try {
    const [profile, oppCount, jobCount, interviewCount, docCount] = await Promise.all([
      prisma.profile.findFirst({ include: { skills: { select: { name: true, level: true } } } }),
      prisma.opportunity.count(),
      prisma.job.count(),
      prisma.interview.count(),
      prisma.document.count(),
    ]);

    const sectors = profile?.sectors
      ? (() => { try { const p = JSON.parse(profile.sectors!); return Array.isArray(p) ? p.slice(0, 3).join("/") : profile.sectors; } catch { return profile.sectors; } })()
      : "";
    const functions = profile?.functions
      ? (() => { try { const p = JSON.parse(profile.functions!); return Array.isArray(p) ? p.slice(0, 3).join("/") : profile.functions; } catch { return profile.functions; } })()
      : "";
    const languages = profile?.languages
      ? (() => { try { const p = JSON.parse(profile.languages!); return Array.isArray(p) ? p.slice(0, 3).join(", ") : profile.languages; } catch { return profile.languages; } })()
      : "";
    const skills = profile?.skills?.map(s => `${s.name}`).slice(0, 8).join(", ") || "";

    const context = profile
      ? `${profile.title || ""} | ${sectors} | ${functions} | ${languages} | ${profile.yearsExp || "?"}ans`
      : "Pas de profil";

    const systemPrompt = `Tu es le conseiller carrière PRSTO. Tu aides la recherche d'emploi cadre dirigeant.

Contexte: ${context}
Stats: ${oppCount} offres, ${jobCount} scorés, ${interviewCount} entretiens, ${docCount} documents

Fonctionnalités PRSTO:
- Boardroom Dashboard (/) - tableau de bord
- AI Briefing (/analyse) - briefing IA
- Signal Feed (/opportunites) - flux offres
- Market Watch (/market-radar) - veille
- Interview Studio (/entretiens) - 24 sections, 6 pitchs
- Documents AI (/documents) - CV, lettres, emails
- Web Scraper AI - import offres
- Pipeline (/dashboard/jobs/pipeline) - kanban
- Profil Exécutif (/profil) - profil
- CV Maître (/cv-maitre) - CV source
- Proof Vault (/proof-vault) - preuves
- Conseiller Carrière (/conseiller) - ici
- Guide complet (/guide) - documentation
- Paramètres (/parametres) - config IA

Règles: réponds en français. Reste dans le cadre d'PRSTO et de la recherche d'emploi. Propose des actions concrètes ("va dans Profil > ..."). Sois un coach chaleureux. Pose des questions pour guider l'utilisateur. Structure tes réponses.`;

    const recentHistory = history.slice(-4);
    const historyBlock = recentHistory.length > 0
      ? recentHistory.map(h => `${h.role === "user" ? "Candidat" : "Coach"}: ${h.content.slice(0, 300)}`).join("\n") + "\n"
      : "";

    const result = await generateWithDeepSeek({
      systemPrompt,
      userPrompt: `${historyBlock}Candidat: ${message}`,
      temperature: 0.65,
      maxTokens: 800,
      timeout: 90000,
    });

    if (result.success && result.content) {
      return { content: result.content, source: "ai" };
    }

    if (result.errorType === "no_key") {
      return {
        content: `👋 Bienvenue sur le **Conseiller Carrière PRSTO** !

Pour débloquer mes réponses personnalisées, configurez votre clé API IA dans **Paramètres > AI Provider**.

Mes connaissances locales fonctionnent déjà pour les questions courantes (aide, définition, étapes).`,
        source: "no_key",
      };
    }

    // API failed
    return {
      content: `Je n'ai pas pu contacter le service AI (${result.errorType === "timeout" ? "trop lent" : "erreur technique"}). 

Réessayez dans quelques instants ou reformulez votre question — je peux déjà répondre à beaucoup de sujets sans appel API.`,
      source: "error",
    };
  } catch (err) {
    console.error("Conseiller error:", err);
    return {
      content: "Une erreur technique est survenue. Réessayez dans quelques instants.",
      source: "error",
    };
  }
}
