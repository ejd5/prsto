"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, Send, Bell, RefreshCw, MessageCircle, Briefcase, Trophy, XCircle,
  Archive, Copy, CheckCircle2, AlertTriangle, ExternalLink, Eye, FileText, Sparkles,
  UserPlus, MousePointer, Building2, Zap, FlaskConical, HelpCircle,
} from "lucide-react";

const SOURCE_STYLES: Record<string, { label: string; color: string; bg: string; icon: React.FC<{size?:number}> }> = {
  browser:   { label: "Manuel",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: MousePointer },
  ats:       { label: "ATS",       color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: Building2 },
  "firecrawl-safe": { label: "Firecrawl", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: Zap },
  fixture:   { label: "Test",      color: "#808080", bg: "rgba(128,128,128,0.10)", icon: FlaskConical },
  fallback:  { label: "Inconnu",   color: "#9ca3af", bg: "rgba(156,163,175,0.10)", icon: HelpCircle },
};
import { isDemoFromParams, DEMO_BADGE_TEXT, withDemoParam } from "@/lib/jobs/demo-data";
import { getScoreColor } from "@/lib/score-colors";

interface PipelineItem {
  id: string; jobId: string; status: string; pipelineStatus: string | null;
  matchScore: number | null; sentAt: string | null; followUpDueAt: string | null;
  followedUpAt: string | null; recruiterRepliedAt: string | null;
  interviewAt: string | null; lastPipelineActionAt: string | null;
  jobTitle: string; jobCompany: string | null; jobLocation: string | null;
  sourceUrl: string | null; sourceName: string | null; sourceType: string | null; globalScore: number | null;
  contact?: { id: string; fullName: string; contactType: string; firmName?: string | null; companyName?: string | null } | null;
  hasInterviewPrep?: boolean;
  interviewPrepId?: string | null;
  interviewPrepStatus?: string | null;
}

interface PipelineStats { imported: number; sent: number; toFollowUp: number; followedUp: number; recruiterReplied: number; interview: number; offer: number; rejected: number; archived: number; total: number; }

interface FollowUpMessages { emailCourt: string; messageLinkedin: string; relanceFormelle: string; relanceUltraCourte: string; }

const COLUMNS = [
  { key: "imported", label: "À traiter", icon: FileText, color: "#3b82f6", description: "Offres importées — prêtes à préparer" },
  { key: "sent", label: "Envoyées", icon: Send, color: "#B8860B", description: "Candidatures envoyées — en attente de retour" },
  { key: "toFollowUp", label: "À relancer", icon: Bell, color: "#f59e0b", description: "Relance due (7+ jours après envoi)" },
  { key: "followedUp", label: "Relancées", icon: RefreshCw, color: "#6366f1", description: "Relance envoyée — en attente de réponse" },
  { key: "recruiterReplied", label: "Réponse reçue", icon: MessageCircle, color: "#06b6d4", description: "Le recruteur a répondu" },
  { key: "interview", label: "Entretien", icon: Briefcase, color: "#8b5cf6", description: "Entretien programmé ou effectué" },
  { key: "offer", label: "Offre", icon: Trophy, color: "#22c55e", description: "Offre reçue — décision à prendre" },
  { key: "rejected", label: "Refusées", icon: XCircle, color: "#ef4444", description: "Candidature refusée ou sans suite" },
  { key: "archived", label: "Archivées", icon: Archive, color: "#808080", description: "Archivées — hors circuit actif" },
];

