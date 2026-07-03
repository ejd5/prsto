"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useNativeSTT } from "./useNativeSTT";

// Helper pour le TTS
export function speakText(text: string, lang: string = "fr"): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setTimeout(resolve, 1000);
      return;
    }
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const prefix: Record<string, string> = {
        fr: "fr", en: "en", es: "es", de: "de", pt: "pt", it: "it", ja: "ja", ar: "ar",
      };
      const p = prefix[lang] || "fr";

      const selectVoice = () => {
        const all = window.speechSynthesis.getVoices();
        const matching = all.filter(v => v.lang.toLowerCase().startsWith(p));
        return (
          matching.find(v => v.name.toLowerCase().includes("premium")) ||
          matching.find(v => v.name.toLowerCase().includes("google")) ||
          matching.find(v => !v.name.toLowerCase().includes("compact")) ||
          matching[0] ||
          all[0]
        );
      };

      const doSpeak = () => {
        const voice = selectVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 0.87;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };

        utterance.onend = finish;
        utterance.onerror = finish;

        const words = text.trim().split(/\s+/).length;
        const ms = Math.max(4000, (words / 2.2) * 1000) + 2000;
        setTimeout(finish, ms);

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
        setTimeout(doSpeak, 500);
      } else {
        doSpeak();
      }
    }, 100);
  });
}

// Mots parasites par langue
const FILLER_WORDS: Record<string, string[]> = {
  fr: ["euh", "donc", "du coup", "en fait", "voilà", "genre", "comme", "alors", "après"],
  en: ["um", "uh", "like", "you know", "basically", "so", "actually", "literally"],
  es: ["bueno", "pues", "o sea", "eh", "este", "como", "entonces"],
};

export type InterviewPhase =
  | "idle"
  | "speaking"
  | "listening"
  | "processing"
  | "finished";

export interface InterviewEntry {
  question: string;
  answer: string;
  speakerId: string;
  wpm: number;
  fillerCount: number;
  starScore: { s: boolean; t: boolean; a: boolean; r: boolean };
}

interface Question {
  text: string;
  speakerId: string;
  type: string;
}

