"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Zap, AlertTriangle, ExternalLink, Eye, RefreshCw, CheckCircle2, XCircle, Play, Download, Clock } from "lucide-react";
import Link from "next/link";
import { SkeletonRow } from "@/components/ui/SkeletonCard";

interface SourceRow {
  id: string;
  name: string;
  type: string;
  capability: {
    sourceId: string;
    name: string;
    url: string;
    domain: string;
    platformType: string;
    importMode: string;
    supportsApi: boolean;
    supportsAtsEndpoint: boolean;
    supportsJsonLd: boolean;
    supportsRss: boolean;
    blocksServerFetch: boolean;
    requiresUserAction: boolean;
    lastCheckedAt: string | null;
    lastStatus: string | null;
    notes: string | null;
  } | null;
  jobCount: number;
  enabled: boolean;
  status: string;
  lastRunAt: string | null;
}

interface ImportResult {
  fetched: number;
  created: number;
  duplicates: number;
  errors: string[];
  sample: Array<{ title: string; company: string; location?: string }>;
  dryRun: boolean;
  importMode: string;
}

const MODE_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  API_OFFICIAL: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "API Officielle" },
  ATS_PUBLIC: { bg: "rgba(59,130,246,0.15)", fg: "#3b82f6", label: "ATS Public" },
  PUBLIC_CAREERS: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "Carrières" },
  AUTO_API: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "API" },
  AUTO_ATS: { bg: "rgba(59,130,246,0.15)", fg: "#3b82f6", label: "ATS" },
  AUTO_JSONLD: { bg: "rgba(139,92,246,0.15)", fg: "#8b5cf6", label: "JSON-LD" },
  AUTO_RSS: { bg: "rgba(245,158,11,0.15)", fg: "#f59e0b", label: "RSS" },
  AUTO_PUBLIC_CAREERS: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "Public Auto" },
  AUTO_FIRECRAWL_SAFE: { bg: "rgba(34,197,94,0.15)", fg: "#16a34a", label: "Firecrawl" },
  USER_ASSISTED: { bg: "rgba(234,179,8,0.15)", fg: "#eab308", label: "Action requise" },
  MANUAL_ONLY: { bg: "rgba(107,114,128,0.15)", fg: "#9ca3af", label: "Manuel" },
  BLOCKED: { bg: "rgba(220,38,38,0.15)", fg: "#dc2626", label: "Bloqué" },
};

