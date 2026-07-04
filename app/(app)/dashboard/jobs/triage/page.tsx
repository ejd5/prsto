"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Search, CheckCircle2, Trash2, ExternalLink,
  Eye, Sparkles, Filter, X,
  Globe, Globe2, Building2, MousePointer, Zap, FlaskConical, HelpCircle,
} from "lucide-react";

// Configuration visuelle par type de source
const SOURCE_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.FC<{size?:number}> }> = {
  browser:   { label: "Manuel",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: MousePointer },
  ats:       { label: "ATS",       color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: Building2 },
  "firecrawl-safe": { label: "Firecrawl", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: Zap },
  fixture:   { label: "Test",      color: "#808080", bg: "rgba(128,128,128,0.10)", icon: FlaskConical },
  fallback:  { label: "Inconnu",   color: "#9ca3af", bg: "rgba(156,163,175,0.10)", icon: HelpCircle },
};

interface TriageItem {
  draftId: string;
  jobId: string;
  title: string;
  company: string | null;
  location: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  sourceType: string | null;
  contractType: string | null;
  jobStatus: string;
  importedAt: string | null;
}

export default function TriagePage() {
  const router = useRouter();
  const [items, setItems] = useState<TriageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [kept, setKept] = useState<Set<string>>(new Set());
  const [showKept, setShowKept] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/jobs/triage");
    const data = await r.json();
    if (data.success) setItems(data.items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (jobId: string, action: "keep" | "delete") => {
    setBusy((prev) => new Set(prev).add(jobId));
    try {
      const r = await fetch(`/api/jobs/${jobId}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await r.json();
      if (data.success) {
        if (action === "delete") {
          setDeleted((prev) => new Set(prev).add(jobId));
          setItems((prev) => prev.filter((it) => it.jobId !== jobId));
        } else {
          setKept((prev) => new Set(prev).add(jobId));
        }
      }
    } catch { /* ignore */ }
    setBusy((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
  };

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    if (q && !it.title.toLowerCase().includes(q) && !(it.company || "").toLowerCase().includes(q)) return false;
    return true;
  });

  const keptItems = items.filter((it) => kept.has(it.jobId));
  const remaining = items.filter((it) => !deleted.has(it.jobId) && !kept.has(it.jobId));

  const displayed = showKept ? keptItems : remaining;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>
            Triage des offres
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {remaining.length} offre{remaining.length !== 1 ? "s" : ""} à traiter · {kept.size} gardée{kept.size !== 1 ? "s" : ""} · {deleted.size} supprimée{deleted.size !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKept(!showKept)}
            className="px-3 py-1.5 text-xs font-mono rounded border transition-colors"
            style={{
              borderColor: showKept ? "#22c55e" : "var(--bordure)",
              color: showKept ? "#22c55e" : "var(--texte-secondaire)",
              background: showKept ? "rgba(34,197,94,0.08)" : "transparent",
            }}
          >
            <CheckCircle2 size={12} className="inline mr-1" />
            Gardées ({kept.size})
          </button>
          <button
            onClick={load}
            className="px-3 py-1.5 text-xs font-mono rounded border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
          >
            <Sparkles size={12} className="inline mr-1" />Actualiser
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--texte-tertiaire)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par titre ou entreprise..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm"
          style={{
            background: "var(--fond-surface)",
            borderColor: "var(--bordure)",
            color: "var(--texte)",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={14} style={{ color: "var(--texte-tertiaire)" }} />
          </button>
        )}
      </div>

      {/* Légende des sources */}
      {!loading && items.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {Object.entries(SOURCE_STYLES).filter(([k]) => k !== "fallback").map(([key, st]) => {
            const count = items.filter((it) => it.sourceType === key).length;
            if (count === 0) return null;
            const Icon = st.icon;
            return (
              <div key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                <Icon size={10} />
                <span>{st.label}</span>
                <span className="font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && remaining.length === 0 && !showKept && (
        <div className="text-center p-12 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
          <p className="text-sm font-bold" style={{ color: "var(--texte)" }}>Tout est trié !</p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {kept.size > 0 ? `${kept.size} offre(s) gardée(s).` : "Aucune offre à traiter pour le moment."}
          </p>
          {kept.size > 0 && (
            <button
              onClick={() => router.push("/dashboard/jobs")}
              className="mt-3 px-4 py-2 text-xs font-mono rounded border"
              style={{ borderColor: "var(--or)", color: "var(--or)" }}
            >
              Voir les offres gardées →
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && displayed.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bordure)" }}>
          <table className="w-full text-xs">
            <thead style={{ background: "var(--fond-eleve)" }}>
              <tr>
                <th className="text-left p-3 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Offre</th>
                <th className="text-left p-3 font-mono hidden md:table-cell" style={{ color: "var(--texte-tertiaire)" }}>Source</th>
                <th className="text-left p-3 font-mono hidden md:table-cell" style={{ color: "var(--texte-tertiaire)" }}>Contrat</th>
                <th className="text-right p-3 font-mono" style={{ color: "var(--texte-tertiaire)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item, idx) => {
                const isBusy = busy.has(item.jobId);
                return (
                  <tr
                    key={item.jobId}
                    className="transition-colors"
                    style={{
                      background: idx % 2 === 0 ? "var(--fond-surface)" : "var(--fond)",
                      borderTop: idx > 0 ? `1px solid var(--bordure-douce)` : "none",
                      opacity: isBusy ? 0.5 : 1,
                    }}
                  >
                    <td className="p-3">
                      <p className="font-bold" style={{ color: "var(--texte)" }}>{item.title}</p>
                      <p style={{ color: "var(--texte-secondaire)" }}>{item.company || "—"}</p>
                      {item.location && <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{item.location}</p>}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {(() => {
                        const st = SOURCE_STYLES[item.sourceType || ""] || SOURCE_STYLES.fallback;
                        const Icon = st.icon;
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
                            style={{ background: st.bg, color: st.color }}
                          >
                            <Icon size={10} />
                            {item.sourceName || st.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 hidden md:table-cell" style={{ color: "var(--texte-tertiaire)" }}>
                      {item.contractType || "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded border transition-colors"
                            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
                            title="Voir l'annonce originale">
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/jobs/applications/${item.draftId}`)}
                          className="p-1.5 rounded border transition-colors"
                          style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
                          title="Préparer la candidature"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleAction(item.jobId, "keep")}
                          disabled={isBusy || kept.has(item.jobId)}
                          className="px-2.5 py-1.5 rounded border text-xs font-mono transition-colors"
                          style={{
                            borderColor: kept.has(item.jobId) ? "#22c55e" : "#22c55e",
                            color: kept.has(item.jobId) ? "#fff" : "#22c55e",
                            background: kept.has(item.jobId) ? "#22c55e" : "transparent",
                          }}
                        >
                          <CheckCircle2 size={10} className="inline mr-0.5" />
                          {kept.has(item.jobId) ? "Gardé" : "Garder"}
                        </button>
                        <button
                          onClick={() => handleAction(item.jobId, "delete")}
                          disabled={isBusy}
                          className="px-2.5 py-1.5 rounded border text-xs font-mono transition-colors"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                        >
                          {isBusy ? <Loader2 size={10} className="animate-spin inline mr-0.5" /> : <Trash2 size={10} className="inline mr-0.5" />}
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
