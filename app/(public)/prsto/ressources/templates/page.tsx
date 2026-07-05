'use client'

import Link from 'next/link'

const colors = {
  forest: '#103826',
  gold: '#E4B118',
  ivory: '#FAF6EF',
  text: '#0B1F18',
  secondary: '#50625A',
  white: '#FFFFFF',
  border: '#E5E0D6',
  lightIvory: '#F8F4ED',
  forestLight: 'rgba(16,56,38,0.06)',
}

const TEMPLATES = [
  {
    id: 'cv-dirigeant',
    title: 'Template CV dirigeant',
    subtitle: 'Structure recommandée avec sections Proof Vault',
    desc: 'Modèle de CV exécutif structuré autour de la méthode Proof Vault : résumé exécutif, réalisations chiffrées, mandats d\'administration. Optimisé ATS et prêt à imprimer.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="2" width="18" height="20" rx="2" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M8 8H16" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 12H14" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 16H12" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    format: 'PDF — 3 pages',
    action: 'Télécharger le template',
  },
  {
    id: 'lettre-motivation',
    title: 'Template lettre de motivation exécutive',
    subtitle: 'Modèle de lettre de candidature cadre dirigeant',
    desc: 'Structure de lettre en trois mouvements : accroche de leadership, démonstration d\'adéquation stratégique, projection d\'impact. Accompagnée d\'exemples rédigés par secteur.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M8 7L12 10L16 7" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14H16" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 17H14" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    format: 'DOCX — 2 pages',
    action: 'Télécharger le template',
  },
  {
    id: 'checklist-entretien',
    title: 'Checklist préparation entretien COMEX',
    subtitle: 'Préparation complète entretien de direction',
    desc: 'Grille de préparation en 4 phases : analyse de l\'entreprise et du contexte, anticipation des questions stratégiques, préparation de vos cas d\'impact, et plan de storytelling exécutif.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M7 12L10 15L17 8" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    format: 'PDF — 6 pages',
    action: 'Télécharger la checklist',
  },
  {
    id: 'plan-recherche',
    title: 'Plan de recherche d\'emploi cadre dirigeant',
    subtitle: 'Tableau de bord 90 jours',
    desc: 'Dashboard de recherche exécutive sur 90 jours : objectifs hebdomadaires, pipeline de cibles, suivi des relations chasseurs, indicateurs de progression et points de décision.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M3 9H21" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M9 21L9 9" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M15 21L15 9" stroke="#E4B118" strokeWidth="1.5" />
        <circle cx="7" cy="15" r="1" fill="#E4B118" />
        <circle cx="13" cy="12" r="1" fill="#E4B118" />
        <circle cx="19" cy="18" r="1" fill="#E4B118" />
      </svg>
    ),
    format: 'XLSX — 1 onglet / 12 semaines',
    action: 'Télécharger le tableau de bord',
  },
  {
    id: 'grille-evaluation',
    title: 'Grille d\'évaluation des offres',
    subtitle: 'Salaire + Package + Fit culturel',
    desc: 'Matrice d\'évaluation multi-critères : rémunération fixe et variable, equity, avantages, alignement culturel, potentiel de progression, qualité du COMEX et risque d\'intégration.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M3 11H21" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M7 5V19" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M12 5V19" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M17 5V19" stroke="#E4B118" strokeWidth="1.5" />
      </svg>
    ),
    format: 'XLSX — 4 onglets',
    action: 'Télécharger la grille',
  },
  {
    id: 'reseau-professionnel',
    title: 'Guide d\'évaluation de son réseau professionnel',
    subtitle: 'Audit et activation de votre réseau de dirigeants',
    desc: 'Cadre d\'analyse relationnelle : cartographie de votre réseau par cercles d\'influence, scoring de la qualité des relations, plan d\'activation et de développement ciblé.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2" stroke="#E4B118" strokeWidth="1.5" />
        <circle cx="5" cy="6" r="1.5" stroke="#E4B118" strokeWidth="1.5" />
        <circle cx="19" cy="6" r="1.5" stroke="#E4B118" strokeWidth="1.5" />
        <circle cx="5" cy="18" r="1.5" stroke="#E4B118" strokeWidth="1.5" />
        <circle cx="19" cy="18" r="1.5" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M10 10.5L6.5 7.5" stroke="#E4B118" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 10.5L17.5 7.5" stroke="#E4B118" strokeWidth="1" strokeLinecap="round" />
        <path d="M10 13.5L6.5 16.5" stroke="#E4B118" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 13.5L17.5 16.5" stroke="#E4B118" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    format: 'PDF — 8 pages',
    action: 'Télécharger le guide',
  },
  {
    id: 'plan-30-60-90',
    title: 'Template plan 30-60-90 jours',
    subtitle: 'Pour entretien final et prise de poste',
    desc: 'Modèle de plan d\'intégration structuré en trois phases : diagnostic et écoute (J1-30), ancrage et premières victoires (J31-60), déploiement et accélération (J61-90).',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 20L21 20" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 20V8L12 4L19 8V20" stroke="#E4B118" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="9" y="11" width="6" height="9" rx="1" stroke="#E4B118" strokeWidth="1.5" />
      </svg>
    ),
    format: 'PPTX — 12 slides',
    action: 'Télécharger le template',
  },
  {
    id: 'email-suivi',
    title: 'Modèle d\'email de suivi après entretien',
    subtitle: 'Relances exécutives post-entretien',
    desc: 'Banque de 8 modèles d\'emails : remerciement post-entretien, relance à J+7, mise à jour de candidature, réponse à une offre alternative, demande de recommandation, et message de closing.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" stroke="#E4B118" strokeWidth="1.5" />
        <path d="M2 7L12 14L22 7" stroke="#E4B118" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    format: 'DOCX — 8 modèles',
    action: 'Télécharger les modèles',
  },
]

