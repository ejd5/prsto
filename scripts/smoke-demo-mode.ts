/**
 * ELTON OS — Smoke test mode démo
 *
 * Usage :
 *   SMOKE_API_BASE=http://localhost:3000 npx tsx scripts/smoke-demo-mode.ts
 *
 * Prérequis :
 *   - Serveur Next.js lancé (npm run dev)
 *   - Aucune donnée [DEMO] préexistante (le test nettoie après lui-même)
 *
 * Ce que le test vérifie :
 *   0. POST /api/demo delete   → cleanup initial (nettoyage forcé)
 *   1. GET  /api/demo          → hasDemoData: false
 *   2. POST /api/demo create   → création dataset démo
 *   3. GET  /api/demo          → hasDemoData: true, compteurs > 0
 *   4. GET  /api/jobs?demo=true → toutes les offres sont [DEMO]
 *   5. GET  /api/jobs           → aucune offre [DEMO] (safe-by-default)
 *   6. GET  /api/jobs/application-pipeline?demo=true → drafts [DEMO]
 *   7. GET  /api/jobs/application-analytics?demo=true → KPIs non vides
 *   8. POST /api/demo delete   → suppression dataset
 *   9. GET  /api/demo          → hasDemoData: false (nettoyé)
 *
 * Sécurité : ne supprime que les données [DEMO].
 */

const BASE = process.env.SMOKE_API_BASE || "http://localhost:3000";

let errors = 0;
function fail(msg: string) {
  console.error(`  ❌ ${msg}`);
  errors++;
}
function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}

async function main() {
  console.log(`\n🧪 ELTON OS — Smoke test mode démo`);
  console.log(`   API: ${BASE}\n`);

  // ─── 0. Cleanup initial ───
  console.log("0. Nettoyage initial (force delete)");
  await fetch(`${BASE}/api/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete" }),
  });
  ok("delete forcé (ignore si déjà propre)");

  // ─── 1. Status initial ───
  console.log("1. Status initial (doit être propre)");
  const s1 = await fetch(`${BASE}/api/demo`).then((r) => r.json());
  if (s1.success && !s1.hasDemoData) ok("hasDemoData = false");
  else fail(`hasDemoData devrait être false, reçu: ${JSON.stringify(s1)}`);

  // ─── 2. Create ───
  console.log("2. Création dataset démo");
  const s2 = await fetch(`${BASE}/api/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create" }),
  }).then((r) => r.json());
  if (s2.success) ok("createDemoData OK");
  else fail(`createDemoData échec: ${s2.error}`);

  // ─── 3. Status après création ───
  console.log("3. Status après création");
  const s3 = await fetch(`${BASE}/api/demo`).then((r) => r.json());
  if (s3.success && s3.hasDemoData && s3.demoJobsCount >= 10 && s3.demoDraftsCount >= 6) {
    ok(`hasDemoData = true, ${s3.demoJobsCount} offres, ${s3.demoDraftsCount} drafts`);
  } else fail(`Compteurs insuffisants: ${JSON.stringify(s3)}`);

  // ─── 4. Jobs ?demo=true → toutes [DEMO] ───
  console.log("4. GET /api/jobs?demo=true → uniquement [DEMO]");
  const j4 = await fetch(`${BASE}/api/jobs?demo=true&limit=50`).then((r) => r.json());
  const allDemo = j4.jobs?.every((j: { title: string }) => j.title.startsWith("[DEMO]"));
  if (j4.jobs?.length > 0 && allDemo) ok(`${j4.jobs.length} offres, toutes [DEMO]`);
  else fail(`Offres non [DEMO] ou vides: ${j4.jobs?.length ?? 0} offres`);

  // ─── 5. Jobs sans paramètre → exclut [DEMO] ───
  console.log("5. GET /api/jobs → exclut [DEMO] (safe-by-default)");
  const j5 = await fetch(`${BASE}/api/jobs?limit=50`).then((r) => r.json());
  const noDemo = j5.jobs?.every((j: { title: string }) => !j.title.startsWith("[DEMO]"));
  if (j5.jobs && noDemo) ok(`${j5.jobs.length} offres, aucune [DEMO]`);
  else fail(`Offres [DEMO] trouvées en mode normal`);

  // ─── 6. Pipeline ?demo=true → drafts [DEMO] ───
  console.log("6. GET /api/jobs/application-pipeline?demo=true → drafts [DEMO]");
  const p = await fetch(`${BASE}/api/jobs/application-pipeline?demo=true`).then((r) => r.json());
  if (p.success && p.items && p.items.length >= 5 && p.stats && p.stats.total >= 5) {
    ok(`${p.items.length} drafts dans le pipeline, stats: sent=${p.stats.sent}, toFollowUp=${p.stats.toFollowUp}, followedUp=${p.stats.followedUp}, replied=${p.stats.recruiterReplied}, interview=${p.stats.interview}, offer=${p.stats.offer}, rejected=${p.stats.rejected}, archived=${p.stats.archived}`);
  } else fail(`Pipeline démo insuffisant: ${JSON.stringify({ total: p.items?.length, stats: p.stats })}`);

  // ─── 7. Analytics ?demo=true → KPIs non vides ───
  console.log("7. GET /api/jobs/application-analytics?demo=true → KPIs");
  const a = await fetch(`${BASE}/api/jobs/application-analytics?demo=true`).then((r) => r.json());
  if (a.success && a.summary && a.summary.totalSent >= 5 && a.bySource?.length >= 4 && a.weeklyActivity?.length > 0) {
    ok(`Analytics: ${a.summary.totalSent} sent, ${a.summary.recruiterReplied} replied, ${a.bySource.length} sources, ${a.weeklyActivity.length} semaines`);
  } else fail(`Analytics KPIs insuffisants: summary=${JSON.stringify(a.summary)}, bySource=${a.bySource?.length}, weekly=${a.weeklyActivity?.length}`);

  // ─── 8. Delete ───
  console.log("8. Suppression dataset démo");
  const d = await fetch(`${BASE}/api/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete" }),
  }).then((r) => r.json());
  if (d.success && d.deleted) ok(`deleteDemoData OK: ${JSON.stringify(d.deleted)}`);
  else fail(`deleteDemoData échec: ${JSON.stringify(d)}`);

  // ─── 9. Status final ───
  console.log("9. Status final");
  const s9 = await fetch(`${BASE}/api/demo`).then((r) => r.json());
  if (s9.success && !s9.hasDemoData) ok("hasDemoData = false (nettoyé)");
  else fail(`Nettoyage incomplet: ${JSON.stringify(s9)}`);

  // ─── Résultat ───
  console.log(`\n${errors === 0 ? "✅ Tous les tests passent" : `❌ ${errors} échec(s)`}\n`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n💥 Erreur fatale: ${e.message}`);
  console.error("   Vérifie que le serveur Next.js est lancé (npm run dev)");
  process.exit(1);
});
