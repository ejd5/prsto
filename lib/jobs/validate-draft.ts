export function validateDraftConsistency(draft: Record<string, unknown>): { warnings: string[]; clean: boolean } {
  const warnings: string[] = [];

  // 1. Gaps detection dans le CV
  let gapsList: string[] = [];
  if (typeof draft.gaps === "string") {
    try { gapsList = JSON.parse(draft.gaps); } catch { gapsList = []; }
  }
  const resume = (draft.tailoredResumeContent as string) || "";
  const resumeLower = resume.toLowerCase();
  for (const g of gapsList) {
    const gLower = g.toLowerCase().trim();
    const keywords = gLower.split(/\s+/).filter(w => w.length > 3);
    const matchCount = keywords.filter(k => resumeLower.includes(k)).length;
    if (keywords.length > 0 && matchCount >= Math.ceil(keywords.length / 2)) {
      warnings.push(`Le gap "${g}" semble present dans le CV adapte alors qu'il est liste comme competence manquante.`);
    }
  }

  // 2. ConfirmedMatches vide avec matchScore eleve
  const score = Number(draft.matchScore) || 0;
  let confirmedList: string[] = [];
  if (typeof draft.confirmedMatches === "string") {
    try { confirmedList = JSON.parse(draft.confirmedMatches); } catch { confirmedList = []; }
  }
  if (confirmedList.length === 0 && score > 30) {
    warnings.push("Aucune competence confirmee alors que le score est de " + score + "/100 - analyse incomplete.");
  }

  // 3. Chiffres suspects (non verifiables)
  const numberPattern = /(\d{2,}[\s]*(?:[MkK]?[€$]|millions?|personnes|[%]))/g;
  const numbers = resume.match(numberPattern);
  if (numbers && numbers.length > 3) {
    warnings.push(`${numbers.length} resultats chiffres dans le CV - verifiez qu'ils sont bien issus de vos experiences.`);
  }

  // 4. Certifications/diplomes suspects
  const certPattern = /(?:diplome?|master|mba|doctorat|phd|licence|bachelor|certificat(?:ion)?)\s+(?:en\s+)?(?:de\s+)?([a-zéèêëàâùûüôöîïç]{5,})/gi;
  const certs = resume.match(certPattern);
  if (certs && certs.length > 3) {
    warnings.push(`${certs.length} formations/certifications detectees - verifiez qu'elles correspondent a votre profil.`);
  }

  return { warnings, clean: warnings.length === 0 };
}
