import Link from "next/link";
import Image from "next/image";
import { Building2, Crown, Users, Shield, TrendingUp, Check, ArrowRight, Palette, Globe, BarChart3, CreditCard, Sparkles, Star, Quote, Lock, FileText, CheckCircle2 } from "lucide-react";
import { ORG_TYPES, ORG_PLANS } from "@/lib/enterprise";

export const metadata = {
  title: "PRSTO Enterprise — Plateforme de gouvernance en marque blanche pour recruteurs et cabinets",
  description: "Désintermédiez votre franchise et offrez à vos candidats executives un portail de recherche premium à votre image. Marque blanche complète, simulateur d'entretien et dossiers d'aide à la décision.",
};

const USE_CASES = [
  {
    icon: Building2,
    title: "Chasseurs de têtes indépendants",
    description: "Professionnels libérés des contraintes d'une franchise ou d'une enseigne centralisée.",
    useCase: "Développez votre propre actif de marque. Offrez un service d'onboarding et de préparation de candidats digne des plus grands cabinets mondiaux sous votre propre logo.",
    color: "#E4B118",
  },
  {
    icon: Crown,
    title: "Cabinets de recrutement de niche",
    description: "Boutiques d'Executive Search spécialisées sur des fonctions clés ou des secteurs de rupture.",
    useCase: "Automatisez la standardisation qualitative des dossiers candidats. Évaluez leur compatibilité ATS avant la présentation finale aux comités de sélection.",
    color: "#F2C94C",
  },
  {
    icon: Users,
    title: "Coaches et Cabinets d'Outplacement",
    description: "Experts accompagnant les transitions professionnelles de cadres supérieurs et dirigeants.",
    useCase: "Mettez à disposition de vos clients un copilote de carrière intelligent et suivez leurs progrès en temps réel via votre tableau de bord d'administration dédié.",
    color: "#6A8F6D",
  },
];

