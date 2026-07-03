import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding real data for ELTON DUARTE...");

  // 1. Get profile
  let profile = await prisma.profile.findFirst();
  if (!profile) {
    console.log("Creating default profile...");
    profile = await prisma.profile.create({
      data: {
        fullName: "Elton Duarte",
        title: "Directeur Commercial",
        summary: "Directeur Commercial expérimenté avec plus de 15 ans d'expérience dans le secteur de la tech, du SaaS et de l'industrie. Spécialiste de la structuration d'équipes et de l'accélération de croissance.",
        phone: "+33 6 00 00 00 00",
        email: "elton.duarte@example.com",
        location: "Marseille, France",
        mobility: JSON.stringify(["PACA", "IDF", "France"]),
        languages: JSON.stringify(["Français", "Anglais"]),
        yearsExp: 15,
        sectors: JSON.stringify(["SaaS", "Industrie", "Fintech"]),
        functions: JSON.stringify(["Directeur Commercial", "VP Commercial", "Country Manager"]),
      },
    });
  }

  // 2. Get sources
  const srcLinkedIn = await prisma.jobSource.findFirst({ where: { name: "LinkedIn" } });
  const srcAPEC = await prisma.jobSource.findFirst({ where: { name: "APEC" } });
  const srcFT = await prisma.jobSource.findFirst({ where: { name: "France Travail" } });
  const srcWTTJ = await prisma.jobSource.findFirst({ where: { name: "Welcome to the Jungle" } });

  const linkedinId = srcLinkedIn?.id;
  const apecId = srcAPEC?.id;
  const ftId = srcFT?.id;
  const wttjId = srcWTTJ?.id;

  // 3. Create real opportunities
  console.log("Creating opportunities...");
  const opp1 = await prisma.opportunity.create({
    data: {
      title: "Directeur Commercial France H/F",
      company: "TechCorp SAS",
      location: "Marseille, PACA",
      country: "France",
      sourceName: "LinkedIn",
      jobSourceId: linkedinId,
      rawText: "Pilotage de la stratégie commerciale France. Équipe de 45 commerciaux, CA 35M€. Développement grands comptes et transformation commerciale.",
      salaryMin: 120000,
      salaryMax: 160000,
      contractType: "CDI",
      remote: "hybride",
      status: "analyse",
      score: 88,
      priority: 1,
      geoPriority: 1,
      geoScore: 100,
      roleScore: 90,
      globalScore: 88,
    },
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      title: "VP Commercial — Scale-up Fintech",
      company: "PayNext",
      location: "Paris, Île-de-France",
      country: "France",
      sourceName: "Welcome to the Jungle",
      jobSourceId: wttjId,
      rawText: "Définition et exécution de la stratégie go-to-market France et Benelux. Équipe de 30 personnes en croissance rapide.",
      salaryMin: 150000,
      salaryMax: 200000,
      contractType: "CDI",
      remote: "hybride",
      status: "nouveau",
      score: 91,
      priority: 1,
      geoPriority: 2,
      geoScore: 80,
      roleScore: 95,
      globalScore: 91,
    },
  });

  const opp3 = await prisma.opportunity.create({
    data: {
      title: "Directeur National des Ventes",
      company: "Maison Héritage",
      location: "Nice, PACA",
      country: "France",
      sourceName: "APEC",
      jobSourceId: apecId,
      rawText: "Direction du réseau de boutiques et des ventes B2B Sud-Est. Équipe de 80 conseillers. Stratégie omnicanale.",
      salaryMin: 90000,
      salaryMax: 120000,
      contractType: "CDI",
      remote: "présentiel",
      status: "postule",
      score: 75,
      priority: 0,
      geoPriority: 1,
      geoScore: 100,
      roleScore: 75,
      globalScore: 75,
    },
  });

  const opp4 = await prisma.opportunity.create({
    data: {
      title: "Country Manager France — Industrie",
      company: "BigIndustry Group",
      location: "Paris, Île-de-France",
      country: "France",
      sourceName: "APEC",
      jobSourceId: apecId,
      rawText: "Responsable du P&L France (80M€). Gestion de 3 business units et 200 collaborateurs. Stratégie de croissance et développement international.",
      salaryMin: 130000,
      salaryMax: 170000,
      contractType: "CDI",
      remote: "présentiel",
      status: "entretien",
      score: 82,
      priority: 1,
      geoPriority: 2,
      geoScore: 80,
      roleScore: 85,
      globalScore: 82,
    },
  });

  // 4. Create Analyses
  console.log("Creating analyses...");
  await prisma.analysis.create({
    data: {
      opportunityId: opp1.id,
      scoreGlobal: 88,
      keywordsAts: JSON.stringify(["direction commerciale", "SaaS B2B", "management", "grands comptes"]),
      exigences: JSON.stringify(["10+ ans d'expérience", "Management d'équipe", "Bilingue"]),
      risks: JSON.stringify(["Objectifs agressifs"]),
      gaps: JSON.stringify([]),
      pointsForts: JSON.stringify(["Localisation idéale à Marseille", "Forte expérience SaaS"]),
      matchDetails: JSON.stringify({
        businessFitScore: 90,
        salesLeadershipScore: 92,
        internationalFitScore: 80,
        executiveSeniorityScore: 88,
        riskScore: 3,
      }),
    },
  });

  await prisma.analysis.create({
    data: {
      opportunityId: opp2.id,
      scoreGlobal: 91,
      keywordsAts: JSON.stringify(["Fintech", "Go-To-Market", "Scale-up", "B2B"]),
      exigences: JSON.stringify(["Management d'équipe", "Structuration commerciale"]),
      risks: JSON.stringify([]),
      gaps: JSON.stringify([]),
      pointsForts: JSON.stringify(["Salaire attractif", "Excellent match de compétences"]),
      matchDetails: JSON.stringify({
        businessFitScore: 95,
        salesLeadershipScore: 95,
        internationalFitScore: 75,
        executiveSeniorityScore: 90,
        riskScore: 2,
      }),
    },
  });

  await prisma.analysis.create({
    data: {
      opportunityId: opp3.id,
      scoreGlobal: 75,
      keywordsAts: JSON.stringify(["Retail", "Omnicanal", "B2B", "Management"]),
      exigences: JSON.stringify(["Expérience Retail appréciée"]),
      risks: JSON.stringify(["Déplacements réguliers"]),
      gaps: JSON.stringify(["Expérience Retail limitée"]),
      pointsForts: JSON.stringify(["Proximité Nice"]),
      matchDetails: JSON.stringify({
        businessFitScore: 70,
        salesLeadershipScore: 80,
        internationalFitScore: 60,
        executiveSeniorityScore: 75,
        riskScore: 4,
      }),
    },
  });

  await prisma.analysis.create({
    data: {
      opportunityId: opp4.id,
      scoreGlobal: 82,
      keywordsAts: JSON.stringify(["P&L", "Industrie", "Country Manager", "Management"]),
      exigences: JSON.stringify(["Gestion de P&L significative"]),
      risks: JSON.stringify(["Présentiel strict"]),
      gaps: JSON.stringify([]),
      pointsForts: JSON.stringify(["Envergure du poste", "Management stratégique"]),
      matchDetails: JSON.stringify({
        businessFitScore: 85,
        salesLeadershipScore: 85,
        internationalFitScore: 80,
        executiveSeniorityScore: 82,
        riskScore: 3,
      }),
    },
  });

  // 5. Create Recruiter Contacts
  console.log("Creating contacts...");
  const contact1 = await prisma.recruiterContact.create({
    data: {
      fullName: "Marc Lemoine",
      email: "m.lemoine@robertwalters.fr",
      phone: "+33 6 12 34 56 78",
      companyName: "TechCorp SAS",
      firmName: "Robert Walters",
      contactType: "recruiter",
      relationshipStrength: "active",
      lastContactedAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  const contact2 = await prisma.recruiterContact.create({
    data: {
      fullName: "Sophie Bernard",
      email: "sophie.b@paynext.com",
      companyName: "PayNext",
      contactType: "hiring_manager",
      relationshipStrength: "new",
    },
  });

  // 6. Create Pipeline Tasks
  console.log("Creating pipeline tasks...");
  await prisma.pipelineTask.create({
    data: {
      opportunityId: opp1.id,
      column: "a_analyser",
      order: 1,
      notes: "Relancer Marc après validation du CV.",
      recruiterName: "Marc Lemoine",
    },
  });

  await prisma.pipelineTask.create({
    data: {
      opportunityId: opp3.id,
      column: "envoye",
      order: 1,
      notes: "Candidature envoyée via le site APEC.",
    },
  });

  await prisma.pipelineTask.create({
    data: {
      opportunityId: opp4.id,
      column: "entretien_rh",
      order: 1,
      notes: "Entretien planifié pour lundi prochain.",
    },
  });

  console.log("✅ Real data successfully seeded for ELTON DUARTE!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
