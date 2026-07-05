"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-extrabold tracking-[-0.04em]" style={{ color: "#E4B118", fontFamily: "Playfair Display, serif" }}>
      {current}{suffix}
    </div>
  );
}

const STATS = [
  { num: 92, suffix: "%", label: "Taux de réussite ATS", sub: "Dossiers qui passent les filtres" },
  { num: 8, suffix: " min", label: "Par candidat préparé", sub: "vs 2-3h manuellement" },
  { num: 40, suffix: "%", label: "Plus de placements", sub: "Candidats mieux préparés" },
  { num: 20, suffix: "h", label: "Économisées par semaine", sub: "Par recruteur" },
];

export default function StatsRecruiter() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(228,177,24,0.05), transparent 65%)", filter: "blur(30px)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-6 relative" style={{ zIndex: 1 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((s, i) => (
            <Reveal key={s.label} variant="up" delay={i * 100}>
              <div className="rounded-2xl p-6 md:p-8 text-center transition-all duration-500 hover:-translate-y-1 backdrop-blur-sm" style={{
                background: "rgba(255,253,248,0.6)",
                border: "1px solid rgba(16,56,38,0.06)",
                boxShadow: "0 8px 32px rgba(16,56,38,0.03)",
              }}>
                <AnimatedCounter target={s.num} suffix={s.suffix} />
                <div className="text-sm font-bold mt-2" style={{ color: "#0B1F18" }}>{s.label}</div>
                <div className="text-[11px] mt-1" style={{ color: "#6A8F6D" }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
