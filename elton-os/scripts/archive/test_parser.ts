import { buildCvRenderData } from "./lib/cv-render/build-data";

const text = `PROFIL
Directeur Commercial senior avec plus de 20 ans d’expérience dans les secteurs FMCG, boissons et agroalimentaire. Expert en management d’équipes pluridisciplinaires (65 personnes), négociation grands comptes et Revenue Growth Management. Capacité à structurer des organisations commerciales, piloter la performance et fédérer autour d’une croissance rentable. Trilingue (français, anglais, portugais), également hispanophone.

EXPÉRIENCES PROFESSIONNELLES
Directeur Commercial — Delta Cafés France (Management de transition)
Septembre 2025 - Février 2026
• Conduit la restructuration de l’organisation commerciale multi-canal (On-Trade, CHR, GMS, E-commerce) ; mise en place d’une cadence commerciale structurée (pipeline, visites, rituels hebdomadaires).
• Optimisé la marge brute de +1,2 point via une approche Revenue Growth Management (mix valeur, gamme).

Directeur Commercial — Royal Swinkels Family Brewers
Janvier 2018 - Août 2025
• Dirigé la force de vente France (60 personnes) : pilotage P&L, budgets, stratégie multi-canaux (GMS, Cash & Carry, CHR).
• Négocié les accords nationaux et animé les plans régionaux ; managé une équipe pluridisciplinaire de 65 personnes.
• Mise en place d’un programme de formation interne pour 20 intégrations annuelles.

Directeur Commercial France & Export — Le Cabanon
Janvier 2014 - Décembre 2017
• Encadré 58 commerciaux et 9 directeurs régionaux ; développé le chiffre d’affaires de 0 à 32 M€.
• Négocié avec l’ensemble des centrales nationales GMS (négociation grands comptes) et obtenu un référencement national multi-enseignes.

Directeur des Ventes — Heineken
Septembre 2010 - Juillet 2014
• Managé les équipes GMS & CHR ; piloté CA et marge par région.
• Surperformé le marché de +4% sur le réseau CHR par l’activation des comptes clés.

CEO — Digialltech
Janvier 2007 - Juillet 2010
• Créé et piloté l’entreprise : vision, modèle économique, P&L, développement commercial et partenariats.

Directeur Adjoint — Shurgard
2005 - 2007
• Géré un centre de profit et développé le chiffre d’affaires local.

Key Account Manager — Brioche Pasquier
2002 - 2005
• Négocié les accords annuels avec Leclerc.

Ingénieur Commercial — Xerox
1998 - 2002
• Géré un portefeuille clients et acquis de nouveaux comptes.

FORMATION
• Master Management & Commerce International — NEGOSUP Paris (2000)

LANGUES
• Français (C2 – natif)
• Anglais (C1 – courant)
• Espagnol (C1 – courant)
• Portugais (C2 – bilingue)`;

const data = buildCvRenderData({
  profile: {} as any,
  generatedCvContent: text,
});

console.log(JSON.stringify(data.experiences, null, 2));
