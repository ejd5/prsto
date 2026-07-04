"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Filter, Star, MapPin, Building2,
  Loader2, Copy, Globe, FileText,
  Trash2, Link, X, GitCompare, LayoutList, CheckCircle2, Target,
  Radio, TrendingUp, CheckCheck, Columns as ColumnsIcon,
  BarChart3, GripVertical, Eye, Bell,
} from "lucide-react";
import {
  getOpportunities, addOpportunity, updateOpportunity, deleteOpportunity,
  updateOpportunities, getDistinctCountries, getDistinctSourceNames, fetchUrlText,
  getPrioritizedOpportunities,
  type OpportunityData, type PrioritizedOpportunity,
} from "@/lib/actions/opportunity";
import { getJobSources } from "@/lib/actions/job-source";
import { scanAllForDuplicates } from "@/lib/actions/dedup";
import { getScoreColor } from "@/lib/score-colors";

interface OppListItem {
  id: string; title: string; company: string; location: string | null; country: string | null;
  remote: string | null; contractType: string | null; sourceName: string | null; status: string;
  priority: number | null; duplicateStatus: string | null; duplicateScore: number | null;
  scoreGlobal: number | null;
  _count: { documents: number; };
}

interface SourceItem { id: string; name: string; url: string | null; active: boolean; priority: number; }

interface ComparisonItem { title: string; company: string; location: string | null; sourceName: string | null; contractType: string | null; hasPipeline: boolean; }
interface ComparisonData {
  a: ComparisonItem; b: ComparisonItem;
  result: { score: number; breakdown: Record<string, number>; };
}

const STATUS_OPTIONS = [
  { value: "tous", label: "Tous les statuts" },
  { value: "nouveau", label: "Nouveau" },
  { value: "analyse", label: "À analyser" },
  { value: "postule", label: "Postulé" },
  { value: "relance", label: "Relance" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre reçue" },
  { value: "refus", label: "Refus" },
  { value: "archive", label: "Archivé" },
];

const KANBAN_COLUMNS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "analyse", label: "À analyser" },
  { value: "postule", label: "Postulé" },
  { value: "relance", label: "Relance" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre" },
  { value: "refus", label: "Refus" },
  { value: "archive", label: "Archivé" },
];

const STATUS_COLORS: Record<string, string> = {
  nouveau: "var(--info)",
  analyse: "var(--warning)",
  postule: "var(--or)",
  relance: "#ec4899",
  entretien: "var(--succes)",
  offre: "#22d3ee",
  refus: "var(--erreur)",
  archive: "var(--texte-tertiaire)",
};

const DUP_LABELS: Record<string, { label: string; color: string }> = {
  UNIQUE: { label: "Unique", color: "var(--texte-tertiaire)" },
  SIMILAR: { label: "Offre similaire", color: "var(--or)" },
  PROBABLE_DUPLICATE: { label: "Doublon probable", color: "var(--warning)" },
  CONFIRMED_DUPLICATE: { label: "Doublon confirmé", color: "var(--erreur)" },
  IGNORED: { label: "Distinct", color: "var(--succes)" },
};

const EMPTY_OPP: OpportunityData & { jobSourceId?: string } = {
  title: "", company: "", location: "", country: "", sourceUrl: "", sourceName: "",
  jobSourceId: "", rawText: "", salaryMin: 0, salaryMax: 0, salaryCurrency: "EUR",
  contractType: "", remote: "tous", status: "nouveau", priority: 0, notes: "",
};

function ScoreRing({ score, size = 28 }: { score: number | null; size?: number }) {
  if (score === null) return null;
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fond-eleve)" strokeWidth="2.5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-[9px] font-bold leading-none" style={{ color }}>{score}</span>
    </div>
  );
}

