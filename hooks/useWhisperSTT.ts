"use client";

import { useState, useCallback, useRef } from "react";

type WhisperModel = "tiny" | "base" | "small";

interface WhisperSTTState {
  isReady: boolean;
  isTranscribing: boolean;
  isModelLoading: boolean;
  progress: number;
  error: string | null;
}

export function useWhisperSTT(modelSize: WhisperModel = "base") {
  const [state, setState] = useState<WhisperSTTState>({
    isReady: false,
    isTranscribing: false,
    isModelLoading: false,
    progress: 0,
    error: null,
  });

  const pipelineRef = useRef<unknown>(null);

  const loadModel = useCallback(async () => {
    if (pipelineRef.current) {
      setState((s) => ({ ...s, isReady: true }));
      return;
    }

    setState((s) => ({ ...s, isModelLoading: true, progress: 0 }));

    try {
      const { pipeline } = await import("@huggingface/transformers");

      const modelName =
        modelSize === "tiny"
          ? "Xenova/whisper-tiny"
          : modelSize === "base"
            ? "Xenova/whisper-base"
            : "Xenova/whisper-small";

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        modelName,
        {
          progress_callback: (p: { status?: string; progress?: number }) => {
            if (p.progress !== undefined) {
              setState((s) => ({ ...s, progress: p.progress || 0 }));
            }
          },
        },
      );

      pipelineRef.current = transcriber;
      setState({ isReady: true, isTranscribing: false, isModelLoading: false, progress: 100, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur chargement Whisper";
      setState({ isReady: false, isTranscribing: false, isModelLoading: false, progress: 0, error: message });
    }
  }, [modelSize]);

  const transcribe = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      const transcriber = pipelineRef.current as
        | { (task: string, audio: Blob): Promise<{ text: string }> }
        | null;

      if (!transcriber) {
        setState((s) => ({ ...s, error: "Whisper pas chargé" }));
        return null;
      }

      setState((s) => ({ ...s, isTranscribing: true, error: null }));

      try {
        const result = await transcriber("automatic-speech-recognition", audioBlob);
        setState((s) => ({ ...s, isTranscribing: false }));
        return result.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur transcription";
        setState((s) => ({ ...s, isTranscribing: false, error: message }));
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    pipelineRef.current = null;
    setState({ isReady: false, isTranscribing: false, isModelLoading: false, progress: 0, error: null });
  }, []);

  return { ...state, loadModel, transcribe, reset };
}

// Helper to convert AudioBuffer to Blob
export function audioBufferToBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(wavBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, length * numChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
