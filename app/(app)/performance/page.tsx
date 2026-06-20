"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Send, AlertTriangle, CheckCircle2, Target,
  BarChart3, Globe, Users, Clock, PieChart, ArrowRight,
  Lightbulb, XCircle, FileText, Loader2, Zap, Star, Award,
} from "lucide-react";
import { getPerformanceData, type FullPerformanceData } from "@/lib/actions/performance";

export default function PerformancePage() {
  const router = useRouter();
  const [data, setData] = useState<FullPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"global" | "sources" | "roles" | "pays" | "bloquees" | "actions" | "recos">("global");

  useEffect(() => {
    getPerformanceData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
    <>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--or)" }} />
        <span className="ml-2 text-sm" style={{ color: "var(--texte-tertiaire)" }}>Calcul des performances...</span>
      </div>
    </>
    );
  }

  if (!data) return null;

  const { global, sourcePerformance, rolePerformance, countryPerformance, blocked, actions, recommendations } = data;

  const tabs = [
    { id: "global" as const, label: "Vue globale", icon: PieChart },
    { id: "sources" as const, label: "Sources", icon: Globe },
    { id: "roles" as const, label: "Rôles", icon: Users },
    { id: "pays" as const, label: "Pays", icon: Globe },
    { id: "bloquees" as const, label: `Bloquées (${blocked.length})`, icon: XCircle },
    { id: "actions" as const, label: `Aujourd'hui (${actions.length})`, icon: Zap },
    { id: "recos" as const, label: "Recommandations", icon: Lightbulb },
  ] as const;

  const badge = (v: number, unit?: string) => `${v}${unit || ""}`;

  const priorityColor = (p: string) =>
    p === "haute" ? "var(--erreur)" : p === "moyenne" ? "var(--or)" : "var(--texte-tertiaire)";

  const recColor = (t: string) =>
    t === "positif" ? "var(--succes)" : t === "alerte" ? "var(--erreur)" : t === "action" ? "var(--or)" : "var(--texte-tertiaire)";

  const recBg = (t: string) =>
    t === "positif" ? "rgba(34,197,94,0.08)" : t === "alerte" ? "rgba(239,68,68,0.08)" : t === "action" ? "rgba(245,158,11,0.08)" : "rgba(100,100,100,0.08)";

  const recBorder = (t: string) =>
    t === "positif" ? "rgba(34,197,94,0.25)" : t === "alerte" ? "rgba(239,68,68,0.25)" : t === "action" ? "rgba(245,158,11,0.25)" : "var(--bordure-douce)";

  const link = (href: string) => {
    router.push(href);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Performance</h1>
          <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
            Pilotage stratégique de votre recherche — données calculées localement, sans IA.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2" style={{ borderColor: "var(--bordure-douce)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors"
            style={{
              background: activeTab === t.id ? "var(--or-faible)" : "transparent",
              color: activeTab === t.id ? "var(--or)" : "var(--texte-tertiaire)",
              fontWeight: activeTab === t.id ? 700 : 400,
            }}>
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Vue globale ──────────────────────────── */}
      {activeTab === "global" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Offres totales" value={badge(global.totalOpportunites)} icon={Target} />
            <KpiCard label="Score moyen" value={`${global.scoreMoyen}/100`} icon={Star} />
            <KpiCard label="High priority" value={badge(global.highPriority)} icon={TrendingUp} color="var(--succes)" />
            <KpiCard label="À éviter" value={badge(global.aEviter)} icon={XCircle} color="var(--erreur)" />
            <KpiCard label="Analysées" value={badge(global.opportunitesAnalysees)} icon={BarChart3} />
            <KpiCard label="Documents générés" value={badge(global.documentsGeneres)} icon={FileText} />
            <KpiCard label="Docs approuvés" value={badge(global.documentsApprouves)} icon={CheckCircle2} color="var(--succes)" />
            <KpiCard label="Prêtes à envoyer" value={badge(global.candidaturesPretes)} icon={Send} color="var(--or)" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Envoyées" value={badge(global.candidaturesEnvoyees)} icon={Send} />
            <KpiCard label="Taux réponse" value={`${global.tauxReponse}%`} icon={TrendingUp}
              color={global.tauxReponse >= 30 ? "var(--succes)" : global.tauxReponse > 0 ? "var(--or)" : "var(--texte-tertiaire)"} />
            <KpiCard label="Taux entretien" value={`${global.tauxEntretien}%`} icon={Users}
              color={global.tauxEntretien >= 20 ? "var(--succes)" : global.tauxEntretien > 0 ? "var(--or)" : "var(--texte-tertiaire)"} />
            <KpiCard label="Relances à faire" value={badge(global.relancesAFaire)} icon={Clock} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Entretiens" value={badge(global.entretiens)} icon={Users} color="var(--succes)" />
            <KpiCard label="Offres reçues" value={badge(global.offresRecues)} icon={Award} color="var(--succes)" />
            <KpiCard label="Refus" value={badge(global.refus)} icon={XCircle} color="var(--erreur)" />
            <KpiCard label="En retard" value={badge(global.relancesEnRetard)} icon={AlertTriangle}
              color={global.relancesEnRetard > 0 ? "var(--erreur)" : "var(--succes)"} />
          </div>

          <div className="p-4 rounded-md border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Résumé</h3>
            <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
              {global.totalOpportunites} offres dans le radar • {global.opportunitesAnalysees} analysées • {global.documentsApprouves} documents approuvés •
              {" "}{global.candidaturesEnvoyees} envoyées • {global.entretiens} entretiens • {global.offresRecues} offres reçues.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
              Taux de réponse : {global.tauxReponse}% — Taux d&apos;entretien : {global.tauxEntretien}%.
              {global.tauxEntretien >= 25 && " Excellente performance !"}
              {global.tauxEntretien >= 10 && global.tauxEntretien < 25 && " Sur la bonne voie."}
              {global.tauxEntretien > 0 && global.tauxEntretien < 10 && " Besoin d'améliorer les candidatures."}
              {global.tauxEntretien === 0 && global.candidaturesEnvoyees > 0 && " Aucun entretien décroché — revoyez le CV et la lettre."}
            </p>
          </div>
        </div>
      )}

      {/* ─── Performance par source ───────────────── */}
      {activeTab === "sources" && (
        <div className="space-y-2">
          {sourcePerformance.length === 0 ? (
            <EmptyState message="Aucune donnée par source." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--bordure)" }}>
                    {["Source", "Offres", "Score moy.", "Analysées", "Docs", "Envoyées", "Réponses", "Entretiens", "Conv. %"].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-mono" style={{ color: "var(--texte-tertiaire)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sourcePerformance.map((s, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}
                      className="hover:brightness-95">
                      <td className="py-2 px-2 font-bold" style={{ color: "var(--texte)" }}>{s.source}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{s.nombreOffres}</td>
                      <td className="py-2 px-2" style={{ color: s.scoreMoyen >= 70 ? "var(--succes)" : s.scoreMoyen >= 40 ? "var(--or)" : "var(--texte-secondaire)" }}>{s.scoreMoyen}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{s.nombreAnalysees}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{s.documentsGeneres}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{s.candidaturesEnvoyees}</td>
                      <td className="py-2 px-2" style={{ color: s.reponses > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>{s.reponses}</td>
                      <td className="py-2 px-2" style={{ color: s.entretiens > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>{s.entretiens}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: s.tauxConversion >= 20 ? "var(--succes)" : s.tauxConversion > 0 ? "var(--or)" : "var(--texte-tertiaire)" }}>{s.tauxConversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Performance par rôle ─────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-2">
          {rolePerformance.length === 0 ? (
            <EmptyState message="Aucune donnée par rôle. Ajoutez des rôles prioritaires dans Paramètres." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--bordure)" }}>
                    {["Rôle", "Offres", "Score moy.", "High priority", "Docs", "Envoyées", "Entretiens", "Tx entretien"].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-mono" style={{ color: "var(--texte-tertiaire)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rolePerformance.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}
                      className="hover:brightness-95">
                      <td className="py-2 px-2 font-bold" style={{ color: r.role === "Autre" ? "var(--texte-tertiaire)" : "var(--texte)" }}>{r.role}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{r.nombreOffres}</td>
                      <td className="py-2 px-2" style={{ color: r.scoreMoyen >= 70 ? "var(--succes)" : r.scoreMoyen >= 40 ? "var(--or)" : "var(--texte-secondaire)" }}>{r.scoreMoyen}</td>
                      <td className="py-2 px-2" style={{ color: r.highPriority > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>{r.highPriority}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{r.documentsGeneres}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{r.envoyees}</td>
                      <td className="py-2 px-2" style={{ color: r.entretiens > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>{r.entretiens}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: r.tauxEntretien >= 15 ? "var(--succes)" : r.tauxEntretien > 0 ? "var(--or)" : "var(--texte-tertiaire)" }}>{r.tauxEntretien}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Performance par pays ─────────────────── */}
      {activeTab === "pays" && (
        <div className="space-y-2">
          {countryPerformance.length === 0 ? (
            <EmptyState message="Aucune donnée par pays." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--bordure)" }}>
                    {["Pays", "Offres", "Score moy.", "High priority", "Relances", "Entretiens", "Tx transformation"].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-mono" style={{ color: "var(--texte-tertiaire)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {countryPerformance.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--bordure-douce)" }}
                      className="hover:brightness-95">
                      <td className="py-2 px-2 font-bold" style={{ color: p.pays === "Inconnu" ? "var(--texte-tertiaire)" : "var(--texte)" }}>{p.pays}</td>
                      <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>{p.nombreOffres}</td>
                      <td className="py-2 px-2" style={{ color: p.scoreMoyen >= 70 ? "var(--succes)" : p.scoreMoyen >= 40 ? "var(--or)" : "var(--texte-secondaire)" }}>{p.scoreMoyen}</td>
                      <td className="py-2 px-2" style={{ color: p.highPriority > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>{p.highPriority}</td>
                      <td className="py-2 px-2" style={{ color: p.relances > 0 ? "var(--or)" : "var(--texte-tertiaire)" }}>{p.relances}</td>
                      <td className="py-2 px-2" style={{ color: p.entretiens > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>{p.entretiens}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: p.tauxTransformation >= 15 ? "var(--succes)" : p.tauxTransformation > 0 ? "var(--or)" : "var(--texte-tertiaire)" }}>{p.tauxTransformation}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Opportunités bloquées ────────────────── */}
      {activeTab === "bloquees" && (
        <div className="space-y-2">
          {blocked.length === 0 ? (
            <EmptyState message="Aucune opportunité bloquée. Le pipeline est fluide !" icon={CheckCircle2} color="var(--succes)" />
          ) : (
            blocked.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md border"
                style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
                <div className="flex items-start gap-3">
                  <XCircle size={16} style={{ color: "var(--erreur)", marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--texte)" }}>{b.title} — {b.company}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>{b.raison}</p>
                  </div>
                </div>
                <button onClick={() => link(`/opportunites/${b.id}`)}
                  className="text-xs px-3 py-1 rounded-md border font-mono flex-shrink-0 ml-3"
                  style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}>
                  Voir <ArrowRight size={10} className="inline ml-1" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Plan d'action aujourd'hui ────────────── */}
      {activeTab === "actions" && (
        <div className="space-y-2">
          {actions.length === 0 ? (
            <EmptyState message="Rien à faire aujourd'hui ! Toutes les actions sont à jour." icon={CheckCircle2} color="var(--succes)" />
          ) : (<>
              <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{actions.length} action(s) identifiée(s)</p>
              {actions.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-md border"
                  style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: priorityColor(a.priorite) }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{
                          background: `${priorityColor(a.priorite)}20`,
                          color: priorityColor(a.priorite),
                        }}>{a.priorite}</span>
                        <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{a.categorie}</span>
                      </div>
                      <p className="text-sm font-bold mt-1" style={{ color: "var(--texte)" }}>{a.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>
                        <span style={{ color: "var(--texte-tertiaire)" }}>Raison :</span> {a.raison}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => link(a.lien)}
                    className="text-xs px-3 py-1.5 rounded-md font-mono flex-shrink-0 ml-3"
                    style={{ background: "var(--or)", color: "var(--fond)", border: "none" }}>
                    {a.action}
                  </button>
                </div>
              ))}
          </>)}
        </div>
      )}

      {/* ─── Recommandations hebdomadaires ────────── */}
      {activeTab === "recos" && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <EmptyState message="Ajoutez des offres pour obtenir des recommandations personnalisées." />
          ) : (
            recommendations.map((r, i) => (
              <div key={i} className="p-3 rounded-md border" style={{
                borderColor: recBorder(r.type),
                background: recBg(r.type),
              }}>
                <div className="flex items-start gap-2">
                  {r.type === "positif" && <CheckCircle2 size={14} style={{ color: recColor(r.type), marginTop: 1 }} />}
                  {r.type === "alerte" && <AlertTriangle size={14} style={{ color: recColor(r.type), marginTop: 1 }} />}
                  {r.type === "action" && <Zap size={14} style={{ color: recColor(r.type), marginTop: 1 }} />}
                  {r.type === "info" && <Lightbulb size={14} style={{ color: recColor(r.type), marginTop: 1 }} />}
                  <div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded mr-1"
                      style={{ background: `${recColor(r.type)}20`, color: recColor(r.type) }}>{r.type}</span>
                    <span className="text-sm" style={{ color: "var(--texte)" }}>{r.message}</span>
                    {r.details && (
                      <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>{r.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Internal components ─────────────────────────── */

function KpiCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color?: string;
}) {
  return (
    <div className="p-3 rounded-md border" style={{
      borderColor: "var(--bordure-douce)",
      background: "var(--fond-surface)",
    }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: color || "var(--or)" }} />
        <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{label}</span>
      </div>
      <span className="text-xl font-bold" style={{ color: color || "var(--texte)" }}>{value}</span>
    </div>
  );
}

function EmptyState({ message, icon: Icon, color }: { message: string; icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon ? <Icon size={32} style={{ color: color || "var(--texte-tertiaire)", marginBottom: 8 }} /> : null}
      <p className="text-sm" style={{ color: "var(--texte-tertiaire)" }}>{message}</p>
    </div>
  );
}
