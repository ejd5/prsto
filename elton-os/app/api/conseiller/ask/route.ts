import { NextRequest, NextResponse } from "next/server";
import { isTopicAllowed } from "@/lib/conseiller/conseiller-filter";
import { getLocalAnswer } from "@/lib/conseiller/conseiller-knowledge";
import { streamWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/conseiller/ask
 *
 * Body: { message: string, history?: Array<{role, content}>, stream?: boolean }
 *
 * Comportement :
 *  1. Si la question matche la base locale → réponse JSON immédiate (source: "local")
 *  2. Si la question est hors périmètre → réponse JSON (source: "blocked")
 *  3. Sinon → on stream la réponse IA au fur et à mesure (évite les timeouts ALB 90s)
 *
 * Le streaming est primordial pour l'URL preview publique car l'ALB coupe à 90s.
 * Avec stream=true, les chunks arrivent toutes les ~50ms, l'ALB ne coupe jamais.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message: string = (body?.message ?? "").toString().trim();
    const history: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(body?.history)
      ? body.history
          .filter(
            (h: unknown): h is { role: "user" | "assistant"; content: string } =>
              typeof h === "object" &&
              h !== null &&
              (h as { role: unknown }).role !== undefined &&
              typeof (h as { content: unknown }).content === "string"
          )
          .slice(-10)
      : [];

    if (!message) {
      return NextResponse.json(
        { error: "Message vide.", content: "", source: "error" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message trop long (max 2000 caractères).", content: "", source: "error" },
        { status: 413 }
      );
    }

    // ── 1. Hors périmètre ─────────────────────────────────────────
    if (!isTopicAllowed(message)) {
      return NextResponse.json({
        content: `Je suis votre **Conseiller Carrière PRSTO** — je réponds uniquement sur PRSTO et la recherche d'emploi cadre dirigeant.

Je ne peux pas répondre aux questions sur d'autres sujets. Posez-moi une question sur :
- L'utilisation d'PRSTO (outils, fonctionnalités, chemins)
- La recherche d'emploi (CV, entretiens, stratégie, ciblage, négociation)
- Des conseils personnalisés pour votre carrière

Que puis-je faire pour vous aujourd'hui ? 👔`,
        source: "blocked",
      });
    }

    // ── 2. Réponse locale (instantanée) ───────────────────────────
    const localAnswer = getLocalAnswer(message);
    if (localAnswer) {
      return NextResponse.json({
        content: localAnswer,
        source: "local",
      });
    }

    // ── 3. Réponse IA en streaming ────────────────────────────────
    // On démarre le ReadableStream IMMÉDIATEMENT pour que le heartbeat
    // commence à battre avant même qu'on charge Prisma ou appelle NVIDIA.
    // C'est crucial pour l'ALB public qui coupe les connexions inactives.

    const encoder = new TextEncoder();

    const finalStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
        let closed = false;
        let firstRealChunkReceived = false;

        const safeEnqueue = (chunk: Uint8Array) => {
          if (closed) return;
          try {
            controller.enqueue(chunk);
          } catch {
            // déjà fermé
          }
        };

        // Démarrer le heartbeat IMMÉDIATEMENT (avant Prisma, avant NVIDIA)
        // Envoie un espace toutes les 2s pour maintenir la connexion TCP.
        heartbeatInterval = setInterval(() => {
          if (closed) return;
          if (!firstRealChunkReceived) {
            safeEnqueue(encoder.encode(" "));
          }
        }, 2000);

        try {
          // ── ÉTAPE 1 : Charger la mémoire Prisma ──
          const [profile, oppCount, jobCount, interviewCount, docCount, recentOpportunities, upcomingInterviews, recentProofs, cvMaster] =
            await Promise.all([
              prisma.profile.findFirst({ include: { skills: { select: { name: true, level: true } } } }),
              prisma.opportunity.count(),
              prisma.job.count(),
              prisma.interview.count(),
              prisma.document.count(),
              prisma.opportunity.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                where: { status: { not: "rejected" } },
                select: { id: true, title: true, company: true, status: true, updatedAt: true },
              }),
              prisma.interview.findMany({
                take: 3,
                where: { date: { gte: new Date() } },
                orderBy: { date: "asc" },
                select: { id: true, type: true, date: true, notes: true },
              }),
              prisma.proofEntry.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: { id: true, title: true, value: true, context: true, category: true },
              }),
              prisma.cVMaster.findFirst({
                select: { id: true, fileName: true, parsedJson: true, status: true, uploadedAt: true },
              }),
            ]);

          // ── ÉTAPE 2 : Vérifier la config IA ──
          const config = await getDeepSeekConfig();
          if (!config) {
            firstRealChunkReceived = true;
            safeEnqueue(
              encoder.encode(
                "👋 Bienvenue sur le **Conseiller Carrière PRSTO** !\n\nPour débloquer mes réponses personnalisées, configurez votre clé API IA dans **Paramètres > AI Provider**.\n\nMes connaissances locales fonctionnent déjà pour les questions courantes (aide, définition, étapes)."
              )
            );
            return;
          }

          // ── ÉTAPE 3 : Construire le bloc mémoire ──
          const sectors = profile?.sectors
            ? (() => {
                try {
                  const p = JSON.parse(profile.sectors!);
                  return Array.isArray(p) ? p.slice(0, 3).join("/") : profile.sectors;
                } catch {
                  return profile.sectors;
                }
              })()
            : "";
          const functions = profile?.functions
            ? (() => {
                try {
                  const p = JSON.parse(profile.functions!);
                  return Array.isArray(p) ? p.slice(0, 3).join("/") : profile.functions;
                } catch {
                  return profile.functions;
                }
              })()
            : "";
          const languages = profile?.languages
            ? (() => {
                try {
                  const p = JSON.parse(profile.languages!);
                  return Array.isArray(p) ? p.slice(0, 3).join(", ") : profile.languages;
                } catch {
                  return profile.languages;
                }
              })()
            : "";
          const skills = profile?.skills?.map((s) => s.name).slice(0, 8).join(", ") || "";

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
          } else {
            memLines.push(`\n## CV Maître: ⚠ non créé — suggérer à l'utilisateur d'aller dans /cv-maitre`);
          }

          const memoryBlock = memLines.join("\n");

          const systemPrompt = `Tu es le Conseiller Carrière PRSTO — le second brain d'un cadre dirigeant en recherche active. Tu réponds au niveau d'un coach executive senior (ex-cabinet de chasse type Spencer Stuart / Egon Zehnder) qui a accompagné 200+ dirigeants.

# Ta mission
Aider ce dirigeant à piloter sa campagne comme un projet d'entreprise. Tu connais sa situation, son profil, ses candidatures en cours, ses entretiens à venir, ses preuves de réalisations, son CV Maître. Tu utilises cette mémoire pour donner des conseils ULTRA contextualisés, jamais génériques.

# Contexte mémoire du dirigeant (mise à jour temps réel)
${memoryBlock}

# EXIGENCE DE QUALITÉ — niveau ChatGPT+, pas assistant basique
Tes réponses doivent être COMPLÈTES, APPROFONDIES et ACTIONNABLES. Pas de réponse en 200 mots. Vise 800-1500 mots structurés.

Pour CHAQUE réponse, inclus systématiquement :
1. **Diagnostic contextualisé** — utilise EXPLICITEMENT les données mémoire (titre, expérience, preuves, opportunités en cours). Le dirigeant doit sentir que tu connais son dossier.
2. **Analyse multi-dimensionnelle** — décompose le sujet en 3-5 dimensions claires (ex: financier, juridique, stratégique, opérationnel, humain).
3. **Exemples concrets** — au moins 2-3 exemples réels ou cas pratiques (entreprises, scénarios, chiffres réels du marché).
4. **Sources et liens** — cite des forums, sites, livres, podcasts, études :
   - Forums : Reddit r/careerguidance, r/jobs, r/executive, Blind (tech), Fishbowl (consulting/finance)
   - Sites emploi : LinkedIn, APEC, Cadremploi, Welcome to the Jungle, Experteer, The Ladders, eFinancialCareers, Indeed
   - Veille : Harvard Business Review, McKinsey Insights, INSEAD Knowledge, Les Echos Executives
   - Outils : Glassdoor (salaires), Levels.fyi (tech), Payscale, Robert Half Salary Guide
   - Cabinets : Spencer Stuart, Heidrick & Struggles, Egon Zehnder, Russell Reynolds, Korn Ferry, Michael Page, Robert Walters, Page Executive
   - Livres/podcasts pertinents selon le sujet
5. **Plan d'action concret** — étapes numérotées, avec délais estimés (Jour 1, Semaine 1, Mois 1, etc.)
6. **Pièges à éviter** — au moins 3 erreurs courantes à ne pas commettre
7. **Prochaines étapes PRSTO** — quels outils utiliser (/proof-vault, /cv-maitre, /mock-interview, etc.) avec le chemin exact
8. **Questions de suivi** — 2-3 questions à poser pour aller plus loin

# Format
- Markdown riche : ## titres, ### sous-titres, **gras**, listes à puces, tableaux quand pertinent
- Pas de emojis partout (1 ou 2 maximum par réponse, seulement si pertinent)
- Pas de blabla. Dense, factuel, structuré.
- Sois direct, parfois tranchant. Un dirigeant veut entendre la vérité, pas des consolations.

# Fonctionnalités PRSTO disponibles (cite-les quand pertinent)
- Cockpit (/) — tableau de bord de campagne
- Pipelines ouverts (/opportunites) — opportunités suivies
- Missions en cours (/dashboard/jobs/pipeline) — pipeline kanban
- Radar marché (/dashboard/jobs/analytics) — insights marché
- CV Maître (/cv-maitre) — CV source canonique
- Documents (/documents) — lettres, emails, briefings
- Proof Vault (/proof-vault) — réalisations chiffrées
- Entretiens (/entretiens) — préparation et suivi
- Mocks (/mock-interview) — simulations IA avec panel
- CV AI (/ai-optimize) — optimisation CV par offre
- LinkedIn Optimizer (/linkedin-optimizer) — scoring LinkedIn

# Règles finales
- Si la question sort du périmètre (recherche d'emploi dirigeant + PRSTO), redirige poliment.
- Si une donnée mémoire est manquante, suggère l'action avec chemin exact.
- Réponds en français, ton coach executive.`;

          // ── ÉTAPE 4 : Appeler NVIDIA NIM en streaming ──
          // maxTokens réduit à 600 pour rester sous 60s (limite ALB public).
          // Si l'utilisateur veut plus de détails, il demande "continue" ou une sous-question.
          const recentHistory = history.slice(-4);
          const historyBlock =
            recentHistory.length > 0
              ? recentHistory.map((h) => `${h.role === "user" ? "Candidat" : "Coach"}: ${h.content.slice(0, 300)}`).join("\n") + "\n"
              : "";

          const result = await streamWithDeepSeek({
            systemPrompt,
            userPrompt: `${historyBlock}Candidat: ${message}`,
            temperature: 0.7,
            maxTokens: 800, // Compromis : ~700 mots riches en ~35s (sous 50s ALB public)
            timeout: 90000,
          });

          if (!result.stream) {
            firstRealChunkReceived = true;
            const errorMsg =
              result.errorType === "no_key"
                ? "👋 La clé IA n'est pas configurée. Allez dans /parametres pour activer NVIDIA NIM."
                : result.errorType === "timeout"
                ? "⏱ La génération a dépassé le délai. Reformulez votre question plus courte."
                : `Erreur technique (${result.error || "inconnue"}). Réessayez dans un instant.`;
            safeEnqueue(encoder.encode(errorMsg));
          } else {
            const reader = result.stream.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value && value.length > 0) {
                  firstRealChunkReceived = true;
                  safeEnqueue(value);
                }
              }
            } catch (err) {
              safeEnqueue(
                encoder.encode("\n\n[Erreur pendant la génération. Réessayez.]")
              );
            }
          }
        } catch (err) {
          console.error("[/api/conseiller/ask] Stream error:", err);
          safeEnqueue(
            encoder.encode(
              `\n\n[Erreur: ${err instanceof Error ? err.message : "inconnue"}. Réessayez.]`
            )
          );
        } finally {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          closed = true;
          try {
            controller.close();
          } catch {
            // déjà fermé
          }
        }
      },
      cancel() {
        // Client annulé
      },
    });

    return new Response(finalStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Conseiller-Source": "ai",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (err) {
    console.error("[/api/conseiller/ask] Error:", err);
    return NextResponse.json(
      {
        error: "Erreur interne du Conseiller.",
        content: "Désolé, une erreur technique vient de se produire. Pouvez-vous reformuler votre question ?",
        source: "error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Conseiller PRSTO",
    description: "Second brain IA pour dirigeants. Réponses locales (instantanées) + IA streaming (NVIDIA NIM).",
    endpoint: "POST /api/conseiller/ask",
    usage: {
      message: "string (requis, max 2000 chars)",
      history: "Array<{role, content}> (optionnel, max 10)",
    },
    sources: ["local (instant)", "ai (streaming)", "blocked", "no_key", "error"],
  });
}