export function useInterviewEngine(
  generateFn: ((p: { systemPrompt: string; userPrompt: string }) => Promise<string | null>) | null
) {
  const stt = useNativeSTT();

  const [phase, setPhase] = useState<InterviewPhase>("idle");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
  const [history, setHistory] = useState<InterviewEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live analysis metrics
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillers, setLiveFillers] = useState<Record<string, number>>({});
  const [liveStar, setLiveStar] = useState({ s: false, t: false, a: false, r: false });

  const questionsRef = useRef<Question[]>([]);
  const panelIdsRef = useRef<string[]>([]);
  const langRef = useRef<string>("fr");
  const historyRef = useRef<InterviewEntry[]>([]);
  const activeRef = useRef<boolean>(false);
  const isCapturingRef = useRef<boolean>(false);
  const listenStartTimeRef = useRef<number>(0);

  const getNextSpeaker = useCallback((preferredId?: string): string => {
    const ids = panelIdsRef.current;
    if (!ids.length) return "";
    if (ids.length === 1) return ids[0];
    const last = historyRef.current[historyRef.current.length - 1]?.speakerId;
    const others = ids.filter(id => id !== last);
    const pool = preferredId && ids.includes(preferredId) && preferredId !== last
      ? [preferredId]
      : (others.length ? others : ids);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // Live analytics engine (fires as candidate speaks)
  useEffect(() => {
    if (phase !== "listening" || !stt.liveTranscript) {
      setLiveWpm(0);
      setLiveStar({ s: false, t: false, a: false, r: false });
      return;
    }

    const text = stt.liveTranscript.toLowerCase();
    const words = text.trim().split(/\s+/).filter(Boolean);
    
    // 1. Calculate WPM
    const elapsedSeconds = (Date.now() - listenStartTimeRef.current) / 1000;
    const calculatedWpm = elapsedSeconds > 2 ? Math.round((words.length / elapsedSeconds) * 60) : 0;
    setLiveWpm(calculatedWpm);

    // 2. Count Fillers
    const activeLang = langRef.current || "fr";
    const fillersList = FILLER_WORDS[activeLang] || FILLER_WORDS.fr;
    const fillerCounts: Record<string, number> = {};
    fillersList.forEach(w => {
      const occurrences = (text.match(new RegExp(`\\b${w}\\b`, "g")) || []).length;
      if (occurrences > 0) {
        fillerCounts[w] = occurrences;
      }
    });
    setLiveFillers(fillerCounts);

    // 3. Simple STAR keyword heuristic
    const sKeywords = ["situation", "contexte", "projet", "cadre", "lorsque", "quand"];
    const tKeywords = ["tâche", "rôle", "mission", "objectif", "devoir", "demandé"];
    const aKeywords = ["action", "mis en place", "développé", "géré", "résolu", "lancé", "organisé"];
    const rKeywords = ["résultat", "chiffre", "croissance", "pour cent", "%", "finalement", "abouti"];

    setLiveStar({
      s: sKeywords.some(kw => text.includes(kw)),
      t: tKeywords.some(kw => text.includes(kw)),
      a: aKeywords.some(kw => text.includes(kw)),
      r: rKeywords.some(kw => text.includes(kw)),
    });
  }, [stt.liveTranscript, phase]);

  useEffect(() => {
    if (!activeRef.current) return;

    if (phase === "speaking" && currentQuestion) {
      let cancelled = false;
      speakText(currentQuestion, langRef.current).then(() => {
        if (cancelled || !activeRef.current) return;
        stt.resetTranscript();
        setLiveFillers({});
        setLiveStar({ s: false, t: false, a: false, r: false });
        listenStartTimeRef.current = Date.now();
        isCapturingRef.current = true;
        setPhase("listening");
      });
      return () => { cancelled = true; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestion]);

  const processAnswer = useCallback(async (
    answer: string,
    question: string,
    speakerId: string,
    finalWpm: number,
    finalFillers: number,
    finalStar: { s: boolean; t: boolean; a: boolean; r: boolean }
  ) => {
    const entry: InterviewEntry = {
      question,
      answer,
      speakerId,
      wpm: finalWpm,
      fillerCount: finalFillers,
      starScore: finalStar
    };
    
    historyRef.current = [...historyRef.current, entry];
    setHistory([...historyRef.current]);

    if (questionsRef.current.length === 0) {
      setPhase("finished");
      return;
    }

    if (generateFn) {
      try {
        const { getLoopPrompt } = await import("@/lib/ai/prompts-mock-interview");
        const prompt = getLoopPrompt({
          language: langRef.current,
          userTranscript: answer,
          lastQuestion: question,
          sessionHistory: historyRef.current.map(h => ({ question: h.question, answer: h.answer })),
          wpm: finalWpm,
          silenceRatio: 0,
          postureScore: 0,
          gazeScore: 0,
          remainingQuestions: questionsRef.current.length,
        });

        const result = await Promise.race([
          generateFn(prompt),
          new Promise<null>(r => setTimeout(() => r(null), 10_000)),
        ]);

        if (result && activeRef.current) {
          try {
            const parsed = JSON.parse(result);
            if (parsed.action === "conclude") {
              setPhase("finished");
              return;
            }
            if (parsed.action === "follow_up" && parsed.question) {
              questionsRef.current.unshift({
                text: parsed.question,
                speakerId: getNextSpeaker(parsed.speaker),
                type: "follow_up",
              });
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    if (!activeRef.current) return;

    const nextQ = questionsRef.current.shift();
    if (!nextQ) {
      setPhase("finished");
      return;
    }

    const nextSpeakerId = getNextSpeaker(nextQ.speakerId);
    setCurrentSpeakerId(nextSpeakerId);
    setCurrentQuestion(nextQ.text);
    setPhase("speaking");
  }, [generateFn, getNextSpeaker]);

  const userFinishedAnswer = useCallback(() => {
    if (!isCapturingRef.current) return;

    isCapturingRef.current = false;
    const transcript = stt.captureTranscript();
    const question = currentQuestion || "";
    const speakerId = currentSpeakerId || "";

    const totalFillers = Object.values(liveFillers).reduce((a, b) => a + b, 0);
    const finalWpm = liveWpm;
    const finalStar = { ...liveStar };

    setPhase("processing");

    setTimeout(() => {
      processAnswer(transcript, question, speakerId, finalWpm, totalFillers, finalStar);
    }, 0);
  }, [stt, currentQuestion, currentSpeakerId, liveWpm, liveFillers, liveStar, processAnswer]);

  const startInterview = useCallback((params: {
    questions: Question[];
    panelIds: string[];
    language: string;
  }) => {
    if (activeRef.current) return;

    const micOk = stt.startContinuous(params.language);
    if (!micOk) {
      setError("Impossible d'accéder au microphone.");
      return;
    }

    activeRef.current = true;
    questionsRef.current = [...params.questions];
    panelIdsRef.current = params.panelIds;
    langRef.current = params.language;
    historyRef.current = [];
    setHistory([]);
    setError(null);

    const first = questionsRef.current.shift();
    if (!first) return;

    const speakerId = getNextSpeaker(first.speakerId);
    setCurrentSpeakerId(speakerId);
    setCurrentQuestion(first.text);
    setPhase("speaking");
  }, [stt, getNextSpeaker]);

  const stopInterview = useCallback(() => {
    activeRef.current = false;
    isCapturingRef.current = false;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    stt.stopAll();
    setPhase("finished");
  }, [stt]);

  return {
    phase,
    currentQuestion,
    currentSpeakerId,
    error,
    history,
    isListening: stt.isListening,
    liveTranscript: stt.liveTranscript,
    sttError: stt.error,
    isCapturing: isCapturingRef.current,
    liveWpm,
    liveFillers,
    liveStar,
    startInterview,
    stopInterview,
    userFinishedAnswer,
  };
}
