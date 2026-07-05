/**
 * Templates CV internes PRSTO — originaux, inspirés des bonnes pratiques ATS/executive.
 * Aucun template commercial copié. Toute ressemblance est fortuite.
 */

export type ATSLevel = "HIGH" | "MEDIUM" | "LOW";
export type CVStyle = "classic" | "executive" | "premium" | "international";

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  recommendedLang: "fr" | "en" | "both";
  recommendedFor: string;
  atsLevel: ATSLevel;
  style: CVStyle;
  sections: string[];
  previewText: string;
  usageTips: string[];
  renderHTML(cv: CVData): string;
  renderText(cv: CVData): string;
}

export interface CVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  summary: string;
  languages: string[];
  skills: { name: string; category: string; level: string }[];
  experiences: {
    company: string; title: string; period: string; location: string;
    description: string; achievements: string[];
  }[];
  education: { degree: string; school: string; year: string }[];
  certifications: string[];
}

function section(title: string, content: string): string {
  return `\n${title.toUpperCase()}\n${"─".repeat(title.length)}\n${content}\n`;
}

function bullet(items: string[]): string {
  return items.map(i => `• ${i}`).join("\n");
}

// ─── 1. ATS Classic ─────────────────────────────

const atsClassic: CVTemplate = {
  id: "ats-classic",
  name: "ATS Classic",
  description: "Format sobre et structuré, optimisé pour les ATS. Priorité absolue à la lisibilité machine. Polices système, pas de colonnes, pas de tableaux, pas d'icônes.",
  recommendedLang: "fr",
  recommendedFor: "Première candidature, grands groupes, cabinets de recrutement, plateformes ATS",
  atsLevel: "HIGH",
  style: "classic",
  sections: ["En-tête", "Résumé", "Expérience", "Compétences", "Formation", "Langues", "Certifications"],
  usageTips: [
    "Idéal pour les ATS : zéro colonne, zéro tableau, zéro image",
    "Mettez les mots-clés de l'offre dans la section Compétences",
    "Utilisez des verbes d'action en début de chaque réalisation",
    "Préférez les polices système (Arial, Calibri) à l'export PDF",
  ],
  previewText: `JEAN DUPONT\nDirecteur Commercial | 15 ans d'expérience\njean.dupont@email.com | +33 6 XX XX XX XX | linkedin.com/in/jeandupont\nParis, France\n\nRÉSUMÉ\nDirecteur Commercial avec 15 ans d'expérience en B2B...\n\nEXPÉRIENCE\nDirecteur Commercial — Groupe ABC (2018-Présent)\n• CA France : 45M€ — Équipe de 35 personnes...`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "classic",
      colors: { primary: "#1a1a2e", accent: "#2d3436", text: "#333" },
      layout: "single-column",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(cv.fullName.toUpperCase());
    lines.push(`${cv.title}`);
    lines.push(`${cv.email} | ${cv.phone} | ${cv.linkedin}`);
    lines.push(cv.location);
    lines.push("");
    lines.push(section("Résumé", cv.summary));
    lines.push(section("Expérience professionnelle", cv.experiences.map(e =>
      `${e.title} — ${e.company} (${e.period})\n${e.location}\n${e.description}\n${bullet(e.achievements)}`
    ).join("\n\n")));
    lines.push(section("Compétences", cv.skills.map(s => `• ${s.name} — ${s.level}`).join("\n")));
    lines.push(section("Formation", cv.education.map(e => `${e.degree}, ${e.school} (${e.year})`).join("\n")));
    if (cv.languages.length) lines.push(section("Langues", cv.languages.join(", ")));
    if (cv.certifications.length) lines.push(section("Certifications", bullet(cv.certifications)));
    return lines.join("\n");
  },
};

// ─── 2. Executive Premium ──────────────────────

