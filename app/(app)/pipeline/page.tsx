"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutGrid, List,
  Clock, AlertTriangle,
  Star, ChevronDown, Loader2, MoveRight,
  Building2, X, CheckCircle2,
} from "lucide-react";
import { getPipelineTasks, updatePipelineColumn } from "@/lib/actions/pipeline";
import { PIPELINE_COLUMNS } from "@/lib/pipeline-constants";

interface PipelineTaskItem {
  id: string; column: string; opportunityId: string; order: number;
  nextStep: string | null; nextStepDate: string | null; lastStatusChange: string;
  opportunity: {
    id: string; title: string; company: string; country: string | null; sourceName: string | null; score: number | null; priority: number;
    analysis: { scoreGlobal: number | null; } | null;
    _count: { documents: number; };
    relances: { id: string; date: string; }[];
    documents: { id: string; status: string; }[];
  } | null;
}

function getColumnColor(key: string): string {
  const map: Record<string, string> = {
    nouveau: "var(--info)",
    a_analyser: "var(--warning)",
    analyse: "var(--or)",
    a_preparer: "var(--or)",
    document_a_valider: "var(--warning)",
    pret_a_envoyer: "var(--succes)",
    envoye: "var(--succes)",
    relance_1: "var(--or)",
    relance_2: "var(--or)",
    entretien_rh: "var(--info)",
    entretien_direction: "var(--info)",
    offre: "var(--succes)",
    refus: "var(--erreur)",
    archive: "var(--texte-tertiaire)",
  };
  return map[key] || "var(--texte-tertiaire)";
}

