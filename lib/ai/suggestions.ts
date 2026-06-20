"use server";

import { prisma } from "@/lib/prisma";
import { generateJsonWithDeepSeek } from "@/lib/ai/deepseek";

export interface SuggestionItem {
  name: string;
  category?: string;
  level?: string;
  confidence: number;
  reason: string;
  /** Optional: used for proof vault values */
  value?: string;
}

export interface SuggestionResult {
  suggestions: SuggestionItem[];
  source: "ai" | "local" | "no_key";
  error?: string;
}

export type SuggestionTarget = "skills" | "languages" | "education" | "certifications" | "proofs";

interface ProfileContext {
  profile: {
    fullName: string | null; title: string | null; summary: string | null; sectors: string | null; functions: string | null; languages: string | null; yearsExp: number | null; education: string | null; certifications: string | null;
  } | null;
  experiences: { title: string; company: string; description: string | null; sector: string | null; achievements: string | null; tools: string | null; startDate: string; endDate: string | null }[];
  cvMaster: { originalText: string } | null;
  proofEntries: { title: string; value: string; category: string }[];
}

interface EducationItem { degree?: string; school?: string; year?: string; }

async function getProfileContext(profileId: string): Promise<ProfileContext> {
  const [profile, experiences, cvMaster, proofEntries] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: profileId },
      select: { fullName: true, title: true, summary: true, sectors: true, functions: true, languages: true, yearsExp: true, education: true, certifications: true },
    }),
    prisma.experience.findMany({
      where: { profileId },
      select: { title: true, company: true, description: true, sector: true, achievements: true, tools: true, startDate: true, endDate: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.cVMaster.findUnique({
      where: { profileId },
      select: { originalText: true },
    }),
    prisma.proofEntry.findMany({
      where: { profileId },
      select: { title: true, value: true, category: true },
    }),
  ]);

  return { profile, experiences, cvMaster, proofEntries };
}

function buildContextString(context: ProfileContext): string {
  const parts: string[] = [];

  if (context.profile) {
    parts.push(`Profil : ${context.profile.fullName || ""} — ${context.profile.title || ""}`);
    if (context.profile.summary) parts.push(`Résumé : ${context.profile.summary.slice(0, 300)}`);
    if (context.profile.sectors) parts.push(`Secteurs : ${context.profile.sectors}`);
    if (context.profile.functions) parts.push(`Fonctions : ${context.profile.functions}`);
    parts.push(`Expérience : ${context.profile.yearsExp || ""} ans`);
  }

  if (context.experiences.length > 0) {
    parts.push("\nExpériences :");
    for (const exp of context.experiences.slice(0, 5)) {
      const achievements = exp.achievements ? exp.achievements.slice(0, 200) : "";
      const tools = exp.tools ? exp.tools.slice(0, 150) : "";
      parts.push(`- ${exp.title} chez ${exp.company}${exp.sector ? ` (${exp.sector})` : ""}`);
      if (achievements) parts.push(`  Réalisations : ${achievements}`);
      if (tools) parts.push(`  Outils : ${tools}`);
    }
  }

  if (context.cvMaster?.originalText) {
    parts.push(`\nCV Maître (extrait) : ${context.cvMaster.originalText.slice(0, 2000)}`);
  }

  if (context.proofEntries.length > 0) {
    parts.push("\nProof Vault :");
    for (const p of context.proofEntries.slice(0, 5)) {
      parts.push(`- ${p.category} : ${p.title} = ${p.value}`);
    }
  }

  return parts.join("\n");
}

