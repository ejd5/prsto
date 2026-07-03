"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, RotateCcw, Mic, MicOff, Video, VideoOff,
  ChevronRight, Phone, Volume2, Crown, DollarSign, Users, Briefcase, TrendingUp,
} from "lucide-react";

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
  portrait: string;
}

const PANEL_ROLES: PanelRole[] = [
  { id: "ceo", name: "Paul Mercier", title: "CEO / N+1", iconName: "Crown", color: "#E4B118", bgGradient: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)", description: "Vision stratégique, leadership", portrait: "/branding/portraits/ceo-paul/paul-01.png" },
  { id: "cfo", name: "Marie Lefèvre", title: "CFO / DAF", iconName: "DollarSign", color: "#0E3A29", bgGradient: "linear-gradient(135deg, #0E3A29 0%, #1A5A3E 100%)", description: "P&L, finance, ROI", portrait: "/branding/portraits/dirmarketing-sabrina/sabrina-01.png" },
  { id: "drh", name: "Ingrid Dubois", title: "DRH / People Officer", iconName: "Users", color: "#6A8F6D", bgGradient: "linear-gradient(135deg, #6A8F6D 0%, #8FB092 100%)", description: "Culture, management", portrait: "/branding/portraits/drh-ingrid/ingrid-01.png" },
  { id: "pair", name: "Thomas Bertrand", title: "Pair Comex", iconName: "Briefcase", color: "#2563EB", bgGradient: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)", description: "Collaboration, expertise", portrait: "/branding/portraits/cto-john/john-01.png" },
  { id: "investisseur", name: "David Rousseau", title: "Board / Investisseur", iconName: "TrendingUp", color: "#DC2626", bgGradient: "linear-gradient(135deg, #DC2626 0%, #F87171 100%)", description: "Création de valeur, exit", portrait: "/branding/portraits/boardmanager-david/david-01.png" },
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

type Phase = "setup" | "call" | "debrief";

export default function MockInterviewPanelPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [jobTitle, setJobTitle] = useState("Directeur Général");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [debrief, setDebrief] = useState<DebriefItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Visio states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [thinking, setThinking] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Webcam ───
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (err) {
      setCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  // ─── Speech Recognition ───
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Reconnaissance vocale non supportée par ce navigateur. Utilisez Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(prev => (final ? prev + final : prev) + interim);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ─── Timer ───
  useEffect(() => {
    if (phase === "call") {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ─── Cleanup ───
  useEffect(() => {
    return () => {
      stopCamera();
      stopListening();
    };
  }, [stopCamera, stopListening]);

  // ─── Start session ───
  const startSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mock-interview-panel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setPhase("call");
        setCallDuration(0);
        // Démarrer la caméra et parler la première question
        await startCamera();
        setTimeout(() => speakQuestion(data.questions[0]), 1500);
      } else {
        setError(data.error || "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  // ─── Speak question via TTS ───
  const speakQuestion = async (question: InterviewQuestion) => {
    setIsSpeaking(true);
    setThinking(false);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.question, role: question.role.id }),
      });
      const data = await res.json();

      if (data.success && data.audioBase64) {
        if (audioRef.current) {
          audioRef.current.src = `data:audio/mpeg;base64,${data.audioBase64}`;
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            // Auto-démarrer l'écoute de la réponse
            if (micOn) startListening();
          };
          audioRef.current.play();
        }
      } else if (data.provider === "web-speech") {
        // Fallback Web Speech
        const utterance = new SpeechSynthesisUtterance(question.question);
        utterance.lang = "fr-FR";
        utterance.rate = 0.95;
        utterance.onend = () => {
          setIsSpeaking(false);
          if (micOn) startListening();
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsSpeaking(false);
    }
  };

  // ─── Next question ───
  const nextQuestion = () => {
    stopListening();
    setIsSpeaking(false);
    const newAnswers = [...answers, transcript];
    setAnswers(newAnswers);
    setTranscript("");

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setThinking(true);
      setTimeout(() => speakQuestion(questions[currentIdx + 1]), 2000);
    } else {
      generateDebrief(newAnswers);
    }
  };

  const generateDebrief = async (allAnswers: string[]) => {
    setLoading(true);
    setPhase("debrief");
    stopCamera();
    stopListening();
    try {
      const qaPairs = questions.map((q, i) => ({
        role: q.role.title,
        question: q.question,
        answer: allAnswers[i] || "(pas de réponse)",
      }));
      const res = await fetch("/api/mock-interview-panel/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, qaPairs }),
      });
      const data = await res.json();
      if (data.success && data.debrief) setDebrief(data.debrief);
    } catch {
      setError("Erreur débrief");
    } finally {
      setLoading(false);
    }
  };

  const endCall = () => {
    stopCamera();
    stopListening();
    setIsSpeaking(false);
    setPhase("setup");
    setQuestions([]);
    setDebrief([]);
    setCurrentIdx(0);
    setAnswers([]);
    setTranscript("");
    setCallDuration(0);
    setError(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ═════════ SETUP PHASE ═════════
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0B1F18" }}>
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] mb-6"
              style={{ background: "rgba(228,177,24,0.12)", border: "1px solid rgba(228,177,24,0.25)", color: "#F2C94C" }}>
              <Video size={12} /> Visio Entretien — Panel Comex
            </div>
            <h1 className="text-4xl font-extrabold tracking-[-0.04em] mb-3 text-white"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Simulez votre entretien<br />
              <span style={{ color: "#E4B118" }}>en visio avec 5 experts</span>
            </h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Caméra activée · Voix naturelle · Réponse au micro · Débrief 360°
            </p>
          </div>

          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-white opacity-60">Poste visé</label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  placeholder="Directeur Général, CEO..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-white opacity-60">Entreprise (optionnel)</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Nom de l'entreprise..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
              </div>
              {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>⚠ {error}</div>}
              <button onClick={startSession} disabled={loading || !jobTitle.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: loading || !jobTitle.trim() ? "rgba(228,177,24,0.3)" : "#E4B118", color: "#0B1F18" }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : <><Video size={16} /> Démarrer la visio</>}
              </button>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            {PANEL_ROLES.map(r => {
              const Icon = ICONS[r.iconName] || Sparkles;
              return (
                <div key={r.id} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: r.bgGradient }}>
                    <Icon size={16} color="white" />
                  </div>
                  <span className="text-[8px] text-white opacity-40">{r.name.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            📷 Votre caméra s'activera au démarrage. Le recruteur vous parlera à voix haute.
          </p>
        </div>
        <audio ref={audioRef} />
      </div>
    );
  }

  // ═════════ CALL PHASE (Visio) ═════════
  if (phase === "call" && questions.length > 0) {
    const q = questions[currentIdx];
    const Icon = ICONS[q.role.iconName] || Sparkles;
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: "#0B1F18" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#DC2626" }} />
            <span className="text-xs font-mono text-white opacity-60">EN DIRECT · {formatTime(callDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-white opacity-40">Question {currentIdx + 1}/{questions.length}</div>
            <div className="w-32 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "#E4B118" }} />
            </div>
          </div>
          <button onClick={endCall} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(220,38,38,0.2)", color: "#F87171" }}>
            <Phone size={12} /> Quitter
          </button>
        </div>

        {/* Main visio area */}
        <div className="flex-1 flex gap-2 p-2">
          {/* Interviewer (left, 65%) */}
          <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ background: "#1a1a2e" }}>
            {/* Portrait */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative w-full h-full flex items-center justify-center transition-all"
                style={{
                  animation: isSpeaking ? "talking 0.3s ease-in-out infinite alternate" : "none",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.role.portrait}
                  alt={q.role.name}
                  className="max-w-full max-h-full object-cover"
                  style={{
                    borderRadius: "16px",
                    filter: isSpeaking ? "brightness(1.05)" : "brightness(0.95)",
                  }}
                />
              </div>
            </div>

            {/* Overlay: name + title */}
            <div className="absolute bottom-0 left-0 right-0 p-4"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: q.role.bgGradient }}>
                  <Icon size={18} color="white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{q.role.name}</div>
                  <div className="text-xs" style={{ color: q.role.color }}>{q.role.title}</div>
                </div>
                {isSpeaking && (
                  <div className="ml-auto flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1 rounded-full"
                        style={{
                          background: "#E4B118",
                          height: 20,
                          animation: `wave 0.4s ${i * 0.1}s ease-in-out infinite alternate`,
                        }} />
                    ))}
                    <span className="text-[10px] text-white opacity-60 ml-1">parle...</span>
                  </div>
                )}
                {thinking && (
                  <div className="ml-auto text-xs text-white opacity-50">
                    <Loader2 size={14} className="animate-spin inline mr-1" /> réfléchit...
                  </div>
                )}
              </div>
            </div>

            {/* Question text overlay */}
            {isSpeaking && (
              <div className="absolute top-4 left-4 right-4 p-4 rounded-xl"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" }}>
                <p className="text-sm leading-relaxed text-white">{q.question}</p>
              </div>
            )}
          </div>

          {/* User webcam (right, 35%) */}
          <div className="w-[35%] rounded-2xl overflow-hidden relative" style={{ background: "#1a1a2e" }}>
            {cameraOn ? (
              <video ref={videoRef} autoPlay playsInline muted
                className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff size={32} className="text-white opacity-30" />
              </div>
            )}

            {/* User label */}
            <div className="absolute bottom-0 left-0 right-0 p-3"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white opacity-70">Vous</span>
                {isListening && (
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: "#F87171" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#DC2626" }} />
                    écoute...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: transcript + controls */}
        <div className="px-4 py-3 space-y-2" style={{ background: "rgba(0,0,0,0.3)" }}>
          {/* Transcript */}
          {transcript && (
            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}>
              {transcript}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => { cameraOn ? stopCamera() : startCamera(); }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(220,38,38,0.3)", color: cameraOn ? "white" : "#F87171" }}>
                {cameraOn ? <Video size={16} /> : <VideoOff size={16} />}
              </button>
              <button onClick={() => { micOn ? (stopListening(), setMicOn(false)) : (startListening(), setMicOn(true)); }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ background: isListening ? "rgba(220,38,38,0.3)" : micOn ? "rgba(255,255,255,0.1)" : "rgba(220,38,38,0.3)", color: isListening ? "#F87171" : micOn ? "white" : "#F87171" }}>
                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
              {!isSpeaking && !thinking && (
                <span className="text-xs text-white opacity-50 ml-2">
                  {isListening ? "Parlez votre réponse..." : "Cliquez sur le micro pour répondre"}
                </span>
              )}
            </div>

            <button onClick={nextQuestion}
              disabled={isSpeaking || thinking}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: isSpeaking || thinking ? "rgba(228,177,24,0.2)" : "#E4B118",
                color: "#0B1F18",
              }}>
              {currentIdx < questions.length - 1 ? "Question suivante" : "Voir le débrief"}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <audio ref={audioRef} />

        <style>{`
          @keyframes talking {
            0% { transform: scale(1); }
            100% { transform: scale(1.01); }
          }
          @keyframes wave {
            0% { height: 8px; }
            100% { height: 24px; }
          }
        `}</style>
      </div>
    );
  }

  // ═════════ DEBRIEF PHASE ═════════
  if (phase === "debrief") {
    return (
      <div className="min-h-screen p-6" style={{ background: "#0B1F18" }}>
        <div className="max-w-2xl mx-auto pt-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
              Débrief 360°
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Analyse de vos réponses</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#E4B118" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Le panel analyse vos réponses...</p>
            </div>
          )}

          {!loading && debrief.length > 0 && (
            <>
              <div className="rounded-3xl p-8 mb-6 text-center" style={{ background: "linear-gradient(135deg, #0E3A29 0%, #0B2E21 100%)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#F2C94C" }}>Score global</div>
                <div className="text-6xl font-extrabold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                  {Math.round(debrief.reduce((s, d) => s + d.score, 0) / debrief.length)}/100
                </div>
              </div>
              <div className="space-y-3">
                {debrief.map((item, i) => (
                  <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white">{item.dimension}</h3>
                      <span className="text-sm font-bold" style={{ color: item.score >= 70 ? "#16A34A" : item.score >= 50 ? "#E4B118" : "#DC2626" }}>
                        {item.score}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: item.score >= 70 ? "#16A34A" : item.score >= 50 ? "#E4B118" : "#DC2626" }} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{item.feedback}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={endCall} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}>
                  <RotateCcw size={14} /> Recommencer
                </button>
                <button onClick={() => router.push("/conseiller")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "#E4B118", color: "#0B1F18" }}>
                  <Sparkles size={14} /> Conseiller IA
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
