import { describe, it, expect } from "vitest";
import {
  calculateTauxReponse,
  calculateTauxEntretien,
  calculateTauxConversion,
  computeGlobalPerformance,
  computeSourcePerformance,
  computeRolePerformance,
  computeCountryPerformance,
  computeDailyActions,
  findBlockedOpportunities,
  matchRole,
  type RawOpportunity,
  type RawPriorityRole,
} from "@/lib/performance/engine";
import { generateWeeklyRecommendations } from "@/lib/performance/recommendations";

// ─── Helpers ─────────────────────────────────────

function mockOpp(overrides: Partial<RawOpportunity> = {}): RawOpportunity {
  return {
    id: "opp-1",
    title: "Directeur Commercial",
    company: "TechCorp",
    country: "France",
    sourceName: "LinkedIn",
    status: "nouveau",
    score: 75,
    priority: 0,
    duplicateStatus: "UNIQUE",
    analysis: null,
    documents: [],
    pipelineTask: null,
    relances: [],
    interviews: [],
    ...overrides,
  };
}

// ─── Taux calculations ───────────────────────────

describe("calculateTauxReponse", () => {
  it("renvoie 0 si aucune envoyée", () => {
    expect(calculateTauxReponse(0, 0)).toBe(0);
  });

  it("calcule correctement 50%", () => {
    expect(calculateTauxReponse(10, 5)).toBe(50);
  });

  it("renvoie 0 si 0 réponses", () => {
    expect(calculateTauxReponse(10, 0)).toBe(0);
  });

  it("arrondit à l'entier le plus proche", () => {
    expect(calculateTauxReponse(3, 1)).toBe(33);
  });
});

describe("calculateTauxEntretien", () => {
  it("renvoie 0 si aucune envoyée", () => {
    expect(calculateTauxEntretien(0, 0)).toBe(0);
  });

  it("calcule 20% correctement", () => {
    expect(calculateTauxEntretien(10, 2)).toBe(20);
  });
});

describe("calculateTauxConversion", () => {
  it("calcule correctement", () => {
    expect(calculateTauxConversion(5, 1)).toBe(20);
  });
});

// ─── matchRole ────────────────────────────────────

describe("matchRole", () => {
  const roles: RawPriorityRole[] = [
    { name: "Directeur Commercial" },
    { name: "Country Manager" },
    { name: "Business Developer" },
  ];

  it("trouve le rôle correspondant dans le titre", () => {
    expect(matchRole("Directeur Commercial H/F — Paris", roles)).toBe("Directeur Commercial");
  });

  it("ignore la casse et les accents", () => {
    expect(matchRole("DIRECTEUR COMMERCIAL confirmé", roles)).toBe("Directeur Commercial");
    expect(matchRole("directeur commercial", roles)).toBe("Directeur Commercial");
  });

  it("retourne Autre si aucun rôle ne correspond", () => {
    expect(matchRole("Développeur Full Stack", roles)).toBe("Autre");
  });

  it("retourne Autre si liste de rôles vide", () => {
    expect(matchRole("Directeur Commercial", [])).toBe("Autre");
  });

  it("match partiel — Country Manager dans une chaîne plus longue", () => {
    expect(matchRole("Senior Country Manager Europe", roles)).toBe("Country Manager");
  });
});

// ─── Global performance ──────────────────────────