const executivePremium: CVTemplate = {
  id: "executive-premium",
  name: "Executive Premium",
  description: "Mise en page exécutive avec focus sur les résultats chiffrés, le leadership et l'impact business. En-tête distinctif, chiffres clés en exergue.",
  recommendedLang: "fr",
  recommendedFor: "Postes de Direction, comités exécutifs, DG, CEO",
  atsLevel: "MEDIUM",
  style: "executive",
  sections: ["En-tête exécutif", "Chiffres clés", "Résumé", "Expérience", "Leadership", "Compétences", "Formation"],
  usageTips: [
    "Placez 3-5 chiffres clés en haut : CA, taille d'équipe, croissance",
    "La section Leadership doit mentionner des initiatives transverses",
    "Utilisez le vocabulaire du board : P&L, EBITDA, Capex, Opex",
    "Limitez à 2 pages maximum, même pour 20+ ans d'expérience",
  ],
  previewText: `JEAN DUPONT — Directeur Commercial\n\nCHIFFRES CLÉS\n• CA géré : 45M€ | Équipe : 35 personnes | 3 pays\n• Croissance : +35% en 3 ans\n\nRÉSUMÉ\nLeader commercial orienté résultats avec 15 ans d'expérience...`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "executive",
      colors: { primary: "#1a1a2e", accent: "#c6a64e", text: "#222" },
      layout: "single-column-accent",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(`${cv.fullName.toUpperCase()} — ${cv.title}`);
    lines.push(`${cv.email} | ${cv.phone} | ${cv.linkedin} | ${cv.location}`);
    lines.push("");
    lines.push("═══ CHIFFRES CLÉS ═══");
    // Extract numeric achievements
    for (const exp of cv.experiences.slice(0, 1)) {
      for (const ach of exp.achievements.slice(0, 3)) {
        lines.push(`• ${ach}`);
      }
    }
    lines.push("");
    lines.push(section("Résumé exécutif", cv.summary));
    lines.push(section("Parcours", cv.experiences.map(e =>
      `${e.title} — ${e.company} | ${e.period} | ${e.location}\n\n${e.description}\n\nRéalisations :\n${bullet(e.achievements)}`
    ).join("\n\n" + "─".repeat(40) + "\n\n")));
    lines.push(section("Expertises", cv.skills.map(s => `• ${s.name} (${s.level})`).join("\n")));
    if (cv.languages.length) lines.push(section("Langues", cv.languages.join(" · ")));
    return lines.join("\n");
  },
};

// ─── 3. Corporate France ───────────────────────

const corporateFrance: CVTemplate = {
  id: "corporate-france",
  name: "Corporate France",
  description: "Format français classique adapté aux entreprises du CAC 40 et ETI. Structure attendue par les RH français. Photo optionnelle, état civil discret.",
  recommendedLang: "fr",
  recommendedFor: "Entreprises françaises, CAC 40, ETI, secteur public, administrations",
  atsLevel: "HIGH",
  style: "classic",
  sections: ["État civil", "Titre", "Résumé", "Expérience", "Compétences", "Formation", "Langues", "Divers"],
  usageTips: [
    "Format français standard : état civil discret (pas de photo)",
    "Mettez les périodes en avant (2018-Présent), pas les durées",
    "Ajoutez une section Divers pour les mandats (CA, board, associations)",
    "Idéal pour postes en entreprise française cotée ou administrations",
  ],
  previewText: `Jean Dupont\nNé le 15/03/1980 — Nationalité française\nDirecteur Commercial — 15 ans d'expérience\n\nEXPÉRIENCES PROFESSIONNELLES\n2018-Présent : Directeur Commercial, Groupe ABC (Paris)\n• Pilotage d'une équipe de 35 commerciaux...`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "classic",
      colors: { primary: "#002395", accent: "#002395", text: "#333" },
      layout: "single-column",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(cv.fullName);
    lines.push(cv.title);
    lines.push(`${cv.email} — ${cv.phone}`);
    lines.push(cv.location);
    lines.push("");
    lines.push(section("Résumé", cv.summary));
    lines.push(section("Expérience professionnelle", cv.experiences.map(e =>
      `${e.period} : ${e.title}, ${e.company} (${e.location})\n${e.description}\n${bullet(e.achievements)}`
    ).join("\n\n")));
    lines.push(section("Compétences", cv.skills.map(s => `• ${s.name} : ${s.level}`).join("\n")));
    lines.push(section("Formation", cv.education.map(e => `${e.year} : ${e.degree} — ${e.school}`).join("\n")));
    if (cv.languages.length) lines.push(section("Langues", cv.languages.join(" · ")));
    if (cv.certifications.length) lines.push(section("Certifications", bullet(cv.certifications)));
    return lines.join("\n");
  },
};

// ─── 4. International EN ───────────────────────

