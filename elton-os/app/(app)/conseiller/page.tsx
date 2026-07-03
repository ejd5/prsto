"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, User, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "local" | "no_key" | "error" | "blocked";
  ts: number;
}

const SUGGESTIONS = [
  {
    icon: "🎯",
    title: "Stratégie de campagne",
    prompt: "Comment structurer ma campagne de recherche pour un poste de DG dans les 6 prochains mois ?",
  },
  {
    icon: "📝",
    title: "Optimiser mon CV",
    prompt: "Quelles sont les 5 améliorations les plus impactantes à faire sur un CV de dirigeant ?",
  },
  {
    icon: "🎤",
    title: "Préparer un entretien",
    prompt: "Donne-moi les 10 questions les plus probables pour un entretien de Country Manager et comment les préparer.",
  },
  {
    icon: "🤝",
    title: "Négocier un package",
    prompt: "Quels sont les leviers de négociation pour un package de dirigeant au-delà du fixe ?",
  },
  {
    icon: "📡",
    title: "Marché caché",
    prompt: "Comment accéder au marché caché des postes de direction non publiés ?",
  },
  {
    icon: "💼",
    title: "Travailler avec un chasseur",
    prompt: "Quels cabinets de chasse spécialisés dirigeants en France et comment les approcher ?",
  },
];

