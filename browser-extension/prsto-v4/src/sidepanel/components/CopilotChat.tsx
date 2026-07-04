/**
 * CopilotChat — Full Side Panel Chat UI
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, JobOffer } from "../../lib/types";
import { generateId } from "../../lib/storage";

// ─── Icons (inline SVG) ────────────────────────────

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2 7h7l-5.5 4 2 7L12 14l-5.5 4 2-7-5.5-4h7z"/></svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
);

const PRSTO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23E4B118" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><circle cx="12" cy="12" r="3" fill="%23E4B118"/><line x1="16" y1="8" x2="18" y2="6"/><line x1="18" y1="10" x2="22" y2="6" opacity="0.5"/></svg>`;

// ─── Streaming Logic ───────────────────────────────

function useStreamingConnect() {
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const p = chrome.runtime.connect({ name: "prsto-stream" });
    setPort(p);
    return () => {
      try { p.disconnect(); } catch {}
    };
  }, []);

  return port;
}

// ─── Component ──────────────────────────────────────

export default function CopilotChat({ initialOffer }: { initialOffer: JobOffer | null }) {
  const [offer, setOffer] = useState<JobOffer | null>(initialOffer);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamMsgId, setStreamMsgId] = useState<string | null>(null);
  const [offerLoaded, setOfferLoaded] = useState(false);
  const [score, setScore] = useState<any>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const port = useStreamingConnect();

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, streamContent]);

  // Listen for score events
  useEffect(() => {
    const handler = (msg: any) => {
      if (msg?.type === "prsto:scoreReady" && msg.data?.offer) {
        setOffer(msg.data.offer);
        if (msg.data.score) setScore(msg.data.score);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // Auto-inject offer context
  useEffect(() => {
    if (offer && !offerLoaded && port) {
      setOfferLoaded(true);
      const ctxMsg: ChatMessage = {
        id: generateId(),
        role: "system",
        content: `📋 Offre détectée : **${offer.title}** — ${offer.company} (${offer.location || "Lieu inconnu"})`,
        createdAt: new Date().toISOString(),
        meta: { offer: { title: offer.title, company: offer.company, url: offer.url } },
      };
      setMessages([ctxMsg]);

      // Auto-analyze
      sendAnalysis([ctxMsg], offer);
    }
  }, [offer, offerLoaded, port]);

  // ─── Send Analysis ───────────────────────────────

  function sendAnalysis(history: ChatMessage[], currentOffer: JobOffer) {
    if (!port) return;

    setStreaming(true);
    const msgId = generateId();
    setStreamMsgId(msgId);
    setStreamContent("");

    port.postMessage({
      cmd: "analyze",
      payload: {
        offer: currentOffer,
        history: history
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      },
    });

    // Listen for stream chunks from this port
    const handler = (chunk: any) => {
      if (chunk.type === "delta") {
        setStreamContent(chunk.full || chunk.content || "");
        if (chunk.meta?.score && !score) setScore(chunk.meta.score);
      } else if (chunk.type === "done") {
        const finalContent = chunk.full || streamContent || "";
        const finalMsg: ChatMessage = {
          id: msgId,
          role: "assistant",
          content: finalContent,
          createdAt: new Date().toISOString(),
          meta: {
            score: chunk.meta?.score || score,
            latencyMs: chunk.meta?.latencyMs,
          },
        };
        setMessages((prev) => [...prev, finalMsg]);
        setStreaming(false);
        setStreamMsgId(null);
        setStreamContent("");
        port.onMessage.removeListener(handler);
      } else if (chunk.type === "error") {
        const errMsg: ChatMessage = {
          id: msgId,
          role: "assistant",
          content: "❌ " + (chunk.error || "Erreur inconnue"),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreaming(false);
        setStreamMsgId(null);
        setStreamContent("");
        port.onMessage.removeListener(handler);
      }
    };

    port.onMessage.addListener(handler);
  }

  // ─── Send Chat Message ────────────────────────────

  function sendMessage(text: string) {
    if (!port || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");

    setStreaming(true);
    const msgId = generateId();
    setStreamMsgId(msgId);
    setStreamContent("");

    port.postMessage({
      cmd: "chat",
      payload: {
        message: userMsg.content,
        offer: offer || undefined,
        history: newHistory
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      },
    });

    const handler = (chunk: any) => {
      if (chunk.type === "delta") {
        setStreamContent(chunk.full || chunk.content || "");
      } else if (chunk.type === "done") {
        const finalContent = chunk.full || streamContent || "";
        const finalMsg: ChatMessage = {
          id: msgId,
          role: "assistant",
          content: finalContent,
          createdAt: new Date().toISOString(),
          meta: { latencyMs: chunk.meta?.latencyMs },
        };
        setMessages((prev) => [...prev, finalMsg]);
        setStreaming(false);
        setStreamMsgId(null);
        setStreamContent("");
        port.onMessage.removeListener(handler);
      } else if (chunk.type === "error") {
        const errMsg: ChatMessage = {
          id: msgId,
          role: "assistant",
          content: "❌ " + (chunk.error || "Erreur inconnue"),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreaming(false);
        setStreamMsgId(null);
        setStreamContent("");
        port.onMessage.removeListener(handler);
      }
    };

    port.onMessage.addListener(handler);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    setOffer(null);
    setScore(null);
    setStreamMsgId(null);
    setStreamContent("");
    setStreaming(false);
    setOfferLoaded(false);
  }

  function handleQuickAction(action: string) {
    switch (action) {
      case "score":
        sendMessage("Analyse mon profil comparé à cette offre. Donne-moi un score détaillé sur 6 dimensions : rôle, séniorité, localisation, secteur, compétences techniques, compatibilité ATS.");
        break;
      case "cv":
        sendMessage("Quels mots-clés de mon CV dois-je modifier ou ajouter pour maximiser mon score ATS sur cette offre ?");
        break;
      case "lettre":
        sendMessage("Génère un plan de lettre de motivation spécifique pour cette offre, en 3 paragraphes maximum.");
        break;
      case "entretien":
        sendMessage("Quelles sont les 5 questions d'entretien les plus probables pour ce poste ? Prépare-moi des réponses structurées.");
        break;
      case "save":
        if (offer) {
          chrome.runtime.sendMessage({ type: "prsto:saveOffer", data: offer }, () => {});
          const saveMsg: ChatMessage = { id: generateId(), role: "system", content: "✅ Offre sauvegardée dans PRSTO", createdAt: new Date().toISOString() };
          setMessages((prev) => [...prev, saveMsg]);
        }
        break;
    }
  }

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <SparkleIcon />
          <span className="header-logo">PRSTO Copilot</span>
          <span className="header-badge">v4</span>
        </div>
        <div className="header-actions">
          <button onClick={clearChat} title="Effacer"><TrashIcon /></button>
        </div>
      </div>

      {/* Context banner */}
      {offer && (
        <div className="context-banner">
          <span className="context-dot" />
          <span>{offer.company || "Analyse en cours"} — {offer.title}</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="quick-actions">
        <button onClick={() => handleQuickAction("score")}>📊 Scoring</button>
        <button onClick={() => handleQuickAction("cv")}>📄 Optimiser CV</button>
        <button onClick={() => handleQuickAction("lettre")}>✉️ Lettre</button>
        <button onClick={() => handleQuickAction("entretien")}>🎯 Entretien</button>
        <button onClick={() => handleQuickAction("save")}>💾 Sauvegarder</button>
      </div>

      {/* Chat messages */}
      <div className="chat" ref={chatRef}>
        {messages.length === 0 && !streaming && (
          <div className="chat-empty">
            <div className="chat-empty-icon">✦</div>
            <h3>Votre copilote carrière IA</h3>
            <p>Naviguez vers une offre LinkedIn, Indeed ou APEC. L&apos;analyse démarre automatiquement.</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === "system") {
            return (
              <div key={msg.id} className="message message-system">
                {msg.content}
              </div>
            );
          }
          return (
            <div key={msg.id} className={`message message-${msg.role === "user" ? "user" : "assistant"}`}>
              <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              {msg.meta?.score && renderScoreWidget(msg.meta.score)}
            </div>
          );
        })}

        {streaming && streamMsgId && (
          <div className="message message-assistant" id={`msg-${streamMsgId}`}>
            <div
              className="streaming-cursor"
              dangerouslySetInnerHTML={{ __html: formatContent(streamContent || " ") }}
            />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="input-bar">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={offer ? `Poser une question sur ${offer.company}...` : "Ouvrez une offre..."}
          disabled={streaming}
          rows={1}
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming || !port}>
          <SendIcon />
        </button>
      </div>
    </>
  );
}

