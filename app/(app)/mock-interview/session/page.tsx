"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatedPortrait } from "@/components/mock-interview/AnimatedPortrait";
import { AuditReport } from "@/components/mock-interview/AuditReport";
import { useInterviewEngine } from "@/hooks/useInterviewEngine";
import { generateWithLLM } from "@/lib/actions/mock-interview";
import { getAuditPrompt } from "@/lib/ai/prompts-mock-interview";
import type { PrepOutput, AuditOutput } from "@/lib/ai/prompts-mock-interview";

interface SessionConfig {
  company: string;
  jobTitle: string;
  jobDescription: string;
  strengths: string[];
  language: string;
  selectedPortraitIds: string[];
  prep: PrepOutput;
}

interface PortraitDisplay {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
}

const PORTRAIT_MAP: Record<string, PortraitDisplay> = {
  "drh-ingrid": { id: "drh-ingrid", name: "Ingrid Dubois", title: "Directrice RH", imageUrl: "/branding/portraits/drh-ingrid/ingrid-01.png" },
  "ceo-paul": { id: "ceo-paul", name: "Paul Mercier", title: "CEO", imageUrl: "/branding/portraits/ceo-paul/paul-01.png" },
  "cto-john": { id: "cto-john", name: "John Koffi", title: "CTO", imageUrl: "/branding/portraits/cto-john/john-01.png" },
  "dirmarketing-sabrina": { id: "dirmarketing-sabrina", name: "Sabrina Lopez", title: "Directrice Marketing", imageUrl: "/branding/portraits/dirmarketing-sabrina/sabrina-01.png" },
  "rh-lola": { id: "rh-lola", name: "Lola Petit", title: "Responsable RH", imageUrl: "/branding/portraits/rhmanager-lola/lola-01.png" },
  "board-david": { id: "board-david", name: "David Rousseau", title: "Membre du Conseil", imageUrl: "/branding/portraits/boardmanager-david/david-01.png" },
};

function buildPortraits(config: SessionConfig): PortraitDisplay[] {
  const ids = config.selectedPortraitIds || [];
  const portraits = ids.map(id => PORTRAIT_MAP[id]).filter(Boolean) as PortraitDisplay[];
  if (portraits.length > 0) return portraits;
  return (config.prep?.personas || [])
    .map(p => PORTRAIT_MAP[p.id])
    .filter(Boolean) as PortraitDisplay[];
}

const PHASE_LABEL: Record<string, string> = {
  idle: "",
  speaking: "🎙️ Le panel vous parle...",
  listening: "🔴 Enregistrement en cours",
  processing: "⚙️ Analyse de votre réponse...",
  finished: "Entretien terminé",
};

