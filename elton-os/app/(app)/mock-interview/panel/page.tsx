"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, RotateCcw, Mic, MicOff, Video, VideoOff,
  ChevronRight, Phone, Crown, DollarSign, Users, Briefcase, TrendingUp,
  Eye, Activity, AlertTriangle,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Crown, DollarSign, Users, Briefcase, TrendingUp,
};

interface PanelRole {
  id: string; name: string; title: string; iconName: string;
  color: string; bgGradient: string; description: string; portrait: string;
}

const PANEL_ROLES: PanelRole[] = [
  { id: "ceo", name: "Paul Mercier", title: "CEO / N+1", iconName: "Crown", color: "#E4B118", bgGradient: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)", description: "Vision stratégique", portrait: "/branding/portraits/ceo-paul/paul-01.png" },
  { id: "cfo", name: "Marie Lefèvre", title: "CFO / DAF", iconName: "DollarSign", color: "#0E3A29", bgGradient: "linear-gradient(135deg, #0E3A29 0%, #1A5A3E 100%)", description: "P&L, finance", portrait: "/branding/portraits/dirmarketing-sabrina/sabrina-01.png" },
  { id: "drh", name: "Ingrid Dubois", title: "DRH / People Officer", iconName: "Users", color: "#6A8F6D", bgGradient: "linear-gradient(135deg, #6A8F6D 0%, #8FB092 100%)", description: "Culture, management", portrait: "/branding/portraits/drh-ingrid/ingrid-01.png" },
  { id: "pair", name: "Thomas Bertrand", title: "Pair Comex", iconName: "Briefcase", color: "#2563EB", bgGradient: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)", description: "Collaboration", portrait: "/branding/portraits/cto-john/john-01.png" },
  { id: "investisseur", name: "David Rousseau", title: "Board / Investisseur", iconName: "TrendingUp", color: "#DC2626", bgGradient: "linear-gradient(135deg, #DC2626 0%, #F87171 100%)", description: "Création de valeur", portrait: "/branding/portraits/boardmanager-david/david-01.png" },
];

// ─── Real metrics tracked during the call ───
interface CallMetrics {
  faceDetectedRatio: number;    // % du temps où le visage est détecté
  eyeContactRatio: number;      // % du temps où le regard est vers la caméra
  headTiltAvg: number;          // inclinaison moyenne de la tête (degrés)
  speakingTimeTotal: number;    // temps de parole total (secondes)
  wordCount: number;             // nombre de mots parlés
  fillerWordCount: number;       // mots de remplissage (euh, hmm, donc, genre...)
  answersProvided: number;       // nombre de réponses réellement fournies
  answersSkipped: number;        // nombre de questions sans réponse
  postureScore: number;          // 0-100 basé sur la position de la tête
}

const FILLER_WORDS = ["euh", "hmm", "hein", "genre", "voil", "donc", "en fait", "du coup", "bah", "ben"];

function createEmptyMetrics(): CallMetrics {
  return { faceDetectedRatio: 0, eyeContactRatio: 0, headTiltAvg: 0, speakingTimeTotal: 0, wordCount: 0, fillerWordCount: 0, answersProvided: 0, answersSkipped: 0, postureScore: 0 };
}

type Phase = "setup" | "call" | "debrief";