const internationalEN: CVTemplate = {
  id: "international-en",
  name: "International EN",
  description: "Format anglo-saxon standard. Summary, Core Competencies, Professional Experience. Pas de photo, pas de date de naissance. Adapté UK/US/International.",
  recommendedLang: "en",
  recommendedFor: "Postes internationaux, multinationales, pays anglophones, organisations internationales",
  atsLevel: "HIGH",
  style: "international",
  sections: ["Header", "Professional Summary", "Core Competencies", "Professional Experience", "Education", "Languages", "Certifications"],
  usageTips: [
    "Pas de photo, pas de date de naissance (norme UK/US)",
    "Professional Summary en 3-4 lignes maximum",
    "Core Competencies : 8-12 mots-clés séparés par des pipes |",
    "Chiffrez tout en USD ou devise locale du poste cible",
  ],
  previewText: `JEAN DUPONT\nSenior Sales Director | 15+ Years in B2B Commercial Leadership\njean.dupont@email.com | +33 6 XX XX XX XX | linkedin.com/in/jeandupont\nParis, France\n\nPROFESSIONAL SUMMARY\nResults-driven Sales Director with 15+ years of experience...\n\nCORE COMPETENCIES\nStrategic Planning | P&L Management | Team Leadership | Business Development...`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "international",
      colors: { primary: "#0d1b2a", accent: "#1b3a5c", text: "#222" },
      layout: "single-column",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(cv.fullName.toUpperCase());
    lines.push(cv.title);
    lines.push(`${cv.email} | ${cv.phone} | ${cv.linkedin}`);
    lines.push(cv.location);
    lines.push("");
    lines.push(section("Professional Summary", cv.summary));
    lines.push(section("Core Competencies", cv.skills.map(s => `• ${s.name} (${s.level})`).join("\n")));
    lines.push(section("Professional Experience", cv.experiences.map(e =>
      `${e.title} — ${e.company} | ${e.period}\n${e.location}\n\n${e.description}\n\nKey Achievements:\n${bullet(e.achievements)}`
    ).join("\n\n" + "─".repeat(50) + "\n\n")));
    lines.push(section("Education", cv.education.map(e => `${e.degree} — ${e.school}, ${e.year}`).join("\n")));
    if (cv.languages.length) lines.push(section("Languages", cv.languages.join(" · ")));
    if (cv.certifications.length) lines.push(section("Certifications", bullet(cv.certifications)));
    return lines.join("\n");
  },
};

// ─── 5. Country Manager ────────────────────────

const countryManager: CVTemplate = {
  id: "country-manager",
  name: "Country Manager",
  description: "Template optimisé pour les postes de Country Manager et Directeur Général de filiale. Focus P&L, lancement pays, gestion d'entité légale, multilinguisme.",
  recommendedLang: "both",
  recommendedFor: "Postes Country Manager, DG filiale, Directeur de zone, Regional Manager",
  atsLevel: "MEDIUM",
  style: "executive",
  sections: ["En-tête multilingue", "P&L & KPIs", "Résumé", "Expérience pays", "Gestion d'entité", "Compétences", "Langues", "Formation"],
  usageTips: [
    "Affichez les langues en haut : c'est votre premier atout",
    "P&L : précisez la devise et le scope (pays, zone, global)",
    "Mentionnez les lancements de filiales et la gestion d'entité légale",
    "Adaptez l'ordre des sections selon le pays cible",
  ],
  previewText: `JEAN DUPONT — Country Manager France & Benelux\nLangues : FR (natif) | EN (courant) | NL (B1)\n\nP&L & KPIs CLÉS\n• P&L France : 25M€ — Marge opérationnelle 18%\n• Lancement filiale Belgique (2021) et Luxembourg (2023)\n• Équipes : 80 personnes sur 3 pays`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "executive",
      colors: { primary: "#0b3d2e", accent: "#1a7a5a", text: "#222" },
      layout: "single-column-accent",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(`${cv.fullName.toUpperCase()} — ${cv.title}`);
    lines.push(`${cv.email} | ${cv.phone} | ${cv.linkedin}`);
    if (cv.languages.length) lines.push(`Langues : ${cv.languages.join(" | ")}`);
    lines.push("");
    lines.push("═══ P&L & INDICATEURS ═══");
    for (const exp of cv.experiences.slice(0, 1)) {
      for (const ach of exp.achievements.slice(0, 4)) {
        lines.push(`• ${ach}`);
      }
    }
    lines.push("");
    lines.push(section("Profil", cv.summary));
    lines.push(section("Expérience — Direction Pays", cv.experiences.map(e =>
      `${e.title} — ${e.company} | ${e.period} | ${e.location}\n\n${e.description}\n\nRéalisations clés :\n${bullet(e.achievements)}`
    ).join("\n\n")));
    lines.push(section("Compétences clés", cv.skills.map(s => `• ${s.name} (${s.level})`).join("\n")));
    if (cv.languages.length) lines.push(section("Langues", cv.languages.join(" · ")));
    return lines.join("\n");
  },
};

