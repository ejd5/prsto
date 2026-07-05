"use client";

import { useCallback, useRef, useState } from "react";
import { useMediaPipeline } from "./useMediaPipeline";
import { useMediaPipe } from "./useMediaPipe";
import { useAudioAnalytics } from "./useAudioAnalytics";
import { useNativeSTT } from "./useNativeSTT";
import { useInterviewLoop } from "./useInterviewLoop";
import type { PrepOutput } from "@/lib/ai/prompts-mock-interview";

type Phase =
  | "idle"
  | "ready"
  | "setup"
  | "running"
  | "finished"
  | "error";

interface SessionConfig {
  company: string;
  jobTitle: string;
  jobDescription: string;
  strengths: string[];
  language: string;
  selectedPortraitIds: string[];
}

export function useInterviewOrchestrator() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [prepData, setPrepData] = useState<PrepOutput | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transcriptRef = useRef<string>("");
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const mediaPipeline = useMediaPipeline();
  const mediaPipe = useMediaPipe();
  const audioAnalytics = useAudioAnalytics();
  const nativeSTT = useNativeSTT();

  const interviewLoop = useInterviewLoop({
    onQuestionReady: useCallback((question: string, speakerId: string) => {
      // Question prête — le composant UI l'affiche
    }, []),

    onSpeakQuestion: useCallback(async (text: string) => {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.82;
        utterance.pitch = 1.0;
        utterance.volume = 1;

        const doSpeak = () => {
          const all = speechSynthesis.getVoices();
          const french = all.filter((v) => v.lang.startsWith("fr"));
          const good = french.find((v) => v.name.includes("Google") || v.name.includes("Premium"))
            || french.find((v) => v.name === "Amélie" || v.name === "Thomas")
            || french[0];
          if (good) utterance.voice = good;
          speechSynthesis.speak(utterance);
        };

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        if (speechSynthesis.getVoices().length === 0) {
          speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
        } else {
          doSpeak();
        }
      });
    }, []),

    onStartListening: useCallback((lang: string) => {
      transcriptRef.current = "";
      nativeSTT.startContinuous(lang);
    }, [nativeSTT]),

    onStopListening: useCallback(async () => {
      nativeSTT.stopAll();
      transcriptRef.current = nativeSTT.captureTranscript();
      return new Blob();
    }, [nativeSTT]),

    onTranscribe: useCallback(
      async (_audio: Blob) => {
        return transcriptRef.current || null;
      },
      [],
    ),

    onAnalyzeMetrics: useCallback(
      async (audio: Blob, transcript: string) => {
        const metrics = await audioAnalytics.analyzeAudio(audio, transcript);
        return metrics;
      },
      [audioAnalytics],
    ),

    getPoseMetrics: useCallback(() => {
      return mediaPipe.metrics;
    }, [mediaPipe.metrics]),
  });

  const initialize = useCallback(async () => {
    setError(null);
    setPhase("ready");
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      voicesRef.current = speechSynthesis.getVoices();
      if (voicesRef.current.length === 0) {
        speechSynthesis.addEventListener("voiceschanged", () => {
          voicesRef.current = speechSynthesis.getVoices();
        }, { once: true });
      }
    }
  }, []);

  const startSetup = useCallback((config: SessionConfig) => {
    setSessionConfig(config);
    setPhase("setup");
  }, []);

  const startSession = useCallback(
    async (prep: PrepOutput) => {
      if (!sessionConfig) return;

      setPrepData(prep);
      setPhase("running");

      const stream = await mediaPipeline.startStream();
      if (!stream) {
        setError("Impossible d'accéder à la caméra/micro");
        setPhase("error");
        return;
      }

      if (videoRef.current) {
        mediaPipeline.attachToVideo(videoRef.current);
        await mediaPipe.startTracking(videoRef.current);
      }

      await interviewLoop.startInterview({
        questions: prep.questions.map((q) => ({
          text: q.text,
          speakerId: q.assignedTo,
          type: q.type,
        })),
        panelIds: prep.personas.map((p) => p.id),
        language: sessionConfig.language,
      });

      setPhase("finished");
      mediaPipeline.stopStream();
      mediaPipe.stopTracking();
    },
    [sessionConfig, mediaPipeline, mediaPipe, interviewLoop],
  );

  const setVideoElement = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
    },
    [],
  );

  return {
    phase,
    error,
    prepData,
    sessionConfig,
    mediaPipeline,
    mediaPipe,
    nativeSTT,
    interviewLoop,
    initialize,
    startSetup,
    startSession,
    setVideoElement,
  };
}
