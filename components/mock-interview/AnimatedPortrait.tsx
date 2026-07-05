"use client";

import { useEffect, useRef } from "react";

interface AnimatedPortraitProps {
  name: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  isSpeaking: boolean;
  audioAmplitude?: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_PX = { sm: 160, md: 220, lg: 360 };
const FONT_SCALE = { sm: 11, md: 13, lg: 14 };
const TITLE_FONT_SCALE = { sm: 9, md: 10, lg: 11 };

export function AnimatedPortrait({
  name,
  title,
  imageUrl,
  isActive,
  isSpeaking,
  audioAmplitude = 0,
  size = "lg",
}: AnimatedPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef(0);
  const startRef = useRef(0);
  const speakingRef = useRef(false);
  const ampRef = useRef(0);
  const activeRef = useRef(false);
  const blinkTimerRef = useRef(4000 + Math.random() * 3000);
  const blinkStateRef = useRef({ active: false, start: 0 });

  speakingRef.current = isSpeaking;
  ampRef.current = audioAmplitude;
  activeRef.current = isActive;

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    imageRef.current = img;
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const px = SIZE_PX[size];
    canvas.width = px * dpr;
    canvas.height = px * dpr;
    canvas.style.width = `${px}px`;
    canvas.style.height = `${px}px`;

    startRef.current = performance.now();

    const draw = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const img = imageRef.current;

      if (!img?.complete) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const breathing = 1 + Math.sin(t * 1.5) * 0.015;
      const swayX = Math.sin(t * 0.7) * dpr;
      const swayY = Math.sin(t * 0.4) * 0.6 * dpr;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(breathing, breathing);
      ctx.translate(-w / 2 + swayX, -h / 2 + swayY);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();

      if (speakingRef.current) {
        const amp = ampRef.current;
        const mx = w * 0.5;
        const my = h * 0.72;
        const mw = w * 0.28;
        const mh = h * 0.05;
        const mouthOpen = amp * 0.12;

        ctx.save();
        ctx.globalAlpha = 0.3 + amp * 0.7;
        ctx.fillStyle = "#1a0e05";
        ctx.beginPath();
        ctx.ellipse(mx, my + mh * 0.3, mw / 2, (mh / 2) + (mouthOpen * mh), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      blinkTimerRef.current -= 16;
      if (blinkTimerRef.current <= 0 && !blinkStateRef.current.active) {
        blinkStateRef.current = { active: true, start: t };
        blinkTimerRef.current = 3000 + Math.random() * 4000;
      }
      if (blinkStateRef.current.active) {
        const bElapsed = t - blinkStateRef.current.start;
        if (bElapsed > 0.12) {
          blinkStateRef.current.active = false;
        } else {
          const close = Math.sin((bElapsed / 0.12) * Math.PI);
          const eyeY = h * 0.35;
          const eyeW = w * 0.09;
          const eyeH = h * 0.025 * close;

          ctx.save();
          ctx.fillStyle = "#5a4a38";
          ctx.beginPath();
          ctx.ellipse(w * 0.44, eyeY, eyeW, Math.max(eyeH, 0.5), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(w * 0.56, eyeY, eyeW, Math.max(eyeH, 0.5), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (activeRef.current && speakingRef.current) {
        const glow = 0.15 + Math.sin(t * 2) * 0.05;
        ctx.save();
        ctx.shadowColor = "#103826";
        ctx.shadowBlur = 30 + Math.sin(t * 2) * 8;
        ctx.strokeStyle = `rgba(16, 56, 38, ${glow})`;
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(2 * dpr, 2 * dpr, w - 4 * dpr, h - 4 * dpr);
        ctx.restore();
      } else if (activeRef.current) {
        const pulse = 0.08 + Math.sin(t * 1.5) * 0.04;
        ctx.save();
        ctx.shadowColor = "#103826";
        ctx.shadowBlur = 15 + Math.sin(t * 1.5) * 5;
        ctx.strokeStyle = `rgba(16, 56, 38, ${pulse})`;
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeRect(2 * dpr, 2 * dpr, w - 4 * dpr, h - 4 * dpr);
        ctx.restore();
      }

      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.15)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-2xl"
      />
      <p
        className="font-semibold text-[#103826] text-center"
        style={{ fontSize: FONT_SCALE[size] }}
      >
        {name}
      </p>
      <p
        className="text-[#103826]/60 text-center"
        style={{ fontSize: TITLE_FONT_SCALE[size] }}
      >
        {title}
      </p>
    </div>
  );
}
