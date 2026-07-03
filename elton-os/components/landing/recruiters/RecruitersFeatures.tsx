"use client";

import Reveal from "../Reveal";
import ImgSlot from "../ImgSlot";
import { FileText, Mail, Search, Globe, BarChart3, BookOpen } from "lucide-react";

const TOOLS = [
  {
    icon: FileText,
    title: "CV Formatter",
    accent: "Importez n'importe quel CV, PRSTO le reformate pour l'offre client.",
    desc: "Fini le copier-coller entre Word et vos templates. Importez le CV du candidat (PDF, DOCX, LinkedIn), collez l'offre client, et PRSTO génère un CV parfaitement adapté, formaté ATS, prêt à envoyer. En 30 secondes, pas en 45 minutes.",
    color: "#103826",
    num: 8,
    align: "left",
    prompt: "Mockup CV Formatter — écran montrant l'import d'un CV à gauche, le CV formaté à droite. Interface propre, tons vert foncé. Barre d'outils visible.",
    promptLong: "Interface matching PRSTO. Grille de profils candidats chacun avec un score de compatibilité sur 100 (96% 91% 87% 84% 78%) affiché dans un badge doré. Chaque profil a une photo silhouette élégante en noir et blanc un titre de poste et une localisation. Barre de recherche en haut avec un filtre déjà actif 'Créatif studio'. Style premium Tinder-like mais pour le recrutement. Palette #0B1F18 #E4B118 #FAF6EF.",
  },
  {
    icon: Mail,
    title: "Lettre de Motivation",
    accent: "Générée au nom du cabinet, alignée sur l'offre.",
    desc: "Une lettre de motivation sur-mesure pour chaque candidat, chaque offre. PRSTO analyse l'offre, extrait les mots-clés, et génère une lettre professionnelle au nom de votre cabinet. Plus besoin de recopier 20 fois les mêmes phrases ou de payer un rédacteur 200€.",
    color: "#E4B118",
    num: 9,
    align: "right",
    prompt: "Mockup Lettre de Motivation — interface d'édition de lettre. Aperçu lettre formatée à droite, options de personnalisation à gauche. Élégant, professionnel.",
    promptLong: "Dashboard ATS global mode kanban. 4 colonnes Candidatures (24) Entretien (12) Test (6) Offre (2 avec badge chaud). Chaque colonne a 3-4 cartes profil avec photo silhouette titre et score mini. En haut barre de recherche et filtres rapides. En bas un petit funnel qui montre le flow candidature jusqu'à signature. Nombre total 94 candidats en haut à gauche. Fond #0B1F18 accents #6A8F6D pour les badges. Style data-pipeline propre efficace.",
  },
  {
    icon: Search,
    title: "ATS Scanner",
    accent: "Votre dossier passera-t-il les filtres ? Vérifiez avant d'envoyer.",
    desc: "Avant d'envoyer un candidat, PRSTO analyse son dossier contre les systèmes ATS de l'entreprise cliente. Score de compatibilité, mots-clés manquants, formatage risqué. 92% des dossiers préparés avec PRSTO passent les filtres ATS, contre 40% en moyenne.",
    color: "#6A8F6D",
    num: 10,
    align: "left",
    prompt: "Mockup ATS Scanner — écran montrant le score de compatibilité ATS (92%). Barre de progression colorée, checklist des critères passés/échoués. Data-driven.",
    promptLong: "Interface Ask en direct. Partie gauche une conversation chat avec message du recruteur 'Je cherche un motion designer freelance 3 semaines Paris' et réponse de l'assistant PRSTO 'Je trouve 6 profils compatibles'. Partie droite 3 profils qui apparaissent en temps réel avec photo silhouette score et badge Disponible immédiatement. Icône du logo PRSTO qui pulse dans la conversation. Fond #0B1F18. Vert #6A8F6D pour les messages reçus. Style ChatGPT meets design.",
  },
  {
    icon: Globe,
    title: "LinkedIn Optimizer",
    accent: "Maximisez la visibilité du candidat sur LinkedIn.",
    desc: "Analysez le profil LinkedIn du candidat et recevez des recommandations précises : photo, headline, section expérience, recommandations. PRSTO identifie les lacunes et suggère les optimisations qui multiplient par 3 les chances d'être contacté par les recruteurs clients.",
    color: "#103826",
    num: 11,
    align: "right",
    prompt: "Mockup LinkedIn Optimizer — interface d'analyse de profil LinkedIn. Score de complétion, checklist d'optimisation, aperçu avant/après. Design moderne.",
    promptLong: "Interface outils d'automatisation PRSTO. 4 tuiles avec icônes Envoi groupé (icône rocket) Relance auto (icône horloge) Scoring IA (icône brain) Onboarding (icône doc check). Chaque tuile a un interrupteur ON/OFF au design premium. Fond #FAF6EF légèrement texturé. Accents #E4B118 et #6A8F6D. Style Apple Settings reimagined pour le recrutement.",
  },
  {
    icon: BarChart3,
    title: "Market Radar",
    accent: "Trouvez les offres qui matchent le profil de votre candidat.",
    desc: "Scannez 17 plateformes d'emploi en un clic pour trouver les offres correspondant à votre candidat. Fini de chercher manuellement sur 5 sites différents. Le Market Radar classe les offres par pertinence, salaire, localisation et urgence.",
    color: "#E4B118",
    num: 12,
    align: "left",
    prompt: "Mockup Market Radar — interface de matching offres/candidats. Carte, liste d'offres, scores de matching, filtres. Dashboard data-driven, tons or et vert.",
    promptLong: "Interface réseau de talents PRSTO. Vue graphique type linked nodes avec le recruteur au centre et des cercles autour Candidats passés Entreprises partenaires Candidats recommandés Cooptations. Chaque cercle a une taille proportionnelle au nombre. Des lignes fines connectent les cercles. Quelques photos silhouettes aux noeuds principaux. Fond dégradé #0B1F18 vers #103826. Accents dorés #E4B118. Style graphique réseau LinkedIn Premium meets design editorial.",
  },
  {
    icon: BookOpen,
    title: "Brief Entretien",
    accent: "Dossier complet pour préparer votre candidat à l'entretien.",
    desc: "PRSTO compile un dossier d'entretien complet : présentation de l'entreprise, culture, questions probables, points forts du candidat à mettre en avant, stratégie de négociation salariale. Votre candidat arrive préparé, vous augmentez vos chances de placement de 40%.",
    color: "#6A8F6D",
    num: 13,
    align: "right",
    prompt: "Mockup Brief Entretien — dossier candidat complet. Sections : Entreprise, Questions, Pitch, Négociation. Design propre, structuré, élégant.",
    promptLong: "Interface outils de communication PRSTO. 3 colonnes verticales. Colonne 1 éditeur d'email avec template ouvert champs variables {candidat} {poste} surlignés en doré. Colonne 2 page carrière preview d'une page élégante avec logo PRSTO en header valeurs entreprise et 2 postes ouverts. Colonne 3 générateur d'annonce réseaux avec 3 formats LinkedIn Instagram Twitter. Fond #FFFDF8. Bordure fine. Style suite créative professionnelle Adobe meets Canva.",
  },
];

