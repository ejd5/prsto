"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, RefreshCw, Send, Bell, MessageCircle, Briefcase, Trophy, XCircle,
  TrendingUp, Clock, BarChart3, Eye, AlertTriangle, Star, Sparkles,
} from "lucide-react";
import { isDemoFromParams, DEMO_BADGE_TEXT, withDemoParam } from "@/lib/jobs/demo-data";

interface AnalyticsSummary {
  totalSent: number; sentThisWeek: number; toFollowUp: number; followedUp: number;
  recruiterReplied: number; interviews: number; offers: number; rejected: number; archived: number;
  responseRate: number; interviewRate: number; offerRate: number; avgResponseDays: number | null;
}

interface BySource { source: string; sent: number; replied: number; interviews: number; offers: number; rejected: number; responseRate: number; }
interface ByScoreRange { range: string; sent: number; replied: number; interviews: number; offers: number; }
interface ByLocationPriority { priority: string; sent: number; replied: number; interviews: number; offers: number; }
interface WeeklyActivity { week: string; sent: number; followedUp: number; replied: number; }
interface FollowUpDue { draftId: string; jobTitle: string; company: string; sentAt: string; followUpDueAt: string; daysOverdue: number; source: string; score: number | null; }
interface TopCompany { company: string; sent: number; replied: number; interviews: number; offers: number; }
interface HighScoreNoReply { draftId: string; jobTitle: string; company: string; score: number; sentAt: string; daysWaiting: number; source: string; }

interface AnalyticsData {
  summary: AnalyticsSummary; bySource: BySource[]; byScoreRange: ByScoreRange[]; byLocationPriority: ByLocationPriority[];
  byPipelineStatus: { status: string; count: number }[]; weeklyActivity: WeeklyActivity[];
  topCompanies: TopCompany[]; followUpsDue: FollowUpDue[]; highScoreNoReply: HighScoreNoReply[];
}

