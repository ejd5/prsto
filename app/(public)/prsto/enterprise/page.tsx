import Link from "next/link";
import Image from "next/image";
import { Building2, Crown, Users, Shield, TrendingUp, Check, ArrowRight, Palette, Globe, BarChart3, CreditCard, Sparkles, Star, Quote, Lock, FileText, CheckCircle2, ChevronRight, HelpCircle, HeartHandshake } from "lucide-react";
import { ORG_TYPES, ORG_PLANS } from "@/lib/enterprise";

export const metadata = {
  title: "PRSTO Enterprise — Reprenez votre liberté de marque et désintermédiez votre franchise",
  description: "Pourquoi céder votre valeur ? Proposez à vos candidats dirigeants un portail de recherche d'exception sous votre propre marque blanche. Sans redevances, sans limites.",
};

const COMPARISONS = [
  {
    feature: "Propriété de la Marque & Personnalisation",
    standard: "Partielle (Simple logo en en-tête sur une interface générique aux couleurs du fournisseur)",
    prsto: "Totale (Marque blanche absolue, nom de domaine dédié, personnalisation HSL de la charte, emails de marque)"
  },
  {
    feature: "Profondeur de validation ATS",
    standard: "Basique (Vérification de format simple et comptage de mots-clés rudimentaire)",
    prsto: "Executive-grade (35 points de contrôle : structure de lecture, parsing sémantique, alignement des titres de gouvernance)"
  },
  {
    feature: "Préparation d'entretien interactive",
    standard: "Générateur de questions figées par écrit ou chatbots standards",
    prsto: "STAR Simulator (Simulations vocales et vidéo interactives calibrées pour les Boards et Comités de nominations)"
  },
  {
    feature: "Génération de rapports pour le Board",
    standard: "Non disponible (Nécessite une rédaction manuelle fastidieuse par le consultant)",
    prsto: "Boardroom Briefing Studio (Rapports synthétiques automatisés d'aide à la décision candidat générés en 5 minutes)"
  },
  {
    feature: "Modèle économique & Redevances",
    standard: "Contrats de franchise rigides avec prélèvement de royalties sur chaque placement de candidat",
    prsto: "Abonnement fixe transparent sans engagement, avec commission d'apport d'affaires de 70% sur le catalogue"
  },
  {
    feature: "Support multi-langue natif",
    standard: "Principalement limité à l'anglais",
    prsto: "Français, Anglais et Espagnol gérés nativement pour les cabinets à dimension globale"
  },
  {
    feature: "Garantie et sécurité des données",
    standard: "Données hébergées et exploitées de manière centralisée par la franchise",
    prsto: "Souveraineté totale des données, hébergement européen sécurisé, conformité stricte RGPD avec DPA"
  }
];

const BUSINESS_CASES = [
  {
    title: "Cas Client 01 : Cabinet de Chasse de Têtes (Niche Industrie)",
    context: "Cabinet indépendant de 3 associés auparavant affilié à un réseau national. Ils payaient 15% de royalties sur chaque honoraire de placement pour utiliser le CRM et le portail candidat du réseau.",
    solution: "Transition vers PRSTO Enterprise sous leur propre nom de domaine. Déploiement du portail d'évaluation ATS et de préparation d'entretien vidéo en marque blanche complète.",
    result: "Économie moyenne de 42 000 € de royalties par an. Hausse de 28% de satisfaction candidat sur l'accompagnement de gouvernance. Closing des mandats accéléré de 12 jours.",
    stats: "ROI : 42K€ économisés · Closing : -12 jours"
  },
  {
    title: "Cas Client 02 : Cabinet d'Outplacement (Transition C-Level)",
    context: "Structure d'accompagnement executive fournissant des sessions de coaching. Leurs clients dirigeants trouvaient les outils technologiques de suivi de recherche d'emploi infantilisants et obsolètes.",
    solution: "Mise à disposition de l'espace PRSTO premium personnalisé aux couleurs du cabinet. Suivi discret de la recherche via le tableau de bord administrateur.",
    result: "Taux de recommandation client (NPS) passé de 42 à 85. Temps moyen de retour à l'emploi réduit de 8 mois à 5,2 mois pour les profils Comex.",
    stats: "NPS : +43 pts · Retour à l'emploi : -2.8 mois"
  },
  {
    title: "Cas Client 03 : Coach Carrière Indépendant (Ex-DRH CAC 40)",
    context: "Coach solo accompagnant 15 dirigeants par an. Manquait de crédibilité technologique face aux grosses structures et passait trop de temps à corriger manuellement les CV et préparer les questions d'entretien.",
    solution: "Intégration du STAR Simulator et du générateur de CV dans son offre d'accompagnement haut de gamme sous sa marque personnelle.",
    result: "Augmentation du tarif d'accompagnement moyen de 35%. 70% de commission d'apport d'affaires sur les outils additionnels générant un revenu complémentaire mensuel récurrent.",
    stats: "Tarif moyen : +35% · Marges additionnelles : 70% commission"
  }
];

