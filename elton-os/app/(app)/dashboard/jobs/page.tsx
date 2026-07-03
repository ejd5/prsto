"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Radar, MapPin, Building2, RefreshCw, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, XCircle, ClipboardPaste, Trash2, Search, Globe, Clock, UserPlus, MessageSquare, X, Eye, Star, Archive, HelpCircle, Layers, TrendingUp } from "lucide-react";
import ApplicationCreatedModal from "@/components/jobs/ApplicationCreatedModal";
import { getOnboardingState } from "@/lib/actions/onboarding";
import type { AgentReadinessResult } from "@/lib/onboarding/readiness";
import { SECTION_ORDER } from "@/lib/onboarding/readiness";
import { isDemoFromParams, DEMO_BADGE_TEXT, DEMO_SAFETY_NOTICE } from "@/lib/jobs/demo-data";
import { getDemoDataStatus, createDemoData, deleteDemoData } from "@/lib/actions/demo";
import type { DemoStatus } from "@/lib/actions/demo";
import { useUxMode } from "@/lib/ux-mode";
import { useToast } from "@/components/ui/EltonToast";
import ConfirmActionDialog from "@/components/ui/ConfirmActionDialog";
import SuccessActionModal from "@/components/ui/SuccessActionModal";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonToday } from "@/components/ui/SkeletonCard";
import { computeDashboardCounts, applyJobsFilter, getFilterLabel, VALID_FILTERS } from "@/lib/jobs/dashboard-filters";
import { getScoreColor, getScoreBg } from "@/lib/score-colors";

interface JobItem {
  id: string; title: string; company: string | null; location: string | null;
  locationPriority: number | null; status: string; sourceUrl: string | null;
  firstSeenAt: string; publishedAt: string | null;
  source: { name: string; type: string | null };
  score: { globalScore: number | null; recommendedAction: string | null; executiveScore: number | null; locationScore: number | null; reasonsJson: string | null; redFlagsJson: string | null; semanticScore: number | null; recommendation: string | null; semanticConfidence: number | null } | null;
  draft?: { id: string } | null;
}

