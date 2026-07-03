"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ShieldCheck, ExternalLink, Trash2, Edit3,
  Play, Eye, RefreshCw, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/EltonToast";
import ConfirmActionDialog from "@/components/ui/ConfirmActionDialog";
import { getScoreColor, getScoreBg } from "@/lib/score-colors";

interface SafeSourceDb {
  id: string;
  label: string;
  url: string;
  normalizedDomain: string;
  sourceType: string;
  atsVendor: string | null;
  importMode: string;
  enabled: boolean;
  maxPagesPerRun: number;
  maxJobsPerRun: number;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastReasonCode: string | null;
  lastJobsFound: number;
  lastJobsImported: number;
  lastError: string | null;
  consecutiveErrors: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RunResult {
  success: boolean;
  action: string;
  sourceId: string;
  sourceLabel: string;
  complianceStatus: string;
  reasonCode: string;
  message?: string;
  stats: {
    jobsFound: number;
    jobsImported: number;
    duplicates: number;
    skipped: number;
    invalid: number;
    semanticScoredCount: number;
  };
  warnings: Array<{ index: number; title: string; warnings: string[] }>;
  audit?: Record<string, unknown>;
  durationMs: number;
  error?: string;
}

interface ReportData {
  generatedAt: string;
  period: { from: string; to: string };
  sourcesRun: number;
  jobsFound: number;
  jobsImported: number;
  duplicates: number;
  skipped: number;
  invalid: number;
  errors: number;
  semanticScoredCount: number;
  topImported: Array<{
    title: string;
    company: string;
    location: string;
    locationPriority: number | null;
    globalScore: number | null;
    semanticScore: number | null;
    recommendation: string | null;
    sourceLabel: string;
    jobId: string;
  }>;
  sourcesInError: Array<{
    label: string;
    lastStatus: string | null;
    lastError: string | null;
    lastReasonCode: string | null;
    consecutiveErrors: number;
  }>;
  refusalSummary: Array<{ reasonCode: string; count: number }>;
}

interface StatusConfig {
  safeSourcesRunEnabled: boolean;
  safeSourcesCronEnabled: boolean;
  firecrawlEnabled: boolean;
  firecrawlConfigured: boolean;
  firecrawlDailyMaxRequests: number;
  firecrawlDailyMaxJobsImported: number;
  safeSourcesMaxPerRun: number;
  safeSourcesMaxJobsPerSource: number;
  sourcesTotal: number;
  sourcesEnabled: number;
  sourcesBlockedByConsecutiveErrors: number;
  dailyRequestsUsed: number;
  dailyJobsImportedUsed: number;
}

const MODE_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  API_OFFICIAL: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "API Officielle" },
  ATS_PUBLIC: { bg: "rgba(59,130,246,0.15)", fg: "#3b82f6", label: "ATS Public" },
  PUBLIC_CAREERS: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "Carrières" },
  AUTO_JSONLD: { bg: "rgba(139,92,246,0.15)", fg: "#8b5cf6", label: "JSON-LD" },
  AUTO_PUBLIC_CAREERS: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", label: "Public Auto" },
  AUTO_FIRECRAWL_SAFE: { bg: "rgba(34,197,94,0.15)", fg: "#16a34a", label: "Firecrawl" },
};

const STATUS_LABELS: Record<string, string> = {
  success: "Succès",
  partial: "Partiel",
  failed: "Échec",
  refused: "Refusé",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  success: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e" },
  partial: { bg: "rgba(245,158,11,0.15)", fg: "#f59e0b" },
  failed: { bg: "rgba(239,68,68,0.15)", fg: "#ef4444" },
  refused: { bg: "rgba(220,38,38,0.15)", fg: "#dc2626" },
};

const REASON_LABELS: Record<string, string> = {
  allowed_public_ats: "ATS public autorisé",
  allowed_public_careers: "Page carrière publique autorisée",
  allowed_jsonld: "JSON-LD public autorisé",
  refused_closed_platform: "Plateforme fermée",
  refused_login_required: "Connexion requise",
  refused_captcha: "Protection anti-bot détectée",
  refused_blocked_domain: "Domaine bloqué",
  refused_user_assisted_source: "Action utilisateur requise",
  refused_bypass_attempt: "Tentative de contournement détectée",
  refused_missing_api_key: "Configuration absente",
  error_firecrawl_rate_limit: "Limite de taux atteinte",
  error_firecrawl_timeout: "Timeout",
  error_parse_failed: "Échec du parsing",
  error_consecutive_failures: "Erreurs consécutives",
};

type FilterMode = "all" | "enabled" | "disabled" | "success" | "error";

