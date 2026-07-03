"use client";

import { useState, useCallback, useRef } from "react";
import { getLoopPrompt } from "@/lib/ai/prompts-mock-interview";
import type { LoopOutput, PortraitPersona } from "@/lib/ai/prompts-mock-interview";

interface SessionEntry {
  question: string;
  answer: string;
  speakerId: string;
}

interface InterviewLoopState {
  currentSpeakerId: string | null;
  currentQuestion: string | null;
  isProcessing: boolean;
  phase: "idle" | "generating_question" | "speaking" | "listening" | "transcribing" | "analyzing" | "finished";
  error: string | null;
  metrics: { wpm: number; silenceRatio: number; postureScore: number; gazeScore: number };
}

interface InterviewLoopCallbacks {
  onQuestionReady: (question: string, speakerId: string) => void;
  onSpeakQuestion: (text: string) => Promise<void>;
  onStartListening: (lang: string) => void;
  onStopListening: () => Promise<Blob | null>;
  onTranscribe: (audio: Blob) => Promise<string | null>;
  onAnalyzeMetrics: (audio: Blob, transcript: string) => Promise<{ wpm: number; silenceRatio: number }>;
  getPoseMetrics: () => { postureScore: number; gazeScore: number };
}

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  opening: [
    "Parlez-moi de votre parcours et de ce qui vous amène ici aujourd'hui.",
    "Tell me about your background and what brings you here today.",
    "Hábleme de su trayectoria y de lo que le trae aquí hoy.",
  ],
  behavioral: [
    "Décrivez une situation où vous avez dû gérer un conflit au sein de votre équipe.",
    "Describe a situation where you had to manage a conflict within your team.",
    "Describa una situación en la que tuvo que gestionar un conflicto en su equipo.",
  ],
  stress: [
    "Pourquoi devrions-nous vous choisir plutôt qu'un autre candidat ?",
    "Why should we choose you over another candidate?",
    "¿Por qué deberíamos elegirlo a usted y no a otro candidato?",
  ],
  closing: [
    "Avez-vous des questions pour nous ?",
    "Do you have any questions for us?",
    "¿Tiene alguna pregunta para nosotros?",
  ],
};

const LANG_MAP: Record<string, number> = {
  fr: 0, en: 1, es: 2,
};