export default function JobsDashboardPage() {
  const router = useRouter();
  const { isExpert } = useUxMode();
  const toast = useToast();
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [importing, setImporting] = useState(false);
  const [readiness, setReadiness] = useState<AgentReadinessResult | null>(null);
  const searchParams = useSearchParams();
  const demoActive = isDemoFromParams(searchParams);
  const [draftIds, setDraftIds] = useState<Record<string, string>>({});
  const [successModal, setSuccessModal] = useState<{ draftId: string; jobTitle: string; company: string } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState(false);

  // Read filter from URL query param on mount
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam && VALID_FILTERS.includes(filterParam)) {
      setFilter(filterParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always load ALL jobs (no filter in API call)
  const loadAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("demo", demoActive ? "true" : "false");

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      const jobsList: JobItem[] = data.jobs || [];
      setAllJobs(jobsList);

      const draftMap: Record<string, string> = {};
      for (const j of jobsList) {
        if (j.draft?.id) draftMap[j.id] = j.draft.id;
      }
      setDraftIds(draftMap);
    } catch { setAllJobs([]); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Computed: dashboard counts from ALL jobs (never affected by filter)
  const counts = useMemo(() => computeDashboardCounts(allJobs), [allJobs]);

  // Computed: displayed jobs based on active filter
  const displayedJobs = useMemo(() => applyJobsFilter(allJobs, filter), [allJobs, filter]);

  const [latestReport, setLatestReport] = useState<{
    found: boolean; fetchedCount: number; createdCount: number; duplicateCount: number;
    rejectedCount: number; startedAt: string; status: string;
    intlAccepted?: number; intlRejected?: number;
    topJobs?: Array<{title:string;company:string;score:number}>;
  } | null>(null);

  useEffect(() => {
    getOnboardingState().then((s) => setReadiness(s.readiness));
    fetch("/api/jobs/quick-score", { method: "POST" }).catch(() => {});
    fetch("/api/jobs/cron/sourcing/dashboard").then(r => r.json()).then(d => {
      if (d.found) setLatestReport(d);
    }).catch(() => {});
  }, []);

  const handleFilterChange = (key: string) => {
    setFilter(key);
    const url = new URL(window.location.href);
    url.searchParams.set("filter", key);
    window.history.replaceState({}, "", url.toString());
  };

  const handleImportMulti = async (sources: string[]) => {
    setImporting(true);
    try {
      let totalCreated = 0;
      let totalDup = 0;
      for (const source of sources) {
        const res = await fetch("/api/jobs/import/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, maxPages: 1, maxJobsPerRun: 25, dryRun: false }),
        });
        const data = await res.json();
        totalCreated += data.createdCount || 0;
        totalDup += data.duplicateCount || 0;
      }
      toast.success(`${totalCreated} nouvelle(s) offre(s) importée(s). ${totalDup} doublon(s) ignoré(s).`);
      await loadAll();
    } catch { toast.error("Erreur lors de l'import. Vérifiez les sources."); }
    setImporting(false);
  };

  const [preparingApp, setPreparingApp] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "score" | "score-asc" | "location" | "title">("recent");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<JobItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fermer le modal avec Escape
  useEffect(() => {
    if (!selectedJob && !confirmDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedJob(null);
        if (!deleting) setConfirmDelete(null);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [selectedJob, confirmDelete, deleting]);

  const handleDelete = async (job: JobItem) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Offre « ${job.title.slice(0, 40)}… » supprimée`);
        setSelectedJob(null);
        setConfirmDelete(null);
        await loadAll();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau lors de la suppression");
    }
    setDeleting(false);
  };

  // Apply search + sort
  const finalJobs = useMemo(() => {
    let list = displayedJobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        (j.title || "").toLowerCase().includes(q) ||
        (j.company || "").toLowerCase().includes(q) ||
        (j.location || "").toLowerCase().includes(q) ||
        (j.source?.name || "").toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "score":
          return (b.score?.globalScore ?? -1) - (a.score?.globalScore ?? -1);
        case "score-asc":
          return (a.score?.globalScore ?? 999) - (b.score?.globalScore ?? 999);
        case "location":
          return (a.locationPriority ?? 99) - (b.locationPriority ?? 99);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "recent":
        default:
          return new Date(b.publishedAt || b.firstSeenAt).getTime() - new Date(a.publishedAt || a.firstSeenAt).getTime();
      }
    });
    return sorted;
  }, [displayedJobs, search, sort]);

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/jobs/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
    await loadAll();
  };

  const [purging, setPurging] = useState(false);
  const handlePurgeArchived = async () => {
    setConfirmPurge(false);
    setPurging(true);
    try {
      const res = await fetch("/api/jobs/purge-archived", { method: "DELETE" });
      const data = await res.json();
      toast.success(`${data.purged} offre(s) supprimée(s) définitivement.`);
      await loadAll();
    } catch { toast.error("Erreur lors de la purge"); }
    setPurging(false);
  };

  const handlePrepareApplication = async (jobId: string) => {
    setGenError(null);
    setPreparingApp(prev => new Set(prev).add(jobId));
    const job = allJobs.find(j => j.id === jobId);
    const jobTitle = job?.title || "";
    const company = job?.company || "";
    try {
      const res = await fetch(`/api/jobs/${jobId}/prepare-application`, { method: "POST" });
      const data = await res.json();
      if (data.draftId) {
        setDraftIds(prev => ({ ...prev, [jobId]: data.draftId }));
        setSuccessModal({ draftId: data.draftId, jobTitle, company });
      } else {
        setGenError(data.error || "Impossible de générer le dossier pour le moment. Réessayez ou consultez les logs.");
      }
    } catch { setGenError("Impossible de générer le dossier pour le moment."); }
    setPreparingApp(prev => { const n = new Set(prev); n.delete(jobId); return n; });
  };

  const priorityLabel = (p: number | null): string => {
    return p === 1 ? "PACA" : p === 2 ? "IDF" : p === 3 ? "France" : p === 4 ? "INTL" : "?";
  };

  const priorityColor = (p: number | null): string => {
    return p === 1 ? "#22c55e" : p === 2 ? "#f59e0b" : p === 3 ? "#6366f1" : p === 4 ? "#ef4444" : "#808080";
  };

  const formatJobDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const isNew = (dateStr: string | null): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / 3600000;
    return diffHours < 48;
  };

  // All counts come from allJobs (not filtered list)
  const { total, newCount, topCount, needsApplicationCount, pacaCount, idfCount } = counts;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {genError && (
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2">
            <XCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "#fca5a5" }}>{genError}</span>
          </div>
          <button onClick={() => setGenError(null)} className="text-xs opacity-60 hover:opacity-100" style={{ color: "#666" }}><X size={14} /></button>
        </div>
      )}

      <ApplicationCreatedModal
        open={!!successModal}
        jobTitle={successModal?.jobTitle || ""}
        company={successModal?.company || ""}
        draftId={successModal?.draftId || ""}
        onViewDraft={() => {
          if (successModal) window.location.href = `/dashboard/jobs/applications/${successModal.draftId}`;
        }}
        onClose={() => setSuccessModal(null)}
      />

      <ConfirmActionDialog
        open={confirmPurge}
        title="Purger les offres archivées"
        message={`Supprimer définitivement ${displayedJobs.length} offre(s) archivée(s) ? Cette action est irréversible.`}
        confirmLabel="Purger"
        destructive
        loading={purging}
        onConfirm={handlePurgeArchived}
        onCancel={() => setConfirmPurge(false)}
      />

      {/* Aujourd'hui cards — compteurs GLOBAUX (jamais filtrés) */}
      {!loading && allJobs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <Sparkles size={14} style={{ color: "var(--or)" }} />
            Aujourd'hui, quoi faire ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <TodayCard
              icon={<Radar size={16} />}
              title={`${newCount} nouvelle(s) offre(s) à vérifier`}
              desc="Consultez les offres récentes et décidez si elles méritent une candidature."
              badge={newCount > 0 ? { label: `${newCount} nouvelle(s)`, color: "#22c55e" } : undefined}
              action={{ label: "Voir les nouvelles", onClick: () => handleFilterChange("new") }}
            />
            <TodayCard
              icon={<Star size={16} />}
              title={`${topCount} offre(s) très pertinente(s)`}
              desc="Ces offres ont un score de compatibilité élevé avec votre profil."
              badge={topCount > 0 ? { label: "Top match", color: "var(--or)" } : undefined}
              action={{ label: "Voir les tops", onClick: () => handleFilterChange("highly_rec") }}
            />
            <TodayCard
              icon={<Sparkles size={16} />}
              title={`${needsApplicationCount} candidature(s) à préparer`}
              desc="Générez CV + lettre + email adaptés à chaque offre. Rien n'est envoyé automatiquement."
              badge={needsApplicationCount > 0 ? { label: "Prêt", color: "#8b5cf6" } : undefined}
              action={{ label: "Préparer", onClick: () => handleFilterChange("needs_application") }}
            />
            {isExpert && (
              <TodayCard
                icon={<Globe size={16} />}
                title="Lancer les sources"
                desc="Scannez France Travail, ATS publics et autres sources pour découvrir de nouvelles offres."
                action={{ label: "Sources", onClick: () => router.push("/dashboard/jobs/source-scanner") }}
              />
            )}
            <TodayCard
              icon={<ClipboardPaste size={16} />}
              title="Extension Chrome"
              desc="Importez une offre depuis LinkedIn, Indeed ou APEC en un clic."
              action={{ label: "Configurer", onClick: () => router.push("/dashboard/jobs/importer/extension") }}
            />
            {readiness && readiness.status !== "ready" && (
              <TodayCard
                icon={<HelpCircle size={16} />}
                title="Configuration à terminer"
                desc={readiness.nextBestAction || "Complétez votre profil pour des meilleures recommandations."}
                badge={{ label: `${readiness.globalScore}%`, color: "#f59e0b" }}
                action={{ label: "Continuer", onClick: () => router.push("/demarrage") }}
              />
            )}
          </div>
        </div>
      )}

      {loading && <SkeletonToday />}

      {/* Header — premium title + KPI cards */}
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--texte-tertiaire)" }}>
              <Radar size={11} style={{ color: "var(--or)" }} />
              <span>Espace de travail · Offres</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3" style={{ color: "var(--texte)" }}>
              {demoActive ? "Offres détectées" : "Missions Actives"}
            </h1>
            <p className="text-sm mt-2 max-w-2xl" style={{ color: "var(--texte-secondaire)" }}>
              {filter !== "all"
                ? <>Filtre actif&nbsp;: <span style={{ color: "var(--or)" }}>{getFilterLabel(filter)}</span> · {displayedJobs.length} affichée(s) sur {total}</>
                : `${total} offre(s) analysée(s) et scorée(s) par PRSTO.`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isExpert && (
              <>
                <button onClick={() => handleImportMulti(["france-travail"])} disabled={importing}
                  title="Scanner les offres publiques de France Travail"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{ background: "var(--or)", color: "#000" }}>
                  {importing ? <Loader2 size={13} className="animate-spin" /> : <Radar size={13} />}
                  France Travail
                </button>
                <button onClick={() => handleImportMulti(["public-ats", "generic-jsonld"])} disabled={importing}
                  title="Scanner les ATS publics (sites carrières, JSON-LD)"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{ background: "#6366f1", color: "#fff" }}>
                  {importing ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                  ATS publics
                </button>
              </>
            )}
            <a href="/dashboard/jobs/importer"
              title="Import rapide d'une offre via copier-coller ou URL"
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-colors"
              style={{ background: "#22c55e", color: "#000", textDecoration: "none" }}>
              <ClipboardPaste size={13} />Import Express
            </a>
            <a href="/market-radar"
              title="Scanner les sources pour détecter des offres cachées"
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium border transition-colors"
              style={{ borderColor: "#8b5cf6", color: "#8b5cf6", textDecoration: "none" }}>
              <Search size={13} />Scanner
            </a>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total" value={total} icon={<Radar size={14} />} accent="var(--texte)" hint="Offres importées" />
          <KpiCard label="Nouvelles" value={newCount} icon={<Sparkles size={14} />} accent="#22c55e" hint="< 48h" />
          <KpiCard label="Top match" value={topCount} icon={<Star size={14} />} accent="var(--or)" hint="Score ≥ 75" />
          <KpiCard label="À préparer" value={needsApplicationCount} icon={<ClipboardPaste size={14} />} accent="#8b5cf6" hint="Candidatures" />
        </div>
      </div>

      {demoActive && <DemoCard />}

      {isExpert && latestReport?.found && (
        <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--texte)" }}>
              <Clock size={12} style={{ color: "var(--or)" }} />
              Dernier sourcing
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
              {latestReport.startedAt ? new Date(latestReport.startedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <StatMini label="Fetch" value={latestReport.fetchedCount} color="var(--texte)" />
            <StatMini label="Créées" value={latestReport.createdCount} color="#22c55e" />
            <StatMini label="Doublons" value={latestReport.duplicateCount} color="var(--texte-tertiaire)" />
            <StatMini label="Filtrées" value={latestReport.rejectedCount} color="#f59e0b" />
            <StatMini label="Top" value={latestReport.topJobs?.[0]?.score || "—"} color="var(--or)" />
          </div>
          <div className="flex gap-2 mt-2">
            <a href="/dashboard/jobs/source-scanner" className="text-[10px] font-mono" style={{ color: "var(--or)" }}>Source Scanner</a>
          </div>
        </div>
      )}

      {isExpert && <CrmSummaryBlock />}

      {readiness && (
        <div className="p-4 rounded-xl border relative overflow-hidden" style={{
            borderColor: readiness.status === "not_started" ? "rgba(239,68,68,0.3)" :
                         readiness.status === "in_progress" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)",
            background: "var(--fond-surface)",
          }}>
          {isExpert && (
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "var(--fond-eleve)" }}>
              <div className="h-full transition-all duration-700" style={{
                  width: `${readiness.globalScore}%`,
                  background: getScoreColor(readiness.globalScore),
                }} />
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {readiness.status === "not_started" ? <AlertTriangle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
              : readiness.status === "in_progress" ? <Sparkles size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
              : <CheckCircle2 size={16} style={{ color: "#22c55e", flexShrink: 0 }} />}
            <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>
              {readiness.status === "not_started" ? "Configuration à démarrer" :
               readiness.status === "in_progress" ? "Configuration en cours" : "Profil prêt"}
            </span>
            {isExpert && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold" style={{
                  background: getScoreBg(readiness.globalScore, 0.1),
                  color: getScoreColor(readiness.globalScore),
                }}>{readiness.globalScore}%</span>
            )}
            <a href="/demarrage"
              className="inline-flex items-center gap-1 ml-auto px-3 py-1 rounded-md text-xs font-medium border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
              <Sparkles size={11} />
              {readiness.status === "not_started" ? "Démarrer" : readiness.status === "in_progress" ? "Reprendre" : "Modifier"}
            </a>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--texte-secondaire)" }}>{readiness.nextBestAction}</p>
        </div>
      )}

      {/* Stats GLOBALES (allJobs) */}
      <div className="grid grid-cols-4 gap-3 text-sm">
        <StatBox value={pacaCount} label={isExpert ? "PACA" : "Sud de la France"} color="#22c55e" />
        <StatBox value={idfCount} label={isExpert ? "IDF" : "Île-de-France"} color="#f59e0b" />
        <StatBox value={total} label="Total offres" color="var(--texte)" />
        <StatBox value={topCount} label={isExpert ? "Top scores" : "Très pertinentes"} color="var(--or)" />
      </div>

      {/* Toolbar premium — recherche + chips de filtres + tri + density */}
      <div className="p-3 rounded-xl border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        {/* Ligne 1 : recherche + tri + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texte-tertiaire)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans les offres (titre, entreprise, lieu…)"
              className="w-full pl-9 pr-3 py-2 rounded-md text-xs border outline-none transition-colors"
              style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}
            />
          </div>

          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
            title="Trier la liste"
            className="px-3 py-2 rounded-md text-xs border outline-none cursor-pointer"
            style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
            <option value="recent">Plus récentes</option>
            <option value="score">Score ↓</option>
            <option value="score-asc">Score ↑</option>
            <option value="location">Localisation</option>
            <option value="title">Titre (A→Z)</option>
          </select>

          <div className="flex items-center gap-1 p-0.5 rounded-md border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
            <button onClick={() => setDensity("comfortable")} title="Vue aérée (détails max)"
              className="p-1.5 rounded transition-colors"
              style={{ background: density === "comfortable" ? "var(--or)" : "transparent", color: density === "comfortable" ? "#000" : "var(--texte-tertiaire)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="12" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button onClick={() => setDensity("compact")} title="Vue dense (plus d'offres visibles)"
              className="p-1.5 rounded transition-colors"
              style={{ background: density === "compact" ? "var(--or)" : "transparent", color: density === "compact" ? "#000" : "var(--texte-tertiaire)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="5.5" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="10" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
          </div>

          <button onClick={loadAll} title="Recharger la liste depuis le serveur"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            <RefreshCw size={12} />Rafraîchir
          </button>

          {filter === "archived" && displayedJobs.length > 0 && (
            <button onClick={() => setConfirmPurge(true)} disabled={purging}
              title="Supprimer définitivement toutes les offres archivées affichées"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs border transition-colors"
              style={{ borderColor: "#dc2626", color: "#dc2626" }}>
              <Trash2 size={12} />
              {purging ? "Purge…" : `Purger (${displayedJobs.length})`}
            </button>
          )}
        </div>

        {/* Ligne 2 : chips de filtres */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "all", label: "Toutes", icon: <Layers size={11} />, hint: `Total : ${total}` },
            { key: "new", label: "Nouvelles", icon: <Sparkles size={11} />, hint: "Détectées < 48h" },
            { key: "paca", label: isExpert ? "PACA" : "Sud", icon: <MapPin size={11} />, hint: "Sud de la France" },
            { key: "idf", label: "IDF", icon: <MapPin size={11} />, hint: "Île-de-France" },
            { key: "score65", label: "Score 65+", icon: <TrendingUp size={11} />, hint: "Compatibilité ≥ 65" },
            { key: "highly_rec", label: "⭐ Top", icon: <Star size={11} />, hint: "Meilleures compatibilités" },
            { key: "shortlist", label: isExpert ? "Shortlist" : "Enregistrées", icon: <Star size={11} />, hint: "Offres sauvegardées" },
            { key: "recommended", label: "Recommandées", icon: <CheckCircle2 size={11} />, hint: "Recommandation IA positive" },
            ...(isExpert ? [
              { key: "needs_application" as const, label: "À préparer", icon: <ClipboardPaste size={11} />, hint: "Candidatures à générer" },
              { key: "archived" as const, label: "Archivées", icon: <Archive size={11} />, hint: "Offres archivées" },
            ] : []),
          ].map(f => {
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => handleFilterChange(f.key)}
                title={f.hint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={{
                  background: active ? "var(--or)" : "var(--fond)",
                  borderColor: active ? "var(--or)" : "var(--bordure)",
                  color: active ? "#000" : "var(--texte-secondaire)",
                }}>
                <span style={{ opacity: active ? 1 : 0.7 }}>{f.icon}</span>
                {f.label}
              </button>
            );
          })}
          {filter !== "all" && (
            <button onClick={() => handleFilterChange("all")} title="Réinitialiser le filtre"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-mono transition-colors"
              style={{ color: "var(--texte-tertiaire)" }}>
              <X size={10} />Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Liste affichée = displayedJobs (jamais allJobs) */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : displayedJobs.length === 0 ? (
        <EmptyPremium
          filter={filter}
          onImport={() => window.location.href = "/dashboard/jobs/importer"}
          onResetFilter={() => handleFilterChange("all")}
          onScanner={() => window.location.href = "/market-radar"}
        />
      ) : (
        <div className={density === "compact" ? "space-y-1" : "space-y-2"}>
          {finalJobs.map(job => {
            const s = job.score;
            return (
              <JobCard
                key={job.id}
                job={job}
                score={s}
                density={density}
                isExpert={isExpert}
                preparingApp={preparingApp}
                draftId={draftIds[job.id]}
                onStatus={handleStatus}
                onPrepare={handlePrepareApplication}
                onOpen={url => window.open(url, "_blank", "noopener,noreferrer")}
                onCardClick={() => setSelectedJob(job)}
                onDelete={() => setConfirmDelete(job)}
                formatDate={formatJobDate}
                isNew={isNew}
                priorityLabel={priorityLabel}
                priorityColor={priorityColor}
                priorityHint={job.locationPriority === 1 ? "Sud de la France" : job.locationPriority === 2 ? "Île-de-France" : job.locationPriority === 3 ? "France" : job.locationPriority === 4 ? "International" : "Non définie"}
              />
            );
          })}
        </div>
      )}

      {/* Modal de détail d'offre */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatus={handleStatus}
          onPrepare={handlePrepareApplication}
          onDelete={() => setConfirmDelete(selectedJob)}
          draftId={draftIds[selectedJob.id]}
          preparing={preparingApp.has(selectedJob.id)}
          onOpenUrl={url => window.open(url, "_blank", "noopener,noreferrer")}
          priorityLabel={priorityLabel}
          priorityColor={priorityColor}
          priorityHint={selectedJob.locationPriority === 1 ? "Sud de la France" : selectedJob.locationPriority === 2 ? "Île-de-France" : selectedJob.locationPriority === 3 ? "France" : selectedJob.locationPriority === 4 ? "International" : "Non définie"}
        />
      )}

      {/* Popup de confirmation de suppression */}
      {confirmDelete && (
        <ConfirmDeleteModal
          job={confirmDelete}
          deleting={deleting}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => !deleting && setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ─── Composants premium ────────────────────── */

function KpiCard({ label, value, icon, accent, hint }: {
  label: string; value: number | string; icon: React.ReactNode; accent: string; hint: string;
}) {
  return (
    <div className="p-4 rounded-xl border transition-colors hover:border-opacity-100" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--texte-tertiaire)" }}>{label}</span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] font-mono mt-1" style={{ color: "var(--texte-tertiaire)" }}>{hint}</div>
    </div>
  );
}

function ScoreRing({ score, size = 48 }: { score: number | null; size?: number }) {
  const safe = typeof score === "number" ? score : 0;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (safe / 100) * c;
  const color = getScoreColor(safe);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} title={`Score global : ${safe}%`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fond-eleve)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.4s" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{safe}</span>
      </div>
    </div>
  );
}

function SourceBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const isExt = type === "browser";
  const isAuto = ["firecrawl-safe", "api", "ats", "html"].includes(type);
  const isDemo = type === "fixture";
  if (!isExt && !isAuto && !isDemo) return null;
  const config = isExt
    ? { label: "Extension", color: "#3b82f6", hint: "Importée via l'extension Chrome" }
    : isAuto
    ? { label: "Auto", color: "#22c55e", hint: "Scraping automatique" }
    : { label: "Demo", color: "#eab308", hint: "Donnée de démonstration" };
  return (
    <span title={config.hint} className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ background: `${config.color}15`, color: config.color }}>
      {config.label}
    </span>
  );
}

function JobCard({ job, score, density, isExpert, preparingApp, draftId, onStatus, onPrepare, onOpen, onDelete, onCardClick, formatDate, isNew, priorityLabel, priorityColor, priorityHint }: {
  job: JobItem; score: JobItem["score"]; density: "comfortable" | "compact"; isExpert: boolean;
  preparingApp: Set<string>; draftId?: string;
  onStatus: (id: string, status: string) => void; onPrepare: (id: string) => void; onOpen: (url: string) => void;
  onDelete?: () => void; onCardClick?: () => void;
  formatDate: (d: string | null) => string; isNew: (d: string | null) => boolean;
  priorityLabel: (p: number | null) => string; priorityColor: (p: number | null) => string; priorityHint: string;
}) {
  const padding = density === "compact" ? "p-2.5" : "p-4";
  const gap = density === "compact" ? "gap-2" : "gap-3";
  const isPrepared = !!draftId;
  const safe = typeof score?.globalScore === "number" ? score.globalScore : null;
  const reasons: string[] = (() => {
    try { const r = JSON.parse(score?.reasonsJson || "[]"); return Array.isArray(r) ? r : []; } catch { return []; }
  })();
  const flags: string[] = (() => {
    try { const r = JSON.parse(score?.redFlagsJson || "[]"); return Array.isArray(r) ? r : []; } catch { return []; }
  })();

  return (
    <div role={onCardClick ? "button" : undefined} tabIndex={onCardClick ? 0 : undefined}
      onClick={(e) => {
        if (!onCardClick) return;
        // Évite d'ouvrir le modal si on clique sur un bouton ou un input
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest("a") || target.closest("input")) return;
        onCardClick();
      }}
      onKeyDown={(e) => { if (onCardClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onCardClick(); } }}
      className={`group relative ${padding} rounded-xl border transition-all hover:border-[var(--bordure)] hover:shadow-lg ${onCardClick ? "cursor-pointer" : ""}`}
      style={{ background: "var(--fond-surface)", borderColor: "var(--bordure-douce)" }}>
      <div className={`flex items-start ${gap}`}>
        {/* Score ring */}
        <ScoreRing score={safe} size={density === "compact" ? 40 : 52} />

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          {/* Ligne 1 : titre + chips */}
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <h3 className={`font-bold leading-snug ${density === "compact" ? "text-xs" : "text-sm"}`} style={{ color: "var(--texte)" }}>
              {job.title}
            </h3>
            <span title={`Priorité géographique : ${priorityHint}`}
              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
              style={{ background: `${priorityColor(job.locationPriority)}15`, color: priorityColor(job.locationPriority) }}>
              {priorityLabel(job.locationPriority)}
            </span>
            {isNew(job.publishedAt || job.firstSeenAt) && (
              <span title="Détectée dans les 48 dernières heures" className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                Nouveau
              </span>
            )}
            {isPrepared && (
              <span title="Un dossier de candidature a été généré pour cette offre" className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                Dossier prêt
              </span>
            )}
            <SourceBadge type={job.source?.type} />
          </div>

          {/* Ligne 2 : entreprise + lieu + date */}
          <div className={`flex items-center flex-wrap ${density === "compact" ? "gap-1.5 text-[10px]" : "gap-2.5 text-xs"}`} style={{ color: "var(--texte-secondaire)" }}>
            {job.company && (
              <span className="flex items-center gap-1 font-medium" style={{ color: "var(--texte)" }}>
                <Building2 size={density === "compact" ? 10 : 11} />{job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin size={density === "compact" ? 9 : 10} />{job.location}
              </span>
            )}
            <span className="font-mono" style={{ color: "var(--texte-tertiaire)" }}>{formatDate(job.publishedAt || job.firstSeenAt)}</span>
            {job.source?.name && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
                {job.source.name}
              </span>
            )}
          </div>

          {/* Ligne 3 : raisons / flags (visible en comfortable) */}
          {density === "comfortable" && (reasons.length > 0 || flags.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {reasons.slice(0, 3).map((r, i) => (
                <span key={`r${i}`} title={r} className="text-[10px] px-2 py-0.5 rounded truncate max-w-[280px]"
                  style={{ background: getScoreBg(safe ?? 60, 0.15), color: getScoreColor(safe ?? 60) }}>
                  ✓ {r}
                </span>
              ))}
              {flags.slice(0, 2).map((f, i) => (
                <span key={`f${i}`} title={f} className="text-[10px] px-2 py-0.5 rounded truncate max-w-[280px]"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  ⚠ {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions : affichées en permanence en expert, ou au hover */}
        <div className={`flex-shrink-0 flex items-center gap-1 ${density === "comfortable" ? "opacity-0 group-hover:opacity-100 transition-opacity" : ""}`}>
          {job.sourceUrl && (
            <button onClick={() => onOpen(job.sourceUrl || "")} title="Voir l'offre originale (nouvel onglet)"
              className="p-1.5 rounded border transition-colors"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              <Eye size={13} />
            </button>
          )}
          <button onClick={() => onStatus(job.id, "shortlisted")} title="Sauvegarder dans ta shortlist"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono font-semibold border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            <Star size={10} />{isExpert ? "Shortlist" : "Garder"}
          </button>
          <button onClick={() => isPrepared ? window.location.href = `/dashboard/jobs/applications/${draftId}` : onPrepare(job.id)}
            disabled={preparingApp.has(job.id)}
            title={isPrepared ? "Voir le dossier de candidature" : "Générer CV + lettre + email adaptés"}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono font-semibold border transition-colors"
            style={{
              borderColor: isPrepared ? "#22c55e" : "#8b5cf6",
              color: preparingApp.has(job.id) ? "var(--texte-tertiaire)" : (isPrepared ? "#22c55e" : "#8b5cf6"),
            }}>
            {preparingApp.has(job.id) ? <Loader2 size={10} className="animate-spin" /> : (isPrepared ? <Eye size={10} /> : <Sparkles size={10} />)}
            {isPrepared ? "Dossier" : "Préparer"}
          </button>
          <button onClick={() => onStatus(job.id, "rejected")} title="Marquer comme non retenue"
            className="p-1.5 rounded border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
            <XCircle size={13} />
          </button>
          <button onClick={() => onStatus(job.id, "archived")} title="Archiver (n'apparaîtra plus dans la liste active)"
            className="p-1.5 rounded border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
            <Archive size={13} />
          </button>
          {onDelete && (
            <>
              <div className="w-px h-5 mx-0.5" style={{ background: "var(--bordure)" }} />
              <button onClick={onDelete} title="Supprimer définitivement cette offre"
                className="p-1.5 rounded border transition-colors"
                style={{ borderColor: "rgba(197,75,60,0.3)", color: "var(--erreur)", background: "rgba(197,75,60,0.05)" }}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function JobDetailModal({ job, onClose, onStatus, onPrepare, onDelete, draftId, preparing, onOpenUrl, priorityLabel, priorityColor, priorityHint }: {
  job: JobItem; onClose: () => void;
  onStatus: (id: string, status: string) => void; onPrepare: (id: string) => void;
  onDelete: () => void;
  draftId?: string; preparing: boolean;
  onOpenUrl: (url: string) => void;
  priorityLabel: (p: number | null) => string; priorityColor: (p: number | null) => string; priorityHint: string;
}) {
  const s = job.score;
  const safe = typeof s?.globalScore === "number" ? s.globalScore : null;
  const isPrepared = !!draftId;
  const reasons: string[] = (() => { try { const r = JSON.parse(s?.reasonsJson || "[]"); return Array.isArray(r) ? r : []; } catch { return []; } })();
  const flags: string[] = (() => { try { const r = JSON.parse(s?.redFlagsJson || "[]"); return Array.isArray(r) ? r : []; } catch { return []; } })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

      {/* Modal */}
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: "var(--fond)", border: "1px solid var(--bordure)" }}>

        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 border-b"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-start gap-4 min-w-0">
            <ScoreRing score={safe} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-1.5"
                style={{ color: "var(--texte-tertiaire)" }}>
                <Radar size={11} style={{ color: "var(--or)" }} />
                <span>Détail de l&apos;offre</span>
              </div>
              <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--texte)" }}>{job.title}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm" style={{ color: "var(--texte-secondaire)" }}>
                {job.company && <span className="font-semibold flex items-center gap-1"><Building2 size={12} />{job.company}</span>}
                {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} title="Fermer (Esc)"
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "var(--texte-tertiaire)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Chips row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span title={priorityHint} className="text-[10px] font-mono font-bold px-2 py-1 rounded uppercase tracking-wider"
              style={{ background: `${priorityColor(job.locationPriority)}15`, color: priorityColor(job.locationPriority) }}>
              {priorityLabel(job.locationPriority)}
            </span>
            {job.source?.name && (
              <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-secondaire)" }}>
                Source : {job.source.name}
              </span>
            )}
            <SourceBadge type={job.source?.type} />
            <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
              {new Date(job.publishedAt || job.firstSeenAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          {/* Score breakdown */}
          {s && (s.executiveScore != null || s.semanticScore != null || s.locationScore != null) && (
            <div className="p-4 rounded-xl space-y-2" style={{ background: "var(--fond-surface)", border: "1px solid var(--bordure-douce)" }}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--texte-tertiaire)" }}>
                Décomposition du score
              </div>
              {s.executiveScore != null && <ScoreBar label="Expérience / Compétences" value={s.executiveScore} />}
              {s.semanticScore != null && <ScoreBar label="Match sémantique" value={s.semanticScore} hint={s.semanticConfidence ? `Confiance ${s.semanticConfidence}%` : undefined} />}
              {s.locationScore != null && <ScoreBar label="Localisation" value={s.locationScore} />}
            </div>
          )}

          {/* Recommandation IA */}
          {s?.recommendedAction && (
            <div className="p-4 rounded-xl" style={{ background: getScoreBg(safe ?? 60, 0.08), border: `1px solid ${getScoreColor(safe ?? 60)}30` }}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--texte-tertiaire)" }}>
                Recommandation PRSTO
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--texte)" }}>{s.recommendedAction}</p>
            </div>
          )}

          {/* Raisons */}
          {reasons.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--texte-tertiaire)" }}>
                Pourquoi ce match
              </div>
              <div className="space-y-1.5">
                {reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--texte)" }}>
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: getScoreColor(safe ?? 60) }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red flags */}
          {flags.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--erreur)" }}>
                Points de vigilance
              </div>
              <div className="space-y-1.5">
                {flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--texte)" }}>
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--erreur)" }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 p-4 border-t flex items-center gap-2 flex-wrap"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          {job.sourceUrl && (
            <button onClick={() => onOpenUrl(job.sourceUrl || "")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              <Eye size={13} />Voir l&apos;offre originale
            </button>
          )}
          <button onClick={onDelete} title="Supprimer définitivement cette offre"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors"
            style={{ borderColor: "rgba(197,75,60,0.3)", color: "var(--erreur)", background: "rgba(197,75,60,0.05)" }}>
            <Trash2 size={13} />Supprimer
          </button>
          <div className="flex-1" />
          <button onClick={() => { onStatus(job.id, "rejected"); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
            <XCircle size={13} />Passer
          </button>
          <button onClick={() => { onStatus(job.id, "shortlisted"); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            <Star size={13} />Shortlist
          </button>
          <button onClick={() => isPrepared ? (window.location.href = `/dashboard/jobs/applications/${draftId}`) : onPrepare(job.id)}
            disabled={preparing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors"
            style={{ background: isPrepared ? "#22c55e" : "#8b5cf6", color: "#fff", opacity: preparing ? 0.6 : 1 }}>
            {preparing ? <Loader2 size={13} className="animate-spin" /> : isPrepared ? <Eye size={13} /> : <Sparkles size={13} />}
            {isPrepared ? "Voir le dossier" : "Préparer la candidature"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const color = getScoreColor(value);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span style={{ color: "var(--texte-secondaire)" }}>{label}{hint && <span className="ml-1.5 text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>· {hint}</span>}</span>
        <span className="font-mono font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--fond-eleve)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ job, deleting, onConfirm, onCancel }: {
  job: JobItem; deleting: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const scoreColor = typeof job.score?.globalScore === "number" ? getScoreColor(job.score.globalScore) : "var(--texte-tertiaire)";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} />
      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--fond)", border: "1px solid var(--bordure)" }}>

        {/* Bandeau PRSTO vert */}
        <div className="flex items-center gap-4 px-5 py-5"
          style={{ background: "linear-gradient(135deg, var(--succes) 0%, #1F5A42 100%)" }}>
          {/* Logo PRSTO plein format, en blanc, presque toute la hauteur */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-prsto.png" alt="PRSTO"
            style={{ height: 47, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", flexShrink: 0 }} />
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
              PRSTO · Confirmation
            </div>
            <div className="text-base font-bold leading-tight" style={{ color: "#fff" }}>
              Supprimer cette offre ?
            </div>
          </div>
        </div>

        {/* Résumé de l'offre */}
        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>
            Tu es sur le point de <strong style={{ color: "var(--erreur)" }}>supprimer définitivement</strong> cette offre et son dossier de candidature.
            Cette action est <strong>irréversible</strong>.
          </p>

          <div className="p-3 rounded-xl flex items-start gap-3"
            style={{ background: "var(--fond-surface)", border: "1px solid var(--bordure-douce)" }}>
            <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: getScoreBg(job.score?.globalScore ?? 50, 0.15), color: scoreColor }}>
              <Trash2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-snug" style={{ color: "var(--texte)" }}>{job.title}</div>
              <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap" style={{ color: "var(--texte-secondaire)" }}>
                {job.company && (
                  <span className="flex items-center gap-1 font-semibold" style={{ color: "var(--texte)" }}>
                    <Building2 size={10} />{job.company}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />{job.location}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                {typeof job.score?.globalScore === "number" && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ background: getScoreBg(job.score.globalScore, 0.15), color: scoreColor }}>
                    Score {job.score.globalScore}%
                  </span>
                )}
                {job.source?.name && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
                    {job.source.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono px-2.5 py-1.5 rounded flex items-center gap-1.5"
            style={{ background: "rgba(197,75,60,0.08)", color: "var(--erreur)", border: "1px solid rgba(197,75,60,0.2)" }}>
            <AlertTriangle size={11} />
            <span>Cette action ne peut pas être annulée</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex items-center gap-2 justify-end"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <button onClick={onCancel} disabled={deleting}
            className="px-4 py-2 rounded-md text-sm font-medium border transition-colors"
            style={{ borderColor: "var(--bordure)", color: "var(--texte)", background: "var(--fond)" }}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{ background: "var(--erreur)", color: "#fff", opacity: deleting ? 0.6 : 1 }}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {deleting ? "Suppression…" : "Oui, supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyPremium({ filter, onImport, onResetFilter, onScanner }: {
  filter: string;
  onImport: () => void; onResetFilter: () => void; onScanner: () => void;
}) {
  const isFilter = filter !== "all";
  return (
    <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed space-y-5"
      style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--or-faible) 0%, var(--or) 100%)" }}>
        <Radar size={28} style={{ color: "#000" }} />
      </div>
      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-lg font-bold" style={{ color: "var(--texte)" }}>
          {isFilter ? "Aucune offre dans ce filtre" : "Ton radar est vide pour l'instant"}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>
          {isFilter
            ? "Essaie un autre filtre ou réinitialise pour voir toutes tes offres."
            : "Importe ta première offre depuis LinkedIn, Indeed, APEC ou France Travail, ou laisse le scanner détecter des opportunités cachées."
          }
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {isFilter ? (
          <button onClick={onResetFilter} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            <X size={14} />Réinitialiser le filtre
          </button>
        ) : (
          <>
            <button onClick={onImport} className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: "var(--or)", color: "#000" }}>
              <ClipboardPaste size={15} />Importer une offre
            </button>
            <button onClick={onScanner} className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold border transition-colors"
              style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
              <Search size={15} />Ouvrir le Market Radar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Micro-composants ────────────────────── */

function StatMini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div>
      <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>{label}</div>
    </div>
  );
}

function StatBox({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="p-3 rounded-lg border text-center" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{label}</div>
    </div>
  );
}

function TodayCard({ icon, title, desc, badge, action }: {
  icon: React.ReactNode; title: string; desc: string;
  badge?: { label: string; color: string };
  action: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="p-4 rounded-xl border transition-colors hover:shadow-sm" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2" style={{ color: "var(--or)" }}>
          {icon}
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badge.color}15`, color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--texte)" }}>{title}</h3>
      <p className="text-xs mb-3" style={{ color: "var(--texte-secondaire)" }}>{desc}</p>
      {action.onClick ? (
        <button onClick={action.onClick}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{ background: "var(--or)", color: "#000", border: "none", cursor: "pointer" }}>
          {action.label} <ArrowRight size={12} />
        </button>
      ) : (
        <a href={action.href || "#"}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{ background: "var(--or)", color: "#000", textDecoration: "none" }}>
          {action.label} <ArrowRight size={12} />
        </a>
      )}
    </div>
  );
}