export default function SafeSourcesPage() {
  const toast = useToast();
  const [sources, setSources] = useState<SafeSourceDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newMaxPages, setNewMaxPages] = useState(1);
  const [newMaxJobs, setNewMaxJobs] = useState(20);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createCheck, setCreateCheck] = useState<{ status: string; reasonCode: string; message: string } | null>(null);

  // Run state
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({});
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);
  const [editMaxJobs, setEditMaxJobs] = useState(20);

  // Enhancements V2.6.6
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"sources" | "report">("sources");
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [statusConfig, setStatusConfig] = useState<StatusConfig | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/safe-sources");
      const data = await res.json();
      setSources(data.sources || []);
    } catch { setSources([]); }
    setLoading(false);
  };

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/jobs/safe-sources/report");
      const data = await res.json();
      if (data.success) setReport(data.report);
    } catch { /* ignore */ }
    setReportLoading(false);
  };

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/jobs/safe-sources/status");
      const data = await res.json();
      if (data.success) setStatusConfig(data.config);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadSources();
    loadStatus();
  }, []);

  useEffect(() => {
    if (activeTab === "report" && !report) loadReport();
  }, [activeTab]);

  // Derived counts
  const counts = useMemo(() => {
    const enabled = sources.filter((s) => s.enabled).length;
    const disabled = sources.length - enabled;
    const success = sources.filter((s) => s.lastStatus === "success" || s.lastStatus === "partial").length;
    const error = sources.filter((s) => s.lastStatus === "failed" || s.lastStatus === "refused").length;
    return { enabled, disabled, success, error };
  }, [sources]);

  // Filtered sources
  const filteredSources = useMemo(() => {
    switch (filterMode) {
    case "enabled": return sources.filter((s) => s.enabled);
    case "disabled": return sources.filter((s) => !s.enabled);
    case "success": return sources.filter((s) => s.lastStatus === "success" || s.lastStatus === "partial");
    case "error": return sources.filter((s) => s.lastStatus === "failed" || s.lastStatus === "refused" || s.lastError);
    default: return sources;
    }
  }, [sources, filterMode]);

  const handleCheckUrl = async () => {
    if (!newUrl.trim()) return;
    setCreateCheck(null);
    setCreateError("");
    try {
      const res = await fetch("/api/jobs/firecrawl-safe/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCreateCheck({ status: "allowed", reasonCode: data.reasonCode, message: REASON_LABELS[data.reasonCode] || data.reasonCode });
      } else {
        setCreateCheck({ status: data.complianceStatus || "refused", reasonCode: data.reasonCode, message: data.message || REASON_LABELS[data.reasonCode] || data.reasonCode });
      }
    } catch {
      setCreateError("Erreur réseau lors de la vérification.");
    }
  };

  const handleCreate = async () => {
    if (!newUrl.trim() || !newLabel.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/jobs/safe-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim(), label: newLabel.trim(), maxPagesPerRun: newMaxPages, maxJobsPerRun: newMaxJobs }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setNewUrl("");
        setNewLabel("");
        setCreateCheck(null);
        loadSources();
        setMessage("Source ajoutée.");
      } else {
        setCreateError(data.error || "Erreur lors de la création.");
      }
    } catch {
      setCreateError("Erreur réseau.");
    }
    setCreating(false);
  };

  const handleRun = async (sourceId: string, action: "preview" | "import") => {
    setRunningId(sourceId);
    try {
      const res = await fetch(`/api/jobs/safe-sources/${sourceId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setRunResults((prev) => ({ ...prev, [sourceId]: data }));
      if (data.success) setMessage(`Run terminé : ${data.stats.jobsFound} offres trouvées.`);
      else setMessage(`Run échoué : ${data.message || data.error || "Erreur"}`);
      loadSources();
    } catch {
      setMessage("Erreur réseau.");
    }
    setRunningId(null);
  };

  const [confirmRunAction, setConfirmRunAction] = useState<{ action: "preview" | "import"; sources: string[] } | null>(null);

  const handleRunAll = async (action: "preview" | "import") => {
    const enabledCount = sources.filter((s) => s.enabled).length;
    const maxPerRun = process.env.NEXT_PUBLIC_SAFE_SOURCES_MAX_PER_RUN || "5";
    if (!confirm(`Lancer ${action === "import" ? "l'import" : "la preview"} sur ${Math.min(enabledCount, 5)} source(s) activée(s) (limite : ${maxPerRun} max) ?`)) return;
    setRunningId("__all__");
    setMessage("Lancement de toutes les sources...");
    try {
      const res = await fetch("/api/jobs/safe-sources/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.runs) {
        const results: Record<string, RunResult> = {};
        for (const r of data.runs) {
          results[r.sourceId] = r;
        }
        setRunResults(results);
      }
      setMessage(`Terminé : ${data.summary?.succeeded || 0} succès, ${data.summary?.failed || 0} échec(s).`);
      loadSources();
    } catch {
      setMessage("Erreur réseau.");
    }
    setRunningId(null);
  };

  const handleRunSelected = async (action: "preview" | "import") => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Lancer ${action === "import" ? "l'import" : "la preview"} sur ${selectedIds.size} source(s) sélectionnée(s) ?`)) return;
    setRunningId("__selected__");
    const ids = Array.from(selectedIds);
    let done = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/jobs/safe-sources/${id}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        setRunResults((prev) => ({ ...prev, [id]: data }));
        if (data.success) done++; else failed++;
      } catch { failed++; }
    }
    setMessage(`Sélection terminée : ${done} succès, ${failed} échec(s).`);
    setRunningId(null);
    loadSources();
  };

  const handleDisable = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/jobs/safe-sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      loadSources();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette source ?")) return;
    try {
      await fetch(`/api/jobs/safe-sources/${id}`, { method: "DELETE" });
      loadSources();
      setMessage("Source supprimée.");
    } catch { setMessage("Erreur lors de la suppression."); }
  };

  const handleEditSave = async (id: string) => {
    try {
      await fetch(`/api/jobs/safe-sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel, enabled: editEnabled, maxJobsPerRun: editMaxJobs }),
      });
      setEditingId(null);
      loadSources();
    } catch { /* ignore */ }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSources.map((s) => s.id)));
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--texte)", margin: 0 }}>
            Sources autorisées
          </h1>
          <p style={{ color: "var(--texte-muted)", margin: "4px 0 0", fontSize: 14 }}>
            Registre des sources publiques éligibles à l&apos;import automatique via Firecrawl Safe.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => handleRunSelected("preview")}
                disabled={runningId !== null}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  background: "var(--fond-carte)", color: "var(--texte)", border: "1px solid var(--bordure)",
                  fontWeight: 600, cursor: "pointer", fontSize: 14,
                  opacity: runningId !== null ? 0.5 : 1,
                }}
              >
                <Eye size={14} />
                Tester ({selectedIds.size})
              </button>
              <button
                onClick={() => handleRunSelected("import")}
                disabled={runningId !== null}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  background: "var(--or)", color: "#fff", border: "none",
                  fontWeight: 600, cursor: "pointer", fontSize: 14,
                  opacity: runningId !== null ? 0.5 : 1,
                }}
              >
                <Play size={14} />
                Importer ({selectedIds.size})
              </button>
            </>
          )}
          <button
            onClick={() => handleRunAll("import")}
            disabled={runningId === "__all__" || sources.filter((s) => s.enabled).length === 0}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "var(--or)", color: "#fff", border: "none",
              fontWeight: 600, cursor: "pointer", fontSize: 14,
              opacity: runningId === "__all__" || sources.filter((s) => s.enabled).length === 0 ? 0.5 : 1,
            }}
          >
            {runningId === "__all__" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Lancer toutes les sources
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "var(--fond-carte)", color: "var(--texte)", border: "1px solid var(--bordure)",
              fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            <Plus size={14} />
            Ajouter une source
          </button>
        </div>
      </div>

      {/* Summary counters bar */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap",
      }}>
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: "var(--fond-carte)", border: "1px solid var(--bordure)",
          display: "flex", alignItems: "center", gap: 8, fontSize: 14,
        }}>
          <span style={{ fontWeight: 600, color: "var(--texte)" }}>{sources.length}</span>
          <span style={{ color: "var(--texte-muted)" }}>sources totales</span>
        </div>
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          display: "flex", alignItems: "center", gap: 8, fontSize: 14,
        }}>
          <span style={{ fontWeight: 600, color: "#22c55e" }}>{counts.enabled}</span>
          <span style={{ color: "var(--texte-muted)" }}>activées</span>
        </div>
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)",
          display: "flex", alignItems: "center", gap: 8, fontSize: 14,
        }}>
          <span style={{ fontWeight: 600, color: "#9ca3af" }}>{counts.disabled}</span>
          <span style={{ color: "var(--texte-muted)" }}>désactivées</span>
        </div>
        {counts.success > 0 && (
          <div style={{
            padding: "10px 16px", borderRadius: 10,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", gap: 8, fontSize: 14,
          }}>
            <CheckCircle2 size={14} color="#22c55e" />
            <span style={{ color: "var(--texte-muted)" }}>{counts.success} dernier(s) run(s) OK</span>
          </div>
        )}
        {counts.error > 0 && (
          <div style={{
            padding: "10px 16px", borderRadius: 10,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", gap: 8, fontSize: 14,
          }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ color: "var(--texte-muted)" }}>{counts.error} en erreur</span>
          </div>
        )}
      </div>

      {/* Limits display */}
      <div style={{
        padding: "8px 14px", borderRadius: 8, marginBottom: 16,
        background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)",
        fontSize: 12, color: "var(--texte-muted)", display: "flex", gap: 24,
      }}>
        <span><strong>Limites run groupé</strong> : max 5 sources par run · max 20 offres par source</span>
        <span>Définies par SAFE_SOURCES_MAX_PER_RUN / SAFE_SOURCES_MAX_JOBS_PER_SOURCE</span>
      </div>

      {/* Config status panel */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "var(--fond-carte)", color: "var(--texte-muted)",
            border: "1px solid var(--bordure)", cursor: "pointer",
          }}
        >
          {showConfigPanel ? "▾" : "▸"} Statut configuration
        </button>
        {showConfigPanel && statusConfig && (
          <div style={{
            marginTop: 8, padding: 16, borderRadius: 12,
            background: "var(--fond-carte)", border: "1px solid var(--bordure)",
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12,
          }}>
            <ConfigFlag label="Runs Safe Sources" enabled={statusConfig.safeSourcesRunEnabled} />
            <ConfigFlag label="Cron Safe Sources" enabled={statusConfig.safeSourcesCronEnabled} />
            <ConfigFlag label="Firecrawl activé" enabled={statusConfig.firecrawlEnabled} />
            <ConfigFlag label="Clé Firecrawl configurée" enabled={statusConfig.firecrawlConfigured} />
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--fond)", fontSize: 13 }}>
              <span style={{ color: "var(--texte-muted)" }}>Limite requêtes/jour : </span>
              <span style={{ fontWeight: 600, color: "var(--texte)" }}>
                {statusConfig.dailyRequestsUsed}/{statusConfig.firecrawlDailyMaxRequests}
              </span>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--fond)", fontSize: 13 }}>
              <span style={{ color: "var(--texte-muted)" }}>Limite offres importées/jour : </span>
              <span style={{ fontWeight: 600, color: "var(--texte)" }}>
                {statusConfig.dailyJobsImportedUsed}/{statusConfig.firecrawlDailyMaxJobsImported}
              </span>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--fond)", fontSize: 13 }}>
              <span style={{ color: "var(--texte-muted)" }}>Max sources/run groupé : </span>
              <span style={{ fontWeight: 600, color: "var(--texte)" }}>{statusConfig.safeSourcesMaxPerRun}</span>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--fond)", fontSize: 13 }}>
              <span style={{ color: "var(--texte-muted)" }}>Max offres/source : </span>
              <span style={{ fontWeight: 600, color: "var(--texte)" }}>{statusConfig.safeSourcesMaxJobsPerSource}</span>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--fond)", fontSize: 13 }}>
              <span style={{ color: "var(--texte-muted)" }}>Sources activées : </span>
              <span style={{ fontWeight: 600, color: "var(--texte)" }}>
                {statusConfig.sourcesEnabled}/{statusConfig.sourcesTotal}
              </span>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13,
              background: statusConfig.sourcesBlockedByConsecutiveErrors > 0 ? "rgba(239,68,68,0.08)" : "var(--fond)",
            }}>
              <span style={{ color: "var(--texte-muted)" }}>Bloquées (≥3 erreurs) : </span>
              <span style={{ fontWeight: 600, color: statusConfig.sourcesBlockedByConsecutiveErrors > 0 ? "#ef4444" : "var(--texte)" }}>
                {statusConfig.sourcesBlockedByConsecutiveErrors}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Warnings banner */}
      {statusConfig && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {!statusConfig.firecrawlEnabled && (
            <div style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b", display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={14} />
              Firecrawl désactivé (FIRECRAWL_ENABLED=false) — les runs réseau échoueront
            </div>
          )}
          {statusConfig.firecrawlEnabled && !statusConfig.firecrawlConfigured && (
            <div style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", display: "flex", alignItems: "center", gap: 8,
            }}>
              <XCircle size={14} />
              Clé API Firecrawl absente — les runs réseau échoueront
            </div>
          )}
          {!statusConfig.safeSourcesRunEnabled && (
            <div style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b", display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={14} />
              Runs Safe Sources désactivés (SAFE_SOURCES_RUN_ENABLED=false) — aucun run possible
            </div>
          )}
          {statusConfig.safeSourcesCronEnabled && !statusConfig.safeSourcesRunEnabled && (
            <div style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={14} />
              Incohérence : cron activé mais runs désactivés (SAFE_SOURCES_RUN_ENABLED=false)
            </div>
          )}
          {statusConfig.sourcesEnabled === 0 && statusConfig.sourcesTotal > 0 && (
            <div style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.3)",
              color: "#9ca3af", display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={14} />
              Aucune source activée — activez des sources pour pouvoir lancer des runs
            </div>
          )}
          {statusConfig.sourcesBlockedByConsecutiveErrors > 0 && (
            <div style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertTriangle size={14} />
              {statusConfig.sourcesBlockedByConsecutiveErrors} source(s) bloquée(s) par erreurs consécutives (≥3)
            </div>
          )}
        </div>
      )}

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--bordure)" }}>
        <button
          onClick={() => setActiveTab("sources")}
          style={{
            padding: "10px 20px", fontSize: 14, fontWeight: 600,
            background: "transparent", border: "none", cursor: "pointer",
            color: activeTab === "sources" ? "var(--or)" : "var(--texte-muted)",
            borderBottom: activeTab === "sources" ? "2px solid var(--or)" : "2px solid transparent",
          }}
        >
          Sources ({sources.length})
        </button>
        <button
          onClick={() => setActiveTab("report")}
          style={{
            padding: "10px 20px", fontSize: 14, fontWeight: 600,
            background: "transparent", border: "none", cursor: "pointer",
            color: activeTab === "report" ? "var(--or)" : "var(--texte-muted)",
            borderBottom: activeTab === "report" ? "2px solid var(--or)" : "2px solid transparent",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          <BarChart3 size={14} />
          Rapport quotidien
        </button>
      </div>

      {message && (
        <div style={{
          padding: "8px 16px", borderRadius: 8, marginBottom: 16,
          background: "var(--fond-carte)", border: "1px solid var(--bordure)",
          fontSize: 14, color: "var(--texte)",
        }}>
          {message}
        </div>
      )}

      {/* Report tab content */}
      {activeTab === "report" && (
        <div>
          {reportLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--texte-muted)" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} />
              <p>Génération du rapport...</p>
            </div>
          ) : !report ? (
            <div style={{
              padding: 40, textAlign: "center", borderRadius: 12,
              background: "var(--fond-carte)", border: "1px solid var(--bordure)",
            }}>
              <BarChart3 size={32} style={{ color: "var(--texte-muted)", marginBottom: 12 }} />
              <p style={{ color: "var(--texte-muted)", fontSize: 16, margin: 0 }}>
                Aucun rapport disponible.
              </p>
              <p style={{ color: "var(--texte-muted)", fontSize: 14, margin: "4px 0 0" }}>
                Les données apparaîtront après les premiers runs d&apos;import.
              </p>
              <button
                onClick={loadReport}
                style={{
                  marginTop: 12, padding: "6px 16px", borderRadius: 6,
                  background: "var(--fond-carte)", color: "var(--texte)", border: "1px solid var(--bordure)",
                  cursor: "pointer", fontSize: 13,
                }}
              >
                <RefreshCw size={12} style={{ marginRight: 4 }} />
                Actualiser
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Report summary */}
              <div style={{
                padding: 20, borderRadius: 12,
                background: "var(--fond-carte)", border: "1px solid var(--bordure)",
              }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "var(--texte)" }}>
                  Résumé des dernières 24h
                </h3>
                <div style={{ fontSize: 12, color: "var(--texte-muted)", marginBottom: 16 }}>
                  Période : {new Date(report.period.from).toLocaleString("fr-FR")} → {new Date(report.period.to).toLocaleString("fr-FR")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  <StatCard label="Sources lancées" value={report.sourcesRun} />
                  <StatCard label="Offres trouvées" value={report.jobsFound} color="#3b82f6" />
                  <StatCard label="Offres importées" value={report.jobsImported} color="#22c55e" />
                  <StatCard label="Doublons" value={report.duplicates} color="#f59e0b" />
                  <StatCard label="Anomalies (invalide)" value={report.invalid} color="#ef4444" />
                  <StatCard label="Erreurs" value={report.errors} color="#dc2626" />
                  <StatCard label="Scores sémantiques" value={report.semanticScoredCount} color="#8b5cf6" />
                </div>
              </div>

              {/* Top imported jobs */}
              {report.topImported.length > 0 && (
                <div style={{
                  padding: 20, borderRadius: 12,
                  background: "var(--fond-carte)", border: "1px solid var(--bordure)",
                }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "var(--texte)" }}>
                    Top {report.topImported.length} offres importées (score sémantique)
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {report.topImported.map((job) => (
                      <div key={job.jobId} style={{
                        padding: "10px 14px", borderRadius: 8,
                        background: "var(--fond)", border: "1px solid var(--bordure)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        flexWrap: "wrap", gap: 8,
                      }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--texte)" }}>{job.title}</div>
                          <div style={{ fontSize: 13, color: "var(--texte-muted)" }}>
                            {job.company} · {job.location}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--texte-muted)" }}>
                            Source : {job.sourceLabel}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
                          {job.semanticScore != null && (
                            <span style={{
                              padding: "3px 8px", borderRadius: 10,
                              background: getScoreColorBg(job.semanticScore),
                              color: getScoreColorFg(job.semanticScore),
                              fontWeight: 600, fontSize: 12,
                            }}>
                              Sémantique : {job.semanticScore.toFixed(0)}%
                            </span>
                          )}
                          {job.globalScore != null && (
                            <span style={{ color: "var(--texte-muted)" }}>
                              Global : {job.globalScore.toFixed(0)}%
                            </span>
                          )}
                          {job.recommendation && (
                            <span style={{
                              padding: "3px 8px", borderRadius: 10, fontSize: 11,
                              background: getRecBg(job.recommendation),
                              color: getRecFg(job.recommendation),
                              fontWeight: 600,
                            }}>
                              {job.recommendation}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources in error */}
              {report.sourcesInError.length > 0 && (
                <div style={{
                  padding: 20, borderRadius: 12,
                  background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)",
                }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: "#ef4444" }}>
                    <AlertTriangle size={16} style={{ marginRight: 6, display: "inline" }} />
                    Sources en erreur ({report.sourcesInError.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {report.sourcesInError.map((s) => (
                      <div key={s.label} style={{ fontSize: 13, color: "var(--texte-muted)", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, color: "var(--texte)" }}>{s.label}</span>
                        <span>{s.lastStatus}</span>
                        {s.consecutiveErrors >= 3 && (
                          <span style={{ color: "#ef4444", fontWeight: 600 }}>
                            {s.consecutiveErrors} erreurs consécutives — désactiver ?
                          </span>
                        )}
                        {s.lastError && <span style={{ color: "#ef4444", fontSize: 12 }}>{s.lastError}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Refusal summary */}
              {report.refusalSummary.length > 0 && (
                <div style={{
                  padding: 20, borderRadius: 12,
                  background: "var(--fond-carte)", border: "1px solid var(--bordure)",
                }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "var(--texte)" }}>
                    Sources refusées par motif
                  </h3>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {report.refusalSummary.map((r) => (
                      <span key={r.reasonCode} style={{
                        padding: "4px 10px", borderRadius: 8, fontSize: 12,
                        background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: 600,
                      }}>
                        {REASON_LABELS[r.reasonCode] || r.reasonCode} : {r.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={loadReport}
                style={{
                  padding: "6px 16px", borderRadius: 6, alignSelf: "flex-start",
                  background: "var(--fond-carte)", color: "var(--texte)", border: "1px solid var(--bordure)",
                  cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <RefreshCw size={12} /> Actualiser le rapport
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sources tab content */}
      {activeTab === "sources" && (
        <>
          {/* Filters bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            {(["all", "enabled", "disabled", "success", "error"] as FilterMode[]).map((mode) => {
              const countsForMode: Record<FilterMode, number> = {
                all: sources.length,
                enabled: counts.enabled,
                disabled: counts.disabled,
                success: counts.success,
                error: counts.error,
              };
              return (
                <button
                  key={mode}
                  onClick={() => { setFilterMode(mode); setSelectedIds(new Set()); }}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: filterMode === mode ? "var(--or)" : "var(--fond-carte)",
                    color: filterMode === mode ? "#fff" : "var(--texte-muted)",
                    border: filterMode === mode ? "none" : "1px solid var(--bordure)",
                    cursor: "pointer",
                  }}
                >
                  {mode === "all" ? "Toutes" : mode === "enabled" ? "Activées" : mode === "disabled" ? "Désactivées" : mode === "success" ? "Succès" : "Erreur"}
                  {" "}
                  <span style={{ opacity: 0.7, fontSize: 11 }}>({countsForMode[mode]})</span>
                </button>
              );
            })}
          </div>

          {/* Create form */}
          {showCreate && (
            <div style={{
              padding: 20, borderRadius: 12, marginBottom: 24,
              background: "var(--fond-carte)", border: "1px solid var(--bordure)",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "var(--texte)" }}>
                Ajouter une source autorisée
              </h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Label (ex: Stripe Greenhouse)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{
                    padding: "8px 12px", borderRadius: 8, border: "1px solid var(--bordure)",
                    background: "var(--fond)", color: "var(--texte)", flex: 1, minWidth: 200, fontSize: 14,
                  }}
                />
                <input
                  type="url"
                  placeholder="URL (ex: https://boards.greenhouse.io/stripe)"
                  value={newUrl}
                  onChange={(e) => { setNewUrl(e.target.value); setCreateCheck(null); }}
                  style={{
                    padding: "8px 12px", borderRadius: 8, border: "1px solid var(--bordure)",
                    background: "var(--fond)", color: "var(--texte)", flex: 2, minWidth: 300, fontSize: 14,
                  }}
                />
                <button
                  onClick={handleCheckUrl}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid var(--bordure)",
                    background: "var(--fond)", color: "var(--texte)", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  }}
                >
                  <Eye size={14} style={{ marginRight: 4 }} />
                  Vérifier
                </button>
              </div>

              {createCheck && (
                <div style={{
                  padding: "8px 12px", borderRadius: 8, marginBottom: 12, fontSize: 14,
                  background: createCheck.status === "allowed" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: createCheck.status === "allowed" ? "#22c55e" : "#ef4444",
                }}>
                  {createCheck.status === "allowed" ? (
                    <><CheckCircle2 size={14} style={{ marginRight: 4, display: "inline" }} /> Source autorisée — {createCheck.message}</>
                  ) : (
                    <><XCircle size={14} style={{ marginRight: 4, display: "inline" }} /> Source refusée — {createCheck.message || REASON_LABELS[createCheck.reasonCode] || createCheck.reasonCode}. Utilisez Import Assisté.</>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", fontSize: 14, color: "var(--texte-muted)" }}>
                <label>Max pages/run : <input type="number" min={1} max={5} value={newMaxPages} onChange={(e) => setNewMaxPages(parseInt(e.target.value) || 1)} style={{ width: 50, marginLeft: 4, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} /></label>
                <label>Max offres/run : <input type="number" min={1} max={100} value={newMaxJobs} onChange={(e) => setNewMaxJobs(parseInt(e.target.value) || 20)} style={{ width: 60, marginLeft: 4, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} /></label>
              </div>

              {createError && <p style={{ color: "#ef4444", fontSize: 14, margin: "0 0 8px" }}>{createError}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleCreate}
                  disabled={creating || !createCheck || createCheck.status !== "allowed"}
                  style={{
                    padding: "8px 16px", borderRadius: 8, background: "var(--or)", color: "#fff",
                    border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14,
                    opacity: creating || !createCheck || createCheck.status !== "allowed" ? 0.5 : 1,
                  }}
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                  Ajouter
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateCheck(null); setCreateError(""); }}
                  style={{
                    padding: "8px 16px", borderRadius: 8, background: "transparent", color: "var(--texte-muted)",
                    border: "1px solid var(--bordure)", cursor: "pointer", fontSize: 14,
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Sources list */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--texte-muted)" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} />
              <p>Chargement...</p>
            </div>
          ) : filteredSources.length === 0 ? (
            <div style={{
              padding: 40, textAlign: "center", borderRadius: 12,
              background: "var(--fond-carte)", border: "1px solid var(--bordure)",
            }}>
              <ShieldCheck size={32} style={{ color: "var(--texte-muted)", marginBottom: 12 }} />
              <p style={{ color: "var(--texte-muted)", fontSize: 16, margin: 0 }}>
                {filterMode !== "all" ? "Aucune source ne correspond au filtre." : "Aucune source enregistrée."}
              </p>
              <p style={{ color: "var(--texte-muted)", fontSize: 14, margin: "4px 0 0" }}>
                {filterMode !== "all" ? "Essayez un autre filtre." : "Ajoutez une source publique (Greenhouse, Lever, page carrières) pour démarrer."}
              </p>
            </div>
          ) : (
            <>
              {/* Select all */}
              <div style={{ marginBottom: 8, fontSize: 13, color: "var(--texte-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredSources.length && filteredSources.length > 0}
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer" }}
                />
                Sélectionner tout ({filteredSources.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredSources.map((src) => {
                  const lastRun = runResults[src.id];
                  const modeBadge = MODE_BADGE[src.importMode] || MODE_BADGE.AUTO_PUBLIC_CAREERS;
                  const statusColor = src.lastStatus ? STATUS_COLORS[src.lastStatus] : null;
                  const hasConsecutiveErrors = src.consecutiveErrors >= 3;
                  return (
                    <div key={src.id} style={{
                      padding: 16, borderRadius: 12,
                      background: "var(--fond-carte)", border: hasConsecutiveErrors ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--bordure)",
                      opacity: src.enabled ? 1 : 0.5,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 200 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(src.id)}
                            onChange={() => toggleSelect(src.id)}
                            style={{ marginTop: 4, cursor: "pointer" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 16, color: "var(--texte)" }}>{src.label}</span>
                              <span style={{
                                padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                                background: modeBadge.bg, color: modeBadge.fg,
                              }}>
                                {modeBadge.label}
                              </span>
                              {!src.enabled && (
                                <span style={{
                                  padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                                  background: "rgba(107,114,128,0.15)", color: "#9ca3af",
                                }}>
                                  Désactivé
                                </span>
                              )}
                              {hasConsecutiveErrors && (
                                <span style={{
                                  padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                                  background: "rgba(239,68,68,0.15)", color: "#ef4444",
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                  <AlertTriangle size={10} />
                                  {src.consecutiveErrors} erreurs consécutives — désactiver ?
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: "var(--texte-muted)", marginBottom: 2 }}>
                              <ExternalLink size={12} style={{ marginRight: 4, display: "inline" }} />
                              {src.url}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--texte-muted)", marginBottom: 4 }}>
                              Domaine : {src.normalizedDomain}
                              {src.atsVendor ? ` · ATS : ${src.atsVendor}` : ""}
                              {src.sourceType ? ` · Type : ${src.sourceType}` : ""}
                            </div>
                            {src.lastRunAt && (
                              <div style={{ fontSize: 12, color: "var(--texte-muted)" }}>
                                Dernier run : {new Date(src.lastRunAt).toLocaleString("fr-FR")}
                                {statusColor && (
                                  <span style={{
                                    marginLeft: 8, padding: "2px 6px", borderRadius: 10, fontSize: 11,
                                    background: statusColor.bg, color: statusColor.fg,
                                  }}>
                                    {STATUS_LABELS[src.lastStatus || ""] || src.lastStatus}
                                  </span>
                                )}
                                {src.lastReasonCode && (
                                  <span style={{ marginLeft: 4, fontSize: 11, color: "var(--texte-muted)" }}>
                                    · {REASON_LABELS[src.lastReasonCode] || src.lastReasonCode}
                                  </span>
                                )}
                                <span style={{ marginLeft: 4, fontSize: 11 }}>
                                  · {src.lastJobsFound} trouvées · {src.lastJobsImported} importées
                                </span>
                              </div>
                            )}
                            {src.lastError && (
                              <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>
                                Erreur : {src.lastError}
                              </div>
                            )}
                            {src.notes && (
                              <div style={{ fontSize: 12, color: "var(--texte-muted)", fontStyle: "italic", marginTop: 4 }}>
                                {src.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "var(--texte-muted)" }}>
                            {src.maxJobsPerRun} offres max
                          </span>

                          <button
                            onClick={() => handleRun(src.id, "preview")}
                            disabled={runningId === src.id || !src.enabled}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "6px 12px", borderRadius: 6, fontSize: 13,
                              background: "var(--fond)", color: "var(--texte)", border: "1px solid var(--bordure)",
                              cursor: runningId === src.id || !src.enabled ? "not-allowed" : "pointer",
                              opacity: runningId === src.id ? 0.5 : 1,
                            }}
                          >
                            {runningId === src.id ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                            Tester
                          </button>

                          <button
                            onClick={() => handleRun(src.id, "import")}
                            disabled={runningId === src.id || !src.enabled}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "6px 12px", borderRadius: 6, fontSize: 13,
                              background: "var(--or)", color: "#fff", border: "none",
                              cursor: runningId === src.id || !src.enabled ? "not-allowed" : "pointer",
                              opacity: runningId === src.id ? 0.5 : 1, fontWeight: 600,
                            }}
                          >
                            {runningId === src.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                            Lancer import
                          </button>

                          {editingId === src.id ? (
                            <>
                              <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                style={{ width: 160, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--bordure)", background: "var(--fond)", color: "var(--texte)", fontSize: 13 }}
                              />
                              <input
                                type="number"
                                value={editMaxJobs}
                                onChange={(e) => setEditMaxJobs(parseInt(e.target.value) || 20)}
                                style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid var(--bordure)", background: "var(--fond)", color: "var(--texte)", fontSize: 13 }}
                              />
                              <button onClick={() => handleEditSave(src.id)} style={{ padding: "4px 8px", borderRadius: 6, background: "var(--or)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>OK</button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setEditingId(src.id); setEditLabel(src.label); setEditEnabled(src.enabled); setEditMaxJobs(src.maxJobsPerRun); }}
                              style={{ padding: "4px 6px", borderRadius: 6, background: "transparent", color: "var(--texte-muted)", border: "none", cursor: "pointer" }}
                            >
                              <Edit3 size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDisable(src.id, !src.enabled)}
                            style={{
                              padding: "4px 8px", borderRadius: 6, fontSize: 12,
                              background: src.enabled ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                              color: src.enabled ? "#ef4444" : "#22c55e", border: "none", cursor: "pointer",
                            }}
                          >
                            {src.enabled ? "Désactiver" : "Activer"}
                          </button>

                          <button
                            onClick={() => handleDelete(src.id)}
                            style={{ padding: "4px 6px", borderRadius: 6, background: "transparent", color: "var(--texte-muted)", border: "none", cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Run result */}
                      {lastRun && (
                        <div style={{
                          marginTop: 12, padding: 12, borderRadius: 8,
                          background: lastRun.success ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                          border: `1px solid ${lastRun.success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            {lastRun.success ? <CheckCircle2 size={14} color="#22c55e" /> : <AlertTriangle size={14} color="#f59e0b" />}
                            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--texte)" }}>
                              {lastRun.action === "preview" ? "Preview" : "Import"} — {lastRun.stats.jobsFound} offres trouvées
                              {lastRun.action === "import" ? ` · ${lastRun.stats.jobsImported} importées · ${lastRun.stats.duplicates} doublons · ${lastRun.stats.skipped} skippées` : ""}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--texte-muted)" }}>
                              {lastRun.durationMs}ms
                              {lastRun.stats.semanticScoredCount > 0 ? ` · ${lastRun.stats.semanticScoredCount} scores sémantiques` : ""}
                            </span>
                          </div>

                          {lastRun.warnings.length > 0 && (
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                              <span style={{ color: "#f59e0b", fontWeight: 600 }}>Avertissements :</span>
                              {lastRun.warnings.map((w, i) => (
                                <div key={i} style={{ marginLeft: 16, color: "var(--texte-muted)" }}>
                                  {w.title} : {w.warnings.join(", ")}
                                </div>
                              ))}
                            </div>
                          )}

                          {lastRun.audit && (
                            <div style={{ marginTop: 8 }}>
                              <button
                                onClick={() => setExpandedAudit(expandedAudit === src.id ? null : src.id)}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "4px 8px", borderRadius: 6, fontSize: 12,
                                  background: "transparent", color: "var(--texte-muted)", border: "none", cursor: "pointer",
                                }}
                              >
                                <RefreshCw size={12} />
                                {expandedAudit === src.id ? "Masquer l'audit" : "Voir l'audit"}
                              </button>
                              {expandedAudit === src.id && (
                                <pre style={{
                                  marginTop: 4, padding: 8, borderRadius: 6, fontSize: 11,
                                  background: "var(--fond)", color: "var(--texte-muted)",
                                  border: "1px solid var(--bordure)", overflow: "auto", maxHeight: 200,
                                }}>
                                  {JSON.stringify(lastRun.audit, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Navigation links */}
      <div style={{ marginTop: 32, padding: "16px 0", borderTop: "1px solid var(--bordure)", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/dashboard/jobs/source-scanner" style={{
          color: "var(--texte-muted)", fontSize: 14, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <ExternalLink size={12} /> Source Scanner
        </Link>
        <Link href="/dashboard/jobs/importer/firecrawl-safe" style={{
          color: "var(--texte-muted)", fontSize: 14, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <ExternalLink size={12} /> Firecrawl Safe (import unique)
        </Link>
        <Link href="/dashboard/jobs/reports" style={{
          color: "var(--texte-muted)", fontSize: 14, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <ExternalLink size={12} /> Rapports
        </Link>
        <Link href="/dashboard/jobs" style={{
          color: "var(--texte-muted)", fontSize: 14, textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <ExternalLink size={12} /> Dashboard offres
        </Link>
      </div>
    </div>
  );
}

/* Helper components */
function ConfigFlag({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div style={{
      padding: "8px 12px", borderRadius: 8,
      background: enabled ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      fontSize: 13, display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: enabled ? "#22c55e" : "#ef4444",
        flexShrink: 0,
      }} />
      <span style={{ color: "var(--texte-muted)" }}>{label} : </span>
      <span style={{ fontWeight: 600, color: enabled ? "#22c55e" : "#ef4444" }}>
        {enabled ? "Activé" : "Désactivé"}
      </span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const c = color || "var(--texte)";
  return (
    <div style={{
      padding: "12px 16px", borderRadius: 8,
      background: "var(--fond)", border: "1px solid var(--bordure)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--texte-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const getScoreColorBg = (score: number) => getScoreBg(score, 0.15);
const getScoreColorFg = (score: number) => getScoreColor(score);

function getRecBg(rec: string): string {
  if (rec === "apply_now") return "rgba(34,197,94,0.15)";
  if (rec === "review" || rec === "consider") return "rgba(245,158,11,0.15)";
  return "rgba(239,68,68,0.15)";
}

function getRecFg(rec: string): string {
  if (rec === "apply_now") return "#22c55e";
  if (rec === "review" || rec === "consider") return "#f59e0b";
  return "#ef4444";
}
