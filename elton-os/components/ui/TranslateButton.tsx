"use client";

import { useState } from "react";
import { Languages, Loader2, Check, Copy } from "lucide-react";

interface TranslateButtonProps {
  /** Texte à traduire */
  text: string;
  /** Langue cible par défaut (défaut: "en") */
  defaultTarget?: "en" | "fr" | "es" | "de" | "it" | "pt";
  /** Langue source (auto-détection si non précisée) */
  sourceLang?: "en" | "fr" | "es" | "de" | "it" | "pt";
  /** Label du bouton (défaut: "Traduire") */
  label?: string;
  /** Callback optionnel avec le texte traduit */
  onTranslated?: (translated: string) => void;
  /** Style variant */
  variant?: "compact" | "full";
}

const LANG_FLAGS: Record<string, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇵🇹",
};

const LANG_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

export default function TranslateButton({
  text,
  defaultTarget = "en",
  sourceLang,
  label = "Traduire",
  onTranslated,
  variant = "compact",
}: TranslateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState(defaultTarget);
  const [translated, setTranslated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [responseMs, setResponseMs] = useState<number | null>(null);

  const translate = async () => {
    if (!text || text.trim().length === 0) {
      setError("Texte vide");
      return;
    }

    setLoading(true);
    setError(null);
    setTranslated(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setTranslated(data.translatedText);
        setResponseMs(data.responseTimeMs);
        if (onTranslated) onTranslated(data.translatedText);
      } else {
        setError(data.error || "Erreur de traduction");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!translated) return;
    try {
      await navigator.clipboard.writeText(translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (variant === "compact" && !isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(translate, 100);
        }}
        disabled={!text || text.trim().length === 0}
        title="Traduire ce texte"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(16,56,38,0.15)",
          background: "white",
          color: "#0E3A29",
          fontSize: 12,
          fontWeight: 600,
          cursor: text && text.trim() ? "pointer" : "not-allowed",
          opacity: text && text.trim() ? 1 : 0.5,
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
      >
        <Languages size={13} />
        {label}
      </button>
    );
  }

  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(16,56,38,0.12)",
        borderRadius: 12,
        padding: 16,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Languages size={16} style={{ color: "#0E3A29" }} />
        <strong style={{ color: "#0B1F18", fontSize: 14 }}>Traduction</strong>
        {responseMs && (
          <span style={{ fontSize: 11, color: "#6A8F6D", marginLeft: "auto" }}>
            {responseMs}ms
          </span>
        )}
      </div>

      {/* Sélecteur de langue */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {Object.entries(LANG_LABELS).map(([code, name]) => (
          <button
            key={code}
            onClick={() => setTargetLang(code as typeof targetLang)}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              border: `1px solid ${targetLang === code ? "#0E3A29" : "rgba(16,56,38,0.15)"}`,
              background: targetLang === code ? "#0E3A29" : "white",
              color: targetLang === code ? "white" : "#50625A",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {LANG_FLAGS[code]} {name}
          </button>
        ))}
      </div>

      {/* Bouton traduire */}
      <button
        onClick={translate}
        disabled={loading || !text}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: loading || !text ? "rgba(14,56,41,0.3)" : "#0E3A29",
          color: "white",
          fontSize: 12,
          fontWeight: 600,
          cursor: loading || !text ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
        {loading ? "Traduction..." : `Traduire vers ${LANG_LABELS[targetLang]}`}
      </button>

      {/* Erreur */}
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: 8,
            color: "#DC2626",
            fontSize: 12,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Résultat */}
      {translated && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              padding: 12,
              background: "#FAF6EF",
              border: "1px solid rgba(16,56,38,0.08)",
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.6,
              color: "#0B1F18",
              whiteSpace: "pre-wrap",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {translated}
          </div>
          <button
            onClick={copyToClipboard}
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(16,56,38,0.15)",
              background: "white",
              color: "#50625A",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      )}

      {variant === "compact" && (
        <button
          onClick={() => {
            setIsOpen(false);
            setTranslated(null);
            setError(null);
          }}
          style={{
            marginTop: 8,
            display: "block",
            background: "none",
            border: "none",
            color: "#6A8F6D",
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "underline",
          }}
        >
          Fermer
        </button>
      )}
    </div>
  );
}
