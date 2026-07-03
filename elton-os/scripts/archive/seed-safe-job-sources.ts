import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma";
import { classifyFirecrawlEligibility } from "../lib/jobs/connectors/firecrawl-safe";
import { extractDomain } from "../lib/jobs/source-capability-scanner";

const prisma = new PrismaClient();

interface SafeSourceCandidate {
  label: string;
  url: string;
  maxPagesPerRun: number;
  maxJobsPerRun: number;
  notes?: string;
}

const SAFE_SOURCES: SafeSourceCandidate[] = [
  // Greenhouse (ATS public)
  { label: "Stripe — Greenhouse", url: "https://boards.greenhouse.io/stripe", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Paiement en ligne, siège US" },
  { label: "Airbnb — Greenhouse", url: "https://boards.greenhouse.io/airbnb", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Plateforme de voyage" },
  { label: "Notion — Greenhouse", url: "https://boards.greenhouse.io/notion", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Productivité/collaboration" },
  { label: "Figma — Greenhouse", url: "https://boards.greenhouse.io/figma", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Design collaboratif" },
  { label: "Datadog — Greenhouse", url: "https://boards.greenhouse.io/datadog", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Observabilité/cloud" },

  // Lever (ATS public)
  { label: "Spotify — Lever", url: "https://jobs.lever.co/spotify", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Streaming musical" },
  { label: "Netflix — Lever", url: "https://jobs.lever.co/netflix", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Streaming vidéo, siège US" },

  // Ashby (ATS public)
  { label: "Linear — Ashby", url: "https://jobs.ashbyhq.com/linear", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Outil de gestion de projet" },
  { label: "Vercel — Ashby", url: "https://jobs.ashbyhq.com/vercel", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Plateforme de déploiement frontend" },

  // Workable (ATS public)
  { label: "Deel — Workable", url: "https://apply.workable.com/deel", maxPagesPerRun: 1, maxJobsPerRun: 20, notes: "Solution de télétravail/paie" },

  // Pages carrières publiques
  { label: "Schneider Electric — Carrières", url: "https://careers.se.com/", maxPagesPerRun: 2, maxJobsPerRun: 20, notes: "Gestion de l'énergie, siège FR" },
  { label: "L'Oréal — Carrières", url: "https://careers.loreal.com/", maxPagesPerRun: 2, maxJobsPerRun: 20, notes: "Cosmétique, siège FR" },
  { label: "Sanofi — Carrières", url: "https://www.sanofi.com/en/careers", maxPagesPerRun: 2, maxJobsPerRun: 20, notes: "Pharmaceutique, siège FR" },
  { label: "Legrand — Carrières", url: "https://www.legrandgroup.com/fr/recrutement", maxPagesPerRun: 2, maxJobsPerRun: 20, notes: "Équipement électrique, siège FR" },
  { label: "Accor — Carrières", url: "https://careers.accor.com/", maxPagesPerRun: 2, maxJobsPerRun: 20, notes: "Hôtellerie, siège FR" },
];

async function seed(): Promise<void> {
  console.log("🌱 Seed Safe Job Sources — Go-live contrôlé\n");
  console.log(`📋 ${SAFE_SOURCES.length} sources candidates à évaluer...\n`);

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let refused = 0;

  for (const src of SAFE_SOURCES) {
    const eligibility = classifyFirecrawlEligibility(src.url, null, "");
    if (eligibility.status !== "allowed") {
      console.log(`❌ REFUSÉ : ${src.label}`);
      console.log(`   Motif : ${eligibility.reasonCode} — ${eligibility.detail}`);
      refused++;
      continue;
    }

    const domain = extractDomain(src.url);

    let sourceType = "career_page";
    let atsVendor: string | null = null;
    if (/greenhouse\.io/i.test(domain)) { sourceType = "ats"; atsVendor = "greenhouse"; }
    else if (/lever\.co/i.test(domain)) { sourceType = "ats"; atsVendor = "lever"; }
    else if (/ashbyhq\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "ashby"; }
    else if (/workable\.com/i.test(domain)) { sourceType = "ats"; atsVendor = "workable"; }

    const importMode = eligibility.reasonCode === "allowed_public_ats" ? "ATS_PUBLIC" :
      eligibility.reasonCode === "allowed_jsonld" ? "AUTO_JSONLD" : "AUTO_PUBLIC_CAREERS";

    const existing = await prisma.safeJobSource.findFirst({
      where: { normalizedDomain: domain, url: src.url },
    });

    if (existing) {
      // Comparer pour éviter une mise à jour inutile
      const isUnchanged =
        existing.label === src.label &&
        existing.sourceType === sourceType &&
        existing.atsVendor === atsVendor &&
        existing.importMode === importMode &&
        existing.maxPagesPerRun === src.maxPagesPerRun &&
        existing.maxJobsPerRun === src.maxJobsPerRun &&
        (existing.notes === src.notes || (!existing.notes && !src.notes));

      if (isUnchanged) {
        unchanged++;
        console.log(`⏭️  INCHANGÉ : ${src.label} → ${domain}`);
      } else {
        await prisma.safeJobSource.update({
          where: { id: existing.id },
          data: {
            label: src.label,
            sourceType,
            atsVendor,
            importMode,
            maxPagesPerRun: src.maxPagesPerRun,
            maxJobsPerRun: src.maxJobsPerRun,
            notes: src.notes || null,
          },
        });
        updated++;
        console.log(`♻️  MIS À JOUR : ${src.label} → ${domain}`);
      }
    } else {
      await prisma.safeJobSource.create({
        data: {
          label: src.label,
          url: src.url,
          normalizedDomain: domain,
          sourceType,
          atsVendor,
          importMode,
          enabled: false,
          maxPagesPerRun: src.maxPagesPerRun,
          maxJobsPerRun: src.maxJobsPerRun,
          notes: src.notes || null,
        },
      });
      created++;
      console.log(`✅ CRÉÉ : ${src.label} → ${domain}`);
    }
  }

  console.log(`\n📊 Résumé : ${created} créées, ${updated} mises à jour, ${unchanged} inchangées, ${refused} refusées`);
  if (refused > 0) {
    console.log("⚠️  Les sources refusées doivent être importées via l'extension Chrome.");
  }
  console.log("📌 Toutes les sources sont créées avec enabled=false (activation manuelle requise).");
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
