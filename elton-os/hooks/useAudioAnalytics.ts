"use client";

import { useRef, useCallback } from "react";

interface AudioAnalytics {
  wpm: number;
  silenceRatio: number;
  durationMs: number;
}

export function useAudioAnalytics() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const analyzeAudio = useCallback(
    async (
      audioBlob: Blob,
      transcript: string,
    ): Promise<AudioAnalytics> => {
      const ctx = getContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const durationMs = audioBuffer.duration * 1000;
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;
      const minutes = audioBuffer.duration / 60;
      const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

      const channelData = audioBuffer.getChannelData(0);
      const threshold = 0.02;
      let silentSamples = 0;

      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) < threshold) {
          silentSamples++;
        }
      }

      const silenceRatio = channelData.length > 0
        ? silentSamples / channelData.length
        : 0;

      return { wpm, silenceRatio, durationMs };
    },
    [getContext],
  );

  const detectSilence = useCallback(
    (
      stream: MediaStream,
      onSilence: () => void,
      silenceThresholdMs: number = 1500,
    ): (() => void) => {
      const ctx = getContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let silenceStart: number | null = null;
      let active = true;

      const check = () => {
        if (!active) return;
        analyser.getByteTimeDomainData(dataArray);

        let max = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = Math.abs(dataArray[i] - 128);
          if (v > max) max = v;
        }

        const threshold = 20;
        const isSilent = max < threshold;

        if (isSilent) {
          if (silenceStart === null) silenceStart = Date.now();
          else if (Date.now() - silenceStart >= silenceThresholdMs) {
            onSilence();
            silenceStart = null;
          }
        } else {
          silenceStart = null;
        }

        requestAnimationFrame(check);
      };

      check();

      return () => {
        active = false;
        source.disconnect();
      };
    },
    [getContext],
  );

  const detectInterruptions = useCallback(
    (stream: MediaStream): { stop: () => void; count: number } => {
      const ctx = getContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let count = 0;
      let wasAbove = false;
      let active = true;

      const check = () => {
        if (!active) return;
        analyser.getByteTimeDomainData(dataArray);

        let max = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = Math.abs(dataArray[i] - 128);
          if (v > max) max = v;
        }

        const threshold = 40;
        const isAbove = max > threshold;

        if (isAbove && !wasAbove) count++;
        wasAbove = isAbove;

        requestAnimationFrame(check);
      };

      check();

      return {
        stop: () => {
          active = false;
          source.disconnect();
        },
        get count() {
          return count;
        },
      };
    },
    [getContext],
  );

  return { analyzeAudio, detectSilence, detectInterruptions };
}
