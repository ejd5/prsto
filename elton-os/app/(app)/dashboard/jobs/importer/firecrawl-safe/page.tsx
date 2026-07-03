"use client";

import { useState } from "react";
import {
  Search, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Building2, MapPin, ExternalLink, ShieldCheck, ShieldAlert,
  FileText, Download, Eye,
} from "lucide-react";
import Link from "next/link";

interface FirecrawlJob {
  externalId?: string;
  sourceUrl: string;
  canonicalUrl?: string;
  title: string;
  company?: string;
  location?: string;
  remotePolicy?: string;
  contractType?: string;
  description?: string;
  functionArea?: string;
  sector?: string;
  _quality?: { confidence: string; issues: string[] };
}

interface AuditEntry {
  timestamp: string;
  actor: string;
  sourceUrl: string;
  normalizedDomain: string;
  scannerDecision: string;
  connector: string;
  extractionMethod: string;
  status: string;
  reasonCode: string;
  durationMs: number;
  jobsExtracted: number;
  errors: string[];
}

interface PreviewResult {
  success: boolean;
  mode?: string;
  complianceStatus?: string;
  reasonCode?: string;
  message?: string;
  suggestedMode?: string;
  audit?: AuditEntry;
  jobs?: FirecrawlJob[];
}

interface ImportResult {
  success: boolean;
  imported?: number;
  duplicates?: number;
  skipped?: number;
  jobIds?: string[];
  warnings?: Array<{ index: number; title: string; warnings: string[] }>;
  error?: string;
}

const ISSUE_LABELS: Record<string, string> = {
  missing_company: "Entreprise manquante",
  missing_location: "Localisation manquante",
  low_confidence: "Description très courte — score réduit",
  short_description: "Description limitée",
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
  refused_missing_api_key: "Configuration Firecrawl absente",
  error_firecrawl_rate_limit: "Limite de taux atteinte",
  error_firecrawl_timeout: "Timeout",
  error_parse_failed: "Échec du parsing",
};

const STATUS_BADGE: Record<string, { bg: string; fg: string; icon: typeof ShieldCheck }> = {
  allowed: { bg: "rgba(34,197,94,0.15)", fg: "#22c55e", icon: ShieldCheck },
  refused: { bg: "rgba(239,68,68,0.15)", fg: "#ef4444", icon: ShieldAlert },
  error: { bg: "rgba(245,158,11,0.15)", fg: "#f59e0b", icon: AlertTriangle },
};

