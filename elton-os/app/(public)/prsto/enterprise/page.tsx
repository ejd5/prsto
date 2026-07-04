import Link from "next/link";
import { Building2, Crown, Users, Shield, TrendingUp, Check, ArrowRight, Palette, Globe, BarChart3, CreditCard } from "lucide-react";
import { ORG_TYPES, ORG_PLANS } from "@/lib/enterprise";

export const metadata = {
  title: "PRSTO Enterprise — White-label pour cabinets, écoles et coaches executives",
  description: "Proposez PRSTO en white-label à vos candidats executives. 499€/mois, 20 sièges inclus, 70% commission. Pour cabinets de recrutement, business schools, coaches, outplacement.",
};

const USE_CASES = [
  {
    icon: Building2,
    title: "Cabinets de recrutement executive",
    description: "Spencer Stuart, Egon Zehnder, Heidrick & Struggles, Russell Reynolds, boutiques spécialisées",
    useCase: "Standardisez le formatage des CV de vos candidats. Marque blanche totale avec votre logo.",
    color: "#1E40AF",
  },
  {
    icon: Crown,
    title: "Business schools",
    description: "HEC, INSEAD, ESSEC, EDHEC, ESCP — career centers pour MBA Executive",
    useCase: "Offrez PRSTO à vos alumni en transition. Career center white-label avec analytics.",
    color: "#7C3AED",
  },
  {
    icon: Users,
    title: "Coaches carrière executive",
    description: "Coaches indépendants certifiés ICF, EMCC, qui accompagnent des C-levels",
    useCase: "Plateforme SaaS pour vos clients. 70% commission sur les souscriptions générées.",
    color: "#DC2626",
  },
  {
    icon: Shield,
    title: "Cabinets d'outplacement",
    description: "LHH, Page Executive, Michael Page Transition, Altedia",
    useCase: "Scalez l'accompagnement des executives en transition. Tracking et reporting inclus.",
    color: "#059669",
  },
  {
    icon: TrendingUp,
    title: "VC / PE portfolio support",
    description: "Fonds PE/VC qui accompagnent leurs portfolio CEOs en difficulté ou en transition",
    useCase: "Outil discret pour les changements de CEO. Confidentialité absolue.",
    color: "#D97706",
  },
  {
    icon: Globe,
    title: "Associations executives",
    description: "FrenchTech, INSEAD Alumni, HEC Alumni, France Digit",
    useCase: "Bénéfice membre premium. Augmentez la valeur perçue de votre adhésion.",
    color: "#0891B2",
  },
];