export default function SignalFeedPage() {
  const router = useRouter();
  const [opps, setOpps] = useState<OppListItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [sourceNames, setSourceNames] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"liste" | "kanban" | "priorites">("liste");
  const [prioritized, setPrioritized] = useState<PrioritizedOpportunity[]>([]);

  // Filtres
  const [fStatus, setFStatus] = useState("tous");
  const [fCountry, setFCountry] = useState("tous");
  const [fSource, setFSource] = useState("tous");
  const [fPriority, setFPriority] = useState(-1);
  const [fRemote] = useState("tous");
  const [fSearch, setFSearch] = useState("");
  const [fDuplicate, setFDuplicate] = useState("tous");
  const [scanning, setScanning] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_OPP });
  const [urlFetching, setUrlFetching] = useState(false);
  const [formTab, setFormTab] = useState<"manual" | "url">("manual");
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchedTitle, setFetchedTitle] = useState("");

  // Batch selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Kanban drag
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [oppsRes, srcs, ctrs, srcNames] = await Promise.all([
      getOpportunities({
        status: fStatus, country: fCountry, sourceName: fSource,
        priority: fPriority, remote: fRemote,
        search: fSearch || undefined,
        duplicateStatus: fDuplicate !== "tous" ? fDuplicate : undefined,
      }),
      getJobSources(),
      getDistinctCountries(),
      getDistinctSourceNames(),
    ]);
    setOpps(oppsRes as unknown as OppListItem[]);
    setSources(srcs as unknown as SourceItem[]);
    setCountries(ctrs);
    setSourceNames(srcNames);
    setLoading(false);
  }, [fStatus, fCountry, fSource, fPriority, fRemote, fSearch, fDuplicate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (viewMode === "priorites") {
      getPrioritizedOpportunities({ search: fSearch || undefined }).then(setPrioritized);
    }
  }, [viewMode, fSearch]);

  const handleAddManual = async () => {
    if (!form.title.trim() || !form.company.trim()) return;
    try {
      await addOpportunity({ ...form, jobSourceId: form.jobSourceId || "" });
      setShowForm(false);
      setForm({ ...EMPTY_OPP });
      notify("ok", "Signal ajouté");
      await load();
    } catch { notify("err", "Erreur lors de l'ajout"); }
  };

  const handleFetchUrl = async () => {
    if (!fetchUrl.trim()) return;
    setUrlFetching(true);
    const result = await fetchUrlText(fetchUrl);
    setUrlFetching(false);
    if (result.success && result.text) {
      setForm({ ...form, sourceUrl: fetchUrl, rawText: result.text, title: result.title || form.title });
      setFetchedTitle(result.title || "");
      setFormTab("manual");
      notify("ok", "Contenu importé — vérifiez les champs puis ajoutez");
    } else {
      notify("err", result.error || "Échec de l'import");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette opportunité ?")) return;
    await deleteOpportunity(id);
    selected.delete(id);
    setSelected(new Set(selected));
    await load();
  };

  const handleQuickStatus = async (id: string, status: string) => {
    await updateOpportunity(id, { status } as Partial<OpportunityData>);
    await load();
  };

  const handleScanDuplicates = async () => {
    setScanning(true);
    try {
      const result = await scanAllForDuplicates();
      notify("ok", `${result.scanned} offres scannées, ${result.groupsFound} groupes de doublons`);
      await load();
    } catch { notify("err", "Erreur lors du scan"); }
    setScanning(false);
  };

  const handleBatchStatus = async (status: string) => {
    if (selected.size === 0) return;
    setBatchUpdating(true);
    await updateOpportunities(Array.from(selected), { status } as Partial<OpportunityData>);
    setSelected(new Set());
    setBatchUpdating(false);
    notify("ok", `${selected.size} signaux mis à jour → ${STATUS_OPTIONS.find(s => s.value === status)?.label}`);
    await load();
  };

  // Kanban drag handlers
  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("text/plain", oppId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = async (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const oppId = e.dataTransfer.getData("text/plain");
    if (!oppId) return;
    const opp = opps.find(o => o.id === oppId);
    if (!opp || opp.status === col) return;
    await updateOpportunity(oppId, { status: col } as Partial<OpportunityData>);
    notify("ok", `${opp.title} → ${KANBAN_COLUMNS.find(c => c.value === col)?.label}`);
    await load();
  };

  const countByStatus = opps.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === opps.length) setSelected(new Set());
    else setSelected(new Set(opps.map(o => o.id)));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: "var(--bordure)", aspectRatio: "3 / 1" }}>
        {/* Banner image */}
        <div className="absolute inset-0">
          <img src="/branding/banner-signalfeed.png" alt="Signal Feed"
            className="w-full h-full object-cover" />
        </div>
        {/* Fond vert foncé couvrant toute la zone texte */}
        <div className="absolute inset-y-0 left-0" style={{ width: "58%",
          background: "linear-gradient(to right, rgba(16,56,38,0.77) 0%, rgba(16,56,38,0.55) 55%, rgba(16,56,38,0.15) 80%, transparent 100%)",
        }} />
        <div className="relative h-full p-5 sm:p-7 lg:p-9 flex flex-col">
          {/* Titre — plus gros et plus gras */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold flex items-center gap-3" style={{ color: "var(--prsto-gold)", textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}>
              <Radio size={32} />
              Signal&nbsp; Feed
            </h1>
            <p className="text-xs mt-3 font-mono flex items-center gap-2" style={{ color: "rgba(250,246,239,0.85)", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
              <span>{opps.length} {opps.length > 1 ? "signaux" : "signal"} actif{opps.length > 1 ? "s" : ""}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "rgba(250,246,239,0.5)" }} />
              <span className="flex items-center gap-1">
                <TrendingUp size={10} />
                {prioritized.filter(p => p.recommendation === "POSTULER" || p.recommendation === "PREPARER").length} actionnables
              </span>
            </p>
          </div>

          {/* Description — limitée à la moitié gauche, police réduite */}
          <div className="max-w-[50%] mt-4">
            <p className="text-[11px] sm:text-xs leading-relaxed font-semibold" style={{ color: "rgba(255,255,255,0.95)", lineHeight: 1.6, textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
              Le <strong style={{ color: "var(--prsto-gold)", textShadow: "0 0 10px rgba(228,177,24,0.35)" }}>Signal Feed</strong> { }
              constitue votre radar d&apos;opportunités intelligent. Importez une offre depuis n&apos;importe quelle source
              (Greenhouse, LinkedIn, Indeed, page carrière, copier-coller) et laissez l&apos;IA l&apos;analyser :
              score de match, détection des doublons, recommandation priorisée. Visualisez votre pipeline en un coup d&apos;œil,
              passez une offre d&apos;une colonne à l&apos;autre par glisser-déposer, générez vos documents en un clic.
            </p>
            <p className="text-[11px] sm:text-xs mt-3 leading-relaxed font-semibold" style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.55, textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
              <strong style={{ color: "var(--prsto-gold)", textShadow: "0 0 10px rgba(228,177,24,0.35)" }}>Exemple :</strong> { }
              vous trouvez une offre de Directeur Commercial sur LinkedIn. Collez l&apos;URL ou le texte dans Signal Feed → l&apos;IA
              calcule un score de match, détecte les similitudes avec une offre déjà vue, et vous suggère de postuler.
              Glissez l&apos;offre dans la colonne « À analyser », puis « Postulé ». L&apos;historique suit l&apos;offre dans sa fiche dédiée.
            </p>
          </div>

          {/* 6 chips en 2 lignes de 3 */}
          <div className="mt-8 flex flex-col gap-1.5" style={{ maxWidth: "50%" }}>
            <div className="flex gap-x-5 gap-y-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <Radio size={11} style={{ color: "var(--prsto-gold)" }} /> Import multi-source
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <BarChart3 size={11} style={{ color: "var(--prsto-gold)" }} /> Score IA 11 dimensions
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <ColumnsIcon size={11} style={{ color: "var(--prsto-gold)" }} /> Pipeline Kanban
              </span>
            </div>
            <div className="flex gap-x-5 gap-y-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <Copy size={11} style={{ color: "var(--prsto-gold)" }} /> Détection doublons
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <Target size={11} style={{ color: "var(--prsto-gold)" }} /> Priorisation intelligente
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                <Bell size={11} style={{ color: "var(--prsto-gold)" }} /> Alertes matching
              </span>
            </div>
          </div>

          {/* Bouton Nouveau signal — à droite, remonté */}
          <div className="flex-1 relative">
            <button onClick={() => setShowForm(!showForm)}
              className="absolute right-4 bottom-2 flex items-center gap-2 px-5 py-2.5 text-xs font-mono rounded-md border transition-all hover:shadow-md z-10"
              style={{ background: "var(--or)", color: "var(--fond)", borderColor: "var(--or)", boxShadow: "0 2px 14px rgba(0,0,0,0.3)" }}>
              <Plus size={14} /> Nouveau signal
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Nouveaux", value: countByStatus["nouveau"] || 0, color: "var(--info)", icon: Eye },
          { label: "À analyser", value: countByStatus["analyse"] || 0, color: "var(--warning)", icon: BarChart3 },
          { label: "En cours", value: (countByStatus["entretien"] || 0) + (countByStatus["offre"] || 0), color: "var(--succes)", icon: TrendingUp },
          { label: "Actionnables", value: prioritized.filter(p => p.recommendation === "POSTULER" || p.recommendation === "PREPARER").length, color: "var(--or)", icon: Target },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-lg border p-3.5" style={{ borderColor: `${stat.color}25`, background: `color-mix(in srgb, ${stat.color} 6%, var(--fond-surface))` }}>
            <div className="absolute -right-3 -top-3 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: "url(/branding/p-eclair.png)", backgroundSize: "contain", width: 60, height: 60, backgroundRepeat: "no-repeat", transform: "rotate(12deg)" }} />
            <div className="flex items-center justify-between">
              <stat.icon size={16} style={{ color: stat.color, opacity: 0.7 }} />
            </div>
            <div className="mt-2 text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTRES ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={12} style={{ color: "var(--texte-tertiaire)" }} />
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--texte-tertiaire)" }} />
          <input type="text" placeholder="Rechercher un signal..." value={fSearch}
            onChange={e => setFSearch(e.target.value)}
            className="input-prsto pl-8 text-xs" style={{ paddingTop: 6, paddingBottom: 6 }} />
        </div>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)}
          className="input-prsto text-xs py-1 w-auto">
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}{countByStatus[s.value] ? ` (${countByStatus[s.value]})` : ""}</option>
          ))}
        </select>
        <select value={fCountry} onChange={e => setFCountry(e.target.value)}
          className="input-prsto text-xs py-1 w-auto">
          <option value="tous">Tous les pays</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fSource} onChange={e => setFSource(e.target.value)}
          className="input-prsto text-xs py-1 w-auto">
          <option value="tous">Toutes les sources</option>
          {sourceNames.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setFPriority(fPriority === 1 ? -1 : 1)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors"
          style={{ background: fPriority === 1 ? "var(--or-faible)" : "transparent", borderColor: fPriority === 1 ? "var(--or)" : "var(--bordure)", color: fPriority === 1 ? "var(--or)" : "var(--texte-secondaire)" }}>
          <Star size={10} /> Prioritaires
        </button>
        <select value={fDuplicate} onChange={e => setFDuplicate(e.target.value)}
          className="input-prsto text-xs py-1 w-auto">
          <option value="tous">Tous (doublons)</option>
          <option value="UNIQUE">✓ Uniques</option>
          <option value="SIMILAR">~ Similaires</option>
          <option value="PROBABLE_DUPLICATE">⚠ Doublons probables</option>
          <option value="CONFIRMED_DUPLICATE">✗ Doublons confirmés</option>
        </select>
        <button onClick={handleScanDuplicates} disabled={scanning}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono border transition-colors"
          style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--or-faible)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          {scanning ? <Loader2 size={12} className="animate-spin" /> : <GitCompare size={12} />}
          Scanner
        </button>
      </div>

      {/* ── VUE + BATCH TOOLBAR ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border overflow-hidden" style={{ borderColor: "var(--bordure)" }}>
            <button onClick={() => setViewMode("liste")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors"
              style={{ background: viewMode === "liste" ? "var(--or-faible)" : "transparent", color: viewMode === "liste" ? "var(--or)" : "var(--texte-tertiaire)" }}>
              <LayoutList size={12} /> Liste
            </button>
            <button onClick={() => setViewMode("kanban")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors"
              style={{ background: viewMode === "kanban" ? "var(--or-faible)" : "transparent", color: viewMode === "kanban" ? "var(--or)" : "var(--texte-tertiaire)" }}>
              <ColumnsIcon size={12} /> Kanban
            </button>
            <button onClick={() => setViewMode("priorites")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors"
              style={{ background: viewMode === "priorites" ? "var(--or-faible)" : "transparent", color: viewMode === "priorites" ? "var(--or)" : "var(--texte-tertiaire)" }}>
              <Target size={12} /> Priorités
            </button>
          </div>
        </div>

        {selected.size > 0 && viewMode !== "kanban" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border animate-in fade-in" style={{ borderColor: "var(--or)", background: "var(--or-faible)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--or)" }}>{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
            {STATUS_OPTIONS.filter(s => s.value !== "tous").slice(0, 5).map(s => (
              <button key={s.value} onClick={() => handleBatchStatus(s.value)} disabled={batchUpdating}
                className="px-2 py-0.5 rounded text-[10px] font-mono border transition-all"
                style={{ borderColor: STATUS_COLORS[s.value], color: STATUS_COLORS[s.value], background: `${STATUS_COLORS[s.value]}10` }}>
                {batchUpdating ? "..." : s.label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())} className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}>
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── FORMULAIRE D'AJOUT ── */}
      {showForm && (
        <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
          <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--bordure)" }}>
            <button onClick={() => setFormTab("manual")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono"
              style={{ background: formTab === "manual" ? "var(--or-faible)" : "transparent", color: formTab === "manual" ? "var(--or)" : "var(--texte-tertiaire)" }}>
              <FileText size={12} /> Manuel
            </button>
            <button onClick={() => setFormTab("url")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono"
              style={{ background: formTab === "url" ? "var(--or-faible)" : "transparent", color: formTab === "url" ? "var(--or)" : "var(--texte-tertiaire)" }}>
              <Globe size={12} /> Import URL
            </button>
          </div>

          {formTab === "url" ? (
            <div className="space-y-3">
              <p className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                Collez l&apos;URL d&apos;une offre. Fonctionne avec la plupart des sites publics. LinkedIn et Indeed bloquent l&apos;import automatique — utilisez le copier-coller.
              </p>
              <div className="flex gap-2">
                <input type="url" placeholder="https://..." value={fetchUrl}
                  onChange={e => setFetchUrl(e.target.value)}
                  className="input-prsto flex-1 text-sm" />
                <button onClick={handleFetchUrl} disabled={urlFetching}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md"
                  style={{ background: "var(--or)", color: "var(--fond)" }}>
                  {urlFetching ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
                  Importer
                </button>
              </div>
              {fetchedTitle && (
                <div className="text-xs font-mono flex items-center gap-2" style={{ color: "var(--succes)" }}>
                  <CheckCircle2 size={12} /> Titre détecté : {fetchedTitle}
                </div>
              )}
              <button onClick={() => setFormTab("manual")}
                className="text-xs font-mono underline" style={{ color: "var(--or)" }}>
                Ou remplir manuellement →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label-xs">Titre du poste *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-prsto" />
                </div>
                <div>
                  <label className="label-xs">Entreprise *</label>
                  <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="input-prsto" />
                </div>
                <div>
                  <label className="label-xs">Localisation</label>
                  <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-prsto" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="label-xs">Pays</label>
                  <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="input-prsto">
                    <option value="">--</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-xs">Type de contrat</label>
                  <select value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })} className="input-prsto">
                    <option value="">--</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="freelance">Freelance</option>
                    <option value="interim">Intérim</option>
                    <option value="mandat">Mandat</option>
                  </select>
                </div>
                <div>
                  <label className="label-xs">Remote</label>
                  <select value={form.remote} onChange={e => setForm({ ...form, remote: e.target.value })} className="input-prsto">
                    <option value="tous">--</option>
                    <option value="remote">Remote</option>
                    <option value="hybride">Hybride</option>
                    <option value="présentiel">Présentiel</option>
                  </select>
                </div>
                <div>
                  <label className="label-xs">Statut</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-prsto">
                    {STATUS_OPTIONS.filter(s => s.value !== "tous").map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label-xs">URL source</label>
                  <input type="url" value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} className="input-prsto" />
                </div>
                <div>
                  <label className="label-xs">Source</label>
                  <select value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} className="input-prsto">
                    <option value="">--</option>
                    {sourceNames.map(s => <option key={s} value={s}>{s}</option>)}
                    {sources.filter(s => !sourceNames.includes(s.name)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-xs">Texte brut de l&apos;offre</label>
                <textarea value={form.rawText} onChange={e => setForm({ ...form, rawText: e.target.value })}
                  rows={5} className="input-prsto" style={{ resize: "vertical" }}
                  placeholder="Collez ici le texte complet de l'offre..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label-xs">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={2} className="input-prsto" style={{ resize: "vertical" }} />
                </div>
                <div className="flex items-end gap-4 pb-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.priority === 1}
                      onChange={e => setForm({ ...form, priority: e.target.checked ? 1 : 0 })} />
                    <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Prioritaire</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddManual}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono rounded-md"
                  style={{ background: "var(--or)", color: "var(--fond)" }}>
                  <Plus size={12} /> Ajouter le signal
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-mono rounded-md border"
                  style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VUE PRIORITÉS ── */}
      {viewMode === "priorites" && (
        <PrioritizationView opps={prioritized} router={router} loading={loading} />
      )}

      {/* ── VUE KANBAN ── */}
      {viewMode === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {KANBAN_COLUMNS.map(col => {
              const colOpps = opps.filter(o => o.status === col.value);
              return (
                <div key={col.value}
                  className="flex flex-col rounded-lg border min-w-[200px] w-[220px]"
                  style={{
                    borderColor: dragOverCol === col.value ? "var(--or)" : "var(--bordure)",
                    background: dragOverCol === col.value ? "var(--or-faible)" : "var(--fond-surface)",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onDragOver={e => handleDragOver(e, col.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, col.value)}>
                  {/* Colonne header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: "var(--bordure)" }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[col.value] || "var(--texte-tertiaire)" }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--texte)" }}>{col.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
                      {colOpps.length}
                    </span>
                  </div>

                  {/* Cartes */}
                  <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                    {colOpps.map(opp => (
                      <div key={opp.id} draggable
                        onDragStart={e => handleDragStart(e, opp.id)}
                        onClick={() => router.push(`/opportunites/${opp.id}`)}
                        className="p-2.5 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:shadow-sm text-xs"
                        style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}>
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={10} className="mt-0.5 flex-shrink-0" style={{ color: "var(--texte-tertiaire)" }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold truncate block text-[11px]" style={{ color: "var(--texte)" }}>{opp.title}</span>
                              {opp.priority === 1 && <Star size={8} style={{ color: "var(--or)" }} />}
                            </div>
                            <span className="block truncate mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{opp.company}</span>
                            <div className="flex items-center gap-2 mt-1.5">
                              {opp.scoreGlobal !== null && <ScoreRing score={opp.scoreGlobal} size={20} />}
                              {(opp.duplicateStatus && opp.duplicateStatus !== "UNIQUE") && (
                                <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${DUP_LABELS[opp.duplicateStatus]?.color}15`, color: DUP_LABELS[opp.duplicateStatus]?.color }}>
                                  {DUP_LABELS[opp.duplicateStatus]?.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {colOpps.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                        Déposer ici
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VUE LISTE ── */}
      {viewMode === "liste" && (
        <div className="space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
            </div>
          ) : opps.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
              <Search size={24} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs font-mono">Aucun signal trouvé</p>
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-xs font-mono underline" style={{ color: "var(--or)" }}>
                + Ajouter un signal
              </button>
            </div>
          ) : (
            <>
              {/* Select all row */}
              <div className="flex items-center gap-2 px-1 py-1">
                <button onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded transition-colors"
                  style={{ color: selected.size > 0 ? "var(--or)" : "var(--texte-tertiaire)" }}>
                  {selected.size === opps.length ? <CheckCheck size={10} /> : <CheckCircle2 size={10} />}
                  {selected.size === opps.length ? "Tout désélectionner" : `Tout sélectionner (${opps.length})`}
                </button>
              </div>

              {opps.map(opp => {
                const isSelected = selected.has(opp.id);
                return (
                  <div key={opp.id}
                    className="relative overflow-hidden flex items-start justify-between p-3.5 rounded-lg border cursor-pointer group transition-all hover:shadow-sm"
                    style={{
                      background: isSelected ? "var(--or-faible)" : "var(--fond-surface)",
                      borderColor: isSelected ? "var(--or)" : opp.priority === 1 ? "rgba(198,166,78,0.3)" : "var(--bordure)",
                    }}
                    onClick={() => router.push(`/opportunites/${opp.id}`)}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "var(--or)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = opp.priority === 1 ? "rgba(198,166,78,0.3)" : "var(--bordure)"; }}>
                    {/* P éclair watermark */}
                    <div className="absolute right-0 top-0 bottom-0 w-24 opacity-[0.025] pointer-events-none overflow-hidden">
                      <div className="w-full h-full" style={{ backgroundImage: "url(/branding/p-eclair.png)", backgroundSize: "contain", backgroundPosition: "right center", backgroundRepeat: "no-repeat", transform: "rotate(6deg) scale(1.3)" }} />
                    </div>

                    {/* Checkbox */}
                    <div className="flex items-start gap-3 flex-1 min-w-0 relative z-10"
                      onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(opp.id)}
                        className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                        style={{ borderColor: isSelected ? "var(--or)" : "var(--bordure)", background: isSelected ? "var(--or)" : "transparent" }}>
                        {isSelected && <CheckCircle2 size={10} style={{ color: "var(--fond)" }} />}
                      </button>

                      {/* Score */}
                      <ScoreRing score={opp.scoreGlobal} size={32} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold truncate" style={{ color: "var(--texte)" }}>
                            {opp.title}
                          </span>
                          {opp.priority === 1 && <Star size={11} style={{ color: "var(--or)" }} />}
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                            style={{ background: `${STATUS_COLORS[opp.status]}15`, color: STATUS_COLORS[opp.status] }}>
                            {STATUS_OPTIONS.find(s => s.value === opp.status)?.label || opp.status}
                          </span>
                          {opp.duplicateStatus && opp.duplicateStatus !== "UNIQUE" && (
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: `${DUP_LABELS[opp.duplicateStatus]?.color || "var(--texte-tertiaire)"}15`, color: DUP_LABELS[opp.duplicateStatus]?.color || "var(--texte-tertiaire)" }}>
                              <Copy size={9} />
                              {DUP_LABELS[opp.duplicateStatus]?.label || opp.duplicateStatus}
                              {opp.duplicateScore != null && <span className="opacity-60">({opp.duplicateScore}%)</span>}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs font-mono flex-wrap"
                          style={{ color: "var(--texte-tertiaire)" }}>
                          <span className="flex items-center gap-1"><Building2 size={10} /> {opp.company}</span>
                          {opp.location && <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location}</span>}
                          {opp.country && <span className="flex items-center gap-1"><Globe size={10} /> {opp.country}</span>}
                          {opp.remote && opp.remote !== "tous" && (
                            <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--fond)" }}>{opp.remote}</span>
                          )}
                          {opp.contractType && (
                            <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--fond)" }}>{opp.contractType}</span>
                          )}
                          {opp.sourceName && <span className="opacity-60">via {opp.sourceName}</span>}
                          {opp._count?.documents > 0 && (
                            <span className="flex items-center gap-1" style={{ color: "var(--or)" }}>
                              <FileText size={10} /> {opp._count.documents}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-3 relative z-10"
                      onClick={e => e.stopPropagation()}>
                      <select value={opp.status} onChange={e => handleQuickStatus(opp.id, e.target.value)}
                        className="text-xs font-mono p-1 rounded border"
                        style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                        {STATUS_OPTIONS.filter(s => s.value !== "tous").map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button onClick={() => handleDelete(opp.id)}
                        className="p-1.5 rounded hover:bg-red-50" style={{ color: "var(--erreur)" }} title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                      <button onClick={() => {
                        if (!compareA) setCompareA(opp.id);
                        else if (!compareB && opp.id !== compareA) setCompareB(opp.id);
                      }}
                        className="p-1.5 rounded" style={{ color: compareA === opp.id || compareB === opp.id ? "var(--or)" : "var(--texte-tertiaire)" }} title="Comparer">
                        <GitCompare size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Comparaison */}
      {compareA && compareB && (
        <ComparisonPanel idA={compareA} idB={compareB} onClose={() => { setCompareA(null); setCompareB(null); }} />
      )}

    </div>
  );
}

/* ─── Vue Priorisation ─────────────────────────────── */

const RECO_COLORS: Record<string, string> = {
  POSTULER: "var(--succes)",
  ANALYSER: "var(--info)",
  PREPARER: "var(--or)",
  RELANCER: "var(--warning)",
  ATTENDRE: "var(--texte-tertiaire)",
  ARCHIVER: "var(--erreur)",
};

const RECO_BG: Record<string, string> = {
  POSTULER: "rgba(74,222,128,0.12)",
  ANALYSER: "rgba(59,130,246,0.12)",
  PREPARER: "rgba(245,158,11,0.12)",
  RELANCER: "rgba(239,68,68,0.10)",
  ATTENDRE: "rgba(100,100,100,0.08)",
  ARCHIVER: "rgba(239,68,68,0.06)",
};

function PrioritizationView({ opps, router, loading }: { opps: PrioritizedOpportunity[]; router: ReturnType<typeof useRouter>; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  if (opps.length === 0) {
    return (
      <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
        <Target size={24} className="mx-auto mb-3 opacity-30" />
        <p className="text-xs font-mono">Aucune opportunité à prioriser</p>
        <p className="text-xs mt-1">Ajoutez des offres et lancez leur analyse pour les voir apparaître ici.</p>
      </div>
    );
  }

  const actionable = opps.filter(o => o.recommendation === "POSTULER" || o.recommendation === "PREPARER" || o.recommendation === "RELANCER").length;
  const needAnalysis = opps.filter(o => o.recommendation === "ANALYSER").length;

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Actionnables", value: actionable, color: "var(--succes)" },
          { label: "À analyser", value: needAnalysis, color: "var(--info)" },
          { label: "Score ≥ 60", value: opps.filter(o => o.scoreGlobal && o.scoreGlobal >= 60).length, color: "var(--or)" },
          { label: "Doublons", value: opps.filter(o => o.duplicateStatus === "PROBABLE_DUPLICATE" || o.duplicateStatus === "CONFIRMED_DUPLICATE").length, color: "var(--erreur)" },
        ].map((stat, i) => (
          <div key={i} className="relative overflow-hidden rounded-lg border p-3.5" style={{
            borderColor: `${stat.color}25`,
            background: `color-mix(in srgb, ${stat.color} 6%, var(--fond-surface))`,
          }}>
            <div className="absolute -right-3 -top-3 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: "url(/branding/p-eclair.png)", backgroundSize: "contain", width: 60, height: 60, backgroundRepeat: "no-repeat", transform: "rotate(12deg)" }} />
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--bordure)", background: "var(--fond-eleve)" }}>
                <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>#</th>
                <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Poste</th>
                <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entreprise</th>
                <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Score</th>
                <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Priorité</th>
                <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Pays</th>
                <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Pipeline</th>
                <th className="text-center p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Doc</th>
                <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {opps.map((o, i) => (
                <tr key={o.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--bordure-douce)" }}
                  onClick={() => router.push(`/opportunites/${o.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--fond-eleve)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="p-2.5" style={{ color: "var(--texte-tertiaire)" }}>{i + 1}</td>
                  <td className="p-2.5 max-w-[200px] truncate" style={{ color: "var(--texte)" }}>
                    <div className="flex items-center gap-1.5">
                      {o.priority === 1 && <Star size={10} fill="var(--or)" style={{ color: "var(--or)" }} />}
                      <span>{o.title}</span>
                    </div>
                  </td>
                  <td className="p-2.5" style={{ color: "var(--texte-secondaire)" }}>{o.company}</td>
                  <td className="p-2.5 text-center">
                    {o.scoreGlobal != null ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <ScoreRing score={o.scoreGlobal} size={24} />
                      </div>
                    ) : (
                      <span style={{ color: "var(--texte-tertiaire)" }}>—</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full" style={{ background: "var(--fond-eleve)" }}>
                        <div className="h-1.5 rounded-full" style={{
                          width: `${o.priorityScore}%`,
                          background: o.priorityScore >= 70 ? "var(--succes)" : o.priorityScore >= 45 ? "var(--or)" : "var(--erreur)",
                        }} />
                      </div>
                      <span className="font-bold text-[11px]" style={{ color: o.priorityScore >= 70 ? "var(--succes)" : o.priorityScore >= 45 ? "var(--or)" : "var(--texte-tertiaire)" }}>
                        {o.priorityScore}
                      </span>
                    </div>
                  </td>
                  <td className="p-2.5 text-center" style={{ color: "var(--texte-tertiaire)" }}>{o.country || "—"}</td>
                  <td className="p-2.5 text-center">
                    {o.inPipeline ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(74,222,128,0.15)", color: "var(--succes)" }}>
                        {o.pipelineColumn ? o.pipelineColumn.replace(/_/g, " ") : "Oui"}
                      </span>
                    ) : (
                      <span style={{ color: "var(--texte-tertiaire)" }}>—</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    {o.hasApprovedDocument ? (
                      <CheckCircle2 size={12} style={{ color: "var(--succes)" }} />
                    ) : o.hasDocument ? (
                      <FileText size={12} style={{ color: "var(--or)" }} />
                    ) : (
                      <span style={{ color: "var(--texte-tertiaire)" }}>—</span>
                    )}
                  </td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] whitespace-nowrap"
                      style={{ background: RECO_BG[o.recommendation] || "var(--fond-eleve)", color: RECO_COLORS[o.recommendation] || "var(--texte-tertiaire)" }}>
                      {o.recommendationLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--succes)" }} /> Score ≥ 70 : Candidature forte</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--or)" }} /> Score 45-69 : Potentiel à confirmer</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--erreur)" }} /> Score &lt; 45 : Risque élevé</span>
        <span className="flex items-center gap-1 ml-2"><Star size={9} style={{ color: "var(--or)" }} /> Priorité manuelle</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={9} style={{ color: "var(--succes)" }} /> Document approuvé</span>
        <span className="flex items-center gap-1"><FileText size={9} style={{ color: "var(--or)" }} /> Document généré</span>
      </div>
    </div>
  );
}

/* ─── Comparaison panel ─────────────────────────────── */
function ComparisonPanel({ idA, idB, onClose }: { idA: string; idB: string; onClose: () => void }) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/actions/dedup").then(mod => {
      mod.getComparisonData(idA, idB).then(d => { setData(d as unknown as ComparisonData); setLoading(false); });
    });
  }, [idA, idB]);

  if (loading) return <div className="p-6 text-center"><Loader2 size={16} className="animate-spin" style={{ color: "var(--or)" }} /></div>;
  if (!data) return null;

  const { a, b, result } = data;

  const statusLabel = (s: string) => {
    if (s >= "95") return { label: "Doublon quasi certain", color: "var(--erreur)" };
    if (s >= "75") return { label: "Doublon probable", color: "var(--warning)" };
    if (s >= "50") return { label: "Offre similaire", color: "var(--or)" };
    return { label: "Distinct", color: "var(--succes)" };
  };
  const sl = statusLabel(String(result.score));

  return (
    <div className="mt-4 p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--texte)" }}>
          <GitCompare size={16} style={{ color: "var(--or)" }} /> Comparaison d&apos;offres
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: sl.color }}>{result.score}% — {sl.label}</span>
          <button onClick={onClose} className="text-xs p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}><X size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((item, i) => (
          <div key={i} className="relative overflow-hidden p-3 rounded border" style={{ borderColor: "var(--bordure-douce)" }}>
            <div className="absolute right-0 top-0 bottom-0 w-16 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: "url(/branding/p-eclair.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "right center", transform: "rotate(6deg)" }} />
            <h4 className="text-sm font-bold" style={{ color: "var(--texte)" }}>{item.title}</h4>
            <div className="text-xs space-y-1 mt-1" style={{ color: "var(--texte-secondaire)" }}>
              <p><strong>Entreprise :</strong> {item.company}</p>
              <p><strong>Localisation :</strong> {item.location || "—"}</p>
              <p><strong>Source :</strong> {item.sourceName || "—"}</p>
              <p><strong>Type :</strong> {item.contractType || "—"}</p>
              {item.hasPipeline && <p style={{ color: "var(--avertissement)" }}>⚠ Candidature dans le pipeline</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs space-y-1 p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
        <p style={{ color: "var(--texte-tertiaire)" }}>Détail du score :</p>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(result.breakdown).map(([k, v]) => (
            <div key={k} className="text-center">
              <div className="font-bold" style={{ color: "var(--texte)" }}>{v as number}/25</div>
              <div className="text-[9px]" style={{ color: "var(--texte-tertiaire)" }}>
                {k === "company" ? "Entreprise" : k === "title" ? "Titre" : k === "location" ? "Lieu" : k === "description" ? "Description" : k === "keywords" ? "Mots-clés" : "Contrat"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => {
          import("@/lib/actions/dedup").then(mod => mod.markAsDuplicate(idA, idB));
          onClose();
        }}
          className="px-4 py-1.5 text-xs font-mono rounded-md"
          style={{ background: "var(--erreur)", color: "var(--fond)" }}>
          Marquer comme doublon
        </button>
        <button onClick={() => {
          import("@/lib/actions/dedup").then(mod => mod.markAsDuplicate(idB, idA));
          onClose();
        }}
          className="px-4 py-1.5 text-xs font-mono rounded-md"
          style={{ background: "var(--erreur)", color: "var(--fond)", opacity: 0.7 }}>
          Marquer B comme doublon
        </button>
        <button onClick={() => {
          import("@/lib/actions/dedup").then(mod => mod.markAsDistinct(idA));
          onClose();
        }}
          className="px-4 py-1.5 text-xs font-mono rounded-md"
          style={{ background: "var(--succes)", color: "var(--fond)" }}>
          Marquer comme distinct
        </button>
      </div>
    </div>
  );
}
