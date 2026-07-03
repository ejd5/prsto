import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";

const MARGIN = 50;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LINE_HEIGHT = 14;

function wrapText(text: string, font: ReturnType<typeof Object>, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim().length === 0) { lines.push(""); continue; }
    let words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (test.length * (size * 0.5) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

const GOLD = rgb(0.79, 0.66, 0.30);
const WHITE = rgb(0.9, 0.9, 0.9);
const GREY = rgb(0.5, 0.5, 0.5);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, linkedin, role, company, cv, jd } = body;

    if (!name || !email || !cv || !role || !company || !jd) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // ─── Générer le contenu via DeepSeek ───
    let aiContent: Record<string, string> = {};

    const prompt = `Tu es un expert en recrutement de cadres dirigeants. Génère un Executive Brief personnalisé.

CANDIDAT : ${name}
POSTE VISÉ : ${role}
ENTREPRISE : ${company}${linkedin ? `\nLINKEDIN : ${linkedin}` : ""}

TEXTE DU CV (extrait) :
${cv.slice(0, 2000)}

DESCRIPTION DU POSTE (extrait) :
${jd.slice(0, 2000)}

Génère UNIQUEMENT le JSON suivant (pas de markdown, pas de texte autour) :
{
  "analyseCV": "Analyse détaillée en 3-4 phrases : forces du candidat vs prérequis du poste, axes d'amélioration, recommandations concrètes. Incisif et spécifique.",
  "companyIntelligence": "Analyse stratégique de l'entreprise en 5-6 phrases : secteur, positionnement, défis, opportunités pour le candidat. Spécifique au poste visé.",
  "questionsSTAR": "5 questions d'entretien probables au format STAR, spécifiques au poste et au secteur. Format : '1. Question...' séparées par des sauts de ligne.",
  "plan3090": "Plan d'action 30-60-90 jours personnalisé pour ce poste dans cette entreprise. 6-8 actions concrètes, pas génériques. Format liste avec '•'.",
  "kitNegociation": "Conseils de négociation salariale personnalisés : benchmark implicite, arguments différenciants basés sur le CV, pièges à éviter, alternatives de compensation. 5-6 phrases.",
  "linkedinAudit": "Audit LinkedIn en 4-5 phrases : recommandations sur le profil, le résumé, l'expérience, les recommendations. Adapté au poste visé. Concret et actionnable.",
  "resumeExecutif": "Résumé exécutif en 3-4 phrases : synthèse de l'opportunité, adéquation candidat-poste, recommandation finale."
}

RÈGLES :
- Incisif, concret, pas de blabla marketing
- Spécifique au poste et au candidat, pas de template générique
- En français
- Format JSON strict, pas de markdown, pas de texte avant/après`;

    const result = await generateWithDeepSeek({
      systemPrompt: "Tu es un expert en recrutement de cadres dirigeants. Tu réponds UNIQUEMENT en JSON valide, sans markdown.",
      userPrompt: prompt,
      temperature: 0.6,
      maxTokens: 3000,
    });

    if (result.success && result.content) {
      let json = result.content.trim();
      if (json.startsWith("```")) json = json.replace(/```json?\n?/g, "").replace(/```/g, "");
      try { aiContent = JSON.parse(json); } catch { /* fallback */ }
    }

    const $ = (key: string, fallback: string) => aiContent[key] || fallback;

    // ─── Générer le PDF ───
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const maxWidth = PAGE_WIDTH - 2 * MARGIN;
    const fs = 10;

    function addText(page: any, text: string, x: number, y: number, opts: { size?: number; font?: any; color?: any } = {}) {
      page.drawText(text, {
        x, y,
        size: opts.size ?? fs,
        font: opts.font ?? font,
        color: opts.color ?? WHITE,
      });
    }

    function addWrapped(page: any, text: string, x: number, startY: number, opts: { size?: number; color?: any } = {}): number {
      let y = startY;
      const size = opts.size ?? fs;
      const lines = wrapText(text, font, size, maxWidth);
      for (const line of lines) {
        if (y < MARGIN + 40) {
          addText(page, "→ suite page suivante", x, y, { size: 8, color: GREY });
          break;
        }
        addText(page, line, x, y, { size, color: opts.color ?? WHITE });
        y -= size + 4;
      }
      return y;
    }

    function addBulletList(page: any, items: string[], x: number, startY: number, opts: { color?: any } = {}): number {
      let y = startY;
      for (const item of items) {
        if (y < MARGIN + 20) { addText(page, "→ suite...", x, y, { size: 8, color: GREY }); break; }
        addText(page, `• ${item}`, x, y, { color: opts.color ?? WHITE });
        y -= LINE_HEIGHT;
      }
      return y;
    }

    // ─── Page 1 : Cover ───
    let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    addText(page, "EXECUTIVE BRIEF", MARGIN, PAGE_HEIGHT - 80, { size: 24, font: boldFont, color: GOLD });
    addText(page, "Dossier préparatoire pour entretien", MARGIN, PAGE_HEIGHT - 108, { size: 12, color: GREY });
    addText(page, `Préparé pour ${name}`, MARGIN, PAGE_HEIGHT - 140, { size: 14, font: boldFont });
    addText(page, `Poste visé : ${role}`, MARGIN, PAGE_HEIGHT - 162, { size: 11 });
    addText(page, `Entreprise : ${company}`, MARGIN, PAGE_HEIGHT - 180, { size: 11 });

    if ($("resumeExecutif", "")) {
      addText(page, "Synthèse exécutive", MARGIN + 4, PAGE_HEIGHT - 220, { size: 9, font: boldFont, color: GOLD });
      addWrapped(page, $("resumeExecutif", ""), MARGIN + 4, PAGE_HEIGHT - 236, { size: 9 });
    }

    addText(page, "Confidentiel", MARGIN, 80, { size: 9, color: GREY });
    addText(page, `Généré le ${new Date().toLocaleDateString("fr-FR")}`, MARGIN, 64, { size: 9, color: GREY });
    addText(page, "PRSTO — Executive Brief", MARGIN, 48, { size: 9, color: GREY });

    // ─── Page 2 : Analyse CV vs JD ───
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    addText(page, "Analyse CV vs Description de poste", MARGIN, PAGE_HEIGHT - 60, { size: 16, font: boldFont, color: GOLD });
    let y = addWrapped(page, $("analyseCV", "Votre profil présente les compétences clés recherchées pour ce poste. Recommandations : renforcez les sections sur les résultats chiffrés et le leadership transverse."), MARGIN, PAGE_HEIGHT - 90);

    y -= 24;
    addText(page, "Résumé exécutif", MARGIN, y, { size: 12, font: boldFont, color: GOLD });
    y = addWrapped(page, $("resumeExecutif", "Cette opportunité correspond à votre profil."), MARGIN, y - 20);

    // ─── Page 3 : Company Intelligence ───
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    addText(page, "Company Intelligence", MARGIN, PAGE_HEIGHT - 60, { size: 16, font: boldFont, color: GOLD });
    y = addWrapped(page, $("companyIntelligence", "Analyse stratégique de l'entreprise, de sa culture, de ses défis et opportunités pour le candidat."), MARGIN, PAGE_HEIGHT - 90);

    if ($("linkedinAudit", "")) {
      y -= 28;
      addText(page, "Audit LinkedIn", MARGIN, y, { size: 12, font: boldFont, color: GOLD });
      y = addWrapped(page, $("linkedinAudit", ""), MARGIN, y - 20);
      if (linkedin) {
        y -= 16;
        addText(page, `Profil analysé : ${linkedin}`, MARGIN, y, { size: 8, color: GREY });
      }
    }

    // ─── Page 4 : Questions STAR ───
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    addText(page, "Questions STAR Personnalisées", MARGIN, PAGE_HEIGHT - 60, { size: 16, font: boldFont, color: GOLD });
    addText(page, "Préparez ces questions spécifiques au poste pour l'entretien :", MARGIN, PAGE_HEIGHT - 85, { size: 9, color: GREY });

    const starRaw = $("questionsSTAR", "1. Parlez-moi de votre plus grand accomplissement.\n2. Décrivez une situation où vous avez géré une crise.\n3. Comment avez-vous contribué à la croissance ?\n4. Racontez un échec professionnel.\n5. Comment gérez-vous un sous-performant ?");
    const starItems = starRaw.split("\n").filter(Boolean).map(s => s.replace(/^\d+[.\)]\s*/, "").trim());
    y = addBulletList(page, starItems, MARGIN, PAGE_HEIGHT - 110);

    y -= 20;
    addText(page, "Format STAR (Situation, Tâche, Action, Résultat) :", MARGIN, y, { size: 9, font: boldFont, color: GOLD });
    y -= 16;
    addText(page, "→ Pour chaque réponse, structurez avec un résultat chiffré.", MARGIN, y, { size: 9, color: GREY });

    // ─── Page 5 : Plan 30-60-90 ───
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    addText(page, "Plan 30-60-90 Jours", MARGIN, PAGE_HEIGHT - 60, { size: 16, font: boldFont, color: GOLD });
    addText(page, `Plan d'action personnalisé pour ${role} chez ${company} :`, MARGIN, PAGE_HEIGHT - 85, { size: 9, color: GREY });

    const planRaw = $("plan3090", "• 30j : Diagnostic et rencontres clés\n• 30j : Audit des processus\n• 60j : Premières initiatives\n• 60j : Présentation au comité\n• 90j : Passage à l'échelle\n• 90j : Résultats mesurables");
    const planItems = planRaw.split("\n").filter(Boolean).map(s => s.replace(/^[•\-]\s*/, "").trim());
    y = addBulletList(page, planItems, MARGIN, PAGE_HEIGHT - 110);

    y -= 20;
    addText(page, "Conseil : Présentez ce plan pendant l'entretien pour montrer votre vision stratégique.", MARGIN, y, { size: 9, color: GREY });

    // ─── Page 6 : Kit Négociation ───
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    addText(page, "Kit Négociation Salariale", MARGIN, PAGE_HEIGHT - 60, { size: 16, font: boldFont, color: GOLD });
    y = addWrapped(page, $("kitNegociation", "Benchmark du marché pour un poste de ce niveau. Fourchette basse, cible et haute. Arguments pour justifier votre prétention salariale."), MARGIN, PAGE_HEIGHT - 90);

    // ─── Persister la commande ───
    try {
      await prisma.executiveBriefOrder.create({
        data: { name, email, linkedin: linkedin || null, role, company, cvPreview: cv.slice(0, 500) },
      });
    } catch { /* non bloquant */ }

    const pdfBytes = await doc.save();
    const pdfData = new Uint8Array(pdfBytes);

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="executive-brief-${name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Executive Brief generation error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
}