function getLocalSkillsFallback(context: string): SuggestionItem[] {
  const suggestions: SuggestionItem[] = [];
  const text = context.toLowerCase();

  const skillPatterns: [string, string, string][] = [
    ["Management", "management", "confirmé"],
    ["Négociation", "business", "expert"],
    ["Stratégie commerciale", "business", "confirmé"],
    ["Business Development", "business", "confirmé"],
    ["Pilotage P&L", "business", "expert"],
    ["Revenue Growth Management", "business", "confirmé"],
    ["Trade Marketing", "business", "confirmé"],
    ["Key Account Management", "business", "expert"],
    ["Direction commerciale", "management", "expert"],
    ["Management d'équipe", "management", "confirmé"],
    ["Conduite du changement", "management", "confirmé"],
    ["Coaching & formation", "management", "confirmé"],
    ["CRM", "outil", "confirmé"],
    ["Salesforce", "outil", "confirmé"],
    ["Excel avancé", "outil", "confirmé"],
    ["Power BI", "outil", "confirmé"],
    ["Négociation grands comptes", "business", "expert"],
    ["Relation centrale GMS", "business", "expert"],
    ["Marketing digital", "business", "confirmé"],
    ["E-commerce", "business", "confirmé"],
    ["Gestion de budget", "business", "confirmé"],
    ["Analyse de données", "technique", "confirmé"],
    ["Reporting", "outil", "confirmé"],
    ["Gestion de projet", "management", "confirmé"],
    ["Relation client", "business", "confirmé"],
  ];

  for (const [skill, category, level] of skillPatterns) {
    const keywords = skill.toLowerCase().split(" ");
    const matchCount = keywords.filter(k => k.length > 3 && text.includes(k)).length;
    if (matchCount >= Math.max(1, Math.floor(keywords.length / 2))) {
      suggestions.push({
        name: skill,
        category,
        level,
        confidence: 60 + Math.round((matchCount / keywords.length) * 30),
        reason: `Détecté depuis votre parcours${text.includes(skill.toLowerCase().slice(0, 5)) ? " (mentionné dans vos données)" : ""}`,
      });
    }
  }

  return suggestions.slice(0, 15);
}

