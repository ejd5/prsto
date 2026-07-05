"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle, Target, Users, Briefcase, Building, TrendingUp, RefreshCw, Shield, Compass, Lightbulb } from "lucide-react";

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
    id: "reconversion",
    icon: <RefreshCw size={20} />,
    title: "Reconversion professionnelle",
    subtitle: "Pour cadres dirigeants",
    content: [
      "La reconversion d'un cadre dirigeant n'est pas un aveu d'échec — c'est un acte stratégique. Vous possédez un capital de compétences transférables que peu de profils sur le marché peuvent aligner : vision stratégique, gestion de P&L, leadership transformationnel, gouvernance.",
      "Contrairement aux idées reçues, les compétences exécutives se monnaient cher dans des secteurs où la maturité de gestion n'a pas encore rattrapé l'ambition. PME en croissance, ETI à structurer, fonds d'investissement, scale-ups en phase de professionnalisation — tous recherchent des profels comme vous.",
      "La clé ? Savoir traduire votre langage de grand groupe en impact mesurable pour une structure plus agile. Et c'est exactement ce que PRSTO vous aide à formuler.",
    ],
    stats: [
      { value: "68%", label: "des cadres dirigeants envisagent une reconversion dans les 3 ans" },
      { value: "42%", label: "ont déjà entamé une démarche de reconversion" },
      { value: "2.4x", label: "multiplicateur de satisfaction pro après reconversion réussie" },
    ],
  },
  {
    id: "non-executif",
    icon: <Users size={20} />,
    title: "Passage au non-exécutif",
    subtitle: "Mandats d'administrateur & conseil",
    content: [
      "Le mandat d'administrateur est l'aboutissement naturel d'une carrière de direction. Vous passez de l'exécution à la surveillance stratégique, de la gestion d'équipe à la gouvernance d'entreprise. Votre valeur n'est plus dans ce que vous faites, mais dans ce que vous savez.",
      "Le conseil d'administration cherche des profels capables de challenger une stratégie, d'évaluer des risques, de valider des décisions majeures. Votre parcours de dirigeant vous prépare à ce rôle — encore faut-il savoir le valoriser.",
      "PRSTO vous accompagne dans la construction de votre profil d'administrateur : mise en valeur de votre expérience de gouvernance, préparation aux entretiens de nomination committee, ciblage des conseils d'administration correspondant à votre profil.",
    ],
  },
  {
    id: "portfolio-career",
    icon: <Briefcase size={20} />,
    title: "Portfolio Career",
    subtitle: "Entreprise, consulting, mandats — tout, simultanément",
    content: [
      "Le portfolio career est le nouveau standard des dirigeants accomplis. Vous ne choisissez plus entre une voie et une autre — vous construisez un écosystème professionnel où chaque activité nourrit les autres : conseil, mandats, entreprise, enseignement, investissement.",
      "Cette approche réduit le risque (pas de dépendance à un seul revenu), augmente la résilience (un mandat se termine ? Vos autres activités continuent), et surtout amplifie votre impact. Chaque rôle enrichit votre perspective et votre valeur sur les autres.",
      "Construire un portfolio career demande une stratégie claire : combien de temps consacrer à chaque activité ? Quelles sont les synergies ? Comment éviter la dispersion ? PRSTO vous aide à structurer et piloter votre écosystème professionnel.",
    ],
  },
  {
    id: "independant",
    icon: <TrendingUp size={20} />,
    title: "De salarié à indépendant",
    subtitle: "Le saut — et comment l'amortir",
    content: [
      "Passer du statut de salarié à celui d'indépendant est l'une des transitions les plus radicales pour un cadre dirigeant. Vous perdez la sécurité du salaire mensuel, l'équipe, les ressources, mais vous gagnez en liberté, en alignement avec vos valeurs, et en potentiel de rémunération.",
      "La clé d'une transition réussie ? La préparation. Avant de quitter votre poste, bâtissez votre pipeline de clients, structurez votre offre, définissez votre positionnement. Un cadre dirigeant ne devient pas consultant du jour au lendemain — il prépare son lancement 6 à 12 mois à l'avance.",
      "PRSTO vous guide dans cette préparation : définition de votre offre de conseil, stratégie de pricing, prospection, structuration juridique et fiscale, et plan de transition progressif.",
    ],
  },
  {
    id: "management-transition",
    icon: <Building size={20} />,
    title: "Management de transition",
    subtitle: "Dirigeant intérimaire — l'alternative premium",
    content: [
      "Le management de transition est levier idéal pour les dirigeants qui veulent rester dans l'opérationnel sans s'attacher à long terme. Vous intervenez dans des situations critiques : redressement, croissance accélérée, restructuration, remplacement temporaire au sein du Comex.",
      "Les entreprises paient un premium pour un dirigeant capable d'avoir un impact immédiat, sans période d'adaptation. Votre valeur est dans votre capacité à diagnostiquer, décider et exécuter — dès le premier jour.",
      "Le marché du management de transition en France pèse plus de 2,5 milliards d'euros et croît de 15% par an. Les profels de direction générale, RH, finance et transformation digitale sont les plus recherchés.",
    ],
    stats: [
      { value: "15%", label: "croissance annuelle du marché du management de transition" },
      { value: "2,5 Md€", label: "poids du marché en France" },
      { value: "92%", label: "des missions confiées à des profils > 15 ans d'expérience" },
    ],
  },
  {
    id: "rebond",
    icon: <Shield size={20} />,
    title: "Rebond après un échec",
    subtitle: "Licenciement, échec, départ contraint — et après ?",
    content: [
      "Un licenciement ou un échec est un signal fort, mais il ne définit pas votre valeur. Les dirigeants qui ont connu l'échec et en sont ressortis plus forts sont souvent plus performants : ils ont appris, ils ont développé une résilience que seuls les moments difficiles forgent.",
      "Ce qui compte pour votre prochain employeur ou client, ce n'est pas l'échec lui-même, mais votre capacité à l'analyser, à en tirer des leçons, et à démontrer que vous avez changé. Un échec bien raconté devient un accélérateur de carrière.",
      "PRSTO vous accompagne dans la narration de votre rebond : reformulation de votre parcours, préparation aux entretiens sensibles, reconstruction de votre marque personnelle, et stratégie de reconquête du marché.",
    ],
    quote: {
      text: "Ce n'est pas l'échec qui compte. C'est ce que vous en faites.",
      author: "— Aristote, et tant de dirigeants qui ont rebondi",
    },
  },
  {
    id: "reprendre-main",
    icon: <Compass size={20} />,
    title: "Reprendre sa vie pro en main",
    subtitle: "Votre carrière, votre stratégie, votre calendrier",
    content: [
      "La différence entre subir sa carrière et la piloter tient à une seule chose : l'intention. Les dirigeants qui réussissent leurs transitions sont ceux qui ont pris le temps de définir ce qu'ils veulent vraiment — pas seulement leur prochain poste, mais l'architecture complète de leur vie professionnelle.",
      "Reprendre le contrôle, c'est décider de ses critères avant de regarder les offres. C'est savoir dire non aux opportunités qui ne correspondent pas à votre cap. C'est accepter une période de transition pour trouver la bonne cible plutôt que de se précipiter sur la première échappatoire.",
      "C'est exactement ce que PRSTO vous permet de faire : reprendre la main sur votre carrière avec une stratégie claire, des outils de pilotage, et un copilote IA qui vous aide à chaque décision.",
    ],
    steps: [
      { step: "1", title: "Bilan", desc: "Analysez votre situation : compétences, valeurs, contraintes, aspirations." },
      { step: "2", title: "Vision", desc: "Définissez votre cap à 3-5 ans. Quelle vie voulez-vous construire ?" },
      { step: "3", title: "Stratégie", desc: "Construisez votre plan de transition : timing, budget, étapes clés." },
      { step: "4", title: "Exécution", desc: "Passez à l'action. PRSTO est votre copilote à chaque étape." },
    ],
  },
];