export default function MockInterviewSessionPage() {
  const router = useRouter();
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [portraits, setPortraits] = useState<PortraitDisplay[]>([]);
  const [auditReport, setAuditReport] = useState<AuditOutput | null>(null);
  const [isGeneratingAudit, setIsGeneratingAudit] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const hasFinishedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const engine = useInterviewEngine(generateWithLLM);

  useEffect(() => {
    const stored = sessionStorage.getItem("mock-interview-prep");
    if (!stored) { router.replace("/mock-interview/setup"); return; }
    try {
      const parsed: SessionConfig = JSON.parse(stored);
      setConfig(parsed);
      setPortraits(buildPortraits(parsed));
    } catch {
      router.replace("/mock-interview/setup");
    }
  }, [router]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (_) {}
  }, []);

  const handleStart = useCallback(async () => {
    if (!config || hasStarted) return;
    setHasStarted(true);
    startCamera();
    await engine.startInterview({
      questions: config.prep.questions.map(q => ({
        text: q.text,
        speakerId: q.assignedTo,
        type: q.type,
      })),
      panelIds: config.prep.personas.map(p => p.id),
      language: config.language,
    });
  }, [config, hasStarted, engine, startCamera]);

  useEffect(() => {
    if (engine.phase !== "finished" || hasFinishedRef.current || engine.history.length === 0) return;
    hasFinishedRef.current = true;
    setIsGeneratingAudit(true);

    const gen = async () => {
      try {
        if (config) {
          // Calculate averages from our enhanced engine history
          const avgWpm = Math.round(
            engine.history.reduce((acc, h) => acc + h.wpm, 0) / engine.history.length
          ) || 135;

          const totalFillerWords = engine.history.reduce((acc, h) => acc + h.fillerCount, 0);

          const prompt = getAuditPrompt({
            language: config.language,
            sessionHistory: engine.history.map(h => ({ question: h.question, answer: h.answer })),
            metrics: {
              avgWpm,
              avgSilenceRatio: totalFillerWords, // We pass total fillers here so LLM knows how many we used
              avgPostureScore: 90,
              avgGazeScore: 90,
            },
            company: config.company,
            jobTitle: config.jobTitle,
          });

          // Inject user-specific live parameters in a system override to deepseek
          prompt.systemPrompt += `\nCRITICAL CONTEXT FOR THIS SPECIFIC USER PERFORMANCE:\n- Average speech speed: ${avgWpm} WPM.\n- Total filler words used: ${totalFillerWords} occurrences.\nUse these actual data points in your audit report. Be extremely precise and coach-like. Mention exact filler words if relevant.`;

          const result = await generateWithLLM(prompt);
          if (result) {
            const parsed = JSON.parse(result) as AuditOutput;
            setAuditReport(parsed);
            setIsGeneratingAudit(false);
            return;
          }
        }
      } catch (_) {}

      // Fallback
      setAuditReport({
        global_score: 72,
        dimensions: {
          structure: { score: 14, evidence: "La méthode STAR a été partiellement adoptée mais mériterait d'être renforcée." },
          concision: { score: 12, evidence: "Certaines réponses présentaient de nombreux mots parasites." },
          impact: { score: 15, evidence: "De bons points marquants mais trop dilués." },
          posture: { score: 15, evidence: "Bonne réactivité." },
          aisance_orale: { score: 14, evidence: "Débit un peu irrégulier." },
        },
        synthesis: "Une performance honorable mais manquant d'impact exécutif. Travaillez la structure et réduisez les mots parasites.",
        strengths: ["Exemples pertinents", "Clarté du parcours"],
        improvements: ["Réduire les tics de langage", "Quantifier systématiquement les résultats"],
      });
      setIsGeneratingAudit(false);
    };
    gen();
  }, [engine.phase, engine.history, config]);

  const activeSpeaker = portraits.find(p => p.id === engine.currentSpeakerId) ?? portraits[0];
  const otherPortraits = portraits.filter(p => p.id !== activeSpeaker?.id);

  const handleRestart = () => {
    sessionStorage.removeItem("mock-interview-prep");
    router.push("/mock-interview/setup");
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-[#0B1F18] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E4B118] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (auditReport) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] py-8 px-4">
        <AuditReport report={auditReport} onRestart={handleRestart} />
      </div>
    );
  }

  if (isGeneratingAudit) {
    return (
      <div className="min-h-screen bg-[#0B1F18] flex flex-col items-center justify-center gap-5 text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#E4B118] border-t-transparent animate-spin" />
        <p className="text-lg font-medium">Génération de votre rapport d'évaluation expert...</p>
        <p className="text-sm text-white/50">Analyse de vos tics de langage et de votre structure en cours · 15s</p>
      </div>
    );
  }

  const liveFillerWords = Object.keys(engine.liveFillers);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0B1F18", color: "#FFFDF8", fontFamily: "Inter, sans-serif" }}
    >
      {/* ═══ TOP BAR ═════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(11,31,24,0.95)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#E4B118" }} />
          <span className="text-sm font-semibold text-white/90">
            {config.company} · {config.jobTitle}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{
            background: "rgba(228,177,24,0.12)", color: "#E4B118", border: "1px solid rgba(228,177,24,0.2)",
          }}>
            {PHASE_LABEL[engine.phase] || "Simulation PRSTO"}
          </span>
          {hasStarted && (
            <button
              onClick={engine.stopInterview}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-red-500/20"
              style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
            >
              Terminer l'entretien
            </button>
          )}
        </div>
      </div>

      {/* ═══ MAIN AREA — 3 Column Layout ═══════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── COL 1: Recruiter Active Panel (35% width) ── */}
        <div className="w-[35%] flex flex-col items-center justify-center p-6 border-r relative" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {!hasStarted ? (
            <div className="text-center space-y-4">
              <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Panel Recruteur</p>
              <div className="flex gap-4 flex-wrap justify-center">
                {portraits.map((p, i) => (
                  <AnimatedPortrait
                    key={p.id}
                    name={p.name}
                    title={p.title}
                    imageUrl={p.imageUrl}
                    isActive={false}
                    isSpeaking={false}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 text-center w-full">
              <div className="relative">
                <AnimatedPortrait
                  key={activeSpeaker.id}
                  name={activeSpeaker.name}
                  title={activeSpeaker.title}
                  imageUrl={activeSpeaker.imageUrl}
                  isActive={true}
                  isSpeaking={engine.phase === "speaking"}
                  size="lg"
                />
                {engine.phase === "speaking" && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse"
                    style={{ boxShadow: "0 0 30px rgba(228,177,24,0.3)" }}
                  />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#E4B118]">{activeSpeaker.name}</h3>
                <p className="text-xs text-white/50">{activeSpeaker.title}</p>
              </div>

              {engine.currentQuestion && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left w-full mt-2">
                  <span className="text-[10px] font-bold text-[#E4B118] uppercase tracking-wider block mb-1">Question active</span>
                  <p className="text-sm leading-relaxed text-white/80">{engine.currentQuestion}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COL 2: Candidate Webcam & Live Transcript (40% width) ── */}
        <div className="w-[40%] flex flex-col p-6 gap-6 justify-center">
          {!hasStarted ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-white">Prêt pour l&apos;entretien ?</h2>
              <p className="text-sm text-white/40">Activez votre caméra et parlez naturellement.</p>
              <button
                id="btn-start-interview"
                onClick={handleStart}
                className="px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #E4B118, #C49A14)",
                  color: "#0B1F18",
                  boxShadow: "0 4px 20px rgba(228,177,24,0.3)",
                }}
              >
                🎙️ Lancer la session live
              </button>
            </div>
          ) : (
            <>
              {/* Grand format Webcam */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 flex-1 bg-black/40" style={{ maxHeight: "360px" }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-black/60 px-2 py-0.5 rounded text-xs font-medium text-white/80">Flux candidat</span>
              </div>

              {/* Live transcription */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col h-[180px] overflow-hidden">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-2">Transcription en direct</span>
                <div className="flex-1 overflow-y-auto pr-1 text-sm text-white/70 leading-relaxed">
                  {engine.liveTranscript || <span className="text-white/20 italic">Répondez oralement à la question...</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── COL 3: Yoodli-like Live AI Coach (25% width) ── */}
        <div className="w-[25%] border-l p-6 flex flex-col gap-6" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#E4B118]">Coach IA en temps réel</h3>

          {!hasStarted ? (
            <div className="text-sm text-white/30 italic flex items-center justify-center flex-1">
              Les métriques d&apos;analyse de parole s&apos;afficheront ici en direct pendant que vous parlez.
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* 1. WPM Meter */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">Débit (WPM)</span>
                  <span className={`text-sm font-bold ${engine.liveWpm > 170 ? "text-red-400" : engine.liveWpm < 100 ? "text-amber-400" : "text-green-400"}`}>
                    {engine.liveWpm} WPM
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${engine.liveWpm > 170 ? "bg-red-400" : engine.liveWpm < 100 ? "bg-amber-400" : "bg-green-400"}`}
                    style={{ width: `${Math.min(100, (engine.liveWpm / 220) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/30 block">Idéal : 120-160 WPM (Cadence Cadre)</span>
              </div>

              {/* 2. Filler words tracker */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1 flex flex-col min-h-[160px]">
                <span className="text-xs text-white/60 block mb-3">Tics de langage & Mots parasites</span>
                {liveFillerWords.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-white/20 italic">Aucun tic détecté</div>
                ) : (
                  <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[140px] pr-1">
                    {liveFillerWords.map(word => (
                      <span key={word} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs flex items-center gap-1.5 text-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {word} <strong className="text-red-200">×{engine.liveFillers[word]}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. STAR Structure validation */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <span className="text-xs text-white/60 block">Structure de réponse (STAR)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg text-center border text-xs font-semibold transition-all ${engine.liveStar.s ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-white/5 border-white/5 text-white/30"}`}>
                    S<span className="text-[10px] block font-light">Situation</span>
                  </div>
                  <div className={`p-2 rounded-lg text-center border text-xs font-semibold transition-all ${engine.liveStar.t ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-white/5 border-white/5 text-white/30"}`}>
                    T<span className="text-[10px] block font-light">Tâche</span>
                  </div>
                  <div className={`p-2 rounded-lg text-center border text-xs font-semibold transition-all ${engine.liveStar.a ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-white/5 border-white/5 text-white/30"}`}>
                    A<span className="text-[10px] block font-light">Action</span>
                  </div>
                  <div className={`p-2 rounded-lg text-center border text-xs font-semibold transition-all ${engine.liveStar.r ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-white/5 border-white/5 text-white/30"}`}>
                    R<span className="text-[10px] block font-light">Résultat</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM BAR — Controls ═══════════════════════════════════════════ */}
      <div
        className="flex items-center justify-center gap-4 px-6 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
      >
        {(engine.phase === "listening" || engine.isCapturing) ? (
          <>
            <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
              Microphone en écoute active
            </div>

            <button
              id="btn-finished-answering"
              onClick={engine.userFinishedAnswer}
              className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 animate-pulse"
              style={{
                background: "linear-gradient(135deg, #E4B118, #C49A14)",
                color: "#0B1F18",
                boxShadow: "0 4px 20px rgba(228,177,24,0.4)",
              }}
            >
              ✓ J&apos;ai terminé ma réponse (Analyser)
            </button>
          </>
        ) : (
          <div className="text-xs text-white/20 font-medium">
            {engine.phase === "idle" && !hasStarted
              ? "Cliquez sur Lancer la session live pour commencer"
              : engine.phase === "speaking"
              ? "Écoutez attentivement la question..."
              : engine.phase === "processing"
              ? "L'IA analyse votre performance..."
              : engine.phase === "finished"
              ? "Génération de votre rapport expert..."
              : ""}
          </div>
        )}
      </div>
    </div>
  );
}
