"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Copy, Shield, User, Mail, Phone, MapPin, Link2, Briefcase, FileText, MessageSquare, DollarSign, Clock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import type { AutofillFormData, AutofillField } from "@/lib/actions/autofill";

function AutofillContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const [data, setData] = useState<AutofillFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!draftId) { setLoading(false); setError("Aucun draftId fourni."); return; }
    fetch(`/api/application-drafts/${draftId}/autofill`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [draftId]);

  const copyAll = () => {
    if (!data) return;
    const text = data.fields
      .filter((f) => !f.blocked && f.value)
      .map((f) => `${f.label}: ${f.value}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

  const iconFor = (key: string) => {
    const map: Record<string, React.ReactNode> = {
      firstName: <User size={10} />, lastName: <User size={10} />, fullName: <User size={10} />,
      email: <Mail size={10} />, phone: <Phone size={10} />,
      linkedin: <Link2 size={10} />, location: <MapPin size={10} />,
      currentTitle: <Briefcase size={10} />,
      salaryExpectations: <DollarSign size={10} />,
      coverLetter: <FileText size={10} />, resumeUpload: <FileText size={10} />,
      recruiterMessage: <MessageSquare size={10} />,
      atsAnswers: <MessageSquare size={10} />,
      availability: <Clock size={10} />, yearsOfExperience: <Clock size={10} />,
    };
    return map[key] || null;
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>;
  if (error) return (
    <div className="p-6 rounded-lg border" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
      <AlertTriangle size={20} style={{ color: "#ef4444", marginBottom: 8 }} />
      <p className="text-sm font-bold" style={{ color: "#ef4444" }}>{error}</p>
      <Link href="/dashboard/jobs" className="inline-block mt-3 text-xs font-mono" style={{ color: "var(--or)" }}>← Retour au Sourcing</Link>
    </div>
  );

  if (!data) return null;

  const visibleFields = showAll ? data.fields : data.fields.filter((f) => !f.blocked || f.warning);

  return (
    <div style={{ maxWidth: 750, margin: "0 auto" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--texte)" }}>
            <Shield size={18} className="inline mr-2" style={{ color: "#22c55e" }} />
            Autofill assisté
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {data.jobTitle} — {data.company}
          </p>
        </div>
        <button onClick={copyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border"
          style={{ borderColor: copied ? "#22c55e" : "var(--or)", color: copied ? "#22c55e" : "var(--or)" }}>
          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
          {copied ? "Copié !" : "Tout copier"}
        </button>
      </div>

      {/* Règle de sécurité */}
      <div className="p-3 mb-4 rounded-lg border flex items-start gap-2 text-xs"
        style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.05)", color: "#22c55e" }}>
        <Shield size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Aucune candidature automatique.</strong> Ces champs sont prêts à copier ou à remplir.
          C&apos;est vous qui cliquez sur &ldquo;Envoyer&rdquo; sur le site externe.
        </span>
      </div>

      {/* Warnings globaux */}
      {data.warnings.length > 0 && (
        <div className="p-2 mb-4 rounded-lg text-xs space-y-0.5" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
          {data.warnings.map((w, i) => <p key={i} className="flex items-start gap-1"><AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />{w}</p>)}
        </div>
      )}

      {/* Champs */}
      <div className="space-y-2 mb-6">
        {visibleFields.map((f) => (
          <FieldRow key={f.key} field={f} />
        ))}
      </div>

      {/* Toggle show/hide */}
      <button onClick={() => setShowAll(!showAll)}
        className="flex items-center gap-1 text-xs font-mono mb-4" style={{ color: "var(--texte-tertiaire)" }}>
        {showAll ? <EyeOff size={12} /> : <Eye size={12} />}
        {showAll ? "Masquer les champs non remplissables" : "Afficher tous les champs"}
      </button>

      {/* Footer */}
      <div className="p-4 rounded-lg border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)", color: "var(--texte-tertiaire)" }}>
        <p><strong>Prochaine étape :</strong> Copiez les champs un par un ou utilisez &ldquo;Tout copier&rdquo; pour remplir le formulaire de candidature.</p>
        <p className="mt-1">Les champs marqués ⚠️ nécessitent une action manuelle (upload de fichier, etc.).</p>
        <p className="mt-1">✅ Le bouton &ldquo;Envoyer&rdquo; du site externe reste sous votre contrôle.</p>
      </div>

      <div className="flex gap-3 mt-4">
        <Link href={`/dashboard/jobs/applications/${draftId}`}
          className="px-4 py-2 rounded-md text-xs font-mono border"
          style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
          Voir le dossier de candidature
        </Link>
        <Link href="/dashboard/jobs"
          className="px-4 py-2 rounded-md text-xs font-mono border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
          Sourcing
        </Link>
      </div>
    </div>
  );
}

function FieldRow({ field }: { field: AutofillField }) {
  const [copied, setCopied] = useState(false);
  const copyField = () => {
    navigator.clipboard.writeText(field.value).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const iconMap: Record<string, React.ReactNode> = {
    firstName: <User size={10} />, lastName: <User size={10} />, fullName: <User size={10} />,
    email: <Mail size={10} />, phone: <Phone size={10} />,
    linkedin: <Link2 size={10} />, location: <MapPin size={10} />,
    currentTitle: <Briefcase size={10} />,
    salaryExpectations: <DollarSign size={10} />,
    coverLetter: <FileText size={10} />, resumeUpload: <FileText size={10} />,
    recruiterMessage: <MessageSquare size={10} />,
    atsAnswers: <MessageSquare size={10} />,
    availability: <Clock size={10} />, yearsOfExperience: <Clock size={10} />,
  };

  const isBlocked = field.blocked;
  const isEmpty = !field.value;
  const bg = isBlocked ? "rgba(100,100,100,0.03)" : isEmpty ? "var(--fond)" : "var(--fond-surface)";

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg border" style={{ borderColor: isBlocked ? "var(--bordure-douce)" : "var(--bordure)", background: bg, opacity: isBlocked ? 0.6 : 1 }}>
      <div className="flex-shrink-0 mt-0.5" style={{ color: isBlocked ? "var(--texte-tertiaire)" : "var(--or)" }}>
        {iconMap[field.key] || null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
            {field.label}
          </span>
          {field.required && <span className="text-[9px] font-mono" style={{ color: "#ef4444" }}>*</span>}
          {isBlocked && <span className="text-[9px] font-mono px-1 rounded" style={{ background: "rgba(100,100,100,0.1)", color: "var(--texte-tertiaire)" }}>DÉSACTIVÉ</span>}
          {!isBlocked && !isEmpty && (
            <span className="text-[9px] font-mono px-1 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>{field.source}</span>
          )}
        </div>
        <div className="text-xs mt-0.5 font-mono" style={{ color: isEmpty ? "var(--texte-tertiaire)" : "var(--texte)", wordBreak: "break-all", whiteSpace: field.type === "textarea" ? "pre-wrap" : "normal", maxHeight: field.type === "textarea" ? 150 : undefined, overflowY: field.type === "textarea" ? "auto" : undefined }}>
          {isEmpty ? <span style={{ fontStyle: "italic" }}>(vide)</span> : field.value.slice(0, field.type === "textarea" ? 2000 : 300)}
        </div>
        {field.warning && (
          <p className="text-[10px] mt-0.5" style={{ color: "#f59e0b" }}>{field.warning}</p>
        )}
      </div>
      {!isBlocked && field.value && (
        <button onClick={copyField}
          className="p-1 rounded flex-shrink-0" style={{ color: copied ? "#22c55e" : "var(--texte-tertiaire)" }}>
          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
        </button>
      )}
    </div>
  );
}

export default function AutofillPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>}>
      <AutofillContent />
    </Suspense>
  );
}
