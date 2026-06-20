"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, FileText, Mail, MessageSquare, Copy, Download, RefreshCw, Edit3, Save, X, Printer, Bell, Send } from "lucide-react";

interface Draft {
  id: string; jobId: string; status: string; matchScore: number | null;
  jobSummary: string | null; tailoredResumeContent: string | null;
  motivationLetterLong: string | null; motivationLetterShort: string | null;
  applicationEmail: string | null; recruiterMessage: string | null;
  atsFormAnswers: string | null; atsKeywords: string | null;
  confirmedMatches: string | null; gaps: string | null; risks: string | null;
  keyRequirements: string | null; changeLogJson: string | null;
  tailoredResumeDocumentId: string | null; motivationLetterDocumentId: string | null;
  pipelineStatus: string | null; sentAt: string | null; followUpDueAt: string | null;
  followedUpAt: string | null; recruiterRepliedAt: string | null; interviewAt: string | null;
  job: {
    id: string; title: string; company: string | null; location: string | null;
    sourceUrl: string | null; contractType: string | null; salaryMin: number | null; salaryMax: number | null;
    score: { globalScore: number | null } | null; source: { name: string } | null;
  };
}

function pa(v: string | null): string[] { try { return v ? JSON.parse(v) : []; } catch { return []; } }
function pJson(v: string | null): unknown[] { try { return v ? JSON.parse(v) : []; } catch { return []; } }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "#808080" },
  ready_to_review: { label: "Prêt à vérifier", color: "#f59e0b" },
  approved: { label: "Approuvé", color: "#22c55e" },
  sent: { label: "Envoyé", color: "#B8860B" },
  rejected: { label: "Rejeté", color: "#ef4444" },
  archived: { label: "Archivé", color: "#808080" },
};

function EditArea({ value, onSave, onCancel, rows = 10 }: { value: string; onSave: (v: string) => void; onCancel: () => void; rows?: number }) {
  const [edit, setEdit] = useState(value);
  return (
    <div className="space-y-2">
      <textarea value={edit} onChange={e => setEdit(e.target.value)} rows={rows}
        className="w-full p-2 rounded border text-xs font-sans" style={{ background: "var(--fond)", borderColor: "var(--or)", color: "var(--texte)" }} />
      <div className="flex gap-2">
        <button onClick={() => onSave(edit)} className="px-3 py-1 text-xs font-mono rounded" style={{ background: "var(--or)", color: "#000" }}><Save size={10} className="inline mr-1" />Enregistrer</button>
        <button onClick={onCancel} className="px-3 py-1 text-xs font-mono rounded border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>Annuler</button>
      </div>
    </div>
  );
}

