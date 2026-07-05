// ─── Weekly Recommendations ───
// Pure function — no AI, no network, no side effects
// Generates actionable text recommendations from performance data

import type {
  GlobalPerformance,
  SourcePerformance,
  RolePerformance,
  PaysPerformance,
  BlockedOpportunity,
  ActionItem,
} from "./engine";

export interface WeeklyRecommendation {
  type: "positif" | "alerte" | "action" | "info";
  message: string;
  details?: string;
}

export function generateWeeklyRecommendations(params: {
  global: GlobalPerformance;
  sourcePerformance: SourcePerformance[];
  rolePerformance: RolePerformance[];
  countryPerformance: PaysPerformance[];
  blocked: BlockedOpportunity[];
  actions: ActionItem[];
}): WeeklyRecommendation[] {
  const recs: WeeklyRecommendation[] = [];
  const { global, sourcePerformance, rolePerformance, countryPerformance, blocked, actions } = params;

  // ─── Positive ──────────────────────────────────

  if (global.scoreMoyen >= 70) {
    recs.push({
      type: "positif",
      message: `Score moyen de ${global.scoreMoyen}/100 — la qualité des offres ciblées est bonne.`,
    });
  }

  if (global.tauxEntretien >= 30) {
    recs.push({
      type: "positif",
      message: `Taux d'entretien de ${global.tauxEntretien}% — les candidatures sont efficaces. Continuer sur cette lancée.`,
    });
  }

  if (global.tauxReponse >= 50) {
    recs.push({
      type: "positif",
      message: `${global.tauxReponse}% de taux de réponse — le ciblage et le message fonctionnent.`,
      details: "Les recruteurs répondent à plus d'une candidature sur deux.",
    });
  }

  // ─── Most promising source ─────────────────────

  const sourcesWithData = sourcePerformance.filter(s => s.nombreOffres >= 2 && s.scoreMoyen > 0);
  if (sourcesWithData.length > 0) {
    const bestSource = sourcesWithData.reduce((a, b) =>
      (b.scoreMoyen * b.nombreOffres) > (a.scoreMoyen * a.nombreOffres) ? b : a
    );
    recs.push({
      type: "info",
      message: `Source la plus prometteuse : ${bestSource.source} (${bestSource.nombreOffres} offres, score moyen ${bestSource.scoreMoyen}/100).`,
      details: bestSource.entretiens > 0
        ? `${bestSource.entretiens} entretien(s) déjà obtenu(s) via cette source.`
        : "Prioriser la prospection sur cette source cette semaine.",
    });
  }

  // ─── Most promising role ───────────────────────

  const rolesWithData = rolePerformance.filter(r => r.nombreOffres >= 2 && r.scoreMoyen > 0 && r.role !== "Autre");
  if (rolesWithData.length > 0) {
    const bestRole = rolesWithData.reduce((a, b) =>
      (b.scoreMoyen * b.nombreOffres + b.entretiens * 10) > (a.scoreMoyen * a.nombreOffres + a.entretiens * 10) ? b : a
    );
    recs.push({
      type: "info",
      message: `Rôle le plus prometteur : ${bestRole.role} (${bestRole.nombreOffres} offres, score moyen ${bestRole.scoreMoyen}/100).`,
      details: bestRole.entretiens > 0
        ? `${bestRole.entretiens} entretien(s) décroché(s) pour ce rôle.`
        : "Adapter le CV maître vers ce rôle en priorité.",
    });
  }

  // ─── Most promising country ─────────────────────

  const countriesWithData = countryPerformance.filter(c => c.nombreOffres >= 2 && c.pays !== "Inconnu");
  if (countriesWithData.length > 0) {
    const bestCountry = countriesWithData.reduce((a, b) =>
      (b.scoreMoyen * b.nombreOffres + b.entretiens * 10) > (a.scoreMoyen * a.nombreOffres + a.entretiens * 10) ? b : a
    );
    recs.push({
      type: "info",
      message: `Pays le plus prometteur : ${bestCountry.pays} (${bestCountry.nombreOffres} offres, score moyen ${bestCountry.scoreMoyen}/100).`,
      details: bestCountry.entretiens > 0
        ? `${bestCountry.entretiens} entretien(s) obtenu(s) dans ce pays.`
        : "Intensifier les candidatures vers ce pays cette semaine.",
    });
  }

  // ─── Alerts ────────────────────────────────────

  // Relances en retard
  if (global.relancesEnRetard > 0) {
    recs.push({
      type: "alerte",
      message: `${global.relancesEnRetard} relance(s) en retard — elles doivent être envoyées aujourd'hui.`,
      details: "Les relances en retard réduisent significativement les chances de réponse.",
    });
  }

  // Documents approved but not sent
  const actionEnvoiCount = actions.filter(a => a.categorie === "Envoi").length;
  if (actionEnvoiCount > 0) {
    recs.push({
      type: "alerte",
      message: `${actionEnvoiCount} document(s) approuvé(s) mais pas encore envoyé(s).`,
      details: "Chaque jour sans envoi réduit les chances d'être lu en premier.",
    });
  }

  // High priority untreated
  const actionHpCount = actions.filter(a => a.categorie === "Offre prioritaire").length;
  if (actionHpCount > 0) {
    recs.push({
      type: "alerte",
      message: `${actionHpCount} offre(s) high priority non traitée(s).`,
      details: "Les offres high priority doivent être traitées en priorité avant qu'elles n'expirent.",
    });
  }

  // Blocked opportunities
  if (blocked.length > 0) {
    const topBlocked = blocked.slice(0, 3).map(b => `${b.title} (${b.raison})`).join(" ; ");
    recs.push({
      type: "alerte",
      message: `${blocked.length} opportunité(s) bloquée(s) dans le pipeline.`,
      details: `Exemples : ${topBlocked}`,
    });
  }

  // Duplicates
  const actionDupCount = actions.filter(a => a.categorie === "Doublon").length;
  if (actionDupCount > 0) {
    recs.push({
      type: "alerte",
      message: `${actionDupCount} doublon(s) probable(s) à vérifier.`,
      details: "Les doublons faussent les statistiques et font perdre du temps.",
    });
  }

  // ─── Pipeline flow ─────────────────────────────

  if (global.candidaturesPretes > 0 && global.candidaturesEnvoyees === 0) {
    recs.push({
      type: "action",
      message: `${global.candidaturesPretes} candidature(s) prête(s) à envoyer. Passez à l'action.`,
      details: "Le pipeline est chargé mais rien n'est envoyé — l'action crée l'opportunité.",
    });
  }

  // AEviter: too many low-score opportunities
  if (global.aEviter > 0) {
    recs.push({
      type: "action",
      message: `${global.aEviter} offre(s) avec score ≤ 30 — envisagez de les archiver.`,
      details: "Les offres à faible score consomment du temps et de l'énergie pour peu de résultats.",
    });
  }

  // No relances planned
  if (global.candidaturesEnvoyees > 0 && global.relancesAFaire === 0 && global.relancesEnRetard === 0) {
    recs.push({
      type: "action",
      message: `${global.candidaturesEnvoyees} candidature(s) envoyée(s) sans relance planifiée. Programmez des relances J+5.`,
      details: "Les relances augmentent de 40% les chances d'obtenir une réponse.",
    });
  }

  // ─── Generic advice (if little data) ────────────

  if (global.totalOpportunites < 5) {
    recs.push({
      type: "action",
      message: "Moins de 5 offres dans le pipeline — intensifiez la prospection cette semaine.",
      details: "Ajoutez des sources, élargissez les rôles cibles, ou explorez de nouveaux pays.",
    });
  }

  if (global.opportunitesAnalysees === 0 && global.totalOpportunites > 0) {
    recs.push({
      type: "action",
      message: `Aucune offre analysée sur ${global.totalOpportunites}. Lancez des analyses pour prioriser.`,
      details: "Sans analyse, impossible de prioriser correctement les efforts.",
    });
  }

  if (global.documentsGeneres === 0 && global.opportunitesAnalysees > 0) {
    recs.push({
      type: "action",
      message: "Aucun document généré malgré des analyses disponibles. Générez vos premiers CV et lettres.",
      details: "Les documents sont le passage obligé vers l'envoi de candidatures.",
    });
  }

  // ─── Motivation ────────────────────────────────

  if (recs.filter(r => r.type === "positif").length === 0) {
    recs.push({
      type: "positif",
      message: `${global.totalOpportunites} offres dans le radar — chaque jour de travail vous rapproche de la signature.`,
      details: "La régularité est plus importante que la vitesse. Continuez.",
    });
  }

  return recs;
}
