"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, Copy,
  Shield, Edit3, Trash2, History, XCircle, AlertTriangle,
  Globe, Building2, Target, FileWarning, Send, TrendingUp,
  Download, FileText, FileDown, ScrollText,
  Sparkles, GitCompare, ChevronDown,
} from "lucide-react";
import {
  getDocument, updateDocumentContent, approveDocument, rejectDocument, deleteDocument,
  improveDocumentWithIA, compareDocumentVersions,
} from "@/lib/actions/document";
import type { HallucinationAlert } from "@/lib/ai/anti-hallucination";
import { EXECUTIVE_STYLES } from "@/lib/ai/styles";
import { addToPipeline, updatePipelineColumn } from "@/lib/actions/pipeline";
import { generateRelance } from "@/lib/actions/relance";
import {
  exportTxt, exportAtsTxt, exportPrintHtml, exportDocx,
} from "@/lib/actions/export-documents";

const DOC_TYPE_LABELS: Record<string, string> = {
  cv_fr: "CV adapté — Français", cv_en: "CV adapted — English",
  lettre_fr: "Lettre de motivation — Français", lettre_en: "Cover letter — English",
  email_fr: "Email de candidature — Français", email_en: "Application email — English",
  linkedin_fr: "Message LinkedIn — Français", linkedin_en: "LinkedIn message — English",
  ats_reponse: "Réponses ATS",
};

const SOURCE_COLORS: Record<string, string> = {
  ai_suggestion: "rgba(59,130,246,0.15)", cv_master: "rgba(198,166,78,0.15)",
  proof_vault: "rgba(74,222,128,0.15)", manual: "rgba(156,163,175,0.10)",
};

const SOURCE_LABELS: Record<string, string> = {
  ai_suggestion: "IA", cv_master: "Template", proof_vault: "Proof Vault", manual: "Manuel",
};

interface DocDetail {
  id: string; type: string; content: string; status: string; version: number; createdAt: string; validatedAt: string | null; exportedAt: string | null;
  opportunity: { id: string; title: string; company: string; country: string | null; score: number | null; pipelineTask: { id: string; column: string; nextStep: string | null; nextStepDate: string | null; } | null; } | null;
  changeLogs: ChangeLogEntry[];
  alerts: HallucinationAlert[] | null;
  sources: Record<string, string> | null;
}

interface ChangeLogEntry {
  id: string; section: string | null; field: string; oldValue: string | null; newValue: string; reason: string | null; source: string; risque: string | null; statut: string; createdAt: string;
}

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  DRAFT: { label: "Brouillon", color: "var(--texte-tertiaire)", bg: "rgba(156,163,175,0.1)", icon: Clock },
  NEEDS_REVIEW: { label: "À vérifier", color: "var(--avertissement)", bg: "rgba(234,179,8,0.1)", icon: AlertTriangle },
  APPROVED: { label: "Approuvé", color: "var(--succes)", bg: "rgba(74,222,128,0.1)", icon: CheckCircle2 },
  REJECTED: { label: "Refusé", color: "var(--erreur)", bg: "rgba(239,68,68,0.1)", icon: XCircle },
};