// ─── 6. Sales Leadership ───────────────────────

const salesLeadership: CVTemplate = {
  id: "sales-leadership",
  name: "Sales Leadership",
  description: "Template pour Directeur Commercial et Head of Sales. Focus CA, croissance, transformation commerciale, gestion d'équipe, secteurs couverts.",
  recommendedLang: "both",
  recommendedFor: "Directeur Commercial, Head of Sales, VP Sales, Directeur Business Development",
  atsLevel: "MEDIUM",
  style: "executive",
  sections: ["En-tête", "Performance commerciale", "Résumé", "Expérience", "Secteurs", "Compétences", "Formation"],
  usageTips: [
    "Lead avec le CA, la croissance et la taille d'équipe",
    "Détaillez les secteurs couverts (B2B, industrie, SaaS, etc.)",
    "Mentionnez les cycles de vente, taille de deals, taux de conversion",
    "Ajoutez le nom de clients référents si autorisé",
  ],
  previewText: `JEAN DUPONT — Directeur Commercial\n\nPERFORMANCE COMMERCIALE\n• CA global : 45M€ — CAGR +12% sur 5 ans\n• Équipes : 35 commerciaux + 5 managers\n• Secteurs : Industrie, SaaS B2B, Santé`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "executive",
      colors: { primary: "#5c1a0b", accent: "#c0392b", text: "#222" },
      layout: "single-column-accent",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(`${cv.fullName.toUpperCase()} — ${cv.title}`);
    lines.push(`${cv.email} | ${cv.phone} | ${cv.linkedin} | ${cv.location}`);
    lines.push("");
    const metrics = cv.experiences.flatMap(e => e.achievements).filter(a => /\d/.test(a));
    if (metrics.length) {
      lines.push("═══ PERFORMANCE COMMERCIALE ═══");
      for (const m of metrics.slice(0, 5)) lines.push(`• ${m}`);
      lines.push("");
    }
    lines.push(section("Profil commercial", cv.summary));
    lines.push(section("Expérience", cv.experiences.map(e =>
      `${e.title} — ${e.company} | ${e.period}\n${e.description}\n\nRésultats :\n${bullet(e.achievements)}`
    ).join("\n\n")));
    lines.push(section("Compétences", cv.skills.map(s => `• ${s.name} (${s.level})`).join("\n")));
    if (cv.languages.length) lines.push(section("Langues", cv.languages.join(" · ")));
    return lines.join("\n");
  },
};

// ─── 7. Luxe / Premium ─────────────────────────

const luxePremium: CVTemplate = {
  id: "luxe-premium",
  name: "Luxe / Premium",
  description: "Design épuré premium pour les secteurs du luxe, premium et hospitality. Focus marques, expérience client, excellence opérationnelle, esthétique.",
  recommendedLang: "both",
  recommendedFor: "Secteur luxe, premium, hospitality, retail haut de gamme, beauty, mode",
  atsLevel: "MEDIUM",
  style: "premium",
  sections: ["En-tête", "Marques & Maisons", "Résumé", "Expérience", "Excellence", "Compétences", "Formation"],
  usageTips: [
    "Les marques sont votre actif : citez-les avec les dates",
    "Utilisez un ton premium, sobre, sans superlatifs",
    "Mentionnez l'excellence opérationnelle et l'expérience client",
    "Le design compte : privilégiez une typographie élégante à l'export",
  ],
  previewText: `Jean Dupont — Directeur Commercial | Secteur Luxe & Premium\n\nMARQUES & MAISONS\n• LVMH — Directeur Commercial France (2019-Présent)\n• Hermès — Responsable Retail (2015-2019)\n\nRÉSUMÉ\n15 ans d'expérience dans le luxe et le premium...`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "premium",
      colors: { primary: "#1a1a1a", accent: "#8b7355", text: "#333" },
      layout: "single-column-accent",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(`${cv.fullName} — ${cv.title}`);
    lines.push(`${cv.email} | ${cv.phone} | ${cv.linkedin} | ${cv.location}`);
    lines.push("");
    lines.push("═══ MARQUES & MAISONS ═══");
    for (const exp of cv.experiences.slice(0, 3)) {
      lines.push(`• ${exp.company} — ${exp.title} (${exp.period})`);
    }
    lines.push("");
    lines.push(section("Profil", cv.summary));
    lines.push(section("Expérience", cv.experiences.map(e =>
      `${e.title} — ${e.company} | ${e.period} | ${e.location}\n\n${e.description}\n\nRéalisations :\n${bullet(e.achievements)}`
    ).join("\n\n" + "· · ·\n\n")));
    lines.push(section("Compétences", cv.skills.map(s => `• ${s.name} (${s.level})`).join("\n")));
    if (cv.languages.length) lines.push(section("Langues", cv.languages.join(" · ")));
    if (cv.certifications.length) lines.push(section("Certifications", bullet(cv.certifications)));
    return lines.join("\n");
  },
};

