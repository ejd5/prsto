"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Rocket, Users, UserPlus, Building, AlertTriangle, Target, Shield, Star } from "lucide-react";

const C = {
  forest: "#103826",
  gold: "#E4B118",
  ivory: "#FAF6EF",
  text: "#0B1F18",
  muted: "rgba(11,31,24,0.55)",
  lightMuted: "rgba(255,255,255,0.5)",
  border: "rgba(16,56,38,0.08)",
  cardBg: "rgba(255,255,255,0.6)",
};

const sections = [
  {
    id: "90-jours",
    icon: <Rocket size={20} />,
    title: "Les 90 premiers jours dans un poste de direction",
    subtitle: "La fenêtre qui définit votre mandat",
    content: [
      "Les 90 premiers jours d'un dirigeant ne sont pas une période d'adaptation — ce sont les fondations de tout votre mandat. Les équipes, le comité et le marché vous observent, jugent votre style, testent vos convictions. Ce que vous faites (ou ne faites pas) entre le jour 1 et le jour 90 conditionne 80% de votre crédibilité à long terme.",
      "Les dirigeants les plus performants suivent un plan en trois phases :",
    ],
    phases: [
      {
        phase: "1-30",
        title: "Écoute active et diagnostic",
        desc: "Ne décidez pas avant d'avoir compris. Menez 30 à 50 entretiens individuels avec vos N-1, vos pairs, vos clients internes et externes. L'objectif n'est pas d'impressionner — c'est d'identifier les dynamiques invisibles, les alliés naturels, les angles morts et les 'chantiers qui brûlent'. Tenez un journal de bord. N'annoncez aucune décision structurante avant J+45."
      },
      {
        phase: "30-60",
        title: "Annonce de la vision et premiers symboles",
        desc: "Vous avez compris le terrain. Maintenant, communiquez votre cap. Présentez votre diagnostic en comité, partagez vos priorités à 6-12 mois, et adressez un ou deux 'quick wins' visibles — des décisions rapides qui montrent que vous agissez sans être précipité. Un budget débloqué, un processus simplifié, un problème résolu depuis des mois."
      },
      {
        phase: "60-90",
        title: "Structuration et passage à l'échelle",
        desc: "Les quick wins ont créé la confiance. Vous pouvez maintenant structurer : réorganisation des équipes, mise en place de nouveaux rituels de pilotage, ajustements stratégiques. Vos décisions sont légitimes parce que précédées d'écoute et de résultats. À J+90, vous devez pouvoir dire : 'Voici où nous allons, voici pourquoi, et voici les premières preuves que cela fonctionne.'"
      },
    ],
    cta: "Téléchargez le template de plan d'intégration dirigeant PRSTO",
  },
  {
    id: "legitimite",
    icon: <Shield size={20} />,
    title: "Asseoir sa légitimité face à une équipe existante",
    subtitle: "Arriver de l'extérieur et gagner la confiance",
    content: [
      "Vous arrivez de l'extérieur, vous êtes le 'nouveau' — et votre équipe vous teste. Pas par malveillance, mais parce qu'ils ont besoin de savoir si vous êtes compétent, fiable, et digne de confiance. La légitimité ne se décrète pas, elle se construit décision après décision.",
      "Trois leviers pour accélérer cette construction :",
    ],
    levers: [
      {
        icon: <Star size={18} />,
        title: "La compétence technique",
        desc: "Montrez que vous maîtrisez le métier. Posez les bonnes questions, challenguez les chiffres, démontrez une compréhension fine des enjeux. Un dirigeant qui 'ne sait pas mais apprend vite' inspire confiance. Un dirigeant qui 'fait semblant' est démasqué en une réunion."
      },
      {
        icon: <Users size={18} />,
        title: "La compétence relationnelle",
        desc: "Un dirigeant juste et cohérent construit une équipe loyale. Tenez vos engagements, donnez du crédit publiquement, recadrez en privé, écoutez autant que vous parlez. La légitimité relationnelle se gagne dans les couloirs autant que dans la salle de réunion."
      },
      {
        icon: <Target size={18} />,
        title: "Les résultats précoces",
        desc: "Rien ne construit la légitimité plus vite qu'une victoire. Identifiez un problème que tout le monde connaît mais que personne n'a résolu, et résolvez-le. Un collaborateur qui vous voit débloquer une situation bloquée depuis 18 mois vous accordera une confiance que vous n'auriez pas gagnée en 6 mois de discours."
      },
    ],
    contentEnd: [
      "Rappelez-vous : votre équipe existante n'attend pas un sauveur. Elle attend un leader qui la rendra meilleure. Montrez que vous êtes là pour les servir, pas pour les 'manager'. La différence est subtile mais décisive.",
    ],
  },
  {
    id: "promotion-interne",
    icon: <UserPlus size={20} />,
    title: "Manager ses pairs et son ancien collègue (promotion interne)",
    subtitle: "Le défi le plus délicat du dirigeant promu",
    content: [
      "Vous avez été promu. Félicitations. Mais demain, vous devrez manager ceux qui étaient vos pairs — parfois vos amis. Cette transition est l'une des plus périlleuses de la carrière d'un dirigeant. Les relations changent, les attentes aussi, et les non-dits s'accumulent.",
      "Les règles d'or d'une transition réussie :",
    ],
    rules: [
      {
        title: "La conversation de clarification",
        desc: "Dès votre nomination, organisez un entretien individuel avec chaque ancien pair. Dites clairement : 'Notre relation change. Je serai votre manager. Je veux que vous réussissiez. Mais je dois pouvoir vous challenger et prendre des décisions qui ne vous plairont pas toujours. Acceptez-vous ce nouveau contrat ?' Ceux qui refusent devront peut-être faire leur chemin ailleurs."
      },
      {
        title: "Pas de favoritisme — pas de dureté compensatoire",
        desc: "Ne sur-compensez pas votre ancienne proximité par une distance artificielle ou une dureté excessive. Traitez vos anciens pairs avec la même exigence que le reste de l'équipe. Ni plus, ni moins. La cohérence est votre meilleure alliée. Le moindre signe de favoritisme (ou de défaveur) sera amplifié par le collectif."
      },
      {
        title: "Repositionnez-vous comme le leader, pas comme l'ami",
        desc: "Vous pouvez rester chaleureux et accessible, mais votre priorité est désormais l'intérêt de l'équipe et de l'entreprise. Un déjeuner entre amis peut devenir un piège si vous devez demain prendre une décision difficile. Fixez des limites claires entre la relation personnelle et la relation professionnelle. Et tenez-vous-y."
      },
      {
        title: "Gérez les ego et les ambitions déçues",
        desc: "Certains de vos anciens pairs pensaient obtenir le poste. Ils sont déçus, parfois amers. Vous devez les reconquérir — ou les aider à partir si l'alignement est impossible. Un collaborateur qui reste par dépit après une promotion refusée est un risque pour votre équipe. Donnez-lui une mission exigeante ou aidez-le à trouver sa voie ailleurs."
      },
    ],
  },
  {
    id: "culture-entreprise",
    icon: <Building size={20} />,
    title: "Culture d'entreprise : comment l'évaluer avant d'accepter",
    subtitle: "Le filtre invisible qui décide de votre succès ou de votre échec",
    content: [
      "80% des échecs d'intégration de cadres dirigeants sont liés à un choc culturel, pas à un manque de compétences. Vous pouvez être le meilleur CFO du monde — si vous arrivez dans une entreprise où la prise de décision est collective et informelle alors que vous fonctionnez en silos hiérarchiques, l'échec est programmé.",
      "Comment évaluer la culture avant d'accepter :",
    ],
    methods: [
      {
        label: "Les entretiens miroirs",
        desc: "Ne parlez pas qu'avec votre futur N+1. Demandez à rencontrer 3 à 5 personnes de l'équipe sans votre futur manager présent. Observez comment ils parlent de l'entreprise, de leurs collègues, des décisions récentes. La liberté de ton, la franchise, la fierté — ou leur absence — sont des signaux fiables."
      },
      {
        label: "Le test du désaccord",
        desc: "Posez une question controversée lors d'un entretien : 'Sur quel sujet récent êtes-vous en profond désaccord avec la direction ?' La réponse vous en dit plus sur la culture que 10 slides de valeurs d'entreprise. Une culture saine accepte le débat. Une culture toxique le sanctionne."
      },
      {
        label: "L'audit des rituels",
        desc: "Demandez à assister à une réunion d'équipe ou un comité. Observez : qui parle le plus ? Qui est interrompu ? Les décisions sont-elles prises dans la salle ou après ? Les slides sont-ils une aide ou une prison ? Les rituels sont l'ADN visible de la culture."
      },
      {
        label: "Le baromètre du turnover",
        desc: "Regardez le départ des talents. Qui est parti dans les 24 derniers mois ? Pourquoi ? Quels profils ? Un turnover élevé parmi les N-1 de votre futur poste est un signal d'alarme. Les gens ne quittent pas les entreprises — ils quittent les managers et les cultures dysfonctionnelles."
      },
    ],
    quote: {
      text: "La culture mange la stratégie au petit-déjeuner.",
      author: "— Peter Drucker, et tant de dirigeants qui l'ont appris à leurs dépens",
    },
  },
  {
    id: "pieges",
    icon: <AlertTriangle size={20} />,
    title: "Pièges à éviter en prise de poste",
    subtitle: "Les erreurs que les dirigeants regrette le plus souvent",
    content: [
      "Même les dirigeants les plus préparés tombent dans des pièges classiques. La pression du début de mandat, le désir de bien faire, l'urgence des premiers jours — tout conspire à vous faire commettre des erreurs évitables. Voici les plus fréquentes et comment les contourner.",
    ],
    traps: [
      {
        trap: "Arriver en sauveur",
        problem: "Vous voulez montrer que vous valez votre salaire. Vous annoncez des changements radicaux dès les premières semaines. Problème : vous n'avez pas encore compris les dynamiques locales, les alliances, les sensibilités politiques.",
        solution: "Adoptez la posture du 'humble challenger' : curieux, exigeant, mais pas omniscient. Vos équipes préfèrent un leader qui apprend vite à un leader qui sait tout.",
      },
      {
        trap: "Changer l'équipe trop vite",
        problem: "Vous identifiez rapidement les 'maillons faibles' et voulez les remplacer. Mais partir en guerre contre l'existant avant d'avoir bâti votre crédibilité est suicidaire.",
        solution: "Donnez à chacun 90 jours pour prouver sa valeur sous votre leadership. Certains se révèleront. Les autres, vous pourrez les remplacer avec l'appui du comité et de l'équipe — parce que vous aurez pris le temps de démontrer l'inadéquation.",
      },
      {
        trap: "Négliger les parties prenantes périphériques",
        problem: "Vous vous concentrez sur votre équipe directe et oubliez les fonctions support, les syndicats, les clients clés, les actionnaires minoritaires. Ces 'parties prenantes silencieuses' peuvent bloquer vos décisions.",
        solution: "Établissez une cartographie complète des parties prenantes dès J+15. Qui a du pouvoir ? Qui a de l'influence ? Qui peut dire 'non' à vos projets ? Investissez du temps avec chacun avant d'en avoir besoin.",
      },
      {
        trap: "Sous-estimer le coût politique du changement",
        problem: "Une décision rationnelle n'est jamais purement rationnelle dans une organisation. Chaque changement crée des gagnants et des perdants. Ignorer les dynamiques de pouvoir, c'est construire sur du sable.",
        solution: "Avant chaque décision importante, faites l'exercice : 'qui gagne ? qui perd ? qui peut me bloquer ?' Si vous ne pouvez pas répondre, vous n'êtes pas prêt à décider. L'intelligence politique n'est pas de la manipulation — c'est de la lucidité.",
      },
      {
        trap: "Travailler 80h/semaine pour 'faire ses preuves'",
        problem: "Vous pensez que l'hyper-présence est un signe d'engagement. Elle est perçue comme un manque de confiance en vous et un défaut de délégation. Un dirigeant qui travaille 80h n'est pas un bon dirigeant — c'est un goulet d'étranglement.",
        solution: "Dès J+30, établissez vos rythmes de travail durables. Déléguez, faites confiance, protégez votre énergie. Votre endurance est un actif stratégique pour les 3-5 ans à venir, pas pour les 3 premiers mois.",
      },
    ],
  },
];