export default function AppPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("analysis");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState<string>("");

  const load = async (id: string) => {
    const r = await fetch(`/api/application-drafts/${id}`).then(r => r.json());
    if (r.draft) { setDraft(r.draft); setWarnings(r.validation?.warnings || []); setPipelineStatus(r.draft.pipelineStatus || null); }
    setLoading(false);
  };

  useEffect(() => { params.then(({ id }) => load(id)); }, [params]);

  const act = async (action: string, target?: string) => {
    if (!draft) return;
    setBusy(action);
    const body: Record<string, unknown> = { action };
    if (target) body.target = target;
    await fetch(`/api/application-drafts/${draft.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load(draft.id);
    setBusy(null);
  };

  const saveField = async (field: string, value: string) => {
    if (!draft) return;
    await fetch(`/api/application-drafts/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    setEditing(null);
    await load(draft.id);
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} /></div>;
  if (!draft || !draft.job) return <div className="p-6 text-center" style={{ color: "var(--erreur)" }}>Introuvable</div>;

  const st = STATUS_LABELS[draft.status] || STATUS_LABELS.draft;
  const job = draft.job;
  const score = draft.matchScore ?? job.score?.globalScore ?? 0;
  const atsKw = pa(draft.atsKeywords);
  const matches = pa(draft.confirmedMatches);
  const gaps = pa(draft.gaps);
  const risks = pa(draft.risks);
  const keyReq = pa(draft.keyRequirements);
  const cl = pJson(draft.changeLogJson) as { field: string; summary: string; timestamp?: string; actor?: string; type?: string }[];

  const bt = (l: string | ReactNode, onClick: () => void, color: string, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 rounded text-xs font-mono border transition-colors"
      style={{ borderColor: color, color, opacity: disabled ? 0.4 : 1 }}>
      {busy === l ? <Loader2 size={10} className="animate-spin inline mr-1" /> : null}{l}
    </button>
  );

  const tabs = [
    { key: "analysis", label: "Analyse" }, { key: "resume", label: "CV adapté" },
    { key: "letter", label: "Lettre" }, { key: "email", label: "Email" },
    { key: "ats", label: "ATS" }, { key: "suivi", label: "Suivi" },
    { key: "changelog", label: "Historique" },
  ];

  const preBox = (text: string, field: string) => (
    <div>
      {editing === field ? (
        <EditArea value={text} onSave={v => saveField(field, v)} onCancel={() => setEditing(null)} />
      ) : (
        <>
          <pre className="text-xs whitespace-pre-wrap font-sans p-3 rounded mt-1" style={{ background: "var(--fond)", color: "var(--texte-secondaire)", maxHeight: "50vh", overflow: "auto" }}>{text}</pre>
          <div className="flex gap-2 mt-1">
            {bt(<><Edit3 size={10} /> Modifier</>, () => setEditing(field), "var(--texte-secondaire)")}
            {bt(<><Copy size={10} /> Copier</>, () => handleCopy(text), "var(--texte-secondaire)")}
            {bt(<><Printer size={10} /> Imprimer</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=${field === "tailoredResumeContent" ? "resume" : field === "motivationLetterLong" ? "letter" : "email"}`, "_blank"), "var(--texte-secondaire)")}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/jobs")} className="p-1.5 rounded border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Dossier de candidature</h1>
            <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>{job.title} — {job.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono" style={{ background: `${st.color}20`, color: st.color }}>{st.label}</span>
          <div className="text-2xl font-bold" style={{ color: score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444" }}>{score}%</div>
        </div>
      </div>

      {/* Anti-invention warnings */}
      {warnings.length > 0 && (
        <div className="p-3 rounded border text-xs space-y-1" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)" }}>
          {warnings.map((w, i) => <p key={i} className="flex items-center gap-1" style={{ color: "#f59e0b" }}><AlertTriangle size={10} /> {w}</p>)}
        </div>
      )}

      {/* Documents liés */}
      <div className="flex gap-3 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
        {draft.tailoredResumeDocumentId && <span>📄 CV lié : <span style={{ color: "var(--or)" }}>{draft.tailoredResumeDocumentId.slice(0, 12)}…</span></span>}
        {draft.motivationLetterDocumentId && <span>📄 Lettre liée : <span style={{ color: "var(--or)" }}>{draft.motivationLetterDocumentId.slice(0, 12)}…</span></span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2 overflow-x-auto" style={{ borderColor: "var(--bordure-douce)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-colors"
            style={{ background: tab === t.key ? "var(--or)" : "transparent", color: tab === t.key ? "#000" : "var(--texte-secondaire)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Analyse */}
      {tab === "analysis" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "#22c55e" }}>Points forts ({matches.length})</h3>
              {matches.map((m, i) => <p key={i} className="text-xs py-0.5" style={{ color: "var(--texte)" }}>✓ {m}</p>)}
              {matches.length === 0 && <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Aucun</p>}
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "#f59e0b" }}>Points faibles ({gaps.length})</h3>
              {gaps.map((g, i) => <p key={i} className="text-xs py-0.5 flex items-center gap-1" style={{ color: "var(--avertissement)" }}><AlertTriangle size={9} /> {g}</p>)}
              {gaps.length === 0 && <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Aucun</p>}
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "#ef4444" }}>Risques ({risks.length})</h3>
              {risks.map((r, i) => <p key={i} className="text-xs py-0.5" style={{ color: "var(--texte-secondaire)" }}>⚠ {r}</p>)}
              {risks.length === 0 && <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Aucun</p>}
            </div>
          </div>

          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Résumé</h3>
            {editing === "jobSummary" ? (
              <EditArea value={draft.jobSummary || ""} onSave={v => saveField("jobSummary", v)} onCancel={() => setEditing(null)} rows={4} />
            ) : (
              <><p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{draft.jobSummary || "N/A"}</p>
                <div className="flex gap-4 mt-2 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                  {job.contractType && <span>{job.contractType}</span>}
                  {(job.salaryMin || job.salaryMax) ? <span>{job.salaryMin || "?"} - {job.salaryMax || "?"} €</span> : null}
                  {job.location && <span>{job.location}</span>}
                </div>
                <div className="mt-1">{bt(<><Edit3 size={10} /> Modifier</>, () => setEditing("jobSummary"), "var(--texte-secondaire)")}</div>
              </>
            )}
          </div>

          {keyReq.length > 0 && <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Prérequis ({keyReq.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              {keyReq.map((k, i) => <span key={i} className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: matches.includes(k) ? "rgba(74,222,128,0.1)" : "var(--or-faible)", color: matches.includes(k) ? "#22c55e" : "var(--or)" }}>{k}</span>)}
            </div>
          </div>}
        </div>
      )}

      {/* TAB: Resume */}
      {tab === "resume" && <div className="space-y-3"><div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>CV adapté — {job.title}</h3>
          <div className="flex gap-2">
            {bt(<><Printer size={10} /> PDF moderne</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/cv-print`, "_blank"), "#C8A64E")}
            {bt(<><Printer size={10} /> Imprimer</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=resume`, "_blank"), "var(--texte-secondaire)")}
            {bt("Régénérer", () => act("regenerate", "resume"), "#8b5cf6")}
          </div>
        </div>
        {draft.tailoredResumeContent ? preBox(draft.tailoredResumeContent, "tailoredResumeContent") : <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Non généré</p>}
      </div></div>}

      {/* TAB: Letter */}
      {tab === "letter" && <div className="space-y-3"><div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Lettre de motivation</h3>
          <div className="flex gap-2">
            {bt(<><Printer size={10} /> Imprimer</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=letter`, "_blank"), "var(--texte-secondaire)")}
            {bt("Régénérer", () => act("regenerate", "letter"), "#8b5cf6")}
          </div>
        </div>
        {draft.motivationLetterLong ? preBox(draft.motivationLetterLong, "motivationLetterLong") : <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Non générée</p>}
      </div>
      {draft.motivationLetterShort && <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Version courte</h3>
        {editing === "motivationLetterShort" ? (
          <EditArea value={draft.motivationLetterShort} onSave={v => saveField("motivationLetterShort", v)} onCancel={() => setEditing(null)} rows={4} />
        ) : (
          <><p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{draft.motivationLetterShort}</p>
            {bt(<><Edit3 size={10} /> Modifier</>, () => setEditing("motivationLetterShort"), "var(--texte-secondaire)")}</>
        )}
      </div>}</div>}

      {/* TAB: Email */}
      {tab === "email" && <div className="space-y-3">
        <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono uppercase flex items-center gap-1.5" style={{ color: "var(--or)" }}><Mail size={12} /> Email</h3>
            <div className="flex gap-2">
              {bt(<><Copy size={10} /> Copier</>, () => draft.applicationEmail && handleCopy(draft.applicationEmail), "var(--texte-secondaire)")}
            </div>
          </div>
          {draft.applicationEmail ? preBox(draft.applicationEmail, "applicationEmail") : <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Non généré</p>}
        </div>
        {draft.recruiterMessage && <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono uppercase flex items-center gap-1.5" style={{ color: "var(--or)" }}><MessageSquare size={12} /> Message recruteur</h3>
            <div className="flex gap-2">
              {bt(<><Copy size={10} /> Copier</>, () => draft.recruiterMessage && handleCopy(draft.recruiterMessage), "var(--texte-secondaire)")}
            </div>
          </div>
          {editing === "recruiterMessage" ? (
            <EditArea value={draft.recruiterMessage} onSave={v => saveField("recruiterMessage", v)} onCancel={() => setEditing(null)} rows={3} />
          ) : (
            <><p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{draft.recruiterMessage}</p>
              {bt(<><Edit3 size={10} /> Modifier</>, () => setEditing("recruiterMessage"), "var(--texte-secondaire)")}</>
          )}
        </div>}
      </div>}

      {/* TAB: ATS */}
      {tab === "ats" && <div className="space-y-3">
        {atsKw.length > 0 && <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Mots-clés ATS ({atsKw.length})</h3>
          <div className="flex flex-wrap gap-1.5">{atsKw.map((k, i) => <span key={i} className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: "var(--or-faible)", color: "var(--or)" }}>{k}</span>)}</div>
        </div>}
        {(() => { const aa = pJson(draft.atsFormAnswers) as { question: string; answer: string }[]; return aa.length > 0 ? (
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Réponses ATS ({aa.length})</h3>
            <div className="space-y-2">{aa.map((a, i) => <div key={i} className="p-2 rounded text-xs" style={{ background: "var(--fond)" }}>
              <p className="font-medium" style={{ color: "var(--texte)" }}>Q: {a.question}</p>
              <p className="mt-0.5" style={{ color: "var(--texte-secondaire)" }}>R: {a.answer}</p>
            </div>)}</div>
          </div>
        ) : <p className="text-xs text-center py-4" style={{ color: "var(--texte-tertiaire)" }}>Non disponible</p>;})()}
      </div>}

      {/* TAB: Suivi */}
      {tab === "suivi" && <div className="space-y-4">
        {/* État pipeline */}
        <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
          <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><Bell size={12} /> Suivi pipeline</h3>
          {pipelineStatus ? (
            <div className="space-y-3">
              {/* Timeline dates */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                  <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Envoyé</span>
                  <p style={{ color: "var(--texte)" }}>{draft.sentAt ? new Date(draft.sentAt).toLocaleDateString("fr-FR") : "—"}</p>
                </div>
                <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                  <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Relance due</span>
                  <p style={{ color: draft.followUpDueAt && new Date(draft.followUpDueAt) <= new Date() ? "#ef4444" : "var(--texte)" }}>
                    {draft.followUpDueAt ? new Date(draft.followUpDueAt).toLocaleDateString("fr-FR") : "—"}
                    {draft.followUpDueAt && new Date(draft.followUpDueAt) <= new Date() && pipelineStatus === "sent" && " ⚠"}
                  </p>
                </div>
                <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                  <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Statut pipeline</span>
                  <p className="font-bold" style={{ color: "#6366f1" }}>{pipelineStatus}</p>
                </div>
                {draft.followedUpAt && (
                  <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Relancé le</span>
                    <p style={{ color: "var(--texte)" }}>{new Date(draft.followedUpAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                {draft.recruiterRepliedAt && (
                  <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Réponse reçue</span>
                    <p style={{ color: "var(--texte)" }}>{new Date(draft.recruiterRepliedAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                {draft.interviewAt && (
                  <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Entretien</span>
                    <p style={{ color: "var(--texte)" }}>{new Date(draft.interviewAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
              </div>

              {/* Actions pipeline */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
                {(["sent", "followed_up"].includes(pipelineStatus)) && (
                  <button onClick={async () => {
                    setBusy("genFollowUp");
                    try {
                      const r = await fetch(`/api/application-drafts/${draft.id}/follow-up/generate`, { method: "POST" });
                      const data = await r.json();
                      if (data.success && data.messages) {
                        const msgs = data.messages;
                        setFollowUpMsg([msgs.emailCourt, msgs.messageLinkedin, msgs.relanceFormelle, msgs.relanceUltraCourte].join("\n\n---\n\n"));
                        setFollowUpOpen(true);
                      }
                    } catch { /* ignore */ }
                    setBusy(null);
                  }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border" style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
                    {busy === "genFollowUp" ? <Loader2 size={10} className="animate-spin" /> : <Bell size={10} />}
                    Générer relance
                  </button>
                )}
                {pipelineStatus === "sent" && (
                  <PipelineBtn label="Marquer relancé" action="mark_followed_up" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#6366f1" />
                )}
                {(["sent", "followed_up"].includes(pipelineStatus)) && (
                  <PipelineBtn label="Réponse reçue" action="mark_replied" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#06b6d4" />
                )}
                {(["sent", "followed_up", "recruiter_replied"].includes(pipelineStatus)) && (
                  <PipelineBtn label="Entretien" action="schedule_interview" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#8b5cf6" />
                )}
                {(["recruiter_replied", "interview"].includes(pipelineStatus)) && (
                  <PipelineBtn label="Offre reçue" action="mark_offer" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#22c55e" />
                )}
                {pipelineStatus !== "archived" && pipelineStatus !== "rejected" && (
                  <PipelineBtn label="Refusé" action="mark_rejected" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#ef4444" />
                )}
                {(["offer", "rejected"].includes(pipelineStatus)) && (
                  <PipelineBtn label="Archiver" action="archive" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#808080" />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Cette candidature n&apos;est pas encore entrée dans le pipeline.</p>
              <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Marquez-la comme envoyée pour démarrer le suivi.</p>
            </div>
          )}
        </div>

        {/* Modal relance */}
        {followUpOpen && followUpMsg && (
          <div className="p-4 rounded-lg border" style={{ borderColor: "#8b5cf6", background: "var(--fond-surface)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold" style={{ color: "#8b5cf6" }}><Send size={10} className="inline mr-1" /> Message de relance généré</h3>
              <div className="flex gap-1.5">
                <button onClick={() => handleCopy(followUpMsg)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                  <Copy size={9} /> {copied ? "Copié" : "Copier"}
                </button>
                <button onClick={() => { setFollowUpOpen(false); setFollowUpMsg(""); }} className="px-2 py-1 rounded text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Fermer</button>
              </div>
            </div>
            <div className="px-3 py-2 rounded border text-xs mb-2 flex items-center gap-1.5" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)", color: "#f59e0b" }}>
              <AlertTriangle size={10} /> Ce texte n&apos;est jamais envoyé automatiquement.
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans p-3 rounded leading-relaxed" style={{ background: "var(--fond)", color: "var(--texte)", maxHeight: "40vh", overflow: "auto" }}>{followUpMsg}</pre>
          </div>
        )}
      </div>}

      {/* TAB: Changelog */}
      {tab === "changelog" && <div className="space-y-2">
        {cl.length > 0 ? cl.map((c, i) => (
          <div key={i} className="p-3 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
            <p className="font-medium" style={{ color: "var(--texte)" }}>{c.field || "N/A"} <span className="font-mono text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>{c.type || ""}</span></p>
            <p style={{ color: "var(--texte-secondaire)" }}>{c.summary || ""}</p>
            <p className="mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>Auteur : {c.actor || "ai"} · {c.timestamp ? new Date(c.timestamp).toLocaleDateString("fr-FR") : ""}</p>
          </div>
        )) : <p className="text-xs text-center py-8" style={{ color: "var(--texte-tertiaire)" }}>Aucun historique</p>}
      </div>}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 flex-wrap pt-2 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
        {/* Téléchargement */}
        <div className="flex gap-1">
          {bt(<><Download size={10} /> Export TXT</>, () => act("export", "full"), "#8b5cf6")}
          {bt(<><Printer size={10} /> Pack imprimable</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=full`, "_blank"), "var(--texte-secondaire)")}
        </div>

        {/* Actions statut */}
        {draft.status === "draft" && (
          <><span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            {bt("Prêt à vérifier", () => act("mark_ready_to_review"), "#f59e0b")}
            {bt("Tout régénérer", () => act("regenerate", "all"), "#8b5cf6")}</>
        )}
        {draft.status === "ready_to_review" && (
          <><span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            {bt("Valider", () => act("approve"), "#22c55e")}
            {bt("Rejeter", () => act("reject"), "#ef4444")}</>
        )}
        {draft.status === "approved" && (
          <><span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            {job.sourceUrl ? bt("Candidature assistée", () => router.push(`/dashboard/jobs/applications/${draft.id}/assisted-apply`), "#6366f1")
              : <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Pas d&apos;URL</span>}
            {bt("Marquer envoyé", () => act("mark_sent"), "#B8860B")}
            {bt("Archiver", () => act("archive"), "var(--texte-tertiaire)")}</>
        )}
        {["rejected", "sent", "archived"].includes(draft.status) && (
          <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Status : {st.label}</span>
        )}
        <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
        {bt("Retour aux offres", () => router.push("/dashboard/jobs"), "var(--texte-tertiaire)")}
      </div>
    </div>
  );
}

/* ─── Composant bouton pipeline ─── */
function PipelineBtn({ label, action, draftId, busy, setBusy, onDone, color }: {
  label: string; action: string; draftId: string; busy: string | null;
  setBusy: (v: string | null) => void; onDone: () => void; color: string;
}) {
  const actionKey = `pipe_${action}`;
  return (
    <button
      onClick={async () => {
        setBusy(actionKey);
        try {
          await fetch(`/api/application-drafts/${draftId}/pipeline-action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
          onDone();
        } catch { /* ignore */ }
        setBusy(null);
      }}
      disabled={busy !== null}
      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border"
      style={{ borderColor: color, color, opacity: busy !== null ? 0.4 : 1 }}>
      {busy === actionKey ? <Loader2 size={10} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