const COMPARISONS = [
  {
    feature: "Personnalisation complète (Marque Blanche)",
    standard: "Partielle (Simple ajout de logo sur fond générique)",
    prsto: "Totale (Nom de domaine propre, couleurs personnalisées, emails de marque)"
  },
  {
    feature: "Profondeur d'analyse ATS",
    standard: "Superficielle (23 critères de validation)",
    prsto: "Executive-grade (35 points de validation sémantique et de structure Comex)"
  },
  {
    feature: "Simulateur d'entretien d'embauche",
    standard: "Simulations textuelles basiques type chatbot",
    prsto: "Visio interactive (Synthèse vocale avancée et retour d'analyse vidéo)"
  },
  {
    feature: "Génération de rapports de gouvernance",
    standard: "Non disponible",
    prsto: "Dossier d'entretien complet pour le Board généré en 5 minutes"
  },
  {
    feature: "Support multi-langue natif",
    standard: "Anglais uniquement",
    prsto: "Français, Anglais, Espagnol intégrés nativement pour le recrutement global"
  },
  {
    feature: "Modèle économique & Revenus",
    standard: "Simple facturation d'usage",
    prsto: "Commission d'apporteur d'affaires de 70% sur le reste du catalogue"
  }
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen" style={{ background: "#FAF6EF" }}>
      
      {/* ═══ HERO SECTION ═══ */}
      <section
        className="relative overflow-hidden py-24 px-6 text-center"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 50%, #0B1F18 100%)" }}
      >
        {/* Aurora decorations */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[-10%] left-[15%] w-[450px] h-[450px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(228,177,24,0.12), transparent 65%)", filter: "blur(50px)" }}
          />
          <div
            className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(106,143,109,0.1), transparent 65%)", filter: "blur(50px)" }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8" style={{
            borderColor: "rgba(228,177,24,0.3)",
            background: "rgba(228,177,24,0.08)",
          }}>
            <Crown size={12} style={{ color: "#E4B118" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2C94C]">
              Solution Marque Blanche · Pour Cabinets & Recruteurs Libres
            </span>
          </div>

          <h1
            className="font-serif text-3xl md:text-5xl lg:text-6xl mb-6 leading-tight"
            style={{ fontFamily: "var(--font-plus-jakarta-sans, sans-serif)", color: "#FAF6EF", fontWeight: 800 }}
          >
            Libérez votre cabinet des contraintes.
            <br />
            <span className="bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent">
              Votre propre portail candidat
            </span>
            <br />
            en marque blanche complète.
          </h1>

          <p className="text-sm md:text-base mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(250,246,239,0.8)" }}>
            Franchises bridées par des outils imposés, indépendants en quête de crédibilité technologique : reprenez le contrôle de votre marque. Proposez à vos candidats C-level un espace premium d&apos;onboarding et de préparation de CV sans royalties.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login?returnUrl=/enterprise"
              className="px-8 py-3.5 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E", textDecoration: "none" }}
            >
              <Sparkles size={14} />
              Démarrer l&apos;essai gratuit (14 jours)
            </Link>
            <Link
              href="#comparatif"
              className="px-8 py-3.5 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all hover:bg-white/10"
              style={{
                background: "transparent",
                color: "#FAF6EF",
                border: "1px solid rgba(250,246,239,0.3)",
                textDecoration: "none"
              }}
            >
              Comparer les solutions <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEMS & VALUE PROPOSITION ═══ */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#103826]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">
                Le constat du marché
              </span>
            </div>
            <h2 className="text-3xl font-extrabold mb-6 leading-snug" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Briser le carcan des franchises et des logiciels imposés
            </h2>
            <div className="space-y-5 text-xs leading-relaxed" style={{ color: "#50625A" }}>
              <p>
                De nombreux cabinets affiliés ou recruteurs sous franchise se retrouvent captifs de plateformes logicielles centralisées. Ces outils, souvent rigides et obsolètes, prélèvent des royalties importantes sur chaque placement tout en bridant votre créativité commerciale.
              </p>
              <p>
                <strong>PRSTO Enterprise</strong> a été pensé pour redonner le pouvoir aux consultants de niche et aux structures indépendantes. Nous vous fournissons la technologie, l&apos;IA de scoring sémantique et les modules d&apos;entraînement vidéo les plus avancés du marché, entièrement sous votre propre nom et vos couleurs.
              </p>
              <p className="font-semibold text-[#103826]">
                Développez la valeur de votre marque propre, augmentez vos taux de closing de mandats et fidélisez vos candidats exécutifs avec une expérience 5 étoiles.
              </p>
            </div>
          </div>

          {/* PLACEHOLDER VISUAL: Dashboard Mockup */}
          <div className="p-6 rounded-3xl border shadow-lg relative overflow-hidden" style={{
            background: "#FFFFFF",
            borderColor: "rgba(16,56,38,0.08)"
          }}>
            <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-[10px] font-mono text-[#50625A]">dashboard.votre-cabinet.com</span>
            </div>

            {/* Visual content representing the portal builder */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: "rgba(16,56,38,0.02)", borderColor: "rgba(16,56,38,0.05)" }}>
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-[#E4B118]" />
                  <div>
                    <div className="text-[11px] font-bold text-[#103826]">Personnalisation du portail</div>
                    <div className="text-[9px] text-[#50625A]">Couleurs : Vert Forêt (#103826) & Or (#E4B118)</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-[#103826] text-white px-2.5 py-1 rounded-full">Actif</span>
              </div>

              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: "rgba(16,56,38,0.02)", borderColor: "rgba(16,56,38,0.05)" }}>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#6A8F6D]" />
                  <div>
                    <div className="text-[11px] font-bold text-[#103826]">Domaine personnalisé</div>
                    <div className="text-[9px] text-[#50625A]">SSL actif · DNS configurés</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-[#103826] text-white px-2.5 py-1 rounded-full">Validé</span>
              </div>

              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: "rgba(16,56,38,0.02)", borderColor: "rgba(16,56,38,0.05)" }}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#103826]" />
                  <div>
                    <div className="text-[11px] font-bold text-[#103826]">Accords de confidentialité candidates</div>
                    <div className="text-[9px] text-[#50625A]">Chiffrement de bout en bout actif</div>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-[#103826] text-white px-2.5 py-1 rounded-full">Sécurisé</span>
              </div>
            </div>
            <div className="text-center mt-6 text-[10px] text-[#50625A] italic">
              Aperçu de la console d&apos;administration en marque blanche
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON SECTION ═══ */}
      <section id="comparatif" className="py-20 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-4" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Tableau comparatif : L&apos;alternative de gouvernance
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "#50625A" }}>
              Ne comparez plus des outils grand public de génération de CV. Choisissez une suite d&apos;aide à la décision taillée pour la recherche exécutive.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: "rgba(16,56,38,0.04)" }}>
                    <th className="p-4 font-bold text-[#103826] w-1/3">Fonctionnalité / Critère</th>
                    <th className="p-4 font-bold text-[#50625A] w-1/3">Solutions Standard du Marché</th>
                    <th className="p-4 font-bold text-[#103826] w-1/3" style={{ background: "rgba(228,177,24,0.08)" }}>
                      ✦ PRSTO Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISONS.map((row, idx) => (
                    <tr key={idx} className="border-b" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
                      <td className="p-4 font-semibold text-[#103826]">{row.feature}</td>
                      <td className="p-4 text-[#50625A]">{row.standard}</td>
                      <td className="p-4 font-medium text-[#103826]" style={{ background: "rgba(228,177,24,0.03)" }}>
                        {row.prsto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE SHOWCASES WITH PLACEHOLDER VISUALS ═══ */}
      <section className="py-20 px-6 max-w-6xl mx-auto space-y-24">
        
        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4B118] bg-[#103826]/5 px-3 py-1 rounded-full">
              Pilier 01
            </span>
            <h3 className="text-2xl font-bold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Scoring ATS & Validation sémantique 35 points
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Assurez-vous que les CV de vos candidats passent avec succès les barrières des outils de tri robotisés de vos clients. Notre analyse évalue la mise en page linéaire, l&apos;intégration des mots-clés sémantiques et la conformité de structure executive.
            </p>
            <ul className="space-y-2 text-xs" style={{ color: "#50625A" }}>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118]" />
                <span>Compatibilité des tables de parsing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118]" />
                <span>Évaluation de la densité de mots-clés sectoriels</span>
              </li>
            </ul>
          </div>

          {/* Placeholder Visual 1 */}
          <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{
            background: "#FFFFFF",
            borderColor: "rgba(16,56,38,0.08)",
            height: "260px"
          }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
              <span className="text-xs font-bold text-[#103826]">ATS Audit Report</span>
              <span className="text-[10px] font-bold text-[#E4B118] bg-[#E4B118]/10 px-2 py-0.5 rounded">Score: 92/100</span>
            </div>
            
            {/* Styled graphical chart simulation */}
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span>Densité de mots-clés (Leadership & Finance)</span>
                  <span className="font-bold">95%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: "95%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span>Structure de fichier et polices universelles</span>
                  <span className="font-bold">88%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: "88%" }}></div>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-center text-[#50625A] italic">
              [Visualisation de l&apos;audit de parsing de CV]
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="space-y-4 md:col-start-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4B118] bg-[#103826]/5 px-3 py-1 rounded-full">
              Pilier 02
            </span>
            <h3 className="text-2xl font-bold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Générateur de Brief d&apos;entretien pour le Board
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Préparez vos clients recruteurs en leur envoyant une fiche de synthèse executive pour chaque candidat présenté. Notre IA extrait les points forts du profil, l&apos;adéquation culturelle, les axes de négociation de package et les questions cibles à poser en entretien.
            </p>
            <ul className="space-y-2 text-xs" style={{ color: "#50625A" }}>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118]" />
                <span>Rapports structurés épurés au format PDF de marque</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118]" />
                <span>Calibrage automatique des attentes salariales</span>
              </li>
            </ul>
          </div>

          {/* Placeholder Visual 2 */}
          <div className="p-6 rounded-2xl border flex flex-col justify-between md:col-start-1 md:row-start-1" style={{
            background: "#FFFFFF",
            borderColor: "rgba(16,56,38,0.08)",
            height: "260px"
          }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
              <span className="text-xs font-bold text-[#103826]">Boardroom Briefing Studio</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Généré</span>
            </div>

            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
              <div className="h-3 w-full bg-gray-100 rounded"></div>
              <div className="h-3 w-5/6 bg-gray-100 rounded"></div>
              <div className="h-3 w-4/5 bg-gray-100 rounded"></div>
              <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
            </div>

            <div className="text-[9px] text-center text-[#50625A] italic">
              [Visualisation du brief d&apos;entretien généré]
            </div>
          </div>
        </div>

      </section>

      {/* ═══ USE CASES CARDS ═══ */}
      <section className="py-20 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Conçu pour accompagner votre développement
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {USE_CASES.map((uc, idx) => {
              const Icon = uc.icon;
              return (
                <div key={idx} className="p-8 rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between" style={{
                  background: "#FAF6EF",
                  borderColor: "rgba(16,56,38,0.08)"
                }}>
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: "#103826" }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold" style={{ color: "#103826" }}>{uc.title}</h4>
                    <p className="text-[11px] font-medium" style={{ color: "#50625A" }}>{uc.description}</p>
                    <p className="text-xs leading-relaxed border-t border-dashed pt-4 mt-2" style={{ color: "#50625A", borderColor: "rgba(16,56,38,0.15)" }}>
                      {uc.useCase}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═══ */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">
              Des tarifs adaptés à votre échelle
            </span>
          </div>
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
            Abonnement mensuel sans engagement
          </h2>
          <p className="text-sm text-[#50625A] max-w-xl mx-auto">
            Sélectionnez la formule adaptée à votre volume de candidats. Vos 14 premiers jours d&apos;essai vous sont offerts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {ORG_PLANS.map((plan) => {
            const isPopular = plan.id === "growth";
            return (
              <div key={plan.id} className="p-8 rounded-3xl border flex flex-col justify-between relative transition-all duration-300" style={{
                background: isPopular ? "linear-gradient(135deg, #082E1E 0%, #103826 100%)" : "#FFFFFF",
                color: isPopular ? "#FAF6EF" : "#103826",
                borderColor: isPopular ? "transparent" : "rgba(16,56,38,0.08)",
                boxShadow: isPopular ? "0 20px 40px rgba(16,56,38,0.2)" : "none",
                transform: isPopular ? "scale(1.03)" : "none"
              }}>
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider bg-[#E4B118] text-[#103826] px-3 py-1 rounded-full">
                    Conseillé
                  </span>
                )}

                <div>
                  <h4 className="text-xl font-bold mb-2">{plan.label}</h4>
                  
                  <div className="flex items-baseline gap-1 mb-1">
                    {plan.price === 0 ? (
                      <span className="text-2xl font-bold">Sur devis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold">{plan.price}€</span>
                        <span className="text-xs opacity-80">/mois HT</span>
                      </>
                    )}
                  </div>

                  <p className="text-[10px] opacity-75 mb-6">
                    {plan.seats === 999999 ? "Accès candidats illimités" : `${plan.seats} sièges d'accès inclus`}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2.5">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isPopular ? "#E4B118" : "#6A8F6D" }} />
                        <span className="opacity-90">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/login?returnUrl=/enterprise&plan=${plan.id}`}
                  className="block text-center py-3 rounded-full text-xs font-bold transition-all hover:scale-105"
                  style={{
                    background: isPopular ? "linear-gradient(135deg, #E4B118, #F2C94C)" : "#103826",
                    color: isPopular ? "#082E1E" : "#FAF6EF",
                    textDecoration: "none"
                  }}
                >
                  {plan.price === 0 ? "Contacter notre équipe" : "Démarrer l'essai"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ TESTIMONIALS SECTION ═══ */}
      <section className="py-20 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              La satisfaction de nos partenaires
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl border flex flex-col justify-between" style={{
                background: "#FAF6EF",
                borderColor: "rgba(16,56,38,0.08)"
              }}>
                <div>
                  <Quote className="w-8 h-8 text-[#E4B118] mb-4" />
                  <p className="text-xs italic leading-relaxed text-[#50625A] mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t pt-4" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
                  <div className="w-8 h-8 rounded-full bg-[#103826] text-white flex items-center justify-center text-xs font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#103826]">{t.author}</div>
                    <div className="text-[10px] text-[#50625A]">{t.org}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CALL TO ACTION ═══ */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 50%, #0B1F18 100%)" }}
      >
        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <h2 className="font-serif text-3xl md:text-5xl" style={{ fontFamily: "var(--font-plus-jakarta-sans, sans-serif)", color: "#FAF6EF", fontWeight: 800 }}>
            Offrez l&apos;excellence technologique
            <br />
            <span className="bg-gradient-to-r from-[#E4B118] via-[#F2C94C] to-[#E4B118] bg-clip-text text-transparent">
              sous votre propre marque.
            </span>
          </h2>
          <p className="text-xs max-w-xl mx-auto" style={{ color: "rgba(250,246,239,0.8)" }}>
            Déploiement immédiat. Intégrez vos DNS et téléversez votre logo en moins de 5 minutes. Essai gratuit de 14 jours sans carte requise.
          </p>
          <Link
            href="/login?returnUrl=/enterprise"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-xs font-bold transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E", textDecoration: "none" }}
          >
            <Sparkles size={14} />
            Créer mon portail en marque blanche
            <ArrowRight size={14} />
          </Link>
          <p className="text-[10px]" style={{ color: "rgba(250,246,239,0.4)" }}>
            Aucune coordonnée bancaire requise pour l&apos;essai · Support client personnalisé
          </p>
        </div>
      </section>
    </div>
  );
}

const TESTIMONIALS = [
  {
    quote: "Grâce au portail en marque blanche de PRSTO, nous offrons à nos candidats dirigeants un service de formatage de CV de premier ordre qui passe tous les filtres ATS. Nos clients apprécient cette rigueur sémantique.",
    author: "Associée Gérante",
    org: "Cabinet Executive Search de Niche",
    initials: "ML",
  },
  {
    quote: "Nos alumni MBA apprécient énormément le simulateur d'entretien. L'intégration de notre logo et de notre charte graphique a été effectuée en moins de 10 minutes par nos équipes.",
    author: "Responsable Service Carrières",
    org: "Grande École de Commerce — Paris",
    initials: "FH",
  },
  {
    quote: "Je cherchais un outil d'accompagnement haut de gamme pour mes clients C-level sans subir le coût des franchises nationales. PRSTO est la réponse parfaite pour consolider mon indépendance commerciale.",
    author: "Consultant Coach Carrière",
    org: "Accompagnement Dirigeants & Gouvernance",
    initials: "PP",
  },
];
