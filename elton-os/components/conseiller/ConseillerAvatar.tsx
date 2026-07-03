"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ConseillerAvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  mood?: "neutral" | "happy" | "listening" | "thinking";
  onToggleSpeech?: () => void;
  speechEnabled?: boolean;
}

export default function ConseillerAvatar({
  isSpeaking,
  isThinking,
  mood = "neutral",
  onToggleSpeech,
  speechEnabled = false,
}: ConseillerAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Blink timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Mouth animation when speaking
  useEffect(() => {
    if (isSpeaking) {
      const talkInterval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 180);
      intervalRef.current = talkInterval;
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setMouthOpen(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpeaking]);

  // Head tilt when thinking
  const thinkTilt = isThinking ? "5deg" : "0deg";

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Avatar SVG */}
      <div
        className="relative"
        style={{
          width: 120,
          height: 120,
          animation: isThinking
            ? "conseiller-think 3s ease-in-out infinite"
            : "conseiller-idle 4s ease-in-out infinite",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {/* Glow behind head */}
          <circle cx="60" cy="50" r="45" fill="url(#glowGrad)" opacity={isThinking ? 0.3 : 0.15} />
          <defs>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C8A64E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C8A64E" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A2418" />
              <stop offset="100%" stopColor="#1A1714" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A1714" />
              <stop offset="100%" stopColor="#0F0D0A" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle cx="60" cy="50" r="38" fill="url(#bgGrad)" stroke="#3A3528" strokeWidth="1.5" />

          {/* Suit / body */}
          <path d="M40 70 Q60 68 80 70 L78 90 Q60 92 42 90 Z" fill="url(#suitGrad)" stroke="#3A3528" strokeWidth="1" />

          {/* Collar */}
          <path d="M55 68 L60 75 L65 68" stroke="#C8A64E" strokeWidth="1.2" fill="none" opacity="0.6" />

          {/* Head */}
          <ellipse cx="60" cy="46" rx="20" ry="22" fill="#2A2418" stroke="#3A3528" strokeWidth="1" />

          {/* Hair */}
          <path d="M42 40 Q44 28 60 25 Q76 28 78 40" fill="#1A1714" stroke="#3A3528" strokeWidth="0.8" />

          {/* Left eye */}
          <g style={{ transform: `scaleY(${blink ? 0.1 : 1})`, transformOrigin: "50px 44px", transition: "transform 0.1s" }}>
            <circle cx="52" cy="44" r="3" fill="#C8A64E" opacity="0.8" />
            <circle cx="52" cy="44" r="1.2" fill="#1A1714" />
          </g>

          {/* Right eye */}
          <g style={{ transform: `scaleY(${blink ? 0.1 : 1})`, transformOrigin: "68px 44px", transition: "transform 0.1s" }}>
            <circle cx="68" cy="44" r="3" fill="#C8A64E" opacity="0.8" />
            <circle cx="68" cy="44" r="1.2" fill="#1A1714" />
          </g>

          {/* Eyebrows — mood-driven */}
          {mood === "thinking" ? (
            <>
              <path d="M47 39 Q50 36 55 38" stroke="#C8A64E" strokeWidth="1" opacity="0.4" fill="none" />
              <path d="M65 38 Q70 36 73 39" stroke="#C8A64E" strokeWidth="1" opacity="0.4" fill="none" />
            </>
          ) : mood === "happy" ? (
            <>
              <path d="M47 38 Q51 36 55 37" stroke="#C8A64E" strokeWidth="1" opacity="0.5" fill="none" />
              <path d="M65 37 Q69 36 73 38" stroke="#C8A64E" strokeWidth="1" opacity="0.5" fill="none" />
            </>
          ) : (
            <>
              <path d="M47 39 Q51 37 55 39" stroke="#C8A64E" strokeWidth="1" opacity="0.4" fill="none" />
              <path d="M65 39 Q69 37 73 39" stroke="#C8A64E" strokeWidth="1" opacity="0.4" fill="none" />
            </>
          )}

          {/* Glasses */}
          <rect x="47" y="41" width="10" height="7" rx="2" stroke="#C8A64E" strokeWidth="1.2" fill="none" opacity="0.5" />
          <rect x="63" y="41" width="10" height="7" rx="2" stroke="#C8A64E" strokeWidth="1.2" fill="none" opacity="0.5" />
          <line x1="57" y1="44" x2="63" y2="44" stroke="#C8A64E" strokeWidth="1.2" opacity="0.5" />

          {/* Nose */}
          <ellipse cx="60" cy="49" rx="2" ry="3" stroke="#3A3528" strokeWidth="0.8" fill="none" />

          {/* Mouth — speaking animation */}
          {isSpeaking ? (
            <ellipse cx="60" cy={mouthOpen ? "56" : "55"} rx={mouthOpen ? "5" : "4"} ry={mouthOpen ? "3.5" : "1.5"}
              fill="#3A3528" stroke="#C8A64E" strokeWidth="0.6" opacity="0.6" />
          ) : (
            <path d="M56 55 Q60 57 64 55" stroke="#C8A64E" strokeWidth="0.8" fill="none" opacity="0.4" />
          )}

          {/* Thinking indicator dots */}
          {isThinking && (
            <>
              <circle cx="28" cy="52" r="1.5" fill="#C8A64E" opacity="0.3">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0s" />
              </circle>
              <circle cx="22" cy="52" r="1.5" fill="#C8A64E" opacity="0.3">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
              </circle>
              <circle cx="16" cy="52" r="1.5" fill="#C8A64E" opacity="0.3">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
              </circle>
            </>
          )}
        </svg>

        {/* TTS toggle */}
        {onToggleSpeech && (
          <button
            onClick={onToggleSpeech}
            className="absolute -bottom-1 -right-2 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-150 hover:scale-110"
            style={{
              background: speechEnabled ? "rgba(200,166,78,0.2)" : "var(--fond-eleve)",
              borderColor: speechEnabled ? "var(--or)" : "var(--bordure)",
              color: speechEnabled ? "var(--or)" : "var(--texte-tertiaire)",
            }}
            title={speechEnabled ? "Désactiver la voix" : "Activer la voix"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {speechEnabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Status label */}
      <div className="mt-2 text-center">
        <div className="text-xs font-semibold" style={{ color: "var(--or)" }}>
          Conseiller Carrière
        </div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
          {isThinking ? "Réfléchit..." : isSpeaking ? "Parle..." : "À l'écoute"}
        </div>
      </div>
    </div>
  );
}
