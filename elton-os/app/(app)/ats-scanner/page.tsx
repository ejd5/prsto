"use client";

import { useState, useRef, useEffect } from "react";
import { Scan, FileText, Target, AlertTriangle, CheckCircle, XCircle, Loader2, Lightbulb, ChevronDown, ChevronUp, Search } from "lucide-react";
import { runAtsScan, getCvStatus } from "@/lib/actions/ats-scanner";
import type { AtsScanResult } from "@/lib/jobs/ats-resume-scanner";
import { getScoreColor, getScoreBg } from "@/lib/score-colors";

export default function AtsScannerPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsScanResult | null>(null);
  const [error, setError] = useState("");
  const [cvStatus, setCvStatus] = useState<{ hasCv: boolean; cvTitle: string; wordCount: number } | null>(null);
  const [showKeywords, setShowKeywords] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCvStatus().then(setCvStatus);
  }, []);

  async function handleScan() {
    if (!jobTitle.trim()) { setError("Veuillez saisir un intitulé de poste."); return; }
    if (!jobDescription.trim()) { setError("Veuillez coller une description de poste."); return; }
    if (jobDescription.trim().length < 100) { setError("La description est trop courte (min 100 caractères)."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await runAtsScan({ jobTitle: jobTitle.trim(), jobDescription: jobDescription.trim(), company: company.trim() || undefined });
      setResult(res);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (score: number) => ({ color: getScoreColor(score) });
  const scoreBg = (score: number) => ({
    background: getScoreBg(score, 0.15),
    borderColor: getScoreColor(score) + "40",
  });
  const barColor = (score: number) => ({ background: getScoreColor(score) });

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--dark-card)" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glass)" }}>
            <Scan className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Scanner ATS Recruteur</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Analysez le CV du candidat contre l&apos;offre client
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
              Entrez l&apos;offre du client et le CV du candidat pour vérifier la compatibilité ATS.
            </p>
          </div>
        </div>

        {cvStatus && !cvStatus.hasCv && (
          <div className="p-4 rounded-xl border" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" }}>
            <p className="text-sm" style={{ color: "#f59e0b" }}>
              Aucun CV Maître trouvé. Importez d&apos;abord le CV du candidat depuis l&apos;onglet <strong>CV Maître</strong> dans le menu.
            </p>
          </div>
        )}

        {cvStatus && cvStatus.hasCv && (
          <div className="p-3 rounded-xl border text-sm flex items-center gap-2" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)", color: "var(--muted-foreground)" }}>
            <FileText className="w-4 h-4 text-green-400" />
            CV Maître chargé : <strong style={{ color: "var(--foreground)" }}>{cvStatus.cvTitle}</strong>
            <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>
              {cvStatus.wordCount.toLocaleString("fr-FR")} mots
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Intitulé du poste (ex: Directeur Commercial)"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Collez la description complète du poste ici..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition resize-y"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Entreprise (optionnel)"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <div className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Lightbulb className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Conseils
              </h3>
              <ul className="space-y-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <li>• Collez l&apos;intégralité de la description, pas seulement un résumé</li>
                <li>• Incluez les compétences requises, le secteur, le niveau hiérarchique</li>
                <li>• Plus la description est détaillée, plus l&apos;analyse sera précise</li>
              </ul>
            </div>
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Analyse en cours..." : "Scanner le CV candidat"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)" }}>
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm" style={{ color: "#fca5a5" }}>{error}</p>
          </div>
        )}

        {result && (
          <div ref={resultRef} className="space-y-6">
            {/* Score global */}
            <div className="p-6 rounded-2xl border" style={scoreBg(result.globalScore)}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Score de compatibilité ATS</h2>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {result.globalScore >= 70 ? "Excellent — le CV du candidat est bien optimisé" :
                     result.globalScore >= 45 ? "Moyen — quelques améliorations nécessaires" :
                     "Faible — des optimisations importantes sont recommandées"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black" style={scoreColor(result.globalScore)}>
                    {result.globalScore}%
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Score global</p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ ...barColor(result.globalScore), width: `${result.globalScore}%` }}
                />
              </div>
            </div>

            {/* Grille des sous-scores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Mots-clés", value: result.keywordMatch, desc: "Correspondance lexicale" },
                { label: "Format", value: result.formatScore, desc: "Structure et mise en page" },
                { label: "Sections", value: result.sectionCoverage, desc: "Couverture des rubriques" },
                { label: "Phrases-clés", value: result.rawJobKeywords.length > 0 ? Math.round((result.matchedKeywords.length / Math.max(1, result.missingKeywords.length + result.matchedKeywords.length)) * 100) : 0, desc: "Correspondance contextuelle" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                  <div className="text-2xl font-bold" style={scoreColor(item.value)}>{item.value}%</div>
                  <div className="text-xs font-medium mt-1" style={{ color: "var(--foreground)" }}>{item.label}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="p-5 rounded-xl border" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.2)" }}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Lightbulb className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  Suggestions d&apos;amélioration
                </h3>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }}>→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections */}
            <div className="p-5 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>Analyse des sections du CV</h3>
              <div className="space-y-2">
                {result.sectionScores.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="flex items-center gap-2">
                      {s.present ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>{s.section}</span>
                    </div>
                    {!s.present && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Manquante</span>
                    )}
                  </div>
                ))}
              </div>
              {result.sectionScores.some((s) => !s.present) && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Suggestions :</p>
                  {result.sectionScores.filter((s) => !s.present).map((s, i) => (
                    <p key={i} className="text-xs" style={{ color: "var(--muted-foreground)" }}>• {s.suggestion}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="p-5 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowKeywords(!showKeywords)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                  Mots-clés ({result.matchedKeywords.length} matchs / {result.missingKeywords.length} manquants)
                </h3>
                {showKeywords ? <ChevronUp className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />}
              </button>
              {showKeywords && (
                <div className="mt-4 space-y-4">
                  {result.matchedKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-400 mb-2">Présents dans le CV du candidat</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matchedKeywords.map((k, i) => (
                          <span key={i} className="px-2 py-1 rounded-md text-xs border" style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", color: "#86efac" }}>
                            {k.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.missingKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-400 mb-2">Absents du CV du candidat</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.map((k, i) => (
                          <span key={i} className="px-2 py-1 rounded-md text-xs border" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                            {k.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
