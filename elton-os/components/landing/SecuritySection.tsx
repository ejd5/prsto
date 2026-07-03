import { Lock, Database, UserCheck, AlertTriangle } from "lucide-react";
import GlassIcon from "./GlassIcon";

const POINTS = [
  {
    icon: Lock,
    title: "Aucun envoi automatique",
    desc: "Pas d'email, pas de message LinkedIn, pas de candidature envoyée sans votre validation explicite.",
    color: "#E4B118",
  },
  {
    icon: Database,
    title: "Données en local (SQLite)",
    desc: "Vos données restent sur votre infrastructure. Pas de cloud tiers, pas de revente, pas de fuite.",
    color: "#6A8DFF",
  },
  {
    icon: UserCheck,
    title: "Validation humaine obligatoire",
    desc: "L'IA propose, vous disposez. Chaque action est revue et approuvée avant d'être exécutée.",
    color: "#36D978",
  },
];

export default function SecuritySection() {
  return (
    <section id="securite" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "#36D978" }}>
              Sécurité & Contrôle
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-[-0.02em] mb-4" style={{ color: "#F4F4F5" }}>
              Vous gardez le contrôle. Toujours.
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#8A8A92" }}>
              PRSTO est conçu pour les dirigeants qui veulent l&apos;efficacité
              de l&apos;IA sans en subir les risques. Pas de boîte noire,
              pas d&apos;automatisation aveugle, pas de dépendance cloud.
            </p>

            <div className="space-y-4">
              {POINTS.map((p) => (
                <div key={p.title} className="flex items-start gap-3">
                  <GlassIcon icon={p.icon} size={16} color={p.color} />
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "#F4F4F5" }}>{p.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#8A8A92" }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: "#E4B118" }} />
              <span className="text-xs font-semibold" style={{ color: "#F4F4F5" }}>Pourquoi c&apos;est important</span>
            </div>

            <div className="space-y-3">
              {[
                "Les outils d'auto-apply vous exposent au spam et au blacklistage",
                "Les données envoyées au cloud peuvent être réutilisées pour entraîner des modèles concurrents",
                "Sans validation humaine, une IA peut envoyer une candidature inadaptée et brûler une opportunité",
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl border text-xs"
                  style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}
                >
                  <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color: "#8A8A92" }}>0{i + 1}</span>
                  <span style={{ color: "#B8B8C0" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
