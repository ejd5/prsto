"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, Sun, Moon, RefreshCw, MapPin, Building2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getScoreColor } from "@/lib/score-colors";

interface JobBrief { id: string; title: string; company: string | null; location: string | null; priorityLabel: string; score: number | null; sourceName: string | null; sourceUrl: string | null; }
interface ReportData {
  mode: string; generatedAt: string;
  lastRun: { status: string; fetchedCount: number; createdCount: number; duplicateCount: number; startedAt: string; finishedAt: string | null; } | null;
  connectorStats: Record<string, { fetched: number; created: number; duplicates: number }> | null;
  topPACA: JobBrief[]; topIDF: JobBrief[]; topFrance: JobBrief[]; topGlobal: JobBrief[];
  newJobsCount: number; duplicateCount: number; sourcesInError: string[]; recommendations: string[];
  notification?: { sent: boolean; channels: string[]; errors?: string[]; sentAt?: string };
}

export default function JobsReportsPage() {
  const [morningReport, setMorningReport] = useState<ReportData | null>(null);
  const [eveningReport, setEveningReport] = useState<ReportData | null>(null);
  const [loadingMorning, setLoadingMorning] = useState(false);
  const [loadingEvening, setLoadingEvening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      const [morning, evening] = await Promise.all([
        fetch("/api/jobs/reports?mode=morning").then(r => r.json()),
        fetch("/api/jobs/reports?mode=evening").then(r => r.json()),
      ]);
      if (morning.report) setMorningReport(morning.report);
      if (evening.report) setEveningReport(evening.report);
    } catch { setError("Erreur chargement rapports"); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadReport(); }, []);

  const handleRunMorning = async () => {
    setLoadingMorning(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/cron/morning", { method: "POST" });
      const data = await res.json();
      if (data.report) setMorningReport(data.report);
      if (!data.success) setError(data.error || "Erreur");
    } catch { setError("Erreur lors du rapport matin"); }
    setLoadingMorning(false);
  };

  const handleRunEvening = async () => {
    setLoadingEvening(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/cron/evening", { method: "POST" });
      const data = await res.json();
      if (data.report) setEveningReport(data.report);
      if (!data.success) setError(data.error || "Erreur");
    } catch { setError("Erreur lors du rapport soir"); }
    setLoadingEvening(false);
  };

  const badgeColor = (status: string) =>
    status === "success" ? "#22c55e" : status === "partial" ? "#f59e0b" : "#ef4444";

  const renderReport = (report: ReportData | null, loading: boolean, mode: string) => (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === "morning" ? <Sun size={16} style={{ color: "#f59e0b" }} /> : <Moon size={16} style={{ color: "#6366f1" }} />}
          <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Rapport {mode === "morning" ? "matin" : "soir"}</h3>
        </div>
        {loading && <Loader2 size={14} className="animate-spin" style={{ color: "var(--or)" }} />}
      </div>

      {!report && !loading && (
        <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Aucun rapport disponible.</p>
      )}

      {report && (
        <>
          {report.lastRun && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full" style={{ background: badgeColor(report.lastRun.status) }} />
              <span style={{ color: "var(--texte-secondaire)" }}>
                {report.lastRun.createdCount} nouvelle(s), {report.lastRun.duplicateCount} doublon(s)
              </span>
              <span style={{ color: "var(--texte-tertiaire)" }}>
                {report.lastRun.fetchedCount} trouvée(s)
              </span>
            </div>
          )}

          {/* Recommandations */}
          {report.recommendations.length > 0 && (
            <div className="space-y-1">
              {report.recommendations.map((r, i) => (
                <p key={i} className="text-xs" style={{ color: i === 0 ? "var(--texte)" : "var(--texte-secondaire)" }}>{r}</p>
              ))}
            </div>
          )}

          {/* Top PACA */}
          {report.topPACA.length > 0 && (
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: "#22c55e" }}>PACA ({report.topPACA.length})</p>
              {report.topPACA.map(j => (
                <div key={j.id} className="flex items-start gap-2 py-1 text-xs">
                  <MapPin size={10} style={{ color: "#22c55e", marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <span style={{ color: "var(--texte)" }}>{j.title}</span>
                    {j.company && <span className="ml-1" style={{ color: "var(--texte-secondaire)" }}>— {j.company}</span>}
                    {j.location && <span className="ml-1" style={{ color: "var(--texte-tertiaire)" }}>({j.location})</span>}
                  </div>
                  {j.score != null && <span className="font-mono" style={{ color: getScoreColor(j.score) }}>{j.score}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Top IDF */}
          {report.topIDF.length > 0 && (
            <div>
              <p className="text-xs font-mono mb-1" style={{ color: "#f59e0b" }}>Île-de-France ({report.topIDF.length})</p>
              {report.topIDF.map(j => (
                <div key={j.id} className="flex items-start gap-2 py-1 text-xs">
                  <MapPin size={10} style={{ color: "#f59e0b", marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <span style={{ color: "var(--texte)" }}>{j.title}</span>
                    {j.company && <span className="ml-1" style={{ color: "var(--texte-secondaire)" }}>— {j.company}</span>}
                  </div>
                  {j.score != null && <span className="font-mono" style={{ color: getScoreColor(j.score) }}>{j.score}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Sources en erreur */}
          {report.sourcesInError.length > 0 && (
            <div className="p-2 rounded text-xs" style={{ background: "rgba(239,68,68,0.05)", color: "#ef4444" }}>
              <AlertTriangle size={10} className="inline mr-1" />
              {report.sourcesInError.slice(0, 3).join(", ")}
              {report.sourcesInError.length > 3 && ` +${report.sourcesInError.length - 3} autre(s)`}
            </div>
          )}

          {/* Connector stats */}
          {report.connectorStats && (
            <div className="text-xs font-mono space-y-0.5" style={{ color: "var(--texte-tertiaire)" }}>
              {Object.entries(report.connectorStats).map(([name, s]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span>{s.created}/{s.fetched} créée(s)</span>
                </div>
              ))}
            </div>
          )}

          {/* Notification status */}
          {report.notification && (
            <div className="text-xs flex items-center gap-1.5 font-mono" style={{
              color: report.notification.sent ? "#22c55e" :
                report.notification.errors?.length ? "#ef4444" : "#808080"
            }}>
              {report.notification.sent ? <CheckCircle2 size={10} /> :
               report.notification.errors?.length ? <XCircle size={10} /> : <AlertTriangle size={10} />}
              Notification : {report.notification.sent
                ? `Envoyée (${report.notification.channels.join(", ")})`
                : report.notification.errors?.length
                  ? `Erreur : ${report.notification.errors.join("; ")}`
                  : "Non configurée"}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <FileText size={22} style={{ color: "var(--or)" }} />
            Rapports automatiques
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Rapports matin (08h00) et fin d&apos;après-midi (17h30)
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRunMorning} disabled={loadingMorning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
            style={{ borderColor: "#f59e0b", color: "#f59e0b", background: "rgba(245,158,11,0.05)" }}>
            {loadingMorning ? <Loader2 size={12} className="animate-spin" /> : <Sun size={12} />}
            Rapport matin
          </button>
          <button onClick={handleRunEvening} disabled={loadingEvening}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
            style={{ borderColor: "#6366f1", color: "#6366f1", background: "rgba(99,102,241,0.05)" }}>
            {loadingEvening ? <Loader2 size={12} className="animate-spin" /> : <Moon size={12} />}
            Rapport soir
          </button>
          <button onClick={loadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md text-xs flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {/* Grille des rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderReport(morningReport, loadingMorning, "morning")}
        {renderReport(eveningReport, loadingEvening, "evening")}
      </div>

      {/* Safe Sources daily report */}
      <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: "rgba(59,130,246,0.2)", background: "var(--fond-surface)" }}>
        <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "#3b82f6" }}>Rapport quotidien Safe Sources</h3>
        <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
          Rapport des sources publiques autorisées (Firecrawl Safe) avec top offres, scores sémantiques, sources en erreur, refus par motif.
        </p>
        <a
          href="/dashboard/jobs/sources"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
          style={{ borderColor: "#3b82f6", color: "#3b82f6", background: "rgba(59,130,246,0.05)", textDecoration: "none" }}
        >
          <FileText size={12} /> Voir le rapport Safe Sources
        </a>
      </div>

      {/* Documentation cron */}
      <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
        <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Configuration cron-job.org</h3>
        <div className="text-xs space-y-1" style={{ color: "var(--texte-secondaire)" }}>
          <p><strong className="font-mono" style={{ color: "var(--texte)" }}>Matin (08h00)</strong> : <code style={{ color: "var(--or)" }}>POST /api/jobs/cron/morning</code></p>
          <p><strong className="font-mono" style={{ color: "var(--texte)" }}>Soir (17h30)</strong> : <code style={{ color: "var(--or)" }}>POST /api/jobs/cron/evening</code></p>
          <p className="mt-2">Header : <code className="font-mono" style={{ color: "var(--or)" }}>x-api-token: votre_token</code></p>
          <p>Body (optionnel) : <code className="font-mono" style={{ color: "var(--or)" }}>{"{\"maxPages\": 2, \"maxJobsPerRun\": 250}"}</code></p>
        </div>
      </div>
    </div>
  );
}
