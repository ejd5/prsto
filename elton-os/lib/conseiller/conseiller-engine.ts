"use server";

import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";
import { getLocalAnswer } from "./conseiller-knowledge";
import { isTopicAllowed } from "./conseiller-filter";

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
    // ── Récupération du contexte mémoire (second brain) ──
    // Le Conseiller doit connaître le profil, les candidatures en cours,
    // les entretiens à venir, les preuves récentes et le CV maître.
    const [
      profile,
      oppCount,
      jobCount,
      interviewCount,
      docCount,
      recentOpportunities,
      upcomingInterviews,
      recentProofs,
      cvMaster,
    ] = await Promise.all([
      prisma.profile.findFirst({ include: { skills: { select: { name: true, level: true } } } }),
      prisma.opportunity.count(),
      prisma.job.count(),
      prisma.interview.count(),
      prisma.document.count(),
      // Les 5 dernières opportunités actives (pipeline en cours)
      prisma.opportunity.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        where: { status: { not: "rejected" } },
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          updatedAt: true,
        },
      }),
      // Les 3 prochains entretiens à venir
      prisma.interview.findMany({
        take: 3,
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        select: {
          id: true,
          type: true,
          date: true,
          notes: true,
        },
      }),
      // Les 5 dernières preuves du Proof Vault (réalisations chiffrées)
      prisma.proofEntry.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          value: true,
          context: true,
          category: true,
        },
      }),
      // Le CV Maître (s'il existe)
      prisma.cVMaster.findFirst({
        select: {
          id: true,
          fileName: true,
          parsedJson: true,
          status: true,
          uploadedAt: true,
        },
      }),
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

    // ── Construction du bloc mémoire ──
    // Ce bloc est injecté dans le system prompt pour donner au Conseiller
    // une connaissance fine de la situation actuelle du dirigeant.
    const memLines: string[] = [];
    memLines.push(`## Profil dirigeant`);
    memLines.push(`- Titre: ${profile?.title || "non renseigné"}`);
    memLines.push(`- Secteurs: ${sectors || "non renseigné"}`);
    memLines.push(`- Fonctions: ${functions || "non renseigné"}`);
    memLines.push(`- Langues: ${languages || "non renseigné"}`);
    memLines.push(`- Années d'expérience: ${profile?.yearsExp || "?"}`);
    if (skills) memLines.push(`- Compétences clés: ${skills}`);

    memLines.push(`\n## État de la campagne`);
    memLines.push(`- ${oppCount} opportunités suivies au total`);
    memLines.push(`- ${jobCount} offres scorées`);
    memLines.push(`- ${interviewCount} entretiens planifiés`);
    memLines.push(`- ${docCount} documents en bibliothèque`);

    if (recentOpportunities.length > 0) {
      memLines.push(`\n## 5 dernières opportunités actives`);
      recentOpportunities.forEach((o, i) => {
        const updated = new Date(o.updatedAt).toLocaleDateString("fr-FR");
        memLines.push(`${i + 1}. **${o.title}** @ ${o.company || "?"} — statut: ${o.status} (maj ${updated})`);
      });
    }

    if (upcomingInterviews.length > 0) {
      memLines.push(`\n## 3 prochains entretiens à venir`);
      upcomingInterviews.forEach((it, i) => {
        const when = new Date(it.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
        memLines.push(`${i + 1}. **${it.type}** — ${when}${it.notes ? ` | notes: ${it.notes.slice(0, 80)}` : ""}`);
      });
    }

    if (recentProofs.length > 0) {
      memLines.push(`\n## 5 preuves récentes (Proof Vault) — à exploiter dans CV et entretien`);
      recentProofs.forEach((p, i) => {
        memLines.push(`${i + 1}. **${p.title}** [${p.category}]${p.value ? ` → ${p.value}` : ""}`);
      });
    }

    if (cvMaster) {
      memLines.push(`\n## CV Maître`);
      memLines.push(`- Fichier: ${cvMaster.fileName || "non renseigné"}`);
      memLines.push(`- Statut: ${cvMaster.status || "?"}`);
      const cvUpdated = new Date(cvMaster.uploadedAt).toLocaleDateString("fr-FR");
      memLines.push(`- Uploadé le: ${cvUpdated}`);
    } else {
      memLines.push(`\n## CV Maître: ⚠ non créé — suggérer à l'utilisateur d'aller dans /cv-maitre`);
    }

    const memoryBlock = memLines.join("\n");

    const systemPrompt = `Tu es le Conseiller Carrière PRSTO — le second brain d'un cadre dirigeant en recherche active.

# Ta mission
Tu aides ce dirigeant à piloter sa campagne de recherche d'emploi comme un projet d'entreprise. Tu connais sa situation, son profil, ses candidatures en cours, ses entretiens à venir, ses preuves de réalisations, son CV Maître. Tu utilises cette mémoire pour donner des conseils contextualisés, pas génériques.

# Contexte mémoire du dirigeant (mise à jour temps réel)
${memoryBlock}

# Fonctionnalités PRSTO disponibles (cite-les quand pertinent)
- Cockpit (/) — tableau de bord de campagne
- Pipelines ouverts (/opportunites) — opportunités suivies
- Missions en cours (/dashboard/jobs/pipeline) — pipeline kanban candidatures
- Radar marché (/dashboard/jobs/analytics) — insights marché
- Indicateurs (/performance) — KPIs campagne
- CV Maître (/cv-maitre) — CV source canonique
- Documents (/documents) — lettres, emails, briefings
- Proof Vault (/proof-vault) — réalisations chiffrées
- Entretiens (/entretiens) — préparation et suivi
- Mocks (/mock-interview) — simulations IA avec panel
- Recherche IA (/assistant-recherche) — assistant intelligent
- CV AI (/ai-optimize) — optimisation CV par offre
- LinkedIn Optimizer (/linkedin-optimizer) — scoring et amélioration LinkedIn
- Profil (/profil) — profil exécutif
- Guide (/guide) — documentation complète
- Paramètres (/parametres) — config IA et préférences

# Règles de comportement
1. Réponds en français, ton coach executive, chaleureux mais direct.
2. Utilise EXPLICITEMENT les données mémoire ("Je vois que vous avez ${recentOpportunities.length} opportunités en cours, dont ${recentOpportunities[0]?.title || "..."} — concentratez-vous sur...").
3. Si une donnée est manquante, suggère l'action ("Allez dans /cv-maitre pour créer votre CV Maître, ce me permettra de mieux vous aider").
4. Propose des actions concrètes avec le chemin exact ("Allez dans /proof-vault et ajoutez votre réalisation sur...").
5. Structure tes réponses : titres, listes à puces, gras pour les actions clés.
6. Pose des questions pour guider l'utilisateur si sa demande est vague.
7. Rappelle les preuves disponibles quand pertinent (preuve X peut servir pour cette offre Y).
8. Si la question sort du périmètre (recherche d'emploi dirigeant + PRSTO), redirige poliment.
9. Sois bref mais complet. Pas de blabla. Pas de emojis partout. Maximum 300 mots par réponse sauf si demande explicite de détail.`;

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
