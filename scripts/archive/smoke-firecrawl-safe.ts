export {};

/**
 * Smoke test Firecrawl Safe — V2.6.4
 *
 * Teste uniquement des URLs autorisées définies localement.
 * Skip propre si FIRECRAWL_ENABLED=false ou FIRECRAWL_API_KEY absente.
 * Ne teste JAMAIS LinkedIn / Indeed / APEC en appel réseau.
 *
 * Usage : npx tsx scripts/smoke-firecrawl-safe.ts
 */

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function getEnv(key: string): string {
  return process.env[key] || "";
}

interface TestCase {
  label: string;
  url: string;
  expectedStatus: "allowed" | "refused" | "skipped";
  expectedReason?: string;
}

// URLs autorisées pour le smoke test
const AUTHORIZED_TESTS: TestCase[] = [
  {
    label: "Greenhouse (Stripe)",
    url: "https://boards.greenhouse.io/stripe",
    expectedStatus: "allowed",
    expectedReason: "allowed_public_ats",
  },
  {
    label: "Lever (Palantir)",
    url: "https://jobs.lever.co/palantir",
    expectedStatus: "allowed",
    expectedReason: "allowed_public_ats",
  },
  {
    label: "Ashby (Linear)",
    url: "https://jobs.ashbyhq.com/linear",
    expectedStatus: "allowed",
    expectedReason: "allowed_public_ats",
  },
];

// URLs refusées — testées uniquement en classification (pas d'appel réseau)
const REFUSED_TESTS: TestCase[] = [
  {
    label: "LinkedIn (refusé — pas d'appel réseau)",
    url: "https://www.linkedin.com/jobs/",
    expectedStatus: "refused",
    expectedReason: "refused_closed_platform",
  },
  {
    label: "Indeed (refusé — pas d'appel réseau)",
    url: "https://fr.indeed.com/",
    expectedStatus: "refused",
    expectedReason: "refused_closed_platform",
  },
  {
    label: "APEC (refusé — pas d'appel réseau)",
    url: "https://www.apec.fr/",
    expectedStatus: "refused",
    expectedReason: "refused_closed_platform",
  },
];

async function main() {
  console.log("\n=== Firecrawl Safe Smoke Test (V2.6.4) ===\n");

  const enabled = getEnv("FIRECRAWL_ENABLED") === "true";
  const apiKey = getEnv("FIRECRAWL_API_KEY");

  console.log(`FIRECRAWL_ENABLED: ${enabled ? GREEN + "true" + RESET : RED + "false" + RESET}`);
  console.log(`FIRECRAWL_API_KEY: ${apiKey ? GREEN + "présente" + RESET : YELLOW + "absente" + RESET}`);
  console.log("");

  // Phase 1 : Classification (toujours testable, pas besoin d'API key)
  console.log("--- Phase 1 : Classification (pure) ---\n");

  const { classifyFirecrawlEligibility } = await import(
    "../lib/jobs/connectors/firecrawl-safe"
  );

  let passed = 0;
  let failed = 0;

  // Tests refusés
  for (const tc of REFUSED_TESTS) {
    const result = classifyFirecrawlEligibility(tc.url, null, "");
    const ok = result.status === "refused" && (!tc.expectedReason || result.reasonCode === tc.expectedReason);
    if (ok) {
      console.log(`  ${GREEN}✓${RESET} ${tc.label} → ${result.status} / ${result.reasonCode}`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${tc.label} → attendu ${tc.expectedStatus}/${tc.expectedReason}, reçu ${result.status}/${result.reasonCode}`);
      failed++;
    }
  }

  // Tests autorisés
  for (const tc of AUTHORIZED_TESTS) {
    const result = classifyFirecrawlEligibility(tc.url, null, "");
    const ok = result.status === "allowed";
    if (ok) {
      console.log(`  ${GREEN}✓${RESET} ${tc.label} → ${result.status} / ${result.reasonCode}`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${tc.label} → attendu allowed, reçu ${result.status}/${result.reasonCode}`);
      failed++;
    }
  }

  // Phase 2 : Preview (nécessite API key + enabled)
  console.log("\n--- Phase 2 : Preview Firecrawl (réseau) ---\n");

  if (!enabled || !apiKey) {
    console.log(`  ${YELLOW}⚠${RESET} FIRECRAWL_ENABLED=false ou clé absente — skip de la phase réseau.`);
    console.log("  Configurez FIRECRAWL_ENABLED=true et FIRECRAWL_API_KEY=fc-... dans .env pour activer.\n");
  } else {
    // Simuler un appel preview (simple fetch local si serveur tourne)
    try {
      const res = await fetch("http://localhost:3000/api/jobs/firecrawl-safe/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: AUTHORIZED_TESTS[0].url }),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`  ${GREEN}✓${RESET} Preview ${AUTHORIZED_TESTS[0].label} → ${data.jobs?.length || 0} offres`);
        passed++;
      } else {
        console.log(`  ${YELLOW}⚠${RESET} Preview retournée: ${data.reasonCode} — ${data.message}`);
      }
    } catch {
      console.log(`  ${YELLOW}⚠${RESET} Serveur non atteignable — démarrez avec 'npm run dev' et réessayez.`);
    }
  }

  // Résumé
  console.log(`\n=== Résultat : ${passed} passed, ${failed} failed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`${RED}Erreur fatale:${RESET}`, e);
  process.exit(1);
});
