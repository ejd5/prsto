"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Copy,
  AlertTriangle, Globe, Monitor,
} from "lucide-react";
import { CV_TEMPLATES } from "@/lib/cv-templates/templates";

const DEMO_CV = {
  fullName: "Jean Dupont",
  title: "Directeur Commercial",
  email: "jean.dupont@email.com",
  phone: "+33 6 12 34 56 78",
  linkedin: "linkedin.com/in/jeandupont",
  location: "Paris, France",
  summary: "Directeur Commercial avec 15 ans d'expérience en B2B. Pilotage d'équipes de 20 à 80 personnes, gestion de P&L jusqu'à 45M€. Expertise en transformation commerciale, négociation grands comptes et développement international. Secteurs : Industrie, SaaS B2B, Santé.",
  languages: ["Français (natif)", "Anglais (courant)", "Allemand (B1)"],
  skills: [
    { name: "Direction commerciale", category: "management", level: "expert" },
    { name: "Gestion P&L", category: "finance", level: "expert" },
    { name: "Négociation grands comptes", category: "business", level: "expert" },
    { name: "Transformation commerciale", category: "strategy", level: "expert" },
    { name: "Management d'équipe", category: "management", level: "avancé" },
    { name: "Business Development", category: "business", level: "avancé" },
    { name: "Stratégie go-to-market", category: "strategy", level: "avancé" },
    { name: "Salesforce CRM", category: "tools", level: "intermédiaire" },
  ],
  experiences: [
    {
      company: "Groupe ABC",
      title: "Directeur Commercial France",
      period: "2018-Présent",
      location: "Paris, France",
      description: "Pilotage de la stratégie commerciale France pour un groupe industriel de 800 personnes. Management d'une équipe de 35 commerciaux et 5 directeurs régionaux.",
      achievements: [
        "CA France : +45% en 5 ans (32M€ → 45M€)",
        "Recrutement et structuration de l'équipe commerciale (15 → 35 personnes)",
        "Déploiement Salesforce — adoption 95% en 6 mois",
      ],
    },
    {
      company: "XYZ Corp",
      title: "Head of Sales Europe du Sud",
      period: "2015-2018",
      location: "Lyon, France",
      description: "Responsable des ventes pour la zone Europe du Sud (France, Italie, Espagne).",
      achievements: [
        "CA zone : 22M€ — CAGR +18%",
        "Lancement marché italien — 2M€ première année",
        "Prix « Best Sales Team 2017 »",
      ],
    },
  ],
  education: [
    { degree: "Master Management Commercial", school: "HEC Paris", year: "2008" },
    { degree: "Bachelor Business International", school: "Université Paris-Dauphine", year: "2005" },
  ],
  certifications: ["Lean Six Sigma — Green Belt", "Salesforce Certified Administrator"],
};

const ATS_COLORS: Record<string, string> = {
  HIGH: "var(--succes)",
  MEDIUM: "var(--or)",
  LOW: "var(--texte-tertiaire)",
};

export default function CVTemplatesPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(CV_TEMPLATES[0].id);
  const [showPreview, setShowPreview] = useState<"text" | "html">("text");
  const [copied, setCopied] = useState(false);

  const template = CV_TEMPLATES.find(t => t.id === selectedId) || CV_TEMPLATES[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedText = template.renderText(DEMO_CV);
  const renderedHTML = template.renderHTML(DEMO_CV);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Nav */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/documents")}
          className="flex items-center gap-2 text-xs font-mono transition-colors"
          style={{ color: "var(--texte-tertiaire)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--or)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--texte-tertiaire)"; }}>
          <ArrowLeft size={14} /> Documents
        </button>
        <span className="text-xs font-mono" style={{ color: "var(--bordure)" }}>|</span>
        <span className="text-sm font-mono" style={{ color: "var(--texte)" }}>Templates CV internes</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Templates CV</h1>
        <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
          8 templates internes originaux — inspirés des bonnes pratiques ATS et executive
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: template selector */}
        <div className="space-y-3">
          {CV_TEMPLATES.map(t => {
            const isSelected = t.id === selectedId;
            return (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className="w-full text-left p-4 rounded-lg border transition-colors"
                style={{
                  background: isSelected ? "var(--or-faible)" : "var(--fond-surface)",
                  borderColor: isSelected ? "var(--or)" : "var(--bordure)",
                }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--texte)" }}>
                      {t.name}
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${ATS_COLORS[t.atsLevel]}15`, color: ATS_COLORS[t.atsLevel] }}>
                        ATS {t.atsLevel}
                      </span>
                    </h3>
                    <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>{t.description}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                      Recommandé : {t.recommendedFor}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 size={18} style={{ color: "var(--or)" }} />}
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--bordure-douce)" }}>
                    <div className="flex flex-wrap gap-1">
                      {t.sections.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--fond-eleve)", color: "var(--texte-tertiaire)" }}>{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                      <span className="flex items-center gap-1"><Globe size={10} /> Langue : {t.recommendedLang === "both" ? "FR/EN" : t.recommendedLang.toUpperCase()}</span>
                      <span className="flex items-center gap-1"><Monitor size={10} /> Style : {t.style}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button onClick={() => setShowPreview("text")}
                className="px-3 py-1.5 text-xs font-mono rounded"
                style={{ background: showPreview === "text" ? "var(--or-faible)" : "transparent", color: showPreview === "text" ? "var(--or)" : "var(--texte-tertiaire)" }}>
                Texte brut
              </button>
              <button onClick={() => setShowPreview("html")}
                className="px-3 py-1.5 text-xs font-mono rounded"
                style={{ background: showPreview === "html" ? "var(--or-faible)" : "transparent", color: showPreview === "html" ? "var(--or)" : "var(--texte-tertiaire)" }}>
                HTML Preview
              </button>
            </div>
            <button onClick={() => handleCopy(showPreview === "text" ? renderedText : renderedHTML)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
              style={{ borderColor: "var(--bordure)", color: copied ? "var(--succes)" : "var(--texte-secondaire)" }}>
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>

          <div className="p-3 rounded-lg border overflow-auto" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", maxHeight: "calc(100vh - 280px)" }}>
            {showPreview === "text" ? (
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: "var(--texte-secondaire)", lineHeight: 1.7 }}>
                {renderedText}
              </pre>
            ) : (
              <iframe srcDoc={renderedHTML} className="w-full rounded" style={{ height: 800, border: "none", background: "#fff" }} />
            )}
          </div>

          <div className="p-3 rounded-md border text-xs flex items-start gap-2" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-eleve)" }}>
            <AlertTriangle size={12} style={{ color: "var(--or)", flexShrink: 0, marginTop: 1 }} />
            <div style={{ color: "var(--texte-secondaire)" }}>
              <strong style={{ color: "var(--texte)" }}>Preview avec données exemple.</strong> Les templates s&apos;adaptent automatiquement à votre CV Maître et Profil Exécutif. Tous les templates sont originaux PRSTO — aucun template commercial n&apos;a été copié.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