const resources = [
  { title: "Template plan d'intégration 90 jours", type: "PDF", color: C.forest },
  { title: "Checklist parties prenantes dirigeant", type: "PDF", color: C.forest },
  { title: "Guide : évaluation culture d'entreprise", type: "DOCX", color: C.forest },
  { title: "Modèle entretien J+30 diagnostic équipe", type: "DOCX", color: C.forest },
  { title: "Calculateur de quick wins dirigeant", type: "Outil", color: C.gold },
];

export default function PrisePostePage() {
  return (
    <div style={{ background: C.ivory, minHeight: "100vh", fontFamily: "'Geist', 'Inter', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .heading { font-family: 'Plus Jakarta Sans', sans-serif; }
        .body { font-family: 'Geist', 'Inter', sans-serif; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.forest, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/prsto/ressources"
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: C.lightMuted }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.gold}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.lightMuted}
            >
              <ArrowLeft size={14} /> Ressources
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Prise de poste</span>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ background: C.forest, overflow: "hidden" }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-28 relative">
          <div style={{ position: "absolute", top: "-40%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(228,177,24,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div className="max-w-3xl relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <span style={{ background: "rgba(228,177,24,0.15)", color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100 }}>Guide stratégique</span>
            </div>
            <h1 className="heading" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1, color: "white", marginBottom: 20, letterSpacing: "-0.02em" }}>
              Prise de poste<br />
              <span style={{ color: C.gold }}>&nbsp;&amp; 90 premiers jours</span>
            </h1>
            <p className="body" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.7)", maxWidth: 600 }}>
              Votre intégration en tant que dirigeant ne s&apos;improvise pas. Asseoir sa légitimité, naviguer la culture, éviter les pièges — voici comment réussir dès le premier jour.
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION DES SECTIONS */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,246,239,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid", borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="heading"
              style={{
                whiteSpace: "nowrap",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.02em",
                padding: "6px 14px",
                borderRadius: 100,
                color: C.muted,
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(16,56,38,0.06)"; el.style.color = C.text; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = C.muted; }}
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24">

        {/* INTRO BLOCK */}
        <div className="grid grid-cols-5 gap-12 items-start">
          <div className="col-span-3">
            <p className="body" style={{ fontSize: 20, lineHeight: 1.8, color: C.text, fontWeight: 400 }}>
              La prise de poste est le moment le plus exposé de votre mandat. Vous êtes attendu, observé, jugé — souvent sur des critères que vous ne maîtrisez pas. Mais c&apos;est aussi le moment où tout est possible. Les équipes sont ouvertes, les attentes sont hautes, et le champ des possibles est immense.
            </p>
          </div>
          <div className="col-span-2" style={{ padding: 24, background: "white", borderRadius: 16, border: "1px solid", borderColor: C.border }}>
            <div className="heading" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>Dans ce guide</div>
            <ul className="space-y-3">
              {sections.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span style={{ color: C.gold, marginTop: 1, flexShrink: 0 }}>—</span>
                  <a href={`#${s.id}`} className="heading" style={{ fontSize: 14, fontWeight: 500, textDecoration: "none", color: C.text, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.gold}
                    onMouseLeave={e => e.currentTarget.style.color = C.text}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MAIN SECTIONS */}
        {sections.map((section, idx) => (
          <section key={section.id} id={section.id}>
            <div className="grid grid-cols-5 gap-12">
              {/* Sidebar */}
              <div className="col-span-2">
                <div style={{ position: "sticky", top: 100 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                      {section.icon}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>
                      Chapitre {idx + 1}
                    </span>
                  </div>
                  <h2 className="heading" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: C.forest, marginBottom: 8, letterSpacing: "-0.01em" }}>
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p className="heading" style={{ fontSize: 16, fontWeight: 500, color: C.gold, marginBottom: 16 }}>{section.subtitle}</p>
                  )}
                  <div style={{ width: 40, height: 3, background: C.gold, borderRadius: 2, marginTop: 8 }} />
                </div>
              </div>

              {/* Content */}
              <div className="col-span-3 space-y-6">
                <div className="space-y-5">
                  {section.content.map((p, i) => (
                    <p key={i} className="body" style={{ fontSize: 15, lineHeight: 1.8, color: C.text }}>{p}</p>
                  ))}
                </div>

                {/* Phases for section 1 */}
                {section.phases && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
                    {section.phases.map((p, i) => (
                      <div key={i} style={{ padding: 20, background: "white", borderRadius: 14, border: "1px solid", borderColor: C.border }}>
                        <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 100, background: "rgba(228,177,24,0.12)", marginBottom: 10 }}>
                          <span className="heading" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: C.gold }}>Jours {p.phase}</span>
                        </div>
                        <div className="heading" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{p.title}</div>
                        <div className="body" style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Levers for section 2 */}
                {section.levers && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
                    {section.levers.map((l, i) => (
                      <div key={i} style={{ padding: 20, background: "white", borderRadius: 14, border: "1px solid", borderColor: C.border }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, marginBottom: 10 }}>
                          {l.icon}
                        </div>
                        <div className="heading" style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{l.title}</div>
                        <div className="body" style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>{l.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
                {section.contentEnd && (
                  <div className="space-y-5" style={{ marginTop: 16 }}>
                    {section.contentEnd.map((p, i) => (
                      <p key={i} className="body" style={{ fontSize: 15, lineHeight: 1.8, color: C.text }}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Rules for section 3 */}
                {section.rules && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 20 }}>
                    {section.rules.map((r, i) => (
                      <div key={i} style={{ padding: 20, background: "white", borderRadius: 14, border: "1px solid", borderColor: C.border }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span className="heading" style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{i + 1}</span>
                          </div>
                          <div className="heading" style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{r.title}</div>
                        </div>
                        <div className="body" style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Methods for section 4 */}
                {section.methods && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 20 }}>
                    {section.methods.map((m, i) => (
                      <div key={i} style={{ padding: 20, background: "white", borderRadius: 14, border: "1px solid", borderColor: C.border }}>
                        <div className="heading" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", color: C.gold, marginBottom: 6 }}>
                          {m.label}
                        </div>
                        <div className="body" style={{ fontSize: 12, lineHeight: 1.6, color: C.muted }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>
                )}
                {section.quote && (
                  <div style={{ marginTop: 28, padding: "24px 28px", background: C.forest, borderRadius: 16, borderLeft: "4px solid", borderColor: C.gold }}>
                    <p className="heading" style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 500, fontStyle: "italic", color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>
                      &ldquo;{section.quote.text}&rdquo;
                    </p>
                    <p className="heading" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{section.quote.author}</p>
                  </div>
                )}

                {/* Traps for section 5 */}
                {section.traps && (
                  <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                    {section.traps.map((t, i) => (
                      <div key={i} style={{ padding: "20px 24px", background: "white", borderRadius: 14, border: "1px solid", borderColor: C.border }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(228,177,24,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                            <span className="heading" style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>{String(i + 1).padStart(2, "0")}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="heading" style={{ fontSize: 16, fontWeight: 700, color: C.forest, marginBottom: 8 }}>{t.trap}</div>
                            <div style={{ marginBottom: 10 }}>
                              <div className="heading" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(228,177,24,0.7)", marginBottom: 4 }}>Le piège</div>
                              <p className="body" style={{ fontSize: 13, lineHeight: 1.7, color: C.muted }}>{t.problem}</p>
                            </div>
                            <div>
                              <div className="heading" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: C.forest, marginBottom: 4 }}>La solution</div>
                              <p className="body" style={{ fontSize: 13, lineHeight: 1.7, color: C.text }}>{t.solution}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}

        {/* RESSOURCES TÉLÉCHARGEABLES */}
        <section>
          <div className="text-center mb-12">
            <h2 className="heading" style={{ fontSize: 32, fontWeight: 700, color: C.forest, marginBottom: 12, letterSpacing: "-0.01em" }}>
              Ressources pour votre prise de poste
            </h2>
            <p className="body" style={{ fontSize: 15, color: C.muted, maxWidth: 500, margin: "0 auto" }}>
              Templates, guides et outils concrets pour réussir votre intégration de dirigeant.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {resources.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 16px",
                  background: "white",
                  borderRadius: 14,
                  border: "1px solid",
                  borderColor: C.border,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = C.gold; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(16,56,38,0.08)"; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = C.border; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: r.color === C.gold ? C.gold : C.muted, marginBottom: 8 }}>{r.type}</div>
                <div className="heading" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: C.text }}>{r.title}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ background: C.forest, borderRadius: 24, padding: "56px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(228,177,24,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <h2 className="heading" style={{ fontSize: 34, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "-0.01em" }}>
              Prêt à réussir votre prise de poste ?
            </h2>
            <p className="body" style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 480, margin: "0 auto 28px" }}>
              PRSTO vous accompagne avant, pendant et après votre intégration — de la préparation à l&apos;ancrage de votre leadership.
            </p>
            <Link
              href="/prsto"
              className="heading"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: C.gold,
                color: C.text,
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 100,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = "#D4A215"; el.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = C.gold; el.style.transform = "translateY(0)"; }}
            >
              Découvrir PRSTO <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <div style={{ borderTop: "1px solid", borderColor: C.border, marginTop: 24 }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/prsto/ressources" className="heading" style={{ fontSize: 12, fontWeight: 500, color: C.muted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.muted}
            >
              ← Toutes les ressources
            </Link>
          </div>
          <div className="body" style={{ fontSize: 11, color: C.muted }}>
            PRSTO — Copilote carrière IA pour cadres dirigeants
          </div>
        </div>
      </div>
    </div>
  );
}
