"use client";

import { useEffect, useRef } from "react";

interface CandidateWebcamProps {
  stream: MediaStream | null;
  onVideoReady?: (video: HTMLVideoElement) => void;
  compact?: boolean;
}

export function CandidateWebcam({
  stream,
  onVideoReady,
  compact = false,
}: CandidateWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (onVideoReady) {
        onVideoReady(videoRef.current);
      }
    }
  }, [stream, onVideoReady]);

  if (!stream) return null;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-black/80 border-2 border-[#103826]/20 shadow-lg ${
        compact ? "w-32 h-24" : "w-40 h-30 md:w-48 md:h-36"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full">
          🎤 Vous
        </span>
      </div>
    </div>
  );
}