export default function ConseillerPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour 👔 Je suis votre **Conseiller Carrière PRSTO** — votre second brain dédié à votre campagne de recherche de poste de direction.\n\nJe peux vous aider sur :\n• La stratégie de campagne (ciblage, séquence, pipeline)\n• L'optimisation de votre CV Maître et CV adapté\n• La préparation d'entretiens (questions probables, STAR, négociation)\n• Le marché caché et l'approche des chasseurs de tête\n• La négociation de package (fixe, variable, equity, avantages)\n• L'utilisation des outils PRSTO\n\nPosez-moi votre question, ou choisissez un thème ci-dessous pour démarrer.",
      source: "local",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(messageText?: string) {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/conseiller/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-11, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      // ── Deux formats possibles ──
      // 1. JSON (source: local/blocked/no_key/error) — réponse instantanée
      // 2. text/event-stream (source: ai) — chunks en streaming
      const contentType = res.headers.get("content-type") || "";
      const sourceHeader = res.headers.get("x-conseiller-source") || "";

      if (contentType.includes("text/event-stream") || contentType.includes("text/plain") || sourceHeader === "ai") {
        // ── Mode streaming IA ──
        // On crée un message assistant vide qu'on remplit au fur et à mesure
        const assistantId = Date.now();
        const assistantMsg: Message = {
          role: "assistant",
          content: "",
          source: "ai",
          ts: assistantId,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (!res.body) {
          throw new Error("Pas de body de streaming");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        let lastUpdate = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          // Ignorer les chunks qui ne contiennent que des espaces (heartbeat anti-timeout ALB)
          if (chunk.trim() === "") {
            // C'est un heartbeat — on ne l'accumule pas
            continue;
          }

          // Si le chunk contient des espaces au début (heartbeat + vrai contenu), on les strip
          const meaningful = chunk.replace(/^\s+/, "");
          acc += meaningful;

          // Throttle les updates React à 1 toutes les 60ms pour éviter les re-renders excessifs
          const now = Date.now();
          if (now - lastUpdate > 60) {
            lastUpdate = now;
            const currentAcc = acc;
            setMessages((prev) =>
              prev.map((m) => (m.ts === assistantId ? { ...m, content: currentAcc } : m))
            );
          }
        }
        // Update final
        setMessages((prev) => prev.map((m) => (m.ts === assistantId ? { ...m, content: acc } : m)));
      } else {
        // ── Mode JSON (réponse locale/blocked/no_key/error) ──
        const data = await res.json();
        const assistantMsg: Message = {
          role: "assistant",
          content: data.content || "Désolé, je n'ai pas pu traiter votre demande.",
          source: data.source,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Connexion impossible. Vérifiez votre réseau et réessayez. Si le problème persiste, le service Conseiller peut être temporairement indisponible.",
          source: "error",
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function renderMarkdown(text: string) {
    // Markdown minimaliste : **bold**, listes, sauts de ligne
    return text
      .split("\n")
      .map((line, i) => {
        // Bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} style={{ color: "#0B1F18", fontWeight: 700 }}>
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          )
        );
        // List items
        if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "#E4B118", fontWeight: 700 }}>•</span>
              <span>{parts}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{ marginBottom: line.trim() ? 6 : 12 }}>
            {parts}
          </div>
        );
      });
  }

  const sourceLabel: Record<string, { text: string; color: string; bg: string }> = {
    ai: { text: "IA", color: "#E4B118", bg: "rgba(228,177,24,0.12)" },
    local: { text: "Base PRSTO", color: "#6A8F6D", bg: "rgba(106,143,109,0.12)" },
    blocked: { text: "Hors périmètre", color: "#D97706", bg: "rgba(217,119,6,0.12)" },
    error: { text: "Erreur", color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
    no_key: { text: "Mode dégradé", color: "#6A8F6D", bg: "rgba(106,143,109,0.12)" },
  };

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", background: "#FAF6EF" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid rgba(16,56,38,0.08)",
          background: "white",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0B1F18",
          }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0B1F18",
              fontFamily: "Playfair Display, Georgia, serif",
              letterSpacing: "-0.02em",
            }}
          >
            Conseiller IA PRSTO
          </div>
          <div style={{ fontSize: 12, color: "#6A8F6D" }}>
            Votre second brain dédié à votre campagne de dirigeant
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: 12,
              background: "rgba(228,177,24,0.12)",
              color: "#E4B118",
            }}
          >
            Beta
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: m.role === "user" ? "#0E3A29" : "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)",
                color: m.role === "user" ? "white" : "#0B1F18",
              }}
            >
              {m.role === "user" ? <User size={16} /> : <Sparkles size={16} />}
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: "75%",
                padding: "14px 18px",
                borderRadius: 14,
                background: m.role === "user" ? "#0E3A29" : "white",
                color: m.role === "user" ? "white" : "#0B1F18",
                border: m.role === "user" ? "none" : "1px solid rgba(16,56,38,0.08)",
                fontSize: 14,
                lineHeight: 1.6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
              {m.role === "assistant" && m.source && sourceLabel[m.source] && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(16,56,38,0.06)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: sourceLabel[m.source].color,
                    background: sourceLabel[m.source].bg,
                    padding: "3px 8px",
                    borderRadius: 8,
                    display: "inline-block",
                  }}
                >
                  {sourceLabel[m.source].text}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0B1F18",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 14,
                background: "white",
                border: "1px solid rgba(16,56,38,0.08)",
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
              <span style={{ marginLeft: 8, fontSize: 13, color: "#6A8F6D" }}>Le Conseiller réfléchit…</span>
            </div>
          </div>
        )}

        {/* Suggestions (affichées seulement au début) */}
        {messages.length <= 1 && !loading && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#6A8F6D",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MessageCircle size={12} /> Suggestions pour démarrer
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 10,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => send(s.prompt)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "white",
                    border: "1px solid rgba(16,56,38,0.08)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(228,177,24,0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(16,56,38,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0B1F18" }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6A8F6D", lineHeight: 1.4 }}>{s.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 32px 20px",
          background: "white",
          borderTop: "1px solid rgba(16,56,38,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            padding: "8px 8px 8px 16px",
            borderRadius: 14,
            border: "1px solid rgba(16,56,38,0.12)",
            background: "#FAF6EF",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question au Conseiller IA… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
            rows={1}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              resize: "none",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              color: "#0B1F18",
              maxHeight: 120,
              padding: "6px 0",
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: input.trim() && !loading ? "#0E3A29" : "rgba(14,56,38,0.2)",
              color: "white",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <Send size={14} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#6A8F6D", marginTop: 8, textAlign: "center" }}>
          Le Conseiller est calibré pour la recherche d'emploi de dirigeant. Hors périmètre, il vous orientera vers les bonnes ressources.
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#E4B118",
        display: "inline-block",
        animation: `conseiller-dot 1.4s ${delay}ms infinite ease-in-out`,
      }}
    />
  );
}
