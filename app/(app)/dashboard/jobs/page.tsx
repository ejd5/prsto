"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Radar, MapPin, Building2, RefreshCw, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, XCircle, ClipboardPaste } from "lucide-react";
import { getOnboardingState } from "@/lib/actions/onboarding";
import type { AgentReadinessResult } from "@/lib/onboarding/readiness";
import { SECTION_ORDER } from "@/lib/onboarding/readiness";
import { isDemoFromParams, DEMO_BADGE_TEXT, DEMO_SAFETY_NOTICE } from "@/lib/jobs/demo-data";
import { getDemoDataStatus, createDemoData, deleteDemoData } from "@/lib/actions/demo";
import type { DemoStatus } from "@/lib/actions/demo";
import { parseImportedJobText } from "@/lib/jobs/text-sanitizer";

interface JobItem {
  id: string; title: string; company: string | null; location: string | null;
  locationPriority: number | null; status: string; sourceUrl: string | null;
  firstSeenAt: string;
  source: { name: string };
  score: { globalScore: number | null; recommendedAction: string | null; executiveScore: number | null; locationScore: number | null; reasonsJson: string | null; redFlagsJson: string | null } | null;
}

export default function JobsDashboardPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [importing, setImporting] = useState(false);
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [readiness, setReadiness] = useState<AgentReadinessResult | null>(null);
  const searchParams = useSearchParams();
  const demoActive = isDemoFromParams(searchParams);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "new") params.set("new", "true");
      if (filter === "paca") params.set("priority", "1");
      if (filter === "idf") params.set("priority", "2");
      if (filter === "shortlist") params.set("status", "shortlisted");
      params.set("limit", "100");
      params.set("demo", demoActive ? "true" : "false");

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { setJobs([]); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    getOnboardingState().then((s) => setReadiness(s.readiness));
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/jobs/import/run", { method: "POST", body: "{}" });
      const data = await res.json();
      alert(`${data.createdCount} nouvelle(s) offre(s) importée(s). ${data.duplicateCount} doublon(s) ignoré(s).`);
      await load();
    } catch { alert("Erreur lors de l&apos;import"); }
    setImporting(false);
  };

  const [preparingApp, setPreparingApp] = useState<Set<string>>(new Set());
  const [draftIds, setDraftIds] = useState<Record<string, string>>({});

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/jobs/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
    await load();
  };

  const handlePrepareApplication = async (jobId: string) => {
    setPreparingApp(prev => new Set(prev).add(jobId));
    try {
      const res = await fetch(`/api/jobs/${jobId}/prepare-application`, { method: "POST" });
      const data = await res.json();
      if (data.draftId) {
        setDraftIds(prev => ({ ...prev, [jobId]: data.draftId }));
        if (confirm("Candidature générée ! Voir le détail ?")) {
          window.location.href = `/dashboard/jobs/applications/${data.draftId}`;
        }
      } else {
        alert(data.error || "Erreur lors de la génération");
      }
    } catch { alert("Erreur réseau"); }
    setPreparingApp(prev => { const n = new Set(prev); n.delete(jobId); return n; });
  };

  const priorityLabel = (p: number | null): string => {
    return p === 1 ? "PACA" : p === 2 ? "IDF" : p === 3 ? "France" : p === 4 ? "INTL" : "?";
  };

  const priorityColor = (p: number | null): string => {
    return p === 1 ? "#22c55e" : p === 2 ? "#f59e0b" : p === 3 ? "#6366f1" : p === 4 ? "#ef4444" : "#808080";
  };

  const actionColor = (a: string | null): string => {
    return a === "apply" ? "#22c55e" : a === "shortlist" ? "#f59e0b" : a === "review" ? "#6366f1" : "#808080";
  };

  const pacaJobs = jobs.filter(j => j.locationPriority === 1).length;
  const idfJobs = jobs.filter(j => j.locationPriority === 2).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <Radar size={22} style={{ color: "var(--or)" }} />
            {demoActive ? "Offres détectées pour votre profil" : "Sourcing — Offres importées"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {demoActive
              ? "ELTON OS a identifié des opportunités cohérentes avec vos priorités géographiques et votre profil exécutif."
              : "Import automatique depuis France Travail, JSON-LD, Michael Page et autres sources."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ background: "var(--or)", color: "#000" }}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
            Lancer l&apos;import
          </button>
          <button
            onClick={() => setShowQuickImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}
          >
            <ClipboardPaste size={14} />
            Importer une offre
          </button>
        </div>
      </div>

      {/* ─── Carte mode démo ─── */}
      {demoActive && <DemoCard />}

      {/* ─── Quick Import Modal ─── */}
      {showQuickImport && <QuickImportModal onClose={() => setShowQuickImport(false)} onDone={load} />}

      {/* ─── Carte readiness agent ─── */}
      {readiness && (
        <div
          className="p-4 rounded-xl border relative overflow-hidden"
          style={{
            borderColor: readiness.status === "not_started" ? "rgba(239,68,68,0.3)" :
                         readiness.status === "in_progress" ? "rgba(245,158,11,0.3)" :
                         "rgba(34,197,94,0.3)",
            background: "var(--fond-surface)",
          }}
        >
          {/* Barre de progression */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "var(--fond-eleve)" }}>
            <div className="h-full transition-all duration-700"
              style={{
                width: `${readiness.globalScore}%`,
                background: readiness.globalScore < 30 ? "#ef4444" : readiness.globalScore < 60 ? "#f59e0b" : readiness.globalScore < 85 ? "var(--or)" : "#22c55e",
              }}
            />
          </div>

          {/* Ligne 1 : titre + score + CTA principal */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {readiness.status === "not_started" ? (
              <AlertTriangle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
            ) : readiness.status === "in_progress" ? (
              <Sparkles size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
            )}
            <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>
              {readiness.status === "not_started" ? "Agent non prêt" :
               readiness.status === "in_progress" ? "Configuration en cours" :
               readiness.status === "almost_ready" ? "Presque prêt" : "Agent prêt"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{
                background: readiness.globalScore < 30 ? "rgba(239,68,68,0.1)" : readiness.globalScore < 60 ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
                color: readiness.globalScore < 30 ? "#ef4444" : readiness.globalScore < 60 ? "#f59e0b" : "#22c55e",
              }}>
              {readiness.globalScore}%
            </span>
            {/* CTA principal */}
            <a href="/demarrage"
              className="inline-flex items-center gap-1 ml-auto px-3 py-1 rounded-md text-xs font-medium border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
              <Sparkles size={11} />
              {readiness.status === "not_started" ? "Démarrer" : readiness.status === "in_progress" ? "Reprendre" : "Modifier"}
            </a>
          </div>

          {/* Ligne 2 : nextBestAction */}
          <p className="text-xs mt-1.5" style={{ color: "var(--texte-secondaire)" }}>
            {readiness.nextBestAction}
          </p>

          {/* Ligne 3 : breakdown + champs manquants en grille compacte */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 mt-2.5">
            {SECTION_ORDER.map((sectionKey) => {
              const b = readiness.breakdown[sectionKey];
              if (!b) return null;
              const sectionParam = sectionKey === "identity" ? "identity" :
                sectionKey === "targeting" ? "targeting" :
                sectionKey === "experiences" ? "experience" :
                sectionKey === "skills" ? "skills" :
                sectionKey === "cvMaster" ? "cv" :
                sectionKey === "proofVault" ? "proof" :
                sectionKey === "sources" ? "sources" :
                sectionKey === "ia" ? "ai" : null;
              return (
                <a key={sectionKey} href={sectionParam ? `/demarrage?section=${sectionParam}` : "/demarrage"}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[10px] transition-colors"
                  style={{
                    borderColor: b.ok ? "rgba(34,197,94,0.2)" : b.score > 0 ? "rgba(245,158,11,0.2)" : "rgba(128,128,128,0.15)",
                    background: b.ok ? "rgba(34,197,94,0.04)" : "var(--fond)",
                    textDecoration: "none",
                  }}
                  title={`${b.label}: ${b.score}/${b.max}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: b.ok ? "#22c55e" : b.score > 0 ? "#f59e0b" : "#374151" }} />
                  <span style={{ color: "var(--texte)" }} className="truncate">{b.label}</span>
                </a>
              );
            })}
          </div>

          {/* Ligne 4 : CTAs secondaires contextuels */}
          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
            {/* Offres */}
            <a href="/dashboard/jobs" className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
              <Radar size={10} /> Voir mes offres
            </a>
            {/* Pipeline si envoyé */}
            <a href="/dashboard/jobs/pipeline" className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
              <RefreshCw size={10} /> Pipeline
            </a>
            {/* CV si manquant */}
            {!readiness.breakdown.cvMaster?.ok && (
              <a href="/demarrage?section=cv" className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border"
                style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
                <Sparkles size={10} /> Importer mon CV
              </a>
            )}
            {/* Sources si manquantes */}
            {!readiness.breakdown.sources?.ok && (
              <a href="/demarrage?section=sources" className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border"
                style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
                <Sparkles size={10} /> Configurer mes sources
              </a>
            )}
            {/* Analytics si candidatures envoyées */}
            {readiness.status === "ready" || readiness.status === "active" ? (
              <a href="/dashboard/jobs/analytics" className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono border"
                style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
                <ArrowRight size={10} /> Analytics
              </a>
            ) : null}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="text-2xl font-bold" style={{ color: "#22c55e" }}>{pacaJobs}</div>
          <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>PACA</div>
        </div>
        <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="text-2xl font-bold" style={{ color: "#f59e0b" }}>{idfJobs}</div>
          <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Île-de-France</div>
        </div>
        <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{jobs.length}</div>
          <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Total</div>
        </div>
        <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="text-2xl font-bold" style={{ color: "var(--or)" }}>{jobs.filter(j => j.score?.globalScore && j.score.globalScore >= 75).length}</div>
          <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Top scores</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Toutes" },
          { key: "new", label: "Nouvelles" },
          { key: "paca", label: "PACA" },
          { key: "idf", label: "IDF" },
          { key: "shortlist", label: "Shortlist" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
            style={{
              background: filter === f.key ? "var(--or)" : "var(--fond)",
              borderColor: filter === f.key ? "var(--or)" : "var(--bordure)",
              color: filter === f.key ? "#000" : "var(--texte-secondaire)",
            }}
          >
            {f.label}
          </button>
        ))}
        <button onClick={load} className="px-3 py-1.5 rounded-md text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
          <RefreshCw size={12} className="inline mr-1" /> Rafraîchir
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center rounded-lg border border-dashed" style={{ borderColor: "var(--bordure-douce)" }}>
          <Radar size={28} style={{ color: "var(--texte-tertiaire)", margin: "0 auto" }} />
          <p className="text-sm mt-3" style={{ color: "var(--texte-secondaire)" }}>Aucune offre importée pour le moment.</p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Cliquez sur &ldquo;Lancer l&apos;import&rdquo; pour d&eacute;marrer.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {jobs.map(job => {
            const s = job.score;
            return (
              <div key={job.id} className="flex items-start gap-3 p-3 rounded-md border transition-colors" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
                {/* Priorité badge */}
                <div className="flex-shrink-0 w-10 text-center">
                  <div className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${priorityColor(job.locationPriority)}20`, color: priorityColor(job.locationPriority) }}>
                    {priorityLabel(job.locationPriority)}
                  </div>
                  {s && (
                    <div className="text-xs font-mono mt-1" style={{ color: actionColor(s.recommendedAction) }}>
                      {s.globalScore || "?"}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>{job.title}</span>
                    {job.company && (
                      <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--texte-secondaire)" }}>
                        <Building2 size={10} /> {job.company}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{job.source?.name}</span>
                  </div>
                  {job.location && (
                    <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--texte-tertiaire)" }}>
                      <MapPin size={9} /> {job.location}
                    </div>
                  )}
                  {s?.reasonsJson && s.reasonsJson !== "[]" && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--succes)" }}>
                      {JSON.parse(s.reasonsJson).map((r: string, i: number) => (
                        <span key={i} className="mr-2">✓ {r}</span>
                      ))}
                    </div>
                  )}
                  {s?.redFlagsJson && s.redFlagsJson !== "[]" && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--erreur)" }}>
                      {JSON.parse(s.redFlagsJson).map((r: string, i: number) => (
                        <span key={i} className="mr-2">⚠ {r}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-1">
                  {job.sourceUrl && (
                    <button onClick={() => window.open(job.sourceUrl || "", "_blank")}
                      className="px-2 py-1 text-xs font-mono rounded border transition-colors"
                      style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                      Voir
                    </button>
                  )}
                  <button onClick={() => handleStatus(job.id, "shortlisted")}
                    className="px-2 py-1 text-xs font-mono rounded border transition-colors"
                    style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                    Shortlist
                  </button>
                  <button onClick={() => handlePrepareApplication(job.id)}
                    disabled={preparingApp.has(job.id)}
                    className="px-2 py-1 text-xs font-mono rounded border transition-colors"
                    style={{
                      borderColor: draftIds[job.id] ? "var(--succes)" : "#8b5cf6",
                      color: preparingApp.has(job.id) ? "var(--texte-tertiaire)" : (draftIds[job.id] ? "#22c55e" : "#8b5cf6"),
                    }}>
                    {preparingApp.has(job.id) ? <Loader2 size={10} className="animate-spin inline mr-0.5" /> : null}
                    {draftIds[job.id] ? "Voir candidature" : "Préparer candidature IA"}
                  </button>
                  <button onClick={() => handleStatus(job.id, "rejected")}
                    className="px-2 py-1 text-xs font-mono rounded border transition-colors"
                    style={{ borderColor: "var(--erreur)", color: "var(--erreur)" }}>
                    Passer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Composant carte mode démo ─── */
/* ─── Quick Import Modal ─── */
function QuickImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    const lines = text.split(/\n/).filter((l) => l.trim().length > 3);
    const title = lines[0]?.trim().slice(0, 200) || "Offre importée";
    const company = lines[1]?.trim().slice(0, 200) || "Entreprise inconnue";
    try {
      const res = await fetch("/api/jobs/importer/capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, description: text.slice(0, 5000), sourceName: "Import manuel" }),
      });
      const data = await res.json();
      if (data.success) { onDone(); onClose(); } else setError(data.error || "Erreur");
    } catch { setError("Erreur réseau"); }
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="rounded-xl border shadow-2xl p-6 max-w-xl w-full space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--texte)" }}><ClipboardPaste size={18} style={{ color: "var(--or)" }} />Importer une offre</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}><XCircle size={18} /></button>
        </div>
        <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Collez le texte de l&apos;annonce copié depuis LinkedIn, Indeed ou APEC.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Collez ici (Cmd+V)..." rows={10} autoFocus className="w-full p-3 rounded-lg border text-sm resize-y" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }} />
        {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        <button onClick={handleSubmit} disabled={saving || !text.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--or)", color: "#000", opacity: saving || !text.trim() ? 0.4 : 1 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <ClipboardPaste size={14} />}Créer l&apos;offre
        </button>
      </div>
    </div>
  );
}

/* ─── Composant carte mode démo ─── */
function DemoCard() {
  const router = useRouter();
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getDemoDataStatus().then(setStatus).catch((e) => {
      console.error("getDemoDataStatus failed:", e);
    });
  }, []);

  const handleCreate = async () => {
    setBusy("create");
    try {
      const r = await createDemoData();
      if (r.success) {
        getDemoDataStatus().then(setStatus);
      } else {
        alert("Erreur création démo : " + (r.error || "inconnue") + "\n\nVérifiez la console pour plus de détails.");
        console.error("createDemoData failed:", r.error);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Erreur création démo : " + msg);
      console.error("createDemoData threw:", e);
    }
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer toutes les données démo [DEMO] ? Les vraies données sont protégées.")) return;
    setBusy("delete");
    try {
      const r = await deleteDemoData();
      if (r.success) {
        getDemoDataStatus().then(setStatus).catch(console.error);
      } else {
        alert("Erreur suppression démo : " + (r.error || "inconnue"));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Erreur suppression démo : " + msg);
      console.error(e);
    }
    setBusy(null);
  };

  return (
    <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: "rgba(139,92,246,0.3)", background: "var(--fond-surface)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Sparkles size={16} style={{ color: "#8b5cf6" }} />
        <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Démo ELTON OS</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>{DEMO_BADGE_TEXT}</span>
      </div>

      {/* Safety */}
      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{DEMO_SAFETY_NOTICE}</p>

      {/* Status or actions */}
      {status?.hasDemoData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 rounded text-center" style={{ background: "var(--fond)" }}>
              <p className="font-bold" style={{ color: "var(--texte)" }}>{status.demoJobsCount}</p>
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>offres</p>
            </div>
            <div className="p-2 rounded text-center" style={{ background: "var(--fond)" }}>
              <p className="font-bold" style={{ color: "var(--texte)" }}>{status.demoDraftsCount}</p>
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>candidatures</p>
            </div>
            <div className="p-2 rounded text-center" style={{ background: "var(--fond)" }}>
              <p className="font-bold" style={{ color: "#f59e0b" }}>{status.demoToFollowUpCount}</p>
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>à relancer</p>
            </div>
            <div className="p-2 rounded text-center" style={{ background: "var(--fond)" }}>
              <p className="font-bold" style={{ color: "#22c55e" }}>{status.demoRepliedCount}</p>
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>réponses</p>
            </div>
            <div className="p-2 rounded text-center" style={{ background: "var(--fond)" }}>
              <p className="font-bold" style={{ color: "#8b5cf6" }}>{status.demoInterviewCount}</p>
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>entretiens</p>
            </div>
            <div className="p-2 rounded text-center" style={{ background: "var(--fond)" }}>
              <p className="font-bold" style={{ color: "#22c55e" }}>{status.demoOfferCount}</p>
              <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>offres reçues</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => router.push("/dashboard/jobs/pipeline?demo=true")}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
              <ArrowRight size={11} /> Voir Pipeline démo
            </button>
            <button onClick={() => router.push("/dashboard/jobs/analytics?demo=true")}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
              <ArrowRight size={11} /> Voir Analytics démo
            </button>
            <button onClick={handleDelete} disabled={busy !== null}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "#ef4444", color: "#ef4444", opacity: busy ? 0.4 : 1 }}>
              {busy === "delete" ? <Loader2 size={11} className="animate-spin" /> : null}
              Supprimer données démo
            </button>
            <a href="/dashboard/jobs" className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
              <XCircle size={11} /> Quitter le mode démo
            </a>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button onClick={handleCreate} disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ background: "#8b5cf6", color: "#fff", opacity: busy ? 0.4 : 1 }}>
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Créer les données démo
          </button>
          <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            10 offres · 6 candidatures · pipeline complet · analytics
          </p>
        </div>
      )}
    </div>
  );
}
