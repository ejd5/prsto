"use client";

import { useCallback, useRef, useState } from "react";

const LANG_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
  pt: "pt-PT",
  it: "it-IT",
  ja: "ja-JP",
  ar: "ar-SA",
};

export function useNativeSTT() {
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef<string>("");
  const interimRef = useRef<string>("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  /**
   * Start the recognition engine and keep it running.
   * Call this ONCE from a user-gesture handler (button click).
   */
  const startContinuous = useCallback(
    (lang: string = "fr", onTranscriptChange?: (t: string) => void) => {
      if (!isSupported) {
        setError("Micro non supporté. Utilisez Google Chrome.");
        return false;
      }
      if (recognitionRef.current) return true; // already running

      const API =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const r = new API();
      r.continuous = true;
      r.interimResults = true;
      r.lang = LANG_MAP[lang] || "fr-FR";
      r.maxAlternatives = 1;

      finalRef.current = "";
      interimRef.current = "";

      r.onstart = () => setIsListening(true);

      r.onresult = (event: any) => {
        let newFinal = "";
        let newInterim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) newFinal += res[0].transcript;
          else newInterim += res[0].transcript;
        }
        if (newFinal) finalRef.current += newFinal + " ";
        interimRef.current = newInterim;
        const combined = finalRef.current + newInterim;
        setLiveTranscript(combined);
        onTranscriptChange?.(combined);
      };

      r.onerror = (e: any) => {
        // Silently ignore noise/silence errors — they're expected
        if (["no-speech", "audio-capture", "aborted"].includes(e.error)) return;
        setError(`Erreur microphone: ${e.error}`);
      };

      r.onend = () => {
        // Chrome auto-stops after silence. Restart immediately to keep it alive.
        setIsListening(false);
        if (recognitionRef.current === r) {
          // Auto-restart (keep mic alive throughout the session)
          try {
            r.start();
            setIsListening(true);
          } catch (_) {
            recognitionRef.current = null;
          }
        }
      };

      recognitionRef.current = r;
      try {
        r.start();
        return true;
      } catch (err) {
        setError("Impossible de démarrer le microphone.");
        recognitionRef.current = null;
        return false;
      }
    },
    [isSupported]
  );

  /**
   * Reset the transcript accumulator — call this at the start of each "listening" phase.
   */
  const resetTranscript = useCallback(() => {
    finalRef.current = "";
    interimRef.current = "";
    setLiveTranscript("");
  }, []);

  /**
   * Read and return the current transcript without stopping the recognition.
   */
  const captureTranscript = useCallback((): string => {
    return (finalRef.current + interimRef.current).trim();
  }, []);

  /**
   * Fully stop the recognition (end of session).
   */
  const stopAll = useCallback(() => {
    if (recognitionRef.current) {
      const r = recognitionRef.current;
      recognitionRef.current = null; // prevent auto-restart in onend
      try { r.stop(); } catch (_) {}
    }
    setIsListening(false);
  }, []);

  return {
    isSupported,
    isListening,
    liveTranscript,
    error,
    startContinuous,
    resetTranscript,
    captureTranscript,
    stopAll,
  };
}
