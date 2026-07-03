"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle2, Save } from "lucide-react";

const DEFAULT_PREFS = {
  enabled: true,
  autoFillName: true,
  autoFillEmail: true,
  autoFillPhone: true,
  autoFillLinkedIn: false,
  autoFillLocation: true,
  autoFillSalary: false,
  autoFillResumeUploadWarning: true,
  autoFillCoverLetter: true,
  autoFillAtsAnswers: true,
  maxFieldsPerSession: 15,
  blockedFields: [] as string[],
};

const STORAGE_KEY = "elton-autofill-prefs";

export default function AutofillPreferencesPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch { /* ignore */ }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key: string) => {
    setPrefs((p) => ({ ...p, [key]: !(p as Record<string, unknown>)[key] }));
  };

  const renderToggleRow = (label: string, description: string, prefKey: string) => (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--bordure-douce)" }}>
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--texte)" }}>{label}</p>
        <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>{description}</p>
      </div>
      <button onClick={() => toggle(prefKey)}
        className="px-3 py-1 rounded text-[10px] font-mono border transition-colors"
        style={{
          background: (prefs as Record<string, unknown>)[prefKey] ? "var(--or-faible)" : "var(--fond)",
          borderColor: (prefs as Record<string, unknown>)[prefKey] ? "var(--or)" : "var(--bordure)",
          color: (prefs as Record<string, unknown>)[prefKey] ? "var(--or)" : "var(--texte-tertiaire)",
        }}>
        {(prefs as Record<string, unknown>)[prefKey] ? "Activé" : "Désactivé"}
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 650, margin: "0 auto" }}>
      <h1 className="text-lg font-bold mb-2" style={{ color: "var(--texte)" }}>
        <Shield size={18} className="inline mr-2" style={{ color: "#22c55e" }} />
        Préférences Autofill
      </h1>
      <p className="text-xs mb-6" style={{ color: "var(--texte-secondaire)" }}>
        Gérez quels champs sont automatiquement pré-remplis lors de l&apos;autofill de formulaire.
        Ces préférences sont sauvegardées localement dans votre navigateur.
      </p>

      <div className="rounded-lg border mb-6" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="p-4">
          {renderToggleRow("Nom complet", "Prénom, nom, nom complet", "autoFillName")}
          {renderToggleRow("Email", "Adresse email du profil", "autoFillEmail")}
          {renderToggleRow("Téléphone", "Numéro de téléphone", "autoFillPhone")}
          {renderToggleRow("LinkedIn", "URL LinkedIn (respecte cvIncludeLinkedIn)", "autoFillLinkedIn")}
          {renderToggleRow("Localisation", "Ville / région du profil", "autoFillLocation")}
          {renderToggleRow("Rémunération", "Fourchette de rémunération cible", "autoFillSalary")}
          {renderToggleRow("Avertissement upload CV", "Message d'avertissement pour l'upload manuel", "autoFillResumeUploadWarning")}
          {renderToggleRow("Lettre de motivation", "Lettre générée pour ce dossier", "autoFillCoverLetter")}
          {renderToggleRow("Réponses ATS", "Réponses ATS générées", "autoFillAtsAnswers")}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-mono font-bold text-black"
          style={{ background: saved ? "#22c55e" : "var(--or)" }}>
          {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {saved ? "Sauvegardé !" : "Enregistrer"}
        </button>
        <p className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
          Stockage local uniquement. Aucune donnée envoyée au serveur.
        </p>
      </div>

      {/* Sécurité */}
      <div className="mt-6 p-4 rounded-lg border flex items-start gap-2 text-xs"
        style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.05)", color: "#22c55e" }}>
        <Shield size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Aucune candidature automatique.</strong> L&apos;autofill remplit les champs.
          C&apos;est vous qui cliquez sur &ldquo;Envoyer&rdquo;.
        </span>
      </div>
    </div>
  );
}
