"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Target,
  Shield,
  MessagesSquare,
  ListChecks,
  Brain,
  Users,
  ChevronRight,
} from "lucide-react";

const C = {
  forest: "#103826",
  pine: "#1F5B3E",
  gold: "#E4B118",
  ivory: "#FAF6EF",
  text: "#0B1F18",
  muted: "rgba(11,31,24,0.5)",
  light: "rgba(16,56,38,0.06)",
  border: "rgba(16,56,38,0.08)",
};

const sections = [
  {
    id: "questions-pieges",
    icon: <Target size={18} />,
    title: "Les questions pièges des entretiens COMEX (et comment y répondre en STAR)",
    content: [
      {
        q: "« Parlez-moi d'une décision stratégique que vous regrettez. »",
        a: "Les dirigeants attendent une vulnérabilité maîtrisée. Utilisez la méthode STAR : Situation (contexte de marché tendu), Tâche (restructuration nécessaire), Action (choix d'un plan social que vous referiez différemment), Résultat (indicateurs atteints mais leçon apprise sur la communication interne). L'erreur fatale ? Donner un faux regret ou blâmer l'équipe.",
      },
      {
        q: "« Pourquoi quittez-vous votre poste actuel ? »",
        a: "Ne parlez jamais de conflit, d'échec ou de lassitude. Reformulez en terme d'ambition de création de valeur : « J'ai mené la transformation que j'étais venu accomplir. Je cherche désormais un conseil où mon expérience en [secteur] peut générer un impact de nouvelle ampleur. »",
      },
      {
        q: "« Quel est votre style de leadership ? »",
        a: "Évitez les qualificatifs vagues. Ancrez votre réponse dans un cadre reconnu : « Je pratique un leadership situationnel. Dans une phase de turnaround, je suis directif et très impliqué sur l'exécution. Dans une phase de croissance, je deviens fédérateur et délégatif. Exemple concret : chez [Société], j'ai passé de 3 à 8 reportings directs sans perte d'efficacité. »",
      },
      {
        q: "« Vous avez un trou de 18 mois dans votre CV. Expliquez. »",
        a: "Assumez sans vous justifier. « J'ai choisi de prendre un temps de réflexion stratégique après mon dernier mandat. J'ai mis à profit cette période pour [formation exécutive / advisory / projet personnel structurant]. Cette pause m'a permis d'affiner ma vision et d'être aujourd'hui plus aligné avec mes ambitions. »",
      },
    ],
  },
  {
    id: "assessment-centers",
    icon: <Brain size={18} />,
    title: "Assessment centers pour cadres dirigeants : préparation",
    content: [
      {
        q: "À quoi s'attendre",
        a: "Les assessment centers de niveau COMEX durent une journée complète, parfois deux. Ils combinent : études de cas stratégiques (business case à résoudre en 2h), simulations de comité de direction (jeu de rôle avec des assesseurs), entretiens comportementaux poussés (structurés autour des compétences clés du poste), tests de personnalité (Hogan, DISC, OPQ32) et parfois une présentation formelle devant un jury.",
      },
      {
        q: "La stratégie gagnante",
        a: "Ne cherchez pas à « performer » chaque exercice isolément. Les assesseurs évaluent votre cohérence transversale : vos décisions dans le business case doivent refléter les mêmes valeurs que votre jeu de rôle. Préparez un fil conducteur (« leadership thread ») qui traverse toutes les épreuves. Anticipez les feedbacks 360° simulés — on observe votre capacité à recevoir une critique en direct.",
      },
      {
        q: "L'étude de cas : la clé du succès",
        a: "Les 4 pièges les plus fréquents : (1) Plonger dans les détails opérationnels — restez au niveau stratégique. (2) Ignorer les parties prenantes — montrez votre vision politique de l'organisation. (3) Ne pas articuler de plan de mise en œuvre — un diagnostic sans exécution est incomplet. (4) Oublier l'humain — intégrez toujours l'impact sur les équipes et la culture.",
      },
    ],
  },
  {
    id: "chasseur-drh-dg",
    icon: <Users size={18} />,
    title: "L'entretien avec un chasseur de têtes vs DRH vs DG",
    content: [
      {
        q: "Avec le chasseur de têtes (cabinet de recrutement exécutif)",
        a: "C'est un entretien de qualification, pas de décision. Votre objectif : devenir « présentable » au comité. Structurez votre récit de carrière en 3 actes (ascension, transformation, vision). Soyez précis sur votre rémunération actuelle et votre package cible. Le chasseur est votre avocat auprès du client — donnez-lui des munitions : chiffres clés, noms de références vérifiables, raisons claires de votre intérêt pour le poste.",
      },
      {
        q: "Avec le DRH / Directeur des Ressources Humaines",
        a: "Le DRH évalue l'alignement culturel et la compatibilité organisationnelle. Il creuse vos soft skills, votre management d'équipe, votre gestion des conflits. Préparez des exemples STAR détaillés sur : recrutement et développement de talents, gestion d'un collaborateur en difficulté, négociation salariale, conduite du changement. N'oubliez pas : le DRH a souvent un droit de veto — ne le sous-estimez jamais.",
      },
      {
        q: "Avec le DG / Directeur Général (votre futur N+1)",
        a: "C'est le seul entretien qui compte vraiment. Le DG cherche un alter ego, quelqu'un qui partage sa vision et peut la challenger. Préparez une opinion forte sur l'entreprise — son marché, sa stratégie, ses risques. Posez des questions qui montrent que vous avez déjà réfléchi à son poste. Le test ultime : pouvez-vous tenir une conversation de pair à pair sur les enjeux réels du business ?",
      },
    ],
  },
  {
    id: "storytelling",
    icon: <MessagesSquare size={18} />,
    title: "Storytelling de son parcours de leader",
    content: [
      {
        q: "Pourquoi le storytelling est crucial au niveau COMEX",
        a: "À ce niveau, tout le monde a un bon CV. Ce qui différencie un candidat, c'est sa capacité à faire vivre son parcours comme une trajectoire cohérente et inspirante. Les jurys se souviennent des histoires, pas des listes de réalisations. Votre récit doit répondre à trois questions : D'où venez-vous ? Qui êtes-vous devenu ? Où allez-vous ?",
      },
      {
        q: "La structure du récit exécutif",
        a: "Acte 1 — L'ascension : vos premiers postes à responsabilité, les mentors qui vous ont formé, les valeurs que vous avez construites. Acte 2 — La transformation : le moment où vous êtes passé de manager à leader, la crise qui a révélé votre vrai style de leadership, l'impact que vous avez eu à grande échelle. Acte 3 — La vision : pourquoi ce poste est la suite logique de votre parcours, ce que vous voulez accomplir, l'héritage que vous souhaitez laisser.",
      },
      {
        q: "Les 3 règles d'or",
        a: "1. Authenticité sélective — soyez vrai mais stratégique. Ne révélez que ce qui sert votre narrative. 2. Chiffres émotionnels — un chiffre seul est froid. Associez-le à un contexte humain : « J'ai doublé le CA, mais surtout j'ai sauvé 200 emplois. » 3. Boucle de fermeture — chaque histoire doit revenir à votre thèse centrale. Si vous parlez de résilience, le dernier mot doit être résilience.",
      },
    ],
  },
  {
    id: "questions-candidat",
    icon: <ListChecks size={18} />,
    title: "Les 10 questions à poser en tant que candidat dirigeant",
    content: [
      {
        q: "1. Quelle est la décision la plus difficile que le COMEX devra prendre dans les 12 prochains mois ?",
        a: "Cette question révèle immédiatement la maturité stratégique de votre interlocuteur et vous positionne comme un pair déjà tourné vers l'action.",
      },
      {
        q: "2. Comment définissez-vous le succès pour ce poste à 6 mois, 12 mois et 3 ans ?",
        a: "Permet de calibrer les attentes réelles et d'identifier si l'entreprise a une vision claire du rôle. Méfiez-vous des réponses vagues.",
      },
      {
        q: "3. Quelle est la composition actuelle du COMEX et comment les décisions y sont-elles vraiment prises ?",
        a: "Question qui teste la transparence de la gouvernance. Un dirigeant honnête vous décrira les dynamiques politiques, pas seulement l'organigramme.",
      },
      {
        q: "4. Qu'est-ce qui a motivé le départ de mon prédécesseur ?",
        a: "Essentielle pour comprendre les pièges à éviter. Si la réponse est évasive, considérez cela comme un signal d'alarme.",
      },
      {
        q: "5. Quels sont les talents clés que vous recrutez actuellement en dehors de ce poste ?",
        a: "Révèle la cohérence de la stratégie RH et la réalité des investissements dans l'équipe dirigeante.",
      },
      {
        q: "6. Comment l'entreprise investit-elle dans la formation et le développement des cadres dirigeants ?",
        a: "Un COMEX qui n'investit pas dans ses propres talents est un COMEX qui ne fidélise pas. Question filtre.",
      },
      {
        q: "7. Pouvez-vous me décrire la culture d'entreprise en trois mots, et me donner un exemple concret de chacun ?",
        a: "Les « valeurs affichées » ne sont jamais la réalité. Demandez des exemples précis pour détecter le décalage.",
      },
      {
        q: "8. Quels sont les risques que vous voyez pour l'entreprise dans les 2 à 3 prochaines années ?",
        a: "Teste la lucidité stratégique de votre futur employeur. Les bons dirigeants ont une vision claire des menaces.",
      },
      {
        q: "9. Comment évaluez-vous la performance des membres du COMEX ?",
        a: "Révèle si l'évaluation est formelle ou réelle, et si les critères sont objectifs ou politiques.",
      },
      {
        q: "10. Si je vous rejoins, quelle sera la première chose que vous voudrez que j'accomplisse ?",
        a: "La question de clôture idéale. Elle force votre interlocuteur à visualiser votre succès et conclut sur une note d'engagement mutuel.",
      },
    ],
  },
  {
    id: "gestion-stress",
    icon: <Shield size={18} />,
    title: "Gestion du stress et présence exécutive",
    content: [
      {
        q: "La présence exécutive : un savoir-être qui se prépare",
        a: "La présence exécutive représente 30% de l'évaluation selon les études sur les recrutements de direction. Elle se compose de trois piliers : le comportement non-verbal (posture, contact visuel, gestuelle mesurée), la maîtrise vocale (débit, intonation, silences stratégiques) et la gestion émotionnelle (neutralité sous pression, capacité à recentrer une conversation tendue).",
      },
      {
        q: "Techniques de préparation mentale",
        a: "Les dirigeants qui excellent en entretien ne « improvisent » pas. Ils répètent selon un protocole précis : visualisation positive (le matin de l'entretien, passez 10 minutes à vous voir réussir chaque étape), ancrage physiologique (respiration en cohérence cardiaque 5 secondes inspiration / 5 secondes expiration avant chaque réponse sensible), préparation des 3 messages clés que vous voulez absolument passer, quel que soit le fil de la conversation.",
      },
      {
        q: "Exercice du « Board Ready »",
        a: "L'exercice ultime pour atteindre un niveau de préparation optimal : filmez-vous en répondant aux 10 questions les plus difficiles. Analysez votre langage corporel : les micromouvements de stress (toucher son visage, croiser les bras, balancement) sont immédiatement perçus par des recruteurs aguerris. Entraînez-vous à parler debout (comme lors d'une présentation au board) plutôt qu'assis — cela projette naturellement plus d'autorité.",
      },
    ],
  },
  {
    id: "panel-interview",
    icon: <Users size={18} />,
    title: "Préparation au panel interview / jury board",
    content: [
      {
        q: "La spécificité du jury board",
        a: "Le panel interview (ou jury board) est l'ultime étape des recrutements COMEX. Vous faites face à 3 à 6 personnes : souvent le DG, un membre du conseil, un investisseur, parfois un pair fonctionnel. Chaque membre a ses propres critères — le DG cherche un bras droit, l'investisseur cherche la création de valeur, le membre du conseil cherche la gouvernance. Votre défi : répondre à tous simultanément.",
      },
      {
        q: "La technique du « triple codage »",
        a: "Pour chaque réponse, adressez les trois niveaux d'audience : stratégique (au DG — vision, ambition, impact), financier (à l'investisseur — ROI, EBITDA, risque maîtrisé), humain (au RH / membre du conseil — culture, talents, succession). Une réponse qui ne parle qu'à un seul membre est une opportunité manquée. Entraînez-vous à faire des « balayages » visuels : commencez par le DG, accrochez l'investisseur, concluez sur le membre du conseil.",
      },
      {
        q: "Gérer les questions croisées",
        a: "En panel, les questions s'enchaînent et se chevauchent. Un membre peut interrompre votre réponse à un autre. La règle d'or : ne perdez jamais votre calme. Si l'on vous coupe, arrêtez-vous immédiatement, écoutez, répondez à la nouvelle question, puis rebouclez élégamment : « Pour compléter le point que j'évoquais sur la gouvernance… » — cela montre votre agilité mentale et votre sang-froid.",
      },
      {
        q: "La présentation liminaire",
        a: "La plupart des panels commencent par une présentation de 5 à 10 minutes. Structure impérative : 30% sur votre parcours (uniquement les faits saillants qui préparent votre thèse), 40% sur votre compréhension des enjeux de l'entreprise (preuve que vous avez fait votre due diligence), 30% sur votre vision pour le poste (les 3 chantiers prioritaires des 100 premiers jours). Terminez toujours par une question ouverte qui engage le dialogue.",
      },
    ],
  },
];

