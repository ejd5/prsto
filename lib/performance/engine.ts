// ─── Performance Engine ───
// Pure functions — no AI, no network, no side effects
// Computes all performance stats from raw DB data

// ─── Raw input types (DB-agnostic) ────────────────

export interface RawOpportunity {
  id: string;
  title: string;
  company: string;
  country: string | null;
  sourceName: string | null;
  status: string;
  score: number | null;
  priority: number;
  duplicateStatus: string;
  analysis: { scoreGlobal: number | null } | null;
  documents: Array<{ id: string; type: string; status: string }>;
  pipelineTask: { column: string; lastStatusChange: string | null } | null;
  relances: Array<{ type: string; status: string; scheduledDate: string | null }>;
  interviews: Array<{ status: string; date: string | null }>;
}

export interface RawPriorityRole {
  name: string;
}

// ─── Output types ─────────────────────────────────

export interface GlobalPerformance {
  totalOpportunites: number;
  opportunitesAnalysees: number;
  scoreMoyen: number;
  highPriority: number;
  aEviter: number;
  documentsGeneres: number;
  documentsApprouves: number;
  candidaturesPretes: number;
  candidaturesEnvoyees: number;
  relancesAFaire: number;
  relancesEnRetard: number;
  entretiens: number;
  offresRecues: number;
  refus: number;
  tauxReponse: number;
  tauxEntretien: number;
}

export interface SourcePerformance {
  source: string;
  nombreOffres: number;
  scoreMoyen: number;
  nombreAnalysees: number;
  documentsGeneres: number;
  candidaturesEnvoyees: number;
  reponses: number;
  entretiens: number;
  tauxConversion: number;
}

export interface RolePerformance {
  role: string;
  nombreOffres: number;
  scoreMoyen: number;
  highPriority: number;
  documentsGeneres: number;
  envoyees: number;
  entretiens: number;
  tauxEntretien: number;
}

export interface PaysPerformance {
  pays: string;
  nombreOffres: number;
  scoreMoyen: number;
  highPriority: number;
  relances: number;
  entretiens: number;
  tauxTransformation: number;
}

export interface ActionItem {
  priorite: "haute" | "moyenne" | "basse";
  categorie: string;
  description: string;
  lien: string;
  raison: string;
  action: string;
}

// ─── Constants ────────────────────────────────────

const SENT_COLUMNS = ["envoye", "relance_1", "relance_2", "entretien_rh", "entretien_direction", "offre", "refus"];
const RESPONSE_COLUMNS = ["entretien_rh", "entretien_direction", "offre", "refus"];
const INTERVIEW_COLUMNS = ["entretien_rh", "entretien_direction"];
const PRET_A_ENVOYER = "pret_a_envoyer";

// ─── Rate calculations ────────────────────────────

export function calculateTauxReponse(envoyees: number, reponses: number): number {
  if (envoyees <= 0) return 0;
  return Math.round((reponses / envoyees) * 100);
}

export function calculateTauxEntretien(envoyees: number, entretiens: number): number {
  if (envoyees <= 0) return 0;
  return Math.round((entretiens / envoyees) * 100);
}

export function calculateTauxConversion(envoyees: number, entretiens: number): number {
  if (envoyees <= 0) return 0;
  return Math.round((entretiens / envoyees) * 100);
}

// ─── Helpers ──────────────────────────────────────