import { resolveTemplate, resolveAccent, TEMPLATE_LABELS, type CvTemplateId } from "@/components/cv-templates/cv-template-types";
import CvTemplateRenderer from "@/components/cv-templates/CvTemplateRenderer";

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<"editor" | "preview" | "changelog" | "source">("editor");
  const [exporting, setExporting] = useState<string | null>(null); // format en cours d'export
  const [improvingAI, setImprovingAI] = useState(false);
  const [comparingAI, setComparingAI] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareResult, setCompareResult] = useState<{
    versionLocale: string; versionIA: string; differences: string;
  } | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("humain");
  const [iaAlerts, setIaAlerts] = useState<Array<{ type: string; reason: string; excerpt: string }>>([]);
  const [showStylePicker, setShowStylePicker] = useState(false);

  // Preview CV state
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>("premium_leadership");
  const [isCvAdaptedMode, setIsCvAdaptedMode] = useState(true);
  const [cvRenderData, setCvRenderData] = useState<any>(null);
  const [baseCvRenderData, setBaseCvRenderData] = useState<any>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getDocument(id);
    setDoc(data as DocDetail | null);
    setContent(data?.content || "");

    if (data && data.type.startsWith("cv")) {
      try {
        const [profRes, draftRes] = await Promise.all([
          fetch("/api/profile"),
          fetch(`/api/application-drafts/${data.opportunityId}`),
        ]);
        const prof = (await profRes.json()).profile;
        const draft = (await draftRes.json()).draft;
        const profileId = prof?.id;

        let experiences: any[] = [];
        let skills: any[] = [];

        if (profileId) {
          try {
            const [expRes, skillRes] = await Promise.all([
              fetch(`/api/experiences?profileId=${profileId}`).catch(() => null),
              fetch(`/api/skills?profileId=${profileId}`).catch(() => null),
            ]);
            if (expRes?.ok) experiences = await expRes.json();
            if (skillRes?.ok) skills = await skillRes.json();
          } catch { /* ignore */ }
        }

        const { buildCvRenderData } = await import("@/lib/cv-render/build-data");
        const baseRendered = buildCvRenderData({
          profile: prof,
          experiences: experiences.length > 0 ? experiences : undefined,
          skills: skills.length > 0 ? skills : undefined,
          targetJob: draft?.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
        });

        let adaptedRendered: any = null;
        if (draft?.tailoredResumeContent) {
          try {
            const parsed = JSON.parse(draft.tailoredResumeContent);
            if (parsed && parsed.identity && parsed.experiences) {
              adaptedRendered = parsed;
            }
          } catch {
            adaptedRendered = buildCvRenderData({
              profile: prof,
              generatedCvContent: draft.tailoredResumeContent,
              experiences: experiences.length > 0 ? experiences : undefined,
              skills: skills.length > 0 ? skills : undefined,
              targetJob: draft?.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
            });
          }
        }

        const tplToUse = resolveTemplate(prof?.cvDefaultTemplate) || "ats_classic";
        setSelectedTemplate(tplToUse);

        baseRendered.template = tplToUse;
        if (adaptedRendered) {
          adaptedRendered.template = tplToUse;
          adaptedRendered.options = {
            ...baseRendered.options,
            ...(adaptedRendered.options || {}),
          };
        }

        setBaseCvRenderData(baseRendered);
        setCvRenderData(adaptedRendered || baseRendered);
      } catch (err) {
        console.error("Failed to build CV render data:", err);
      }
    }

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocumentContent(id, content);
      notify("ok", "Document sauvegardé — statut : À vérifier");
      setEditing(false);
      await load();
    } catch { notify("err", "Erreur de sauvegarde"); }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (editing) { notify("err", "Sauvegardez d'abord vos modifications"); return; }
    await approveDocument(id);
    notify("ok", "Document approuvé — prêt pour export");
    await load();
  };

  const handleReject = async () => {
    if (editing) { notify("err", "Sauvegardez d'abord vos modifications"); return; }
    await rejectDocument(id);
    notify("ok", "Document refusé — corrections nécessaires");
    await load();
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement ce document ?")) return;
    await deleteDocument(id);
    router.push("/documents");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content as string);
    notify("ok", "Contenu copié dans le presse-papier");
  };

  const triggerDownload = (filename: string, content: string, mimeType = "text/plain") => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerBase64Download = (filename: string, base64: string, mimeType: string) => {
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    // Open print-cv directly for pixel-perfect React rendering
    window.open(`/documents/${id}/print-cv?template=${selectedTemplate}`, "_blank");
    notify("ok", "Aperçu avant impression ouvert — enregistrez sous format PDF");
  };

  const handleExportDocx = async () => {
    setExporting("docx");
    const r = await exportDocx(id);
    setExporting(null);
    if (!r.success) { notify("err", r.error); return; }
    triggerBase64Download(r.filename, r.base64, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    notify("ok", `DOCX téléchargé : ${r.filename}`);
  };

  const handleExportTxt = async () => {
    setExporting("txt");
    const r = await exportTxt(id);
    setExporting(null);
    if (!r.success) { notify("err", r.error); return; }
    triggerDownload(r.filename, r.content);
    notify("ok", `TXT téléchargé : ${r.filename}`);
  };

  const handleExportAts = async () => {
    setExporting("ats");
    const r = await exportAtsTxt(id);
    setExporting(null);
    if (!r.success) { notify("err", r.error); return; }
    triggerDownload(r.filename, r.content);
    notify("ok", `ATS TXT téléchargé : ${r.filename}`);
  };

  const handleCopyAts = async () => {
    setExporting("ats");
    const r = await exportAtsTxt(id);
    setExporting(null);
    if (!r.success) { notify("err", r.error); return; }
    navigator.clipboard.writeText(r.content);
    notify("ok", "Texte ATS copié — prêt à coller dans un formulaire");
  };

  const handleImproveWithAI = async () => {
    setImprovingAI(true);
    setIaAlerts([]);
    try {
      const result = await improveDocumentWithIA({ documentId: id, styleId: selectedStyle });
      if (result.success) {
        setContent(result.content);
        setIaAlerts(result.alerts || []);
        notify("ok", `Document amélioré avec IA (style: ${EXECUTIVE_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle}) — statut : À vérifier`);
        await load();
      } else {
        notify("err", result.error || "Échec de l'amélioration IA");
      }
    } catch { notify("err", "Erreur de connexion IA"); }
    setImprovingAI(false);
  };

  const handleCompareVersions = async () => {
    setComparingAI(true);
    setCompareResult(null);
    try {
      const result = await compareDocumentVersions({ documentId: id, styleId: selectedStyle });
      if (result.success) {
        setCompareResult(result);
        setShowCompare(true);
      } else {
        notify("err", result.error || "Échec de la comparaison");
      }
    } catch { notify("err", "Erreur de connexion IA"); }
    setComparingAI(false);
  };

  const currentStyle = EXECUTIVE_STYLES.find(s => s.id === selectedStyle);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
        <p className="text-sm font-mono">Document introuvable</p>
        <button onClick={() => router.push("/documents")}
          className="mt-4 text-xs font-mono underline" style={{ color: "var(--or)" }}>
          Retour aux documents
        </button>
      </div>
    );
  }

  const statusKey = doc.status || "DRAFT";
  const statusInfo = STATUT_LABELS[statusKey] || STATUT_LABELS.DRAFT;
  const StatusIcon = statusInfo.icon;
  const isApproved = statusKey === "APPROVED";
  const isRejected = statusKey === "REJECTED";
  const canValidate = !isApproved && !editing;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Bandeau navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/documents")}
            className="flex items-center gap-2 text-xs font-mono transition-colors"
            style={{ color: "var(--texte-tertiaire)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--or)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--texte-tertiaire)"; }}>
            <ArrowLeft size={14} /> Documents
          </button>
          <span className="text-xs font-mono" style={{ color: "var(--bordure)" }}>|</span>
          <span className="text-sm font-mono" style={{ color: "var(--texte)" }}>
            {DOC_TYPE_LABELS[doc.type] || doc.type}
            {doc.version > 1 && ` v${doc.version}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md"
            style={{ background: statusInfo.bg, color: statusInfo.color }}>
            <StatusIcon size={12} /> {statusInfo.label}
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

      {/* Bandeau export bloqué si non APPROVED */}
      {!isApproved && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-mono"
          style={{ background: "rgba(234,179,8,0.05)", borderColor: "rgba(234,179,8,0.2)", color: "var(--avertissement)" }}>
          <FileWarning size={13} />
          Export bloqué — le document doit être approuvé. Statut actuel : {statusInfo.label}.
        </div>
      )}

      {/* Alerts hallucination */}
      {doc.alerts && doc.alerts.length > 0 && (
        <div className="p-3 rounded-md border space-y-1"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          {doc.alerts.map((a: HallucinationAlert, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs font-mono"
              style={{ color: a.severity === "critical" ? "var(--erreur)" : "var(--avertissement)" }}>
              <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
              <span>[{a.type}] {a.reason} — <em>{a.excerpt}</em></span>
            </div>
          ))}
        </div>
      )}

      {/* Méta opportunité */}
      {doc.opportunity && (
        <div className="flex items-center gap-4 text-xs font-mono"
          style={{ color: "var(--texte-tertiaire)" }}>
          <span className="flex items-center gap-1.5">
            <Building2 size={11} /> {doc.opportunity.title} — {doc.opportunity.company}
          </span>
          {doc.opportunity.country && (
            <span className="flex items-center gap-1.5">
              <Globe size={11} /> {doc.opportunity.country}
            </span>
          )}
          {doc.opportunity.score && (
            <span className="flex items-center gap-1.5" style={{ color: "var(--or)" }}>
              <Target size={11} /> Score {doc.opportunity.score}/100
            </span>
          )}
        </div>
      )}

      {/* Pipeline */}
      <PipelineBlock doc={doc} isApproved={isApproved} router={router} onRefresh={load} />

      {/* Actions */}
      <div className="flex items-center justify-between p-3 rounded-lg border"
        style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            {editing ? <Shield size={12} /> : <Edit3 size={12} />}
            {editing ? "Verrouiller" : "Modifier"}
          </button>

          {editing && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
              style={{ background: "var(--or)", color: "var(--fond)" }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Sauvegarder
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            <Copy size={12} /> Copier
          </button>

          {canValidate && !isRejected && (
            <button onClick={handleApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
              style={{ background: "var(--succes)", color: "var(--fond)" }}>
              <CheckCircle2 size={12} /> Approuver
            </button>
          )}

          {canValidate && (
            <button onClick={handleReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
              style={{ background: "var(--erreur)", color: "var(--fond)" }}>
              <XCircle size={12} /> Refuser
            </button>
          )}

        </div>
      </div>

      {/* ─── IA Premium ─── */}
      <div className="p-4 rounded-lg border space-y-3"
        style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--or)" }} />
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte)" }}>
            Amélioration IA Premium
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "rgba(99,102,241,0.1)", color: "var(--info)" }}>
            DeepSeek
          </span>
        </div>

        <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
          L&apos;IA améliore le style et la structure sans modifier les faits. Le document reste en &quot;À vérifier&quot; — validation humaine obligatoire.
        </p>

        {/* Style selector */}
        <div className="relative">
          <button onClick={() => setShowStylePicker(!showStylePicker)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border w-full text-left"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", background: "var(--fond)" }}>
            <span style={{ color: "var(--or)" }}>
              {currentStyle?.label || "Style"}
            </span>
            <span className="flex-1 text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
              {currentStyle?.description}
            </span>
            <ChevronDown size={12} style={{ transform: showStylePicker ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {showStylePicker && (
            <div className="absolute z-10 top-full mt-1 left-0 right-0 rounded-md border shadow-lg max-h-56 overflow-y-auto"
              style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              {EXECUTIVE_STYLES.map(style => (
                <button key={style.id}
                  onClick={() => { setSelectedStyle(style.id); setShowStylePicker(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:opacity-80 transition-opacity"
                  style={{
                    background: selectedStyle === style.id ? "var(--or-faible)" : "transparent",
                    color: selectedStyle === style.id ? "var(--or)" : "var(--texte-secondaire)",
                  }}>
                  <div className="font-mono">{style.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2">
          <button onClick={handleImproveWithAI} disabled={improvingAI || comparingAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--or-faible)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {improvingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Améliorer avec IA
          </button>

          <button onClick={handleCompareVersions} disabled={improvingAI || comparingAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
            style={{ borderColor: "var(--info)", color: "var(--info)", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {comparingAI ? <Loader2 size={12} className="animate-spin" /> : <GitCompare size={12} />}
            Comparer local vs IA
          </button>
        </div>

        {/* IA alerts */}
        {iaAlerts.length > 0 && (
          <div className="p-3 rounded-md border space-y-1"
            style={{ background: "rgba(234,179,8,0.05)", borderColor: "rgba(234,179,8,0.2)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={11} style={{ color: "var(--avertissement)" }} />
              <span className="text-[10px] font-mono uppercase" style={{ color: "var(--avertissement)" }}>
                Alertes anti-hallucination ({iaAlerts.length})
              </span>
            </div>
            {iaAlerts.map((a, i) => (
              <div key={i} className="text-[10px] font-mono" style={{ color: "var(--avertissement)" }}>
                [{a.type}] {a.reason} — <em>{a.excerpt}</em>
              </div>
            ))}
          </div>
        )}

        {/* Comparison view */}
        {showCompare && compareResult && (
          <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--bordure)" }}>
            <div className="flex items-center gap-2">
              <GitCompare size={13} style={{ color: "var(--info)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--texte)" }}>Comparaison local vs IA</span>
              <button onClick={() => setShowCompare(false)}
                className="text-[10px] font-mono underline" style={{ color: "var(--texte-tertiaire)" }}>
                Fermer
              </button>
            </div>
            <div className="p-2 rounded text-[10px] font-mono"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)" }}>
              {compareResult.differences.split(" | ").map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              <div className="p-2 rounded border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--texte-tertiaire)" }}>Version locale</div>
                <pre className="text-[10px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>
                  {compareResult.versionLocale.slice(0, 2000)}
                  {compareResult.versionLocale.length > 2000 && "\n\n[...]"}
                </pre>
              </div>
              <div className="p-2 rounded border" style={{ borderColor: "rgba(99,102,241,0.3)", background: "var(--fond)" }}>
                <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--info)" }}>Version IA</div>
                <pre className="text-[10px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--texte-secondaire)" }}>
                  {compareResult.versionIA.slice(0, 2000)}
                  {compareResult.versionIA.length > 2000 && "\n\n[...]"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Exports */}
      {isApproved ? (
        <div className="p-4 rounded-lg border space-y-3"
          style={{ borderColor: "rgba(74,222,128,0.3)", background: "var(--fond-surface)" }}>
          <div className="flex items-center gap-2">
            <Download size={14} style={{ color: "var(--succes)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>Exports</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(74,222,128,0.12)", color: "var(--succes)" }}>
              Document approuvé
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleExportPdf} disabled={exporting === "pdf"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--or-faible)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              {exporting === "pdf" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              PDF
            </button>
            <button onClick={handleExportDocx} disabled={exporting === "docx"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--info)", color: "var(--info)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(59,130,246,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              {exporting === "docx" ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
              DOCX
            </button>
            <button onClick={handleExportTxt} disabled={exporting === "txt"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--texte-tertiaire)", color: "var(--texte-secondaire)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              {exporting === "txt" ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              TXT
            </button>
            <button onClick={handleExportAts} disabled={exporting === "ats"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              {exporting === "ats" ? <Loader2 size={12} className="animate-spin" /> : <ScrollText size={12} />}
              ATS TXT
            </button>
            <button onClick={handleCopyAts} disabled={exporting === "ats"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <Copy size={12} />
              Copier ATS
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-md border flex items-center gap-2 text-xs"
          style={{ borderColor: "var(--avertissement)", background: "rgba(239,68,68,0.05)", color: "var(--avertissement)" }}>
          <AlertTriangle size={13} />
          <span>Export final bloqué — validez humainement le document avant export (PDF/DOCX). Export brouillon TXT autorisé.</span>
        </div>
      )}

      {/* Export brouillon si non approuvé */}
      {!isApproved && (
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportTxt} disabled={exporting === "txt"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
            style={{ borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {exporting === "txt" ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
            TXT brouillon
          </button>
          <button onClick={handleCopyAts} disabled={exporting === "ats"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
            style={{ borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--fond-eleve)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
            <Copy size={12} />
            Copier ATS
          </button>
        </div>
      )}

      {/* Onglets d'info */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--bordure)" }}>
        {(doc.type.startsWith("cv") ? ["editor", "preview", "changelog", "source"] : ["editor", "changelog", "source"]).map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider"
            style={{ color: tab === t ? "var(--or)" : "var(--texte-tertiaire)", borderBottom: tab === t ? "2px solid var(--or)" : "2px solid transparent", marginBottom: -1 }}>
            {t === "editor" ? "Contenu" : t === "preview" ? "Preview CV" : t === "changelog" ? "Historique" : "Source"}
          </button>
        ))}
      </div>

      {/* Contenu éditeur */}
      {tab === "editor" && (
        <div className="rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: editing ? "var(--or)" : "var(--bordure)" }}>
          {editing ? (
            <textarea value={content as string} onChange={e => setContent(e.target.value)}
              className="w-full p-5 text-sm leading-relaxed font-sans resize-y"
              style={{
                background: "transparent", color: "var(--texte)", border: "none", outline: "none",
                minHeight: "60vh", lineHeight: 1.8,
              }}
              placeholder="Contenu du document..." />
          ) : (
            <pre className="p-5 text-sm leading-relaxed whitespace-pre-wrap font-sans"
              style={{ color: "var(--texte)", minHeight: 200, lineHeight: 1.8 }}>
              {content as string}
            </pre>
          )}
        </div>
      )}

      {/* Preview CV Interactif */}
      {tab === "preview" && doc.type.startsWith("cv") && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-[var(--fond-surface)]" style={{ borderColor: "var(--bordure)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>Mode :</span>
              <button
                onClick={() => {
                  setIsCvAdaptedMode(!isCvAdaptedMode);
                  if (cvRenderData) {
                    setCvRenderData((prev: any) => ({ ...prev, template: selectedTemplate }));
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors bg-[var(--fond)]"
                style={{
                  color: isCvAdaptedMode ? "var(--succes)" : "var(--texte-secondaire)",
                  borderColor: isCvAdaptedMode ? "var(--succes)" : "var(--bordure)",
                }}
              >
                {isCvAdaptedMode ? "✓ CV Adapté (Tailored)" : "CV Maître (Master)"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-mono px-2" style={{ color: "var(--texte-tertiaire)" }}>Template :</span>
              {(Object.keys(TEMPLATE_LABELS) as CvTemplateId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTemplate(t);
                    if (cvRenderData) setCvRenderData((prev: any) => ({ ...prev, template: t }));
                    if (baseCvRenderData) setBaseCvRenderData((prev: any) => ({ ...prev, template: t }));
                  }}
                  className="px-2 py-1.5 rounded text-xs font-mono border transition-colors bg-[var(--fond)]"
                  style={{
                    borderColor: selectedTemplate === t ? "var(--or)" : "var(--bordure)",
                    color: selectedTemplate === t ? "var(--or)" : "var(--texte-secondaire)",
                  }}
                >
                  {TEMPLATE_LABELS[t]}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.open(`/documents/${id}/print-cv?template=${selectedTemplate}`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[var(--or)] text-[var(--fond)] border-0"
            >
              <Globe size={12} /> Imprimer / PDF
            </button>
          </div>

          <div className="p-4 rounded-lg border bg-white overflow-auto max-h-[80vh]" style={{ borderColor: "var(--bordure)" }}>
            {isCvAdaptedMode && cvRenderData ? (
              <CvTemplateRenderer data={{ ...cvRenderData, template: selectedTemplate }} />
            ) : baseCvRenderData ? (
              <CvTemplateRenderer data={{ ...baseCvRenderData, template: selectedTemplate }} />
            ) : (
              <div className="text-center p-8 text-sm text-gray-500 font-mono">Données de preview non disponibles. Veuillez générer le document de nouveau.</div>
            )}
          </div>
        </div>
      )}

      {/* ChangeLog enrichi */}
      {tab === "changelog" && (
        <div className="space-y-2">
          {doc.changeLogs?.length > 0 ? (
            doc.changeLogs.map((log: ChangeLogEntry, i: number) => (
              <div key={log.id || i} className="p-3 rounded-md border"
                style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <History size={11} style={{ color: "var(--texte-tertiaire)" }} />
                  {log.section && (
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ background: "var(--fond)", color: "var(--or)" }}>
                      {log.section}
                    </span>
                  )}
                  <span className="text-xs font-mono"
                    style={{ color: SOURCE_COLORS[log.source] ? "var(--or)" : "var(--texte-tertiaire)" }}>
                    {SOURCE_LABELS[log.source] || log.source}
                  </span>
                  {log.statut && (
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: log.statut === "accepté" ? "rgba(74,222,128,0.15)" :
                          log.statut === "refusé" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                        color: log.statut === "accepté" ? "var(--succes)" :
                          log.statut === "refusé" ? "var(--erreur)" : "var(--avertissement)",
                      }}>
                      {log.statut === "à_vérifier" ? "À vérifier" : log.statut}
                    </span>
                  )}
                  <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{log.reason}</p>
                {log.risque && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--avertissement)" }}>
                    <AlertTriangle size={10} /> Risque : {log.risque}
                  </p>
                )}
                {log.oldValue && (
                  <p className="text-xs mt-1 line-through opacity-50" style={{ color: "var(--texte-tertiaire)" }}>
                    {log.oldValue.slice(0, 200)}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center" style={{ color: "var(--texte-tertiaire)" }}>
              <History size={20} className="mx-auto mb-2 opacity-30" />
              <span className="text-xs font-mono">Aucun historique</span>
            </div>
          )}
        </div>
      )}

      {/* Source & meta */}
      {tab === "source" && (
        <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="text-xs font-mono space-y-1" style={{ color: "var(--texte-secondaire)" }}>
            <p><strong>Type :</strong> {DOC_TYPE_LABELS[doc.type] || doc.type}</p>
            <p><strong>Version :</strong> {doc.version || 1}</p>
            <p><strong>Statut :</strong> {statusInfo.label}</p>
            <p><strong>Créé le :</strong> {new Date(doc.createdAt).toLocaleString("fr-FR")}</p>
            <p><strong>Validé :</strong> {doc.validatedAt ? new Date(doc.validatedAt).toLocaleString("fr-FR") : "Non"}</p>
            <p><strong>Exporté :</strong> {doc.exportedAt ? new Date(doc.exportedAt).toLocaleString("fr-FR") : "Non"}</p>
            <p><strong>Opportunité :</strong> {doc.opportunity?.title} — {doc.opportunity?.company}</p>
          </div>

          <div className="border-t pt-3" style={{ borderColor: "var(--bordure)" }}>
            <h4 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--texte-tertiaire)" }}>Légende des sources</h4>
            <div className="space-y-1">
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_COLORS[key]?.replace("0.15", "0.4") || "var(--bordure)" }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section Pipeline ─── */
function PipelineBlock({ doc, isApproved, router, onRefresh }: {
  doc: DocDetail;
  isApproved: boolean;
  router: ReturnType<typeof useRouter>;
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [marking, setMarking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const opp = doc.opportunity;

  if (!opp) return null;

  const pt = opp.pipelineTask;

  const handleAddToPipeline = async () => {
    setAdding(true);
    try {
      await addToPipeline(opp.id);
      onRefresh();
    } catch { setAdding(false); }
  };

  const handleMarkPretAEnvoyer = async () => {
    if (!isApproved || !pt) return;
    setMarking(true);
    await updatePipelineColumn(pt.id, "pret_a_envoyer");
    onRefresh();
    setMarking(false);
  };

  const handleCreateRelance = async () => {
    setGenerating(true);
    try {
      const result = await generateRelance(opp.id, "j5_fr");
      if (result) {
        router.push(`/opportunites/${opp.id}`);
      }
    } catch {
      setGenerating(false);
    }
  };

  // Document non approuvé
  if (!isApproved) {
    return (
      <div className="p-4 rounded-lg border space-y-2"
        style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
          Pipeline
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--avertissement)" }}>
          <AlertTriangle size={12} />
          <span>Document non approuvé — impossible de marquer prêt à envoyer.</span>
        </div>
        <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
          Approuvez d&apos;abord le document pour pouvoir l&apos;utiliser dans le pipeline.
        </p>
      </div>
    );
  }

  // Document APPROVED, pas dans le pipeline
  if (!pt) {
    return (
      <div className="p-4 rounded-lg border space-y-3"
        style={{ background: "var(--fond-eleve)", borderColor: "var(--succes)", borderLeft: "3px solid var(--succes)" }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} style={{ color: "var(--succes)" }} />
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--succes)" }}>
            Document approuvé — Prêt pour le pipeline
          </h3>
        </div>
        <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
          Ce document est validé. Associez l&apos;opportunité au pipeline pour commencer le suivi.
        </p>
        <div className="flex gap-2">
          <button onClick={handleAddToPipeline} disabled={adding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            {adding ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
            Associer au pipeline
          </button>
          <button onClick={() => router.push("/dashboard/jobs/pipeline")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            Voir pipeline →
          </button>
        </div>
      </div>
    );
  }

  // Document APPROVED, dans le pipeline
  const COLUMN_LABELS: Record<string, string> = {
    nouveau: "Nouveau", a_analyser: "À analyser", analyse: "Analysé",
    a_preparer: "Candidature à préparer", document_a_valider: "Document à valider",
    pret_a_envoyer: "Prêt à envoyer", envoye: "Envoyé",
    relance_1: "Relance 1", relance_2: "Relance 2",
    entretien_rh: "Entretien RH", entretien_direction: "Entretien Direction",
    offre: "Offre", refus: "Refus", archive: "Archivé",
  };
  const columnLabel = COLUMN_LABELS[pt.column] || pt.column;

  return (
    <div className="p-4 rounded-lg border space-y-3"
      style={{ background: "var(--fond-eleve)", borderColor: "var(--succes)", borderLeft: "3px solid var(--succes)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} style={{ color: "var(--succes)" }} />
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--succes)" }}>
            Document approuvé — Pipeline actif
          </h3>
        </div>
        <button onClick={() => router.push("/dashboard/jobs/pipeline")}
          className="text-xs font-mono underline" style={{ color: "var(--or)" }}>
          Voir pipeline →
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span style={{ color: "var(--texte-tertiaire)" }}>Colonne actuelle :</span>
        <span className="font-mono px-2 py-0.5 rounded" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
          {columnLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {pt.column !== "pret_a_envoyer" && pt.column !== "envoye" && pt.column !== "relance_1" && pt.column !== "relance_2" && pt.column !== "entretien_rh" && pt.column !== "entretien_direction" && pt.column !== "offre" && (
          <button onClick={handleMarkPretAEnvoyer} disabled={marking}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
            style={{ borderColor: "var(--succes)", color: "var(--succes)" }}>
            {marking ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Marquer prêt à envoyer
          </button>
        )}

        {(pt.column === "pret_a_envoyer" || pt.column === "envoye" || pt.column === "relance_1") && (
          <button onClick={handleCreateRelance} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Créer relance J+5
          </button>
        )}

        <button onClick={() => router.push(`/opportunites/${opp.id}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
          Voir l&apos;opportunité
        </button>
      </div>

      {pt.column === "pret_a_envoyer" && (
        <p className="text-xs font-mono" style={{ color: "var(--succes)" }}>
          ✓ Prêt à envoyer — copiez le contenu du document et envoyez-le manuellement.
        </p>
      )}
    </div>
  );
}