describe("computeGlobalPerformance", () => {
  it("calcule les stats globales correctement", () => {
    const opps: RawOpportunity[] = [
      mockOpp({ id: "1", score: 80, analysis: { scoreGlobal: 80 } }),
      mockOpp({ id: "2", score: 75, analysis: { scoreGlobal: 60 } }),
      mockOpp({ id: "3", score: 20, analysis: null }),
      mockOpp({ id: "4", score: 90, priority: 1, pipelineTask: { column: "envoye", lastStatusChange: null }, documents: [
        { id: "d1", type: "cv_fr", status: "APPROVED" },
        { id: "d2", type: "lettre_fr", status: "DRAFT" },
      ]}),
      mockOpp({ id: "5", score: null, pipelineTask: { column: "entretien_rh", lastStatusChange: null } }),
    ];

    const g = computeGlobalPerformance(opps);

    expect(g.totalOpportunites).toBe(5);
    expect(g.opportunitesAnalysees).toBe(2);
    expect(g.scoreMoyen).toBe(66); // (80+75+20+90)/4 = 66.25 → 66
    expect(g.highPriority).toBe(3); // scores 80, 75, priority=1 sur opp4
    expect(g.aEviter).toBe(1); // score 20
    expect(g.documentsGeneres).toBe(2);
    expect(g.documentsApprouves).toBe(1);
    expect(g.candidaturesEnvoyees).toBe(2); // opp4=envoye, opp5=entretien_rh
    expect(g.entretiens).toBe(1);
    expect(g.tauxReponse).toBe(50); // 1 reponse / 2 envoyees
    expect(g.tauxEntretien).toBe(50); // 1 entretien / 2 envoyees
  });

  it("gère un tableau vide", () => {
    const g = computeGlobalPerformance([]);
    expect(g.totalOpportunites).toBe(0);
    expect(g.scoreMoyen).toBe(0);
    expect(g.tauxReponse).toBe(0);
    expect(g.tauxEntretien).toBe(0);
  });

  it("calcule pret_a_envoyer", () => {
    const opps = [mockOpp({ pipelineTask: { column: "pret_a_envoyer", lastStatusChange: null } })];
    expect(computeGlobalPerformance(opps).candidaturesPretes).toBe(1);
  });

  it("calcule offres et refus", () => {
    const opps = [
      mockOpp({ id: "1", pipelineTask: { column: "offre", lastStatusChange: null } }),
      mockOpp({ id: "2", pipelineTask: { column: "refus", lastStatusChange: null } }),
    ];
    const g = computeGlobalPerformance(opps);
    expect(g.offresRecues).toBe(1);
    expect(g.refus).toBe(1);
  });

  it("compte les relances à faire (non en retard)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const opps = [mockOpp({
      relances: [{ type: "email", status: "a_envoyer", scheduledDate: today }],
    })];
    expect(computeGlobalPerformance(opps).relancesAFaire).toBe(1);
  });

  it("compte les relances en retard", () => {
    const opps = [mockOpp({
      relances: [{ type: "email", status: "a_envoyer", scheduledDate: "2020-01-01" }],
    })];
    const g = computeGlobalPerformance(opps);
    expect(g.relancesEnRetard).toBe(1);
    expect(g.relancesAFaire).toBe(0);
  });
});

// ─── Source performance ──────────────────────────

describe("computeSourcePerformance", () => {
  it("groupe par sourceName", () => {
    const opps = [
      mockOpp({ id: "1", sourceName: "LinkedIn", score: 80 }),
      mockOpp({ id: "2", sourceName: "LinkedIn", score: 60 }),
      mockOpp({ id: "3", sourceName: "APEC", score: 70 }),
    ];

    const result = computeSourcePerformance(opps);
    expect(result.length).toBe(2);

    const linkedin = result.find(r => r.source === "LinkedIn")!;
    expect(linkedin.nombreOffres).toBe(2);
    expect(linkedin.scoreMoyen).toBe(70);

    const apec = result.find(r => r.source === "APEC")!;
    expect(apec.nombreOffres).toBe(1);
    expect(apec.scoreMoyen).toBe(70);
  });

  it("source manquante → Inconnue", () => {
    const opps = [mockOpp({ sourceName: null })];
    expect(computeSourcePerformance(opps)[0].source).toBe("Inconnue");
  });

  it("compte entretiens et réponses par source", () => {
    const opps = [
      mockOpp({ id: "1", sourceName: "LinkedIn", pipelineTask: { column: "entretien_rh", lastStatusChange: null } }),
      mockOpp({ id: "2", sourceName: "LinkedIn", pipelineTask: { column: "envoye", lastStatusChange: null } }),
    ];
    const linkedin = computeSourcePerformance(opps)[0];
    expect(linkedin.candidaturesEnvoyees).toBe(2);
    expect(linkedin.reponses).toBe(1);
    expect(linkedin.entretiens).toBe(1);
    expect(linkedin.tauxConversion).toBe(50);
  });

  it("trié par nombre d'offres décroissant", () => {
    const opps = [
      mockOpp({ id: "1", sourceName: "A" }),
      mockOpp({ id: "2", sourceName: "B" }),
      mockOpp({ id: "3", sourceName: "B" }),
    ];
    const result = computeSourcePerformance(opps);
    expect(result[0].source).toBe("B");
    expect(result[1].source).toBe("A");
  });
});