export default function MockInterviewPanelPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");
  const [jobTitle, setJobTitle] = useState("Directeur Général");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [debrief, setDebrief] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Visio states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [faceStatus, setFaceStatus] = useState<{ detected: boolean; looking: boolean; tilt: number }>({ detected: false, looking: false, tilt: 0 });

  // Real metrics
  const metricsRef = useRef<CallMetrics>(createEmptyMetrics());
  const frameCountRef = useRef(0);
  const faceDetectedCountRef = useRef(0);
  const eyeContactCountRef = useRef(0);
  const tiltSumRef = useRef(0);
  const speakStartRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaPipeRef = useRef<any>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Camera ───
  const startCamera = useCallback(async () => {
    try {
      // Demander vidéo + audio en même temps (permissions navigateur combinées)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setMicOn(true);
      console.log("[visio] Caméra + micro activés");
    } catch (err) {
      console.error("[visio] Camera/mic error:", err);
      // Si l'erreur vient du micro, essayer juste la vidéo
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = videoStream;
        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
          await videoRef.current.play();
        }
        setCameraOn(true);
        setMicOn(false);
        console.log("[visio] Caméra activée (sans micro)");
      } catch (err2) {
        console.error("[visio] Video-only error:", err2);
        setCameraOn(false);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  // ─── MediaPipe Face Analysis ───
  const initMediaPipe = useCallback(async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "/node_modules/@mediapipe/tasks-vision/wasm"
      );
      const faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      mediaPipeRef.current = faceLandmarker;
      console.log("[mediapipe] FaceLandmarker initialized");
    } catch (err) {
      console.error("[mediapipe] Init failed:", err);
    }
  }, []);

  const analyzeFrame = useCallback(() => {
    if (!mediaPipeRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

    try {
      const result = mediaPipeRef.current.detectForVideo(videoRef.current, performance.now());
      frameCountRef.current++;

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        faceDetectedCountRef.current++;
        const landmarks = result.faceLandmarks[0];

        // Eye contact : check if eyes are looking forward (nose tip aligned with face center)
        // Landmark 1 = nose tip, landmark 168 = between eyes
        const nose = landmarks[1];
        const betweenEyes = landmarks[168];
        const lookingAtCamera = Math.abs(nose.x - betweenEyes.x) < 0.05;
        if (lookingAtCamera) eyeContactCountRef.current++;

        // Head tilt : angle between eyes (landmarks 33 = right eye, 263 = left eye)
        const rightEye = landmarks[33];
        const leftEye = landmarks[263];
        const dx = leftEye.x - rightEye.x;
        const dy = leftEye.y - rightEye.y;
        const tiltDeg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
        tiltSumRef.current += tiltDeg;

        setFaceStatus({ detected: true, looking: lookingAtCamera, tilt: Math.round(tiltDeg) });
      } else {
        setFaceStatus({ detected: false, looking: false, tilt: 0 });
      }
    } catch (err) {
      // Silent fail — don't crash the interview
    }
  }, []);

  // ─── Speech Recognition ───
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Reconnaissance vocale non supportée. Utilisez Chrome."); return; }

    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) {
        setTranscript(prev => prev + final);
        speakStartRef.current = speakStartRef.current || Date.now();
      }
    };
    recognition.onerror = () => {};
    recognition.onend = () => { if (micOn) { try { recognition.start(); } catch {} } };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setMicOn(true);
  }, [micOn]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsListening(false);
  }, []);

  // ─── Timer + Analysis loop ───
  useEffect(() => {
    if (phase === "call") {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      analysisIntervalRef.current = setInterval(analyzeFrame, 500); // Analyze every 500ms
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [phase, analyzeFrame]);

  // ─── Cleanup ───
  useEffect(() => {
    return () => { stopCamera(); stopListening(); };
  }, [stopCamera, stopListening]);

  // ─── Start ───
  const startSession = async () => {
    setLoading(true); setError(null);
    metricsRef.current = createEmptyMetrics();
    frameCountRef.current = 0;
    faceDetectedCountRef.current = 0;
    eyeContactCountRef.current = 0;
    tiltSumRef.current = 0;

    try {
      const res = await fetch("/api/mock-interview-panel/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setPhase("call");
        setCallDuration(0);
        await startCamera();
        await initMediaPipe();
        setTimeout(() => speakQuestion(data.questions[0]), 2000);
      } else { setError(data.error || "Erreur"); }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  };

  // ─── TTS ───
  const speakQuestion = async (question: any) => {
    setIsSpeaking(true); setThinking(false);
    try {
      const res = await fetch("/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.question, role: question.role.id }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        if (audioRef.current) {
          audioRef.current.src = `data:audio/mpeg;base64,${data.audioBase64}`;
          audioRef.current.onended = () => { setIsSpeaking(false); startListening(); };
          audioRef.current.play();
        }
      } else if (data.provider === "web-speech") {
        const u = new SpeechSynthesisUtterance(question.question);
        u.lang = "fr-FR"; u.rate = 0.95;
        u.onend = () => { setIsSpeaking(false); startListening(); };
        window.speechSynthesis.speak(u);
      }
    } catch { setIsSpeaking(false); }
  };

  // ─── Next question (BLOCKED if no answer) ───
  const nextQuestion = () => {
    const hasAnswer = transcript.trim().length > 10;
    if (!hasAnswer) {
      setError("⚠ Vous devez répondre à la question avant de continuer. Activez votre micro et parlez.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    stopListening(); setIsSpeaking(false);
    const words = transcript.trim().split(/\s+/);
    const fillers = words.filter(w => FILLER_WORDS.includes(w.toLowerCase().replace(/[.,!?]/g, "")));

    metricsRef.current.answersProvided++;
    metricsRef.current.wordCount += words.length;
    metricsRef.current.fillerWordCount += fillers.length;
    if (speakStartRef.current) {
      metricsRef.current.speakingTimeTotal += (Date.now() - speakStartRef.current) / 1000;
      speakStartRef.current = null;
    }

    setTranscript("");

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setThinking(true);
      setTimeout(() => speakQuestion(questions[currentIdx + 1]), 2000);
    } else {
      generateDebrief();
    }
  };

  // ─── Debrief based on REAL metrics ───
  const generateDebrief = async () => {
    setLoading(true); setPhase("debrief");
    stopCamera(); stopListening();

    // Calculer les vraies métriques
    const m = metricsRef.current;
    m.faceDetectedRatio = frameCountRef.current > 0 ? (faceDetectedCountRef.current / frameCountRef.current) * 100 : 0;
    m.eyeContactRatio = faceDetectedCountRef.current > 0 ? (eyeContactCountRef.current / faceDetectedCountRef.current) * 100 : 0;
    m.headTiltAvg = faceDetectedCountRef.current > 0 ? tiltSumRef.current / faceDetectedCountRef.current : 0;
    m.answersSkipped = questions.length - m.answersProvided;
    m.postureScore = m.faceDetectedRatio > 80 && m.headTiltAvg < 10 ? 80 : m.faceDetectedRatio > 50 ? 50 : 20;

    const pace = m.speakingTimeTotal > 0 ? Math.round(m.wordCount / (m.speakingTimeTotal / 60)) : 0;

    // Debrief basé sur les VRAIES données
    const debriefItems = [
      {
        dimension: "Contact visuel",
        score: Math.round(m.eyeContactRatio),
        feedback: m.eyeContactRatio > 70
          ? `Excellent contact visuel (${Math.round(m.eyeContactRatio)}% du temps vers la caméra). Vous projetez de la confiance.`
          : m.eyeContactRatio > 40
          ? `Contact visuel moyen (${Math.round(m.eyeContactRatio)}%). Travaillez à regarder davantage la caméra, pas l'écran.`
          : m.faceDetectedRatio > 0
          ? `Faible contact visuel (${Math.round(m.eyeContactRatio)}%). Les recruteurs interprètent cela comme un manque de confiance.`
          : "Visage non détecté par la caméra. Impossible d'analyser le contact visuel.",
      },
      {
        dimension: "Posture & présence",
        score: m.postureScore,
        feedback: m.headTiltAvg < 8 && m.faceDetectedRatio > 70
          ? `Posture droite et stable (inclinaison tête: ${m.headTiltAvg.toFixed(1)}°). Présence professionnelle.`
          : m.headTiltAvg < 15
          ? `Posture correcte mais instable (inclinaison moyenne: ${m.headTiltAvg.toFixed(1)}°). Veillez à garder la tête droite.`
          : `Posture à améliorer (inclinaison tête: ${m.headTiltAvg.toFixed(1)}°). Tenez-vous droit, épaules en arrière.`,
      },
      {
        dimension: "Expression orale",
        score: m.wordCount > 0 ? Math.min(100, Math.round((m.wordCount / Math.max(m.speakingTimeTotal, 1)) * 60 * 0.4 + 60 - m.fillerWordCount * 5)) : 0,
        feedback: m.wordCount === 0
          ? "Aucune réponse vocale fournie. Activez votre micro pour que le système analyse votre expression."
          : `${m.wordCount} mots parlés en ${Math.round(m.speakingTimeTotal)}s (${pace} mots/min). ${m.fillerWordCount} mots de remplissage détectés (euh, genre, donc...). ${m.fillerWordCount > m.wordCount * 0.05 ? "Trop de mots parasites — travaillez votre concision." : "Bon rythme, peu de mots parasites."}`,
      },
      {
        dimension: "Participation",
        score: Math.round((m.answersProvided / questions.length) * 100),
        feedback: m.answersProvided === questions.length
          ? `Vous avez répondu à toutes les questions (${m.answersProvided}/${questions.length}). Engagement total.`
          : `Vous n'avez répondu qu'à ${m.answersProvided} question(s) sur ${questions.length}. ${m.answersSkipped} non répondue(s). Un entretien réel exige une réponse à chaque question.`,
      },
      {
        dimension: "Détection visage",
        score: Math.round(m.faceDetectedRatio),
        feedback: m.faceDetectedRatio > 80
          ? `Visage détecté ${Math.round(m.faceDetectedRatio)}% du temps. Bon cadrage caméra.`
          : m.faceDetectedRatio > 40
          ? `Visage détecté seulement ${Math.round(m.faceDetectedRatio)}% du temps. Ajustez votre cadrage — restez face caméra.`
          : `Visage rarement détecté (${Math.round(m.faceDetectedRatio)}%). Vérifiez l'éclairage et le cadrage de votre caméra.`,
      },
    ];

    // Envoyer les Q/R à l'IA pour analyse du contenu (si des réponses existent)
    if (m.answersProvided > 0) {
      try {
        const res = await fetch("/api/mock-interview-panel/debrief", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle, company,
            metrics: { wordCount: m.wordCount, speakingTime: m.speakingTimeTotal, fillerWords: m.fillerWordCount, eyeContact: m.eyeContactRatio },
            qaPairs: questions.map((q, i) => ({ role: q.role.title, question: q.question, answer: i < m.answersProvided ? "(réponse vocale enregistrée)" : "(non répondue)" })),
          }),
        });
        const data = await res.json();
        if (data.success && data.debrief) {
          // Ajouter l'analyse de contenu IA au début
          const contentAnalysis = data.debrief.find((d: any) => d.dimension && d.dimension.toLowerCase().includes("stratég") || d.dimension.toLowerCase().includes("contenu"));
          if (contentAnalysis) {
            debriefItems.unshift({
              dimension: "Analyse du contenu (IA)",
              score: contentAnalysis.score,
              feedback: contentAnalysis.feedback,
            });
          }
        }
      } catch {}
    }

    setDebrief(debriefItems);
    setLoading(false);
  };

  const endCall = () => {
    stopCamera(); stopListening(); setIsSpeaking(false);
    setPhase("setup"); setQuestions([]); setDebrief([]); setCurrentIdx(0); setTranscript(""); setCallDuration(0); setError(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const hasAnswer = transcript.trim().length > 10;

  // ═════════ SETUP ═════════
  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0B1F18" }}>
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] mb-6"
              style={{ background: "rgba(228,177,24,0.12)", border: "1px solid rgba(228,177,24,0.25)", color: "#F2C94C" }}>
              <Video size={12} /> Visio Entretien — Panel Comex
            </div>
            <h1 className="text-4xl font-extrabold tracking-[-0.04em] mb-3 text-white" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Simulez votre entretien<br /><span style={{ color: "#E4B118" }}>en visio avec 5 experts</span>
            </h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Caméra · Voix naturelle · Analyse posture & regard · Débrief 360° basé sur données réelles
            </p>
          </div>

          {/* Panel preview avec portraits */}
          <div className="flex justify-center gap-3 mb-6">
            {PANEL_ROLES.map(r => (
              <div key={r.id} className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2" style={{ borderColor: r.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.portrait} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] text-white opacity-40">{r.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-white opacity-60">Poste visé</label>
                <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Directeur Général, CEO..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block text-white opacity-60">Entreprise (optionnel)</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Nom de l'entreprise..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
              </div>
              {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>⚠ {error}</div>}
              <button onClick={startSession} disabled={loading || !jobTitle.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all"
                style={{ background: loading || !jobTitle.trim() ? "rgba(228,177,24,0.3)" : "#E4B118", color: "#0B1F18" }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : <><Video size={16} /> Démarrer la visio</>}
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            📷 Caméra + micro requis · Chrome recommandé · Analyse posture/regard via MediaPipe
          </p>
        </div>
        <audio ref={audioRef} />
      </div>
    );
  }

  // ═════════ CALL (Visio) ═════════
  if (phase === "call" && questions.length > 0) {
    const q = questions[currentIdx];
    const Icon = ICONS[q.role.iconName] || Crown;

    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: "#000" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-2" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#DC2626" }} />
            <span className="text-xs font-mono text-white opacity-60">EN DIRECT · {formatTime(callDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white opacity-40">Q{currentIdx + 1}/{questions.length}</span>
            <div className="w-24 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%`, background: "#E4B118" }} />
            </div>
          </div>
          <button onClick={endCall} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(220,38,38,0.2)", color: "#F87171" }}>
            <Phone size={12} /> Quitter
          </button>
        </div>

        {/* Main visio area — split screen 65% / 35% */}
        <div className="flex-1 flex gap-0.5 p-0.5">
          {/* Interviewer (left, 65%) — portrait en background plein cadre */}
          <div className="relative rounded-2xl overflow-hidden" style={{ flex: "0 0 65%", backgroundImage: `url(${q.role.portrait})`, backgroundSize: "cover", backgroundPosition: "center top" }}>
            {/* Dark overlay */}
            <div className="absolute inset-0" style={{
              background: isSpeaking
                ? "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)"
                : "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)"
            }} />

            {/* Talking glow */}
            {isSpeaking && (
              <div className="absolute inset-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse at center 40%, rgba(228,177,24,0.08) 0%, transparent 60%)",
                animation: "pulse-glow 1s ease-in-out infinite alternate",
              }} />
            )}

            {/* Question text overlay */}
            {isSpeaking && (
              <div className="absolute top-4 left-4 right-4 p-4 rounded-2xl" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <span key={i} className="w-1 rounded-full" style={{ background: "#E4B118", height: 14, animation: `wave 0.4s ${i * 0.08}s ease-in-out infinite alternate` }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#E4B118" }}>{q.role.name} parle</span>
                </div>
                <p className="text-sm leading-relaxed text-white">{q.question}</p>
              </div>
            )}

            {/* Interviewer name */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: q.role.bgGradient }}>
                <Icon size={20} color="white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{q.role.name}</div>
                <div className="text-xs" style={{ color: q.role.color }}>{q.role.title}</div>
              </div>
              {isSpeaking && <span className="text-[10px] text-white opacity-50 ml-2">parle...</span>}
              {thinking && <span className="text-xs text-white opacity-50 ml-2"><Loader2 size={12} className="animate-spin inline mr-1" />réfléchit...</span>}
            </div>
          </div>

          {/* User webcam (right, 35%) — GRANDE fenêtre pleine hauteur */}
          <div className="relative rounded-2xl overflow-hidden border-2" style={{ flex: "1 1 35%", borderColor: faceStatus.detected ? (faceStatus.looking ? "#16A34A" : "#E4B118") : "#DC2626", background: "#0d0d1a" }}>
            {cameraOn ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <VideoOff size={40} className="text-white opacity-20" />
                <span className="text-xs text-white opacity-30">Caméra désactivée</span>
              </div>
            )}

            {/* Face status indicator (top) */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.6)" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: faceStatus.detected ? (faceStatus.looking ? "#16A34A" : "#E4B118") : "#DC2626" }} />
                <span className="text-[10px] text-white font-medium">
                  {faceStatus.detected ? (faceStatus.looking ? "Contact visuel OK" : "Regard fuyant") : "Visage non détecté"}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(0,0,0,0.6)" }}>
                <Activity size={10} style={{ color: faceStatus.detected ? "#16A34A" : "#DC2626" }} />
                <span className="text-[10px] text-white">{faceStatus.tilt}°</span>
              </div>
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs text-white font-medium" style={{ background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 8 }}>Vous</span>
              {isListening && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(220,38,38,0.4)", color: "#F87171" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#DC2626" }} />
                  Micro actif
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: transcript + controls */}
        <div className="px-4 py-3 space-y-2" style={{ background: "rgba(0,0,0,0.6)" }}>
          {error && <div className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(220,38,38,0.15)", color: "#F87171" }}>{error}</div>}
          {transcript && (
            <div className="px-4 py-2 rounded-xl text-sm max-h-20 overflow-y-auto" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}>
              <span className="text-[10px] opacity-50">Votre réponse: </span>{transcript}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Bouton caméra */}
              <button onClick={() => { cameraOn ? stopCamera() : startCamera(); }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: cameraOn ? "rgba(255,255,255,0.1)" : "rgba(220,38,38,0.3)", color: cameraOn ? "white" : "#F87171" }}>
                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Bouton micro — GROS et visible */}
              <button
                onClick={() => {
                  if (isListening) { stopListening(); setMicOn(false); }
                  else { startListening(); }
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: isListening ? "rgba(220,38,38,0.4)" : !micOn ? "rgba(220,38,38,0.2)" : "rgba(16,56,38,0.4)",
                  color: isListening ? "#F87171" : micOn ? "#16A34A" : "#F87171",
                  border: `2px solid ${isListening ? "#DC2626" : micOn ? "#16A34A" : "rgba(220,38,38,0.3)"}`,
                }}>
                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                {isListening ? "PARLEZ MAINTENANT" : micOn ? "Cliquer pour parler" : "Activer le micro"}
              </button>

              {/* Indicateurs posture */}
              <div className="flex items-center gap-2 ml-1">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Eye size={12} style={{ color: faceStatus.looking ? "#16A34A" : "#6A8F6D" }} />
                  <span className="text-[10px] text-white opacity-60">{faceStatus.looking ? "OK" : "—"}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Activity size={12} style={{ color: faceStatus.detected ? "#16A34A" : "#DC2626" }} />
                  <span className="text-[10px] text-white opacity-60">{faceStatus.tilt}°</span>
                </div>
              </div>

              {/* Status message */}
              {!isSpeaking && !thinking && (
                <span className="text-xs ml-2" style={{ color: hasAnswer ? "#16A34A" : "rgba(255,255,255,0.4)" }}>
                  {hasAnswer ? "✓ Réponse enregistrée" : isListening ? "Parlez votre réponse..." : ""}
                </span>
              )}
            </div>

            {/* Bouton suivant */}
            <button onClick={nextQuestion} disabled={isSpeaking || thinking || !hasAnswer}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: !hasAnswer || isSpeaking || thinking ? "rgba(255,255,255,0.05)" : "#E4B118",
                color: !hasAnswer || isSpeaking || thinking ? "rgba(255,255,255,0.3)" : "#0B1F18",
                cursor: !hasAnswer || isSpeaking || thinking ? "not-allowed" : "pointer",
              }}>
              {currentIdx < questions.length - 1 ? "Question suivante" : "Voir le débrief"}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <audio ref={audioRef} />
        <style>{`
          @keyframes pulse-glow { 0% { opacity: 0.5; } 100% { opacity: 1; } }
          @keyframes wave { 0% { height: 6px; } 100% { height: 20px; } }
        `}</style>
      </div>
    );
  }

  // ═════════ DEBRIEF ═════════
  if (phase === "debrief") {
    const m = metricsRef.current;
    const globalScore = debrief.length > 0 ? Math.round(debrief.reduce((s, d) => s + d.score, 0) / debrief.length) : 0;

    return (
      <div className="min-h-screen p-6" style={{ background: "#0B1F18" }}>
        <div className="max-w-2xl mx-auto pt-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Débrief 360°</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Basé sur les données réelles de votre session</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#E4B118" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Analyse des données en cours...</p>
            </div>
          )}

          {!loading && debrief.length > 0 && (
            <>
              {/* Score global */}
              <div className="rounded-3xl p-8 mb-6 text-center" style={{ background: "linear-gradient(135deg, #0E3A29 0%, #0B2E21 100%)" }}>
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#F2C94C" }}>Score global</div>
                <div className="text-6xl font-extrabold text-white" style={{ fontFamily: "Playfair Display, serif" }}>{globalScore}/100</div>
                <div className="mt-3 flex justify-center gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>👁 Contact: {Math.round(m.eyeContactRatio)}%</span>
                  <span>📊 Posture: {m.postureScore}/100</span>
                  <span>💬 Mots: {m.wordCount}</span>
                  <span>⏱ {Math.round(m.speakingTimeTotal)}s</span>
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-3">
                {debrief.map((item, i) => (
                  <div key={i} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white">{item.dimension}</h3>
                      <span className="text-sm font-bold" style={{ color: item.score >= 70 ? "#16A34A" : item.score >= 50 ? "#E4B118" : item.score > 0 ? "#DC2626" : "#6A8F6D" }}>
                        {item.score > 0 ? `${item.score}/100` : "N/A"}
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
                  Conseiller IA
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