export default function RessourcesEntretienPage() {
  return (
    <div style={{ background: C.ivory, minHeight: "100vh", color: C.text }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600;700&display=swap');
          * { font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
        `}
      </style>

      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: C.forest,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/prsto/ressources"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                transition: "color .2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = C.gold;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <ArrowLeft size={14} /> Ressources
            </Link>
            <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              Préparation aux entretiens de direction
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: C.gold,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <Star size={12} fill={C.gold} /> Guide exclusif PRSTO
          </div>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(180deg, #103826 0%, #0a2b1d 100%)",
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(228,177,24,0.04) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 60%, rgba(16,56,38,0.3) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 100,
              background: "rgba(228,177,24,0.12)",
              border: "1px solid rgba(228,177,24,0.15)",
              fontSize: 12,
              fontWeight: 600,
              color: C.gold,
              marginBottom: 24,
              letterSpacing: "0.04em",
            }}
          >
            <Target size={12} /> Recrutement COMEX & C-Suite
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              color: "white",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
            }}
          >
            Maîtrisez l&apos;art de l&apos;entretien de direction
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 600,
              margin: "0 auto 32px",
            }}
          >
            Les entretiens COMEX ne se gagnent pas sur votre CV. Ils se gagnent sur votre capacité à
            incarner la vision, à répondre sous pression et à inspirer confiance à des pairs exigeants.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`#${s.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 100,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(228,177,24,0.12)";
                  el.style.borderColor = "rgba(228,177,24,0.2)";
                  el.style.color = C.gold;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.color = "rgba(255,255,255,0.5)";
                }}
              >
                {s.title.split(" ").slice(0, 3).join(" ")}&hellip;
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        {/* Chapter navigation */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 48,
            padding: 24,
            background: "white",
            borderRadius: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: C.muted,
              marginBottom: 12,
            }}
          >
            Dans ce guide
          </div>
          {sections.map((s, i) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                textDecoration: "none",
                borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : "none",
                transition: "color .2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = C.forest;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = C.text;
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: C.light,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </span>
              {s.title}
              <ChevronRight
                size={12}
                style={{ marginLeft: "auto", color: C.muted, flexShrink: 0 }}
              />
            </Link>
          ))}
        </div>

        {/* Sections */}
        {sections.map((section, si) => (
          <section
            key={section.id}
            id={section.id}
            style={{
              marginBottom: si < sections.length - 1 ? 48 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: C.forest,
                  color: C.gold,
                  flexShrink: 0,
                }}
              >
                {section.icon}
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.text,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {section.title}
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {section.content.map((item, ci) => (
                <div
                  key={ci}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    padding: "20px 24px",
                    transition: "box-shadow .2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 20px rgba(16,56,38,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.forest,
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.q}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: C.text,
                    }}
                  >
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div
          style={{
            marginTop: 64,
            padding: "40px 32px",
            background: C.forest,
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "white",
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}
          >
            Préparez vos entretiens avec PRSTO
          </h3>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 480,
              margin: "0 auto 24px",
            }}
          >
            Notre IA vous prépare aux questions pièges, simule des jurys boards et affine votre
            storytelling exécutif. Rejoignez les dirigeants qui décrochent leur poste COMEX.
          </p>
          <Link
            href="/prsto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 32px",
              borderRadius: 100,
              background: C.gold,
              color: C.text,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              transition: "opacity .2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            Découvrir PRSTO <ChevronRight size={14} />
          </Link>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: 12,
            color: C.muted,
          }}
        >
          <Link
            href="/prsto/ressources"
            style={{
              color: C.muted,
              textDecoration: "none",
              borderBottom: "1px solid rgba(11,31,24,0.15)",
              transition: "color .2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = C.muted;
            }}
          >
            ← Retour aux ressources PRSTO
          </Link>
        </div>
      </div>
    </div>
  );
}
