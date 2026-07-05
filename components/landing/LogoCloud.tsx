"use client";

const ATS_LOGOS = [
  "Greenhouse", "Lever", "Workday", "Ashby", "SmartRecruiters",
  "Taleo", "iCIMS", "Jobvite", "Recruitee", "Teamtailor",
  "Homerun", "WelcomeKit", "APEC", "France Travail", "LinkedIn Jobs",
  "Indeed", "WelcomeToTheJungle",
];

export default function LogoCloud() {
  const loop = [...ATS_LOGOS, ...ATS_LOGOS];

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] mb-8" style={{ color: "#6A8F6D" }}>
          Compatible avec les principales plateformes de recrutement
        </p>
      </div>

      <div className="relative" style={{
        maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
      }}>
        <div className="lp-marquee-track py-1" style={{ animationDuration: "40s" }}>
          {loop.map((name, i) => (
            <span key={`${name}-${i}`}
              className="inline-flex items-center px-6 h-9 text-sm font-semibold tracking-tight mx-0.5 rounded-lg"
              style={{ color: "#6A8F6D", background: "rgba(16,56,38,0.04)", border: "1px solid rgba(16,56,38,0.06)" }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