// ─── Role performance ────────────────────────────

describe("computeRolePerformance", () => {
  const roles: RawPriorityRole[] = [
    { name: "Directeur Commercial" },
    { name: "Country Manager" },
  ];

  it("groupe par rôle via matchRole", () => {
    const opps = [
      mockOpp({ id: "1", title: "Directeur Commercial France", score: 80 }),
      mockOpp({ id: "2", title: "Directeur Commercial Export", score: 70 }),
      mockOpp({ id: "3", title: "Country Manager Europe", score: 90 }),
      mockOpp({ id: "4", title: "Développeur Web", score: 50 }),
    ];

    const result = computeRolePerformance(opps, roles);
    const dc = result.find(r => r.role === "Directeur Commercial")!;
    expect(dc.nombreOffres).toBe(2);
    expect(dc.scoreMoyen).toBe(75);

    const cm = result.find(r => r.role === "Country Manager")!;
    expect(cm.nombreOffres).toBe(1);
    expect(cm.scoreMoyen).toBe(90);

    const autre = result.find(r => r.role === "Autre")!;
    expect(autre.nombreOffres).toBe(1);
  });

  it("calcule high priority par rôle", () => {
    const opps = [
      mockOpp({ id: "1", title: "Directeur Commercial", score: 85, priority: 0 }),
      mockOpp({ id: "2", title: "Directeur Commercial", score: 40, priority: 1 }),
      mockOpp({ id: "3", title: "Directeur Commercial", score: 30, priority: 0 }),
    ];
    const result = computeRolePerformance(opps, roles);
    expect(result[0].highPriority).toBe(2); // score >= 70 + priority=1
  });

  it("calcule taux entretien", () => {
    const opps = [
      mockOpp({ id: "1", title: "Country Manager", pipelineTask: { column: "envoye", lastStatusChange: null } }),
      mockOpp({ id: "2", title: "Country Manager", pipelineTask: { column: "entretien_rh", lastStatusChange: null } }),
    ];
    const result = computeRolePerformance(opps, roles);
    expect(result[0].tauxEntretien).toBe(50);
  });
});

// ─── Country performance ─────────────────────────

describe("computeCountryPerformance", () => {
  it("groupe par pays", () => {
    const opps = [
      mockOpp({ id: "1", country: "France", score: 80 }),
      mockOpp({ id: "2", country: "France", score: 70 }),
      mockOpp({ id: "3", country: "Suisse", score: 90 }),
    ];
    const result = computeCountryPerformance(opps);

    const france = result.find(r => r.pays === "France")!;
    expect(france.nombreOffres).toBe(2);
    expect(france.scoreMoyen).toBe(75);

    const suisse = result.find(r => r.pays === "Suisse")!;
    expect(suisse.nombreOffres).toBe(1);
  });

  it("pays manquant → Inconnu", () => {
    const opps = [mockOpp({ country: null })];
    expect(computeCountryPerformance(opps)[0].pays).toBe("Inconnu");
  });

  it("calcule taux de transformation", () => {
    const opps = [
      mockOpp({ id: "1", country: "France", pipelineTask: { column: "envoye", lastStatusChange: null } }),
      mockOpp({ id: "2", country: "France", pipelineTask: { column: "entretien_rh", lastStatusChange: null } }),
    ];
    const france = computeCountryPerformance(opps)[0];
    expect(france.tauxTransformation).toBe(50);
  });
});

// ─── findBlockedOpportunities ─────────────────────

