"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, MapPin, Globe, Calendar, ExternalLink,
  Star, FileText, Copy, Loader2, AlertTriangle,
  CheckCircle2, Trash2, Link, Package,
  Briefcase, Banknote, Target, Zap, Shield, Gauge,
} from "lucide-react";
import { getOpportunity, updateOpportunity, deleteOpportunity } from "@/lib/actions/opportunity";
import { analyzeJobOffer } from "@/lib/actions/analysis";
import { generateDocument } from "@/lib/actions/document";
import type { DocumentType } from "@/lib/generation/templates";
import { addToPipeline } from "@/lib/actions/pipeline";
import { exportCandidatureDossier } from "@/lib/actions/export-documents";

const STATUS_OPTIONS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "analyse", label: "À analyser" },
  { value: "postule", label: "Postulé" },
  { value: "relance", label: "Relance" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre reçue" },
  { value: "refus", label: "Refus" },
  { value: "archive", label: "Archivé" },
];

interface OppDetail {
  id: string; title: string; company: string; location: string | null; country: string | null;
  sourceUrl: string | null; sourceName: string | null; contractType: string | null;
  remote: string | null; salaryMin: number | null; salaryMax: number | null; salaryCurrency: string;
  rawText: string; status: string; priority: number; notes: string | null; createdAt: string;
  analysis: { id: string; scoreGlobal: number | null; keywordsAts: string; exigences: string; risks: string; gaps: string; pointsForts: string; aiModel: string | null; analysedAt: string; } | null;
  pipelineTask: { column: string; nextStep: string | null; nextStepDate: string | null; recruiterName: string | null; recruiterEmail: string | null; recruiterLinkedin: string | null; recruiterTitle: string | null; cabinetName: string | null; } | null;
  documents: { id: string; type: string; validatedAt: string | null; }[];
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<OppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [exportingDossier, setExportingDossier] = useState(false);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getOpportunity(id);
    setOpp(data as OppDetail | null);
    setEditNotes(data?.notes || "");
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

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