// ─── 8. One-page Executive Brief ───────────────

const onePageBrief: CVTemplate = {
  id: "one-page-brief",
  name: "One-Page Executive Brief",
  description: "Synthèse ultra-compacte sur une page. Impact immédiat. Pour recommandation, premier contact cabinet, ou introduction réseau. Pas de détail superflu.",
  recommendedLang: "both",
  recommendedFor: "Réseau, cabinet de chasse, approche directe, introduction, pitch deck",
  atsLevel: "LOW",
  style: "executive",
  sections: ["Nom & Titre", "En quelques lignes", "Parcours éclair", "Expertises", "Contact"],
  usageTips: [
    "Format one-page : tout doit tenir sur 1 page A4",
    "Gardez uniquement les 4 expériences les plus pertinentes",
    "La section Expertises est une liste plate, pas de détails",
    "Parfait pour un premier contact ou une recommandation",
  ],
  previewText: `JEAN DUPONT — Directeur Commercial | B2B | 15 ans\n\nEN BREF\nCA 45M€ · Équipe 35p · 3 pays · +35% croissance\nIndustrie, SaaS B2B, Santé\n\nPARCOURS\n2018-Présent : Directeur Commercial, Groupe ABC\n2015-2018 : Head of Sales, XYZ Corp\n2012-2015 : Key Account Director, DEF Group`,
  renderHTML(cv: CVData): string {
    return renderBasicHTML(cv, {
      style: "executive",
      colors: { primary: "#000", accent: "#000", text: "#222" },
      layout: "single-column",
    });
  },
  renderText(cv: CVData): string {
    const lines: string[] = [];
    lines.push(`${cv.fullName.toUpperCase()} — ${cv.title}`);
    lines.push(`${cv.email} | ${cv.phone}`);
    lines.push("");
    lines.push("EN BREF");
    const allAch = cv.experiences.flatMap(e => e.achievements).filter(a => /\d/.test(a));
    lines.push(bullet(allAch.slice(0, 4)));
    lines.push("");
    lines.push("PARCOURS");
    for (const exp of cv.experiences.slice(0, 4)) {
      lines.push(`${exp.period} : ${exp.title}, ${exp.company} (${exp.location})`);
      if (exp.achievements.length) lines.push(`  → ${exp.achievements[0]}`);
    }
    lines.push("");
    lines.push("EXPERTISES");
    lines.push(cv.skills.slice(0, 8).map(s => s.name).join(" · "));
    if (cv.languages.length) lines.push(`\nLangues : ${cv.languages.join(" · ")}`);
    return lines.join("\n");
  },
};

// ─── Registry ──────────────────────────────────

export const CV_TEMPLATES: CVTemplate[] = [
  atsClassic,
  executivePremium,
  corporateFrance,
  internationalEN,
  countryManager,
  salesLeadership,
  luxePremium,
  onePageBrief,
];

export function getCVTemplate(id: string): CVTemplate | undefined {
  return CV_TEMPLATES.find(t => t.id === id);
}

export function getCVTemplatesByATSLevel(level: ATSLevel): CVTemplate[] {
  return CV_TEMPLATES.filter(t => t.atsLevel === level);
}

