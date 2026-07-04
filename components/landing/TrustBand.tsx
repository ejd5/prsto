import Reveal from "./Reveal";

export default function TrustBand() {
  const items = [
    "6 moteurs d'IA spécialisés",
    "17 systèmes ATS supportés",
    "Local-first · Zéro cloud externe",
    "Zéro auto-submit",
    "14 jours d'essai gratuit",
  ];

  return (
    <section className="border-y py-5" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="fade">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium" style={{ color: "#6A8F6D" }}>
                <span style={{ color: "#E4B118" }}>✦</span>
                {item}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
