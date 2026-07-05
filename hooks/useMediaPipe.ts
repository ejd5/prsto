"use client";

import { useRef, useCallback, useState } from "react";

interface PoseMetrics {
  postureScore: number;
  gazeScore: number;
}

export function useMediaPipe() {
  const [metrics, setMetrics] = useState<PoseMetrics>({
    postureScore: 0,
    gazeScore: 0,
  });
  const poseRef = useRef<unknown>(null);
  const animFrameRef = useRef<number>(0);
  const activeRef = useRef(false);

  const loadPoseLandmarker = useCallback(async () => {
    try {
      const mod = await import("@mediapipe/tasks-vision");
      const PoseLandmarker = mod.PoseLandmarker;
      const FilesetResolver = mod.FilesetResolver;
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      poseRef.current = poseLandmarker;
      return poseLandmarker;
    } catch (err) {
      console.warn("MediaPipe non disponible, tracking désactivé:", err);
      return null;
    }
  }, []);

  const startTracking = useCallback(
    async (videoElement: HTMLVideoElement) => {
      const poseLandmarker =
        (poseRef.current as any) || (await loadPoseLandmarker());
      if (!poseLandmarker) return;

      activeRef.current = true;
      let lastTimestamp = -1;
      let totalFrames = 0;
      let goodPostureFrames = 0;
      let gazeForwardFrames = 0;

      const track = () => {
        if (!activeRef.current) return;
        const now = performance.now();
        if (lastTimestamp === -1) lastTimestamp = now;

        const results = poseLandmarker.detectForVideo(videoElement, now);
        lastTimestamp = now;
        totalFrames++;

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          const leftEar = landmarks[7];
          const rightEar = landmarks[8];
          const nose = landmarks[0];

          if (leftShoulder && rightShoulder) {
            const shoulderSlope = Math.abs(
              leftShoulder.y - rightShoulder.y,
            );
            if (shoulderSlope < 0.05) goodPostureFrames++;
          }

          if (nose && leftEar && rightEar) {
            const noseToLeftEar = Math.abs(nose.x - leftEar.x);
            const noseToRightEar = Math.abs(nose.x - rightEar.x);
            const ratio = Math.min(noseToLeftEar, noseToRightEar) /
              Math.max(noseToLeftEar, noseToRightEar);
            if (ratio > 0.6) gazeForwardFrames++;
          }
        }

        const postureScore = totalFrames > 0
          ? Math.round((goodPostureFrames / totalFrames) * 100)
          : 0;
        const gazeScore = totalFrames > 0
          ? Math.round((gazeForwardFrames / totalFrames) * 100)
          : 0;

        setMetrics({ postureScore, gazeScore });
        animFrameRef.current = requestAnimationFrame(track);
      };

      animFrameRef.current = requestAnimationFrame(track);
    },
    [loadPoseLandmarker],
  );

  const stopTracking = useCallback(() => {
    activeRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setMetrics({ postureScore: 0, gazeScore: 0 });
  }, []);

  return { metrics, startTracking, stopTracking };
}
