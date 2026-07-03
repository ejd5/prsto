"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, CheckCircle2, Copy, Edit3, Save,
  Calendar, Building2, Globe, Target, FileText, AlertTriangle,
  ChevronDown, ChevronRight, Trash2, Sparkles, ChevronLeft,
  CheckCheck, BookOpen, ListChecks,
} from "lucide-react";
import { getInterview, updateInterviewPreparation, markInterviewReady, deleteInterview } from "@/lib/actions/interview";
import { INTERVIEW_SECTIONS } from "@/lib/generation/interview-templates";
import {
  PITCH_ROLES, SECTION_GROUP_VISUALS, getSectionGroup,
  type SectionGroupKey,
} from "@/lib/generation/interview-visuals";

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

const GROUPS_ORDER: SectionGroupKey[] = [
  "Pitchs", "Contexte", "Motivation", "Questions", "Réponses",
  "Objections", "À poser", "Négociation", "Stratégie", "Logistique",
];

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
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getInterview(id);
    setIv(data as InterviewDetail | null);
    setPreparation(data?.preparation || "");
    if (data?.sections) {
      try {
        const s = JSON.parse(data.sections);
        const expanded: Record<string, boolean> = {};
        // Expand all pitches by default
        INTERVIEW_SECTIONS.filter(sec => sec.group === "Pitchs").forEach(sec => { expanded[sec.key] = true; });
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

  const sectionCount = Object.keys(sections).length;
  const pitchCount = INTERVIEW_SECTIONS.filter(s => s.group === "Pitchs" && sections[s.key]).length;
  const questionsCount = INTERVIEW_SECTIONS.filter(s => s.group === "Questions" && sections[s.key]).length;
  const readyPitchCount = INTERVIEW_SECTIONS.filter(s => s.group === "Pitchs" && sections[s.key] && sections[s.key].length > 50).length;

  // Group sections
  const groupedSections = GROUPS_ORDER.map(groupKey => {
    const visual = SECTION_GROUP_VISUALS[groupKey];
    const items = INTERVIEW_SECTIONS.filter(s => getSectionGroup(s.key) === groupKey);
    return { groupKey, visual, items };
  }).filter(g => g.items.some(item => sections[item.key]));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/entretiens")}
          className="flex items-center gap-2 text-sm font-medium transition-all hover:brightness-110"
          style={{ color: "var(--prsto-forest)" }}>
          <ChevronLeft size={15} /> Toutes les préparations
        </button>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}20` }}>
            <CheckCircle2 size={13} /> {st.label}
          </span>
          <button onClick={handleDelete}
            className="p-2 rounded-lg border transition-colors hover:bg-red-50"
            style={{ borderColor: "var(--bordure)", color: "var(--erreur)" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div className="px-4 py-2.5 rounded-lg text-sm font-sans border flex items-center gap-2"
          style={{
            background: msg.type === "ok" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
            color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)",
            borderColor: msg.type === "ok" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)",
          }}>
          {msg.type === "ok" ? <CheckCheck size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Hero — Brand card */}
      <div className="relative rounded-xl border overflow-hidden"
        style={{
          background: "var(--fond-surface)",
          borderColor: "var(--bordure)",
          boxShadow: "0 1px 3px rgba(16,56,38,0.04)",
        }}>
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--prsto-forest), var(--or), var(--prsto-forest))" }} />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>
                {opp?.title || "Sans opportunité"}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--texte-secondaire)" }}>
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} /> {opp?.company}
                </span>
                {opp?.country && (
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} /> {opp.country}
                  </span>
                )}
                {opp?.contractType && (
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} /> {opp.contractType}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(iv.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
            {opp?.score && (
              <div className="flex flex-col items-center px-4 py-2.5 rounded-xl"
                style={{ background: "var(--or-faible)", border: "1px solid rgba(228,177,24,0.15)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--or)" }}>{opp.score}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--prsto-muted)" }}>Score</span>
              </div>
            )}
          </div>

          {/* Stats bar — premium pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { icon: FileText, label: "Sections", value: `${sectionCount}/24`, color: "var(--prsto-forest)" },
              { icon: Sparkles, label: "Pitchs", value: `${pitchCount}/6`, color: "var(--or)" },
              { icon: BookOpen, label: "Questions", value: `${questionsCount}`, color: "var(--prsto-sage)" },
              { icon: Target, label: "Prêts", value: `${readyPitchCount}/6`, color: "var(--succes)" },
            ].map(stat => (
              <div key={stat.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "var(--fond-eleve)",
                  border: "1px solid var(--bordure)",
                }}>
                <stat.icon size={13} style={{ color: stat.color }} />
                <span style={{ color: "var(--texte-secondaire)" }}>{stat.label}</span>
                <span className="font-semibold" style={{ color: "var(--texte)" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions bar — brand toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl border"
        style={{
          background: "var(--fond-surface)",
          borderColor: "var(--bordure)",
          boxShadow: "0 1px 2px rgba(16,56,38,0.03)",
        }}>
        <div className="flex gap-1">
          {(["preparation", "notes", "source"] as const).map(t => {
            const Icon = t === "preparation" ? FileText : t === "notes" ? BookOpen : ListChecks;
            return (
              <button key={t} onClick={() => setTab(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-150"
                style={{
                  background: tab === t ? "var(--or-faible)" : "transparent",
                  color: tab === t ? "var(--or)" : "var(--texte-tertiaire)",
                  border: tab === t ? "1px solid rgba(228,177,24,0.15)" : "1px solid transparent",
                }}>
                <Icon size={12} />
                {t === "preparation" ? "Préparation" : t === "notes" ? "Notes" : "Source"}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:brightness-110"
            style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
            {editing ? <Save size={13} /> : <Edit3 size={13} />}
            {editing ? "Verrouiller" : "Modifier"}
          </button>
          {editing && (
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all hover:brightness-110"
              style={{ background: "var(--prsto-forest)", color: "#FFF" }}>
              <CheckCircle2 size={13} /> Sauvegarder
            </button>
          )}
          {!editing && iv.status !== "pret" && (
            <button onClick={handleMarkReady}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all hover:brightness-110"
              style={{ background: "var(--succes)", color: "#FFF" }}>
              <CheckCircle2 size={13} /> Marquer prêt
            </button>
          )}
          {iv.status === "pret" && (
            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border opacity-40 cursor-not-allowed"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
              <CheckCircle2 size={13} /> Prêt
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {tab === "preparation" && (
        editing ? (
          <textarea value={preparation} onChange={e => setPreparation(e.target.value)}
            className="w-full p-5 text-sm leading-relaxed font-sans resize-y rounded-xl border"
            style={{
              background: "var(--fond-surface)", color: "var(--texte)",
              borderColor: "var(--or)", minHeight: "60vh",
            }} />
        ) : sectionCount > 0 ? (
          <div className="space-y-4">
            {/* PITCH STUDIO — Premium brand cards */}
            <div className="rounded-xl border p-5 space-y-4"
              style={{
                background: "var(--fond-surface)",
                borderColor: "var(--bordure)",
              }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--or-faible)" }}>
                  <Sparkles size={14} style={{ color: "var(--or)" }} />
                </div>
                <h3 className="text-sm font-bold tracking-tight" style={{ color: "var(--texte)" }}>
                  Pitch Studio
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(228,177,24,0.1)", color: "var(--or)" }}>
                  {readyPitchCount}/{pitchCount} prêts
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PITCH_ROLES.map(pitch => {
                  const content = sections[pitch.key];
                  if (!content) return null;
                  const isExpanded = expanded[pitch.key] ?? false;
                  const wordCount = content.split(/\s+/).length;
                  return (
                    <div key={pitch.key}
                      className="relative rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.02] group"
                      style={{
                        background: pitch.gradient,
                        borderColor: isExpanded ? pitch.borderColor : "var(--bordure)",
                      }}>
                      {/* Top accent line */}
                      <div className="h-0.5 w-full" style={{ background: pitch.borderColor }} />

                      <div className="p-3 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: `${pitch.borderColor}15` }}>
                              <pitch.icon size={13} style={{ color: pitch.borderColor }} />
                            </div>
                            <div>
                              <div className="text-xs font-bold" style={{ color: "var(--texte)" }}>
                                {pitch.label}
                              </div>
                              <div className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                                {pitch.role}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${pitch.borderColor}12`, color: pitch.borderColor }}>
                            {pitch.duration}
                          </span>
                        </div>

                        {/* Description + count */}
                        <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                          {pitch.description} · {wordCount} mots
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button onClick={() => toggleExpand(pitch.key)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded transition-all"
                            style={{
                              background: isExpanded ? `${pitch.borderColor}15` : "var(--fond-eleve)",
                              color: isExpanded ? pitch.borderColor : "var(--texte-tertiaire)",
                            }}>
                            {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            {isExpanded ? "Réduire" : "Lire"}
                          </button>
                          <button onClick={() => handleCopy(content)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded transition-all opacity-0 group-hover:opacity-100"
                            style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>
                            <Copy size={10} /> Copier
                          </button>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="pt-3 border-t" style={{ borderColor: `${pitch.borderColor}15` }}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                              style={{ color: "var(--texte-secondaire)", lineHeight: 1.7 }}>
                              {content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section accordion by group */}
            {groupedSections.map(({ groupKey, visual, items }) => {
              const Icon = visual.icon;
              const hasVisibleItems = items.some(item => sections[item.key]);
              if (!hasVisibleItems) return null;
              const groupExpanded = activeGroup === groupKey;
              const filledCount = items.filter(item => sections[item.key]).length;

              return (
                <div key={groupKey} className="rounded-xl border overflow-hidden transition-all duration-200"
                  style={{
                    background: "var(--fond-surface)",
                    borderColor: groupExpanded ? visual.color : "var(--bordure)",
                    boxShadow: groupExpanded ? "0 1px 3px rgba(16,56,38,0.04)" : "none",
                  }}>
                  {/* Group header */}
                  <button
                    onClick={() => setActiveGroup(activeGroup === groupKey ? null : groupKey)}
                    className="w-full flex items-center justify-between p-4 transition-colors hover:bg-[rgba(16,56,38,0.02)]"
                    style={{ color: "var(--texte)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${visual.color}12` }}>
                        <Icon size={14} style={{ color: visual.color }} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold" style={{ color: "var(--texte)" }}>
                          {visual.label}
                        </div>
                        <div className="text-[11px] font-medium" style={{ color: "var(--texte-tertiaire)" }}>
                          {filledCount} section{filledCount > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={15}
                      style={{
                        color: "var(--texte-tertiaire)",
                        transform: groupExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s ease",
                      }} />
                  </button>

                  {/* Sections inside group */}
                  {groupExpanded && (
                    <div className="px-4 pb-4 space-y-1.5">
                      {items.map(item => {
                        const content = sections[item.key];
                        if (!content) return null;
                        const isExpanded = expanded[item.key] ?? false;
                        return (
                          <div key={item.key}
                            className="rounded-lg border transition-all duration-150"
                            style={{
                              background: "var(--fond)",
                              borderColor: isExpanded ? visual.color : "var(--bordure-douce)",
                            }}>
                            <div className="flex items-center justify-between p-3">
                              <button
                                onClick={() => toggleExpand(item.key)}
                                className="flex items-center gap-2.5 flex-1 text-left"
                                style={{ color: "var(--texte)" }}>
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ background: visual.dotColor }} />
                                <span className="text-sm font-medium">{item.label}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleCopy(content)}
                                  className="p-1.5 rounded transition-colors hover:bg-[rgba(16,56,38,0.04)]"
                                  style={{ color: "var(--texte-tertiaire)" }}>
                                  <Copy size={12} />
                                </button>
                                <button onClick={() => toggleExpand(item.key)}
                                  className="p-1.5 rounded transition-colors hover:bg-[rgba(16,56,38,0.04)]"
                                  style={{ color: "var(--texte-tertiaire)" }}>
                                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="px-3 pb-3 border-t"
                                style={{ borderColor: "var(--bordure-douce)" }}>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans mt-3"
                                  style={{ color: "var(--texte-secondaire)", lineHeight: 1.7 }}>
                                  {content}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-dashed"
            style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ background: "var(--or-faible)" }}>
              <FileText size={22} style={{ color: "var(--or)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--texte)" }}>
              Aucune préparation générée
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
              Générez une préparation depuis le Studio Entretien.
            </p>
          </div>
        )
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <div className="rounded-xl border p-6 space-y-5"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: "Type", value: iv.type === "entretien" ? "Entretien" : iv.type },
              { label: "Statut", value: st.label, color: st.color },
              iv.date && { label: "Date", value: new Date(iv.date).toLocaleDateString("fr-FR") },
              iv.interviewer && { label: "Interviewer", value: iv.interviewer },
            ].filter(Boolean).map((item: any) => (
              <div key={item.label} className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
                  {item.label}
                </span>
                <p className="text-base font-medium" style={{ color: item.color || "var(--texte)" }}>
                  {item.value || "—"}
                </p>
              </div>
            ))}
          </div>
          {iv.notes && (
            <div className="border-t pt-5" style={{ borderColor: "var(--bordure-douce)" }}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--texte-tertiaire)" }}>
                Notes personnelles
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--texte-secondaire)", lineHeight: 1.7 }}>
                {iv.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Source tab */}
      {tab === "source" && (
        <div className="rounded-xl border p-6 space-y-5"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <h3 className="text-sm font-bold tracking-tight" style={{ color: "var(--texte)" }}>
            Sources de la préparation
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Préparation pour", value: `${opp?.title} — ${opp?.company}` },
              { label: "Sections générées", value: `${INTERVIEW_SECTIONS.length}` },
              { label: "Moteur", value: "PRSTO Template Engine v1.0" },
              { label: "Créé le", value: new Date(iv.createdAt).toLocaleString("fr-FR") },
              { label: "Profil candidat", value: "Profil, CV Maître, Proof Vault" },
              { label: "Analyse offre", value: "Opportunité, Analyse, Documents" },
            ].map(src => (
              <div key={src.label} className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
                  {src.label}
                </span>
                <p className="text-sm" style={{ color: "var(--texte)" }}>{src.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 text-sm p-4 rounded-xl"
            style={{ background: "rgba(228,177,24,0.06)", border: "1px solid rgba(228,177,24,0.1)" }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--or)" }} />
            <span style={{ color: "var(--texte-secondaire)", lineHeight: 1.5 }}>
              Vérifiez chaque section avant l&apos;entretien. Les données viennent de votre profil et de l&apos;offre.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