function avgOrZero(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

function isHighPriority(opp: RawOpportunity): boolean {
  return opp.priority === 1 || (opp.score !== null && opp.score >= 70);
}

function isSent(opp: RawOpportunity): boolean {
  return opp.pipelineTask !== null && SENT_COLUMNS.includes(opp.pipelineTask.column);
}

function isResponse(opp: RawOpportunity): boolean {
  return opp.pipelineTask !== null && RESPONSE_COLUMNS.includes(opp.pipelineTask.column);
}

function isInterview(opp: RawOpportunity): boolean {
  return opp.pipelineTask !== null && INTERVIEW_COLUMNS.includes(opp.pipelineTask.column);
}

function isOffer(opp: RawOpportunity): boolean {
  return opp.pipelineTask !== null && opp.pipelineTask.column === "offre";
}

function isRefus(opp: RawOpportunity): boolean {
  return opp.pipelineTask !== null && opp.pipelineTask.column === "refus";
}

function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ─── Role matching ────────────────────────────────

export function matchRole(title: string, priorityRoles: RawPriorityRole[]): string {
  if (priorityRoles.length === 0) return "Autre";
  const normalizedTitle = normalizeText(title);
  for (const role of priorityRoles) {
    const normalizedRole = normalizeText(role.name);
    if (normalizedTitle.includes(normalizedRole)) {
      return role.name;
    }
  }
  return "Autre";
}

// ─── Global performance ───────────────────────────

export function computeGlobalPerformance(opportunities: RawOpportunity[]): GlobalPerformance {
  const opps = opportunities;
  const scores = opps.map(o => o.score).filter((s): s is number => s !== null);

  const analysed = opps.filter(o => o.analysis !== null).length;
  const highPri = opps.filter(o => isHighPriority(o)).length;
  const avoid = opps.filter(o => o.score !== null && o.score > 0 && o.score <= 30).length;
  const docsGenerated = opps.reduce((sum, o) => sum + o.documents.length, 0);
  const docsApproved = opps.reduce((sum, o) => sum + o.documents.filter(d => d.status === "APPROVED").length, 0);
  const pretes = opps.filter(o => o.pipelineTask?.column === PRET_A_ENVOYER).length;
  const envoyees = opps.filter(o => isSent(o)).length;
  const reponses = opps.filter(o => isResponse(o)).length;
  const entretiens = opps.filter(o => isInterview(o)).length;
  const offres = opps.filter(o => isOffer(o)).length;
  const refus = opps.filter(o => isRefus(o)).length;

  const today = new Date().toISOString().slice(0, 10);
  const relancesAFaire = opps.reduce((sum, o) =>
    sum + o.relances.filter(r => r.status === "a_envoyer" && (!r.scheduledDate || r.scheduledDate >= today)).length, 0);
  const relancesRetard = opps.reduce((sum, o) =>
    sum + o.relances.filter(r => r.status === "a_envoyer" && r.scheduledDate !== null && r.scheduledDate < today).length, 0);

  return {
    totalOpportunites: opps.length,
    opportunitesAnalysees: analysed,
    scoreMoyen: avgOrZero(scores),
    highPriority: highPri,
    aEviter: avoid,
    documentsGeneres: docsGenerated,
    documentsApprouves: docsApproved,
    candidaturesPretes: pretes,
    candidaturesEnvoyees: envoyees,
    relancesAFaire,
    relancesEnRetard: relancesRetard,
    entretiens,
    offresRecues: offres,
    refus,
    tauxReponse: calculateTauxReponse(envoyees, reponses),
    tauxEntretien: calculateTauxEntretien(envoyees, entretiens + offres),
  };
}

// ─── Source performance ───────────────────────────

export function computeSourcePerformance(opportunities: RawOpportunity[]): SourcePerformance[] {
  const groups = new Map<string, RawOpportunity[]>();
  for (const opp of opportunities) {
    const key = opp.sourceName?.trim() || "Inconnue";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(opp);
  }

  const result: SourcePerformance[] = [];
  for (const [source, opps] of groups) {
    const scores = opps.map(o => o.score).filter((s): s is number => s !== null);
    const analysed = opps.filter(o => o.analysis !== null).length;
    const docs = opps.reduce((sum, o) => sum + o.documents.length, 0);
    const envoyees = opps.filter(o => isSent(o)).length;
    const reponses = opps.filter(o => isResponse(o)).length;
    const entretiens = opps.filter(o => isInterview(o)).length;

    result.push({
      source,
      nombreOffres: opps.length,
      scoreMoyen: avgOrZero(scores),
      nombreAnalysees: analysed,
      documentsGeneres: docs,
      candidaturesEnvoyees: envoyees,
      reponses,
      entretiens,
      tauxConversion: calculateTauxConversion(envoyees, entretiens),
    });
  }

  return result.sort((a, b) => b.nombreOffres - a.nombreOffres);
}

// ─── Role performance ─────────────────────────────

export function computeRolePerformance(opportunities: RawOpportunity[], priorityRoles: RawPriorityRole[]): RolePerformance[] {
  const groups = new Map<string, RawOpportunity[]>();
  for (const opp of opportunities) {
    const key = matchRole(opp.title, priorityRoles);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(opp);
  }

  const result: RolePerformance[] = [];
  for (const [role, opps] of groups) {
    const scores = opps.map(o => o.score).filter((s): s is number => s !== null);
    const highPri = opps.filter(o => isHighPriority(o)).length;
    const docs = opps.reduce((sum, o) => sum + o.documents.length, 0);
    const envoyees = opps.filter(o => isSent(o)).length;
    const entretiens = opps.filter(o => isInterview(o)).length;

    result.push({
      role,
      nombreOffres: opps.length,
      scoreMoyen: avgOrZero(scores),
      highPriority: highPri,
      documentsGeneres: docs,
      envoyees,
      entretiens,
      tauxEntretien: calculateTauxEntretien(envoyees, entretiens),
    });
  }

  return result.sort((a, b) => b.nombreOffres - a.nombreOffres);
}

// ─── Country performance ──────────────────────────

export function computeCountryPerformance(opportunities: RawOpportunity[]): PaysPerformance[] {
  const groups = new Map<string, RawOpportunity[]>();
  for (const opp of opportunities) {
    const key = opp.country?.trim() || "Inconnu";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(opp);
  }

  const result: PaysPerformance[] = [];
  for (const [pays, opps] of groups) {
    const scores = opps.map(o => o.score).filter((s): s is number => s !== null);
    const highPri = opps.filter(o => isHighPriority(o)).length;
    const relances = opps.reduce((sum, o) => sum + o.relances.length, 0);
    const envoyees = opps.filter(o => isSent(o)).length;
    const entretiens = opps.filter(o => isInterview(o)).length;

    result.push({
      pays,
      nombreOffres: opps.length,
      scoreMoyen: avgOrZero(scores),
      highPriority: highPri,
      relances,
      entretiens,
      tauxTransformation: calculateTauxConversion(envoyees, entretiens),
    });
  }

  return result.sort((a, b) => b.nombreOffres - a.nombreOffres);
}

// ─── Blocked opportunities ────────────────────────

export interface BlockedOpportunity {
  id: string;
  title: string;
  company: string;
  raison: string;
  joursBloque: number;
}

export function findBlockedOpportunities(opportunities: RawOpportunity[]): BlockedOpportunity[] {
  const blocked: BlockedOpportunity[] = [];
  const now = new Date();
  const STAGNANT_DAYS = 14;

  for (const opp of opportunities) {
    let found = false;

    // Pipeline stagnation (strongest signal — check first)
    const pt = opp.pipelineTask;
    if (pt && pt.lastStatusChange) {
      const lastChange = new Date(pt.lastStatusChange);
      const daysSince = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince > STAGNANT_DAYS) {
        const columnLabels: Record<string, string> = {
          nouveau: "nouveau",
          a_analyser: "à analyser",
          analyse: "analysé",
          a_preparer: "à préparer",
          document_a_valider: "documents à valider",
          pret_a_envoyer: "prêt à envoyer",
        };
        const col = columnLabels[pt.column];
        if (col) {
          blocked.push({
            id: opp.id,
            title: opp.title,
            company: opp.company,
            raison: `Bloqué depuis ${daysSince}j dans « ${col} »`,
            joursBloque: daysSince,
          });
          found = true;
        }
      }
    }

    if (found) continue;

    // Documents NEEDS_REVIEW blocking progress
    const needsReview = opp.documents.filter(d => d.status === "NEEDS_REVIEW").length;
    if (needsReview > 0 && pt) {
      const stuckColumns = ["a_preparer", "document_a_valider", "pret_a_envoyer"];
      if (stuckColumns.includes(pt.column)) {
        blocked.push({
          id: opp.id, title: opp.title, company: opp.company,
          raison: `${needsReview} document(s) en attente de validation`,
          joursBloque: 0,
        });
        found = true;
      }
    }

    if (found) continue;

    // Has analysis but no documents (good score)
    if (opp.analysis && opp.analysis.scoreGlobal !== null && opp.analysis.scoreGlobal >= 60 && opp.documents.length === 0) {
      blocked.push({
        id: opp.id, title: opp.title, company: opp.company,
        raison: "Bon score mais aucun document généré",
        joursBloque: 0,
      });
      found = true;
    }

    if (found) continue;

    // High priority but no analysis (lowest priority signal)
    if (isHighPriority(opp) && !opp.analysis) {
      blocked.push({
        id: opp.id, title: opp.title, company: opp.company,
        raison: "High priority — pas encore analysée",
        joursBloque: 0,
      });
    }
  }

  return blocked.sort((a, b) => b.joursBloque - a.joursBloque);
}

