"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Play, Pause, Loader2, RotateCcw,
  Crown, DollarSign, Users, Briefcase, TrendingUp,
  ChevronRight, Volume2, AlertCircle, CheckCircle2,
} from "lucide-react";

// Lookup map — évite les problèmes de résolution Turbopack
const ICONS: Record<string, React.ElementType> = {
  Crown, DollarSign, Users, Briefcase, TrendingUp,
};

interface PanelRole {
  id: string;
  name: string;
  title: string;
  iconName: string;
  color: string;
  bgGradient: string;
  description: string;
}

const PANEL_ROLES: PanelRole[] = [
  {
    id: "ceo",
    name: "Paul Mercier",
    title: "CEO / N+1",
    iconName: "Crown",
    color: "#E4B118",
    bgGradient: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)",
    description: "Vision stratégique, leadership, alignement vision",
  },
  {
    id: "cfo",
    name: "Marie Lefèvre",
    title: "CFO / DAF",
    iconName: "DollarSign",
    color: "#0E3A29",
    bgGradient: "linear-gradient(135deg, #0E3A29 0%, #1A5A3E 100%)",
    description: "P&L, gestion financière, ROI, risques",
  },
  {
    id: "drh",
    name: "Ingrid Dubois",
    title: "DRH / Chief People Officer",
    iconName: "Users",
    color: "#6A8F6D",
    bgGradient: "linear-gradient(135deg, #6A8F6D 0%, #8FB092 100%)",
    description: "Culture, management d'équipe, soft skills",
  },
  {
    id: "pair",
    name: "Thomas Bertrand",
    title: "Pair Comex / futur collègue",
    iconName: "Briefcase",
    color: "#2563EB",
    bgGradient: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)",
    description: "Collaboration, expertise métier, intégration",
  },
  {
    id: "investisseur",
    name: "David Rousseau",
    title: "Board Member / Investisseur",
    iconName: "TrendingUp",
    color: "#DC2626",
    bgGradient: "linear-gradient(135deg, #DC2626 0%, #F87171 100%)",
    description: "Création de valeur, exit, gouvernance",
  },
];

interface InterviewQuestion {
  role: PanelRole;
  question: string;
  context?: string;
}

interface DebriefItem {
  dimension: string;
  score: number;
  feedback: string;
}

type SessionPhase = "setup" | "questions" | "debrief";

