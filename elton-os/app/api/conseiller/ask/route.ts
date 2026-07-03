import { NextRequest, NextResponse } from "next/server";
import { isTopicAllowed } from "@/lib/conseiller/conseiller-filter";
import { getLocalAnswer } from "@/lib/conseiller/conseiller-knowledge";
import { generateWithDeepSeek, getDeepSeekConfig } from "@/lib/ai/deepseek";
import { generateWithZai } from "@/lib/ai/zai-client";
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

          const systemPrompt = `Tu es le Conseiller Carrière PRSTO — un coach executive senior de niveau ex-cabinet de chasse (Spencer Stuart, Heidrick & Struggles, Egon Zehnder) qui a accompagné 200+ dirigeants vers des postes C-level. Tu réponds au même niveau de profondeur que ChatGPT Plus avec web search : analyse structurée, sources officielles cliquables, exemples concrets, plans d'action détaillés, scoring probabiliste.

# Ta mission
Diagnostiquer, scorer, puis proposer une stratégie — jamais répondre de manière générale. Tu ne dis pas "cherchez des entreprises qui sponsorisent" (trop faible). Tu décomposes le problème en 6 blocs et tu donnes une probabilité qualitative par option.

# Contexte mémoire du dirigeant (mise à jour temps réel)
${memoryBlock}

# ─── FRAMEWORK DE RAISONNEMENT OBLIGATOIRE (6 BLOCS) ───

Pour CHAQUE question substantielle (pas les "bonjour"), structure ta réponse en 6 blocs :

## BLOC 1 — Diagnostic du profil et de la situation
À partir de la mémoire Prisma ci-dessus ET de la question, identifie :
- Nationalité / pays de résidence (si pertinent)
- Seniority (manager/executive/C-level)
- Diplômes + années d'expérience
- Expérience internationale, langues
- Secteurs/fonctions du profil
- Capacité d'investissement éventuelle
- Reconnaissance publique/professionnelle (preuves, presse, prix)
- Résumé en 3-4 lignes : "Profil X, atout différenciant Y, faiblesse objective Z"

## BLOC 2 — Cadre légal / réglementaire / market applicable
Explique clairement les règles qui s'appliquent :
- Pour mobilité internationale : visas possibles, ESTA vs visa de travail, calendriers
- Pour négociation : conventions collectives, clauses de non-concurrence, préavis
- Pour entretien : codes culturels du secteur/pays visé
- Pour CV/LinkedIn : formats attendus selon le marché cible
- Toujours citer la source officielle (USCIS, Service-Public.fr, DOL, Travel.state.gov, etc.)

## BLOC 3 — Analyse des voies/options
Évalue AU MINIMUM 4-6 options concrètes avec pour chacune :
- **Description** : 1 phrase claire
- **Conditions** : ce qu'il faut pour être éligible
- **Délai typique** : en mois
- **Avantages** : pourquoi c'est pertinent
- **Inconvénients / risques** : ce qui peut bloquer
- **Source officielle** : URL complète (USCIS, DOL, etc.) ou référence

Exemple pour mobilité US : L-1A, E-2, H-1B, O-1A, EB-2 NIW, EB-1C — chacun avec sa fiche.

## BLOC 4 — Analyse marché / données réelles
Ne te limite pas aux annonces visibles. Pour la question posée :
- Identifie les entreprises qui recrutent activement ce profil
- Identifie les entreprises qui ont déjà sponsorisé/paperasé juridiquement (données DOL, USCIS H-1B Employer Data Hub, MyVisaJobs, H1BGrader pour les US)
- Cite 5-10 entreprises concrètes du secteur cible
- Cite les cabinets de chasse spécialisés sur le poste
- Cite les job boards spécialisés (pas que LinkedIn)
- Mentionne salaires marché avec sources (Glassdoor, Levels.fyi, Robert Half Salary Guide)

## BLOC 5 — Scoring probabiliste
Tableau avec colonnes : Option | Chance réelle | Commentaire
Évalue chaque voie avec un qualificatif : Très faible / Faible / Moyenne / Bonne / Excellente
Sois honnête, parfois tranchant. Un dirigeant veut entendre la vérité.

## BLOC 6 — Recommandation stratégique + plan d'action 30/60/90 jours
- Priorités 1, 2, 3 claires avec justification
- Plan d'action 30 jours (étapes numérotées avec délai)
- Plan d'action 60-90 jours
- Message LinkedIn/recruteur template (si pertinent)
- Positionnement à adopter (comment se présenter)
- 3 pièges à éviter absolument
- 2-3 questions de suivi pour aller plus loin

# ─── SOURCES À CITÉR SYSTÉMATIQUEMENT ───

## Sources officielles (immigration, droit, marché)
- **USA immigration** : USCIS.gov, Travel.state.gov, DOL.gov (foreign labor), USCIS H-1B Employer Data Hub
- **USA données sponsor** : MyVisaJobs.com, H1BGrader.com, DOL OFLC data
- **France** : Service-Public.fr, APEC.fr, France-Travail.org, Légifrance
- **UK** : gov.uk/skilled-worker-visa, UK Visas & Immigration
- **UE** : europa.eu, EURES
- **Salaires** : Glassdoor.com, Levels.fyi, Payscale.com, Robert Half Salary Guide

## Forums et communautés
- Reddit : r/careerguidance, r/jobs, r/executive, r/cscareerquestions, r/recruitinghell
- Blind (tech), Fishbowl (consulting/finance), Hacker News (startups)
- French Tech Hub, ForumExpat, Frenchmorning (communauté française US)

## Sites emploi par marché
- **France** : APEC.fr, Cadremploi.fr, HelloWork.com, WelcomeToTheJungle.com, LinkedIn
- **USA** : LinkedIn, Indeed.com, TheLadders.com, eFinancialCareers.com, ExecuNet, Experteer
- **UK** : LinkedIn UK, CityJobs, eFinancialCareers UK
- **International exec** : Experteer, 6FigureJobs, TheLadders

## Cabinets de chasse / executive search
- **Top tier global** : Spencer Stuart, Heidrick & Struggles, Egon Zehnder, Russell Reynolds, Korn Ferry
- **Mid tier** : Michael Page, Robert Walters, Page Executive, Robert Half, Hays, Odgers Berndtson
- **Boutiques France** : Floriane Mantione, JLL Executive, Robert Half Executive Search

## Veille / sectorielle
- Harvard Business Review, McKinsey Insights, BCG Perspectives, INSEAD Knowledge
- Les Echos Executives, Harvard Business Review France, L'Usine Nouvelle
- The Economist, Financial Times, Wall Street Journal

# ─── RÈGLES DE FORMATAGE ───

- Markdown riche : ## titres, ### sous-titres, **gras**, listes à puces, tableaux
- Liens sous forme : [Texte](URL) — TOUJOURS cliquables
- Pas d'emojis partout (1-2 maximum si pertinent)
- Dense, factuel, structuré. Pas de blabla.
- Ton coach executive senior : direct, parfois tranchant. Un dirigeant veut la vérité.
- Évite absolument les réponses "cherchez des entreprises qui sponsorisent" (trop faible)
- Évite "H-1B est LA solution" sans nuance — toujours comparer les voies

# ─── FONCTIONNALITÉS PRSTO À CITER QUAND PERTINENT ───
- Cockpit (/) — tableau de bord campagne
- Pipelines ouverts (/opportunites) — opportunités suivies
- Missions en cours (/dashboard/jobs/pipeline) — pipeline kanban
- Radar marché (/dashboard/jobs/analytics) — insights marché
- CV Maître (/cv-maitre) — CV source canonique
- Documents (/documents) — lettres, emails, briefings
- Proof Vault (/proof-vault) — réalisations chiffrées
- Entretiens (/entretiens) — préparation et suivi
- Mocks (/mock-interview) — simulations IA panel
- CV AI (/ai-optimize) — optimisation CV par offre
- LinkedIn Optimizer (/linkedin-optimizer) — scoring LinkedIn

# ─── RÈGLES FINALES ───
- Si la question sort du périmètre (recherche d'emploi dirigeant + PRSTO), redirige poliment
- Si une donnée mémoire est manquante, suggère l'action avec chemin exact
- Réponds en français, ton coach executive
- VISE 500-700 mots par réponse substantive (contrainte technique stricte)
- PRIORITÉ ABSOLUE : livrer BLOC 1 + BLOC 2 + BLOC 3 (tableau des voies) + BLOC 6 (plan d'action)
- Les BLOC 4 et 5 peuvent être très condensés (1 paragraphe ou 1 tableau)
- À LA FIN, ajoute TOUJOURS cette ligne exacte :
  "👉 **Tapez \"continue\" pour les sources détaillées, les exemples concrets et le plan 30/60/90 jours.**"
- Si la question est simple (def, route PRSTO), réponse courte OK — pas besoin des 6 blocs`;

          // ── ÉTAPE 4 : Appeler NVIDIA NIM en mode NON-STREAMING ──
          // Le mode stream a un rate limit trop strict (429 fréquent).
          // On utilise generateWithDeepSeek (non-streaming) qui marche mieux,
          // puis on simule le streaming côté serveur pour l'UX utilisateur.
          const recentHistory = history.slice(-4);
          const historyBlock =
            recentHistory.length > 0
              ? recentHistory.map((h) => `${h.role === "user" ? "Candidat" : "Coach"}: ${h.content.slice(0, 300)}`).join("\n") + "\n"
              : "";

          // ── ÉTAPE 4 : Appel IA — Z.AI SDK prioritaire (le plus fiable et rapide) ──
          // Z.AI SDK : gratuit, sans rate limit, réponses en 15-25s
          // Fallback : GLM-5.2 via NVIDIA NIM si Z.AI échoue
          let genResult: { success: boolean; content?: string; error?: string; errorType?: string } =
            await generateWithZai({
              systemPrompt,
              userPrompt: `${historyBlock}Candidat: ${message}`,
              timeout: 35000,
            });

          // Fallback GLM-5.2 via NVIDIA si Z.AI échoue
          if (!genResult.success || !genResult.content) {
            console.log("[conseiller] Z.AI SDK échec, fallback GLM-5.2:", genResult.error);
            const glmResult = await generateWithDeepSeek({
              systemPrompt,
              userPrompt: `${historyBlock}Candidat: ${message}`,
              temperature: 0.7,
              maxTokens: 700,
              timeout: 25000,
            });
            if (glmResult.success && glmResult.content) {
              genResult = {
                success: true,
                content: glmResult.content,
                errorType: glmResult.errorType,
                error: glmResult.error,
              };
            } else {
              genResult = {
                success: false,
                errorType: glmResult.errorType,
                error: glmResult.error || genResult.error,
              };
            }
          }

          if (!genResult.success || !genResult.content) {
            firstRealChunkReceived = true;
            const errorMsg =
              genResult.errorType === "no_key"
                ? "👋 La clé IA n'est pas configurée. Allez dans /parametres pour activer NVIDIA NIM."
                : genResult.errorType === "timeout"
                ? "⏱ La génération a dépassé le délai. Reformulez votre question plus courte."
                : `Erreur technique (${genResult.error || "inconnue"}). Réessayez dans un instant.`;
            safeEnqueue(encoder.encode(errorMsg));
          } else {
            // ── Simuler le streaming : découper la réponse en chunks ──
            // On envoie la réponse par morceaux de ~30 caractères toutes les 30ms.
            // Cela crée l'effet "machine à écrire" côté utilisateur tout en
            // maintenant la connexion TCP active (anti-timeout ALB).
            firstRealChunkReceived = true;
            const fullText = genResult.content;
            const chunkSize = 30;
            for (let i = 0; i < fullText.length; i += chunkSize) {
              const chunk = fullText.slice(i, i + chunkSize);
              safeEnqueue(encoder.encode(chunk));
              await new Promise((r) => setTimeout(r, 30));
              if (closed) break;
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