const FAQS = [
  {
    q: "Quelles sont les étapes pour configurer le portail sous notre nom de domaine ?",
    a: "C'est extrêmement simple. Lors de votre inscription, vous indiquez le sous-domaine souhaité (ex: portail.votre-cabinet.com). Nous vous fournissons deux clés DNS à intégrer chez votre hébergeur (OVH, GoDaddy, etc.). Une fois la propagation effectuée (généralement en moins de 10 minutes), votre portail est en ligne avec certificat SSL sécurisé gratuit. Vous n'avez plus qu'à téléverser votre logo et choisir votre couleur HSL principale."
  },
  {
    q: "Sommes-nous propriétaires des données de nos candidats ?",
    a: "Oui, à 100%. Contrairement aux franchises ou aux outils de recrutement centralisés qui captent votre base de candidats pour leur propre valeur, PRSTO agit comme un simple sous-traitant technique (RGPD). Vos données restent étanches, cryptées et vous appartiennent légalement. Nous signons un accord de traitement des données (DPA) dès l'activation de votre compte."
  },
  {
    q: "Comment fonctionne la commission d'apport d'affaires de 70% ?",
    a: "Si vos candidats ou clients choisissent de souscrire à des services additionnels sur mesure (comme notre générateur de CV premium ou des crédits d'analyse IA supplémentaires), vous touchez 70% du montant de la transaction. Les reversements sont calculés mensuellement et versés automatiquement sur votre compte bancaire via notre intégration Stripe Connect sécurisée."
  },
  {
    q: "Puis-je annuler mon abonnement ou changer de formule à tout moment ?",
    a: "Absolument. Nos abonnements sont sans engagement. Vous pouvez passer d'une formule à l'autre (par exemple, pour augmenter le nombre de sièges candidats lors d'une campagne importante) ou résilier votre abonnement en un clic depuis votre console d'administration. Il n'y a aucun frais caché ni préavis de départ."
  }
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen" style={{ background: "#FAF6EF", color: "#0B1F18" }}>
      
      {/* ═══ HERO SECTION ═══ */}
      <section
        className="relative overflow-hidden py-28 px-6 text-center"
        style={{ background: "linear-gradient(135deg, #082E1E 0%, #103826 50%, #0B1F18 100%)" }}
      >
        {/* Aurora background graphics */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(228,177,24,0.15), transparent 65%)", filter: "blur(60px)" }}
          />
          <div
            className="absolute bottom-[-10%] right-[10%] w-[450px] h-[450px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(106,143,109,0.12), transparent 65%)", filter: "blur(60px)" }}
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-8" style={{
            borderColor: "rgba(228,177,24,0.3)",
            background: "rgba(228,177,24,0.08)",
          }}>
            <Crown size={12} style={{ color: "#E4B118" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F2C94C]">
              Manifeste pour l&apos;indépendance des cabinets de recrutement
            </span>
          </div>

          <h1
            className="font-serif text-3xl md:text-5xl lg:text-6xl mb-8 leading-tight font-extrabold"
            style={{ fontFamily: "var(--font-plus-jakarta-sans, sans-serif)", color: "#FAF6EF" }}
          >
            Pourquoi les cabinets d&apos;Executive Search indépendants cèdent-ils leur valeur à des franchises ou des outils obsolètes ?
          </h1>

          <p className="text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(250,246,239,0.8)" }}>
            Ne soyez plus le faire-valoir d&apos;une enseigne centralisée. Construisez votre propre actif de marque. Offrez à vos candidats dirigeants une plateforme de validation et de préparation d&apos;exception, sous votre logo, sans redevances ni contraintes de franchise.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login?returnUrl=/enterprise"
              className="px-8 py-4 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #E4B118, #F2C94C)", color: "#082E1E", textDecoration: "none" }}
            >
              <Sparkles size={14} />
              Démarrer l&apos;essai gratuit (14 jours)
            </Link>
            <Link
              href="#manifeste"
              className="px-8 py-4 rounded-full text-xs font-bold inline-flex items-center gap-2 transition-all hover:bg-white/10"
              style={{
                background: "transparent",
                color: "#FAF6EF",
                border: "1px solid rgba(250,246,239,0.3)",
                textDecoration: "none"
              }}
            >
              Lire notre manifeste <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ MANIFESTE DE L'INDEPENDANCE (Tripled Content) ═══ */}
      <section id="manifeste" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">L&apos;alternative stratégique</span>
          </div>
          <h2 className="text-3xl font-extrabold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
            Le Manifeste de la Désintermédiation
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border bg-white space-y-4" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
            <div className="w-10 h-10 rounded-xl bg-[#103826]/5 flex items-center justify-center text-[#103826]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: "#103826" }}>La fin de la dépendance</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Les franchises de recrutement prélèvent des royalties importantes (parfois de 10% à 25% des honoraires) sous prétexte de vous fournir des outils techniques de suivi candidat obsolètes. En adoptant votre propre plateforme en marque blanche, vous coupez l&apos;intermédiaire et conservez 100% de la valeur de vos placements.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-white space-y-4" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
            <div className="w-10 h-10 rounded-xl bg-[#103826]/5 flex items-center justify-center text-[#103826]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: "#103826" }}>Valorisation de marque propre</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Un candidat placé sous l&apos;étiquette d&apos;un grand réseau renforce la marque de ce réseau, pas la vôtre. Avec PRSTO Enterprise, chaque interaction, chaque rapport de scoring, chaque simulation vidéo d&apos;entretien s&apos;effectue sous votre nom de domaine et votre logo, consolidant votre propre actif de marque.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-white space-y-4" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
            <div className="w-10 h-10 rounded-xl bg-[#103826]/5 flex items-center justify-center text-[#103826]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold" style={{ color: "#103826" }}>L&apos;expérience candidat executive</h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Les dirigeants C-level rejettent les formulaires de candidature robotisés et froids des outils standards. Ils attendent un accompagnement d&apos;autorité, discret et de haut niveau. PRSTO offre un espace feutré, sécurisé et calibré spécifiquement pour la gouvernance au sommet (Comex/Board).
            </p>
          </div>
        </div>
      </section>

      {/* ═══ COMPARATIVE GRID ═══ */}
      <section className="py-20 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-4" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Tableau comparatif : L&apos;alternative de gouvernance
            </h2>
            <p className="text-xs text-[#50625A] max-w-xl mx-auto">
              Ne comparez plus des outils grand public de génération de CV. Choisissez une suite d&apos;aide à la décision taillée pour la recherche exécutive.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ background: "rgba(16,56,38,0.04)" }}>
                    <th className="p-4 font-bold text-[#103826] w-1/3">Fonctionnalité / Critère</th>
                    <th className="p-4 font-bold text-[#50625A] w-1/3">Outils Grand Public Standards</th>
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
      <section className="py-24 px-6 max-w-5xl mx-auto space-y-28">
        
        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4B118] bg-[#103826]/5 px-3 py-1 rounded-full">
              Pilier Technique 01
            </span>
            <h3 className="text-2xl font-bold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Scoring ATS & Validation sémantique 35 points
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Assurez-vous que les CV de vos candidats passent avec succès les barrières des outils de tri robotisés de vos clients. Notre analyse évalue la mise en page linéaire, l&apos;intégration des mots-clés sémantiques et la conformité de structure executive.
            </p>
            <div className="space-y-2 text-xs" style={{ color: "#50625A" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118] flex-shrink-0" />
                <span>Détection des tableaux et éléments graphiques bloquants</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118] flex-shrink-0" />
                <span>Analyse comparative de densité sémantique par rapport à la fiche de poste</span>
              </div>
            </div>
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
              Pilier Technique 02
            </span>
            <h3 className="text-2xl font-bold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Générateur de Brief d&apos;entretien pour le Board
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Préparez vos clients recruteurs en leur envoyant une fiche de synthèse executive pour chaque candidat présenté. Notre IA extrait les points forts du profil, l&apos;adéquation culturelle, les axes de négociation de package et les questions cibles à poser en entretien.
            </p>
            <div className="space-y-2 text-xs" style={{ color: "#50625A" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118] flex-shrink-0" />
                <span>Rapports structurés épurés au format PDF de marque</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118] flex-shrink-0" />
                <span>Calibrage automatique des attentes salariales moyennes</span>
              </div>
            </div>
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

        {/* Feature 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4B118] bg-[#103826]/5 px-3 py-1 rounded-full">
              Pilier Technique 03
            </span>
            <h3 className="text-2xl font-bold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              STAR Simulator : Entraînement vidéo interactif
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "#50625A" }}>
              Permettez à vos candidats de s&apos;entraîner en conditions réelles d&apos;assessment. Notre IA simule les questions déstabilisantes du conseil d&apos;administration ou du comité de nominations en synthèse vocale et analyse la pertinence des réponses comportementales.
            </p>
            <div className="space-y-2 text-xs" style={{ color: "#50625A" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118] flex-shrink-0" />
                <span>Questions calibrées par profil d&apos;interlocuteur (Board, CEO, RH)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E4B118] flex-shrink-0" />
                <span>Rapport détaillé de posture émotionnelle et de débit verbal</span>
              </div>
            </div>
          </div>

          {/* Placeholder Visual 3 */}
          <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{
            background: "#FFFFFF",
            borderColor: "rgba(16,56,38,0.08)",
            height: "260px"
          }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(16,56,38,0.05)" }}>
              <span className="text-xs font-bold text-[#103826]">STAR Video Simulator</span>
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>REC</span>
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-[#103826] flex items-center justify-center">
                <Users className="w-8 h-8 text-[#E4B118]" />
              </div>
            </div>

            <div className="text-[9px] text-center text-[#50625A] italic">
              [Visualisation de l&apos;interface d&apos;enregistrement et d&apos;analyse vidéo]
            </div>
          </div>
        </div>

      </section>

      {/* ═══ BUSINESS CASES & ROI (Tripled Content) ═══ */}
      <section className="py-24 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">Preuves d&apos;efficacité</span>
            </div>
            <h2 className="text-3xl font-extrabold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Études de Cas & ROI Chiffré
            </h2>
            <p className="text-xs text-[#50625A] max-w-xl mx-auto mt-2">
              Comment nos partenaires libèrent leur croissance et maximisent leur valeur opérationnelle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {BUSINESS_CASES.map((bc, idx) => (
              <div key={idx} className="p-8 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{
                background: "#FAF6EF",
                borderColor: "rgba(16,56,38,0.08)"
              }}>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#103826]">{bc.title}</h4>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] leading-relaxed text-[#50625A]">
                      <strong>Contexte :</strong> {bc.context}
                    </p>
                    <p className="text-[10px] leading-relaxed text-[#50625A]">
                      <strong>Solution :</strong> {bc.solution}
                    </p>
                    <p className="text-[10px] leading-relaxed text-[#50625A]">
                      <strong>Résultat :</strong> {bc.result}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dashed" style={{ borderColor: "rgba(16,56,38,0.15)" }}>
                  <span className="text-[10px] font-bold text-[#E4B118]">
                    {bc.stats}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ INTERNATIONAL COMPARATIVE ANALYSIS ═══ */}
      <section className="py-24 px-6" style={{ background: "#FFFFFF", borderTop: "1px solid rgba(16,56,38,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
              <Globe className="w-4 h-4 text-[#E4B118]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">
                Analyse comparative internationale
              </span>
            </div>
            <h2 className="text-3xl font-extrabold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
              Comment se positionne notre offre face au marché mondial ?
            </h2>
            <p className="text-xs text-[#50625A] max-w-2xl mx-auto mt-2">
              Une évaluation comparative complexe des solutions américaines, européennes et françaises face aux exigences des recruteurs executives indépendants.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 items-stretch">
            
            {/* US Model */}
            <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ borderColor: "rgba(16,56,38,0.08)", background: "#FAF6EF" }}>
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#50625A]">Modèle US</span>
                <h4 className="text-base font-bold text-[#103826]">Sourcing & Volume</h4>
                <div className="text-[11px] leading-relaxed space-y-2 text-[#50625A]">
                  <p><strong>Philosophie :</strong> Outils de masse axés sur le volume et le traitement automatique des candidatures intermédiaires.</p>
                  <p><strong>Tarification :</strong> À l&apos;usage ou au crédit d&apos;analyse. Coût variable imprévisible.</p>
                  <p><strong>Limites :</strong> Uniquement en anglais. Pas de marque blanche réelle (nom du fournisseur visible partout). Aucun module d&apos;aide à la décision pour le Board.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-[10px] font-semibold text-red-700">
                Limité aux profils intermédiaires
              </div>
            </div>

            {/* EU Model */}
            <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ borderColor: "rgba(16,56,38,0.08)", background: "#FAF6EF" }}>
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#50625A]">Modèle Européen (Hors FR)</span>
                <h4 className="text-base font-bold text-[#103826]">Outplacement Lourd</h4>
                <div className="text-[11px] leading-relaxed space-y-2 text-[#50625A]">
                  <p><strong>Philosophie :</strong> Logiciels d&apos;outplacement traditionnels intégrés aux ERP des grands cabinets.</p>
                  <p><strong>Tarification :</strong> Frais de configuration initiaux élevés (setup de 5 000€ à 15 000€) et licences annuelles rigides.</p>
                  <p><strong>Limites :</strong> Interfaces austères et non personnalisables. Manque d&apos;agilité technique et absence d&apos;entraînements interactifs vocaux.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-[10px] font-semibold text-red-700">
                Setup complexe & Coûteux
              </div>
            </div>

            {/* FR Model */}
            <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ borderColor: "rgba(16,56,38,0.08)", background: "#FAF6EF" }}>
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#50625A]">Modèle Français</span>
                <h4 className="text-base font-bold text-[#103826]">Réseaux & Franchises</h4>
                <div className="text-[11px] leading-relaxed space-y-2 text-[#50625A]">
                  <p><strong>Philosophie :</strong> Outils mutualisés par des réseaux d&apos;affiliation nationaux.</p>
                  <p><strong>Tarification :</strong> Royalties proportionnelles prélevées sur chaque placement réussi (de 10% à 25%).</p>
                  <p><strong>Limites :</strong> Perte d&apos;indépendance commerciale. Vos données candidats appartiennent légalement à la tête de réseau.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-gray-300 text-[10px] font-semibold text-red-700">
                Dépendance & Redevances de CA
              </div>
            </div>

            {/* PRSTO */}
            <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ borderColor: "#E4B118", background: "linear-gradient(135deg, #082E1E 0%, #103826 100%)", color: "#FAF6EF" }}>
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#E4B118]">✦ Proposition PRSTO</span>
                <h4 className="text-base font-bold text-white">SaaS Executive Libre</h4>
                <div className="text-[11px] leading-relaxed space-y-2 opacity-90">
                  <p><strong>Philosophie :</strong> Autonomie totale pour cabinets indépendants et consultants libres.</p>
                  <p><strong>Tarification :</strong> Abonnement mensuel fixe transparent, sans engagement et sans commissions sur vos placements.</p>
                  <p><strong>Avantages :</strong> Marque blanche absolue, multi-langue natif (FR/EN/ES), simulations vidéo d&apos;entretien au format STAR et briefs Board automatisés.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-emerald-800 text-[10px] font-bold text-[#E4B118]">
                Liberté totale & 100% Souverain
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═══ */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">
              Des tarifs adaptés à votre échelle
            </span>
          </div>
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
            Abonnement mensuel sans engagement
          </h2>
          <p className="text-xs text-[#50625A] max-w-xl mx-auto">
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
                    {plan.seats === 999999 ? "Accès candidats illimités" : `${plan.seats} sièges d&apos;accès inclus`}
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

      {/* ═══ INTERACTIVE FAQ SECTION (Tripled Content) ═══ */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(16,56,38,0.06)" }}>
            <HelpCircle className="w-4 h-4 text-[#E4B118]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#103826]">Des réponses à vos questions</span>
          </div>
          <h2 className="text-3xl font-extrabold" style={{ color: "#103826", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <details key={idx} className="p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-sm" style={{
              borderColor: "rgba(16,56,38,0.08)",
              background: "#FFFFFF"
            }}>
              <summary className="text-sm font-bold text-[#103826] list-none flex items-center justify-between gap-4">
                <span>{faq.q}</span>
                <ChevronRight className="w-4 h-4 text-[#E4B118] transition-transform duration-200" />
              </summary>
              <p className="text-xs leading-relaxed text-[#50625A] mt-4 pl-1 border-l-2 border-[#E4B118]">
                {faq.a}
              </p>
            </details>
          ))}
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
