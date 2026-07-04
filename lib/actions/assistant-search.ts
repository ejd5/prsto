"use server";

import { prisma } from "@/lib/prisma";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  jobs?: AssistantJob[];
}

export interface AssistantJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  contractType: string | null;
  remote: string | null;
  scoreGlobal: number | null;
  sourceName: string | null;
  status: string;
  sourceUrl: string | null;
}

const SEARCH_URLS: Array<{ name: string; url: string }> = [
  { name: "APEC", url: "https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles={kw}" },
  { name: "Welcome to the Jungle", url: "https://www.welcometothejungle.com/fr/jobs?query={kw}" },
  { name: "Michael Page", url: "https://www.michaelpage.fr/jobs/{kw}" },
];

async function firecrawlScrape(url: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": "Bearer fc-2ede1712d78e40ff9e0feb7cf6024c84",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return data.data?.markdown || null;
  } catch {
    return null;
  }
}

function extractKeywords(text: string): string {
  const stopWords = new Set([
    "les","des","pour","dans","avec","sur","une","que","pas","est","sont","aux","ces",
    "cette","être","fait","mon","mes","son","ses","par","tout","très","plus","aussi",
    "tous","leur","leurs","nous","vous","elle","ils","entre","depuis","pendant","avant",
    "après","merci","svp","stp","bonjour","salut","peut","veux","vas","vais","vas",
    "partout","hier","aujourdhui","maintenant","urgent","max","moins",
    "jours","heures","minutes","années","mois","il","y","a","maxi",
  ]);
  const words = text.toLowerCase()
    .replace(/[^a-zéèêëàâîïôùûç\s0-9-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  return words.slice(0, 3).join(" ") || "Directeur";
}

// 🧠 DeepSeek extraction logic of markdown job blocks to JSON structure
async function extractJobsFromMarkdown(markdown: string, sourceName: string, baseUrl: string): Promise<AssistantJob[]> {
  try {
    const prompt = `Voici le code markdown d'une page de recherche d'emploi sur le site ${sourceName}.
Analyse ce texte et extrais-en la liste de toutes les offres d'emploi visibles (max 10).

Pour chaque offre, extrait rigoureusement :
- Le titre du poste (title)
- Le nom de l'entreprise (company)
- La localisation géographique (location) - ex: "Paris (75)" ou "Lyon"
- Le type de contrat si mentionné (contractType) - ex: "CDI", "Freelance"
- Le lien URL d'accès direct (sourceUrl). S'il s'agit d'une URL relative (ex: "/emploi/123"), complète-la avec le domaine de base pour la rendre absolue.

Retourne uniquement un tableau JSON valide au format suivant :
[
  {
    "title": "...",
    "company": "...",
    "location": "...",
    "contractType": "...",
    "sourceUrl": "..."
  }
]`;

    const result = await generateJsonWithDeepSeek({
      systemPrompt: "Tu es un extracteur de données d'emploi structurées. Tu réponds exclusivement en JSON valide.",
      userPrompt: prompt + `\n\nContenu markdown :\n${markdown.slice(0, 12000)}`,
      temperature: 0.1,
    });

    if (result.success && result.data && Array.isArray(result.data)) {
      return result.data.map((job: any) => ({
        id: "",
        title: job.title || "Poste sans titre",
        company: job.company || sourceName,
        location: job.location || null,
        contractType: job.contractType || "CDI",
        remote: null,
        scoreGlobal: null,
        sourceName,
        status: "nouveau",
        sourceUrl: job.sourceUrl && job.sourceUrl.startsWith("http") ? job.sourceUrl : baseUrl,
      }));
    }
  } catch (e) {
    console.error(`[Assistant] Error extracting jobs via DeepSeek for ${sourceName}:`, e);
  }
  return [];
}

async function searchWithFirecrawlAndAI(keyword: string): Promise<AssistantJob[]> {
  const allJobs: AssistantJob[] = [];
  const seen = new Set<string>();

  const targets = SEARCH_URLS.map(s => ({
    name: s.name,
    url: s.url.replace("{kw}", encodeURIComponent(keyword)),
    baseUrl: s.name === "APEC" ? "https://www.apec.fr" : s.name === "Welcome to the Jungle" ? "https://www.welcometothejungle.com" : "https://www.michaelpage.fr",
  }));

  // Fetch websites concurrently using Firecrawl scrape API
  const scrapePromises = targets.map(async (target) => {
    console.log(`[Assistant] Scraping ${target.name} url: ${target.url}`);
    const md = await firecrawlScrape(target.url);
    if (!md) {
      console.log(`[Assistant] Empty markdown returned for ${target.name}`);
      return [];
    }
    return extractJobsFromMarkdown(md, target.name, target.baseUrl);
  });

  const results = await Promise.allSettled(scrapePromises);

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.length > 0) {
      for (const job of r.value) {
        const key = `${job.title.toLowerCase()} @ ${job.company.toLowerCase()}`;
        if (!seen.has(key) && job.title.length > 5) {
          seen.add(key);
          allJobs.push(job);
        }
      }
    }
  }

  return allJobs;
}