const resources = [
  { title: "Guide de la reconversion dirigeant", type: "PDF", color: C.forest },
  { title: "Template de business plan consulting", type: "DOCX", color: C.forest },
  { title: "Checklist : préparation au mandat d'administrateur", type: "PDF", color: C.forest },
  { title: "Modèle de contrat de conseil", type: "DOCX", color: C.forest },
  { title: "Calculatrice de TJM pour cadres dirigeants", type: "Outil", color: C.gold },
];

export default function TransitionPage() {
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
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Transition & Réinvention</span>
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
              Transition &<br />
              <span style={{ color: C.gold }}>Réinvention</span>
            </h1>
            <p className="body" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.7)", maxWidth: 600 }}>
              Rebondir, se réinventer, changer de cap — la transition d&apos;un cadre dirigeant est le moment le plus stratégique de sa carrière. Voici comment la réussir.
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
              Vous avez passé des années à construire une carrière exceptionnelle. Et maintenant, vous sentez que le prochain chapitre ne ressemblera pas au précédent. C&apos;est normal. C&apos;est même le signe d&apos;une maturité professionnelle que peu de dirigeants atteignent.
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

                {section.stats && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
                    {section.stats.map((s, i) => (
                      <div key={i} style={{ padding: "16px 14px", background: "white", borderRadius: 12, border: "1px solid", borderColor: C.border }}>
                        <div className="heading" style={{ fontSize: 24, fontWeight: 800, color: C.gold, marginBottom: 4 }}>{s.value}</div>
                        <div className="body" style={{ fontSize: 11, lineHeight: 1.4, color: C.muted }}>{s.label}</div>
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

                {section.steps && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24 }}>
                    {section.steps.map((s, i) => (
                      <div key={i} style={{ padding: 20, background: "white", borderRadius: 14, border: "1px solid", borderColor: C.border }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                          <span className="heading" style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{s.step}</span>
                        </div>
                        <div className="heading" style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.title}</div>
                        <div className="body" style={{ fontSize: 12, lineHeight: 1.5, color: C.muted }}>{s.desc}</div>
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
              Ressources pour votre transition
            </h2>
            <p className="body" style={{ fontSize: 15, color: C.muted, maxWidth: 500, margin: "0 auto" }}>
              Templates, guides et outils concrets pour structurer votre réinvention professionnelle.
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
              Prêt à construire votre prochain chapitre ?
            </h2>
            <p className="body" style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 480, margin: "0 auto 28px" }}>
              Rejoignez les dirigeants qui utilisent PRSTO pour piloter leur carrière avec la même rigueur qu&apos;ils pilotent leurs business.
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
