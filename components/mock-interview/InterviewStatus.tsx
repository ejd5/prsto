"use client";

import { useEffect, useState } from "react";

interface InterviewStatusProps {
  phase: string;
  metrics: {
    wpm: number;
    silenceRatio: number;
    postureScore: number;
    gazeScore: number;
  };
}

export function InterviewStatus({ phase, metrics }: InterviewStatusProps) {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setIsRunning(
      phase === "listening" || phase === "speaking" || phase === "transcribing",
    );
  }, [phase]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const phaseLabel: Record<string, string> = {
    idle: "Prêt",
    generating_question: "Réflexion...",
    speaking: "Question en cours",
    listening: "Votre réponse",
    transcribing: "Transcription...",
    analyzing: "Analyse...",
    finished: "Terminé",
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-[#103826]/70">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#103826]/30 animate-pulse" />
        <span className="font-medium">{phaseLabel[phase] || phase}</span>
      </div>

      <div className="h-4 w-px bg-[#103826]/20" />

      <div className="font-mono tabular-nums">
        ⏱ {formatTime(timer)}
      </div>

      <div className="h-4 w-px bg-[#103826]/20" />

      <div className={getConfidenceColor(metrics.wpm > 0 ? Math.min(metrics.wpm, 200) : 0)}>
        <span className="font-medium">WPM</span>{" "}
        {metrics.wpm > 0 ? metrics.wpm : "—"}
      </div>

      <div className="hidden sm:flex items-center gap-3">
        <div className="h-4 w-px bg-[#103826]/20" />

        <div className={getConfidenceColor(metrics.postureScore)}>
          <span className="font-medium">Posture</span>{" "}
          {metrics.postureScore > 0 ? `${metrics.postureScore}%` : "—"}
        </div>

        <div className={getConfidenceColor(metrics.gazeScore)}>
          <span className="font-medium">Regard</span>{" "}
          {metrics.gazeScore > 0 ? `${metrics.gazeScore}%` : "—"}
        </div>
      </div>
    </div>
  );
}
