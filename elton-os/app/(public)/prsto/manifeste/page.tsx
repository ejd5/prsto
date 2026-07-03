import Link from "next/link";

export const metadata = {
  title: "Manifeste PRSTO — Pourquoi un process de dirigeant ne se traite pas comme un job board",
  description:
    "Un recrutement de dirigeant dure 6 à 18 mois, traverse 7 à 12 étapes, mobilise 15 à 30 interlocuteurs. Les outils généralistes ne sont pas calibrés pour ça. PRSTO, si.",
  openGraph: {
    title: "Manifeste PRSTO — Le copilote carrière des cadres dirigeants",
    description: "Pourquoi LinkedIn, APEC et Indeed ne suffisent pas pour un poste de direction.",
    type: "article",
  },
};

const PIPELINE_STEPS = [
  { num: "01", title: "Ciblage", desc: "Définition des fonctions (DG, CEO, COO, CFO…), secteurs, packages, zones. Stratégie explicite vs opportuniste." },
  { num: "02", title: "Sourcing", desc: "Market Radar, alertes cabinets, approche directe, réseau. 70% des postes de dirigeant ne sont jamais publiés." },
  { num: "03", title: "Brief cabinet", desc: "Premier call avec chasseur. Pitch 3 min, alignement mandat, qualification mutuelle." },
  { num: "04", title: "Dossier candidat", desc: "CV exécutif + lettre + proof vault (réalisations chiffrées). Format attendu par les cabinets." },
  { num: "05", title: "1er entretien", desc: "Call RH ou chasseur, 45-60 min. Test de cohérence et alignement culturel." },
  { num: "06", title: "Étude de cas", desc: "Case pratique, plan 100 jours, présentation stratégique. 4-8h de préparation." },
  { num: "07", title: "Panel Comex", desc: "Entretien face à 3-5 membres du Comex + actionnaires. Le moment le plus critique." },
  { num: "08", title: "Références", desc: "3-5 références vérifiées par le cabinet. Anticipation indispensable." },
  { num: "09", title: "Négociation", desc: "Package complet : fixe, variable, LTI, equity, avantages, préavis, non-concurrence." },
  { num: "10", title: "Onboarding", desc: "Plan 100 jours, communication interne, premier Comex. Souvent négligé." },
];

