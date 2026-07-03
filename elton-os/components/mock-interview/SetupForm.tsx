"use client";

import { useState } from "react";

interface PortraitOption {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  gender: string;
}

interface SetupFormProps {
  portraits: PortraitOption[];
  onSubmit: (data: {
    company: string;
    jobTitle: string;
    jobDescription: string;
    strengths: string[];
    language: string;
    selectedPortraitIds: string[];
  }) => void;
  quotaUsed: number;
  quotaLimit: number;
}

const LANGUAGES = [
  { value: "fr", label: "🇫🇷 Français" },
  { value: "en", label: "🇬🇧 English" },
  { value: "es", label: "🇪🇸 Español" },
  { value: "de", label: "🇩🇪 Deutsch" },
  { value: "ar", label: "🇸🇦 العربية" },
  { value: "zh", label: "🇨🇳 中文" },
  { value: "ja", label: "🇯🇵 日本語" },
  { value: "pt", label: "🇧🇷 Português" },
];

export function SetupForm({
  portraits,
  onSubmit,
  quotaUsed,
  quotaLimit,
}: SetupFormProps) {
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [strengthInput, setStrengthInput] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [language, setLanguage] = useState("fr");
  const [selectedPortraits, setSelectedPortraits] = useState<string[]>(() =>
    portraits.slice(0, 3).map((p) => p.id),
  );

  const handleAddStrength = () => {
    const s = strengthInput.trim();
    if (s && !strengths.includes(s)) {
      setStrengths((prev) => [...prev, s]);
      setStrengthInput("");
    }
  };

  const handleRemoveStrength = (s: string) => {
    setStrengths((prev) => prev.filter((x) => x !== s));
  };

  const togglePortrait = (id: string) => {
    setSelectedPortraits((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isPanelValid = selectedPortraits.length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !jobTitle || (!jobUrl && !jobDescription) || !isPanelValid) return;

    onSubmit({
      company,
      jobTitle,
      jobDescription: jobUrl || jobDescription,
      strengths,
      language,
      selectedPortraitIds: selectedPortraits,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-[#103826]">
          1. Informations du poste
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#103826]/70 mb-1.5">
              Entreprise *
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nom de l'entreprise"
              required
              className="w-full px-3 py-2 rounded-xl border border-[#103826]/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#103826]/30 focus:border-[#103826] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#103826]/70 mb-1.5">
              Poste visé *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Directeur Commercial, CEO..."
              required
              className="w-full px-3 py-2 rounded-xl border border-[#103826]/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#103826]/30 focus:border-[#103826] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#103826]/70 mb-1.5">
            URL de l'offre ou description
          </label>
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl border border-[#103826]/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#103826]/30 focus:border-[#103826] transition-all"
          />
          <p className="text-xs text-[#103826]/40 mt-1">Ou collez la description ci-dessous</p>
        </div>

        {!jobUrl && (
          <div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Collez la description du poste ici..."
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-[#103826]/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#103826]/30 focus:border-[#103826] transition-all resize-none"
            />
          </div>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#103826]">
          2. Langue de l'entretien
        </h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-[#103826]/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#103826]/30 focus:border-[#103826] transition-all"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#103826]">
          3. Vos points forts
        </h2>
        <p className="text-sm text-[#103826]/60">
          Ajoutez des points forts pour que le panel s'adapte à votre profil.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={strengthInput}
            onChange={(e) => setStrengthInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddStrength())}
            placeholder="Ex: 15 ans d'expérience en scale-up"
            className="flex-1 px-3 py-2 rounded-xl border border-[#103826]/20 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#103826]/30 focus:border-[#103826] transition-all"
          />
          <button
            type="button"
            onClick={handleAddStrength}
            className="px-4 py-2 rounded-xl bg-[#103826] text-white text-sm font-medium hover:bg-[#103826]/90 transition-colors"
          >
            +
          </button>
        </div>

        {strengths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {strengths.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#103826]/10 text-[#103826] text-sm"
              >
                {s}
                <button
                  type="button"
                  onClick={() => handleRemoveStrength(s)}
                  className="w-4 h-4 rounded-full hover:bg-[#103826]/20 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#103826]/10 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#103826]">
          4. Composition du panel
        </h2>
        <p className="text-sm text-[#103826]/60">
          Sélectionnez 2 à 4 membres. Minimum 2 requis.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {portraits.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePortrait(p.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                selectedPortraits.includes(p.id)
                  ? "border-[#103826] ring-1 ring-[#103826]/20"
                  : "border-[#103826]/10 hover:border-[#103826]/30"
              }`}
            >
              <div className="aspect-[3/4]">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {selectedPortraits.includes(p.id) && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#103826] flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium text-[#103826] truncate">
                  {p.name}
                </p>
                <p className="text-[10px] text-[#103826]/60 truncate">
                  {p.title}
                </p>
              </div>
            </button>
          ))}
        </div>

        {!isPanelValid && (
          <p className="text-xs text-red-500">
            Sélectionnez au moins 2 membres du panel.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-[#103826]/60">
          📊 Simulations ce mois-ci : {quotaUsed}/{quotaLimit}
        </div>

        <button
          type="submit"
          disabled={!company || !jobTitle || (!jobUrl && !jobDescription) || !isPanelValid}
          className="px-8 py-3 rounded-xl bg-[#103826] text-white font-medium hover:bg-[#103826]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#103826]/20"
        >
          🚀 Commencer l'entretien
        </button>
      </div>
    </form>
  );
}