const PIPELINE_LABELS: Record<string, string> = {
  sent: "Envoyé", followed_up: "Relancé", recruiter_replied: "Réponse reçue",
  interview: "Entretien", offer: "Offre", rejected: "Refusé", archived: "Archivé",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoActive = isDemoFromParams(searchParams);
  const demoQuery = `?demo=${demoActive ? "true" : "false"}`;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/jobs/application-analytics${demoQuery}`);
      const json = await r.json();
      if (json.success) setData(json as AnalyticsData);
    } catch { /* ignore */ }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoQuery]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  if (loading) return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Analytics candidatures</h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>Chargement...</p>
        </div>
      </div>
      {demoActive && (
        <div className="px-3 py-2 rounded-md text-xs font-mono border flex items-center justify-between gap-2"
          style={{ borderColor: "#8b5cf6", background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={12} />
            <span>{DEMO_BADGE_TEXT}</span>
          </div>
          <a href="/dashboard/jobs/analytics" className="flex items-center gap-1 text-[10px]"
            style={{ color: "#8b5cf6", textDecoration: "none" }}>
            <XCircle size={10} /> Quitter
          </a>
        </div>
      )}
      <div className="p-12 flex justify-center"><Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} /></div>
    </div>
  );

  const s = data?.summary;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Analytics candidatures</h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            {s ? `${s.totalSent} candidatures envoyées` : "Chargement..."}
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
          <a href="/dashboard/jobs/analytics" className="flex items-center gap-1 text-[10px]"
            style={{ color: "#8b5cf6", textDecoration: "none" }}>
            <XCircle size={10} /> Quitter
          </a>
        </div>
      )}

      {!data || !s ? (
        <div className="text-center py-16">
          <BarChart3 size={40} className="mx-auto mb-3" style={{ color: "var(--texte-tertiaire)" }} />
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>Aucune donnée disponible.</p>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Envoyez des candidatures pour voir les analytics.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b pb-2 overflow-x-auto" style={{ borderColor: "var(--bordure-douce)" }}>
            {[
              { key: "overview", label: "Vue d'ensemble" },
              { key: "sources", label: "Par source" },
              { key: "scores", label: "Par score" },
              { key: "activity", label: "Activité" },
              { key: "alerts", label: "Alertes" },
            ].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-colors"
                style={{ background: activeTab === t.key ? "var(--or)" : "transparent", color: activeTab === t.key ? "#000" : "var(--texte-secondaire)" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Tab: Overview ─── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KPICard icon={Send} label="Envoyées" value={s.totalSent} sub={`+${s.sentThisWeek} cette semaine`} color="#B8860B" />
                <KPICard icon={Bell} label="À relancer" value={s.toFollowUp} sub="relance due" color="#f59e0b" />
                <KPICard icon={MessageCircle} label="Réponses" value={s.recruiterReplied} sub={`${s.responseRate}% de taux`} color="#06b6d4" />
                <KPICard icon={Briefcase} label="Entretiens" value={s.interviews} sub={`${s.interviewRate}% des réponses`} color="#8b5cf6" />
                <KPICard icon={Trophy} label="Offres" value={s.offers} sub={`${s.offerRate}% des entretiens`} color="#22c55e" />
                <KPICard icon={Clock} label="Délai moyen" value={s.avgResponseDays ? `${s.avgResponseDays}j` : "—"} sub="avant réponse" color="#6366f1" />
              </div>

              {/* Funnel */}
              <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
                <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><TrendingUp size={12} /> Entonnoir de candidature</h3>
                <div className="space-y-2">
                  <FunnelBar label="Envoyées" value={s.totalSent} max={s.totalSent || 1} color="#B8860B" />
                  <FunnelBar label="Relancées" value={s.followedUp} max={s.totalSent || 1} color="#6366f1" />
                  <FunnelBar label="Réponses" value={s.recruiterReplied} max={s.totalSent || 1} color="#06b6d4" />
                  <FunnelBar label="Entretiens" value={s.interviews} max={s.totalSent || 1} color="#8b5cf6" />
                  <FunnelBar label="Offres" value={s.offers} max={s.totalSent || 1} color="#22c55e" />
                </div>
              </div>

              {/* Insights */}
              {s.totalSent > 0 && (
                <div className="p-4 rounded-lg border space-y-2" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
                  <h3 className="text-xs font-mono uppercase mb-2 flex items-center gap-1.5" style={{ color: "var(--or)" }}><Sparkles size={12} /> Insights</h3>
                  <div className="space-y-1.5">
                    <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                      <span className="font-bold" style={{ color: "var(--texte)" }}>{s.recruiterReplied + s.interviews + s.offers} réponses</span> reçues sur {s.totalSent} candidatures envoyées.
                    </p>
                    {s.interviews > 0 && (
                      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                        <span className="font-bold" style={{ color: "var(--texte)" }}>{s.interviews} entretien{s.interviews > 1 ? "s" : ""}</span> planifié{s.interviews > 1 ? "s" : ""}.
                      </p>
                    )}
                    {s.offers > 0 && (
                      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                        <span className="font-bold" style={{ color: "#22c55e" }}>{s.offers} offre{s.offers > 1 ? "s" : ""} reçue{s.offers > 1 ? "s" : ""}</span>.
                      </p>
                    )}
                    {s.toFollowUp > 0 && (
                      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                        <span className="font-bold" style={{ color: "#f59e0b" }}>Priorité : relancer {s.toFollowUp} candidature{s.toFollowUp > 1 ? "s" : ""}</span> sans réponse après 7 jours.
                      </p>
                    )}
                    <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                      <span className="font-bold" style={{ color: "var(--texte)" }}>Taux de réponse : {s.responseRate}%</span>{s.responseRate >= 30 ? " — bon niveau d&apos;engagement." : " — configurez vos relances pour améliorer ce taux."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab: Sources ─── */}
          {activeTab === "sources" && (
            <div className="space-y-4">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bordure)" }}>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--bordure)", background: "var(--fond-eleve)" }}>
                      <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Source</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Envoyées</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Réponses</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entretiens</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Offres</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Taux rép.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySource.length > 0 ? data.bySource.map((src, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}>
                        <td className="p-2.5 font-medium" style={{ color: "var(--texte)" }}>{src.source}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte)" }}>{src.sent}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{src.replied}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{src.interviews}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{src.offers}</td>
                        <td className="p-2.5 text-right" style={{ color: src.responseRate >= 50 ? "#22c55e" : src.responseRate >= 25 ? "#f59e0b" : "var(--texte-tertiaire)" }}>{src.responseRate}%</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="p-6 text-center" style={{ color: "var(--texte-tertiaire)" }}>Aucune donnée</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Par priorité géographique */}
              {data.byLocationPriority.length > 0 && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bordure)" }}>
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--bordure)", background: "var(--fond-eleve)" }}>
                        <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Zone</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Envoyées</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Réponses</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entretiens</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Offres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byLocationPriority.map((loc, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}>
                          <td className="p-2.5 font-medium" style={{ color: "var(--texte)" }}>{loc.priority}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte)" }}>{loc.sent}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{loc.replied}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{loc.interviews}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{loc.offers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab: Scores ─── */}
          {activeTab === "scores" && (
            <div className="space-y-4">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bordure)" }}>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--bordure)", background: "var(--fond-eleve)" }}>
                      <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Score</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Envoyées</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Réponses</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entretiens</th>
                      <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Offres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byScoreRange.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}>
                        <td className="p-2.5 font-medium" style={{ color: "var(--texte)" }}>{r.range}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte)" }}>{r.sent}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{r.replied}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{r.interviews}</td>
                        <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{r.offers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Tab: Activity ─── */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {/* Weekly chart */}
              {data.weeklyActivity.length > 0 ? (
                <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
                  <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><BarChart3 size={12} /> Activité hebdomadaire (8 semaines)</h3>
                  <div className="flex items-end gap-2" style={{ height: 120 }}>
                    {data.weeklyActivity.map((w, i) => {
                      const maxVal = Math.max(...data.weeklyActivity.map((x) => Math.max(x.sent, x.followedUp, x.replied)), 1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <div className="w-full flex flex-col items-center gap-0.5" style={{ height: 90, justifyContent: "flex-end" }}>
                            <div style={{ width: "100%", maxWidth: 24, height: `${(w.sent / maxVal) * 80}px`, background: "#B8860B", borderRadius: "2px 2px 0 0", opacity: 0.8 }} title={`Envoyées: ${w.sent}`} />
                            <div style={{ width: "100%", maxWidth: 24, height: `${(w.followedUp / maxVal) * 80}px`, background: "#6366f1", borderRadius: "2px 2px 0 0", opacity: 0.8 }} title={`Relancées: ${w.followedUp}`} />
                            <div style={{ width: "100%", maxWidth: 24, height: `${(w.replied / maxVal) * 80}px`, background: "#06b6d4", borderRadius: "2px 2px 0 0", opacity: 0.8 }} title={`Réponses: ${w.replied}`} />
                          </div>
                          <span className="text-[9px] font-mono truncate w-full text-center" style={{ color: "var(--texte-tertiaire)" }}>{w.week}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#B8860B" }} /> Envoyées</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#6366f1" }} /> Relancées</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#06b6d4" }} /> Réponses</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center py-8" style={{ color: "var(--texte-tertiaire)" }}>Aucune activité récente.</p>
              )}

              {/* Top companies */}
              <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
                <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><Star size={12} /> Top entreprises</h3>
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--bordure)" }}>
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--bordure)", background: "var(--fond-eleve)" }}>
                        <th className="text-left p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entreprise</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Env.</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Rép.</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Entr.</th>
                        <th className="text-right p-2.5" style={{ color: "var(--texte-tertiaire)" }}>Offres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCompanies.length > 0 ? data.topCompanies.map((c, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}>
                          <td className="p-2.5 font-medium" style={{ color: "var(--texte)" }}>{c.company}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte)" }}>{c.sent}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{c.replied}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{c.interviews}</td>
                          <td className="p-2.5 text-right" style={{ color: "var(--texte-secondaire)" }}>{c.offers}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="p-6 text-center" style={{ color: "var(--texte-tertiaire)" }}>Aucune donnée</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── Tab: Alerts ─── */}
          {activeTab === "alerts" && (
            <div className="space-y-5">
              {/* Follow-ups due */}
              <div className="p-4 rounded-lg border" style={{ borderColor: data.followUpsDue.length > 0 ? "#f59e0b" : "var(--bordure)", background: "var(--fond-surface)" }}>
                <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "#f59e0b" }}><Bell size={12} /> Relances dues ({data.followUpsDue.length})</h3>
                {data.followUpsDue.length > 0 ? (
                  <div className="space-y-1.5">
                    {data.followUpsDue.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" style={{ color: "var(--texte)" }}>{f.jobTitle}</p>
                          <p style={{ color: "var(--texte-secondaire)" }}>{f.company} · envoyé le {formatDate(f.sentAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-xs font-mono font-bold" style={{ color: "#ef4444" }}>+{f.daysOverdue}j</span>
                          <button onClick={() => router.push(withDemoParam(`/dashboard/jobs/applications/${f.draftId}`, demoActive))}
                            className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                            <Eye size={9} /> Dossier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-6" style={{ color: "var(--texte-tertiaire)" }}>Aucune relance en retard. 👏</p>
                )}
              </div>

              {/* High score no reply */}
              <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
                <h3 className="text-xs font-mono uppercase mb-3 flex items-center gap-1.5" style={{ color: "var(--or)" }}><AlertTriangle size={12} /> Candidatures à fort score sans réponse ({data.highScoreNoReply.length})</h3>
                {data.highScoreNoReply.length > 0 ? (
                  <div className="space-y-1.5">
                    {data.highScoreNoReply.map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate" style={{ color: "var(--texte)" }}>{h.jobTitle}</p>
                          <p style={{ color: "var(--texte-secondaire)" }}>{h.company} · {h.source} · il y a {h.daysWaiting}j</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="text-xs font-mono font-bold" style={{ color: h.score >= 75 ? "#22c55e" : "#f59e0b" }}>{h.score}%</span>
                          <button onClick={() => router.push(withDemoParam(`/dashboard/jobs/applications/${h.draftId}`, demoActive))}
                            className="flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "var(--or)", color: "var(--or)" }}>
                            <Eye size={9} /> Dossier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center py-6" style={{ color: "var(--texte-tertiaire)" }}>Toutes les candidatures à fort score ont reçu une réponse. 👏</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── KPI Card ─── */
function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Send; label: string; value: number | string; sub: string; color: string;
}) {
  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} style={{ color }} />
        <span className="text-[10px] font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{value}</p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{sub}</p>
    </div>
  );
}

/* ─── Funnel Bar ─── */
function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono w-20 text-right flex-shrink-0" style={{ color: "var(--texte-tertiaire)" }}>{label}</span>
      <div className="flex-1 h-5 rounded-sm relative" style={{ background: "var(--fond-eleve)" }}>
        <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, background: color, opacity: 0.7 }} />
      </div>
      <span className="text-xs font-mono font-bold w-10 flex-shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}
