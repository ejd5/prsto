import Link from "next/link";
import Image from "next/image";
import { Building2, Crown, Users, Shield, TrendingUp, Check, ArrowRight, Palette, Globe, BarChart3, CreditCard, Sparkles, Star, Quote } from "lucide-react";
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
    color: "#E4B118",
  },
  {
    icon: Crown,
    title: "Business schools",
    description: "HEC, INSEAD, ESSEC, EDHEC, ESCP — career centers pour MBA Executive",
    useCase: "Offrez PRSTO à vos alumni en transition. Career center white-label avec analytics.",
    color: "#F2C94C",
  },
  {
    icon: Users,
    title: "Coaches carrière executive",
    description: "Coaches indépendants certifiés ICF, EMCC, qui accompagnent des C-levels",
    useCase: "Plateforme SaaS pour vos clients. 70% commission sur les souscriptions générées.",
    color: "#6A8F6D",
  },
  {
    icon: Shield,
    title: "Cabinets d'outplacement",
    description: "LHH, Page Executive, Michael Page Transition, Altedia",
    useCase: "Scalez l'accompagnement des executives en transition. Tracking et reporting inclus.",
    color: "#1F4A34",
  },
  {
    icon: TrendingUp,
    title: "VC / PE portfolio support",
    description: "Fonds PE/VC qui accompagnent leurs portfolio CEOs en difficulté ou en transition",
    useCase: "Outil discret pour les changements de CEO. Confidentialité absolue.",
    color: "#E4B118",
  },
  {
    icon: Globe,
    title: "Associations executives",
    description: "FrenchTech, INSEAD Alumni, HEC Alumni, France Digit",
    useCase: "Bénéfice membre premium. Augmentez la valeur perçue de votre adhésion.",
    color: "#F2C94C",
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

const TESTIMONIALS = [
  {
    quote: "PRSTO Enterprise nous a permis de standardiser le formatage des CV de nos 40 candidats C-level en transition. Le white-label est total — nos clients ne voient que notre marque.",
    author: "Directrice de Cabinet",
    org: "Cabinet executive Paris",
    initials: "MC",
  },
  {
    quote: "Nos MBA participants ont accès à 13 outils executive-grade. C'est devenu un argument différenciant dans nos admissions. Le ROI est immédiat.",
    author: "Director Career Services",
    org: "Top-3 Business School FR",
    initials: "JD",
  },
  {
    quote: "En tant que coach indépendante, PRSTO Enterprise me donne une plateforme premium pour mes 12 clients C-level. La commission 70% finance mon développement.",
    author: "Coach Career Executive",
    org: "ICF Certified — Paris",
    initials: "SL",
  },
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--prsto-ivory)" }}>
      {/* ═══ HERO — Dark forest with gold accents ═══ */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 50%, #0B1F18 100%)" }}
      >
        {/* Aurora effects */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[-20%] left-[10%] w-[520px] h-[520px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(228,177,24,0.15), transparent 65%)", filter: "blur(40px)" }}
          />
          <div
            className="absolute bottom-[-15%] right-[5%] w-[460px] h-[460px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(106,143,109,0.12), transparent 65%)", filter: "blur(40px)" }}
          />
        </div>

        <div className="max-w-5xl mx-auto relative text-center" style={{ zIndex: 2 }}>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/branding/logo-prsto.png"
              alt="PRSTO"
              width={180}
              height={54}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
              priority
            />
          </div>

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(228,177,24,0.1)",
              border: "1px solid rgba(228,177,24,0.3)",
            }}
          >
            <Crown size={14} style={{ color: "#E4B118" }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#F2C94C" }}>
              Enterprise · White-label · 70% commission
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-4xl md:text-6xl mb-6 leading-tight"
            style={{ fontFamily: "Playfair Display, serif", color: "#FAF6EF" }}
          >
            Proposez PRSTO
            <br />
            <span
              className="bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent"
              style={{ textShadow: "0 0 30px rgba(228,177,24,0.3)" }}
            >
              en marque blanche
            </span>
            <br />
            à vos candidats executives.
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg mb-4 max-w-2xl mx-auto" style={{ color: "rgba(250,246,239,0.8)" }}>
            Pour cabinets de recrutement, business schools, coaches, outplacement.
          </p>
          <p className="text-sm mb-10 max-w-2xl mx-auto" style={{ color: "rgba(250,246,239,0.5)" }}>
            499€/mois · 20 sièges inclus · 14 jours d'essai gratuit · Mieux que Rezi Enterprise (99$/200 seats) car executive-grade + multi-langue.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login?returnUrl=/enterprise"
              className="px-8 py-3.5 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E" }}
            >
              <Sparkles size={16} />
              Démarrer l'essai gratuit (14 jours)
            </Link>
            <Link
              href="#pricing"
              className="px-8 py-3.5 rounded-full text-sm font-semibold inline-flex items-center gap-2"
              style={{
                background: "transparent",
                color: "#FAF6EF",
                border: "1px solid rgba(250,246,239,0.3)",
              }}
            >
              Voir les tarifs <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ STAT BAND ═══ */}
      <section className="py-10 px-4" style={{ background: "var(--prsto-white)", borderBottom: "1px solid var(--prsto-border)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "13", label: "Outils executive-grade" },
            { value: "35", label: "Points ATS (vs 23 Rezi)" },
            { value: "70%", label: "Commission pour vous" },
            { value: "FR/EN/ES", label: "Multi-langue natif" },
          ].map((stat, i) => (
            <div key={i}>
              <div
                className="font-serif text-3xl md:text-4xl mb-1"
                style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)" }}
            >
              <Crown size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                Pourquoi PRSTO vs Rezi Enterprise
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
              L'alternative executive-grade
            </h2>
            <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
              Rezi cible tous chercheurs d'emploi. PRSTO cible les cadres dirigeants. La différence se voit dans chaque dimension.
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: "var(--prsto-white)", border: "1px solid var(--prsto-border)" }}>
            <div className="grid grid-cols-3 text-sm">
              {/* Header */}
              <div className="p-6" style={{ background: "var(--prsto-ivory)" }}>
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--texte-tertiaire)" }}>
                  Critère
                </span>
              </div>
              <div className="p-6 text-center" style={{ background: "var(--prsto-ivory)" }}>
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "var(--texte-tertiaire)" }}>
                  Rezi Enterprise
                </span>
              </div>
              <div className="p-6 text-center" style={{ background: "rgba(228,177,24,0.05)" }}>
                <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                  ✦ PRSTO Enterprise
                </span>
              </div>

              {[
                ["Prix", "$99/200 seats", "499€/20 sièges"],
                ["Cible", "Tous chercheurs d'emploi", "Cadres dirigeants C-level"],
                ["Langues", "EN only", "FR / EN / ES nativement"],
                ["IA mémoire", "Non", "RAG 1024-dim (second brain)"],
                ["Mock interview", "Text only", "Visio (TTS + webcam)"],
                ["Conseiller IA", "Non", "Oui (6-blocs structurés)"],
                ["LTV user", "$87 (3 mois)", "1 200€ (12 mois exec)"],
                ["Commission", "70%", "70% (sur tickets 5x)"],
              ].map(([critere, rezi, prsto], i) => (
                <div key={i} className="contents">
                  <div className="p-5 border-t font-medium" style={{ borderColor: "var(--prsto-border)", color: "var(--texte)" }}>
                    {critere}
                  </div>
                  <div className="p-5 border-t text-center" style={{ borderColor: "var(--prsto-border)", color: "var(--texte-secondaire)" }}>
                    {rezi}
                  </div>
                  <div
                    className="p-5 border-t text-center font-semibold"
                    style={{ borderColor: "var(--prsto-border)", color: "var(--prsto-forest)", background: "rgba(228,177,24,0.02)" }}
                  >
                    {prsto}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="py-16 px-4" style={{ background: "var(--prsto-white)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)" }}
            >
              <Building2 size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                6 cas d'usage
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
              Pour qui ?
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
              6 types d'organisations bénéficient de PRSTO Enterprise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: "var(--prsto-ivory)", border: "1px solid var(--prsto-border)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${uc.color}15` }}
                  >
                    <Icon size={24} style={{ color: uc.color }} />
                  </div>
                  <h3 className="font-serif text-lg mb-2" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
                    {uc.title}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "var(--texte-tertiaire)" }}>
                    {uc.description}
                  </p>
                  <div className="pt-3 border-t" style={{ borderColor: "var(--prsto-border)" }}>
                    <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
                      {uc.useCase}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)" }}
            >
              <Sparkles size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                6 features différenciantes
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
              Ce que vous obtenez
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
              Au-delà du white-label Rezi, PRSTO Enterprise apporte 6 différences executive-grade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl"
                  style={{ background: "var(--prsto-white)", border: "1px solid var(--prsto-border)" }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(228,177,24,0.1)" }}
                    >
                      <Icon size={18} style={{ color: "#E4B118" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1.5" style={{ color: "var(--texte)" }}>
                        {f.title}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 px-4" style={{ background: "var(--prsto-white)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)" }}
            >
              <Star size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                Témoignages
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
              Ils utilisent PRSTO Enterprise
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl flex flex-col"
                style={{ background: "var(--prsto-ivory)", border: "1px solid var(--prsto-border)" }}
              >
                <Quote size={24} className="mb-3" style={{ color: "#E4B118" }} />
                <p className="text-sm italic mb-5 flex-1" style={{ color: "var(--texte)" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--prsto-border)" }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "var(--prsto-forest)", color: "#FAF6EF" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--texte)" }}>
                      {t.author}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                      {t.org}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ORG TYPES ═══ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
              Types d'organisations supportées
            </h2>
            <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
              Choisissez votre profil à l'inscription
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ORG_TYPES.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: "var(--prsto-white)", border: "1px solid var(--prsto-border)" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#E4B118" }}
                >
                  <Check size={12} style={{ color: "#082E1E" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--texte)" }}>
                    {t.label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                    {t.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-16 px-4" style={{ background: "var(--prsto-white)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(228,177,24,0.1)" }}
            >
              <CreditCard size={12} style={{ color: "#E4B118" }} />
              <span className="text-xs font-mono uppercase tracking-wide" style={{ color: "#A38010" }}>
                Tarifs · 14 jours d'essai gratuit
              </span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-3" style={{ fontFamily: "Playfair Display, serif", color: "var(--prsto-forest)" }}>
              3 plans · sans engagement
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
              Choisissez selon votre taille. Upgrades/downgrades à tout moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {ORG_PLANS.map((plan) => {
              const isPopular = plan.id === "growth";
              return (
                <div
                  key={plan.id}
                  className="rounded-3xl p-7 flex flex-col relative"
                  style={{
                    background: isPopular ? "linear-gradient(135deg, #082E1E 0%, #103826 100%)" : "var(--prsto-ivory)",
                    color: isPopular ? "#FAF6EF" : "var(--texte)",
                    border: isPopular ? "none" : "1px solid var(--prsto-border)",
                    transform: isPopular ? "scale(1.05)" : "none",
                    boxShadow: isPopular ? "0 20px 60px rgba(8,46,30,0.3)" : "none",
                  }}
                >
                  {isPopular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wide"
                      style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E" }}
                    >
                      ★ Populaire
                    </div>
                  )}

                  <h3 className="font-serif text-2xl mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                    {plan.label}
                  </h3>

                  <div className="mb-1">
                    {plan.price === 0 ? (
                      <span className="font-serif text-3xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>
                        Sur devis
                      </span>
                    ) : (
                      <>
                        <span className="font-serif text-4xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>
                          {plan.price}€
                        </span>
                        <span className="text-sm opacity-70">/mois HT</span>
                      </>
                    )}
                  </div>

                  <div className="text-xs mb-6 opacity-80">
                    {plan.seats === 999999 ? "Sièges illimités" : `${plan.seats} sièges inclus`}
                  </div>

                  <ul className="space-y-3 mb-7 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="text-xs flex items-start gap-2">
                        <Check
                          size={14}
                          style={{ marginTop: 2, flexShrink: 0, color: isPopular ? "#E4B118" : "#10B981" }}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/login?returnUrl=/enterprise&plan=${plan.id}`}
                    className="block text-center py-3 rounded-full text-sm font-semibold transition-transform hover:scale-105"
                    style={{
                      background: isPopular ? "linear-gradient(135deg, #E4B118, #F2C94C)" : "var(--prsto-forest)",
                      color: isPopular ? "#082E1E" : "#FAF6EF",
                    }}
                  >
                    {plan.price === 0 ? "Contactez-nous" : "Démarrer"}
                    <ArrowRight size={14} className="inline ml-1" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA — Dark forest ═══ */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 50%, #0B1F18 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(228,177,24,0.15), transparent 65%)", filter: "blur(60px)" }}
          />
        </div>

        <div className="max-w-3xl mx-auto text-center relative" style={{ zIndex: 2 }}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/branding/logo-prsto.png"
              alt="PRSTO"
              width={160}
              height={48}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          </div>

          <h2
            className="font-serif text-3xl md:text-5xl mb-5"
            style={{ fontFamily: "Playfair Display, serif", color: "#FAF6EF" }}
          >
            Prêt à proposer PRSTO
            <br />
            <span
              className="bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent"
            >
              à vos candidats ?
            </span>
          </h2>

          <p className="text-sm mb-8 max-w-xl mx-auto" style={{ color: "rgba(250,246,239,0.7)" }}>
            Configuration en 5 minutes. White-label immédiat. 14 jours d'essai gratuit sans carte bancaire.
          </p>

          <Link
            href="/login?returnUrl=/enterprise"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-sm font-semibold transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E" }}
          >
            <Sparkles size={16} />
            Démarrer mon essai gratuit
            <ArrowRight size={14} />
          </Link>

          <p className="text-xs mt-6" style={{ color: "rgba(250,246,239,0.4)" }}>
            Sans carte bancaire · Configuration en 5 min · Annulable à tout moment
          </p>
        </div>
      </section>
    </div>
  );
}
