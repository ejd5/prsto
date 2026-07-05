'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Award, FileText, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';

const colors = {
  forest: '#103826',
  gold: '#E4B118',
  ivory: '#FAF6EF',
  text: '#0B1F18',
  secondary: '#50625A',
  white: '#FFFFFF',
  border: '#E5E0D6',
  lightIvory: '#F8F4ED',
};

const sections = [
  {
    id: 'cv-dirigeant',
    title: 'Le CV du dirigeant : format, structure et narration',
    summary: 'Le CV d\'un cadre dirigeant ne se limite pas à une liste chronologique de postes. Il doit raconter une trajectoire de leadership chiffrée et projeter votre ROI opérationnel.',
    content: [
      {
        subtitle: 'Le format idéal : mythes et réalités de la longueur',
        text: 'Pour un dirigeant executive, la règle obsolète du CV d\'une seule page ne s\'applique pas. Deux pages constituent le standard de référence pour le Top Management. Ce format offre l\'espace nécessaire pour poser le contexte stratégique de chaque entreprise, détailler l\'étendue de vos responsabilités (P&L, effectifs) et chiffrer vos victoires opérationnelles. Une troisième page reste tout à fait légitime si elle est consacrée exclusivement à vos mandats d\'administrateur indépendant, vos publications professionnelles ou vos distinctions d\'autorité.',
      },
      {
        subtitle: 'La structure narrative : capter l\'attention en 6 secondes',
        text: 'La mise en page doit être strictement linéaire et hiérarchisée. Commencez par un Executive Summary de 3 à 4 lignes décrivant votre posture stratégique (ex: "Directeur Général spécialisé dans la restructuration d\'ETI industrielles"). Enchaînez directement avec vos réalisations majeures récentes détaillées, en réservant une section simplifiée pour vos expériences plus anciennes (au-delà de 15 ans). Terminez par votre formation et vos certifications de gouvernance.',
      },
      {
        subtitle: 'La démonstration par l\'impact : la formule de performance chiffrée',
        text: 'Chaque ligne de votre CV doit refléter votre impact sur l\'organisation. Remplacez les descriptions de tâches passives par des verbes d\'action à forte valeur ajoutée (Piloté, Redressé, Accéléré) associés à des données chiffrées précises. Indiquez la taille du P&L géré, l\'évolution de l\'EBITDA, le pourcentage de croissance du chiffre d\'affaires ou les gains de productivité opérationnels. Si une expérience ne contient aucun chiffre, elle est invisible pour un recruteur de haut niveau.',
      },
    ],
    checklist: [
      "Supprimer les barres de niveau de compétence graphiques, illisibles pour les outils de tri.",
      "Vérifier que chaque expérience récente contient au moins 2 indicateurs chiffrés (KPIs).",
      "Rédiger un résumé de profil de 3 lignes axé sur votre posture unique de dirigeant.",
      "Simplifier les expériences professionnelles de plus de 15 ans d'ancienneté à leur strict intitulé."
    ]
  },
  {
    id: 'linkedin-executif',
    title: 'Optimiser son profil LinkedIn pour attirer les chasseurs de têtes',
    summary: 'LinkedIn est le premier filtre utilisé par les associés d\'Executive Search. Votre profil doit être optimisé comme une vitrine de gouvernance.',
    content: [
      {
        subtitle: 'Le headline : définir sa posture de leader',
        text: 'Le titre sous votre nom ne doit pas simplement refléter votre intitulé de poste actuel. Il doit exprimer votre valeur stratégique globale en intégrant vos compétences clés et votre impact. Utilisez des séparateurs clairs : "Directeur Général | Transformation Opérationnelle & Industrie 4.0 | Gestion de P&L 100M€". Cela permet aux algorithmes de recherche des cabinets de vous identifier instantanément.',
      },
      {
        subtitle: 'La section "Info" (About) : votre executive summary public',
        text: 'Rédigez cette section à la première personne pour instaurer un dialogue direct. Divisez-la en 4 parties : votre fil rouge de carrière, vos 3 compétences clés illustrées de victoires marquantes, votre style de leadership humain, et les problématiques stratégiques que vous aimez résoudre. Évitez les discours corporatifs plats et privilégiez un ton authentique et engagé.',
      },
      {
        subtitle: 'La preuve sociale et les recommandations de gouvernance',
        text: 'Les recommandations écrites par des pairs, des présidents de conseil d\'administration ou d\'anciens collaborateurs directs apportent une crédibilité majeure à votre profil. Sollicitez des recommandations ciblées, axées sur vos qualités humaines de leader et votre gestion des crises opérationnelles.',
      },
    ],
    checklist: [
      "Retirer le badge 'Open to Work' qui dégrade la posture de rareté du dirigeant.",
      "Intégrer les mots-clés sémantiques de votre secteur dans la section Compétences.",
      "Obtenir au moins 3 recommandations écrites de pairs ou de membres de Board.",
      "Utiliser une photo de profil corporate professionnelle de haute qualité et sobre."
    ]
  },
  {
    id: 'personal-branding',
    title: 'Personal branding exécutif : asseoir son leadership d\'opinion',
    summary: 'À haut niveau, l\'autorité se démontre par la parole publique. Apprenez à partager votre expertise de manière régulière et mesurée.',
    content: [
      {
        subtitle: "Définir son territoire d'expertise unique",
        text: "Ne tentez pas d'être un expert généraliste sur tous les sujets de management. Choisissez un domaine précis et pointu où votre voix est d'autorité (ex: la relocalisation industrielle, la transition écologique des supply chains, la cybersécurité des comex). Ce territoire doit être le fil rouge de toutes vos prises de parole publiques.",
      },
      {
        subtitle: "Le rythme éditorial : la régularité plutôt que le volume",
        text: "Un cadre dirigeant ne doit pas surcharger les réseaux de publications futiles. Privilégiez la qualité et la profondeur : un article d'analyse sectorielle fouillé par mois sur LinkedIn, ou le partage d'un retour d'expérience managérial concret. Cette régularité construit une réputation d'expert posé et réfléchi.",
      },
      {
        subtitle: "La vulnérabilité stratégique comme force de leadership",
        text: "Les analyses les plus lues et respectées sont celles qui abordent les difficultés réelles du métier de dirigeant. Partager les leçons apprises lors d'un échec de fusion-acquisition ou expliquer comment vous avez géré une crise sociale interne montre une maturité humaine et une hauteur de vue très appréciées par les Boards.",
      },
    ],
    checklist: [
      "Définir une charte éditoriale de 3 thématiques clés liées à votre expertise.",
      "Planifier un créneau mensuel pour rédiger un article d'analyse sectorielle approfondi.",
      "Éviter les commentaires spontanés ou émotifs sur des sujets politiques ou polémiques.",
      "Partager vos retours d'expérience en utilisant la méthode STAR (Situation, Tâche, Action, Résultat)."
    ]
  }
];