describe("findBlockedOpportunities", () => {
  it("détecte high priority non analysée", () => {
    const opps = [mockOpp({ score: 85, analysis: null })];
    const blocked = findBlockedOpportunities(opps);
    expect(blocked.length).toBe(1);
    expect(blocked[0].raison).toContain("pas encore analysée");
  });

  it("détecte bon score sans documents", () => {
    const opps = [mockOpp({ score: 80, analysis: { scoreGlobal: 75 } })];
    const blocked = findBlockedOpportunities(opps);
    expect(blocked.length).toBe(1);
    expect(blocked[0].raison).toContain("document");
  });

  it("détecte pipeline stagnant", () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const opps = [mockOpp({
      score: 50, // not high priority, to avoid "pas encore analysée" catch
      pipelineTask: { column: "a_preparer", lastStatusChange: oldDate },
    })];
    const blocked = findBlockedOpportunities(opps);
    expect(blocked.length).toBe(1);
    expect(blocked[0].raison.toLowerCase()).toContain("bloqué");
    expect(blocked[0].joursBloque).toBeGreaterThanOrEqual(20);
  });

  it("détecte documents NEEDS_REVIEW bloquants", () => {
    const opps = [mockOpp({
      score: 50, // not high priority
      documents: [{ id: "d1", type: "cv_fr", status: "NEEDS_REVIEW" }],
      pipelineTask: { column: "document_a_valider", lastStatusChange: null },
    })];
    const blocked = findBlockedOpportunities(opps);
    expect(blocked.length).toBe(1);
    expect(blocked[0].raison).toContain("validation");
  });

  it("ne détecte pas une opp saine", () => {
    const recentDate = new Date().toISOString();
    const opps = [mockOpp({
      score: 75,
      analysis: { scoreGlobal: 75 },
      documents: [{ id: "d1", type: "cv_fr", status: "APPROVED" }],
      pipelineTask: { column: "pret_a_envoyer", lastStatusChange: recentDate },
    })];
    expect(findBlockedOpportunities(opps).length).toBe(0);
  });

  it("trié par joursBloque décroissant", () => {
    const date1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const date2 = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    const opps = [
      mockOpp({ id: "1", score: 50, pipelineTask: { column: "nouveau", lastStatusChange: date2 } }),
      mockOpp({ id: "2", score: 50, pipelineTask: { column: "a_analyser", lastStatusChange: date1 } }),
    ];
    const blocked = findBlockedOpportunities(opps);
    expect(blocked[0].id).toBe("2"); // 30j > 15j
  });
});

// ─── Daily actions ───────────────────────────────

