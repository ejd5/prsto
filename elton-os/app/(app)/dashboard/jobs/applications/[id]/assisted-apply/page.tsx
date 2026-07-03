"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ExternalLink, Copy, AlertTriangle, CheckCircle2, Send } from "lucide-react";

interface FieldSugg {
  fieldName: string; fieldType: string; suggestedValue: string; confidence: number; missing: boolean;
}

export default function AssistedApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [draftId, setDraftId] = useState("");
  const [session, setSession] = useState<{ fields: FieldSugg[]; warnings: string[]; sourceUrl: string | null; jobTitle: string; jobCompany: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    params.then(async ({ id }) => {
      setDraftId(id);
      const res = await fetch(`/api/application-drafts/${id}/assisted-apply/start`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      } else {
        setError(data.error || "Erreur");
      }
      setLoading(false);
    });
  }, [params]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => { /* ignore */ });
  };

  const handleCopyAll = () => {
    if (!session) return;
    const text = session.fields.map(f => `${f.fieldName}: ${f.suggestedValue}`).join("\n\n---\n\n");
    handleCopy("__all__", text);
  };

  const handleMarkSent = async () => {
    if (!draftId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/application-drafts/${draftId}/assisted-apply/mark-sent`, { method: "POST" });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || "Erreur");
    } catch { setError("Erreur"); }
    setSending(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/dashboard/jobs/applications/${draftId}`)} className="p-1.5 rounded border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Candidature assist&eacute;e</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{session?.jobTitle || "Offre"} &mdash; {session?.jobCompany || ""}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono" style={{ background: sent ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)", color: sent ? "#22c55e" : "#6366f1" }}>
          {sent ? "Envoy&eacute;" : "Assistance"}
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-lg border flex items-start gap-3" style={{ borderColor: "#ef4444", background: "rgba(239,68,68,0.05)" }}>
          <AlertTriangle size={16} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#ef4444" }}>{error}</p>
            <button onClick={() => router.push(`/dashboard/jobs/applications/${draftId}`)} className="text-xs mt-2 font-mono" style={{ color: "var(--or)" }}>Retour au dossier</button>
          </div>
        </div>
      )}

      {sent && (
        <div className="p-4 rounded-lg border flex items-center gap-3" style={{ borderColor: "#22c55e", background: "rgba(34,197,94,0.05)" }}>
          <CheckCircle2 size={20} style={{ color: "#22c55e" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Candidature marqu&eacute;e comme envoy&eacute;e</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>Retournez au dossier pour voir le statut mis &agrave; jour.</p>
          </div>
        </div>
      )}

      {session && !sent && (
        <>
          {/* Securite */}
          <div className="p-3 rounded-lg border text-xs" style={{ borderColor: "#6366f1", background: "rgba(99,102,241,0.05)" }}>
            <p style={{ color: "#6366f1" }}>
              <CheckCircle2 size={10} className="inline mr-1" />
              Aucune candidature n&apos;est envoy&eacute;e automatiquement. Copiez les r&eacute;ponses et postulez vous-m&ecirc;me.
            </p>
          </div>

          {/* URL */}
          {session.sourceUrl && (
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-mono uppercase mb-1" style={{ color: "var(--texte-tertiaire)" }}>URL de l&apos;offre</h3>
                  <p className="text-xs truncate" style={{ color: "var(--texte-secondaire)" }}>{session.sourceUrl}</p>
                </div>
                <a href={session.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border flex-shrink-0 ml-3"
                  style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
                  <ExternalLink size={12} /> Ouvrir le site
                </a>
              </div>
            </div>
          )}

          {/* Warnings */}
          {session.warnings.length > 0 && (
            <div className="p-3 rounded-lg border text-xs space-y-1" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)" }}>
              {session.warnings.map((w, i) => (
                <p key={i} className="flex items-center gap-1" style={{ color: "#f59e0b" }}><AlertTriangle size={10} /> {w}</p>
              ))}
            </div>
          )}

          {/* Champs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>
                R&eacute;ponses pr&eacute;par&eacute;es ({session.fields.length})
              </h3>
              <button onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors"
                style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                <Copy size={12} /> {copiedKey === "__all__" ? "Tout copi&eacute;" : "Tout copier"}
              </button>
            </div>

            {session.fields.map((f, i) => (
              <div key={i} className="p-3 rounded-lg border" style={{
                borderColor: f.missing ? "#f59e0b" : "var(--bordure-douce)",
                background: "var(--fond-surface)",
                opacity: f.missing ? 0.6 : 1,
              }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium" style={{ color: f.missing ? "var(--avertissement)" : "var(--texte)" }}>
                        {f.fieldName} {f.missing ? "(manquant)" : ""}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: f.missing ? "rgba(245,158,11,0.1)" : "var(--or-faible)", color: f.missing ? "#f59e0b" : "var(--or)" }}>
                        {f.fieldType}
                      </span>
                      {!f.missing && <span className="text-[10px] font-mono" style={{ color: "#22c55e" }}>{f.confidence}%</span>}
                    </div>
                    <textarea
                      readOnly
                      value={f.suggestedValue}
                      rows={Math.min(Math.max(f.suggestedValue.split("\n").length, 1), 4)}
                      className="w-full p-2 rounded border text-xs font-sans"
                      style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)", resize: "none" }}
                    />
                  </div>
                  <button onClick={() => handleCopy(`field_${i}`, f.suggestedValue)}
                    className="flex-shrink-0 p-1.5 rounded border text-xs transition-colors"
                    style={{ borderColor: "var(--bordure)", color: copiedKey === `field_${i}` ? "#22c55e" : "var(--texte-secondaire)" }}>
                    {copiedKey === `field_${i}` ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 pt-4 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
            {session.sourceUrl && (
              <a href={session.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                style={{ background: "var(--or)", color: "#000", textDecoration: "none" }}>
                <ExternalLink size={14} /> Ouvrir le site et postuler
              </a>
            )}
            <button onClick={handleMarkSent} disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border"
              style={{ borderColor: "#B8860B", color: sending ? "var(--texte-tertiaire)" : "#B8860B" }}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Marquer comme envoy&eacute;
            </button>
            <button onClick={() => router.push(`/dashboard/jobs/applications/${draftId}`)}
              className="px-4 py-2 rounded text-sm font-medium border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Retour au dossier
            </button>
          </div>
        </>
      )}
    </div>
  );
}