export default function SourceScannerPage() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  // Import contrôlé par source
  const [importingSource, setImportingSource] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<Record<string, ImportResult>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/source-scanner/list");
      const data = await res.json();
      setSources(data.sources || []);
    } catch { setSources([]); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const [runningCron, setRunningCron] = useState(false);

  const handleScanAll = async () => {
    setScanning(true);
    setMessage("");
    try {
      const res = await fetch("/api/jobs/source-scanner/scan", { method: "POST" });
      const data = await res.json();
      setMessage(`${data.scanned} sources scannées. AUTO: ${data.byMode?.AUTO_API + data.byMode?.AUTO_ATS + data.byMode?.AUTO_JSONLD + data.byMode?.AUTO_RSS || 0}, USER_ASSISTED: ${data.byMode?.USER_ASSISTED || 0}, MANUAL: ${data.byMode?.MANUAL_ONLY || 0}`);
      await load();
    } catch { setMessage("Erreur lors du scan"); }
    setScanning(false);
  };

  const handleRunCron = async (dryRun: boolean) => {
    setRunningCron(true);
    setMessage("");
    try {
      const res = await fetch("/api/jobs/cron/sourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, maxSources: 3, maxJobsPerSource: 10, maxTotalJobs: 30 }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(`Erreur cron: ${data.error}`);
      } else {
        const prefix = dryRun ? "🔍 DRY RUN" : "✅ CRON";
        setMessage(`${prefix}: ${data.sourcesScanned} sources, ${data.jobsFetched} offres trouvées, ${data.jobsCreated} créées, ${data.rejectedByProfile} filtrées par profil, ${data.duplicatesSkipped} doublons`);
      }
      await load();
    } catch { setMessage("Erreur lors du cron"); }
    setRunningCron(false);
  };

  const handleImportSource = async (sourceId: string, dryRun: boolean, maxJobs: number) => {
    setImportingSource(sourceId);
    try {
      const res = await fetch("/api/jobs/source-scanner/import-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, dryRun, maxJobs }),
      });
      const data: ImportResult & { error?: string; importMode?: string } = await res.json();
      if (data.error && !data.fetched) {
        // Erreur de la route (source refusée)
        setImportResults((prev) => ({
          ...prev,
          [sourceId]: {
            fetched: 0, created: 0, duplicates: 0,
            errors: [data.error || "Erreur inconnue"],
            sample: [], dryRun, importMode: data.importMode || "?",
          },
        }));
      } else {
        setImportResults((prev) => ({
          ...prev,
          [sourceId]: {
            fetched: data.fetched || 0,
            created: data.created || 0,
            duplicates: data.duplicates || 0,
            errors: data.errors || [],
            sample: data.sample || [],
            dryRun,
            importMode: data.importMode || "?",
          },
        }));
      }
      if (!dryRun && data.created) await load();
    } catch {
      setImportResults((prev) => ({
        ...prev,
        [sourceId]: {
          fetched: 0, created: 0, duplicates: 0,
          errors: ["Erreur réseau"],
          sample: [], dryRun, importMode: "?",
        },
      }));
    }
    setImportingSource(null);
  };

  const autoSources = sources.filter((s) => s.capability?.importMode?.startsWith("AUTO"));
  const firecrawlSources = sources.filter((s) =>
    s.capability?.importMode === "AUTO_PUBLIC_CAREERS" ||
    s.capability?.importMode === "AUTO_FIRECRAWL_SAFE" ||
    s.capability?.importMode === "ATS_PUBLIC" ||
    s.capability?.importMode === "PUBLIC_CAREERS" ||
    s.capability?.importMode === "API_OFFICIAL"
  );
  const assistedSources = sources.filter((s) => s.capability?.importMode === "USER_ASSISTED");
  const blockedSources = sources.filter((s) => s.capability?.importMode === "BLOCKED");
  const otherSources = sources.filter((s) => !s.capability || s.capability.importMode === "MANUAL_ONLY");

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold mb-1" style={{ color: "var(--texte)" }}>
            <Search size={20} className="inline mr-2" style={{ color: "var(--or)" }} />
            Source Scanner
          </h1>
          <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
            Audit des ~30 sources. Testez et importez depuis les sources compatibles.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleScanAll} disabled={scanning}
            className="px-4 py-2 rounded-md text-xs font-mono font-bold text-black"
            style={{ background: scanning ? "var(--bordure-douce)" : "var(--or)", opacity: scanning ? 0.7 : 1 }}>
            {scanning ? (
              <><Loader2 size={12} className="inline mr-1 animate-spin" /> Scan en cours…</>
            ) : (
              <><RefreshCw size={12} className="inline mr-1" /> Scanner toutes les sources</>
            )}
          </button>
          <button onClick={() => handleRunCron(true)} disabled={runningCron}
            className="px-3 py-2 rounded-md text-xs font-mono border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", opacity: runningCron ? 0.6 : 1 }}>
            {runningCron ? <Loader2 size={12} className="inline mr-1 animate-spin" /> : <Clock size={12} className="inline mr-1" />}
            Dry Run Cron
          </button>
          <button onClick={() => handleRunCron(false)} disabled={runningCron}
            className="px-3 py-2 rounded-md text-xs font-mono font-bold text-black"
            style={{ background: "#22c55e", opacity: runningCron ? 0.6 : 1 }}>
            {runningCron ? <Loader2 size={12} className="inline mr-1 animate-spin" /> : <Clock size={12} className="inline mr-1" />}
            Lancer Cron
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 mb-4 rounded-lg text-xs font-mono" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
          <CheckCircle2 size={12} className="inline mr-1" /> {message}
        </div>
      )}

      {/* Avertissement */}
      <div className="p-3 mb-6 rounded-lg border flex items-start gap-2 text-xs"
        style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          Les sources marquées <strong>&ldquo;Bloqué&rdquo;</strong> (LinkedIn, Indeed, APEC) ne peuvent pas être automatisées.
          Utilisez l&apos;<Link href="/dashboard/jobs/importer/extension" style={{ color: "var(--or)", textDecoration: "underline" }}>extension Chrome</Link> pour ces plateformes.
          Pour les pages carrières publiques, utilisez{" "}
          <Link href="/dashboard/jobs/importer/firecrawl-safe" style={{ color: "var(--or)", textDecoration: "underline" }}>Firecrawl Safe</Link>.
          {" "}Gérez vos sources autorisées dans le{" "}
          <Link href="/dashboard/jobs/sources" style={{ color: "var(--or)", textDecoration: "underline" }}>registre de sources</Link>.
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-6 w-48 rounded mb-4" style={{ background: "var(--bordure)" }} />
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Auto sources */}
          <Section title="Sources automatiques" icon={<Zap size={14} />} color="#22c55e" count={autoSources.length}>
            <SourceTable
              sources={autoSources}
              importingSource={importingSource}
              importResults={importResults}
              onTestImport={(id) => handleImportSource(id, true, 10)}
              onImport10={(id) => handleImportSource(id, false, 10)}
              showImportControls
            />
          </Section>

          {/* Firecrawl Safe sources */}
          {firecrawlSources.length > 0 && (
            <Section title="Firecrawl Safe" icon={<Zap size={14} />} color="#16a34a" count={firecrawlSources.length}>
              <SourceTable
                sources={firecrawlSources}
                importingSource={importingSource}
                importResults={importResults}
                onTestImport={undefined}
                onImport10={undefined}
                showFirecrawlAction
              />
            </Section>
          )}

          {/* Blocked sources */}
          {blockedSources.length > 0 && (
            <Section title="Bloquées" icon={<XCircle size={14} />} color="#dc2626" count={blockedSources.length}>
              <SourceTable
                sources={blockedSources}
                importingSource={importingSource}
                importResults={importResults}
                onTestImport={undefined}
                onImport10={undefined}
                showImportAssisted
              />
            </Section>
          )}

          {/* User-assisted sources */}
          <Section title="Sources nécessitant votre action" icon={<Eye size={14} />} color="#eab308" count={assistedSources.length}>
            <SourceTable
              sources={assistedSources}
              importingSource={importingSource}
              importResults={importResults}
              onTestImport={undefined}
              onImport10={undefined}
              showImportExpress
            />
          </Section>

          {/* Other / Unscanned */}
          {otherSources.length > 0 && (
            <Section title="Autres sources" icon={<XCircle size={14} />} color="#9ca3af" count={otherSources.length}>
              <SourceTable
                sources={otherSources}
                importingSource={importingSource}
                importResults={importResults}
                onTestImport={undefined}
                onImport10={undefined}
              />
            </Section>
          )}

          {sources.length === 0 && (
            <div className="p-8 text-center rounded-lg border border-dashed" style={{ borderColor: "var(--bordure-douce)" }}>
              <Search size={28} style={{ color: "var(--texte-tertiaire)", margin: "0 auto" }} />
              <p className="text-sm mt-3" style={{ color: "var(--texte-secondaire)" }}>Aucune source scannée.</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Cliquez sur &ldquo;Scanner toutes les sources&rdquo; pour démarrer l&apos;audit.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, color, count, children }: {
  title: string; icon: React.ReactNode; color: string; count: number; children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color }}>
        {icon} {title} ({count})
      </h3>
      {children}
    </div>
  );
}