export default function TemplatesPage() {
  return (
    <div style={{ backgroundColor: colors.white, minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
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

        <header style={{ marginBottom: 48 }}>
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
            Templates & Outils
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
            Modèles prêts à l&apos;emploi pour structurer votre recherche exécutive
            — du CV à la négociation finale. Chaque template est conçu pour les
            cadres dirigeants et optimisé pour l&apos;impact.
          </p>
        </header>

        <div
          style={{
            width: 60,
            height: 3,
            backgroundColor: colors.gold,
            marginBottom: 48,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TEMPLATES.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => {
                const el = document.getElementById(`template-content-${t.id}`)
                if (el) {
                  el.style.maxHeight = el.style.maxHeight === '800px' ? '0' : '800px'
                  el.style.opacity = el.style.opacity === '1' ? '0' : '1'
                  el.style.paddingTop = el.style.paddingTop === '24px' ? '0' : '24px'
                  el.style.paddingBottom = el.style.paddingBottom === '24px' ? '0' : '24px'
                }
              }}
              style={{
                cursor: 'pointer',
                borderRadius: 14,
                border: '1px solid',
                borderColor: colors.border,
                backgroundColor: colors.white,
                padding: '20px 24px',
                transition: 'all 0.3s ease',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(228,177,24,0.3)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,56,38,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(228,177,24,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {t.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 2,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 17,
                        fontWeight: 600,
                        color: colors.text,
                        margin: 0,
                        letterSpacing: -0.2,
                      }}
                    >
                      {t.title}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'Geist, sans-serif',
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#A38010',
                        backgroundColor: 'rgba(228,177,24,0.1)',
                        padding: '2px 10px',
                        borderRadius: 100,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.format}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: 'Geist, sans-serif',
                      fontSize: 13,
                      color: colors.secondary,
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {t.subtitle}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'Geist, sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.forest,
                    padding: '8px 16px',
                    borderRadius: 6,
                    backgroundColor: 'rgba(16,56,38,0.06)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1V10M7 10L3 6M7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1 11V12.5C1 12.7761 1.22386 13 1.5 13H12.5C12.7761 13 13 12.7761 13 12.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {t.action}
                </div>
              </div>

              <div
                id={`template-content-${t.id}`}
                style={{
                  maxHeight: 0,
                  opacity: 0,
                  overflow: 'hidden',
                  transition: 'all 0.35s ease',
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
              >
                <div
                  style={{
                    borderTop: '1px solid',
                    borderColor: colors.border,
                    marginBottom: 16,
                  }}
                />
                <p
                  style={{
                    fontFamily: 'Geist, sans-serif',
                    fontSize: 14,
                    color: colors.text,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {t.desc}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 20,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Geist, sans-serif',
                      fontSize: 12,
                      color: colors.secondary,
                      backgroundColor: colors.lightIvory,
                      padding: '4px 12px',
                      borderRadius: 6,
                    }}
                  >
                    {t.format}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Geist, sans-serif',
                      fontSize: 12,
                      color: colors.forest,
                      backgroundColor: 'rgba(16,56,38,0.06)',
                      padding: '4px 12px',
                      borderRadius: 6,
                    }}
                  >
                    Cliquez pour télécharger
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

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
            Vous cherchez un accompagnement personnalisé ?
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
            PRSTO analyse votre profil, votre marché et vos opportunités pour
            optimiser chaque étape de votre recherche exécutive.
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
