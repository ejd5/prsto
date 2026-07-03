"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface MediaPipelineState {
  isStreaming: boolean;
  isRecording: boolean;
  stream: MediaStream | null;
  error: string | null;
}

export function useMediaPipeline() {
  const [state, setState] = useState<MediaPipelineState>({
    isStreaming: false,
    isRecording: false,
    stream: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      setState({ isStreaming: true, isRecording: false, stream, error: null });
      return stream;
    } catch (err) {
      const message =
        err instanceof DOMException
          ? err.name === "NotAllowedError"
            ? "Accès caméra/micro refusé. Autorisez l'accès dans votre navigateur."
            : err.name === "NotFoundError"
              ? "Caméra ou micro non trouvé."
              : `Erreur média: ${err.message}`
          : "Erreur inconnue";
      setState((s) => ({ ...s, error: message }));
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState({ isStreaming: false, isRecording: false, stream: null, error: null });
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      setState((s) => ({ ...s, error: "Aucun flux actif" }));
      return;
    }

    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setState((s) => ({ ...s, isRecording: true, error: null }));
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        setState((s) => ({ ...s, isRecording: false }));
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const attachToVideo = useCallback((videoElement: HTMLVideoElement) => {
    videoRef.current = videoElement;
    if (streamRef.current) {
      videoElement.srcObject = streamRef.current;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
    startRecording,
    stopRecording,
    attachToVideo,
  };
}