export default function FirecrawlSafeImporterPage() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setPreviewResult(null);
    setImportResult(null);
    setSelectedJobs(new Set());
    try {
      const res = await fetch("/api/jobs/firecrawl-safe/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data: PreviewResult = await res.json();
      setPreviewResult(data);
    } catch (e: unknown) {
      setPreviewResult({
        success: false,
        complianceStatus: "error",
        reasonCode: "error_parse_failed",
        message: e instanceof Error ? e.message : "Erreur réseau",
      });
    }
    setScanning(false);
  };

  const toggleJob = (index: number) => {
    const next = new Set(selectedJobs);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedJobs(next);
  };

  const toggleAll = () => {
    if (!previewResult?.jobs) return;
    if (selectedJobs.size === previewResult.jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(previewResult.jobs.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!previewResult?.jobs || selectedJobs.size === 0) return;
    setImporting(true);
    try {
      const selected = Array.from(selectedJobs)
        .sort((a, b) => a - b)
        .map((i) => previewResult.jobs![i]);
      const res = await fetch("/api/jobs/firecrawl-safe/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          selectedJobs: selected,
        }),
      });
      const data: ImportResult = await res.json();
      setImportResult(data);
    } catch (e: unknown) {
      setImportResult({
        success: false,
        error: e instanceof Error ? e.message : "Erreur réseau",
      });
    }
    setImporting(false);
  };

  const renderAudit = (audit: AuditEntry) => (
    <div style={{ marginTop: 24, padding: 16, background: "var(--or-surface)", borderRadius: 8, border: "1px solid var(--or-border)" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={14} /> Journal conformité
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 13 }}>
        <div><span style={{ color: "var(--or-muted)" }}>Source :</span> {audit.sourceUrl}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Domaine :</span> {audit.normalizedDomain}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Décision scanner :</span> {audit.scannerDecision}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Connecteur :</span> {audit.connector}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Méthode :</span> {audit.extractionMethod}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Statut :</span> <span style={{ color: STATUS_BADGE[audit.status]?.fg }}>{audit.status}</span></div>
        <div><span style={{ color: "var(--or-muted)" }}>Code raison :</span> {REASON_LABELS[audit.reasonCode] || audit.reasonCode}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Offres extraites :</span> {audit.jobsExtracted}</div>
        <div><span style={{ color: "var(--or-muted)" }}>Durée :</span> {(audit.durationMs / 1000).toFixed(1)}s</div>
        <div><span style={{ color: "var(--or-muted)" }}>Timestamp :</span> {new Date(audit.timestamp).toLocaleString("fr-FR")}</div>
        {audit.errors.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: "var(--or-muted)" }}>Erreurs :</span> {audit.errors.join(", ")}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          <Eye size={24} /> Firecrawl Safe — Import automatique sécurisé
        </h1>
        <p style={{ color: "var(--or-muted)", marginTop: 4, fontSize: 14 }}>
          Extraction automatique d&apos;offres depuis des pages carrières publiques autorisées.
          Aucune automatisation de LinkedIn, Indeed ou APEC.
          {" "}<Link href="/dashboard/jobs/sources" style={{ color: "var(--or)", textDecoration: "underline" }}>Sources enregistrées</Link>
        </p>
      </div>

      {/* URL Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="url"
          placeholder="https://boards.greenhouse.io/company/jobs/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid var(--or-border)", background: "var(--or-surface)",
            color: "var(--or-foreground)", fontSize: 14,
          }}
        />
        <button
          onClick={handleScan}
          disabled={scanning || !url.trim()}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: scanning ? "var(--or-muted)" : "var(--or-accent)",
            color: "#fff", fontWeight: 600, fontSize: 14, cursor: scanning ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Scanner
        </button>
      </div>

      {/* Result area */}
      {previewResult && (
        <div style={{ marginTop: 16 }}>
          {/* Compliance Status */}
          <div style={{
            padding: 16, borderRadius: 8, marginBottom: 16,
            background: (STATUS_BADGE[previewResult.complianceStatus || ""] || STATUS_BADGE.error).bg,
            border: `1px solid ${(STATUS_BADGE[previewResult.complianceStatus || ""] || STATUS_BADGE.error).fg}33`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {(() => {
                const badge = STATUS_BADGE[previewResult.complianceStatus || ""] || STATUS_BADGE.error;
                const Icon = badge.icon;
                return <Icon size={20} color={badge.fg} />;
              })()}
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                {previewResult.success ? "Source autorisée" : "Source refusée"}
              </span>
              {previewResult.reasonCode && (
                <span style={{
                  padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                  background: (STATUS_BADGE[previewResult.complianceStatus || ""] || STATUS_BADGE.error).bg,
                  color: (STATUS_BADGE[previewResult.complianceStatus || ""] || STATUS_BADGE.error).fg,
                }}>
                  {REASON_LABELS[previewResult.reasonCode] || previewResult.reasonCode}
                </span>
              )}
            </div>
            {previewResult.message && (
              <p style={{ fontSize: 14, color: "var(--or-muted)", margin: 0 }}>{previewResult.message}</p>
            )}
          </div>

          {/* Refused: guidance */}
          {!previewResult.success && (
            <div style={{ padding: 16, background: "rgba(234,179,8,0.1)", borderRadius: 8, border: "1px solid rgba(234,179,8,0.3)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color="#eab308" /> Action recommandée
              </h3>
              {previewResult.suggestedMode === "USER_ASSISTED" ? (
                <div>
                  <p style={{ fontSize: 13, color: "var(--or-muted)", marginBottom: 8 }}>
                    Cette source nécessite une action humaine. Ouvrez l&apos;annonce dans votre navigateur
                    et utilisez l&apos;extension Chrome PRSTO pour l&apos;importer.
                  </p>
                  <Link
                    href="/dashboard/jobs/importer/extension"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      background: "#eab308", color: "#000", textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={14} /> Guide extension Chrome
                  </Link>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--or-muted)" }}>
                  Vérifiez la configuration ou réessayez avec une autre URL.
                </p>
              )}
            </div>
          )}

          {/* Allowed: job table */}
          {previewResult.success && previewResult.jobs && (
            <div>
              <div style={{
                padding: "8px 14px", marginBottom: 16, borderRadius: 6,
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                fontSize: 13, color: "var(--or-muted)",
              }}>
                <strong style={{ color: "#3b82f6" }}>Preview only</strong> — les offres ne seront importées qu&apos;après votre validation.
                Cochez les offres à importer, puis cliquez sur Importer.
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>
                  {previewResult.jobs.length} offre(s) détectée(s)
                </h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={toggleAll}
                    style={{
                      padding: "6px 14px", borderRadius: 6, border: "1px solid var(--or-border)",
                      background: "transparent", color: "var(--or-foreground)", fontSize: 13, cursor: "pointer",
                    }}
                  >
                    {selectedJobs.size === previewResult.jobs.length ? "Désélectionner tout" : "Sélectionner tout"}
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || selectedJobs.size === 0}
                    style={{
                      padding: "8px 20px", borderRadius: 8, border: "none",
                      background: selectedJobs.size === 0 ? "var(--or-muted)" : "#22c55e",
                      color: "#fff", fontWeight: 600, fontSize: 13,
                      cursor: selectedJobs.size === 0 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Importer {selectedJobs.size > 0 ? `(${selectedJobs.size})` : ""}
                  </button>
                </div>
              </div>

              <div style={{ overflow: "auto", borderRadius: 8, border: "1px solid var(--or-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--or-surface)", borderBottom: "1px solid var(--or-border)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", width: 40 }}>#</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Titre</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Entreprise</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Localisation</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Source</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Qualité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.jobs.map((job, i) => (
                      <tr
                        key={i}
                        onClick={() => toggleJob(i)}
                        style={{
                          cursor: "pointer",
                          background: selectedJobs.has(i) ? "rgba(34,197,94,0.08)" : "transparent",
                          borderBottom: "1px solid var(--or-border)",
                        }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          <input type="checkbox" checked={selectedJobs.has(i)} onChange={() => toggleJob(i)} />
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 500 }}>{job.title}</td>
                        <td style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                          {job.company && <Building2 size={12} color="var(--or-muted)" />}
                          {job.company || "—"}
                        </td>
                        <td style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                          {job.location && <MapPin size={12} color="var(--or-muted)" />}
                          {job.location || "—"}
                        </td>
                        <td style={{ padding: "8px 12px", color: "var(--or-muted)", fontSize: 12 }}>
                          {job.sourceUrl ? (() => { try { return new URL(job.sourceUrl).hostname; } catch { return job.sourceUrl; } })() : "firecrawl-safe"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          {job._quality?.issues && job._quality.issues.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {job._quality.issues.map((issue) => (
                                <span key={issue} style={{
                                  fontSize: 10, padding: "1px 6px", borderRadius: 4,
                                  background: issue === "low_confidence" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                  color: issue === "low_confidence" ? "#ef4444" : "#f59e0b",
                                }}>
                                  {ISSUE_LABELS[issue] || issue}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 10, color: "#22c55e" }}>OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 8,
              background: importResult.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${importResult.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>
              {importResult.success ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <CheckCircle2 size={18} color="#22c55e" />
                    <span style={{ fontWeight: 600 }}>Import terminé</span>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                    <span><strong>{importResult.imported}</strong> importée(s)</span>
                    <span><strong>{importResult.duplicates}</strong> doublon(s)</span>
                    <span><strong>{importResult.skipped}</strong> ignorée(s)</span>
                  </div>
                  {importResult.warnings && importResult.warnings.length > 0 && (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>
                        <AlertTriangle size={12} style={{ display: "inline", marginRight: 4 }} />
                        Avertissements qualité ({importResult.warnings.length})
                      </span>
                      <ul style={{ margin: "6px 0 0 16px", fontSize: 12, color: "var(--or-muted)" }}>
                        {importResult.warnings.slice(0, 5).map((w, i) => (
                          <li key={i}><strong>{w.title}</strong> : {w.warnings.join(", ")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResult.jobIds && importResult.jobIds.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Link
                        href="/dashboard/jobs"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                          background: "var(--or-accent)", color: "#fff", textDecoration: "none",
                        }}
                      >
                        Voir les offres importées →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <XCircle size={18} color="#ef4444" />
                    <span style={{ fontWeight: 600 }}>Échec de l&apos;import</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--or-muted)", marginTop: 4 }}>{importResult.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Audit */}
          {previewResult.audit && renderAudit(previewResult.audit)}
        </div>
      )}

      {/* Empty state help */}
      {!previewResult && (
        <div style={{
          marginTop: 24, padding: 24, borderRadius: 8,
          background: "var(--or-surface)", border: "1px solid var(--or-border)",
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sources compatibles</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 13 }}>
            <div><ShieldCheck size={12} color="#22c55e" style={{ marginRight: 6, display: "inline" }} /> Greenhouse (boards.greenhouse.io)</div>
            <div><ShieldCheck size={12} color="#22c55e" style={{ marginRight: 6, display: "inline" }} /> Lever (jobs.lever.co)</div>
            <div><ShieldCheck size={12} color="#22c55e" style={{ marginRight: 6, display: "inline" }} /> Ashby (jobs.ashbyhq.com)</div>
            <div><ShieldCheck size={12} color="#22c55e" style={{ marginRight: 6, display: "inline" }} /> Workable (apply.workable.com)</div>
            <div><ShieldCheck size={12} color="#22c55e" style={{ marginRight: 6, display: "inline" }} /> SmartRecruiters (jobs.smartrecruiters.com)</div>
            <div><ShieldCheck size={12} color="#22c55e" style={{ marginRight: 6, display: "inline" }} /> Pages carrières publiques</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Sources refusées (import assisté requis)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 13 }}>
              <div><ShieldAlert size={12} color="#ef4444" style={{ marginRight: 6, display: "inline" }} /> LinkedIn</div>
              <div><ShieldAlert size={12} color="#ef4444" style={{ marginRight: 6, display: "inline" }} /> Indeed</div>
              <div><ShieldAlert size={12} color="#ef4444" style={{ marginRight: 6, display: "inline" }} /> APEC</div>
              <div><ShieldAlert size={12} color="#ef4444" style={{ marginRight: 6, display: "inline" }} /> Pages avec login/CAPTCHA</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
