"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, FileText, Mail, MessageSquare, Copy, Download, RefreshCw, Edit3, Save, Printer, Bell, Send, Star, Sparkles, Globe, MapPin, Clock, FileSignature, FileCheck2, ShieldCheck, ArrowRight, Building2, Target, XCircle } from "lucide-react";
import { sanitizeCvText } from "@/lib/jobs/cv-content-sanitizer";
import { checkApplicationReadiness } from "@/lib/jobs/application-readiness";
import { useToast } from "@/components/ui/EltonToast";
import ExecutiveAnalysis from "@/components/analysis/ExecutiveAnalysis";
import { getScoreColor, getScoreBg } from "@/lib/score-colors";

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
  contact?: { id: string; fullName: string; contactType: string; companyName?: string | null; firmName?: string | null; nextFollowUpAt?: string | null } | null;
  job: {
    id: string; title: string; company: string | null; location: string | null;
    sourceUrl: string | null; contractType: string | null; salaryMin: number | null; salaryMax: number | null;
    score: { globalScore: number | null; semanticScore: number | null; semanticConfidence: number | null; semanticAnalysisJson: string | null; recommendation: string | null } | null; source: { name: string } | null;
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
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("analyse");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState<string>("");
  const [emailRemerciement, setEmailRemerciement] = useState<string>("");

  const load = async (id: string) => {
    const r = await fetch(`/api/application-drafts/${id}`).then(r => r.json());
    if (r.draft) { setDraft(r.draft); setWarnings(r.validation?.warnings || []); setPipelineStatus(r.draft.pipelineStatus || null); }
    setLoading(false);
  };

  useEffect(() => { params.then(({ id }) => load(id)); }, [params]);

  const notify = (type: "ok" | "err", msg: string) => {
    if (type === "ok") toast.success(msg);
    else toast.error(msg);
  };

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

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text).then(() => { notify("ok", "Copié !"); }).catch(() => notify("err", "Erreur de copie")); };

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

  const bt = (l: string | ReactNode, onClick: () => void, color: string, disabled = false, title?: string) => (
    <button onClick={onClick} disabled={disabled} title={title}
      className="px-3 py-1.5 rounded text-xs font-mono border transition-colors"
      style={{ borderColor: color, color, opacity: disabled ? 0.4 : 1 }}>
      {busy === l ? <Loader2 size={10} className="animate-spin inline mr-1" /> : null}{l}
    </button>
  );

  const sections = [
    { key: "analyse", label: "Analyse", hint: "Stratégie d'attaque + matching détaillé", icon: <Target size={12} /> },
    { key: "documents", label: "Documents", hint: "CV adapté + lettre + email + ATS", icon: <FileText size={12} /> },
    { key: "suivi", label: "Suivi", hint: "Pipeline, relances et remerciement", icon: <Bell size={12} /> },
    { key: "historique", label: "Historique", hint: "Journal des actions et modifications", icon: <Clock size={12} /> },
  ];

  const preBox = (text: string, field: string) => {
    let displayText = field === "tailoredResumeContent" ? sanitizeCvText(text) : text;
    if (field === "tailoredResumeContent") {
      try {
        const parsed = JSON.parse(text);
        if (parsed && (parsed.identity || parsed.experiences)) {
          let md = "";
          if (parsed.identity) {
            const i = parsed.identity;
            md += `# ${i.fullName || ""}\n`;
            if (i.title) md += `${i.title}\n`;
            const contact = [i.email, i.phone, i.location, i.linkedin].filter(Boolean).join(" | ");
            if (contact) md += `${contact}\n`;
            md += "\n";
          }
          if (parsed.summary) {
            md += `## PROFIL\n${parsed.summary}\n\n`;
          }
          if (parsed.experiences && parsed.experiences.length > 0) {
            md += `## EXPÉRIENCES PROFESSIONNELLES\n`;
            parsed.experiences.forEach((e: any) => {
              md += `### ${e.title || ""} — ${e.company || ""}\n`;
              const dates = [e.startDate, e.endDate].filter(Boolean).join(" — ");
              const loc = e.location ? ` | ${e.location}` : "";
              if (dates || loc) md += `*${dates}${loc}*\n`;
              if (e.description) md += `${e.description}\n`;
              if (e.bullets && e.bullets.length > 0) {
                e.bullets.forEach((b: string) => { md += `- ${b}\n`; });
              }
              md += "\n";
            });
          }
          if (parsed.skills && parsed.skills.length > 0) {
            md += `## COMPÉTENCES\n${parsed.skills.join(", ")}\n\n`;
          }
          if (parsed.education && parsed.education.length > 0) {
            md += `## FORMATION\n`;
            parsed.education.forEach((edu: any) => {
              md += `- ${edu.degree || ""}${edu.school ? ` — ${edu.school}` : ""}${edu.year ? ` (${edu.year})` : ""}\n`;
            });
            md += "\n";
          }
          if (parsed.languages && parsed.languages.length > 0) {
            md += `## LANGUES\n`;
            parsed.languages.forEach((l: any) => {
              md += `- ${l.name || ""}${l.level ? ` (${l.level})` : ""}\n`;
            });
            md += "\n";
          }
          displayText = md.trim();
        }
      } catch {
        // Fallback to raw text
      }
    }
    return (
      <div>
        {editing === field ? (
          <EditArea value={displayText} onSave={v => saveField(field, v)} onCancel={() => setEditing(null)} />
        ) : (
          <>
            <pre className="text-xs whitespace-pre-wrap font-sans p-3 rounded mt-1" style={{ background: "var(--fond)", color: "var(--texte-secondaire)", maxHeight: "50vh", overflow: "auto" }}>{displayText}</pre>
            <div className="flex gap-2 mt-1">
              {bt(<><Edit3 size={10} /> Modifier</>, () => setEditing(field), "var(--texte-secondaire)", false, "Modifier ce contenu manuellement")}
              {bt(<><Copy size={10} /> Copier</>, () => handleCopy(text), "var(--texte-secondaire)", false, "Copier ce contenu dans le presse-papier")}
              {bt(<><Printer size={10} /> Imprimer</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=${field === "tailoredResumeContent" ? "resume" : field === "motivationLetterLong" ? "letter" : "email"}`, "_blank"), "var(--texte-secondaire)", false, "Version imprimable du document")}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header premium */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/jobs")} title="Retour aux offres"
              className="p-1.5 rounded-lg border transition-colors" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--texte-tertiaire)" }}>
                <FileSignature size={11} style={{ color: "var(--or)" }} />
                <span>Espace de travail · Dossier de candidature</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>{job.title}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm" style={{ color: "var(--texte-secondaire)" }}>
                {job.company && <span className="flex items-center gap-1 font-semibold" style={{ color: "var(--texte)" }}><Building2 size={12} />{job.company}</span>}
                {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                {job.contractType && <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>{job.contractType}</span>}
                {(job.salaryMin || job.salaryMax) && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                    {(job.salaryMin || "?")}–{(job.salaryMax || "?")} €
                  </span>
                )}
                {job.source?.name && <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>{job.source.name}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span title="Statut du dossier : brouillon, prêt, approuvé, envoyé…" className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider" style={{ background: `${st.color}20`, color: st.color }}>{st.label}</span>
              {warnings.length > 0 && (
                <span className="mt-1 text-[9px] font-mono flex items-center gap-1" style={{ color: "#f59e0b" }} title="Vérifie les inventions dans les contenus générés"><AlertTriangle size={9} />{warnings.length} avertissement(s)</span>
              )}
            </div>
            <AppScoreRing score={score} />
          </div>
        </div>

        {/* KPI mini-cards : état de chaque doc */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <KpiMini label="CV adapté" ok={!!draft.tailoredResumeContent} icon={<FileText size={13} />} />
          <KpiMini label="Lettre" ok={!!draft.motivationLetterLong} icon={<FileCheck2 size={13} />} />
          <KpiMini label="Email" ok={!!draft.applicationEmail} icon={<Mail size={13} />} />
          <KpiMini label="ATS" ok={atsKw.length > 0} icon={<ShieldCheck size={13} />} hint={atsKw.length > 0 ? `${atsKw.length} mots-clés` : undefined} />
        </div>
      </div>

      {/* Anti-invention warnings (déplacé en sticky léger) */}
      {warnings.length > 0 && (
        <div className="p-3 rounded-lg border text-xs space-y-1" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)" }}>
          {warnings.map((w, i) => <p key={i} className="flex items-center gap-1.5" style={{ color: "#f59e0b" }}><AlertTriangle size={11} /> {w}</p>)}
        </div>
      )}

      {/* Section navbar — 4 sections */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--fond-surface)", border: "1px solid var(--bordure)" }}>
        {sections.map(s => {
          const active = tab === s.key;
          return (
            <button key={s.key} onClick={() => setTab(s.key)} title={s.hint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? "var(--or)" : "transparent",
                color: active ? "#000" : "var(--texte-secondaire)",
                flex: 1,
                justifyContent: "center",
              }}>
              <span style={{ opacity: active ? 1 : 0.6 }}>{s.icon}</span>
              <span>{s.label}</span>
              <SectionBadge section={s.key} draft={draft} atsKwCount={atsKw.length} score={score} />
            </button>
          );
        })}
      </div>

      {/* SECTION: ANALYSE (Stratégie + Matching) */}
      {tab === "analyse" && draft && (
        <section className="space-y-4">
          <SectionHeading icon={<Target size={14} />} eyebrow="Stratégie & matching" title="Analyse exécutive PRSTO" hint="L'IA identifie ton angle d'attaque, tes leviers de négociation, et décompose les écarts entre ton profil et le poste." />
        <ExecutiveAnalysis
          draftId={draft.id}
          jobTitle={draft.job.title}
          jobCompany={draft.job.company}
          jobLocation={draft.job.location}
          contractType={draft.job.contractType}
          salaryMin={draft.job.salaryMin}
          salaryMax={draft.job.salaryMax}
          globalScore={draft.job.score?.globalScore ?? null}
          semanticScore={draft.job.score?.semanticScore ?? null}
          semanticConfidence={draft.job.score?.semanticConfidence ?? null}
          semanticAnalysisJson={draft.job.score?.semanticAnalysisJson ?? null}
          confirmedMatches={draft.confirmedMatches}
          gaps={draft.gaps}
          risks={draft.risks}
        />

      {/* Matching détaillé */}
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
        </section>
      )}

      {/* SECTION: DOCUMENTS (CV + Lettre + Email + ATS) */}
      {tab === "documents" && (
        <section className="space-y-5">
      {/* Sous-section CV */}
      {tab === "documents" && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>CV adapté — {job.title}</h3>
              <div className="flex gap-2">
                {bt(<><Printer size={10} /> PDF moderne</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/cv-print`, "_blank"), "#C8A64E", false, "Générer un CV PDF design professionnel")}
                {bt(<><Printer size={10} /> Imprimer</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=resume`, "_blank"), "var(--texte-secondaire)", false, "Version imprimable du CV")}
                {bt("Régénérer", () => act("regenerate", "resume"), "#8b5cf6", false, "Remplace le CV actuel par une nouvelle version IA. Tes modifications seront écrasées.")}
              </div>
            </div>
            {draft.tailoredResumeContent ? preBox(draft.tailoredResumeContent, "tailoredResumeContent") : <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Non généré</p>}
          </div>
        </div>
      )}

      {/* Sous-section Lettre */}
      {tab === "documents" && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Lettre de motivation</h3>
              <div className="flex gap-2">
                {bt(<><Printer size={10} /> Imprimer</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=letter`, "_blank"), "var(--texte-secondaire)", false, "Version imprimable de la lettre")}
                {bt("Régénérer", () => act("regenerate", "letter"), "#8b5cf6", false, "Remplace la lettre actuelle par une nouvelle version IA. Tes modifications seront écrasées.")}
              </div>
            </div>
            {draft.motivationLetterLong ? preBox(draft.motivationLetterLong, "motivationLetterLong") : <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Non générée</p>}
          </div>
          {draft.motivationLetterShort && (
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Version courte</h3>
              {editing === "motivationLetterShort" ? (
                <EditArea value={draft.motivationLetterShort} onSave={v => saveField("motivationLetterShort", v)} onCancel={() => setEditing(null)} rows={4} />
              ) : (
                <><p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{draft.motivationLetterShort}</p>
                  {bt(<><Edit3 size={10} /> Modifier</>, () => setEditing("motivationLetterShort"), "var(--texte-secondaire)")}</>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sous-section Email */}
      {tab === "documents" && (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono uppercase flex items-center gap-1.5" style={{ color: "var(--or)" }}><Mail size={12} /> Email</h3>
              <div className="flex gap-2">
                {bt(<><Copy size={10} /> Copier</>, () => draft.applicationEmail && handleCopy(draft.applicationEmail), "var(--texte-secondaire)")}
              </div>
            </div>
            {draft.applicationEmail ? preBox(draft.applicationEmail, "applicationEmail") : <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Non généré</p>}
          </div>
          {draft.recruiterMessage && (
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
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
            </div>
          )}
        </div>
      )}

      {/* Sous-section ATS */}
      {tab === "documents" && (
        <div className="space-y-3">
          {atsKw.length > 0 && (
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Mots-clés ATS ({atsKw.length})</h3>
                {draft.tailoredResumeContent && (() => {
                  const cv = draft.tailoredResumeContent.toLowerCase();
                  const matched = atsKw.filter(k => cv.includes(k.toLowerCase())).length;
                  const pct = Math.round((matched / atsKw.length) * 100);
                  return (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: getScoreBg(pct, 0.15), color: getScoreColor(pct) }}>
                      {matched}/{atsKw.length} dans le CV ({pct}%)
                    </span>
                  );
                })()}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {atsKw.map((k, i) => {
                  const inCv = draft.tailoredResumeContent
                    ? draft.tailoredResumeContent.toLowerCase().includes(k.toLowerCase())
                    : false;
                  return (
                    <span key={i} className="px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1"
                      title={inCv ? "Ce mot-clé apparaît dans ton CV adapté" : "Ce mot-clé n'apparaît pas dans ton CV — pense à l'ajouter"}
                      style={{
                        background: inCv ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.08)",
                        color: inCv ? "#22c55e" : "#ef4444",
                        border: `1px solid ${inCv ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.15)"}`,
                      }}>
                      <span>{inCv ? "✓" : "✗"}</span> {k}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {(() => { const aa = pJson(draft.atsFormAnswers) as { question: string; answer: string }[]; return aa.length > 0 ? (
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
              <h3 className="text-xs font-mono uppercase mb-2" style={{ color: "var(--or)" }}>Réponses ATS ({aa.length})</h3>
              <div className="space-y-2">{aa.map((a, i) => <div key={i} className="p-2 rounded text-xs" style={{ background: "var(--fond)" }}>
                <p className="font-medium" style={{ color: "var(--texte)" }}>Q: {a.question}</p>
                <p className="mt-0.5" style={{ color: "var(--texte-secondaire)" }}>R: {a.answer}</p>
              </div>)}</div>
            </div>
          ) : <p className="text-xs text-center py-4" style={{ color: "var(--texte-tertiaire)" }}>Non disponible</p>;})()}
        </div>
      )}
        </section>
      )}

      {/* SECTION: SUIVI (Pipeline + Relances + Remerciement) */}
      {tab === "suivi" && (
        <section className="space-y-5">
          <SectionHeading icon={<Bell size={14} />} eyebrow="Pipeline & relances" title="Suivi de la candidature" hint="Visualise l'avancement, génère des relances polies et prépare ton remerciement post-entretien." />
      {/* Pipeline + relances */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><Bell size={12} /> Suivi pipeline</h3>
            {pipelineStatus ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Envoyé</span>
                    <p style={{ color: "var(--texte)" }}>{draft.sentAt ? new Date(draft.sentAt).toLocaleDateString("fr-FR") : "—"}</p>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Relance due</span>
                    <p style={{ color: draft.followUpDueAt && new Date(draft.followUpDueAt) <= new Date() ? "#ef4444" : "var(--texte)" }}>
                      {draft.followUpDueAt ? new Date(draft.followUpDueAt).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--fond)" }}>
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>Statut pipeline</span>
                    <p className="font-bold" style={{ color: "#6366f1" }}>{pipelineStatus}</p>
                  </div>
                </div>
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
                  <PipelineBtn label="Marquer relancé" action="mark_followed_up" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#6366f1" title="Indique que tu as relancé le recruteur" />
                  <PipelineBtn label="Réponse reçue" action="mark_replied" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#06b6d4" title="Le recruteur a répondu à ta candidature" />
                  <PipelineBtn label="Entretien" action="schedule_interview" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#8b5cf6" title="Un entretien est programmé" />
                  <PipelineBtn label="Offre reçue" action="mark_offer" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#22c55e" title="Tu as reçu une offre !" />
                  <PipelineBtn label="Refusé" action="mark_rejected" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#ef4444" title="La candidature n'a pas abouti" />
                  <PipelineBtn label="Archiver" action="archive" draftId={draft.id} busy={busy} setBusy={setBusy} onDone={() => load(draft.id)} color="#808080" title="Archiver ce dossier" />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Cette candidature n&apos;est pas encore entrée dans le pipeline.</p>
                <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Marquez-la comme envoyée pour démarrer le suivi.</p>
              </div>
            )}
          </div>
          {followUpOpen && followUpMsg && (
            <div className="p-4 rounded-lg border" style={{ borderColor: "#8b5cf6", background: "var(--fond-surface)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold" style={{ color: "#8b5cf6" }}><Send size={10} className="inline mr-1" /> Message de relance généré</h3>
                <button onClick={() => { setFollowUpOpen(false); setFollowUpMsg(""); }} className="px-2 py-1 rounded text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Fermer</button>
              </div>
              <div className="px-3 py-2 rounded border text-xs mb-2 flex items-center gap-1.5" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)", color: "#f59e0b" }}>
                <AlertTriangle size={10} /> Ce texte n&apos;est jamais envoyé automatiquement.
              </div>
              <pre className="text-xs whitespace-pre-wrap font-sans p-3 rounded leading-relaxed" style={{ background: "var(--fond)", color: "var(--texte)", maxHeight: "40vh", overflow: "auto" }}>{followUpMsg}</pre>
            </div>
          )}
        </div>

      {/* Sous-section Remerciement */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><Mail size={12} /> Email de remerciement après entretien</h3>
            <p className="text-xs mb-3" style={{ color: "var(--texte-tertiaire)" }}>
              Envoyez un email de remerciement dans les 24h suivant l&apos;entretien pour marquer les esprits.
            </p>
            {!emailRemerciement ? (
              <button onClick={async () => {
                setBusy("genThanks");
                try {
                  const r = await fetch(`/api/application-drafts/${draft.id}/thank-you/generate`, { method: "POST" });
                  const data = await r.json();
                  if (data.success && data.email) setEmailRemerciement(data.email);
                } catch { /* ignore */ }
                setBusy(null);
              }}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono border transition-colors"
                style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                {busy === "genThanks" ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                Générer l&apos;email de remerciement
              </button>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                    <CheckCircle2 size={10} /> Généré par IA
                  </div>
                  <button onClick={() => handleCopy(emailRemerciement)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                    <Copy size={10} /> Copier
                  </button>
                  <button onClick={() => setEmailRemerciement("")}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                    <RefreshCw size={10} /> Régénérer
                  </button>
                </div>
                <div className="px-3 py-2 rounded border text-xs mb-2 flex items-center gap-1.5" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)", color: "#f59e0b" }}>
                  <AlertTriangle size={10} /> Ce texte n&apos;est jamais envoyé automatiquement. Relisez et personnalisez avant d&apos;envoyer.
                </div>
                <pre className="text-xs whitespace-pre-wrap font-sans p-4 rounded leading-relaxed" style={{ background: "var(--fond)", color: "var(--texte)", maxHeight: "50vh", overflow: "auto" }}>{emailRemerciement}</pre>
              </div>
            )}
          </div>
        </div>
        </section>
      )}

      {/* SECTION: HISTORIQUE */}
      {tab === "historique" && (
        <section className="space-y-3">
          <SectionHeading icon={<Clock size={14} />} eyebrow="Journal des actions" title="Historique du dossier" hint="Toutes les actions sur ce dossier : générations IA, éditions manuelles, changements de statut." />
        <div className="space-y-2">
          {cl.length > 0 ? cl.map((c, i) => (
            <div key={i} className="p-3 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
              <p className="font-medium" style={{ color: "var(--texte)" }}>{c.field || "N/A"} <span className="font-mono text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>{c.type || ""}</span></p>
              <p style={{ color: "var(--texte-secondaire)" }}>{c.summary || ""}</p>
              <p className="mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>Auteur : {c.actor || "ai"} · {c.timestamp ? new Date(c.timestamp).toLocaleDateString("fr-FR") : ""}</p>
            </div>
          )) : <p className="text-xs text-center py-8" style={{ color: "var(--texte-tertiaire)" }}>Aucun historique</p>}
        </div>
        </section>
      )}

      {/* Prêt à postuler ? */}
      {draft && draft.job && (
        <ReadinessCheck draft={draft as { status: string; tailoredResumeContent?: string | null; motivationLetterLong?: string | null; job: { title: string; company: string | null } }} />
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 flex-wrap pt-2 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
        <div className="flex gap-1">
          {bt(<><Download size={10} /> Export TXT</>, () => act("export", "full"), "#8b5cf6", false, "Télécharger un fichier texte avec l'ensemble du dossier (CV + lettre + email)")}
          {bt(<><Printer size={10} /> Pack imprimable</>, () => window.open(`/dashboard/jobs/applications/${draft.id}/print?type=full`, "_blank"), "var(--texte-secondaire)", false, "Version imprimable complète du dossier (CV + lettre + email)")}
        </div>
        {draft.status === "draft" && (
          <><span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            {bt("Prêt à vérifier", () => act("mark_ready_to_review"), "#f59e0b", false, "Marque le dossier comme prêt pour relecture. Passe au statut « Prêt à vérifier ».")}
            {bt("Tout régénérer", () => act("regenerate", "all"), "#8b5cf6", false, "Régénère CV + lettre + email avec l'IA. Tous les contenus actuels seront remplacés.")}</>
        )}
        {draft.status === "ready_to_review" && (
          <><span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            {bt("Valider", () => act("approve"), "#22c55e", false, "Valide définitivement le dossier. Passe au statut « Approuvé ».")}
            {bt("Rejeter", () => act("reject"), "#ef4444", false, "Rejette le dossier. Nécessitera des corrections avant nouvelle validation.")}</>
        )}
        {draft.status === "approved" && (
          <><span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            {job.sourceUrl ? bt("Candidature assistée", () => router.push(`/dashboard/jobs/applications/${draft.id}/assisted-apply`), "#6366f1", false, "Postuler avec un assistant étape par étape (vérification des champs, envoi guidé)")
              : <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Pas d&apos;URL</span>}
            {bt("Marquer envoyé", () => act("mark_sent"), "#B8860B", false, "Indique que la candidature a bien été envoyée au recruteur")}
            {bt("Archiver", () => act("archive"), "var(--texte-tertiaire)", false, "Archive ce dossier (n'apparaîtra plus dans la liste active)")}</>
        )}
        {["rejected", "sent", "archived"].includes(draft.status) && (
          <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Status : {st.label}</span>
        )}
        <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>|</span>
        {bt("Retour aux offres", () => router.push("/dashboard/jobs"), "var(--texte-tertiaire)", false, "Retourner à la liste des offres")}
      </div>
    </div>
  );
}

/* ─── Composants premium du dossier de candidature ─── */

function AppScoreRing({ score }: { score: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  const color = getScoreColor(score);
  return (
    <div className="flex flex-col items-center" title={`Score de compatibilité : ${score}%`}>
      <div className="relative" style={{ width: 56, height: 56 }}>
        <svg width="56" height="56" className="transform -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="var(--fond-eleve)" strokeWidth="4" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[9px] font-mono uppercase tracking-wider mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>Match</span>
    </div>
  );
}

function KpiMini({ label, ok, icon, hint }: { label: string; ok: boolean; icon: React.ReactNode; hint?: string }) {
  return (
    <div title={hint || label} className="flex items-center gap-2.5 p-2.5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: ok ? "rgba(34,197,94,0.2)" : "var(--bordure-douce)" }}>
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: ok ? "rgba(34,197,94,0.1)" : "var(--fond-eleve)", color: ok ? "#22c55e" : "var(--texte-tertiaire)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider truncate" style={{ color: "var(--texte-tertiaire)" }}>{label}</div>
        <div className="text-xs font-semibold" style={{ color: ok ? "#22c55e" : "var(--texte-tertiaire)" }}>
          {ok ? <span className="flex items-center gap-1"><CheckCircle2 size={9} />Prêt</span> : "À générer"}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon, eyebrow, title, hint }: { icon: React.ReactNode; eyebrow: string; title: string; hint: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--texte-tertiaire)" }}>
        <span style={{ color: "var(--or)" }}>{icon}</span>
        <span>{eyebrow}</span>
      </div>
      <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>{title}</h2>
      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{hint}</p>
    </div>
  );
}

function SectionBadge({ section, draft, atsKwCount, score }: { section: string; draft: Draft; atsKwCount: number; score: number }) {
  let total = 0, done = 0;
  if (section === "analyse") {
    total = 2; done = (draft.confirmedMatches ? 1 : 0) + (draft.job.score?.globalScore != null ? 1 : 0);
  } else if (section === "documents") {
    total = 4; done = (draft.tailoredResumeContent ? 1 : 0) + (draft.motivationLetterLong ? 1 : 0) + (draft.applicationEmail ? 1 : 0) + (atsKwCount > 0 ? 1 : 0);
  } else if (section === "suivi") {
    total = 1; done = draft.pipelineStatus ? 1 : 0;
  } else if (section === "historique") {
    try { const c = JSON.parse(draft.changeLogJson || "[]"); total = 1; done = Array.isArray(c) && c.length > 0 ? 1 : 0; } catch { total = 1; done = 0; }
  }
  const isComplete = total > 0 && done === total;
  const partial = done > 0 && !isComplete;
  return (
    <span className="flex items-center gap-1 ml-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full"
      style={{ background: isComplete ? "rgba(34,197,94,0.15)" : partial ? "var(--or-faible)" : "var(--fond-eleve)", color: isComplete ? "#22c55e" : partial ? "var(--or)" : "var(--texte-tertiaire)" }}>
      {isComplete ? <CheckCircle2 size={9} /> : null}
      {`${done}/${total}`}
    </span>
  );
}

/* ─── Bloc Prêt à postuler ? ─── */
function ReadinessCheck({ draft, noAutoApplyMsg = "PRSTO prépare les documents. Vous relisez et envoyez vous-même." }: {
  draft: { status: string; tailoredResumeContent?: string | null; motivationLetterLong?: string | null; job: { title: string; company: string | null } };
  noAutoApplyMsg?: string;
}) {
  const result = checkApplicationReadiness({
    cvContent: draft.tailoredResumeContent,
    letterContent: draft.motivationLetterLong,
    jobTitle: draft.job.title,
    company: draft.job.company || "",
  });

  const statusColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    ready: { bg: "rgba(34,197,94,0.05)", border: "rgba(34,197,94,0.2)", text: "#22c55e", icon: "✅" },
    needs_review: { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.2)", text: "#f59e0b", icon: "⚠️" },
    not_ready: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.2)", text: "#ef4444", icon: "❌" },
  };
  const sc = statusColors[result.status] || statusColors.not_ready;
  const pct = result.score;
  const barColor = getScoreColor(pct);

  const nextAction = result.status === "not_ready"
    ? "Génère le CV et la lettre de motivation dans l'onglet Documents"
    : result.status === "needs_review"
    ? "Relis et valide le dossier pour le passer en « Approuvé »"
    : "Ton dossier est prêt. Postule ou marque-le comme envoyé.";

  return (
    <div className="p-5 rounded-xl border space-y-4" style={{ background: sc.bg, borderColor: sc.border }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--texte-tertiaire)" }}>
            <Sparkles size={11} style={{ color: sc.text }} />
            <span>Readiness Check</span>
          </div>
          <h3 className="text-lg font-bold" style={{ color: "var(--texte)" }}>
            {sc.icon} {result.status === "ready" ? "Prêt à postuler" : result.status === "needs_review" ? "À vérifier avant envoi" : "Dossier incomplet"}
          </h3>
          <p className="text-sm mt-1.5" style={{ color: "var(--texte-secondaire)" }}>
            {nextAction}
          </p>
        </div>
        {/* Score ring */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative" style={{ width: 64, height: 64 }}>
            <svg width="64" height="64" className="transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--fond-eleve)" strokeWidth="5" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={barColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 0.8s" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold leading-none" style={{ color: barColor }}>{pct}</span>
              <span className="text-[9px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--fond-eleve)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${pct}%`,
          background: barColor,
        }} />
      </div>

      {/* Checks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {result.checks.map((c: { code: string; label: string; passed: boolean }) => (
          <div key={c.code} className="flex items-center gap-2 p-2 rounded-lg text-sm"
            style={{ background: c.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.04)" }}>
            {c.passed
              ? <CheckCircle2 size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
              : <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />}
            <span style={{ color: "var(--texte-secondaire)" }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-1.5 pt-3 border-t text-xs" style={{ borderColor: sc.border, color: sc.text }}>
        <AlertTriangle size={11} />
        <span>{noAutoApplyMsg}</span>
      </div>
    </div>
  );
}

/* ─── Composant bouton pipeline ─── */
function PipelineBtn({ label, action, draftId, busy, setBusy, onDone, color, title }: {
  label: string; action: string; draftId: string; busy: string | null;
  setBusy: (v: string | null) => void; onDone: () => void; color: string; title?: string;
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
      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border" title={title}
      style={{ borderColor: color, color, opacity: busy !== null ? 0.4 : 1 }}>
      {busy === actionKey ? <Loader2 size={10} className="animate-spin" /> : null}
      {label}
    </button>
  );
}