describe("computeDailyActions", () => {
  it("détecte documents approuvés non envoyés", () => {
    const opps = [mockOpp({
      documents: [{ id: "d1", type: "cv_fr", status: "APPROVED" }],
      pipelineTask: null,
    })];
    const actions = computeDailyActions(opps);
    const envoi = actions.filter(a => a.categorie === "Envoi");
    expect(envoi.length).toBe(1);
    expect(envoi[0].priorite).toBe("haute");
  });

  it("détecte offres high priority non traitées", () => {
    const opps = [mockOpp({ score: 85 })]; // no pipelineTask
    const actions = computeDailyActions(opps);
    const hp = actions.filter(a => a.categorie === "Offre prioritaire");
    expect(hp.length).toBe(1);
  });

  it("détecte offres analysées sans documents", () => {
    const opps = [mockOpp({ score: 40, analysis: { scoreGlobal: 70 } })]; // no docs, not high priority
    const actions = computeDailyActions(opps);
    const docs = actions.filter(a => a.categorie === "Documents à générer");
    expect(docs.length).toBe(1);
  });

  it("détecte relances prévues aujourd'hui", () => {
    const today = new Date().toISOString().slice(0, 10);
    const opps = [mockOpp({
      relances: [{ type: "email", status: "a_envoyer", scheduledDate: today }],
    })];
    const actions = computeDailyActions(opps);
    const rel = actions.filter(a => a.categorie === "Relance");
    expect(rel.length).toBe(1);
  });

  it("détecte relances en retard", () => {
    const opps = [mockOpp({
      relances: [{ type: "email", status: "a_envoyer", scheduledDate: "2020-06-01" }],
    })];
    const actions = computeDailyActions(opps);
    const retard = actions.filter(a => a.categorie === "Relance en retard");
    expect(retard.length).toBe(1);
  });

  it("détecte entretiens à préparer", () => {
    const opps = [mockOpp({
      interviews: [{ status: "brouillon", date: null }],
    })];
    const actions = computeDailyActions(opps);
    const entre = actions.filter(a => a.categorie === "Entretien");
    expect(entre.length).toBe(1);
  });

  it("détecte les doublons probables", () => {
    const opps = [mockOpp({ duplicateStatus: "PROBABLE_DUPLICATE" })];
    const actions = computeDailyActions(opps);
    const dup = actions.filter(a => a.categorie === "Doublon");
    expect(dup.length).toBe(1);
  });

  it("détecte les documents à valider", () => {
    const opps = [mockOpp({
      documents: [{ id: "d1", type: "cv_fr", status: "NEEDS_REVIEW" }],
    })];
    const actions = computeDailyActions(opps);
    const val = actions.filter(a => a.categorie === "Validation");
    expect(val.length).toBe(1);
  });

  it("trié par priorité (haute > moyenne > basse)", () => {
    const opps = [
      mockOpp({ id: "1", duplicateStatus: "PROBABLE_DUPLICATE" }), // basse
      mockOpp({ id: "2", documents: [{ id: "d1", type: "cv_fr", status: "APPROVED" }] }), // haute (Envoi)
    ];
    const actions = computeDailyActions(opps);
    expect(actions[0].priorite).toBe("haute");
  });

  it("actions vides si tout est OK", () => {
    const opps = [mockOpp({
      score: 50, priority: 0, analysis: null, documents: [],
      pipelineTask: null, duplicateStatus: "UNIQUE",
    })];
    const actions = computeDailyActions(opps);
    expect(actions.length).toBe(0);
  });
});

// ─── Weekly recommendations ──────────────────────