// ─── Daily action plan ────────────────────────────

export function computeDailyActions(opportunities: RawOpportunity[]): ActionItem[] {
  const actions: ActionItem[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // 1. Documents approved but not sent
  for (const opp of opportunities) {
    const hasApproved = opp.documents.some(d => d.status === "APPROVED");
    if (hasApproved && !isSent(opp)) {
      const approvedDocs = opp.documents.filter(d => d.status === "APPROVED").map(d => d.type.replace(/_/g, " ").toUpperCase()).join(", ");
      actions.push({
        priorite: "haute",
        categorie: "Envoi",
        description: `${opp.title} — ${opp.company}`,
        lien: `/opportunites/${opp.id}`,
        raison: `${approvedDocs} approuvé(s) — pas encore envoyé(s)`,
        action: "Envoyer la candidature",
      });
    }
  }

  // 2. High priority not treated (not in pipeline or in very early stage)
  for (const opp of opportunities) {
    if (isHighPriority(opp) && (!opp.pipelineTask || ["nouveau", "a_analyser"].includes(opp.pipelineTask.column))) {
      // Skip if already added
      if (actions.some(a => a.lien === `/opportunites/${opp.id}` && a.categorie === "Offre prioritaire")) continue;
      actions.push({
        priorite: "haute",
        categorie: "Offre prioritaire",
        description: `${opp.title} — ${opp.company} (score: ${opp.score ?? "—"})`,
        lien: `/opportunites/${opp.id}`,
        raison: "Offre high priority non traitée",
        action: "Analyser et préparer",
      });
    }
  }

  // 3. Analysed but no documents
  for (const opp of opportunities) {
    if (opp.analysis && opp.documents.length === 0) {
      if (actions.some(a => a.lien === `/opportunites/${opp.id}` && a.categorie === "Documents à générer")) continue;
      actions.push({
        priorite: "moyenne",
        categorie: "Documents à générer",
        description: `${opp.title} — ${opp.company}`,
        lien: `/opportunites/${opp.id}`,
        raison: "Offre analysée sans document",
        action: "Générer CV et lettre",
      });
    }
  }

  // 4. Relances scheduled for today
  for (const opp of opportunities) {
    const todayRelances = opp.relances.filter(r => r.status === "a_envoyer" && r.scheduledDate === today);
    if (todayRelances.length > 0) {
      if (actions.some(a => a.lien === `/opportunites/${opp.id}` && a.categorie === "Relance")) continue;
      actions.push({
        priorite: "haute",
        categorie: "Relance",
        description: `${opp.title} — ${opp.company}`,
        lien: `/opportunites/${opp.id}`,
        raison: `Relance prévue aujourd'hui`,
        action: "Envoyer la relance",
      });
    }
  }

  // 5. Relances en retard
  for (const opp of opportunities) {
    const lateRelances = opp.relances.filter(r => r.status === "a_envoyer" && r.scheduledDate !== null && r.scheduledDate < today);
    if (lateRelances.length > 0 && !actions.some(a => a.lien === `/opportunites/${opp.id}` && a.categorie === "Relance en retard")) {
      actions.push({
        priorite: "haute",
        categorie: "Relance en retard",
        description: `${opp.title} — ${opp.company}`,
        lien: `/opportunites/${opp.id}`,
        raison: `${lateRelances.length} relance(s) en retard depuis le ${lateRelances[0].scheduledDate}`,
        action: "Relancer maintenant",
      });
    }
  }

  // 6. Interviews to prepare (status brouillon)
  for (const opp of opportunities) {
    const brouillonInterviews = opp.interviews.filter(i => i.status === "brouillon");
    if (brouillonInterviews.length > 0 && !actions.some(a => a.categorie === "Entretien")) {
      actions.push({
        priorite: "haute",
        categorie: "Entretien",
        description: `${opp.title} — ${opp.company}`,
        lien: `/entretiens`,
        raison: "Préparation d'entretien à compléter",
        action: "Préparer l'entretien",
      });
    }
  }

  // 7. Probable duplicates
  for (const opp of opportunities) {
    if (opp.duplicateStatus !== "UNIQUE" && opp.duplicateStatus !== null) {
      if (actions.some(a => a.lien === `/opportunites/${opp.id}` && a.categorie === "Doublon")) continue;
      actions.push({
        priorite: "basse",
        categorie: "Doublon",
        description: `${opp.title} — ${opp.company}`,
        lien: `/opportunites/${opp.id}`,
        raison: "Doublon probable à vérifier",
        action: "Vérifier le doublon",
      });
    }
  }

  // 8. Documents to validate
  for (const opp of opportunities) {
    const needsReview = opp.documents.filter(d => d.status === "NEEDS_REVIEW");
    if (needsReview.length > 0 && !actions.some(a => a.lien === `/opportunites/${opp.id}` && a.categorie === "Validation")) {
      actions.push({
        priorite: "moyenne",
        categorie: "Validation",
        description: `${opp.title} — ${opp.company}`,
        lien: `/documents`,
        raison: `${needsReview.length} document(s) à valider`,
        action: "Relire et valider",
      });
    }
  }

  // Sort: haute > moyenne > basse
  const ordre = { haute: 0, moyenne: 1, basse: 2 };
  return actions.sort((a, b) => ordre[a.priorite] - ordre[b.priorite]);
}

// ─── Summary for recommendations ──────────────────

export interface PerformanceSnapshot {
  global: GlobalPerformance;
  sourcePerformance: SourcePerformance[];
  rolePerformance: RolePerformance[];
  countryPerformance: PaysPerformance[];
  blocked: BlockedOpportunity[];
  actions: ActionItem[];
}
