"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Filter, Loader2, Eye, Trash2,
  CheckCircle2, Clock, XCircle, AlertTriangle, Briefcase, Sparkles,
  MessageCircle, FileCheck,
} from "lucide-react";
import { getDocuments, deleteDocument } from "@/lib/actions/document";
import type { DocumentType } from "@/lib/generation/templates";
import { getOpportunities } from "@/lib/actions/opportunity";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface DocItem {
  id: string; type: string; status: string; version: number; createdAt: string;
  opportunity: { id: string; title: string; company: string; score: number | null } | null;
  changeLogs: { reason: string | null }[];
}
interface OppItem { id: string; title: string; company: string; score: number | null; }

const DOC_TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  cv_fr: FileText, cv_en: FileText,
  lettre_fr: FileCheck, lettre_en: FileCheck,
  email_fr: Briefcase, email_en: Briefcase,
  linkedin_fr: MessageCircle, linkedin_en: MessageCircle,
  ats_reponse: FileCheck,
};

const DOC_TYPE_LABELS: Record<string, string> = {
  cv_fr: "CV FR", cv_en: "CV EN",
  lettre_fr: "Lettre FR", lettre_en: "Cover letter EN",
  email_fr: "Email FR", email_en: "Email EN",
  linkedin_fr: "LinkedIn FR", linkedin_en: "LinkedIn EN",
  ats_reponse: "ATS",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  cv_fr: "var(--or)", cv_en: "var(--or)",
  lettre_fr: "var(--info)", lettre_en: "var(--info)",
  email_fr: "var(--succes)", email_en: "var(--succes)",
  linkedin_fr: "var(--info)", linkedin_en: "var(--info)",
  ats_reponse: "var(--avertissement)",
};

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [opportunities, setOpportunities] = useState<OppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [filterType, setFilterType] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [selOpp, setSelOpp] = useState("");
  const [selType, setSelType] = useState<DocumentType>("cv_fr");
  const [useAI, setUseAI] = useState(false);
  const [generating, setGenerating] = useState(false);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [docs, opps] = await Promise.all([
      getDocuments(filterType ? { type: filterType } : undefined),
      getOpportunities({ status: "analyse" }),
    ]);
    setDocuments(docs as unknown as DocItem[]);
    setOpportunities(opps as unknown as OppItem[]);
    setLoading(false);
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (!selOpp || !selType) return;
    setGenerating(true);
    const result = await (await import("@/lib/actions/document")).generateDocument(selOpp, selType, useAI);
    setGenerating(false);

    if (result.success && result.document) {
      notify("ok", `Document généré (${result.mode})`);
      setShowGenerator(false);
      await load();
      router.push(`/documents/${result.document.id}`);
    } else {
      notify("err", result.error || "Erreur de génération");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await deleteDocument(id);
    await load();
    notify("ok", "Document supprimé");
  };

  const typeCounts = documents.reduce((acc: Record<string, number>, d) => { acc[d.type] = (acc[d.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  const handleAISuggestion = (_target: string, _item: SuggestionItem) => {
    alert(`Suggestion : ${_item.name} — ${_item.reason}`);
  };

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Documents</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {documents.length} document{documents.length !== 1 ? "s" : ""}
            · {documents.filter(d => d.status === "APPROVED").length} approuvé{documents.filter(d => d.status === "APPROVED").length !== 1 ? "s" : ""}
            · {documents.filter(d => d.status !== "APPROVED").length} à valider
          </p>
        </div>
        <button onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
          style={{ background: "var(--or)", color: "var(--fond)", borderColor: "var(--or)" }}>
          <Plus size={14} /> Nouveau document
        </button>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* Générateur */}
      {showGenerator && (
        <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
          <h3 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
            Générer une candidature
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Opportunité</label>
              <select value={selOpp} onChange={e => setSelOpp(e.target.value)} className="input-elton">
                <option value="">Sélectionner une offre analysée...</option>
                {opportunities.map(o => (
                  <option key={o.id} value={o.id}>{o.title} — {o.company} ({o.score || "?"}/100)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-xs">Type de document</label>
              <select value={selType} onChange={e => setSelType(e.target.value as DocumentType)} className="input-elton">
                <optgroup label="CV">
                  <option value="cv_fr">CV adapté — Français</option>
                  <option value="cv_en">CV adapted — English</option>
                </optgroup>
                <optgroup label="Lettre">
                  <option value="lettre_fr">Lettre de motivation — Français</option>
                  <option value="lettre_en">Cover letter — English</option>
                </optgroup>
                <optgroup label="Email">
                  <option value="email_fr">Email de candidature — Français</option>
                  <option value="email_en">Application email — English</option>
                </optgroup>
                <optgroup label="LinkedIn">
                  <option value="linkedin_fr">Message LinkedIn — Français</option>
                  <option value="linkedin_en">LinkedIn message — English</option>
                </optgroup>
                <optgroup label="ATS">
                  <option value="ats_reponse">Réponses formulaire ATS</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-mono cursor-pointer"
              style={{ color: useAI ? "var(--or)" : "var(--texte-tertiaire)" }}>
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
                className="accent-[var(--or)]" />
              <Sparkles size={12} /> IA DeepSeek
            </label>
            <button onClick={handleGenerate} disabled={!selOpp || generating}
              className="flex items-center gap-2 px-5 py-2 text-xs font-mono rounded-md"
              style={{ background: selOpp ? "var(--or)" : "var(--bordure-douce)", color: selOpp ? "var(--fond)" : "var(--texte-tertiaire)" }}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Générer
            </button>
            <button onClick={() => setShowGenerator(false)}
              className="px-4 py-2 text-xs font-mono rounded-md border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Annuler
            </button>
          </div>
          <p className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {useAI ? "Mode IA : nécessite une clé DeepSeek configurée dans Paramètres. Fallback automatique vers template local." : "Mode template : génération locale basée sur vos données vérifiées (CV maître, Proof Vault, analyse). Zéro hallucination."}
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={12} style={{ color: "var(--texte-tertiaire)" }} />
        <button onClick={() => setFilterType("")}
          className="px-2.5 py-1 rounded-full text-xs font-mono border"
          style={{ background: !filterType ? "var(--or-faible)" : "var(--fond)", borderColor: !filterType ? "var(--or)" : "var(--bordure)", color: !filterType ? "var(--or)" : "var(--texte-secondaire)" }}>
          Tous ({documents.length})
        </button>
        {["cv_fr", "cv_en", "lettre_fr", "lettre_en", "email_fr", "email_en", "linkedin_fr", "linkedin_en", "ats_reponse"].map(t => {
          const count = typeCounts[t] || 0;
          if (!count && filterType !== t) return null;
          return (
            <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)}
              className="px-2.5 py-1 rounded-full text-xs font-mono border"
              style={{ background: filterType === t ? "var(--or-faible)" : "var(--fond)", borderColor: filterType === t ? "var(--or)" : "var(--bordure)", color: filterType === t ? "var(--or)" : "var(--texte-secondaire)" }}>
              {DOC_TYPE_LABELS[t]} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", borderStyle: "dashed" }}>
          <FileText size={28} className="mx-auto mb-3 opacity-25" style={{ color: "var(--or)" }} />
          <p className="text-sm font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            Aucun document. Générez votre première candidature.
          </p>
          <button onClick={() => setShowGenerator(true)}
            className="mt-3 text-xs font-mono underline" style={{ color: "var(--or)" }}>
            + Nouveau document
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {documents.map(doc => {
            const Icon = DOC_TYPE_ICONS[doc.type] || FileText;
            const color = DOC_TYPE_COLORS[doc.type] || "var(--texte-tertiaire)";
            const status = doc.status || "DRAFT";
            const isApproved = status === "APPROVED";

            const statusBadge = status === "APPROVED" ? (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--succes)" }}>
                <CheckCircle2 size={10} /> Approuvé
              </span>
            ) : status === "REJECTED" ? (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--erreur)" }}>
                <XCircle size={10} /> Refusé
              </span>
            ) : status === "NEEDS_REVIEW" ? (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--avertissement)" }}>
                <AlertTriangle size={10} /> À vérifier
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                <Clock size={10} /> Brouillon
              </span>
            );

            return (
              <div key={doc.id}
                className="flex items-center justify-between p-3 rounded-md border group cursor-pointer transition-colors"
                style={{ background: "var(--fond-surface)", borderColor: isApproved ? "rgba(74,222,128,0.3)" : "var(--bordure)" }}
                onClick={() => router.push(`/documents/${doc.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isApproved ? "rgba(74,222,128,0.3)" : "var(--bordure)"; }}>
                <div className="flex items-center gap-4 min-w-0">
                  <Icon size={16} style={{ color, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "var(--texte)" }}>
                        {DOC_TYPE_LABELS[doc.type] || doc.type}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${color}15`, color }}>
                        v{doc.version || 1}
                      </span>
                      {statusBadge}
                    </div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                      {doc.opportunity?.title} — {doc.opportunity?.company}
                      {doc.opportunity?.score ? ` · Score ${doc.opportunity.score}/100` : ""}
                    </div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)", opacity: 0.6 }}>
                      {doc.changeLogs?.[0]?.reason} · {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={e => e.stopPropagation()}>
                  <button onClick={() => router.push(`/documents/${doc.id}`)}
                    className="p-1.5 rounded" style={{ color: "var(--or)" }} title="Voir">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded" style={{ color: "var(--erreur)" }} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
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