function SourceTable({
  sources,
  showImportExpress,
  showImportAssisted,
  showFirecrawlAction,
  showImportControls,
  importingSource,
  importResults,
  onTestImport,
  onImport10,
}: {
  sources: SourceRow[];
  showImportExpress?: boolean;
  showImportAssisted?: boolean;
  showFirecrawlAction?: boolean;
  showImportControls?: boolean;
  importingSource: string | null;
  importResults: Record<string, ImportResult>;
  onTestImport: ((id: string) => void) | undefined;
  onImport10: ((id: string) => void) | undefined;
}) {
  if (sources.length === 0) {
    return <p className="text-xs py-2" style={{ color: "var(--texte-tertiaire)" }}>Aucune source dans cette catégorie.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--bordure-douce)" }}>
      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--fond)" }}>
            <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Source</th>
            <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Domaine</th>
            <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Mode</th>
            <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Offres</th>
            <th className="py-2 px-2 text-left font-mono" style={{ color: "var(--texte-tertiaire)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((src) => {
            const cap = src.capability;
            const badge = cap ? MODE_BADGE[cap.importMode] : null;
            const isImporting = importingSource === src.name;
            const result = importResults[src.name];

            return (
              <tr key={src.id} style={{ borderTop: `1px solid var(--bordure-douce)` }}>
                <td className="py-2 px-2 font-medium" style={{ color: "var(--texte)" }}>
                  {cap?.name || src.name}
                </td>
                <td className="py-2 px-2 font-mono" style={{ color: "var(--texte-tertiaire)", fontSize: 10 }}>
                  {cap?.domain || "—"}
                </td>
                <td className="py-2 px-2">
                  {badge ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ background: badge.bg, color: badge.fg }}>
                      {badge.label}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Non scanné</span>
                  )}
                </td>
                <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>
                  {cap?.supportsAtsEndpoint && <span className="mr-1 px-1 rounded text-[10px]" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>ATS</span>}
                  {cap?.importMode?.startsWith("AUTO") && (
                    <span className="mr-1 px-1 rounded text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>CRON</span>
                  )}
                  {result && !result.dryRun ? (
                    <span className="text-[10px] font-mono ml-1" style={{ color: "#22c55e" }}>+{result.created}</span>
                  ) : (
                    <span className="text-[10px] font-mono ml-1" style={{ color: "var(--texte-tertiaire)" }}>{src.jobCount || "—"}</span>
                  )}
                  {src.lastRunAt ? (
                    <span className="text-[9px] font-mono block mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                      {new Date(src.lastRunAt).toLocaleDateString("fr-FR")}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 flex-wrap items-center">
                    {showImportControls && onTestImport && (
                      <button onClick={() => onTestImport(src.name)} disabled={isImporting}
                        className="px-2 py-0.5 rounded text-[10px] font-mono border"
                        style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                        {isImporting ? <Loader2 size={10} className="inline animate-spin" /> : <Play size={10} className="inline mr-0.5" />}
                        Tester
                      </button>
                    )}
                    {showImportControls && onImport10 && (
                      <button onClick={() => onImport10(src.name)} disabled={isImporting}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{ background: "var(--or)", color: "#000" }}>
                        {isImporting ? <Loader2 size={10} className="inline animate-spin" /> : <Download size={10} className="inline mr-0.5" />}
                        Importer 10
                      </button>
                    )}
                    {cap?.url && (
                      <a href={cap.url} target="_blank" rel="noopener" className="p-1 rounded"
                        style={{ color: "var(--texte-tertiaire)" }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {showImportExpress && (
                      <Link href="/dashboard/jobs/importer"
                        className="px-2 py-0.5 rounded text-[10px] font-mono"
                        style={{ background: "rgba(234,179,8,0.15)", color: "#eab308", textDecoration: "none" }}>
                        Import Express
                      </Link>
                    )}
                    {showFirecrawlAction && cap?.url && (
                      <Link
                        href={`/dashboard/jobs/importer/firecrawl-safe?url=${encodeURIComponent(cap.url)}`}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a", textDecoration: "none" }}
                      >
                        Analyser via Firecrawl Safe
                      </Link>
                    )}
                    {showImportAssisted && (
                      <Link href="/dashboard/jobs/importer/extension"
                        className="px-2 py-0.5 rounded text-[10px] font-mono"
                        style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", textDecoration: "none" }}>
                        Import assisté requis
                      </Link>
                    )}
                  </div>
                  {/* Résultat inline après import */}
                  {result && (
                    <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
                      {result.errors.length > 0 && !result.fetched ? (
                        <span className="text-[10px]" style={{ color: "#ef4444" }}>{result.errors[0]}</span>
                      ) : (
                        <span className="text-[10px] font-mono" style={{ color: "var(--texte-secondaire)" }}>
                          {result.dryRun ? (
                            <>🔍 {result.fetched} offres trouvées. Échantillon : {result.sample.slice(0, 3).map((s) => s.title.slice(0, 40)).join(" · ")}</>
                          ) : (
                            <>✅ {result.fetched} trouvées, {result.created} créées, {result.duplicates} doublons</>
                          )}
                          {result.errors.length > 0 && (
                            <span className="ml-2" style={{ color: "#ef4444" }}>{result.errors.length} erreur(s)</span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
