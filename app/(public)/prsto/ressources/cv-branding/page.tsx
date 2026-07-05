'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

const colors = {
  forest: '#103826',
  gold: '#E4B118',
  ivory: '#FAF6EF',
  text: '#0B1F18',
  secondary: '#50625A',
  white: '#FFFFFF',
  border: '#E5E0D6',
  lightIvory: '#F8F4ED',
}

const sections = [
  {
    id: 'cv-dirigeant',
    title: 'Le CV du dirigeant : format, structure, contenu',
    summary: 'Le CV d\'un cadre dirigeant ne se limite pas à une liste de postes. Il raconte une trajectoire de leadership.',
    content: [
      {
        subtitle: 'Le format : une page ou deux ?',
        text: 'Pour un dirigeant, deux pages sont non seulement acceptables mais recommandées. Ce qui importe, c\'est que chaque centimètre carré soit investi dans la démonstration de votre valeur. Une troisième page peut être consacrée aux mandats d\'administration, publications ou distinctions.',
      },
      {
        subtitle: 'La structure : du plus percutant au plus contextualisant',
        text: 'Commencez par un résumé exécutif de trois à quatre lignes qui pose votre proposition de valeur. Enchaînez avec les expériences récentes (5 à 7 ans détaillés), puis les fonctions antérieures en format synthétique. Terminez par les formations, certifications et informations complémentaires.',
      },
      {
        subtitle: 'Résultats chiffrés vs tâches : le principe du ROI',
        text: 'Un CV de dirigeant se mesure en impact, pas en responsabilités. Chaque poste doit répondre à la question : "Qu\'est-ce que cela a rapporté à l\'organisation ?" Privilégiez les indicateurs de croissance, rentabilité, réduction de coûts, parts de marché, levées de fonds ou EBITDA. Une règle simple : si vous décrivez une responsabilité sans mentionner son impact chiffré, vous perdez l\'attention du recruteur.',
      },
      {
        subtitle: 'Les mots qui portent',
        text: '"Piloté", "Transformé", "Accéléré", "Structuré", "Redressé", "Conduit". Ces verbes d\'action associés à des métriques créent un récit de leadership. Évitez "Responsable de" ou "En charge de" — ils décrivent un périmètre, pas un impact.',
      },
    ],
  },
  {
    id: 'linkedin-executif',
    title: 'Optimiser son profil LinkedIn pour attirer les chasseurs de têtes',
    summary: 'LinkedIn est devenu le premier CV du dirigeant. Être visible, ciblé et mémorable y est un impératif stratégique.',
    content: [
      {
        subtitle: 'Le headline : votre promesse en 120 caractères',
        text: 'Le titre qui s\'affiche sous votre nom est l\'élément le plus scruté de votre profil. Oubliez le poste actuel — les chasseurs cherchent des compétences et des résultats. Formulez une promesse de valeur : "CEO | Transformation digitale & croissance | +40% EBITDA en 24 mois" ou "Directeur Général | Pilotage de la performance & stratégie d\'entreprise".',
      },
      {
        subtitle: 'Le résumé : là où se gagnent les mandats',
        text: 'Le "About" est votre executive summary public. En 5 à 7 paragraphes, posez votre trajectoire, vos réalisations majeures, votre secteur d\'excellence et votre vision. Les chasseurs de têtes y cherchent des signaux de congruence avec leurs mandats. Soyez précis, pas générique.',
      },
      {
        subtitle: 'L\'écosystème de recommandations',
        text: 'Les recommandations de pairs, administrateurs ou collaborateurs directs agissent comme des preuves sociales tierces. Visez au moins une recommandation par poste clé. Le contenu importe plus que la quantité — une recommandation bien écrite par un ancien N-1 devenu CEO a plus de poids que dix témoignages génériques.',
      },
      {
        subtitle: 'Visibility strategy : le SEO du dirigeant',
        text: 'Les cabinets de recrutement utilisent LinkedIn Recruiter avec des filtres sémantiques. Intégrez naturellement les mots-clés de votre secteur, fonction et niveau de responsabilité dans votre expérience et vos compétences. Un profil "complet" (compétences, certifications, médias, publications) est favorisé par l\'algorithme et mieux classé dans les recherches.',
      },
    ],
  },
  {
    id: 'personal-branding',
    title: 'Personal branding exécutif : se positionner comme un leader',
    summary: 'À un certain niveau, on ne postule plus. On est repéré. Le personal branding construit cette réputation qui précède votre nom.',
    content: [
      {
        subtitle: 'Définir son territoire d\'expertise',
        text: 'Un dirigeant sans territoire est un expert sans spécialité. Identifiez le croisement unique entre votre expertise sectorielle, votre savoir-faire fonctionnel et votre style de leadership. Ce triptyque devient votre signature. Vous n\'êtes pas un "CEO généraliste" — vous êtes "le CEO qui transforme les ETI industrielles par la data et l\'innovation frugale".',
      },
      {
        subtitle: 'Les supports du leadership visible',
        text: 'Un article de fond par mois sur LinkedIn, une interview dans un média sectoriel par trimestre, une intervention en conférence par an. Ce rythme minimum crée une présence continue sans sacrifier le temps opérationnel. Le personal branding exécutif ne repose pas sur la quantité mais sur la régularité et la profondeur de la réflexion.',
      },
      {
        subtitle: 'Publier avec intention',
        text: 'Chaque publication doit servir un objectif : démontrer une thèse de leadership, partager un apprentissage concret, ou positionner une vision. Les posts qui performent auprès des pairs dirigeants sont ceux qui nomment les tensions du métier : "Pourquoi j\'ai arrêté les reportings mensuels", "Ce que m\'a appris un échec de croissance externe". La vulnérabilité stratégique est un signe de maturité.',
      },
      {
        subtitle: 'L\'alignement entre CV, LinkedIn et bios',
        text: 'Une incohérence entre votre CV confidentiel, votre profil public et votre bio de conférencier est un signal d\'alarme pour un chasseur de têtes. La trame narrative doit être identique — seuls le niveau de détail et la confidentialité des données varient. Votre personal branding est crédible quand tout raconte la même histoire.',
      },
    ],
  },
  {
    id: 'cv-ats',
    title: 'CV vs ATS : les erreurs qui coûtent des opportunités',
    summary: 'Même pour un poste de direction, le CV passe souvent par un filtre algorithmique avant d\'atteindre un humain. Ignorer l\'ATS, c\'est risquer l\'élimination silencieuse.',
    content: [
      {
        subtitle: 'Comment fonctionne un ATS en recrutement cadre ?',
        text: 'Les ATS (Applicant Tracking Systems) utilisés par les grands groupes et cabinets de recrutement analysent votre CV en trois étapes : extraction des données structurées (postes, dates, diplômes), indexation sémantique (mots-clés, compétences), et scoring de pertinence. Même pour un poste de DG, un score bas signifie un classement bas dans la pile de candidatures.',
      },
      {
        subtitle: 'Les erreurs de format qui bloquent la lecture',
        text: 'Les tableaux, colonnes multiples, encadrés, icônes, et graphiques sont souvent mal interprétés par les ATS. Un design sophistiqué qui n\'est pas parsable transforme votre CV en bruit blanc. Préférez une structure linéaire hiérarchisée : titres de sections explicites, dates alignées, et une mise en page sobre que l\'algorithme peut lire de haut en bas sans confusion.',
      },
      {
        subtitle: 'L\'optimisation lexicale sans piège',
        text: 'Si le poste cible mentionne "Pilotage de la performance", votre CV doit contenir cette expression exacte, pas seulement "Management de la performance". Les ATS modernes sont tolérants mais pas infaillibles. Listez les compétences recherchées dans l\'offre et assurez-vous qu\'elles apparaissent dans vos expériences, sans les inventer. L\'honnêteté reste la règle — chaque mot-clé doit pouvoir être défendu en entretien.',
      },
      {
        subtitle: 'Le CV hybride : l\'arme secrète du dirigeant',
        text: 'Gardez deux versions de votre CV : une version ATS-optimisée (format Word ou PDF standard, texte brut exploitable, pas de colonnes) pour les candidatures en ligne, et une version "premium" (design épuré, mise en page travaillée) pour les envois directs aux chasseurs de têtes avec qui vous avez déjà un contact. Savoir quand envoyer l\'une ou l\'autre est un art stratégique.',
      },
    ],
  },
  {
    id: 'elevator-pitch',
    title: 'L\'elevator pitch du cadre dirigeant',
    summary: 'Capacité à se présenter de manière percutante et mémorable en 30, 60 ou 120 secondes — un fondamental trop souvent négligé.',
    content: [
      {
        subtitle: 'Les 30 secondes : l\'accroche qui ouvre une porte',
        text: 'En 30 secondes, vous devez poser : votre fonction actuelle ou cible, le secteur où vous excellez, et un résultat signature qui différencie. "Je dirige des transformations chez les ETI industrielles. Ma dernière mission ? Passer une entreprise de 50M€ à 80M€ d\'EBITDA en 18 mois, sans augmentation d\'effectifs." C\'est factuel, c\'est mesurable, c\'est mémorisable. Si votre interlocuteur peut répéter cette phrase, votre pitch fonctionne.',
      },
      {
        subtitle: 'Les 60 secondes : le récit qui intrigue',
        text: 'À 60 secondes, vous pouvez ajouter une couche narrative : le contexte de départ, le levier que vous avez actionné, et la leçon de leadership que vous en tirez. Structure : Situation (5s), Défi (10s), Action (25s), Résultat (10s), Leçon (10s). Cette séquence transforme un pitch d\'"états des lieux" en une micro-étude de cas qui donne envie d\'en savoir plus.',
      },
      {
        subtitle: 'Les 2 minutes : le portrait professionnel complet',
        text: 'Deux minutes vous permettent de dérouler votre trajectoire : d\'où vous venez (formation, premières expériences), ce que vous avez construit (le fil rouge de votre carrière), et où vous allez (votre prochain challenge, sectoriel ou fonctionnel). C\'est le format idéal pour un premier échange avec un chasseur de têtes — assez long pour montrer de la profondeur, assez court pour ne pas lasser.',
      },
      {
        subtitle: 'L\'adaptation au secteur et au contexte',
        text: 'Un pitch qui fonctionne dans la tech ne passe pas dans l\'industrie lourde. Adaptez votre vocabulaire, vos métriques de référence (ARPU vs EBITDA, temps de cycle vs taux de service) et vos références culturelles. Avant chaque interaction importante, préparez trois versions de votre pitch calibrées pour votre interlocuteur : le comité exécutif, le fonds d\'investissement, et le cabinet de recrutement.',
      },
    ],
  },
]

