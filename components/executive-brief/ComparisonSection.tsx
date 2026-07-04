import Reveal from "@/components/landing/Reveal";

type Cell = { label: string; ok: boolean | "partial" };
type Row = { feature: string; diy: Cell; coach: Cell; brief: Cell };

const rows: Row[] = [
  {
    feature: "Analyse CV vs JD",
    diy: { label: "Superficielle", ok: false },
    coach: { label: "Approfondie", ok: true },
    brief: { label: "15 dimensions", ok: true },
  },
  {
    feature: "Company Intelligence",
    diy: { label: "Google 2-3h", ok: false },
    coach: { label: "Assistant dédié", ok: true },
    brief: { label: "Rapport complet", ok: true },
  },
  {
    feature: "Profilage intervieweur",
    diy: { label: "LinkedIn rapide", ok: false },
    coach: { label: "Recherche poussée", ok: true },
    brief: { label: "1-3 profils", ok: true },
  },
  {
    feature: "Questions STAR",
    diy: { label: "Génériques", ok: false },
    coach: { label: "Sur mesure", ok: true },
    brief: { label: "20 personnalisées", ok: true },
  },
  {
    feature: "Email remerciement",
    diy: { label: "À rédiger", ok: false },
    coach: { label: "Inclus", ok: true },
    brief: { label: "Personnalisé IA", ok: true },
  },
  {
    feature: "Plan 30-60-90",
    diy: { label: "Aucun", ok: false },
    coach: { label: "Co-construit", ok: true },
    brief: { label: "Personnalisé", ok: true },
  },
  {
    feature: "Kit négociation",
    diy: { label: "Aucun", ok: false },
    coach: { label: "Talk tracks", ok: true },
    brief: { label: "Prêt à l'emploi", ok: true },
  },
  {
    feature: "Templates email",
    diy: { label: "Aucun", ok: false },
    coach: { label: "Inclus", ok: true },
    brief: { label: "5 templates", ok: true },
  },
  {
    feature: "PDF livré",
    diy: { label: "Aucun", ok: false },
    coach: { label: "Pas de livrable", ok: false },
    brief: { label: "15-20 pages", ok: true },
  },
  {
    feature: "Délai",
    diy: { label: "1-2 semaines", ok: false },
    coach: { label: "5-10 jours", ok: false },
    brief: { label: "Immédiat", ok: true },
  },
  {
    feature: "Suivi humain",
    diy: { label: "Aucun", ok: false },
    coach: { label: "1 mois", ok: true },
    brief: { label: "Chat", ok: "partial" },
  },
  {
    feature: "Prix",
    diy: { label: "0€", ok: "partial" },
    coach: { label: "200-5 000€", ok: false },
    brief: { label: "29,90€", ok: true },
  },
];

function CellIcon({ ok }: { ok: boolean | "partial" }) {
  if (ok === true) return <span style={{ color: "#22c55e" }}>✓</span>;
  if (ok === "partial") return <span style={{ color: "#F2C94C" }}>~</span>;
  return <span style={{ color: "rgba(255,255,255,0.2)" }}>✕</span>;
}

const headers = [
  { label: "Critère", key: "feature" },
  { label: "Vous-même", key: "diy", price: "0€" },
  { label: "Cabinets internationaux", key: "coach", price: "200-5 000€" },
  { label: "Executive Brief", key: "brief", price: "29,90€" },
];

export default function ComparisonSection() {
  return (
    <section id="comparaison" className="py-20 md:py-28" style={{ background: "rgba(8,8,10,0.5)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] mb-4"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Comparaison transparente
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4 font-serif" style={{ fontFamily: "Playfair Display, serif" }}>
              Vous, un cabinet international,
              <br />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>ou l&apos;</span>
              <span className="lp-text-shine" style={{
                background: "linear-gradient(135deg, #E4B118, #F2C94C)",
                backgroundClip: "text", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Executive Brief
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}> ?</span>
            </h2>
            <p className="mx-auto max-w-lg text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              On ne vend pas du rêve. On compare honnêtement ce que chaque option apporte
              — et ce qu&apos;elle n&apos;apporte pas.
            </p>
          </div>
        </Reveal>

        <Reveal variant="up">
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {headers.map((h) => (
                    <th key={h.key} className="p-4 md:p-5 font-bold text-[13px]"
                      style={{ color: h.key === "brief" ? "#E4B118" : "rgba(255,255,255,0.5)" }}>
                      <div>{h.label}</div>
                      {"price" in h && h.price && (
                        <div className="text-[11px] font-normal mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                          {h.price}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isLast = i === rows.length - 1;
                  return (
                    <tr key={row.feature} className={isLast ? "" : "border-b"}
                      style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <td className="p-4 md:p-5 font-medium text-[13px]"
                        style={{ color: "rgba(255,255,255,0.65)" }}>
                        {row.feature}
                      </td>
                      {(["diy", "coach", "brief"] as const).map((key) => {
                        const cell = row[key];
                        const isBrief = key === "brief";
                        return (
                          <td key={key} className={`p-4 md:p-5 text-[13px] ${isBrief ? "font-medium" : ""}`}
                            style={{
                              color: isBrief && cell.ok === true ? "#E4B118" : cell.ok === true
                                ? "#22c55e" : cell.ok === "partial" ? "#F2C94C" : "rgba(255,255,255,0.3)",
                            }}>
                            <span className="flex items-center gap-2">
                              <CellIcon ok={cell.ok} />
                              {cell.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <p className="text-center text-[13px] mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
            ✓ = disponible &nbsp;·&nbsp; ~ = partiel &nbsp;·&nbsp; ✕ = non disponible
          </p>
        </Reveal>
      </div>
    </section>
  );
}
