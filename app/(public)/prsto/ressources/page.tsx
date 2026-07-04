import Link from "next/link";

const CATEGORIES = [
  {
    href: "/prsto/ressources/cv-branding", title: "CV & Personal Branding", desc: "Optimisez votre CV dirigeant, votre profil LinkedIn et votre marque personnelle pour attirer les bonnes opportunités.",
    icon: "📄", count: "5 articles",
  },
  {
    href: "/prsto/ressources/entretien", title: "Préparation aux entretiens", desc: "Questions COMEX, assessment centers, storytelling de leader — soyez prêt pour chaque entretien de direction.",
    icon: "🎯", count: "7 articles",
  },
  {
    href: "/prsto/ressources/negociation", title: "Négociation & Package", desc: "Méthodes, benchmarks et tactiques pour négocier votre rémunération globale de cadre dirigeant.",
    icon: "💰", count: "7 articles",
  },
  {
    href: "/prsto/ressources/strategie", title: "Stratégie de recherche", desc: "Recherche confidentielle, chasseurs de têtes, marché caché — les stratégies des dirigeants qui décrochent les meilleurs postes.",
    icon: "🎯", count: "7 articles",
  },
  {
    href: "/prsto/ressources/transition", title: "Transition & Reconversion", desc: "Rebondir après un départ, créer son activité, passer en consulting ou management de transition.",
    icon: "🔄", count: "7 articles",
  },
  {
    href: "/prsto/ressources/reseau", title: "Réseau & Chasseurs de têtes", desc: "Activer son réseau, travailler avec les cabinets, être visible sans être en recherche active.",
    icon: "🤝", count: "6 articles",
  },
  {
    href: "/prsto/ressources/marche", title: "Marché & Tendances", desc: "Études de rémunérations, secteurs qui recrutent, impact de l'IA sur les fonctions dirigeantes.",
    icon: "📊", count: "6 articles",
  },
  {
    href: "/prsto/ressources/prise-poste", title: "Prise de poste & 90 premiers jours", desc: "Réussir votre intégration, asseoir votre légitimité, manager dès le jour 1.",
    icon: "🚀", count: "5 articles",
  },
  {
    href: "/prsto/ressources/templates", title: "Templates & Outils", desc: "Modèles de CV dirigeant, lettres de motivation, checklists entretien, plans de recherche.",
    icon: "📋", count: "8 outils",
  },
];

export default function RessourcesPage() {
  return (
    <>
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold mb-4" style={{
          borderColor: "rgba(228,177,24,0.25)", color: "#A38010", background: "rgba(228,177,24,0.08)",
        }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#E4B118" }} />
          Bibliothèque de carrière
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#0B1F18", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          Ressources
        </h1>
        <p className="text-sm mt-2 max-w-xl" style={{ color: "#6A8F6D" }}>
          Guides, stratégies et templates conçus pour les cadres dirigeants en recherche d&apos;opportunités.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORIES.map((c) => (
          <Link key={c.href} href={c.href}
            className="group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ borderColor: "rgba(16,56,38,0.08)", background: "#FFFFFF", textDecoration: "none" }}>
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0 mt-0.5">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold group-hover:text-[#E4B118] transition-colors" style={{ color: "#0B1F18" }}>
                    {c.title}
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{
                    background: "rgba(16,56,38,0.06)", color: "#6A8F6D",
                  }}>{c.count}</span>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#6A8F6D" }}>{c.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
