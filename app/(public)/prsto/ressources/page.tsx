import Link from "next/link";
import { BookOpen, Award, Compass, Key, HelpCircle, Briefcase, Zap, Shield, FileText, ChevronRight, Sparkles } from "lucide-react";

const CATEGORIES = [
  {
    href: "/prsto/ressources/cv-branding",
    title: "CV & Personal Branding",
    desc: "Optimisez votre CV de dirigeant, votre profil LinkedIn et votre marque personnelle pour attirer les cabinets d'Executive Search.",
    icon: <FileText className="w-5 h-5" />,
    count: "5 guides experts",
    tag: "Branding",
    color: "#E4B118"
  },
  {
    href: "/prsto/ressources/entretien",
    title: "Préparation aux entretiens",
    desc: "Déjouez les questions du Comex, appréhendez les assessment centers et maîtrisez votre storytelling de leader face au Board.",
    icon: <Compass className="w-5 h-5" />,
    count: "7 guides experts",
    tag: "Entretien",
    color: "#50625A"
  },
  {
    href: "/prsto/ressources/negociation",
    title: "Négociation & Package",
    desc: "Méthodes éprouvées, benchmarks de salaires, LTI et clauses de garantie pour négocier votre rémunération globale de dirigeant.",
    icon: <Zap className="w-5 h-5" />,
    count: "7 guides experts",
    tag: "Négociation",
    color: "#A38010"
  },
  {
    href: "/prsto/ressources/strategie",
    title: "Stratégie de recherche",
    desc: "Recherche confidentielle, cartographie des chasseurs de têtes et accès au marché caché des postes non publiés.",
    icon: <Key className="w-5 h-5" />,
    count: "7 guides experts",
    tag: "Stratégie",
    color: "#103826"
  },
  {
    href: "/prsto/ressources/transition",
    title: "Transition & Reconversion",
    desc: "Piloter son rebond professionnel, créer sa propre activité ou s'orienter vers le consulting de haut niveau.",
    icon: <Briefcase className="w-5 h-5" />,
    count: "7 guides experts",
    tag: "Transition",
    color: "#50625A"
  },
  {
    href: "/prsto/ressources/reseau",
    title: "Réseau & Chasseurs de têtes",
    desc: "Activer votre réseau d'affaires secret et travailler efficacement avec les associés des cabinets d'Executive Search.",
    icon: <Award className="w-5 h-5" />,
    count: "6 guides experts",
    tag: "Réseau",
    color: "#E4B118"
  },
  {
    href: "/prsto/ressources/marche",
    title: "Marché & Tendances",
    desc: "Études de rémunérations, secteurs porteurs, et impact de l'intelligence artificielle sur la gouvernance des comités exécutifs.",
    icon: <BookOpen className="w-5 h-5" />,
    count: "6 guides experts",
    tag: "Tendances",
    color: "#103826"
  },
  {
    href: "/prsto/ressources/prise-poste",
    title: "Prise de poste & 90 jours",
    desc: "Réussir votre onboarding exécutif, asseoir votre autorité naturelle et valider votre Comex dès les premiers mois.",
    icon: <Shield className="w-5 h-5" />,
    count: "5 guides experts",
    tag: "Onboarding",
    color: "#A38010"
  }
];

export default function RessourcesPage() {
  return (
    <div className="py-6">
      {/* Editorial Header */}
      <div className="mb-14 text-center md:text-left relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold mb-5" style={{
          borderColor: "rgba(228,177,24,0.3)", color: "#103826", background: "rgba(228,177,24,0.08)"
        }}>
          <Sparkles className="w-3.5 h-3.5 text-[#E4B118]" />
          <span>Bibliothèque Exécutive & Leadership</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ 
          color: "#103826", 
          fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
          lineHeight: 1.15
        }}>
          Ressources & Guides de Gouvernance
        </h1>
        
        <p className="text-base max-w-2xl leading-relaxed" style={{ color: "#50625A" }}>
          Analyses de fond, méthodologies de négociation et checklists de gouvernance rédigées par des experts de l&apos;Executive Search pour propulser votre carrière au sommet.
        </p>

        {/* Decorative divider line */}
        <div className="w-20 h-1 bg-[#E4B118] mt-8 rounded-full"></div>
      </div>

      {/* Editor's Featured Resource banner */}
      <div className="mb-12 rounded-3xl p-8 relative overflow-hidden border transition-all duration-300 hover:shadow-xl group" style={{
        borderColor: "rgba(16,56,38,0.1)",
        background: "linear-gradient(135deg, #103826 0%, #174d35 100%)",
        color: "#FAF6EF"
      }}>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12 translate-x-12">
          <BookOpen className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4B118] bg-white/10 px-2.5 py-1 rounded-full">
            À la une
          </span>
          <h2 className="text-2xl font-bold mt-4 mb-3" style={{ fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
            Le Guide Ultime de Négociation de Package
          </h2>
          <p className="text-xs text-white/80 leading-relaxed mb-6">
            Découvrez comment structurer votre rémunération globale : fixe, variable, LTI, actions de performance et clauses de garantie sociale des mandataires.
          </p>
          <Link href="/prsto/ressources/negociation" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#E4B118] text-[#103826] transition-all duration-300 hover:bg-white hover:scale-105 hover:shadow-md">
            <span>Explorer la rubrique</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {CATEGORIES.map((c) => (
          <Link key={c.href} href={c.href}
            className="group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
            style={{ 
              borderColor: "rgba(16,56,38,0.08)", 
              background: "#FFFFFF", 
              textDecoration: "none" 
            }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{
                  background: `rgba(16,56,38,0.05)`,
                  color: "#103826"
                }}>
                  {c.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{
                  background: "rgba(16,56,38,0.06)",
                  color: "#50625A"
                }}>
                  {c.tag}
                </span>
              </div>

              <h3 className="text-lg font-bold group-hover:text-[#E4B118] transition-colors mb-2" style={{ 
                color: "#103826",
                fontFamily: "var(--font-plus-jakarta-sans, sans-serif)"
              }}>
                {c.title}
              </h3>
              
              <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
                {c.desc}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-dashed mt-6 pt-4" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
              <span className="text-[10px] font-semibold text-[#103826]/70">
                {c.count}
              </span>
              <span className="text-xs font-bold text-[#E4B118] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Consulter</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
