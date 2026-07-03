// ─── Executive Writing Styles ───
// Pure definitions — no AI, no network
// Each style influences length, tone, vocabulary, formality, business angle, persuasion

export interface ExecutiveStyle {
  id: string;
  label: string;
  description: string;
  length: "court" | "moyen" | "long";
  tone: string;
  vocabulaire: string;
  formalite: "basse" | "moyenne" | "haute";
  angleBusiness: string;
  persuasion: "douce" | "equilibree" | "forte";
  instructions: string; // Prompt fragment for AI
}

export const EXECUTIVE_STYLES: ExecutiveStyle[] = [
  // ── 1. Humain naturel ──────────────────────────
  {
    id: "humain",
    label: "Humain naturel",
    description: "Ton conversationnel, authentique, sans jargon excessif. Idéal pour startups et PME.",
    length: "moyen",
    tone: "chaleureux, direct, authentique",
    vocabulaire: "courant, sans jargon, concret",
    formalite: "basse",
    angleBusiness: "impact humain, culture d'équipe, résultats concrets",
    persuasion: "equilibree",
    instructions: `Rédige sur un ton humain et authentique, comme si tu parlais à un collègue.
Évite le jargon corporate. Utilise des phrases courtes et concrètes.
Parle de ce que tu as vraiment fait, pas de concepts abstraits.
Montre ta personnalité, pas un profil LinkedIn générique.`,
  },
  // ── 2. Corporate ───────────────────────────────
  {
    id: "corporate",
    label: "Corporate",
    description: "Formel, structuré, données chiffrées. Pour grands groupes et cabinets.",
    length: "long",
    tone: "professionnel, structuré, factuel",
    vocabulaire: "corporate, précis, orienté résultats",
    formalite: "haute",
    angleBusiness: "création de valeur, transformation, gouvernance, KPIs",
    persuasion: "equilibree",
    instructions: `Rédige dans un style corporate et structuré.
Utilise des données chiffrées issues du Proof Vault UNIQUEMENT.
Organise par résultats mesurables.
Le ton est professionnel, ni familier ni arrogant.
Chaque affirmation est étayée par un fait vérifié.`,
  },
  // ── 3. Direct ──────────────────────────────────
  {
    id: "direct",
    label: "Direct",
    description: "Franc, sans détour, orienté action. Pour environnements anglo-saxons.",
    length: "court",
    tone: "direct, assertif, orienté action",
    vocabulaire: "précis, percutant, verbes d'action",
    formalite: "basse",
    angleBusiness: "résultats rapides, impact immédiat, exécution",
    persuasion: "forte",
    instructions: `Rédige de manière directe et assertive.
Va droit au but. Pas de phrases d'introduction inutiles.
Chaque phrase doit apporter une information nouvelle.
Utilise des verbes d'action forts (dirigé, créé, transformé, accéléré).
Termine sur un call-to-action clair.`,
  },
  // ── 4. Premium ─────────────────────────────────
  {
    id: "premium",
    label: "Premium",
    description: "Raffiné, élégant, haut de gamme. Pour luxe, conseil en stratégie, M&A.",
    length: "moyen",
    tone: "élégant, sobre, maîtrisé",
    vocabulaire: "riche, nuancé, international",
    formalite: "haute",
    angleBusiness: "création de valeur exceptionnelle, rareté du profil, vision stratégique",
    persuasion: "douce",
    instructions: `Rédige dans un style premium et sobre.
L'élégance est dans la précision et la retenue, pas dans l'emphase.
Choisis chaque mot avec soin. Évite les superlatifs.
Le luxe ne se crie pas, il se suggère par la qualité des réalisations.
Mets en avant la rareté et l'impact stratégique du profil.`,
  },
  // ── 5. International ───────────────────────────
  {
    id: "international",
    label: "International",
    description: "Multiculturel, adapté à l'anglais business. Pour rôles globaux.",
    length: "moyen",
    tone: "cosmopolite, ouvert, multiculturel",
    vocabulaire: "anglais business international, termes globaux",
    formalite: "moyenne",
    angleBusiness: "vision globale, marchés émergents, expérience multiculturelle",
    persuasion: "equilibree",
    instructions: `Rédige pour un public international.
Utilise un anglais business standard, compréhensible par des non-natifs.
Mets en avant l'expérience multiculturelle, les langues, la mobilité.
Évite les références trop franco-françaises.
Les chiffres sont en anglais (M pour millions, K pour milliers).`,
  },
  // ── 6. Luxe ────────────────────────────────────
  {
    id: "luxe",
    label: "Luxe",
    description: "Inspiré du secteur luxe : storytelling, désirabilité, image de marque.",
    length: "moyen",
    tone: "raffiné, évocateur, aspirationnel",
    vocabulaire: "luxe, expérience client, maison, savoir-faire, exclusivité",
    formalite: "moyenne",
    angleBusiness: "brand equity, expérience client premium, rareté, désirabilité",
    persuasion: "douce",
    instructions: `Rédige en t'inspirant des codes du secteur luxe.
Storytelling maîtrisé : moins c'est plus.
Chaque mot compte. La qualité parle d'elle-même.
Mets en avant le savoir-faire, l'excellence opérationnelle, la relation client d'exception.
Le ton est feutré mais affirmé. Jamais de vulgarité commerciale.`,
  },
  // ── 7. Cabinet de recrutement ──────────────────
  {
    id: "cabinet",
    label: "Cabinet de recrutement",
    description: "Formaté pour chasseurs de têtes : synthétique, angles clés, différenciation.",
    length: "court",
    tone: "professionnel, synthétique, différenciant",
    vocabulaire: "executive search, atouts différenciants, track record",
    formalite: "moyenne",
    angleBusiness: "profil rare, adéquation parfaite, valeur ajoutée immédiate",
    persuasion: "equilibree",
    instructions: `Rédige comme pour un chasseur de têtes.
Synthétique et percutant. Le chasseur lit 50 CV par jour.
Les 3 premiers paragraphes sont décisifs.
Mets en avant ce qui rend le profil rare et différenciant.
Adéquation explicite avec le poste visé.
Format scannable en 30 secondes.`,
  },
  // ── 8. CEO / Board ─────────────────────────────
  {
    id: "ceo",
    label: "CEO / Board Level",
    description: "Niveau PDG, DG, board member. Vision stratégique, gouvernance.",
    length: "moyen",
    tone: "visionnaire, stratégique, exécutif",
    vocabulaire: "gouvernance, board, stratégie, shareholder value, EBITDA, M&A",
    formalite: "haute",
    angleBusiness: "création de valeur actionnariale, vision long terme, transformation",
    persuasion: "equilibree",
    instructions: `Rédige pour un niveau CEO / Board / COMEX.
Pense vision stratégique, pas tâches opérationnelles.
Parle création de valeur, gouvernance, transformation, croissance.
Le langage est celui du board : EBITDA, multiples, synergies, market share.
Démontre la capacité à dialoguer avec des investisseurs et des administrateurs.`,
  },
  // ── 9. Reconversion prudente ───────────────────
  {
    id: "reconversion",
    label: "Reconversion prudente",
    description: "Pour changements de secteur ou fonction. Rassurant, transférable, humble.",
    length: "moyen",
    tone: "réfléchi, humble, déterminé",
    vocabulaire: "compétences transférables, apprentissage, adaptation, ponts",
    formalite: "moyenne",
    angleBusiness: "compétences transférables, regard neuf, valeur ajoutée différente",
    persuasion: "douce",
    instructions: `Rédige pour une reconversion professionnelle.
Ne cache pas le changement, transforme-le en force.
Mets en avant les compétences transférables, pas l'historique strict.
Montre la cohérence du parcours, même si le secteur change.
Le ton est humble mais déterminé. La curiosité et l'adaptabilité sont des forces.`,
  },
  // ── 10. Très synthétique ───────────────────────
  {
    id: "synthetique",
    label: "Très synthétique",
    description: "Ultra-condensé, 1 page max, bullet points. Pour ATS et lecture rapide.",
    length: "court",
    tone: "ultra-condensé, factuel, scannable",
    vocabulaire: "mots-clés, verbes d'impact, chiffres clés",
    formalite: "moyenne",
    angleBusiness: "essentiel uniquement, impact maximal en mots minimaux",
    persuasion: "forte",
    instructions: `Rédige en mode ultra-synthétique.
Maximum 1 page. Chaque mot doit justifier sa place.
Utilise des bullet points concis.
Chiffres clés uniquement (pas de narratif).
Format optimisé pour lecture en diagonale et parsing ATS.
Les 5 premiers bullet points contiennent l'essentiel.`,
  },
];

// ─── Style lookup ─────────────────────────────────

export function getStyleById(id: string): ExecutiveStyle | undefined {
  return EXECUTIVE_STYLES.find(s => s.id === id);
}

export function getStylePrompt(id: string): string {
  const style = getStyleById(id);
  return style?.instructions || EXECUTIVE_STYLES[0].instructions;
}