function IconBtn({ onClick, children, ariaLabel, color }: { onClick: () => void; children: React.ReactNode; ariaLabel: string; color?: string }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel}
      className="p-1.5 rounded border transition-colors"
      style={{ borderColor: "var(--bordure)", color: color || "var(--texte-secondaire)" }}>
      {children}
    </button>
  );
}

function DemoCard() {
  const router = useRouter();
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getDemoDataStatus().then(setStatus).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setBusy("create");
    try {
      const r = await createDemoData();
      if (r.success) {
        getDemoDataStatus().then(setStatus);
        toast.success("Données démo créées avec succès !");
      } else {
        toast.error("Erreur création démo : " + (r.error || "inconnue"));
      }
    } catch { toast.error("Erreur lors de la création des données démo."); }
    setBusy(null);
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setBusy("delete");
    try {
      const r = await deleteDemoData();
      if (r.success) {
        getDemoDataStatus().then(setStatus);
        toast.success("Données démo supprimées.");
      } else {
        toast.error("Erreur suppression démo : " + (r.error || "inconnue"));
      }
    } catch { toast.error("Erreur lors de la suppression."); }
    setBusy(null);
  };

  return (
    <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: "rgba(139,92,246,0.3)", background: "var(--fond-surface)" }}>
      <ConfirmActionDialog
        open={confirmDelete}
        title="Supprimer les données démo"
        message="Supprimer toutes les données démo [DEMO] ? Les vraies données sont protégées."
        confirmLabel="Supprimer"
        destructive
        loading={busy === "delete"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <Sparkles size={16} style={{ color: "#8b5cf6" }} />
        <h2 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Démo PRSTO</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>{DEMO_BADGE_TEXT}</span>
      </div>
      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{DEMO_SAFETY_NOTICE}</p>
      {status?.hasDemoData ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <StatMini label="offres" value={status.demoJobsCount} color="var(--texte)" />
            <StatMini label="candidatures" value={status.demoDraftsCount} color="var(--texte)" />
            <StatMini label="à relancer" value={status.demoToFollowUpCount} color="#f59e0b" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => router.push("/dashboard/jobs/pipeline?demo=true")}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
              <ArrowRight size={11} /> Pipeline démo
            </button>
            <button onClick={handleDelete} disabled={busy !== null}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "#ef4444", color: "#ef4444", opacity: busy ? 0.4 : 1 }}>
              {busy === "delete" ? <Loader2 size={11} className="animate-spin" /> : null}
              Supprimer
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleCreate} disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ background: "#8b5cf6", color: "#fff", opacity: busy ? 0.4 : 1 }}>
            {busy === "create" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Créer données démo
          </button>
        </div>
      )}
    </div>
  );
}

function CrmSummaryBlock() {
  const [summary, setSummary] = useState<{
    contactCount?: number; targetCount?: number;
    followUps?: { totalDue: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/crm/summary").then(r => r.json()).then(d => {
      if (d.contactCount !== undefined) setSummary(d);
    }).catch(() => {});
  }, []);

  if (!summary || summary.contactCount === 0) return null;

  return (
    <div className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold flex items-center gap-1" style={{ color: "var(--texte)" }}>
          <UserPlus size={12} style={{ color: "#8b5cf6" }} />
          CRM
        </span>
        <a href="/dashboard/jobs/crm" className="text-[10px] font-mono" style={{ color: "var(--or)", textDecoration: "none" }}>Ouvrir</a>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <StatMini label="Contacts" value={summary.contactCount || 0} color="#8b5cf6" />
        <StatMini label="Relances" value={summary.followUps?.totalDue || 0} color={summary.followUps?.totalDue ? "#ef4444" : "var(--texte-tertiaire)"} />
      </div>
    </div>
  );
}