function getLocalLanguagesFallback(context: string): SuggestionItem[] {
  const text = (context as string).toLowerCase();
  const suggestions: SuggestionItem[] = [];

  const langPatterns: [string, string][] = [
    ["Français", "natif"],
    ["Anglais", "courant"],
    ["Portugais", "courant"],
    ["Espagnol", "courant"],
    ["Allemand", "intermédiaire"],
    ["Italien", "intermédiaire"],
    ["Néerlandais", "intermédiaire"],
    ["Chinois", "débutant"],
  ];

  for (const [lang, level] of langPatterns) {
    if (text.includes(lang.toLowerCase().slice(0, 4))) {
      suggestions.push({
        name: `${lang} (${level})`,
        category: "langue",
        level,
        confidence: 70,
        reason: "Détecté dans votre CV",
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      name: "Français (natif)",
      category: "langue",
      level: "natif",
      confidence: 85,
      reason: "Recommencé pour un poste en France",
    });
    suggestions.push({
      name: "Anglais (courant)",
      category: "langue",
      level: "courant",
      confidence: 80,
      reason: "Requis pour la plupart des postes exécutifs",
    });
  }

  return suggestions;
}

export async function getSuggestions(
  profileId: string,
  target: SuggestionTarget
): Promise<SuggestionResult> {
  const context = await getProfileContext(profileId);
  if (!context.profile) {
    return { suggestions: [], source: "local", error: "Profil introuvable" };
  }

  const contextStr = buildContextString({ profile: context.profile, experiences: context.experiences, cvMaster: context.cvMaster, proofEntries: context.proofEntries });

  // Try DeepSeek first
  const config = await prisma.setting.findFirst();
  const hasApiKey = !!(config?.apiKey && config.apiKey.trim().length > 0 && config.aiProvider && config.aiProvider !== "none");

  if (hasApiKey) {
    const systemPrompts: Record<SuggestionTarget, string> = {
      skills: `Tu es un assistant RH expert en recrutement exécutif. À partir du contexte du candidat (profil, expériences, CV, réalisations), suggère les compétences les plus pertinentes à ajouter à son profil.

Règles :
- Suggère UNIQUEMENT des compétences pertinentes pour un cadre dirigeant.
- Inclus un mix : management, business, technique, outil, langue.
- Chaque compétence doit avoir un niveau : débutant, intermédiaire, confirmé, expert.
- La confidence reflète à quel point tu es sûr (0-100).
- Limite à 12 suggestions maximum.
- Réponds UNIQUEMENT en JSON.`,
      languages: `Tu es un assistant RH. À partir du CV et du profil, détecte et suggère les langues que le candidat maîtrise ou devrait mentionner.

Règles :
- Détecte les langues depuis le profil/CV.
- Si aucune langue détectée, suggère les langues standard pour un cadre exécutif en France.
- Niveau : natif, courant, intermédiaire, débutant.
- Limite à 5 suggestions maximum.
- Réponds UNIQUEMENT en JSON.`,
      education: `Tu es un assistant RH. À partir du CV et du profil, suggère les formations à ajouter au profil.

Règles :
- Extrais les diplômes, écoles, universités mentionnés dans le CV.
- Si aucun diplôme trouvé, suggère des formations typiques pour un cadre dirigeant.
- Format : "Diplôme — Établissement (année)".
- Limite à 5 suggestions maximum.
- Réponds UNIQUEMENT en JSON.`,
      certifications: `Tu es un assistant RH. À partir du CV et du profil, suggère les certifications à ajouter.

Règles :
- Détecte les certifications mentionnées (PMP, Lean Six Sigma, TOEIC, etc.).
- Si aucune trouvée, suggère des certifications pertinentes pour un cadre dirigeant.
- Limite à 5 suggestions maximum.
- Réponds UNIQUEMENT en JSON.`,
      proofs: `Tu es un assistant RH. À partir du CV, des expériences et du Proof Vault existant, extrais les réalisations chiffrées et faits vérifiables qui pourraient être ajoutés comme preuves.

Règles :
- Extrais UNIQUEMENT des faits présents dans les données du candidat.
- Chaque preuve doit avoir une catégorie (CA, croissance, équipe, budget, négociation, etc.).
- La "value" doit être le chiffre ou le fait concret.
- Priorise les faits vérifiables avec des chiffres (€, %, effectifs).
- Limite à 8 suggestions maximum.
- Réponds UNIQUEMENT en JSON.`,
    };

    const userPrompts: Record<SuggestionTarget, string> = {
      skills: `Contexte du candidat :\n${contextStr}\n\nSuggère les 12 compétences les plus pertinentes. Réponds en JSON : { "suggestions": [{ "name": string, "category": "management"|"business"|"technique"|"outil"|"langue", "level": "débutant"|"intermédiaire"|"confirmé"|"expert", "confidence": number, "reason": string }] }`,
      languages: `Contexte du candidat :\n${contextStr}\n\nSuggère les langues. Réponds en JSON : { "suggestions": [{ "name": string (ex: "Anglais (courant)"), "category": "langue", "level": "natif"|"courant"|"intermédiaire"|"débutant", "confidence": number, "reason": string }] }`,
      education: `Contexte du candidat :\n${contextStr}\n\nSuggère les formations. Réponds en JSON : { "suggestions": [{ "name": string (ex: "Master Management — HEC Paris (2009)"), "category": "formation", "level": "", "confidence": number, "reason": string }] }`,
      certifications: `Contexte du candidat :\n${contextStr}\n\nSuggère les certifications. Réponds en JSON : { "suggestions": [{ "name": string (ex: "PMP - Project Management Professional"), "category": "certification", "level": "", "confidence": number, "reason": string }] }`,
      proofs: `Contexte du candidat :\n${contextStr}\n\nExtrais les réalisations chiffrées et faits vérifiables. Réponds en JSON : { "suggestions": [{ "name": string (titre court comme "Croissance CA 2023"), "category": "CA"|"croissance"|"équipe"|"budget"|"négociation"|"international"|"management"|"formation"|"certification"|"langue"|"autre", "value": string (le chiffre/le fait comme "+32% CA"), "context": string (contexte comme "TechCorp 2022-2023"), "confidence": number, "reason": string }] }`,
    };

    const result = await generateJsonWithDeepSeek<{ suggestions: SuggestionItem[] }>({
      systemPrompt: systemPrompts[target],
      userPrompt: userPrompts[target],
      temperature: 0.3,
    });

    if (result.success && result.data?.suggestions) {
      return { suggestions: result.data.suggestions.slice(0, 15), source: "ai" };
    }
  }

  // Fallback local
  let suggestions: SuggestionItem[] = [];
  if (target === "skills") {
    suggestions = getLocalSkillsFallback(contextStr);
  } else if (target === "languages") {
    suggestions = getLocalLanguagesFallback(contextStr);
  } else if (target === "education") {
    const edu = context.profile?.education;
    if (edu && edu !== "[]" && edu.trim()) {
      try {
        const parsed = JSON.parse(edu);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = (parsed as (string | EducationItem)[]).map((item) => ({
            name: typeof item === "string" ? item : `${item.degree || ""} — ${item.school || ""}${item.year ? ` (${item.year})` : ""}`,
            category: "formation",
            level: "",
            confidence: 90,
            reason: "Déjà dans votre profil",
          }));
        }
      } catch {
        suggestions = edu.split(",").map((s: string) => ({
          name: s.trim(),
          category: "formation",
          level: "",
          confidence: 70,
          reason: "Détecté depuis votre profil",
        }));
      }
    }
    if (suggestions.length === 0) {
      suggestions = [
        { name: "Master en Management / Commerce", category: "formation", level: "", confidence: 75, reason: "Formation recommandée pour cadre dirigeant" },
        { name: "MBA", category: "formation", level: "", confidence: 70, reason: "MBA recommandé pour poste exécutif" },
      ];
    }
  } else if (target === "proofs") {
    // Extract proof-worthy achievements from experiences
    const proofSuggestions: SuggestionItem[] = [];
    for (const exp of context.experiences) {
      if (exp.achievements) {
        const lines = exp.achievements.split("\n").filter(l => l.trim());
        for (const line of lines) {
          if (/[€$%\d]/.test(line)) {
            const cat = line.includes("€") ? "CA" :
              line.includes("%") ? "croissance" :
              /\d+\s*(?:personnes?|commerciaux?|collaborateurs?)/i.test(line) ? "équipe" : "autre";
            proofSuggestions.push({
              name: line.length > 60 ? line.slice(0, 60) + "..." : line,
              category: cat,
              level: "",
              confidence: 55,
              reason: `Extrait de votre expérience chez ${exp.company}`,
            });
          }
        }
      }
    }
    // Also extract from proof entries
    for (const p of context.proofEntries) {
      proofSuggestions.push({
        name: p.title,
        category: p.category,
        level: "",
        value: p.value,
        confidence: 90,
        reason: "Déjà dans votre Proof Vault",
      });
    }
    suggestions = proofSuggestions.slice(0, 10);
  } else if (target === "certifications") {
    suggestions = [
      { name: "Green Belt Lean Six Sigma", category: "certification", level: "", confidence: 65, reason: "Certification prisée en management" },
      { name: "TOEIC / TOEFL", category: "certification", level: "", confidence: 60, reason: "Certification linguistique" },
      { name: "PMP (Project Management Professional)", category: "certification", level: "", confidence: 60, reason: "Standard en gestion de projet" },
      { name: "Certification Salesforce", category: "certification", level: "", confidence: 55, reason: "CRM exécutif" },
    ];
  }

  return {
    suggestions: suggestions.slice(0, 12),
    source: hasApiKey ? "local" : "no_key",
    error: hasApiKey ? "Fallback local utilisé" : undefined,
  };
}