export async function sendAssistantMessage(conversation: AssistantMessage[]): Promise<AssistantMessage> {
  try {
    const last = conversation.filter(m => m.role === "user").pop();
    if (!last) {
      return { role: "assistant", content: "Bonjour. Décrivez le poste que vous cherchez (par exemple : 'Directeur Commercial Paris'). Je lance une recherche sur le web." };
    }

    const text = last.content;
    const keyword = extractKeywords(text);
    console.log(`[Assistant] Searching for keyword: "${keyword}"`);

    let jobs = await searchWithFirecrawlAndAI(keyword);

    // Save extracted jobs into SQLite database
    if (jobs.length > 0) {
      try {
        for (const job of jobs.slice(0, 15)) {
          try {
            // Ensure we check duplicate before writing into DB
            const existing = await prisma.opportunity.findFirst({
              where: {
                title: job.title,
                company: job.company,
              }
            });

            if (!existing) {
              const opp = await prisma.opportunity.create({
                data: {
                  title: job.title,
                  company: job.company || "Non spécifié",
                  location: job.location || "",
                  country: "France",
                  sourceUrl: job.sourceUrl || "",
                  sourceName: job.sourceName || "Assistant Search",
                  status: "nouveau",
                  priority: 3,
                  notes: "Importé par l'Assistant IA PRSTO",
                  contractType: job.contractType || "CDI",
                  rawText: `Poste de ${job.title} chez ${job.company} importé via l'assistant de recherche web.`,
                }
              });
              job.id = opp.id; // bind database ID
            } else {
              job.id = existing.id;
            }
          } catch (e) {
            console.error("[Assistant] DB Save failure:", e);
          }
        }
      } catch (dbErr) {
        console.error("[Assistant] DB access error:", dbErr);
      }
    }

    // Generate nice conversational output via DeepSeek
    try {
      const prompt = jobs.slice(0, 6).map(j => `- **${j.title}** chez ${j.company} (${j.location || "France"})`).join("\n");
      const summaryResult = await generateJsonWithDeepSeek({
        systemPrompt: "Tu es PRSTO, le copilote de carrière IA premium pour cadres dirigeants. Présente les opportunités trouvées de façon chaleureuse et structurée. Ne dépasse pas 4-5 lignes d'analyse générale.",
        userPrompt: `Recherche utilisateur : "${text}"\nOffres trouvées :\n${prompt || "Aucune offre trouvée"}`,
        temperature: 0.4,
      });

      if (summaryResult.success && summaryResult.content) {
        return {
          role: "assistant",
          content: summaryResult.content,
          jobs: jobs.length > 0 ? jobs : undefined,
        };
      }
    } catch {}

    if (jobs.length === 0) {
      return { role: "assistant", content: `Je n'ai pas trouvé d'offres en ligne pour "${keyword}" pour le moment. Essayez un autre mot-clé.` };
    }

    // Fallback response builder if DeepSeek generation has connection limits
    const textResp = `🔍 J'ai trouvé **${jobs.length} opportunités** correspondantes à votre recherche en ligne. Elles ont été directement importées et ajoutées dans votre base d'offres PRSTO.`;
    return { role: "assistant", content: textResp, jobs };

  } catch (err) {
    console.error("[Assistant] FATAL:", err);
    return { role: "assistant", content: "Une erreur technique s'est produite lors de la recherche." };
  }
}
