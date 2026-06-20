"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Loader2, Plus, FileText,
  Target, Building2, Globe, Trash2,
} from "lucide-react";
import { getInterviews, deleteInterview, generateInterviewPreparation } from "@/lib/actions/interview";
import { getOpportunities } from "@/lib/actions/opportunity";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface InterviewItem {
  id: string; opportunityId: string; preparation: string; status: string; createdAt: string; type: string | null;
  opportunity: { id: string; title: string; company: string; country: string | null; score: number | null; } | null;
}
interface OppItem { id: string; title: string; company: string; country: string | null; rawText: string; score: number | null; }

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: "Brouillon", color: "var(--texte-tertiaire)", bg: "rgba(156,163,175,0.1)" },
  pret: { label: "Prêt", color: "var(--succes)", bg: "rgba(74,222,128,0.1)" },
  utilise: { label: "Utilisé", color: "var(--info)", bg: "rgba(59,130,246,0.1)" },
};

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [opps, setOpps] = useState<OppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGen, setShowGen] = useState(false);
  const [selOpp, setSelOpp] = useState("");
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const [ivs, ops] = await Promise.all([getInterviews(), getOpportunities()]);
    setInterviews(ivs as unknown as InterviewItem[]);
    setOpps(ops as unknown as OppItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (!selOpp) return;
    setGenerating(true);
    try {
      const result = await generateInterviewPreparation(selOpp);
      router.push(`/entretiens/${result.id}`);
    } catch { setGenerating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette préparation ?")) return;
    await deleteInterview(id);
    await load();
  };

  const handleAISuggestion = (_target: string, _item: SuggestionItem) => {
    alert(`Suggestion : ${_item.name} — ${_item.reason}`);
  };

  return (
    <>
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Entretiens</h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {interviews.length} préparation{interviews.length !== 1 ? "s" : ""} d&apos;entretien
          </p>
        </div>
        <button onClick={() => setShowGen(!showGen)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
          style={{ borderColor: "var(--or)", color: "var(--or)" }}>
          <Plus size={14} /> Nouvelle préparation
        </button>
      </div>

      {/* Générateur */}
      {showGen && (
        <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
          <h3 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Générer une préparation d&apos;entretien</h3>
          <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            Sélectionnez une opportunité du pipeline pour générer une préparation complète (24 sections) basée sur votre profil, CV maître, Proof Vault et l&apos;analyse de l&apos;offre.
          </p>
          <select value={selOpp} onChange={e => setSelOpp(e.target.value)} className="input-elton text-xs w-full">
            <option value="">Choisir une opportunité...</option>
            {opps.filter(o => o.rawText).map(o => (
              <option key={o.id} value={o.id}>{o.title} — {o.company} ({o.country || "?"})</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={!selOpp || generating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md"
              style={{ background: selOpp ? "var(--or)" : "var(--fond-eleve)", color: selOpp ? "var(--fond)" : "var(--texte-tertiaire)" }}>
              {generating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              Générer (template local)
            </button>
            <button onClick={() => setShowGen(false)}
              className="px-4 py-2 text-xs font-mono rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      ) : interviews.length === 0 ? (
        <div className="p-12 text-center rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", borderStyle: "dashed" }}>
          <Target size={32} className="mx-auto mb-3 opacity-20" style={{ color: "var(--or)" }} />
          <p className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Aucune préparation d&apos;entretien</p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Générez une préparation depuis une opportunité du pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {interviews.map((iv: InterviewItem) => {
            const opp = iv.opportunity;
            const st = STATUS_LABELS[iv.status] || STATUS_LABELS.brouillon;
            return (
              <div key={iv.id}
                className="p-4 rounded-lg border cursor-pointer transition-colors space-y-2"
                style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}
                onClick={() => router.push(`/entretiens/${iv.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                      {iv.type === "entretien" ? "Entretien" : iv.type === "call_rh" ? "Call RH" : iv.type === "test_technique" ? "Test technique" : "Final"}
                    </span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(iv.id); }}
                      className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="font-bold text-sm" style={{ color: "var(--texte)" }}>{opp?.title || "Sans opportunité"}</div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                  <Building2 size={10} /> {opp?.company}
                  {opp?.country && <span className="flex items-center gap-0.5"><Globe size={9} /> {opp.country}</span>}
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  <Calendar size={10} />
                  <span>{new Date(iv.createdAt).toLocaleDateString("fr-FR")}</span>
                  {iv.preparation && <span className="flex items-center gap-0.5"><FileText size={10} /> 24 sections</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
      <AIAssistant onApply={handleAISuggestion} />
    </>
  );
}