describe("generateWeeklyRecommendations", () => {
  it("génère des recommandations avec des données", () => {
    const recs = generateWeeklyRecommendations({
      global: {
        totalOpportunites: 20, opportunitesAnalysees: 15, scoreMoyen: 75,
        highPriority: 5, aEviter: 2, documentsGeneres: 10, documentsApprouves: 5,
        candidaturesPretes: 3, candidaturesEnvoyees: 8, relancesAFaire: 2,
        relancesEnRetard: 1, entretiens: 3, offresRecues: 1, refus: 2,
        tauxReponse: 50, tauxEntretien: 38,
      },
      sourcePerformance: [
        { source: "LinkedIn", nombreOffres: 10, scoreMoyen: 80, nombreAnalysees: 8, documentsGeneres: 5, candidaturesEnvoyees: 4, reponses: 2, entretiens: 2, tauxConversion: 50 },
        { source: "APEC", nombreOffres: 5, scoreMoyen: 60, nombreAnalysees: 4, documentsGeneres: 3, candidaturesEnvoyees: 2, reponses: 1, entretiens: 1, tauxConversion: 50 },
      ],
      rolePerformance: [
        { role: "Directeur Commercial", nombreOffres: 8, scoreMoyen: 80, highPriority: 3, documentsGeneres: 5, envoyees: 3, entretiens: 2, tauxEntretien: 67 },
        { role: "Country Manager", nombreOffres: 5, scoreMoyen: 70, highPriority: 1, documentsGeneres: 3, envoyees: 2, entretiens: 1, tauxEntretien: 50 },
        { role: "Autre", nombreOffres: 7, scoreMoyen: 50, highPriority: 1, documentsGeneres: 2, envoyees: 3, entretiens: 0, tauxEntretien: 0 },
      ],
      countryPerformance: [
        { pays: "France", nombreOffres: 12, scoreMoyen: 75, highPriority: 4, relances: 3, entretiens: 2, tauxTransformation: 40 },
        { pays: "Suisse", nombreOffres: 5, scoreMoyen: 80, highPriority: 1, relances: 1, entretiens: 1, tauxTransformation: 50 },
      ],
      blocked: [
        { id: "1", title: "Directeur Commercial", company: "TechCorp", raison: "Bloqué depuis 20j dans « à préparer »", joursBloque: 20 },
      ],
      actions: [
        { priorite: "haute", categorie: "Envoi", description: "Country Manager — TechCorp", lien: "/opportunites/1", raison: "CV approuvé", action: "Envoyer" },
        { priorite: "haute", categorie: "Relance en retard", description: "Directeur — Acme", lien: "/opportunites/2", raison: "En retard", action: "Relancer" },
      ],
    });

    expect(recs.length).toBeGreaterThan(0);

    // Should have positive recs for good score
    const positifs = recs.filter(r => r.type === "positif");
    expect(positifs.length).toBeGreaterThan(0);

    // Should have info about best source
    const infos = recs.filter(r => r.type === "info");
    const sourceRec = infos.find(r => r.message.includes("LinkedIn"));
    expect(sourceRec).toBeDefined();

    // Should have alert about relances en retard
    const alertes = recs.filter(r => r.type === "alerte");
    const retardRec = alertes.find(r => r.message.includes("relance"));
    expect(retardRec).toBeDefined();

    // Should have alert about blocked opps
    const blockedRec = alertes.find(r => r.message.includes("bloquée"));
    expect(blockedRec).toBeDefined();
  });

  it("donne des conseils quand peu de données", () => {
    const recs = generateWeeklyRecommendations({
      global: {
        totalOpportunites: 3, opportunitesAnalysees: 0, scoreMoyen: 0,
        highPriority: 0, aEviter: 0, documentsGeneres: 0, documentsApprouves: 0,
        candidaturesPretes: 0, candidaturesEnvoyees: 0, relancesAFaire: 0,
        relancesEnRetard: 0, entretiens: 0, offresRecues: 0, refus: 0,
        tauxReponse: 0, tauxEntretien: 0,
      },
      sourcePerformance: [],
      rolePerformance: [],
      countryPerformance: [],
      blocked: [],
      actions: [],
    });

    const prospection = recs.find(r => r.message.includes("prospection"));
    expect(prospection).toBeDefined();
  });

  it("suggère de planifier des relances si aucune", () => {
    const recs = generateWeeklyRecommendations({
      global: {
        totalOpportunites: 10, opportunitesAnalysees: 5, scoreMoyen: 60,
        highPriority: 2, aEviter: 0, documentsGeneres: 5, documentsApprouves: 3,
        candidaturesPretes: 0, candidaturesEnvoyees: 5, relancesAFaire: 0,
        relancesEnRetard: 0, entretiens: 0, offresRecues: 0, refus: 0,
        tauxReponse: 0, tauxEntretien: 0,
      },
      sourcePerformance: [],
      rolePerformance: [],
      countryPerformance: [],
      blocked: [],
      actions: [],
    });

    const relancesRec = recs.find(r => r.message.includes("relance"));
    expect(relancesRec).toBeDefined();
  });

  it("recommande d'archiver les offres à éviter", () => {
    const recs = generateWeeklyRecommendations({
      global: {
        totalOpportunites: 20, opportunitesAnalysees: 10, scoreMoyen: 50,
        highPriority: 3, aEviter: 5, documentsGeneres: 5, documentsApprouves: 2,
        candidaturesPretes: 0, candidaturesEnvoyees: 3, relancesAFaire: 1,
        relancesEnRetard: 0, entretiens: 0, offresRecues: 0, refus: 1,
        tauxReponse: 33, tauxEntretien: 0,
      },
      sourcePerformance: [],
      rolePerformance: [],
      countryPerformance: [],
      blocked: [],
      actions: [],
    });

    const archiver = recs.find(r => r.message.includes("archiver"));
    expect(archiver).toBeDefined();
  });
});
