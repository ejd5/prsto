"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Building2, Euro, Cpu, Users, Globe } from "lucide-react";

const C = {
  forest: "#103826",
  gold: "#E4B118",
  ivory: "#FAF6EF",
  text: "#0B1F18",
  muted: "rgba(11,31,24,0.55)",
  cardBg: "rgba(16,56,38,0.04)",
  border: "rgba(16,56,38,0.08)",
};

const h1Font = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: "-0.03em" };
const h2Font = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, letterSpacing: "-0.02em" };
const bodyFont = { fontFamily: "'Geist', 'Inter', sans-serif" };

const statStyle = {
  container: { background: C.forest, borderRadius: 16, padding: "24px 28px", color: "white" },
  value: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 32, letterSpacing: "-0.03em", color: C.gold, lineHeight: 1.1 },
  label: { fontFamily: "'Geist', 'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 },
};

const sections = [
  {
    id: "tendances",
    icon: <TrendingUp size={20} />,
    title: "Tendances du recrutement cadre en France",
    subtitle: "Édition 2026",
    summary: "Analyse des dynamiques du marché de l'emploi des cadres dirigeants en France.",
    stats: [
      { value: "84 000", label: "Recrutements cadres prévus en 2026" },
      { value: "+7%", label: "Progression vs 2025" },
      { value: "52%", label: "Des postes pourvus via marché caché" },
    ],
    content: [
      "Le marché du recrutement des cadres dirigeants en France connaît une transformation structurelle sans précédent. Après une année 2025 marquée par la prudence budgétaire et la baisse des mandats de recrutement au second semestre, 2026 s'annonce comme une année de reconfiguration. Les directions générales et les comités exécutifs font face à des impératifs de transformation qui accélèrent le renouvellement des équipes dirigeantes.",
      "Trois facteurs clés alimentent cette dynamique : la pression concurrentielle exercée par les secteurs en hypercroissance (IA, transition énergétique, santé), le départ massif des baby-boomers aux postes de direction, et l'émergence de nouveaux métiers de direction directement liés aux technologies émergentes — Chief AI Officer, Head of Transformation Durable, VP Climate Strategy.",
      "L'APEC anticipe 84 000 recrutements de cadres dirigeants en 2026, soit une progression de 7% par rapport à 2025. Mais ce chiffre masque une réalité duale : les secteurs traditionnels (banque, assurance, immobilier) réduisent leurs effectifs dirigeants de 3 à 5%, tandis que les secteurs technologiques, conseil et énergie augmentent leurs recrutements de 15 à 25%. La question n'est plus de savoir si votre secteur recrute, mais si votre profil correspond aux nouveaux besoins.",
    ],
  },
  {
    id: "secteurs",
    icon: <Building2 size={20} />,
    title: "Secteurs qui recrutent le plus de dirigeants",
    summary: "Les 6 secteurs qui concentrent 70% des mandats de recrutement executive en 2026.",
    content: [
      "La répartition sectorielle des recrutements de cadres dirigeants s'est profondément recomposée sous l'effet des priorités stratégiques des entreprises. Le conseil et les services aux entreprises restent le premier recruteur de profils dirigeants, avec 18% des mandats, tirés par la demande en expertise transformation digitale, stratégie et performance opérationnelle. Les cabinets de conseil recrutent non seulement pour leurs propres rangs, mais aussi comme prescripteurs auprès de leurs clients.",
      "La tech et le digital représentent désormais 15% des recrutements executives, contre 8% en 2020. Directeurs des systèmes d'information, Chief Digital Officers, VP Engineering et Chief Product Officers sont les profils les plus recherchés. La particularité de ce secteur : 40% des postes sont pourvus par des candidats venant d'autres secteurs, ce qui en fait la porte d'entrée la plus ouverte pour un dirigeant en reconversion.",
      "L'énergie et l'environnement grimpent à 13% des mandats, portés par les impératifs de décarbonation et de conformité ESG. Les directeurs développement durable, les responsables de la transition énergétique et les directeurs RSE sont devenus des incontournables des Comex. Les profils hybrides — capacité à combiner enjeux techniques, financiers et réglementaires — sont particulièrement valorisés avec des rémunérations en hausse de 12% sur un an.",
    ],
    secteurData: [
      { secteur: "Conseil & Services", part: "18%", variation: "+6%", color: C.gold },
      { secteur: "Tech & Digital", part: "15%", variation: "+15%", color: C.gold },
      { secteur: "Énergie & Environnement", part: "13%", variation: "+22%", color: C.gold },
      { secteur: "Santé & Pharma", part: "11%", variation: "+9%", color: C.gold },
      { secteur: "Banque & Assurance", part: "9%", variation: "-3%", color: "rgba(228,177,24,0.6)" },
      { secteur: "Industrie", part: "8%", variation: "+4%", color: C.gold },
    ],
  },
  {
    id: "remunerations",
    icon: <Euro size={20} />,
    title: "Études de rémunérations par fonction et secteur",
    summary: "Benchmarks 2026 des packages de rémunération des cadres dirigeants en France.",
    content: [
      "La rémunération des cadres dirigeants a connu une hausse moyenne de 5,2% en 2025, portée par l'inflation et la guerre des talents sur les profils les plus stratégiques. Mais cette moyenne cache des disparités considérables : les directeurs généraux du CAC 40 ont vu leur rémunération fixe progresser de 8%, tandis que les directeurs financiers de PME ont subi une hausse de seulement 2,5%.",
      "Le package de rémunération d'un cadre dirigeant ne se limite plus au fixe et au variable annuel. La part des rémunérations différées — stock-options, actions gratuites, bonus pluriannuels, retraites supplémentaires — représente désormais 35 à 50% de la rémunération totale pour les postes Comex. Un dirigeant qui néglige ces composantes laisse 30 à 50% de son potentiel de rémunération sur la table.",
      "Les benchmarks PRSTO intègrent 14 composantes de rémunération, de l'indemnité de non-concurrence aux conventions de prestations de services en passant par les assurances perte d'emploi. Cette granularité permet à nos utilisateurs de négocier en connaissance de cause et d'identifier les leviers d'optimisation que les chasseurs de têtes ne mentionnent pas spontanément.",
    ],
  },
  {
    id: "ia-impact",
    icon: <Cpu size={20} />,
    title: "Impact de l'IA sur les postes de direction",
    summary: "Comment l'intelligence artificielle redéfinit les fonctions dirigeantes.",
    content: [
      "L'intelligence artificielle n'est pas une menace pour les cadres dirigeants — elle est une redéfinition des attendus. Les postes de direction qui intégraient une composante analytique importante (directeur marketing, directeur financier, directeur des opérations) voient leur périmètre évoluer : l'IA automatisant la production de reporting, les dirigeants sont jugés sur leur capacité à poser les bonnes questions plutôt qu'à fournir les bonnes réponses.",
      "L'émergence du poste de Chief AI Officer illustre cette transformation. Présent dans 15% des Comex du CAC 40 en 2025, il devrait atteindre 40% en 2027. Mais au-delà de ce nouveau poste, c'est l'ensemble des fonctions dirigeantes qui doit intégrer une compétence IA : un DAF qui ne maîtrise pas les outils de forecasting prédictif, un DRH qui n'utilise pas l'IA pour le sourcing, un Directeur Commercial qui ignore les plateformes de sales intelligence — ces profils perdent 20 à 30% de leur valeur de marché.",
      "Les cabinets de chasse confirment que 60% des mandats 2026 mentionnent explicitement une compétence IA dans la description de poste, contre 25% en 2024. Cette exigence ne signifie pas que les dirigeants doivent devenir des ingénieurs, mais qu'ils doivent démontrer leur capacité à : définir une stratégie IA, manager des équipes techniques, évaluer des solutions, et anticiper les risques éthiques et réglementaires liés à ces technologies.",
    ],
  },
  {
    id: "seniors",
    icon: <Users size={20} />,
    title: "Marché de l'emploi des cadres seniors",
    summary: "Opportunités et stratégies pour les cadres dirigeants de 50 ans et plus.",
    content: [
      "Le marché de l'emploi des cadres dirigeants de plus de 50 ans est paradoxal : d'un côté, les entreprises expriment un besoin croissant d'expérience, de maturité et de sagesse pour affronter des environnements complexes ; de l'autre, les processus de recrutement continuent de discriminer inconsciemment les profils seniors, notamment via des exigences de 'futur potentiel' qui avantagent les candidats plus jeunes.",
      "La réalité est que l'âge moyen des dirigeants du CAC 40 est de 56 ans, et que la plupart des grands groupes confient leurs postes les plus stratégiques à des cadres de 50 à 60 ans. Le problème n'est donc pas l'âge en soi, mais le gap entre l'expérience du candidat et la perception du marché. Un dirigeant de 55 ans qui n'a pas actualisé son executive brief depuis 10 ans, qui ne maîtrise pas les codes des entretiens modernes, et qui n'a pas de présence digitale semblera 'dépassé' — non à cause de son âge, mais à cause de son positionnement.",
      "Les secteurs les plus ouverts aux cadres seniors en 2026 sont l'industrie, l'énergie, la santé et le conseil en stratégie. Le management de transition est également une voie royale : les cabinets de transition recherchent activement des profils de 55 à 65 ans, valorisant précisément l'expérience que les recrutements traditionnels pénalisent. PRSTO accompagne les cadres seniors dans le repositionnement de leur marque executive et l'activation des canaux les plus adaptés à leur profil.",
    ],
  },
  {
    id: "mobilite",
    icon: <Globe size={20} />,
    title: "Mobilité internationale pour dirigeants",
    summary: "Stratégies d'expatriation et opportunités cross-border pour cadres dirigeants.",
    content: [
      "La mobilité internationale des cadres dirigeants français connaît un regain d'intérêt. Les destinations historiques (Londres, Bruxelles, Genève, Luxembourg) restent attractives mais voient émerger une concurrence de hubs plus dynamiques : Dubaï, Singapour, Miami, Lisbonne et Berlin. Les critères de choix ne sont plus uniquement fiscaux — qualité de vie, accès aux marchés porteurs, écosystème sectoriel et qualité de l'éducation sont devenus déterminants.",
      "Le régime des impatriés français (loi de finances 2024) exonère 50% des revenus d'activité pendant 5 ans pour les dirigeants qui rejoignent la France depuis l'étranger, rendant Paris plus attractif pour les cadres français établis à l'international qui souhaitent rentrer. Dans l'autre sens, l'expatriation en Suisse, aux Émirats ou à Singapour reste fiscalement avantageuse mais implique une due diligence rigoureuse sur les conventions fiscales, les cotisations sociales et les contraintes réglementaires locales.",
      "Pour un cadre dirigeant qui envisage une mobilité internationale, la préparation est la clé. PRSTO fournit une matrice comparative complète : simulation fiscale (impôt sur le revenu, ISF, plus-values), analyse du marché de l'emploi local par secteur, cartographie des chasseurs de têtes internationaux, et évaluation du coût de la vie ajusté au pouvoir d'achat. Nos utilisateurs qui activent une mobilité internationale réduisent leur temps de recherche de 40% en moyenne grâce à une approche ciblée et documentée.",
    ],
  },
];

