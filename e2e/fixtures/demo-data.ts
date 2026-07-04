/**
 * Fixtures pour tests E2E — profils de démonstration.
 * Toutes les données sont fictives, aucun PII réel.
 */

export const DEMO_PROFILE = {
  fullName: "Jean Dupont",
  title: "Directeur Commercial",
  summary: "15 ans d'expérience en direction commerciale B2B, pilotage d'équipes de 50+ personnes, développement de marchés internationaux.",
  location: "Paris",
  email: "jean.dupont@example.com",
  phone: "06 12 34 56 78",
  sectors: JSON.stringify(["IT", "Télécoms", "SaaS"]),
  functions: JSON.stringify(["Direction commerciale"]),
  languages: JSON.stringify(["Français (natif)", "Anglais (courant)"]),
  education: JSON.stringify(["Master ESCP"]),
  certifications: JSON.stringify(["Certification SalesForce"]),
  yearsExp: 15,
  mobility: "France, Suisse, Belgique",
  targetSalary: "150-200K€",
};

export const MOCK_JOB_LINKEDIN = {
  title: "Directeur Commercial France H/F",
  company: "TechCorp France",
  location: "Paris",
  description: "Nous recherchons un Directeur Commercial pour piloter notre stratégie de croissance en France. Management d'une équipe de 30 personnes. Budget P&L de 15M€. Secteur SaaS B2B. Reporting au CEO.",
  sourceUrl: "https://www.linkedin.com/jobs/view/12345",
  sourceName: "LinkedIn",
  contractType: "CDI",
  salary: "120-150K€",
};

export const MOCK_JOB_INDEED = {
  title: "Country Manager France H/F",
  company: "GlobalTech SA",
  location: "Lyon",
  description: "Responsable du développement commercial France. Management équipe 20 personnes. CA 10M€. Secteur IT/Télécoms.",
  sourceUrl: "https://fr.indeed.com/viewjob/67890",
  sourceName: "Indeed",
  contractType: "CDI",
};

export const MOCK_JOB_APEC = {
  title: "Directeur National des Ventes",
  company: "Solutions Pro SAS",
  location: "Marseille",
  description: "Direction de l'équipe commerciale France. 25 personnes. P&L complet. Secteur services B2B.",
  sourceUrl: "https://www.apec.fr/offre/11111",
  sourceName: "APEC",
  contractType: "CDI",
};

export const MOCK_JOB_ATS = {
  title: "Sales Director EMEA",
  company: "SaaS International",
  location: "Paris",
  description: "Lead EMEA sales team of 40. Revenue target 25M€. Board-level reporting. International environment.",
  sourceUrl: "https://boards.greenhouse.io/saasint/jobs/99999",
  sourceName: "Greenhouse",
  contractType: "CDI",
  salary: "180-250K€",
};