export function useInterviewLoop(callbacks: InterviewLoopCallbacks) {
  const [state, setState] = useState<InterviewLoopState>({
    currentSpeakerId: null,
    currentQuestion: null,
    isProcessing: false,
    phase: "idle",
    error: null,
    metrics: { wpm: 0, silenceRatio: 0, postureScore: 0, gazeScore: 0 },
  });

  const historyRef = useRef<SessionEntry[]>([]);
  const remainingRef = useRef<number>(0);
  const questionsRef = useRef<{ text: string; speakerId: string; type: string }[]>([]);
  const panelIdsRef = useRef<string[]>([]);
  const lastSpeakerRef = useRef<string | null>(null);
  const languageRef = useRef<string>("fr");
  const generateWithLLMRef = useRef<
    ((prompt: { systemPrompt: string; userPrompt: string }) => Promise<string | null>) | null
  >(null);
  const stopListeningResolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const setGenerateFn = useCallback(
    (fn: (prompt: { systemPrompt: string; userPrompt: string }) => Promise<string | null>) => {
      generateWithLLMRef.current = fn;
    },
    [],
  );

  const getNextSpeaker = useCallback(
    (preferredId?: string): string => {
      const ids = panelIdsRef.current;
      if (ids.length === 0) return "";
      if (ids.length === 1) return ids[0];

      const available = preferredId
        ? ids.filter((id) => id === preferredId && id !== lastSpeakerRef.current)
        : ids.filter((id) => id !== lastSpeakerRef.current);

      if (available.length === 0) {
        const fallback = ids.filter((id) => id !== lastSpeakerRef.current);
        if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];
        return ids[Math.floor(Math.random() * ids.length)];
      }

      return available[Math.floor(Math.random() * available.length)];
    },
    [],
  );

  const fallbackQuestion = useCallback(
    (type: string): string => {
      const questions = FALLBACK_QUESTIONS[type] || FALLBACK_QUESTIONS.opening;
      const idx = LANG_MAP[languageRef.current] ?? 0;
      const q = questions[idx] || questions[0];

      const used = historyRef.current.map((h) => h.question);
      if (used.includes(q)) return "Pouvez-vous développer ce point ?";
      return q;
    },
    [],
  );

  const generateNextQuestion = useCallback(
    async (type: string = "opening"): Promise<{ text: string; speakerId: string } | null> => {
      const pending = questionsRef.current.find((q) => q.type === type);
      if (pending) {
        const speakerId = getNextSpeaker(pending.speakerId);
        lastSpeakerRef.current = speakerId;
        return { text: pending.text, speakerId };
      }

      const loopFn = generateWithLLMRef.current;
      if (!loopFn) {
        const speakerId = getNextSpeaker();
        lastSpeakerRef.current = speakerId;
        return { text: fallbackQuestion(type), speakerId };
      }

      try {
        const history = historyRef.current;
        const prompt = getLoopPrompt({
          language: languageRef.current,
          userTranscript: "",
          lastQuestion: history[history.length - 1]?.question || "",
          sessionHistory: history.map((h) => ({ question: h.question, answer: h.answer })),
          wpm: 0,
          silenceRatio: 0,
          postureScore: 0,
          gazeScore: 0,
          remainingQuestions: remainingRef.current,
        });

        const result = await loopFn(prompt);
        if (result) {
          try {
            const parsed: LoopOutput = JSON.parse(result);
            if (parsed.action === "conclude") {
              return null;
            }
            const speakerId = getNextSpeaker(parsed.speaker);
            lastSpeakerRef.current = speakerId;
            return { text: parsed.question, speakerId };
          } catch {
            const speakerId = getNextSpeaker();
            lastSpeakerRef.current = speakerId;
            return { text: result, speakerId };
          }
        }
      } catch {
        // LLM error - use fallback
      }

      const speakerId = getNextSpeaker();
      lastSpeakerRef.current = speakerId;
      return { text: fallbackQuestion(type), speakerId };
    },
    [getNextSpeaker, fallbackQuestion],
  );

  const analyzeResponse = useCallback(
    async (
      transcript: string,
      question: string,
      metrics: { wpm: number; silenceRatio: number; postureScore: number; gazeScore: number },
    ): Promise<"next" | "conclude"> => {
      if (remainingRef.current <= 0) return "conclude";

      const loopFn = generateWithLLMRef.current;
      if (!loopFn) return "next";

      try {
        const prompt = getLoopPrompt({
          language: languageRef.current,
          userTranscript: transcript,
          lastQuestion: question,
          sessionHistory: historyRef.current.map((h) => ({
            question: h.question,
            answer: h.answer,
          })),
          wpm: metrics.wpm,
          silenceRatio: metrics.silenceRatio,
          postureScore: metrics.postureScore,
          gazeScore: metrics.gazeScore,
          remainingQuestions: remainingRef.current,
        });

        const result = await loopFn(prompt);
        if (result) {
          try {
            const parsed: LoopOutput = JSON.parse(result);
            if (parsed.action === "conclude") return "conclude";
            if (parsed.action === "follow_up") {
              const speakerId = getNextSpeaker(parsed.speaker);
              lastSpeakerRef.current = speakerId;
              questionsRef.current.unshift({
                text: parsed.question,
                speakerId,
                type: "follow_up",
              });
              return "next";
            }
          } catch {
            // fall through
          }
        }
      } catch {
        // fall through
      }

      remainingRef.current--;
      return "next";
    },
    [getNextSpeaker],
  );

  const runQuestionCycle = useCallback(
    async (type: string = "opening") => {
      setState((s) => ({ ...s, phase: "generating_question", error: null }));

      const q = await generateNextQuestion(type);
      if (!q) {
        setState((s) => ({ ...s, phase: "finished", currentSpeakerId: null, currentQuestion: null }));
        return;
      }

      setState((s) => ({
        ...s,
        currentSpeakerId: q.speakerId,
        currentQuestion: q.text,
        phase: "speaking",
      }));

      callbacks.onQuestionReady(q.text, q.speakerId);

      await callbacks.onSpeakQuestion(q.text);

      let transcript = "";
      let audioBlob: Blob | null = null;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        setState((s) => ({ 
          ...s, 
          phase: "listening", 
          error: retries > 0 ? "Aucune parole détectée. Veuillez parler à nouveau." : null 
        }));
        
        callbacks.onStartListening(languageRef.current);

        const capturedBlob = await new Promise<Blob | null>((resolve) => {
          stopListeningResolveRef.current = resolve;
          // 60 seconds max response duration
          setTimeout(() => {
            if (stopListeningResolveRef.current) {
              stopListeningResolveRef.current = null;
              resolve(null);
            }
          }, 60000);
        });

        if (stopListeningResolveRef.current) {
          stopListeningResolveRef.current = null;
          await Promise.race([
            callbacks.onStopListening(),
            new Promise<null>((r) => setTimeout(() => r(null), 3000))
          ]);
        }

        if (!capturedBlob) {
          setState((s) => ({ ...s, error: "Pas de réponse détectée" }));
          return;
        }

        audioBlob = capturedBlob;
        setState((s) => ({ ...s, phase: "transcribing" }));

        const rawTranscript = await Promise.race([
          callbacks.onTranscribe(capturedBlob),
          new Promise<null>((r) => setTimeout(() => r(null), 5000))
        ]);

        if (rawTranscript && rawTranscript.trim().length > 0) {
          transcript = rawTranscript;
          break;
        }

        retries++;
      }

      if (!transcript || transcript.trim().length === 0) {
        setState((s) => ({ ...s, error: "Impossible de transcrire votre réponse après plusieurs essais. Entretien arrêté." }));
        return;
      }

      const poseMetrics = callbacks.getPoseMetrics();
      const audioMetrics = await callbacks.onAnalyzeMetrics(audioBlob!, transcript);

      const combinedMetrics = {
        wpm: audioMetrics.wpm,
        silenceRatio: audioMetrics.silenceRatio,
        postureScore: poseMetrics.postureScore,
        gazeScore: poseMetrics.gazeScore,
      };

      setState((s) => ({ ...s, metrics: combinedMetrics, phase: "analyzing" }));

      historyRef.current.push({
        question: q.text,
        answer: transcript,
        speakerId: q.speakerId,
      });

      const decision = await analyzeResponse(transcript, q.text, combinedMetrics);

      if (decision === "conclude") {
        setState((s) => ({ ...s, phase: "finished", currentSpeakerId: null, currentQuestion: null }));
      } else {
        const nextType = historyRef.current.length % 3 === 0
          ? "behavioral"
          : historyRef.current.length % 3 === 1
            ? "stress"
            : "closing";
        await runQuestionCycle(nextType);
      }
    },
    [generateNextQuestion, analyzeResponse, callbacks],
  );

  const startInterview = useCallback(
    async (params: {
      questions: { text: string; speakerId: string; type: string }[];
      panelIds: string[];
      language: string;
    }) => {
      questionsRef.current = [...params.questions];
      panelIdsRef.current = params.panelIds;
      lastSpeakerRef.current = null;
      languageRef.current = params.language;
      remainingRef.current = params.questions.length;
      historyRef.current = [];

      setState((s) => ({ ...s, isProcessing: true, phase: "idle" }));

      await runQuestionCycle("opening");
    },
    [runQuestionCycle],
  );

  const stopInterview = useCallback(() => {
    setState({
      currentSpeakerId: null,
      currentQuestion: null,
      isProcessing: false,
      phase: "finished",
      error: null,
      metrics: { wpm: 0, silenceRatio: 0, postureScore: 0, gazeScore: 0 },
    });
  }, []);

  const stopListening = useCallback(async () => {
    const resolve = stopListeningResolveRef.current;
    if (!resolve) return;
    stopListeningResolveRef.current = null;
    const blob = await callbacks.onStopListening();
    resolve(blob);
  }, [callbacks]);

  return {
    ...state,
    history: historyRef.current,
    startInterview,
    stopInterview,
    setGenerateFn,
    stopListening,
  };
}