const FEATURES = [
  {
    icon: Palette,
    title: "White-label complet",
    description: "Logo, couleurs, subdomain personnalisé. Vos candidats voient votre marque, pas PRSTO.",
  },
  {
    icon: Globe,
    title: "Multi-langue (FR/EN/ES)",
    description: "Rezi est EN-only. PRSTO supporte 3 langues nativement — crucial pour cabinets internationaux.",
  },
  {
    icon: BarChart3,
    title: "Dashboard admin",
    description: "Gérez vos membres, suivez l'usage, analytics avancés. Invitations par email en 1 clic.",
  },
  {
    icon: CreditCard,
    title: "Commission 70%",
    description: "Sur tous les paiements générés par vos candidats. Reversement automatique via Stripe Connect.",
  },
  {
    icon: Shield,
    title: "Conformité RGPD",
    description: "Hébergement EU, DPA signé, données chiffrées. Conforme aux exigences cabinets/schools.",
  },
  {
    icon: Crown,
    title: "13 outils executive-grade",
    description: "ATS Checker 35 points, AI Resume Agent, Cover Letter 3 tons, Mock Interview visio, etc.",
  },
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--prsto-ivory)" }}>
      {/* Hero */}
      <section className="pt-16 pb-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
            <Crown size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">Enterprise · White-label · 70% commission</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-5" style={{ color: "var(--prsto-forest)" }}>
            PRSTO Enterprise
          </h1>
          <p className="text-lg mb-4 max-w-2xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            Proposez PRSTO en white-label à vos candidats executives.
          </p>
          <p className="text-sm mb-8 max-w-2xl mx-auto" style={{ color: "var(--texte-tertiaire)" }}>
            Pour cabinets de recrutement, business schools, coaches, outplacement. 499€/mois, 20 sièges inclus. Mieux que Rezi Enterprise (99$/200 seats) car executive-grade + multi-langue.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/login?returnUrl=/enterprise"
              className="px-6 py-3 rounded-lg text-sm font-semibold"
              style={{ background: "var(--prsto-forest)", color: "#FFF" }}
            >
              Démarrer mon essai gratuit (14 jours)
            </Link>
            <Link
              href="#pricing"
              className="px-6 py-3 rounded-lg text-sm font-semibold"
              style={{ background: "#FFF", color: "var(--prsto-forest)", border: "1px solid var(--prsto-forest)" }}
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Rezi comparison */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <div className="grid grid-cols-3 text-sm">
              <div className="p-6 font-mono uppercase tracking-wide text-xs" style={{ background: "#F9FAFB", color: "var(--texte-tertiaire)" }}>
                Critère
              </div>
              <div className="p-6 text-center font-mono uppercase tracking-wide text-xs" style={{ background: "#F9FAFB", color: "var(--texte-tertiaire)" }}>
                Rezi Enterprise
              </div>
              <div className="p-6 text-center font-mono uppercase tracking-wide text-xs" style={{ background: "rgba(245,158,11,0.05)", color: "#F59E0B" }}>
                PRSTO Enterprise
              </div>

              {[
                ["Prix", "$99/200 seats (~0.50€/user)", "499€/20 seats (~25€/user)"],
                ["Cible", "Tous chercheurs d'emploi", "Cadres dirigeants C-level"],
                ["Langues", "EN only", "FR / EN / ES nativement"],
                ["IA mémoire", "Non", "RAG 1024-dim (second brain)"],
                ["Mock interview", "Text only", "Visio (TTS + webcam)"],
                ["Conseiller IA", "Non", "Oui (6-blocs structurés)"],
                ["LTV user", "$87 (3 mois)", "1 200€ (12 mois exec)"],
                ["Commission", "70%", "70% (sur tickets 5x plus élevés)"],
              ].map(([critere, rezi, prsto], i) => (
                <div key={i} className="contents">
                  <div className="p-4 border-t" style={{ borderColor: "#F3F4F6", color: "var(--texte)" }}>{critere}</div>
                  <div className="p-4 border-t text-center" style={{ borderColor: "#F3F4F6", color: "var(--texte-secondaire)" }}>{rezi}</div>
                  <div className="p-4 border-t text-center font-semibold" style={{ borderColor: "#F3F4F6", color: "var(--prsto-forest)", background: "rgba(245,158,11,0.03)" }}>{prsto}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-2" style={{ color: "var(--prsto-forest)" }}>
            Pour qui ?
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "var(--texte-tertiaire)" }}>
            6 types d'organisations bénéficient de PRSTO Enterprise
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <div key={i} className="p-6 rounded-2xl" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${uc.color}15` }}>
                    <Icon size={22} style={{ color: uc.color }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: "var(--texte)" }}>{uc.title}</h3>
                  <p className="text-xs mb-3" style={{ color: "var(--texte-tertiaire)" }}>{uc.description}</p>
                  <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>{uc.useCase}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4" style={{ background: "#FFF" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-2" style={{ color: "var(--prsto-forest)" }}>
            Ce que vous obtenez
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "var(--texte-tertiaire)" }}>
            6 features différenciantes vs Rezi Enterprise
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-5 rounded-xl" style={{ background: "var(--prsto-ivory)", border: "1px solid #E5E7EB" }}>
                  <Icon size={20} className="mb-3" style={{ color: "var(--prsto-forest)" }} />
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--texte)" }}>{f.title}</h3>
                  <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Org types */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-2" style={{ color: "var(--prsto-forest)" }}>
            Types d'organisations supportées
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "var(--texte-tertiaire)" }}>
            Choisissez votre profil à l'inscription
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ORG_TYPES.map((t) => (
              <div key={t.id} className="p-4 rounded-xl flex items-start gap-3" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
                <Check size={16} style={{ color: "#10B981", marginTop: 2 }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--texte)" }}>{t.label}</div>
                  <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{t.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 px-4" style={{ background: "#FFF" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-2" style={{ color: "var(--prsto-forest)" }}>
            Tarifs
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "var(--texte-tertiaire)" }}>
            3 plans · 14 jours d'essai gratuit · Sans engagement
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ORG_PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: plan.id === "growth" ? "var(--prsto-forest)" : "var(--prsto-ivory)",
                  color: plan.id === "growth" ? "#FFF" : "var(--texte)",
                  border: plan.id === "growth" ? "none" : "1px solid #E5E7EB",
                  transform: plan.id === "growth" ? "scale(1.05)" : "none",
                }}
              >
                {plan.id === "growth" && (
                  <div className="inline-block text-[10px] font-mono px-2 py-1 rounded mb-3 self-start" style={{ background: "#F59E0B", color: "#FFF" }}>
                    POPULAIRE
                  </div>
                )}
                <h3 className="font-serif text-2xl mb-2">{plan.label}</h3>
                <div className="mb-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold">Sur devis</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{plan.price}€</span>
                      <span className="text-sm opacity-70">/mois HT</span>
                    </>
                  )}
                </div>
                <div className="text-xs mb-5 opacity-80">
                  {plan.seats === 999999 ? "Sièges illimités" : `${plan.seats} sièges inclus`}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-xs flex items-start gap-2">
                      <Check size={12} style={{ marginTop: 3, flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/login?returnUrl=/enterprise&plan=${plan.id}`}
                  className="block text-center py-2.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: plan.id === "growth" ? "#FFF" : "var(--prsto-forest)",
                    color: plan.id === "growth" ? "var(--prsto-forest)" : "#FFF",
                  }}
                >
                  {plan.price === 0 ? "Contactez-nous" : "Démarrer"}
                  <ArrowRight size={14} className="inline ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl mb-4" style={{ color: "var(--prsto-forest)" }}>
            Prêt à proposer PRSTO à vos candidats ?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--texte-secondaire)" }}>
            Configuration en 5 minutes. White-label immédiat. 14 jours d'essai gratuit sans carte bancaire.
          </p>
          <Link
            href="/login?returnUrl=/enterprise"
            className="inline-block px-8 py-3 rounded-lg text-sm font-semibold"
            style={{ background: "var(--prsto-forest)", color: "#FFF" }}
          >
            Démarrer mon essai gratuit
          </Link>
        </div>
      </section>
    </div>
  );
}
