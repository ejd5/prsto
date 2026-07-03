"use client";

import { useState, useEffect } from "react";
import {
  Database, Loader2, Search, CheckCircle, XCircle,
  Lightbulb, AlertTriangle, BookOpen, Star, Target,
  ChevronDown, ChevronUp, Filter, Layers, Briefcase
} from "lucide-react";
import { runSkillGapAnalysis, browseSkills, getSkillsDashboard } from "@/lib/actions/skills-database";
import type { SkillGapAnalysis, SkillDefinition } from "@/lib/jobs/skills-database";

const CATEGORY_COLORS: Record<string, string> = {
  leadership: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  commercial: "text-green-400 bg-green-500/10 border-green-500/30",
  strategique: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  finance: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  digital: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  sectoriel: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  langue: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  certification: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  operationnel: "text-gray-400 bg-gray-500/10 border-gray-500/30",
}

const CATEGORY_LABELS: Record<string, string> = {
  leadership: "Leadership & Management",
  commercial: "Commercial & Sales",
  strategique: "Stratégie & Business",
  finance: "Finance & P&L",
  digital: "Digital & Technologie",
  sectoriel: "Sectoriel",
  langue: "Langues",
  certification: "Certifications",
  operationnel: "Opérationnel",
}

export default function SkillsDatabasePage() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [targetSector, setTargetSector] = useState("");
  const [targetFunction, setTargetFunction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SkillDefinition[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"gaps" | "browse">("gaps");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getSkillsDashboard();
      setDashboard(data);
      await runAnalysis();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis(sector?: string, func?: string) {
    try {
      const res = await runSkillGapAnalysis({
        targetSector: sector || targetSector || undefined,
        targetFunction: func || targetFunction || undefined,
      });
      setAnalysis(res.analysis);
      setDashboard((prev: any) => prev ? ({ ...prev, sectorOptions: res.sectorOptions, functionOptions: res.functionOptions }) : prev);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await browseSkills({ query });
      setSearchResults(res.skills);
    } catch { } finally {
      setSearching(false);
    }
  }

  async function handleSectorChange(sector: string) {
    setTargetSector(sector);
    await runAnalysis(sector, targetFunction);
  }

  async function handleFunctionChange(func: string) {
    setTargetFunction(func);
    await runAnalysis(targetSector, func);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dark-card)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--dark-card)" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glass)" }}>
            <Database className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Skills Database</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Référentiel de compétences exécutives — analysez vos gaps et découvrez les compétences clés
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl border text-sm" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <button
            onClick={() => setActiveTab("gaps")}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition text-center"
            style={{ background: activeTab === "gaps" ? "var(--accent)" : "transparent", color: activeTab === "gaps" ? "#fff" : "var(--muted-foreground)" }}
          >
            Analyse des gaps
          </button>
          <button
            onClick={() => setActiveTab("browse")}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition text-center"
            style={{ background: activeTab === "browse" ? "var(--accent)" : "transparent", color: activeTab === "browse" ? "#fff" : "var(--muted-foreground)" }}
          >
            Explorer les compétences
          </button>
        </div>

        {activeTab === "gaps" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={targetSector}
                onChange={(e) => handleSectorChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="">Tous les secteurs</option>
                {dashboard?.sectorOptions?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <select
                value={targetFunction}
                onChange={(e) => handleFunctionChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="">Toutes les fonctions</option>
                {dashboard?.functionOptions?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {analysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border text-center" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                    <div className="text-2xl font-bold text-green-400">{analysis.present.length}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Présentes</div>
                  </div>
                  <div className="p-4 rounded-xl border text-center" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                    <div className="text-2xl font-bold text-red-400">{analysis.missing.filter((m) => m.importance === "critical").length}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Critiques manquantes</div>
                  </div>
                  <div className="p-4 rounded-xl border text-center" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                    <div className="text-2xl font-bold text-yellow-400">{analysis.missing.filter((m) => m.importance === "recommended").length}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Recommandées</div>
                  </div>
                  <div className="p-4 rounded-xl border text-center" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                    <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{dashboard?.userSkillCount || 0}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Dans votre profil</div>
                  </div>
                </div>

                {analysis.strengths.length > 0 && (
                  <div className="p-4 rounded-xl border" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)" }}>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: "var(--foreground)" }}>
                      <Star className="w-4 h-4 text-green-400" />
                      Points forts
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.strengths.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-xs border" style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", color: "#86efac" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(analysis.coverageByCategory).map(([cat, data]) => (
                    <div key={cat} className="p-3 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{cat}</span>
                        <span className={`text-sm font-bold ${data.percent >= 60 ? "text-green-400" : data.percent >= 30 ? "text-yellow-400" : "text-red-400"}`}>
                          {data.percent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <div
                          className={`h-full rounded-full ${data.percent >= 60 ? "bg-green-500" : data.percent >= 30 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${data.percent}%` }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{data.present}/{data.total}</p>
                    </div>
                  ))}
                </div>

                {analysis.missing.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                      <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
                      Compétences à acquérir
                    </h3>
                    {analysis.missing.map((m, i) => (
                      <div key={i} className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                        <div className="flex items-start gap-3">
                          {m.importance === "critical" ? (
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          ) : (
                            <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{m.name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[m.category] || "text-gray-400"}`}>
                                {CATEGORY_LABELS[m.category] || m.category}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.reason}</p>
                            <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>{m.suggestedAction}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "browse" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Rechercher une compétence..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {dashboard?.categories?.map((cat: any) => (
                <button
                  key={cat.key}
                  onClick={async () => {
                    const res = await browseSkills({ category: cat.key });
                    setSearchResults(res.skills);
                    setSearchQuery("");
                  }}
                  className="p-3 rounded-xl border text-left transition"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{cat.label}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{cat.count} compétences</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dashboard?.sectors?.map((sector: any) => (
                <button
                  key={sector.id}
                  onClick={async () => {
                    const res = await browseSkills({ sector: sector.id });
                    setSearchResults(res.skills);
                    setSearchQuery("");
                  }}
                  className="p-3 rounded-xl border text-left transition"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
                >
                  <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{sector.label}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sector.criticalSkills.length + sector.recommendedSkills.length} compétences recommandées</div>
                </button>
              ))}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
                </p>
                {searchResults.map((skill, i) => (
                  <div key={i} className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{skill.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[skill.category] || ""}`}>
                            {CATEGORY_LABELS[skill.category] || skill.category}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{skill.description}</p>
                        {skill.aliases.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skill.aliases.slice(0, 4).map((a, j) => (
                              <span key={j} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.2)", color: "var(--muted-foreground)" }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${skill.level === "expert" ? "bg-purple-500/20 text-purple-400" : skill.level === "advanced" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {skill.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <div className="p-8 text-center rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucune compétence trouvée pour "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