function getItemsForColumn(items: PipelineItem[], colKey: string): PipelineItem[] {
  const now = new Date();
  switch (colKey) {
    case "imported":
      return items.filter((i) => i.pipelineStatus === "imported");
    case "sent":
      return items.filter((i) => {
        if (i.pipelineStatus === "sent" && (!i.followUpDueAt || new Date(i.followUpDueAt) > now)) return true;
        return false;
      });
    case "toFollowUp":
      return items.filter((i) => {
        if (i.pipelineStatus === "sent" && i.followUpDueAt && new Date(i.followUpDueAt) <= now) return true;
        return false;
      });
    case "followedUp":
      return items.filter((i) => i.pipelineStatus === "followed_up");
    case "recruiterReplied":
      return items.filter((i) => i.pipelineStatus === "recruiter_replied");
    case "interview":
      return items.filter((i) => i.pipelineStatus === "interview");
    case "offer":
      return items.filter((i) => i.pipelineStatus === "offer");
    case "rejected":
      return items.filter((i) => i.pipelineStatus === "rejected");
    case "archived":
      return items.filter((i) => i.pipelineStatus === "archived");
    default:
      return [];
  }
}

export default function PipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoActive = isDemoFromParams(searchParams);
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [followUpModal, setFollowUpModal] = useState<PipelineItem | null>(null);
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessages | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const demoQuery = `?demo=${demoActive ? "true" : "false"}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/jobs/application-pipeline${demoQuery}`);
      const data = await r.json();
      if (data.success) {
        setItems(data.items);
        setStats(data.stats);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [demoQuery]);

  // Chargement initial — fetch inline pour éviter setState synchrone dans l'effet
  // (loading démarre à true donc pas besoin de setLoading(true) ici)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs/application-pipeline${demoQuery}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setItems(data.items);
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [demoQuery]);

  /* ─── Actions pipeline ─── */
  const pipelineAction = async (draftId: string, action: string, extra?: Record<string, unknown>) => {
    setBusy(draftId + action);
    try {
      await fetch(`/api/application-drafts/${draftId}/pipeline-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      await load();
    } catch { /* ignore */ }
    setBusy(null);
  };

  /* ─── Préparation entretien depuis Pipeline ─── */
  const createPrepFromPipeline = async (item: PipelineItem) => {
    setBusy(`prep-${item.id}`);
    try {
      const r = await fetch(`/api/application-drafts/${item.id}/interview-prep`, { method: "POST" });
      const data = await r.json();
      if (data.prepId) {
        router.push(withDemoParam(`/dashboard/jobs/interview-prep/${data.prepId}`, demoActive));
        return;
      }
    } catch { /* ignore */ }
    setBusy(null);
    // Si la création échoue, rafraîchir pour refléter un éventuel changement d'état
    await load();
    setBusy(null);
  };

  /* ─── Génération relance ─── */
  const generateFollowUp = async (draftId: string) => {
    setFollowUpLoading(true);
    try {
      const r = await fetch(`/api/application-drafts/${draftId}/follow-up/generate`, { method: "POST" });
      const data = await r.json();
      if (data.success && data.messages) {
        setFollowUpMessages(data.messages);
      }
    } catch { /* ignore */ }
    setFollowUpLoading(false);
  };

  const openFollowUpModal = (item: PipelineItem) => {
    setFollowUpModal(item);
    setFollowUpMessages(null);
    generateFollowUp(item.id);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => { /* ignore */ });
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) <= new Date();
  };

  /* ─── Render ─── */
  return (
    <div className="p-6 max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Pipeline Missions</h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {stats ? `${stats.total} candidature${stats.total !== 1 ? "s" : ""} dans le pipeline missions` : "Chargement..."}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
            Suivez chaque candidature depuis l&apos;envoi jusqu&apos;à la réponse, l&apos;entretien ou l&apos;offre.
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* ─── Badge mode démo ─── */}
      {demoActive && (
        <div className="px-3 py-2 rounded-md text-xs font-mono border flex items-center justify-between gap-2"
          style={{ borderColor: "#8b5cf6", background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={12} />
            <span>{DEMO_BADGE_TEXT}</span>
          </div>
          <a href="/dashboard/jobs/pipeline" className="flex items-center gap-1 text-[10px]"
            style={{ color: "#8b5cf6", textDecoration: "none" }}>
            <XCircle size={10} /> Quitter
          </a>
        </div>
      )}

      {/* Avertissement */}
      <div className="px-3 py-2 rounded-md text-xs font-mono border flex items-center gap-2" style={{ background: "var(--fond-eleve)", borderColor: "var(--bordure-douce)", color: "var(--texte-tertiaire)" }}>
        <AlertTriangle size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
        PRSTO ne postule ni ne relance jamais à votre place. Vous copiez, vous envoyez, vous marquez.
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {COLUMNS.map((col) => {
            const count = stats[col.key as keyof PipelineStats] as number;
            return (
              <div key={col.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono flex-shrink-0" style={{ borderColor: col.color, background: `${col.color}10` }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                <span style={{ color: "var(--texte)" }}>{col.label}</span>
                <span className="font-bold" style={{ color: col.color }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Alerte relances dues */}
      {stats && stats.toFollowUp > 0 && (
        <div className="p-4 rounded-lg border flex items-center gap-3 animate-pulse" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
          <Bell size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>
              {stats.toFollowUp} candidature{stats.toFollowUp > 1 ? "s" : ""} à relancer aujourd&apos;hui
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>
              Ouvrez une carte et cliquez sur &quot;Relance&quot; pour générer un message de suivi. Aucun envoi automatique.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      )}

      {/* Kanban */}
      {!loading && (
        <div className="overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          <div className="flex gap-3" style={{ minWidth: COLUMNS.length * 230 }}>
            {COLUMNS.map((col) => {
              const colItems = getItemsForColumn(items, col.key);
              const Icon = col.icon;
              return (
                <div key={col.key} className="flex-shrink-0 rounded-lg border" style={{ width: 230, background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                  {/* Column header */}
                  <div className="p-2.5 border-b" style={{ borderColor: "var(--bordure-douce)" }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon size={13} style={{ color: col.color }} />
                      <span className="text-xs font-mono font-bold" style={{ color: "var(--texte)" }}>{col.label}</span>
                      <span className="text-xs font-mono tabular-nums ml-auto" style={{ color: "var(--texte-tertiaire)" }}>{colItems.length}</span>
                    </div>
                    <p className="text-[10px] leading-tight" style={{ color: "var(--texte-tertiaire)" }}>{col.description}</p>
                  </div>
                  {/* Cards */}
                  <div className="p-1.5 space-y-1.5 max-h-[calc(100vh-360px)] overflow-y-auto">
                    {colItems.map((item) => {
                      const score = item.globalScore ?? item.matchScore ?? 0;
                      const overdue = item.pipelineStatus === "sent" && isOverdue(item.followUpDueAt);
                      return (
                        <div key={item.id}
                          onClick={() => router.push(withDemoParam(`/dashboard/jobs/applications/${item.id}`, demoActive))}
                          className="rounded-md border p-2.5 space-y-1.5 text-xs cursor-pointer transition-all hover:shadow-md"
                          style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure-douce)"; }}>
                          {/* Score + source */}
                          <div className="flex items-center justify-between">
                            {score > 0 && (
                              <span className="font-mono text-xs font-bold" style={{ color: getScoreColor(score) }}>
                                {score}%
                              </span>
                            )}
                            {item.sourceName && (() => {
                              const st = SOURCE_STYLES[item.sourceType || ""] || SOURCE_STYLES.fallback;
                              const SIcon = st.icon;
                              return (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1 rounded font-mono flex-shrink-0" style={{ background: st.bg, color: st.color }}>
                                  <SIcon size={9} />
                                  {item.sourceName}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Titre + entreprise */}
                          <div>
                            <p className="font-bold leading-tight text-xs" style={{ color: "var(--texte)" }}>{item.jobTitle}</p>
                            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{item.jobCompany || "—"}</p>
                          </div>

                          {/* Contact lié */}
                          {item.contact && (
                            <div className="text-[10px] pt-1 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
                              <a href={`/dashboard/jobs/crm/contacts/${item.contact.id}`} onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1" style={{ color: "var(--texte-tertiaire)", textDecoration: "none" }}>
                                <UserPlus size={9} style={{ color: "#8b5cf6" }} />
                                <span style={{ color: "var(--texte-secondaire)" }}>{item.contact.fullName}</span>
                                {item.contact.firmName && <span style={{ color: "var(--or)" }}>· {item.contact.firmName}</span>}
                              </a>
                            </div>
                          )}

                          {/* Dates */}
                          <div className="space-y-0.5 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                            <p>Envoyé : {formatDate(item.sentAt)}</p>
                            {item.pipelineStatus === "sent" && (
                              <p className="flex items-center gap-0.5" style={{ color: overdue ? "#ef4444" : "var(--texte-tertiaire)" }}>
                                {overdue && <AlertTriangle size={8} />}
                                Relance due : {formatDate(item.followUpDueAt)}
                              </p>
                            )}
                            {item.pipelineStatus === "followed_up" && <p>Relancé : {formatDate(item.followedUpAt)}</p>}
                            {item.pipelineStatus === "recruiter_replied" && <p>Réponse : {formatDate(item.recruiterRepliedAt)}</p>}
                            {item.pipelineStatus === "interview" && <p>Entretien : {formatDate(item.interviewAt)}</p>}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-1 pt-1 border-t" style={{ borderColor: "var(--bordure-douce)" }} onClick={e => e.stopPropagation()}>
                            {/* Voir dossier */}
                            <button onClick={() => router.push(withDemoParam(`/dashboard/jobs/applications/${item.id}`, demoActive))}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                              <Eye size={10} /> Dossier
                            </button>

                            {/* Préparation entretien (colonne interview) */}
                            {item.pipelineStatus === "interview" && item.hasInterviewPrep && item.interviewPrepId && (
                              <button onClick={() => router.push(withDemoParam(`/dashboard/jobs/interview-prep/${item.interviewPrepId}`, demoActive))}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono border" style={{ borderColor: "#22c55e", color: "#22c55e" }}>
                                <CheckCircle2 size={10} /> Préparation prête
                              </button>
                            )}
                            {item.pipelineStatus === "interview" && !item.hasInterviewPrep && (
                              <button onClick={() => createPrepFromPipeline(item)}
                                disabled={busy === `prep-${item.id}`}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono border" style={{ borderColor: "#8b5cf6", color: "#8b5cf6", opacity: busy === `prep-${item.id}` ? 0.5 : 1 }}>
                                {busy === `prep-${item.id}` ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
                                Préparer entretien
                              </button>
                            )}

                            {/* URL source */}
                            {item.sourceUrl && (
                              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)", textDecoration: "none" }}>
                                <ExternalLink size={10} /> URL
                              </a>
                            )}

                            {/* Générer relance (colonnes sent / toFollowUp) */}
                            {["sent", "toFollowUp", "followed_up"].includes(item.pipelineStatus || "") && (
                              <button onClick={() => openFollowUpModal(item)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono border" style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}>
                                <Bell size={10} /> Relance
                              </button>
                            )}

                            {/* Actions par colonne */}
                            <PipelineActions item={item} busy={busy} onAction={pipelineAction} />
                          </div>
                        </div>
                      );
                    })}
                    {colItems.length === 0 && (
                      <div className="p-3 text-xs text-center font-mono" style={{ color: "var(--texte-tertiaire)" }}>—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal génération relance */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setFollowUpModal(null)}>
          <div className="rounded-lg border shadow-2xl p-5 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Message de relance</h3>
                <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                  {followUpModal.jobTitle} — {followUpModal.jobCompany}
                </p>
              </div>
              <button onClick={() => setFollowUpModal(null)}
                className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}>
                <XCircle size={16} />
              </button>
            </div>

            {/* Avertissement */}
            <div className="px-3 py-2 rounded border text-xs mb-4 flex items-center gap-2" style={{ borderColor: "#f59e0b", background: "rgba(245,158,11,0.05)", color: "#f59e0b" }}>
              <AlertTriangle size={12} />
              Ce texte n&apos;est jamais envoyé automatiquement. Copiez-le et envoyez-le vous-même.
            </div>

            {/* Loading */}
            {followUpLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
              </div>
            )}

            {/* Messages */}
            {followUpMessages && !followUpLoading && (
              <div className="space-y-4">
                {[
                  { key: "emailCourt", label: "Email court", icon: Send },
                  { key: "messageLinkedin", label: "Message LinkedIn", icon: MessageCircle },
                  { key: "relanceFormelle", label: "Relance formelle", icon: FileText },
                  { key: "relanceUltraCourte", label: "Relance ultra courte", icon: Bell },
                ].map(({ key, label, icon: Icon }) => {
                  const text = followUpMessages[key as keyof FollowUpMessages] || "";
                  if (!text) return null;
                  return (
                    <div key={key} className="p-3 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: "var(--or)" }}>
                          <Icon size={11} /> {label}
                        </h4>
                        <button onClick={() => handleCopy(text, key)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border"
                          style={{ borderColor: copiedKey === key ? "#22c55e" : "var(--bordure)", color: copiedKey === key ? "#22c55e" : "var(--texte-secondaire)" }}>
                          {copiedKey === key ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                          {copiedKey === key ? "Copié" : "Copier"}
                        </button>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--texte)" }}>{text}</pre>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions footer */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
              <button onClick={() => setFollowUpModal(null)}
                className="px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                Fermer
              </button>
              {["sent", "toFollowUp"].includes(followUpModal.pipelineStatus || "") && (
                <button onClick={() => { pipelineAction(followUpModal.id, "mark_followed_up"); setFollowUpModal(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border" style={{ borderColor: "#6366f1", color: "#6366f1" }}>
                  <RefreshCw size={11} /> Marquer comme relancé
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Composant actions par pipelineStatus ─── */
function PipelineActions({ item, busy, onAction }: {
  item: PipelineItem;
  busy: string | null;
  onAction: (draftId: string, action: string, extra?: Record<string, unknown>) => void;
}) {
  const isBusy = (action: string) => busy === item.id + action;

  const bt = (label: string, action: string, color: string, extra?: Record<string, unknown>) => (
    <button
      onClick={() => onAction(item.id, action, extra)}
      disabled={busy !== null}
      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono border"
      style={{ borderColor: color, color, opacity: busy !== null ? 0.4 : 1 }}>
      {isBusy(action) ? <Loader2 size={10} className="animate-spin" /> : null}
      {label}
    </button>
  );

  switch (item.pipelineStatus) {
    case "imported":
      return (
        <>
          {bt("Envoyé", "mark_sent", "#B8860B")}
          {bt("Refusé", "mark_rejected", "#ef4444")}
        </>
      );
    case "sent":
      return (
        <>
          {bt("Relancé", "mark_followed_up", "#6366f1")}
          {bt("Réponse", "mark_replied", "#06b6d4")}
          {bt("Refusé", "mark_rejected", "#ef4444")}
        </>
      );
    case "followed_up":
      return (
        <>
          {bt("Réponse", "mark_replied", "#06b6d4")}
          {bt("Entretien", "schedule_interview", "#8b5cf6")}
          {bt("Refusé", "mark_rejected", "#ef4444")}
        </>
      );
    case "recruiter_replied":
      return (
        <>
          {bt("Entretien", "schedule_interview", "#8b5cf6")}
          {bt("Offre", "mark_offer", "#22c55e")}
          {bt("Refusé", "mark_rejected", "#ef4444")}
        </>
      );
    case "interview":
      return (
        <>
          {bt("Offre", "mark_offer", "#22c55e")}
          {bt("Refusé", "mark_rejected", "#ef4444")}
        </>
      );
    case "offer":
    case "rejected":
      return (
        <>
          {bt("Archiver", "archive", "#808080")}
        </>
      );
    case "archived":
      return null;
    default:
      return null;
  }
}
