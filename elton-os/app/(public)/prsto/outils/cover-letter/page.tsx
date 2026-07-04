"use client";

import { useState } from "react";
import { Loader2, Mail, Copy, Check, Crown } from "lucide-react";

interface LetterResult {
  letters: Array<{ tone: string; text: string }>;
  provider?: string;
}

const TONE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  board: { label: "Board-ready", description: "Adressée au Conseil d'Administration. Ton sobre, focus valeur actionnariale.", color: "#1E40AF" },
  peer: { label: "Peer-to-peer", description: "Adressée au CEO/DG (recruteur pair). Ton direct, opérationnel, collaboration.", color: "#7C3AED" },
  founder: { label: "Founder-style", description: "Adressée au fondateur/actionnaire. Ton entrepreneurial, vision, agilité.", color: "#DC2626" },
};

export default function CoverLetterPage() {
  const [form, setForm] = useState({
    applicantName: "",
    currentRole: "",
    targetRole: "",
    company: "",
    jobDescription: "",
    keyAchievements: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LetterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTone, setCopiedTone] = useState<string | null>(null);

  const generate = async () => {
    if (!form.targetRole || !form.company) {
      setError("Poste visé et entreprise requis");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const achievements = form.keyAchievements.split("\n").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/tools/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, keyAchievements: achievements, tone: "all" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      setResult(data);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const copy = (tone: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTone(tone);
    setTimeout(() => setCopiedTone(null), 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(236,72,153,0.1)", color: "#EC4899" }}>
            <Mail size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">3 tons · Executive-grade</span>
          </div>
          <h1 className="font-serif text-4xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            Cover Letter Generator
          </h1>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            3 versions selon votre cible : Board, CEO pair, ou Fondateur. Chaque ton a sa logique de persuasion.
          </p>
          <p className="text-xs mt-3" style={{ color: "var(--texte-tertiaire)" }}>
            Rezi génère 1 lettre générique. PRSTO en génère 3 adaptées au destinataire.
          </p>
        </div>

        {!result ? (
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Votre nom"
                value={form.applicantName}
                onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              />
              <input
                type="text"
                placeholder="Poste actuel (ex: CFO chez Total)"
                value={form.currentRole}
                onChange={(e) => setForm({ ...form, currentRole: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              />
              <input
                type="text"
                placeholder="Poste visé *"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              />
              <input
                type="text"
                placeholder="Entreprise visée *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="p-3 rounded-lg text-sm outline-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              />
            </div>
            <textarea
              placeholder="Description de l'offre (optionnel — améliore la pertinence)"
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              rows={4}
              className="w-full p-3 rounded-lg text-sm outline-none mb-3 resize-y"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
            />
            <textarea
              placeholder="Réalisations clés (une par ligne) — ex: 'Augmenté EBITDA de 32% en 18 mois'"
              value={form.keyAchievements}
              onChange={(e) => setForm({ ...form, keyAchievements: e.target.value })}
              rows={4}
              className="w-full p-3 rounded-lg text-sm outline-none mb-4 resize-y"
              style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
            />
            {error && (
              <div className="text-sm p-3 rounded mb-3" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {error}
              </div>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "var(--prsto-forest)", color: "#FFF" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Générer 3 lettres
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {result.letters.map((letter, i) => {
              const meta = TONE_LABELS[letter.tone] || { label: letter.tone, description: "", color: "#666" };
              return (
                <div key={i} className="rounded-2xl p-6" style={{ background: "#FFF", border: `1px solid ${meta.color}30` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}15` }}>
                        <Crown size={14} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "var(--texte)" }}>{meta.label}</div>
                        <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{meta.description}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => copy(letter.tone, letter.text)}
                      className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
                      style={{ background: "#F9FAFB", color: "var(--texte)" }}
                    >
                      {copiedTone === letter.tone ? <Check size={12} style={{ color: "#10B981" }} /> : <Copy size={12} />}
                      {copiedTone === letter.tone ? "Copié" : "Copier"}
                    </button>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap font-sans p-4 rounded-lg" style={{ background: "#F9FAFB", color: "var(--texte)" }}>
                    {letter.text}
                  </pre>
                </div>
              );
            })}
            <div className="text-center">
              <button
                onClick={() => setResult(null)}
                className="text-sm px-6 py-2 rounded-lg"
                style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              >
                Générer d'autres lettres
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