// ─── Helpers ───────────────────────────────────────

function formatContent(text: string): string {
  return text
    .replace(/\n/g, "<br/>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(16,56,38,0.06);padding:1px 4px;border-radius:3px;font-size:11px'>$1</code>");
}

function renderScoreWidget(scoreData: any): React.ReactNode {
  if (!scoreData?.global) return null;
  const score = Math.max(0, Math.min(100, Math.round(scoreData.global)));
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#E4B118" : "#C54B3C";

  return (
    <div className="score-block">
      <div className="score-header">
        <div className="score-ring" style={{ background: `conic-gradient(${color} ${score}%, rgba(245,240,232,0.4) 0%)` }}>
          <span>{score}</span>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
            {scoreData.oneLineVerdict || "Score de compatibilité"}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)" }}>
            {scoreData.recommendation === "postuler" ? "✅ Recommandé" : scoreData.recommendation === "retravailler" ? "⚠️ À retravailler" : "❌ À éviter"}
          </div>
        </div>
      </div>
      {scoreData.breakdown && (
        <div className="score-bars">
          {Object.entries(scoreData.breakdown).map(([key, val]) => (
            <div className="score-bar-row" key={key}>
              <span>{formatDimName(key as string)}</span>
              <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${Math.max(0, Math.min(100, Number(val)))}%` }}/></div>
              <span style={{ width: 20, textAlign: "left" }}>{Number(val)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDimName(key: string): string {
  const map: Record<string, string> = {
    role: "Rôle",
    seniority: "Séniorité",
    location: "Localisation",
    sector: "Secteur",
    skills: "Compétences",
    atsCompatibility: "ATS",
  };
  return map[key] || key;
}