// ─── HTML Renderer ─────────────────────────────

interface RenderOptions {
  style: CVStyle;
  colors: { primary: string; accent: string; text: string };
  layout: "single-column" | "single-column-accent";
}

function renderBasicHTML(cv: CVData, opts: RenderOptions): string {
  const { colors, layout } = opts;
  const isAccent = layout === "single-column-accent";

  // Semantic HTML5 with proper hierarchy for ATS parsing
  // No display:flex (some ATS strip it), no images, no JavaScript, no external fonts
  const skillItems = cv.skills.map(s => `${s.name} (${s.level})`).join(" · ");
  const langText = cv.languages.join(" · ");
  const certText = cv.certifications.join(" · ");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>CV — ${cv.fullName}</title></head>
<body style="font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 40px auto; color: ${colors.text}; line-height: 1.5; background: #fff; padding: 0 20px; font-size: 13px;">

<!-- En-tête -->
<header style="border-bottom: 2px solid ${colors.primary}; padding-bottom: 14px; margin-bottom: 22px;">
  <h1 style="font-size: 26px; color: ${colors.primary}; margin: 0 0 3px; letter-spacing: 0.5px; text-transform: uppercase;">${cv.fullName}</h1>
  <p style="font-size: 15px; color: ${colors.accent}; margin: 0 0 6px; font-weight: bold;">${cv.title}</p>
  <p style="font-size: 11px; color: #555; margin: 0;">${cv.email} &nbsp;|&nbsp; ${cv.phone} &nbsp;|&nbsp; ${cv.linkedin} &nbsp;|&nbsp; ${cv.location}</p>
</header>

<!-- Résumé / Profil -->
${isAccent ? `
<div style="background: ${colors.primary}08; border-left: 4px solid ${colors.accent}; padding: 12px 16px; margin-bottom: 22px;">
  <p style="font-size: 13px; margin: 0; font-style: italic; color: ${colors.text};">${cv.summary}</p>
</div>` : `
<section style="margin-bottom: 18px;">
  <h2 style="font-size: 13px; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 0 0 6px;">Profil</h2>
  <p style="font-size: 13px; margin: 0;">${cv.summary}</p>
</section>`}

<!-- Expérience professionnelle (section la plus importante pour ATS) -->
<section style="margin-bottom: 18px;">
  <h2 style="font-size: 13px; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 0 0 8px;">Expérience professionnelle</h2>
  ${cv.experiences.map(e => `
  <div style="margin-bottom: 14px;">
    <h3 style="font-size: 13px; margin: 0 0 1px; color: ${colors.text};"><strong>${e.title}</strong> — ${e.company} <span style="font-size: 11px; color: #666;">(${e.period})</span></h3>
    <p style="font-size: 11px; color: #777; margin: 1px 0 3px;">${e.location}</p>
    <p style="font-size: 12px; margin: 3px 0;">${e.description}</p>
    <ul style="margin: 3px 0; padding-left: 20px; font-size: 12px;">
      ${e.achievements.map(a => `<li style="margin-bottom: 1px;">${a}</li>`).join("")}
    </ul>
  </div>`).join("")}
</section>

<!-- Compétences -->
<section style="margin-bottom: 18px;">
  <h2 style="font-size: 13px; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 0 0 6px;">Compétences</h2>
  <p style="font-size: 12px; margin: 0;">${skillItems}</p>
</section>

<!-- Formation -->
<section style="margin-bottom: 18px;">
  <h2 style="font-size: 13px; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 0 0 6px;">Formation</h2>
  ${cv.education.map(e => `<p style="font-size: 12px; margin: 2px 0;"><strong>${e.degree}</strong> — ${e.school}, ${e.year}</p>`).join("")}
</section>

${cv.languages.length ? `
<!-- Langues -->
<section style="margin-bottom: 18px;">
  <h2 style="font-size: 13px; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 0 0 6px;">Langues</h2>
  <p style="font-size: 12px; margin: 0;">${langText}</p>
</section>` : ""}

${cv.certifications.length ? `
<!-- Certifications -->
<section style="margin-bottom: 18px;">
  <h2 style="font-size: 13px; color: ${colors.primary}; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 0 0 6px;">Certifications</h2>
  <p style="font-size: 12px; margin: 0;">${certText}</p>
</section>` : ""}

</body></html>`;
}