export default function PipelinePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<PipelineTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "liste">("kanban");
  const [filters, setFilters] = useState({
    search: "",
    column: "",
    country: "",
    priority: -1,
    retard: false,
    docApprouved: false,
  });
  const [moving, setMoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPipelineTasks({
      ...(filters.column ? { column: filters.column } : {}),
      ...(filters.country ? { country: filters.country } : {}),
      ...(filters.priority !== -1 ? { priority: filters.priority } : {}),
      ...(filters.retard ? { retard: true } : {}),
      ...(filters.docApprouved ? { docApprouved: true } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    });
    setTasks(data as unknown as PipelineTaskItem[]);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleColumnChange = async (taskId: string, newColumn: string) => {
    setMoving(taskId);
    await updatePipelineColumn(taskId, newColumn);
    await load();
    setMoving(null);
  };

  const grouped = PIPELINE_COLUMNS.map((col) => ({
    ...col,
    items: tasks.filter((t) => t.column === col.key),
  }));

  return (
    <div className="p-6 max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>
            Pipeline
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {tasks.length} opportunité{tasks.length !== 1 ? "s" : ""} dans le pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-2 rounded-md border ${viewMode === "kanban" ? "" : "opacity-50"}`}
            style={{
              borderColor: viewMode === "kanban" ? "var(--or)" : "var(--bordure)",
              color: viewMode === "kanban" ? "var(--or)" : "var(--texte-tertiaire)",
            }}>
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode("liste")}
            className={`p-2 rounded-md border ${viewMode === "liste" ? "" : "opacity-50"}`}
            style={{
              borderColor: viewMode === "liste" ? "var(--or)" : "var(--bordure)",
              color: viewMode === "liste" ? "var(--or)" : "var(--texte-tertiaire)",
            }}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Avertissement */}
      <div className="px-3 py-2 rounded-md text-xs font-mono border" style={{ background: "var(--fond-eleve)", borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)" }}>
        <AlertTriangle size={12} className="inline mr-1" style={{ color: "var(--warning)" }} />
        ELTON OS ne postule jamais à votre place. Vous copiez, vous envoyez, vous marquez.
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--texte-tertiaire)" }} />
          <input
            type="text" placeholder="Rechercher..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="input-elton text-xs pl-8 w-40" />
        </div>
        <select value={filters.column} onChange={e => setFilters(f => ({ ...f, column: e.target.value }))}
          className="input-elton text-xs w-32">
          <option value="">Toutes colonnes</option>
          {PIPELINE_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button onClick={() => setFilters(f => ({ ...f, retard: !f.retard }))}
          className={`text-xs font-mono px-2.5 py-1.5 rounded border ${filters.retard ? "" : "opacity-50"}`}
          style={{
            borderColor: filters.retard ? "var(--erreur)" : "var(--bordure)",
            color: filters.retard ? "var(--erreur)" : "var(--texte-tertiaire)",
          }}>
          En retard
        </button>
        <button onClick={() => setFilters(f => ({ ...f, docApprouved: !f.docApprouved }))}
          className={`text-xs font-mono px-2.5 py-1.5 rounded border ${filters.docApprouved ? "" : "opacity-50"}`}
          style={{
            borderColor: filters.docApprouved ? "var(--succes)" : "var(--bordure)",
            color: filters.docApprouved ? "var(--succes)" : "var(--texte-tertiaire)",
          }}>
          Doc. approuvé
        </button>
        {(filters.column || filters.retard || filters.docApprouved || filters.priority !== -1 || filters.country) && (
          <button onClick={() => setFilters({ search: "", column: "", country: "", priority: -1, retard: false, docApprouved: false })}
            className="flex items-center gap-1 text-xs font-mono px-2 py-1.5 rounded border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
            <X size={11} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      ) : viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          <div className="flex gap-3" style={{ minWidth: grouped.length * 240 }}>
            {grouped.map((col) => (
              <div
                key={col.key}
                className="flex-shrink-0 rounded-lg border"
                style={{ width: 230, background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                <div className="p-2.5 flex items-center justify-between border-b" style={{ borderColor: "var(--bordure-douce)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: getColumnColor(col.key) }} />
                    <span className="text-xs font-mono font-bold" style={{ color: "var(--texte)" }}>{col.label}</span>
                  </div>
                  <span className="text-xs font-mono tabular-nums" style={{ color: "var(--texte-tertiaire)" }}>{col.items.length}</span>
                </div>
                <div className="p-1.5 space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {col.items.map((task) => (
                    <PipelineCard
                      key={task.id}
                      task={task}
                      router={router}
                      moving={moving === task.id}
                      onMove={(newCol) => handleColumnChange(task.id, newCol)}
                    />
                  ))}
                  {col.items.length === 0 && (
                    <div className="p-3 text-xs text-center font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                      —
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Liste */
        <div className="rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bordure)" }}>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Poste</th>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entreprise</th>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Pays</th>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Colonne</th>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Prochaine étape</th>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Délai</th>
                  <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-opacity-50"
                    style={{ borderBottom: "1px solid var(--bordure-douce)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td className="p-2.5 cursor-pointer" onClick={() => router.push(`/opportunites/${task.opportunityId}`)}>
                      <div className="flex items-center gap-2">
                        {task.opportunity?.priority === 1 && <Star size={10} style={{ color: "var(--or)" }} />}
                        <span style={{ color: "var(--texte)" }}>{task.opportunity?.title || "—"}</span>
                      </div>
                    </td>
                    <td className="p-2.5" style={{ color: "var(--texte-secondaire)" }}>{task.opportunity?.company}</td>
                    <td className="p-2.5" style={{ color: "var(--texte-tertiaire)" }}>{task.opportunity?.country}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: `${getColumnColor(task.column)}18`, color: getColumnColor(task.column) }}>
                        {PIPELINE_COLUMNS.find(c => c.key === task.column)?.label || task.column}
                      </span>
                    </td>
                    <td className="p-2.5" style={{ color: "var(--texte-secondaire)" }}>
                      {task.nextStep || "—"}
                      {task.nextStepDate && <span style={{ color: "var(--texte-tertiaire)" }}> ({new Date(task.nextStepDate).toLocaleDateString("fr-FR")})</span>}
                    </td>
                    <td className="p-2.5">
                      {task.nextStepDate && new Date(task.nextStepDate) < new Date() && (
                        <span className="flex items-center gap-1" style={{ color: "var(--erreur)" }}>
                          <Clock size={10} /> En retard
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <ColumnMenu currentColumn={task.column} onMove={(col) => handleColumnChange(task.id, col)} />
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center" style={{ color: "var(--texte-tertiaire)" }}>Aucune tâche dans le pipeline</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Carte Kanban ─── */
function PipelineCard({ task, router, moving, onMove }: {
  task: PipelineTaskItem;
  router: ReturnType<typeof useRouter>;
  moving: boolean;
  onMove: (col: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const opp = (task.opportunity || {}) as NonNullable<PipelineTaskItem["opportunity"]> | Record<string, never>;
  const score = opp.analysis?.scoreGlobal ?? opp.score;
  const hasApprovedDoc = opp.documents?.some((d) => d.status === "APPROVED") || ((opp._count?.documents ?? 0) > 0);
  const isLate = task.nextStepDate && new Date(task.nextStepDate) < new Date();

  return (
    <div
      className={`rounded-md border p-2.5 space-y-1.5 text-xs relative ${moving ? "opacity-50" : ""}`}
      style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)", cursor: "pointer" }}
      onClick={() => router.push(`/opportunites/${task.opportunityId}`)}>
      {/* Score badge */}
      <div className="flex items-center justify-between">
        {score != null && (
          <span className="font-mono text-xs font-bold" style={{ color: score >= 70 ? "var(--succes)" : score >= 45 ? "var(--or)" : "var(--texte-tertiaire)" }}>
            {score}%
          </span>
        )}
        {opp.priority === 1 && <Star size={10} fill="var(--or)" style={{ color: "var(--or)" }} />}
      </div>

      <div className="font-bold" style={{ color: "var(--texte)" }}>{opp.title || "—"}</div>
      <div className="flex items-center gap-1" style={{ color: "var(--texte-secondaire)" }}>
        <Building2 size={10} /> {opp.company}
      </div>
      <div className="flex flex-wrap gap-1">
        {opp.country && <span className="text-xs px-1 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>{opp.country}</span>}
        {opp.sourceName && <span className="text-xs px-1 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>{opp.sourceName}</span>}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1">
        {hasApprovedDoc && (
          <span className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded" style={{ background: "rgba(74,222,128,0.15)", color: "var(--succes)" }}>
            <CheckCircle2 size={9} /> Doc approuvé
          </span>
        )}
        {isLate && (
          <span className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.15)", color: "var(--erreur)" }}>
            <AlertTriangle size={9} /> Retard
          </span>
        )}
      </div>

      {/* Prochaine étape */}
      {task.nextStep && (
        <div className="flex items-center gap-1" style={{ color: "var(--texte-tertiaire)" }}>
          <Clock size={9} />
          <span>{task.nextStep}{task.nextStepDate ? ` — ${new Date(task.nextStepDate).toLocaleDateString("fr-FR")}` : ""}</span>
        </div>
      )}

      {/* Bouton déplacer */}
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
          style={{ color: "var(--texte-tertiaire)" }}>
          <MoveRight size={10} /> Déplacer
        </button>
        {showMenu && (
          <div className="absolute left-0 top-6 z-20 rounded-md border shadow-lg p-1 w-48 max-h-60 overflow-y-auto"
            style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            {PIPELINE_COLUMNS.filter(c => c.key !== task.column).map(col => (
              <button
                key={col.key}
                onClick={() => { onMove(col.key); setShowMenu(false); }}
                className="w-full text-left px-2 py-1.5 rounded text-xs font-mono hover:opacity-80"
                style={{ color: "var(--texte-secondaire)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                → {col.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Menu colonne (vue liste) ─── */
function ColumnMenu({ currentColumn, onMove }: {
  currentColumn: string; onMove: (col: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-20 rounded-md border shadow-lg p-1 w-44 max-h-52 overflow-y-auto"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}
          onClick={e => e.stopPropagation()}>
          {PIPELINE_COLUMNS.filter(c => c.key !== currentColumn).map(col => (
            <button
              key={col.key}
              onClick={() => { onMove(col.key); setOpen(false); }}
              className="w-full text-left px-2 py-1.5 rounded text-xs font-mono"
              style={{ color: "var(--texte-secondaire)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              → {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