export default function MarchePage() {
  return (
    <div style={{ background: C.ivory, minHeight: "100vh", ...bodyFont, color: C.text }}>
      {/* Header */}
      <div style={{ background: C.forest }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/prsto/ressources"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.gold}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"}
            >
              <ArrowLeft size={14} /> Ressources
            </Link>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>PRSTO</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.gold }}>
            <TrendingUp size={20} style={{ color: C.text }} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: C.muted }}>
            Analyse & Tendances
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl mb-5 leading-tight" style={h1Font}>
          Marché & Tendances<br />
          <span style={{ color: C.forest }}>recrutement cadre dirigeant</span>
        </h1>
        <p className="text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: C.muted, ...bodyFont }}>
          Rémunérations, secteurs porteurs, impact de l&apos;IA, mobilité internationale — toutes les données
          nécessaires pour prendre des décisions éclairées sur votre trajectoire de carrière.
        </p>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-10">
        {sections.map((section, idx) => (
          <article
            key={section.id}
            id={section.id}
            className="rounded-3xl border overflow-hidden"
            style={{ background: "white", borderColor: C.border }}
          >
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(228,177,24,0.15)" }}
                >
                  <span style={{ color: C.gold }}>{section.icon}</span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.muted }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl mb-3 leading-tight" style={h2Font}>
                {section.title}
              </h2>

              {section.subtitle && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-4" style={{ background: "rgba(228,177,24,0.12)", color: C.gold }}>
                  {section.subtitle}
                </span>
              )}

              <p className="text-sm md:text-base mb-6 font-medium" style={{ color: "rgba(16,56,38,0.7)" }}>
                {section.summary}
              </p>

              {/* Stats row (section 1) */}
              {section.stats && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {section.stats.map((s, i) => (
                    <div key={i} style={statStyle.container}>
                      <div style={statStyle.value}>{s.value}</div>
                      <div style={statStyle.label}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Secteurs data table (section 2) */}
              {section.secteurData && (
                <div className="rounded-2xl border overflow-hidden mb-8" style={{ borderColor: C.border, background: C.ivory }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", ...bodyFont }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] px-5 py-3" style={{ color: C.muted }}>
                          Secteur
                        </th>
                        <th className="text-right text-[11px] font-semibold uppercase tracking-[0.1em] px-5 py-3" style={{ color: C.muted }}>
                          Part de marché
                        </th>
                        <th className="text-right text-[11px] font-semibold uppercase tracking-[0.1em] px-5 py-3" style={{ color: C.muted }}>
                          Variation 2025→2026
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.secteurData.map((s, i) => (
                        <tr key={i} style={{ borderBottom: i < section.secteurData.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <td className="px-5 py-3.5 text-sm font-medium" style={{ color: C.text }}>{s.secteur}</td>
                          <td className="px-5 py-3.5 text-sm font-bold text-right" style={{ ...h2Font, color: C.forest }}>{s.part}</td>
                          <td className="px-5 py-3.5 text-sm text-right" style={{ color: s.variation.startsWith("+") ? "#2E7D32" : "#C62828" }}>
                            {s.variation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Content paragraphs */}
              <div className="space-y-5">
                {section.content.map((paragraph, pi) => (
                  <p
                    key={pi}
                    className="text-[15px] md:text-base leading-[1.8]"
                    style={{ color: pi === 0 ? C.text : C.muted, ...bodyFont }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl border p-8 md:p-10"
          style={{ background: C.forest, borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-xl md:text-2xl mb-6 text-white" style={h2Font}>
            Anticipez les tendances du marché
          </h2>
          <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", ...bodyFont }}>
            PRSTO analyse en temps réel le marché de l&apos;emploi cadre dirigeant et vous alerte
            sur les opportunités correspondant à votre profil, vos aspirations salariales et votre mobilité.
          </p>
          <Link
            href="/prsto"
            className="inline-flex items-center gap-3 px-7 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: C.gold, color: C.text }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#D09E10";
              el.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = C.gold;
              el.style.transform = "translateY(0)";
            }}
          >
            Découvrir PRSTO →
          </Link>
        </div>
      </div>
    </div>
  );
}