export default function CvBrandingPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const toggleSection = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div style={{ backgroundColor: colors.white, minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        {/* Back link */}
        <Link
          href="/prsto/ressources"
          style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 14,
            color: colors.secondary,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 40,
            letterSpacing: 0.3,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.forest)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.secondary)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour aux ressources
        </Link>

        {/* Header */}
        <header style={{ marginBottom: 56 }}>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: colors.lightIvory,
              padding: '4px 14px',
              borderRadius: 100,
              fontFamily: 'Geist, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: colors.secondary,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Ressource PRSTO
          </div>

          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 36,
              fontWeight: 700,
              color: colors.text,
              lineHeight: 1.2,
              margin: '0 0 16px 0',
              letterSpacing: -0.5,
            }}
          >
            CV & Personal Branding
          </h1>

          <p
            style={{
              fontFamily: 'Geist, sans-serif',
              fontSize: 18,
              color: colors.secondary,
              lineHeight: 1.6,
              fontWeight: 400,
              margin: 0,
              maxWidth: 680,
            }}
          >
            Comment un cadre dirigeant construit un dossier de candidature
            irréprochable et une réputation qui précède son nom — du CV à la
            signature personnelle.
          </p>
        </header>

        {/* Divider */}
        <div
          style={{
            width: 60,
            height: 3,
            backgroundColor: colors.gold,
            marginBottom: 48,
          }}
        />

        {/* Article sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {sections.map((section) => {
            const isExpanded = expandedId === section.id
            return (
              <article key={section.id} id={section.id}>
                <div
                  style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleSection(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSection(section.id)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h2
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 22,
                          fontWeight: 600,
                          color: colors.text,
                          lineHeight: 1.3,
                          margin: '0 0 8px 0',
                          letterSpacing: -0.3,
                        }}
                      >
                        {section.title}
                      </h2>
                      <p
                        style={{
                          fontFamily: 'Geist, sans-serif',
                          fontSize: 15,
                          color: colors.secondary,
                          lineHeight: 1.6,
                          margin: 0,
                          fontWeight: 400,
                        }}
                      >
                        {section.summary}
                      </p>
                    </div>

                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: colors.lightIvory,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 4,
                        transition: 'transform 0.3s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                        <path
                          d="M1 1L7 7L13 1"
                          stroke={colors.forest}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expandable content */}
                <div
                  style={{
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease',
                    maxHeight: isExpanded ? 4000 : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div style={{ paddingTop: 32 }}>
                    {section.content.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: idx < section.content.length - 1 ? 32 : 0,
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 17,
                            fontWeight: 600,
                            color: colors.text,
                            lineHeight: 1.4,
                            margin: '0 0 10px 0',
                            letterSpacing: -0.2,
                          }}
                        >
                          {item.subtitle}
                        </h3>
                        <p
                          style={{
                            fontFamily: 'Geist, sans-serif',
                            fontSize: 15,
                            color: colors.text,
                            lineHeight: 1.75,
                            margin: 0,
                            fontWeight: 400,
                            maxWidth: 780,
                          }}
                        >
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginTop: 48,
                    opacity: 0.5,
                  }}
                />
              </article>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 72,
            padding: '40px 48px',
            backgroundColor: colors.lightIvory,
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              color: colors.text,
              margin: '0 0 12px 0',
              lineHeight: 1.4,
            }}
          >
            Prêt à structurer votre candidature de dirigeant ?
          </p>
          <p
            style={{
              fontFamily: 'Geist, sans-serif',
              fontSize: 15,
              color: colors.secondary,
              margin: '0 0 24px 0',
              lineHeight: 1.6,
              maxWidth: 500,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            PRSTO vous accompagne dans la préparation de votre dossier exécutif
            avec des outils de scoring de CV, simulation d&apos;entretien et analyse
            de marché.
          </p>
          <Link
            href="/prsto"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              backgroundColor: colors.forest,
              color: colors.white,
              fontFamily: 'Geist, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 6,
              letterSpacing: 0.5,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f2e1f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.forest)}
          >
            Découvrir PRSTO
          </Link>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 48,
            textAlign: 'center',
            fontFamily: 'Geist, sans-serif',
            fontSize: 13,
            color: colors.secondary,
          }}
        >
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Une ressource proposée par{' '}
            <span style={{ color: colors.forest, fontWeight: 500 }}>PRSTO</span>
            {' — '}Copilote carrière IA pour cadres dirigeants
          </p>
        </footer>
      </div>
    </div>
  )
}
