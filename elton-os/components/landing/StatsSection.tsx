"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

type Stat = {
  value: number;
  suffix: string;
  label: string;
  color: string;
};

const STATS: Stat[] = [
  { value: 87, suffix: "%", label: "Taux de succès moyen après optimisation", color: "#103826" },
  { value: 17, suffix: "", label: "Systèmes ATS supportés en natif", color: "#E4B118" },
  { value: 300, suffix: "+", label: "Cadres dirigeants accompagnés", color: "#6A8F6D" },
  { value: 8, suffix: "s", label: "Temps moyen de génération CV adapté", color: "#1F4A34" },
];

function useCountUp(target: number, start: boolean, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf: number;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);

  return value;
}

function StatCard({ stat, start }: { stat: Stat; start: boolean }) {
  const count = useCountUp(stat.value, start);

  return (
    <div className="rounded-2xl border p-6" style={{
      borderColor: "rgba(16,56,38,0.08)", background: "#FFFDF8",
    }}>
      <div className="text-[clamp(2rem,3vw,2.75rem)] font-extrabold tracking-tight" style={{ color: stat.color }}>
        {count}{stat.suffix}
      </div>
      <div className="text-sm mt-1.5 leading-snug" style={{ color: "#6A8F6D" }}>{stat.label}</div>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-28" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Chiffres clés
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Des résultats mesurables.
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <StatCard key={s.label} stat={s} start={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