export default function ManifestePage() {
  return (
    <main style={{ background: "#FAF6EF", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0B2E21 0%, #0E3A29 100%)",
        color: "white",
        padding: "100px 0 120px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: -200, right: -100,
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(228,177,24,0.12), transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid rgba(228,177,24,0.3)",
            background: "rgba(228,177,24,0.08)",
            color: "#F2C94C",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E4B118" }} />
            Manifeste PRSTO
          </div>

          <h1 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: 24,
            color: "white",
          }}>
            Un poste de direction<br />
            <span style={{
              background: "linear-gradient(90deg, #E4B118 0%, #F2C94C 50%, #E4B118 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              ne se trouve pas.
            </span>{" "}
            <br />Il se conquiert.
          </h1>

          <p style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.8)",
            maxWidth: 700,
            marginBottom: 32,
          }}>
            Si vous lisez cette page, vous êtes probablement cadre dirigeant — DG, DGD, CEO, COO, CFO, Country Manager, VP. Vous savez que votre recherche d'emploi ne ressemble à aucune autre. Ce manifeste explique pourquoi, et comment PRSTO a été conçu pour cette réalité.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/demarrage"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 24px",
                borderRadius: 12,
                background: "#E4B118",
                color: "#082E1E",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(228,177,24,0.3)",
              }}
            >
              Commencer ma campagne →
            </Link>
            <Link
              href="/prsto"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 24px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Voir les 18 outils
            </Link>
          </div>
        </div>
      </section>

      {/* Le constat */}
      <section style={{ padding: "80px 0" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#E4B118",
            marginBottom: 16,
          }}>
            Le constat
          </div>
          <h2 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "#0B1F18",
            marginBottom: 32,
          }}>
            Les outils généralistes ne sont pas calibrés pour les dirigeants.
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}>
            <Stat number="6-18" unit="mois" label="Durée moyenne d'un process de dirigeant" />
            <Stat number="7-12" unit="étapes" label="Du premier call à la signature" />
            <Stat number="15-30" unit="personnes" label="Interlocuteurs mobilisés" />
            <Stat number="70%" unit="" label="Postes non publiés (marché caché)" />
          </div>

          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#50625A", marginBottom: 24 }}>
            Pendant que les outils grand public vous proposent de <strong style={{ color: "#0B1F18" }}>"postuler en 1 clic"</strong>, votre réalité est toute autre. Vous traversez un process de 6 à 18 mois, avec 7 à 12 étapes, face à 15 à 30 interlocuteurs (cabinets, DRH, pairs, board, consultants). Vous ne pouvez pas vous permettre de postuler en masse — votre réputation se joue à chaque échange.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#50625A", marginBottom: 24 }}>
            <strong style={{ color: "#0B1F18" }}>LinkedIn, APEC, Indeed, Welcome to the Jungle</strong> — aucun de ces outils n'a été pensé pour vous. Ils ont été conçus pour le volume, pas pour la nuance. Pour les cadres intermédiaires qui postulent à 50 offres par semaine, pas pour les dirigeants qui en ciblent 3 par mois.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "#50625A" }}>
            Quant aux cabinets de chasse (Michael Page, Robert Walters, Odgers Berndtson), ils vous appellent — vous ne les appelez pas. Et quand ils le font, ils ne vous donnent aucun outil : à vous de gérer votre CV, votre préparation, votre suivi, votre CRM personnel. <strong style={{ color: "#0B1F18" }}>Vous êtes un dirigeant en quête d'un poste. Mais aussi un chef de projet qui gère une campagne complexe, sans équipe, sans outil, sans mémoire.</strong>
          </p>
        </div>
      </section>

      {/* Le pipeline */}
      <section style={{ padding: "80px 0", background: "rgba(106,143,109,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#E4B118",
            marginBottom: 16,
            textAlign: "center",
          }}>
            La réalité du terrain
          </div>
          <h2 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "#0B1F18",
            marginBottom: 16,
            textAlign: "center",
          }}>
            Le pipeline type d'un recrutement de dirigeant
          </h2>
          <p style={{ fontSize: 16, color: "#6A8F6D", textAlign: "center", marginBottom: 48, maxWidth: 700, margin: "0 auto 48px" }}>
            10 étapes critiques. À chacune, un outil PRSTO dédié. À chaque étape manquée, 2 à 4 semaines de perdues.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={step.num}
                style={{
                  background: "white",
                  border: "1px solid rgba(16,56,38,0.08)",
                  borderRadius: 14,
                  padding: 24,
                  position: "relative",
                  transition: "all 0.3s",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: i < 5 ? "rgba(228,177,24,0.12)" : "rgba(14,58,41,0.08)",
                    color: i < 5 ? "#E4B118" : "#0E3A29",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "Playfair Display, Georgia, serif",
                  }}>
                    {step.num}
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0B1F18",
                    letterSpacing: "-0.01em",
                  }}>
                    {step.title}
                  </div>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#50625A", margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Les 5 piliers */}
      <section style={{ padding: "80px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#E4B118",
            marginBottom: 16,
          }}>
            Notre réponse
          </div>
          <h2 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "#0B1F18",
            marginBottom: 32,
          }}>
            5 principes qui font PRSTO
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <Principle
              num="01"
              title="Focus dirigeant, exclusivement"
              desc={"Pas de mode « cadre intermédiaire ». Pas de fonctionnalité pour faire volume. PRSTO est calibré pour les profils à partir de 8 ans de management d'équipe, fonctions C-level, packages 120k€+. Cette exclusivité est notre force : nous ne servons pas tout le monde, nous servons bien une audience précise."}
            />
            <Principle
              num="02"
              title="Un seul cockpit, 18 outils"
              desc={"Plus de 4 outils en parallèle (LinkedIn + Teal + Jobscan + Notion). Tout est dans PRSTO : CV Maître, CV Adapté, ATS Scanner, LinkedIn Optimizer, Mock Interview Panel, CRM Recruteur, Market Radar, Proof Vault, Conseiller IA. Un seul abonnement, une seule interface, une seule mémoire."}
            />
            <Principle
              num="03"
              title="Le Conseiller IA comme second brain"
              desc={"Vous oubliez ce que vous avez dit à un chasseur il y a 4 mois ? Normal. Le Conseiller IA mémorise : vos candidatures, vos entretiens, vos preuves, vos conversations. Il vous briefe chaque matin, vous suggère des relances, anticipe vos questions. C'est la mémoire que vous n'avez pas."}
            />
            <Principle
              num="04"
              title="Zéro envoi automatique"
              desc={"Un dirigeant ne se postule pas en masse. Chaque candidature est un positionnement stratégique. PRSTO ne postule jamais à votre place — il vous aide à préparer, scorer, personnaliser. Vous gardez le contrôle. Votre réputation reste intacte."}
            />
            <Principle
              num="05"
              title="Souveraineté européenne"
              desc={"Vos données sont hébergées en Europe (RGPD natif). L'IA est alimentée par NVIDIA NIM et des modèles open-source. Aucune donnée envoyée à un acteur US sans votre consentement explicite. Pour un dirigeant en transition, la confidentialité n'est pas une option."}
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: "80px 0", background: "#0E3A29" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", textAlign: "center", color: "white" }}>
          <h2 style={{
            fontFamily: "Playfair Display, Georgia, serif",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 24,
            color: "white",
          }}>
            Vous n'envoyez pas un CV.<br />Vous pilotez une campagne.
          </h2>
          <p style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.75)",
            marginBottom: 40,
            maxWidth: 600,
            margin: "0 auto 40px",
          }}>
            PRSTO vous donne le cockpit, les arsenaux, et le second brain. Le reste — le jugement, la stratégie, la présence — reste à vous. C'est ce qui fait la différence.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/demarrage"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 32px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #E4B118 0%, #F2C94C 100%)",
                color: "#082E1E",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(228,177,24,0.35)",
              }}
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/prsto"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "16px 32px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Explorer les outils
            </Link>
          </div>
          <p style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            marginTop: 24,
          }}>
            Sans engagement • Résiliable à tout moment • Hébergé en Europe
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ number, unit, label }: { number: string; unit: string; label: string }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid rgba(16,56,38,0.08)",
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{
        fontFamily: "Playfair Display, Georgia, serif",
        fontSize: 32,
        fontWeight: 800,
        color: "#0E3A29",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        marginBottom: 6,
      }}>
        {number}<span style={{ fontSize: 14, color: "#E4B118", fontWeight: 600, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 12, color: "#6A8F6D", lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
}

function Principle({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid rgba(16,56,38,0.08)",
      borderRadius: 16,
      padding: 28,
      display: "flex",
      gap: 24,
      alignItems: "flex-start",
    }}>
      <div style={{
        fontFamily: "Playfair Display, Georgia, serif",
        fontSize: 28,
        fontWeight: 800,
        color: "#E4B118",
        flexShrink: 0,
        letterSpacing: "-0.03em",
        minWidth: 50,
      }}>
        {num}
      </div>
      <div>
        <h3 style={{
          fontSize: 19,
          fontWeight: 700,
          color: "#0B1F18",
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#50625A", margin: 0 }}>
          {desc}
        </p>
      </div>
    </div>
  );
}
