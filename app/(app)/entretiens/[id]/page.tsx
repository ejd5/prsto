"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, CheckCircle2, Copy, Edit3, Save,
  Calendar, Building2, Globe, Target, FileText, AlertTriangle,
  ChevronDown, ChevronRight, Trash2,
} from "lucide-react";
import { getInterview, updateInterviewPreparation, markInterviewReady, deleteInterview } from "@/lib/actions/interview";
import { INTERVIEW_SECTIONS } from "@/lib/generation/interview-templates";

interface InterviewDetail {
  id: string; opportunityId: string; preparation: string; status: string; createdAt: string;
  type: string | null; date: string | null; interviewer: string | null; notes: string | null; sections: string | null;
  opportunity: {
    id: string; title: string; company: string; country: string | null; score: number | null; rawText: string | null;
    contractType: string | null; location: string | null;
    analysis: { scoreGlobal: number | null; keywordsAts: string; exigences: string; } | null;
    documents: { id: string; type: string; status: string; }[];
    pipelineTask: { id: string; column: string; notes: string | null; recruiterName: string | null; } | null;
    relances: { id: string; date: string; }[];
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: "Brouillon", color: "var(--texte-tertiaire)", bg: "rgba(156,163,175,0.1)" },
  pret: { label: "Prêt", color: "var(--succes)", bg: "rgba(74,222,128,0.1)" },
  utilise: { label: "Utilisé", color: "var(--info)", bg: "rgba(59,130,246,0.1)" },
};

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [iv, setIv] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [preparation, setPreparation] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"preparation" | "notes" | "source">("preparation");

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getInterview(id);
    setIv(data as InterviewDetail | null);
    setPreparation(data?.preparation || "");
    // Expand first 3 sections by default
    if (data?.sections) {
      try {
        const s = JSON.parse(data.sections);
        const expanded: Record<string, boolean> = {};
        Object.keys(s).slice(0, 3).forEach((k: string) => { expanded[k] = true; });
        setExpanded(expanded);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    await updateInterviewPreparation(id, preparation);
    notify("ok", "Préparation sauvegardée");
    setEditing(false);
    await load();
  };

  const handleMarkReady = async () => {
    await markInterviewReady(id);
    notify("ok", "Préparation marquée comme prête");
    await load();
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette préparation ?")) return;
    await deleteInterview(id);
    router.push("/entretiens");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    notify("ok", "Copié !");
  };

  const toggleExpand = (key: string) => {
    setExpanded(e => ({ ...e, [key]: !e[key] }));
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  if (!iv) {
    return (
      <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
        <p className="text-sm font-mono">Préparation introuvable</p>
        <button onClick={() => router.push("/entretiens")}
          className="mt-4 text-xs font-mono underline" style={{ color: "var(--or)" }}>
          Retour aux entretiens
        </button>
      </div>
    );
  }

  const opp = iv.opportunity;
  const st = STATUS_LABELS[iv.status] || STATUS_LABELS.brouillon;
  const sections: Record<string, string> = (() => {
    try { return JSON.parse(iv.sections || "{}"); } catch { return {}; }
  })();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/entretiens")}
            className="flex items-center gap-2 text-xs font-mono transition-colors"
            style={{ color: "var(--texte-tertiaire)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--or)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--texte-tertiaire)"; }}>
            <ArrowLeft size={14} /> Entretiens
          </button>
          <span className="text-xs font-mono" style={{ color: "var(--bordure)" }}>|</span>
          <span className="text-sm font-mono" style={{ color: "var(--texte)" }}>
            {iv.type === "entretien" ? "Entretien" : iv.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md"
            style={{ background: st.bg, color: st.color }}>
            <CheckCircle2 size={12} /> {st.label}
          </span>
          <button onClick={handleDelete}
            className="p-2 rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--erreur)" }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* Méta */}
      <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>{opp?.title || "Sans opportunité"}</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--texte-secondaire)" }}>
          <span className="flex items-center gap-1"><Building2 size={12} /> {opp?.company}</span>
          {opp?.country && <span className="flex items-center gap-1"><Globe size={12} /> {opp.country}</span>}
          {opp?.score && <span className="flex items-center gap-1" style={{ color: "var(--or)" }}><Target size={12} /> Score {opp.score}/100</span>}
          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(iv.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1" style={{ borderRight: "1px solid var(--bordure)", paddingRight: 8 }}>
            {(["preparation", "notes", "source"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-1.5 text-xs font-mono uppercase rounded"
                style={{ background: tab === t ? "var(--or-faible)" : "transparent", color: tab === t ? "var(--or)" : "var(--texte-tertiaire)" }}>
                {t === "preparation" ? "Préparation" : t === "notes" ? "Notes" : "Source"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            {editing ? <Save size={12} /> : <Edit3 size={12} />}
            {editing ? "Verrouiller" : "Modifier"}
          </button>
          {editing && (
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
              style={{ background: "var(--or)", color: "var(--fond)" }}>
              <CheckCircle2 size={12} /> Sauvegarder
            </button>
          )}
          {!editing && iv.status !== "pret" && (
            <button onClick={handleMarkReady}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
              style={{ background: "var(--succes)", color: "var(--fond)" }}>
              <CheckCircle2 size={12} /> Marquer prêt
            </button>
          )}
          {iv.status === "pret" && (
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border opacity-40 cursor-not-allowed"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
              <CheckCircle2 size={12} /> Prêt — Utilisez cette préparation
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
      {tab === "preparation" && (
        editing ? (
          <textarea value={preparation} onChange={e => setPreparation(e.target.value)}
            className="w-full p-5 text-sm leading-relaxed font-sans resize-y rounded-lg border"
            style={{ background: "var(--fond-surface)", color: "var(--texte)", borderColor: editing ? "var(--or)" : "var(--bordure)", minHeight: "60vh", lineHeight: 1.8 }} />
        ) : Object.keys(sections).length > 0 ? (
          <div className="space-y-3">
            {INTERVIEW_SECTIONS.map(({ key, label, group }) => {
              const content = sections[key];
              if (!content) return null;
              const isExpanded = expanded[key] ?? false;
              return (
                <div key={key} className="rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                  <button
                    onClick={() => toggleExpand(key)}
                    className="w-full flex items-center justify-between p-3 text-left"
                    style={{ color: "var(--texte)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
                        {group}
                      </span>
                      <span className="text-sm font-mono">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); handleCopy(content); }}
                        className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}>
                        <Copy size={11} />
                      </button>
                      {isExpanded ? <ChevronDown size={14} style={{ color: "var(--texte-tertiaire)" }} /> : <ChevronRight size={14} style={{ color: "var(--texte-tertiaire)" }} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans"
                        style={{ color: "var(--texte-secondaire)", lineHeight: 1.7 }}>
                        {content}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
            <FileText size={24} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-mono">Aucune préparation générée.</p>
          </div>
        )
      )}

      {/* Notes */}
      {tab === "notes" && (
        <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span style={{ color: "var(--texte-tertiaire)" }}>Type :</span>
              <span style={{ color: "var(--texte)" }}> {iv.type === "entretien" ? "Entretien" : iv.type}</span>
            </div>
            <div>
              <span style={{ color: "var(--texte-tertiaire)" }}>Statut :</span>
              <span style={{ color: st.color }}> {st.label}</span>
            </div>
            {iv.date && (
              <div>
                <span style={{ color: "var(--texte-tertiaire)" }}>Date :</span>
                <span style={{ color: "var(--texte)" }}> {new Date(iv.date).toLocaleDateString("fr-FR")}</span>
              </div>
            )}
            {iv.interviewer && (
              <div>
                <span style={{ color: "var(--texte-tertiaire)" }}>Interviewer :</span>
                <span style={{ color: "var(--texte)" }}> {iv.interviewer}</span>
              </div>
            )}
          </div>
          {iv.notes && (
            <div className="border-t pt-3" style={{ borderColor: "var(--bordure-douce)" }}>
              <h4 className="text-xs font-mono uppercase mb-1" style={{ color: "var(--texte-tertiaire)" }}>Notes</h4>
              <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{iv.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Source */}
      {tab === "source" && (
        <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="text-xs font-mono space-y-1" style={{ color: "var(--texte-secondaire)" }}>
            <p><strong>Préparation pour :</strong> {opp?.title} — {opp?.company}</p>
            <p><strong>Sections générées :</strong> {INTERVIEW_SECTIONS.length}</p>
            <p><strong>Sources utilisées :</strong> Profil, CV Maître, Proof Vault, Opportunité, Analyse</p>
            <p><strong>Moteur :</strong> ELTON-OS Template Engine v1.0 (local, sans IA)</p>
            <p><strong>Créé le :</strong> {new Date(iv.createdAt).toLocaleString("fr-FR")}</p>
          </div>
          <div className="border-t pt-3" style={{ borderColor: "var(--bordure)" }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--avertissement)" }}>
              <AlertTriangle size={12} />
              <span>Vérifiez chaque section avant l&apos;entretien. Les données viennent de votre profil et de l&apos;offre. Aucune information n&apos;est inventée.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
