"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText, Edit3, Loader2, Copy, Check, Sparkles,
  BookOpen, Globe, Mail, RefreshCw, Target
} from "lucide-react";
import { generateResumeSummaries, getProfileSummaryStatus } from "@/lib/actions/resume-summary";
import type { GeneratedSummary } from "@/lib/jobs/resume-summary-generator";

const TARGET_ICONS: Record<string, typeof FileText> = {
  cv: BookOpen,
  linkedin: Globe,
  "cover-letter": Mail,
}

const TARGET_LABELS: Record<string, string> = {
  cv: "CV",
  linkedin: "LinkedIn",
  "cover-letter": "Lettre de motivation",
}

export default function ResumeSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<GeneratedSummary[]>([]);
  const [adapted, setAdapted] = useState<GeneratedSummary | null>(null);
  const [activeTab, setActiveTab] = useState<string>("cv");
  const [profileStatus, setProfileStatus] = useState<any>(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      getProfileSummaryStatus(),
      generateResumeSummaries(),
    ]).then(([status, res]) => {
      setProfileStatus(status);
      setVariants(res.variants);
    }).catch(() => {
      setError("Erreur lors du chargement du profil.");
    }).finally(() => setLoading(false));
  }, []);

  async function handleRegenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await generateResumeSummaries({
        targetRole: targetRole.trim() || undefined,
        company: targetCompany.trim() || undefined,
      });
      setVariants(res.variants);
      if (res.adapted) setAdapted(res.adapted);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message || "Erreur.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredVariants = variants.filter((v) => v.target === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dark-card)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--dark-card)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-glass)" }}>
            <Edit3 className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Synthèse Candidat</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Générez un résumé professionnel percutant pour CV, LinkedIn ou lettre de motivation
            </p>
          </div>
        </div>

        {profileStatus?.hasProfile && (
          <div className="p-4 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{profileStatus.fullName}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{profileStatus.title}</p>
              </div>
              <div className="flex gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span>{profileStatus.experienceCount} expériences</span>
                <span>{profileStatus.skillCount} compétences</span>
                <span>Ton : {profileStatus.preferredTone}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl border text-sm" style={{ background: "rgba(220,38,38,0.1)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Poste cible (optionnel — ex: Directeur Commercial)"
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <input
            type="text"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            placeholder="Entreprise cible (optionnel)"
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>

        <button
          onClick={handleRegenerate}
          disabled={generating}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Génération..." : "Générer les résumés"}
        </button>

        {adapted && (
          <div className="p-5 rounded-xl border" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.25)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Ciblé : {targetRole}</h3>
              </div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{adapted.characters} car.</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{adapted.text}</p>
            <button
              onClick={() => handleCopy(adapted.text, adapted.id)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium transition"
              style={{ color: copiedId === adapted.id ? "#22c55e" : "var(--accent)" }}
            >
              {copiedId === adapted.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === adapted.id ? "Copié" : "Copier"}
            </button>
          </div>
        )}

        <div ref={resultRef}>
          <div className="flex gap-1 p-1 rounded-xl border mb-4" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
            {["cv", "linkedin", "cover-letter"].map((tab) => {
              const Icon = TARGET_ICONS[tab]
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    background: activeTab === tab ? "var(--accent)" : "transparent",
                    color: activeTab === tab ? "#fff" : "var(--muted-foreground)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {TARGET_LABELS[tab]}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            {filteredVariants.map((v) => (
              <div key={v.id} className="p-5 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "var(--accent-glass)", color: "var(--accent)" }}>
                      {v.toneLabel}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {v.characters} caractères
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(v.text, v.id)}
                    className="flex items-center gap-1.5 text-xs font-medium transition"
                    style={{ color: copiedId === v.id ? "#22c55e" : "var(--accent)" }}
                  >
                    {copiedId === v.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === v.id ? "Copié" : "Copier"}
                  </button>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>{v.text}</p>
              </div>
            ))}
          </div>

          {filteredVariants.length === 0 && (
            <div className="p-8 text-center rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucun résumé généré. Cliquez sur « Générer les résumés ».</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