export function RecruitersFeatures() {
  return (
    <section id="fonctionnalites" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal variant="up" className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11.5px] font-semibold tracking-wide mb-5" style={{
            borderColor: "rgba(16,56,38,0.12)", color: "#103826",
            background: "rgba(16,56,38,0.06)",
          }}>
            ✦ Fonctionnalités
          </div>
          <h2 className="font-serif text-[clamp(1.875rem,3.5vw,2.875rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-3 text-[#0B1F18]">
            Les 6 outils du recruteur augmenté
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: "#6A8F6D" }}>
            Chaque outil est conçu pour une tâche précise. Pas de bloat. Pas de courbe d&apos;apprentissage.
          </p>
        </Reveal>

        <div className="space-y-16">
          {TOOLS.map((t, i) => (
            <Reveal
              variant={t.align === "left" ? "right" : "left"}
              delay={i * 80}
              key={t.title}
            >
              <div className="md:grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                {t.align === "left" ? (
                  <>
                    <div className="order-2 md:order-1">
                      <ImgSlot
                        num={t.num}
                        format="wide"
                        prompt={t.prompt}
                        promptLong={t.promptLong}
                      />
                    </div>
                    <div className="order-1 md:order-2 mb-6 md:mb-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{
                        background: `${t.color}12`, border: `1px solid ${t.color}20`,
                      }}>
                        <t.icon size={22} style={{ color: t.color }} />
                      </div>
                      <h3 className="text-xl font-bold mb-1" style={{ color: "#0B1F18" }}>{t.title}</h3>
                      <p className="text-sm font-medium mb-3" style={{ color: t.color }}>{t.accent}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{t.desc}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6 md:mb-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{
                        background: `${t.color}12`, border: `1px solid ${t.color}20`,
                      }}>
                        <t.icon size={22} style={{ color: t.color }} />
                      </div>
                      <h3 className="text-xl font-bold mb-1" style={{ color: "#0B1F18" }}>{t.title}</h3>
                      <p className="text-sm font-medium mb-3" style={{ color: t.color }}>{t.accent}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#50625A" }}>{t.desc}</p>
                    </div>
                    <div>
                      <ImgSlot
                        num={t.num}
                        format="wide"
                        prompt={t.prompt}
                        promptLong={t.promptLong}
                      />
                    </div>
                  </>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