export default function CvBrandingPage() {
  const [expandedId, setExpandedId] = useState<string | null>('cv-dirigeant');

  const toggleSection = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen py-6" style={{ color: colors.text }}>
      {/* Back navigation */}
      <Link
        href="/prsto/ressources"
        className="inline-flex items-center gap-2 text-xs font-semibold mb-8 transition-colors hover:text-[#E4B118]"
        style={{ color: colors.secondary }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux ressources</span>
      </Link>

      {/* Header */}
      <header className="mb-12 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-4" style={{
          borderColor: "rgba(228,177,24,0.3)", color: colors.forest, background: "rgba(228,177,24,0.08)"
        }}>
          <Sparkles className="w-3 h-3 text-[#E4B118]" />
          <span>Ressource d&apos;autorité</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ 
          color: colors.forest,
          fontFamily: "var(--font-plus-jakarta-sans, sans-serif)",
          lineHeight: 1.2
        }}>
          CV & Personal Branding Exécutif
        </h1>
        
        <p className="text-base max-w-2xl leading-relaxed" style={{ color: colors.secondary }}>
          Découvrez les méthodologies de pointe pour concevoir des dossiers de candidature d&apos;impact et structurer une marque personnelle solide qui capte l&apos;attention des recruteurs du Top Management.
        </p>

        <div className="w-16 h-1 bg-[#E4B118] mt-6 rounded-full"></div>
      </header>

      {/* Interactive Guides Accordion */}
      <div className="space-y-6">
        {sections.map((section) => {
          const isExpanded = expandedId === section.id;
          return (
            <div 
              key={section.id} 
              className="rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md"
              style={{ 
                borderColor: isExpanded ? "rgba(16,56,38,0.15)" : "rgba(16,56,38,0.08)",
                background: "#FFFFFF"
              }}
            >
              {/* Accordion Trigger */}
              <button
                className="w-full text-left p-6 md:p-8 flex items-start justify-between gap-6 cursor-pointer focus:outline-none"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
              >
                <div className="space-y-2 flex-1">
                  <h2 className="text-xl font-bold transition-colors group-hover:text-[#E4B118]" style={{ 
                    color: colors.forest,
                    fontFamily: "var(--font-plus-jakarta-sans, sans-serif)"
                  }}>
                    {section.title}
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: colors.secondary }}>
                    {section.summary}
                  </p>
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 mt-1"
                  style={{ 
                    background: "rgba(16,56,38,0.05)",
                    color: colors.forest,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-6 pb-8 md:px-8 md:pb-10 border-t border-dashed" style={{ borderColor: "rgba(16,56,38,0.08)" }}>
                  
                  {/* Detailed Reading Body */}
                  <div className="space-y-8 pt-8">
                    {section.content.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.forest }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E4B118]" />
                          {item.subtitle}
                        </h3>
                        <p className="text-xs leading-relaxed pl-3.5" style={{ color: colors.secondary }}>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Checklist Section */}
                  {section.checklist && (
                    <div className="mt-8 p-6 rounded-xl border" style={{ 
                      borderColor: "rgba(16,56,38,0.08)",
                      background: "rgba(16,56,38,0.02)"
                    }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#103826] flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-[#E4B118]" />
                        <span>Plan d&apos;action & Checklist</span>
                      </h4>
                      <ul className="space-y-3">
                        {section.checklist.map((check, checkIdx) => (
                          <li key={checkIdx} className="text-xs flex items-start gap-2.5" style={{ color: colors.secondary }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1.5 flex-shrink-0" />
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