  const handleExportDossier = async () => {
    setExportingDossier(true);
    const r = await exportCandidatureDossier(id);
    setExportingDossier(false);
    if (!r.success) { notify("err", r.error); return; }
    triggerBase64Download(r.filename, r.base64, "application/zip");
    notify("ok", `Dossier téléchargé : ${r.filename}`);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeJobOffer(id, false);
    setAnalyzing(false);
    if (result.success) {
      notify("ok", `Analyse terminée — Score: ${result.analysis?.score.globalScore}/100`);
      await load();
    } else {
      notify("err", result.error || "Erreur d'analyse");
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    notify("ok", "Copié !");
  };

  const handleStatusChange = async (status: string) => {
    if (!opp) return;
    setSaving(true);
    await updateOpportunity(id, { status });
    setOpp({ ...opp, status } as OppDetail);
    setSaving(false);
    notify("ok", "Statut mis à jour");
  };

  const handlePriorityToggle = async () => {
    if (!opp) return;
    const newP = opp.priority === 1 ? 0 : 1;
    await updateOpportunity(id, { priority: newP });
    setOpp({ ...opp, priority: newP } as OppDetail);
  };

  const handleSaveNotes = async () => {
    if (!opp) return;
    setSaving(true);
    try {
      await updateOpportunity(id, { notes: editNotes });
      setOpp({ ...opp, notes: editNotes } as OppDetail);
      setShowNotes(false);
      notify("ok", "Notes sauvegardées");
    } catch { notify("err", "Erreur"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement cette opportunité ?")) return;
    await deleteOpportunity(id);
    router.push("/opportunites");
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="p-12 text-center" style={{ color: "var(--texte-tertiaire)" }}>
        <p className="text-sm font-mono">Opportunité introuvable</p>
        <button onClick={() => router.push("/opportunites")}
          className="mt-4 text-xs font-mono underline" style={{ color: "var(--or)" }}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Bandeau navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/opportunites")}
          className="flex items-center gap-2 text-xs font-mono transition-colors"
          style={{ color: "var(--texte-tertiaire)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--or)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--texte-tertiaire)"; }}>
          <ArrowLeft size={14} /> Retour aux opportunités
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handlePriorityToggle}
            className="p-2 rounded-md border transition-colors"
            style={{ borderColor: opp.priority === 1 ? "var(--or)" : "var(--bordure)", color: opp.priority === 1 ? "var(--or)" : "var(--texte-tertiaire)" }}
            title={opp.priority === 1 ? "Retirer priorité" : "Marquer prioritaire"}>
            <Star size={15} fill={opp.priority === 1 ? "currentColor" : "none"} />
          </button>
          <button onClick={handleDelete}
            className="p-2 rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--erreur)" }}
            title="Supprimer">
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

      {/* En-tête opportunité */}
      <div className="p-6 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: opp.priority === 1 ? "rgba(198,166,78,0.4)" : "var(--bordure)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{opp.title}</h1>
            <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: "var(--texte-secondaire)" }}>
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {opp.company}</span>
              {opp.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {opp.location}</span>}
              {opp.country && <span className="flex items-center gap-1.5"><Globe size={14} /> {opp.country}</span>}
            </div>
          </div>
          {/* Status selector */}
          <div className="flex flex-col items-end gap-2">
            <select value={opp.status} onChange={e => handleStatusChange(e.target.value)}
              className="input-elton text-xs w-36">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {saving && <Loader2 size={12} className="animate-spin" style={{ color: "var(--or)" }} />}
          </div>
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-2">
          {opp.contractType && (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
              <Briefcase size={11} /> {opp.contractType}
            </span>
          )}
          {opp.remote && opp.remote !== "tous" && (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
              <Globe size={11} /> {opp.remote}
            </span>
          )}
          {opp.salaryMin || opp.salaryMax ? (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-secondaire)", border: "1px solid var(--bordure-douce)" }}>
              <Banknote size={11} /> {opp.salaryMin && `${opp.salaryMin / 1000}k`}
              {opp.salaryMin && opp.salaryMax ? " - " : ""}
              {opp.salaryMax && `${opp.salaryMax / 1000}k`} {opp.salaryCurrency}
            </span>
          ) : null}
          {opp.sourceUrl && (
            <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full transition-colors"
              style={{ background: "var(--fond)", color: "var(--info)", border: "1px solid var(--bordure-douce)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--info)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure-douce)"; }}>
              <ExternalLink size={11} /> Voir l&apos;offre originale
            </a>
          )}
          {opp.sourceName && (
            <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "var(--fond)", color: "var(--texte-tertiaire)", border: "1px solid var(--bordure-douce)" }}>
              <Link size={11} /> via {opp.sourceName}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: "var(--fond)", color: "var(--texte-tertiaire)", border: "1px solid var(--bordure-douce)" }}>
            <Calendar size={11} /> {new Date(opp.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Colonne gauche — contenu */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description / texte brut */}
          {opp.rawText && (
            <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                  Description de l&apos;offre
                </h3>
                <button onClick={() => copyText(opp.rawText)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border"
                  style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                  <Copy size={11} /> Copier
                </button>
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans"
                style={{ color: "var(--texte-secondaire)", maxHeight: 600, overflowY: "auto" }}>
                {opp.rawText.slice(0, 15000)}
                {opp.rawText.length > 15000 && (
                  <span style={{ color: "var(--or)" }}>... (tronqué à 15000 caractères)</span>
                )}
              </pre>
            </div>
          )}

          {/* Analyse (si existe) */}
          {opp.analysis && (
            <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                  Analyse de l&apos;offre
                </h3>
                <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                  {opp.analysis.aiModel || "IA"} · {new Date(opp.analysis.analysedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Score */}
              {opp.analysis.scoreGlobal !== null && (
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold" style={{ color: "var(--or)" }}>
                    {opp.analysis.scoreGlobal}%
                  </div>
                  <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                    Score de compatibilité
                  </span>
                </div>
              )}

              {/* Keywords ATS */}
              <AnalysisSection title="Mots-clés ATS" icon={<Target size={12} />} items={opp.analysis.keywordsAts} />
              {/* Exigences */}
              <AnalysisSection title="Exigences" icon={<Zap size={12} />} items={opp.analysis.exigences} />
              {/* Points forts */}
              <AnalysisSection title="Points forts" icon={<Shield size={12} />} items={opp.analysis.pointsForts} color="var(--succes)" />
              {/* Gaps */}
              <AnalysisSection title="Compétences à développer" icon={<Gauge size={12} />} items={opp.analysis.gaps} color="var(--warning)" />
              {/* Risques */}
              <AnalysisSection title="Points de vigilance" icon={<AlertTriangle size={12} />} items={opp.analysis.risks} color="var(--erreur)" />
            </div>
          )}

          {!opp.analysis && (
            <div className="p-8 rounded-lg border text-center space-y-3"
              style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", borderStyle: "dashed" }}>
              <Target size={24} className="mx-auto opacity-30" style={{ color: "var(--or)" }} />
              <p className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                Pas encore d&apos;analyse pour cette offre
              </p>
              <button onClick={handleAnalyze} disabled={analyzing || !opp.rawText}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
                style={{
                  borderColor: opp.rawText ? "var(--or)" : "var(--bordure)",
                  color: opp.rawText ? "var(--or)" : "var(--texte-tertiaire)",
                  opacity: analyzing ? 0.6 : 1,
                }}>
                {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                {analyzing ? "Analyse en cours..." : opp.rawText ? "Analyser l'offre" : "Ajoutez le texte de l'offre pour analyser"}
              </button>
            </div>
          )}
        </div>

        {/* Colonne droite — actions / meta */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
              Actions
            </h3>
            <button onClick={() => copyText(opp.rawText || "")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; e.currentTarget.style.color = "var(--or)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; e.currentTarget.style.color = "var(--texte-secondaire)"; }}>
              <Copy size={13} /> Copier la description
            </button>
            <PrepareApplicationButton opp={opp} router={router} />
            <button onClick={handleExportDossier} disabled={exportingDossier}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--or-faible)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              {exportingDossier ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
              Exporter dossier candidature (.zip)
            </button>
            {opp.sourceUrl && (
              <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
                style={{ borderColor: "var(--bordure)", color: "var(--info)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--info)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
                <ExternalLink size={13} /> Ouvrir l&apos;offre originale
              </a>
            )}
          </div>

          {/* Notes */}
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
                Notes
              </h3>
              <button onClick={() => { setEditNotes(opp.notes || ""); setShowNotes(!showNotes); }}
                className="text-xs font-mono" style={{ color: "var(--or)" }}>
                {showNotes ? "Annuler" : opp.notes ? "Modifier" : "Ajouter"}
              </button>
            </div>
            {showNotes ? (
              <div className="space-y-2">
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  rows={4} className="input-elton text-xs"
                  placeholder="Notes personnelles sur cette offre..." />
                <button onClick={handleSaveNotes}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-md"
                  style={{ background: "var(--or)", color: "var(--fond)" }}>
                  Sauvegarder
                </button>
              </div>
            ) : opp.notes ? (
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texte-secondaire)" }}>
                {opp.notes}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                Aucune note
              </p>
            )}
          </div>

          {/* Pipeline info */}
          <PipelineSection opp={opp} router={router} />

          {/* Documents liés */}
          {opp.documents?.length > 0 && (
            <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
                Documents ({opp.documents.length})
              </h3>
              <div className="space-y-1">
                {opp.documents.map((doc: OppDetail["documents"][number]) => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                    <FileText size={11} style={{ color: "var(--texte-tertiaire)" }} />
                    <span className="font-mono">{doc.type}</span>
                    {doc.validatedAt && <CheckCircle2 size={10} style={{ color: "var(--succes)" }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Bouton Préparer candidature ─── */
function PrepareApplicationButton({ opp, router }: { opp: OppDetail; router: ReturnType<typeof useRouter> }) {
  const [showTypes, setShowTypes] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("cv_fr");
  const [generating, setGenerating] = useState(false);

  const hasRawText = !!opp.rawText;

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateDocument(opp.id, docType, false);
    setGenerating(false);
    if (result.success && result.document) {
      router.push(`/documents/${result.document.id}`);
    }
  };

  if (!showTypes) {
    return (
      <button onClick={() => hasRawText ? setShowTypes(true) : null}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-md border transition-colors"
        style={{
          borderColor: hasRawText ? "var(--or)" : "var(--bordure)",
          color: hasRawText ? "var(--or)" : "var(--texte-tertiaire)",
          opacity: hasRawText ? 1 : 0.5,
          cursor: hasRawText ? "pointer" : "not-allowed",
        }}>
        <FileText size={13} /> {hasRawText ? "Préparer candidature" : "Ajoutez le texte de l'offre"}
      </button>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-md border" style={{ borderColor: "var(--or)", background: "var(--fond)" }}>
      <select value={docType} onChange={e => setDocType(e.target.value as DocumentType)}
        className="input-elton text-xs w-full">
        <option value="cv_fr">CV adapté — Français</option>
        <option value="cv_en">CV adapted — English</option>
        <option value="lettre_fr">Lettre de motivation — Français</option>
        <option value="lettre_en">Cover letter — English</option>
        <option value="email_fr">Email candidature — Français</option>
        <option value="email_en">Application email — English</option>
        <option value="linkedin_fr">Message LinkedIn — Français</option>
        <option value="linkedin_en">LinkedIn message — English</option>
        <option value="ats_reponse">Réponses ATS</option>
      </select>
      <div className="flex gap-2">
        <button onClick={handleGenerate} disabled={generating}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md"
          style={{ background: "var(--or)", color: "var(--fond)" }}>
          {generating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
          Générer
        </button>
        <button onClick={() => setShowTypes(false)}
          className="px-3 py-1.5 text-xs font-mono rounded-md border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

/* ─── Section Pipeline ─── */
function PipelineSection({ opp, router }: { opp: OppDetail; router: ReturnType<typeof useRouter> }) {
  const [adding, setAdding] = useState(false);

  const handleAddToPipeline = async () => {
    setAdding(true);
    try {
      await addToPipeline(opp.id);
      // Recharger la page
      window.location.reload();
    } catch {
      setAdding(false);
    }
  };

  if (opp.pipelineTask) {
    const pt = opp.pipelineTask;
    return (
      <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
            Pipeline
          </h3>
          <button onClick={() => router.push("/pipeline")}
            className="text-xs font-mono underline" style={{ color: "var(--or)" }}>
            Voir le Kanban →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
            {pt.column}
          </span>
          {pt.nextStep && (
            <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
              → {pt.nextStep}
              {pt.nextStepDate ? ` (${new Date(pt.nextStepDate).toLocaleDateString("fr-FR")})` : ""}
            </span>
          )}
        </div>
        {(pt.recruiterName || pt.recruiterEmail || pt.recruiterLinkedin) && (
          <div className="space-y-1 pt-1 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
            <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Contact recruteur</span>
            {pt.recruiterName && <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{pt.recruiterName}{pt.recruiterTitle ? ` — ${pt.recruiterTitle}` : ""}</p>}
            {pt.recruiterEmail && <p className="text-xs font-mono" style={{ color: "var(--info)" }}>{pt.recruiterEmail}</p>}
            {pt.recruiterLinkedin && <p className="text-xs font-mono" style={{ color: "var(--info)" }}>{pt.recruiterLinkedin}</p>}
            {pt.cabinetName && <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Cabinet: {pt.cabinetName}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border space-y-2" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
      <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
        Pipeline
      </h3>
      <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
        Cette opportunité n&apos;est pas encore dans le pipeline.
      </p>
      <button onClick={handleAddToPipeline} disabled={adding}
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
        style={{ borderColor: "var(--or)", color: "var(--or)" }}>
        {adding ? <Loader2 size={12} className="animate-spin" /> : null}
        Ajouter au pipeline
      </button>
    </div>
  );
}

/* ─── Section Analyse ─── */
function AnalysisSection({ title, icon, items, color }: {
  title: string; icon: React.ReactNode; items: string; color?: string;
}) {
  let parsed: string[] = [];
  try { parsed = JSON.parse(items || "[]"); } catch { parsed = []; }
  if (!parsed.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: color || "var(--texte-secondaire)" }}>{icon}</span>
        <span className="text-xs font-mono uppercase" style={{ color: color || "var(--texte-secondaire)" }}>
          {title} ({parsed.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {parsed.map((item, i) => (
          <span key={i} className="text-xs font-mono px-2 py-1 rounded"
            style={{ background: `${color || "var(--texte-secondaire)"}15`, color: color || "var(--texte-secondaire)" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