export default function MockInterviewPanelPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionPhase>("setup");
  const [jobTitle, setJobTitle] = useState("Directeur Général");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [debrief, setDebrief] = useState<DebriefItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<"elevenlabs" | "web-speech" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Vérifier le provider TTS disponible
  useEffect(() => {
    fetch("/api/tts")
      .then(r => r.json())
      .then(d => {
        setTtsProvider(d.elevenLabsConfigured ? "elevenlabs" : "web-speech");
      })
      .catch(() => {});
  }, []);

  // Démarrer la session : générer les questions via IA
  const startSession = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setCurrentAnswer("");

    try {
      const res = await fetch("/api/mock-interview-panel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company }),
      });
      const data = await res.json();

      if (data.success && data.questions) {
        setQuestions(data.questions);
        setPhase("questions");
      } else {
        setError(data.error || "Erreur de génération");
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  // Synthétiser vocalement une question
  const speakQuestion = async (question: InterviewQuestion) => {
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.question, role: question.role.id }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.provider === "elevenlabs" && data.audioBase64) {
          // ElevenLabs : jouer l'audio MP3
          if (audioRef.current) {
            audioRef.current.src = `data:audio/mpeg;base64,${data.audioBase64}`;
            audioRef.current.play();
          }
        } else if (data.provider === "web-speech") {
          // Web Speech API : utiliser le navigateur
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(question.question);
            utterance.lang = "fr-FR";
            utterance.rate = data.voiceConfig?.rate || 0.95;
            utterance.pitch = data.voiceConfig?.pitch || 1.0;

            // Trouver une voix correspondant au genre
            const voices = window.speechSynthesis.getVoices();
            const frenchVoices = voices.filter(v => v.lang.startsWith("fr"));
            const genderVoice = frenchVoices.find(v =>
              data.voiceConfig?.gender === "female"
                ? v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("femme")
                : v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("homme")
            ) || frenchVoices[0];

            if (genderVoice) utterance.voice = genderVoice;
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
  };

  // Passer à la question suivante
  const nextQuestion = () => {
    stopSpeaking();
    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Toutes les questions répondues → générer le débrief
      generateDebrief(newAnswers);
    }
  };

  // Générer le débrief 360°
  const generateDebrief = async (answers: string[]) => {
    setLoading(true);
    setPhase("debrief");
    try {
      const qaPairs = questions.map((q, i) => ({
        role: q.role.title,
        question: q.question,
        answer: answers[i] || "(pas de réponse)",
      }));

      const res = await fetch("/api/mock-interview-panel/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, qaPairs }),
      });
      const data = await res.json();

      if (data.success && data.debrief) {
        setDebrief(data.debrief);
      } else {
        setError(data.error || "Erreur débrief");
      }
    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setPhase("setup");
    setQuestions([]);
    setDebrief([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setCurrentAnswer("");
    setError(null);
    stopSpeaking();
  };

  // ─── PHASE SETUP ─────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#FAF6EF" }}>
        <div className="max-w-3xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium mb-6"
              style={{ borderColor: "rgba(228,177,24,0.25)", color: "#A38010", background: "rgba(228,177,24,0.08)" }}
            >
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: "#E4B118" }} />
              Mock Interview Panel — Simulation Comex
            </div>
            <h1
              className="text-4xl font-extrabold tracking-[-0.04em] mb-3"
              style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#0B1F18" }}
            >
              Préparez votre entretien
              <br />
              <span style={{ color: "#E4B118" }}>face à un panel de 5 experts</span>
            </h1>
            <p className="text-base max-w-xl mx-auto" style={{ color: "#6A8F6D" }}>
              5 questions sur-mesure générées par IA, voix différenciées par rôle, débrief 360° final.
              {ttsProvider === "web-speech" && (
                <span className="block mt-2 text-xs" style={{ color: "#D97706" }}>
                  ⚠️ Voix navigateur (Web Speech). Pour une qualité 100% humaine, configurez ElevenLabs.
                </span>
              )}
              {ttsProvider === "elevenlabs" && (
                <span className="block mt-2 text-xs" style={{ color: "#16A34A" }}>
                  ✅ Voix ElevenLabs activées — qualité 100% humaine
                </span>
              )}
            </p>
          </div>

          {/* Panel preview */}
          <div className="grid grid-cols-5 gap-3 mb-8">
            {PANEL_ROLES.map(role => {
              const Icon = ICONS[role.iconName] || Sparkles;
              return (
                <div
                  key={role.id}
                  className="rounded-xl p-4 text-center"
                  style={{ background: "white", border: "1px solid rgba(16,56,38,0.08)" }}
                >
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ background: role.bgGradient }}
                  >
                    <Icon size={20} color="white" />
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: "#0B1F18" }}>{role.title.split(" / ")[0]}</div>
                  <div className="text-[9px]" style={{ color: "#6A8F6D" }}>{role.name.split(" ")[0]}</div>
                </div>
              );
            })}
          </div>

          {/* Setup form */}
          <div className="rounded-2xl p-8" style={{ background: "white", border: "1px solid rgba(16,56,38,0.08)" }}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#6A8F6D" }}>
                  Poste visé
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="Directeur Général, CEO, COO..."
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: "#FAF6EF", border: "1px solid rgba(16,56,38,0.12)", color: "#0B1F18" }}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#6A8F6D" }}>
                  Entreprise (optionnel)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Nom de l'entreprise..."
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  style={{ background: "#FAF6EF", border: "1px solid rgba(16,56,38,0.12)", color: "#0B1F18" }}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626" }}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={startSession}
                disabled={loading || !jobTitle.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: loading || !jobTitle.trim() ? "rgba(14,56,41,0.3)" : "#0E3A29",
                  color: "white",
                  cursor: loading || !jobTitle.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Génération des questions...</>
                ) : (
                  <><Sparkles size={16} /> Démarrer la simulation</>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "#6A8F6D" }}>
              Le panel posera 5 questions sur-mesure (1 par rôle). Préparez vos réponses, puis recevez un débrief 360°.
            </p>
          </div>
        </div>
        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      </div>
    );
  }

  // ─── PHASE QUESTIONS ─────────────────────────────────────
  if (phase === "questions" && questions.length > 0) {
    const currentQ = questions[currentQuestionIndex];
    const RoleIcon = ICONS[currentQ.role.iconName] || Sparkles;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen p-6" style={{ background: "#FAF6EF" }}>
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={restart} className="text-xs" style={{ color: "#6A8F6D" }}>
              ← Quitter
            </button>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(16,56,38,0.1)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: "#E4B118" }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: "#6A8F6D" }}>
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Question card */}
          <div
            className="rounded-3xl p-8 mb-6"
            style={{ background: "white", border: "1px solid rgba(16,56,38,0.08)" }}
          >
            {/* Role header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: currentQ.role.bgGradient }}
              >
                <RoleIcon size={28} color="white" />
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: "#0B1F18" }}>
                  {currentQ.role.name}
                </div>
                <div className="text-sm" style={{ color: currentQ.role.color }}>
                  {currentQ.role.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#6A8F6D" }}>
                  {currentQ.role.description}
                </div>
              </div>
            </div>

            {/* Question */}
            <div
              className="p-5 rounded-xl mb-4"
              style={{ background: "#FAF6EF", border: "1px solid rgba(16,56,38,0.06)" }}
            >
              <p className="text-base leading-relaxed" style={{ color: "#0B1F18" }}>
                {currentQ.question}
              </p>
            </div>

            {currentQ.context && (
              <div className="text-xs italic mb-4" style={{ color: "#6A8F6D" }}>
                💡 {currentQ.context}
              </div>
            )}

            {/* Audio controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => isSpeaking ? stopSpeaking() : speakQuestion(currentQ)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: isSpeaking ? "rgba(220,38,38,0.1)" : "rgba(228,177,24,0.12)",
                  color: isSpeaking ? "#DC2626" : "#A38010",
                  border: `1px solid ${isSpeaking ? "rgba(220,38,38,0.2)" : "rgba(228,177,24,0.25)"}`,
                }}
              >
                {isSpeaking ? <Pause size={14} /> : <Volume2 size={14} />}
                {isSpeaking ? "Arrêter" : "Écouter la question"}
              </button>
              {ttsProvider === "web-speech" && (
                <span className="text-[10px]" style={{ color: "#D97706" }}>
                  Voix navigateur
                </span>
              )}
              {ttsProvider === "elevenlabs" && (
                <span className="text-[10px]" style={{ color: "#16A34A" }}>
                  ✅ Voix humaine
                </span>
              )}
            </div>
          </div>

          {/* Answer area */}
          <div className="rounded-3xl p-8" style={{ background: "white", border: "1px solid rgba(16,56,38,0.08)" }}>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#6A8F6D" }}>
              Votre réponse
            </label>
            <textarea
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              rows={6}
              placeholder="Tapez votre réponse ici... (ou répondez à voix haute si vous préférez)"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "#FAF6EF", border: "1px solid rgba(16,56,38,0.12)", color: "#0B1F18", resize: "vertical" }}
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={{ color: "#6A8F6D" }}>
                {currentAnswer.length} caractères
              </span>
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: currentAnswer.trim() ? "#0E3A29" : "rgba(14,56,41,0.3)",
                  color: "white",
                }}
              >
                {currentQuestionIndex < questions.length - 1 ? "Question suivante" : "Voir le débrief"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      </div>
    );
  }

  // ─── PHASE DEBRIEF ───────────────────────────────────────
  if (phase === "debrief") {
    return (
      <div className="min-h-screen p-6" style={{ background: "#FAF6EF" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-extrabold tracking-[-0.04em] mb-2"
              style={{ fontFamily: "Playfair Display, Georgia, serif", color: "#0B1F18" }}
            >
              Débrief 360°
            </h1>
            <p className="text-sm" style={{ color: "#6A8F6D" }}>
              Analyse de vos réponses par les 5 membres du panel
            </p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#E4B118" }} />
              <p className="text-sm" style={{ color: "#6A8F6D" }}>
                Le panel analyse vos réponses...
              </p>
            </div>
          )}

          {!loading && debrief.length > 0 && (
            <>
              {/* Score global */}
              <div
                className="rounded-3xl p-8 mb-6 text-center"
                style={{ background: "linear-gradient(135deg, #0E3A29 0%, #0B2E21 100%)", color: "white" }}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#F2C94C" }}>
                  Score global
                </div>
                <div
                  className="text-6xl font-extrabold"
                  style={{ fontFamily: "Playfair Display, Georgia, serif" }}
                >
                  {Math.round(debrief.reduce((s, d) => s + d.score, 0) / debrief.length)}/100
                </div>
                <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Basé sur {debrief.length} dimensions d'évaluation
                </p>
              </div>

              {/* Dimensions */}
              <div className="space-y-4">
                {debrief.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-6"
                    style={{ background: "white", border: "1px solid rgba(16,56,38,0.08)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold" style={{ color: "#0B1F18" }}>
                        {item.dimension}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full" style={{ background: "rgba(16,56,38,0.1)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.score}%`,
                              background: item.score >= 70 ? "#16A34A" : item.score >= 50 ? "#E4B118" : "#DC2626",
                            }}
                          />
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: item.score >= 70 ? "#16A34A" : item.score >= 50 ? "#E4B118" : "#DC2626" }}
                        >
                          {item.score}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>
                      {item.feedback}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={restart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "white", border: "1px solid rgba(16,56,38,0.15)", color: "#0E3A29" }}
                >
                  <RotateCcw size={14} /> Recommencer
                </button>
                <button
                  onClick={() => router.push("/conseiller")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "#0E3A29", color: "white" }}
                >
                  <Sparkles size={14} /> Demander au Conseiller
                </button>
              </div>
            </>
          )}

          {!loading && debrief.length === 0 && error && (
            <div className="text-center py-20">
              <AlertCircle size={32} className="mx-auto mb-4" style={{ color: "#DC2626" }} />
              <p className="text-sm mb-4" style={{ color: "#DC2626" }}>{error}</p>
              <button onClick={restart} className="px-6 py-2 rounded-xl text-sm font-bold" style={{ background: "#0E3A29", color: "white" }}>
                Recommencer
              </button>
            </div>
          )}
        </div>
        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      </div>
    );
  }

  return null;
}
