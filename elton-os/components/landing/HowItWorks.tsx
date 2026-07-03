import Reveal from "./Reveal";

const STEPS = [
  {
    num: "01",
    title: "Importez votre profil",
    desc: "CV PDF, LinkedIn ou formulaire. PRSTO structure, analyse et crée votre CV Maître automatiquement.",
    color: "#103826",
  },
  {
    num: "02",
    title: "Définissez votre cible",
    desc: "Postes visés, secteurs, rémunération, localisation — PRSTO calibre sa stratégie sur votre ambition.",
    color: "#E4B118",
  },
  {
    num: "03",
    title: "Laissez l'IA travailler",
    desc: "Scannez les offres, générez CV adapté et lettre sur-mesure, envoyez. Résultats mesurables dès la première semaine.",
    color: "#6A8F6D",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28" style={{ background: "rgba(106,143,109,0.04)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Prise en main
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Opérationnel en<br />3 minutes chrono.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5 relative">
          <div className="hidden md:block absolute top-8 left-[calc(33%+1.25rem)] right-[calc(33%+1.25rem)] h-px" style={{
            background: "linear-gradient(90deg, transparent, rgba(16,56,38,0.15), transparent)",
          }} />

          {STEPS.map((s, i) => (
            <Reveal key={s.num} variant="up" delay={i * 110} className="h-full">
              <div className="rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 h-full" style={{
                borderColor: "rgba(16,56,38,0.08)",
                background: "#FFFDF8",
              }}>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-3.5 flex items-center gap-2" style={{ color: "#6A8F6D" }}>
                  <span style={{ color: s.color }}>—</span>
                  {s.num}
                </div>
                <h3 className="text-[17px] font-bold mb-2 tracking-tight text-[#0B1F18]">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6A8F6D" }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
