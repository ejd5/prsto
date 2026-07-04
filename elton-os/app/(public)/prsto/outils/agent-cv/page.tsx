"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Send, Brain, Sparkles, FileText, RotateCcw, Copy, Check } from "lucide-react";

interface Message {
  role: "agent" | "user";
  content: string;
}

interface AgentResponse {
  reply: string;
  suggestedSection?: string | null;
  isComplete?: boolean;
  extractedData?: {
    currentRole?: string;
    company?: string;
    teamSize?: string;
    pnlScope?: string;
    achievements?: string[];
    internationalScope?: string;
  };
  provider?: string;
  turnCount?: number;
}

const WELCOME_MESSAGE: Message = {
  role: "agent",
  content: "Bonjour, je suis PRSTO Agent CV. Je vais vous interviewer pour construire votre CV executive-grade ensemble. Pour commencer : quel poste occupez-vous actuellement, et depuis combien d'années ?",
};

export default function AgentCVPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<NonNullable<AgentResponse["extractedData"]>>({});
  const [turnCount, setTurnCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tools/resume-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: newMessages,
          profile: extracted,
          cvDraft: generatedCV,
        }),
      });
      const data: AgentResponse = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "agent", content: "Désolé, erreur technique. Pouvez-vous reformuler ?" }]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
        if (data.extractedData) {
          setExtracted((prev) => ({ ...prev, ...data.extractedData }));
        }
        if (data.turnCount) setTurnCount(data.turnCount);
        if (data.isComplete) setIsComplete(true);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "agent", content: "Erreur réseau. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setExtracted({});
    setTurnCount(0);
    setIsComplete(false);
    setGeneratedCV(null);
  };

  const generateCV = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tools/resume-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: [
            ...messages,
            { role: "user" as const, content: "[GÉNÉRATION FINALE] Génère maintenant mon CV Master complet à partir des infos collectées." },
          ],
          profile: extracted,
          cvDraft: generatedCV,
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setGeneratedCV(data.reply);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const copyCV = () => {
    if (generatedCV) {
      navigator.clipboard.writeText(generatedCV);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <Brain size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">Agent conversationnel · Turn {turnCount}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl mb-2" style={{ color: "var(--prsto-forest)" }}>
            PRSTO Agent CV
          </h1>
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            Un agent IA qui vous interview et construit votre CV Master exécutif. Pas un formulaire — une vraie conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chat (2 cols) */}
          <div className="lg:col-span-2 rounded-2xl flex flex-col" style={{ background: "#FFF", border: "1px solid #E5E7EB", height: "70vh", minHeight: 500 }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: msg.role === "agent" ? "var(--prsto-forest)" : "#F3F4F6",
                      color: msg.role === "agent" ? "#FFF" : "var(--texte)",
                    }}
                  >
                    {msg.role === "agent" ? <Brain size={16} /> : <span className="text-xs font-bold">You</span>}
                  </div>
                  <div
                    className="max-w-[75%] p-3 rounded-2xl text-sm"
                    style={{
                      background: msg.role === "agent" ? "#F9FAFB" : "var(--prsto-forest)",
                      color: msg.role === "agent" ? "var(--texte)" : "#FFF",
                      borderTopLeftRadius: msg.role === "agent" ? 4 : 12,
                      borderTopRightRadius: msg.role === "user" ? 4 : 12,
                    }}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--prsto-forest)", color: "#FFF" }}>
                    <Brain size={16} />
                  </div>
                  <div className="p-3 rounded-2xl" style={{ background: "#F9FAFB" }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: "var(--texte-tertiaire)" }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Répondez à l'agent..."
                  rows={2}
                  className="flex-1 p-3 rounded-lg text-sm outline-none resize-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
                  disabled={loading}
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="px-4 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--prsto-forest)", color: "#FFF" }}
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                <span>Entr pour envoyer · Shift+Entr pour nouvelle ligne</span>
                <button onClick={reset} className="flex items-center gap-1 hover:text-red-600">
                  <RotateCcw size={11} /> Recommencer
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: extracted data + actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Extracted data */}
            <div className="rounded-2xl p-5" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
              <h3 className="text-xs font-mono uppercase tracking-wide mb-3" style={{ color: "var(--texte-secondaire)" }}>
                <Sparkles size={12} className="inline mr-1" style={{ color: "#F59E0B" }} />
                Profil extrait
              </h3>
              <div className="space-y-2 text-xs">
                {extracted.currentRole && (
                  <div>
                    <span style={{ color: "var(--texte-tertiaire)" }}>Poste:</span>{" "}
                    <span style={{ color: "var(--texte)" }}>{extracted.currentRole}</span>
                  </div>
                )}
                {extracted.company && (
                  <div>
                    <span style={{ color: "var(--texte-tertiaire)" }}>Entreprise:</span>{" "}
                    <span style={{ color: "var(--texte)" }}>{extracted.company}</span>
                  </div>
                )}
                {extracted.teamSize && (
                  <div>
                    <span style={{ color: "var(--texte-tertiaire)" }}>Équipe:</span>{" "}
                    <span style={{ color: "var(--texte)" }}>{extracted.teamSize}</span>
                  </div>
                )}
                {extracted.pnlScope && (
                  <div>
                    <span style={{ color: "var(--texte-tertiaire)" }}>P&L:</span>{" "}
                    <span style={{ color: "var(--texte)" }}>{extracted.pnlScope}</span>
                  </div>
                )}
                {extracted.internationalScope && (
                  <div>
                    <span style={{ color: "var(--texte-tertiaire)" }}>International:</span>{" "}
                    <span style={{ color: "var(--texte)" }}>{extracted.internationalScope}</span>
                  </div>
                )}
                {extracted.achievements && extracted.achievements.length > 0 && (
                  <div>
                    <span style={{ color: "var(--texte-tertiaire)" }}>Réalisations:</span>
                    <ul className="mt-1 space-y-1">
                      {extracted.achievements.map((a, i) => (
                        <li key={i} className="flex gap-1" style={{ color: "var(--texte)" }}>
                          <span style={{ color: "#10B981" }}>·</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {Object.keys(extracted).length === 0 && (
                  <p className="italic" style={{ color: "var(--texte-tertiaire)" }}>
                    L'agent va remplir ce profil au fil de la conversation…
                  </p>
                )}
              </div>
            </div>

            {/* Generate CV */}
            {turnCount >= 5 && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <h3 className="text-xs font-mono uppercase tracking-wide mb-3" style={{ color: "#92400E" }}>
                  <FileText size={12} className="inline mr-1" />
                  Génération du CV
                </h3>
                <p className="text-xs mb-3" style={{ color: "var(--texte-secondaire)" }}>
                  L'agent a collecté assez d'infos pour générer votre CV Master exécutif.
                </p>
                <button
                  onClick={generateCV}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "var(--prsto-forest)", color: "#FFF" }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Générer mon CV
                </button>
              </div>
            )}

            {/* Generated CV */}
            {generatedCV && (
              <div className="rounded-2xl p-5" style={{ background: "#FFF", border: "1px solid #10B981" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wide" style={{ color: "#10B981" }}>
                    <Check size={12} className="inline mr-1" />
                    CV généré
                  </h3>
                  <button onClick={copyCV} className="text-xs flex items-center gap-1" style={{ color: "var(--prsto-forest)" }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>
                <pre className="text-xs whitespace-pre-wrap p-3 rounded-lg max-h-96 overflow-y-auto" style={{ background: "#F9FAFB", color: "var(--texte)", fontFamily: "ui-monospace, monospace" }}>
                  {generatedCV}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
