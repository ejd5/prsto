"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Shield, Scale, Brain, Star, Gavel, AlertTriangle } from "lucide-react";

const C = {
  forest: "#103826",
  gold: "#E4B118",
  ivory: "#FAF6EF",
  text: "#0B1F18",
  muted: "rgba(11,31,24,0.55)",
  lightBg: "rgba(16,56,38,0.04)",
  cardBg: "rgba(255,255,255,0.7)",
};

const h1Style: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: "clamp(2rem,3.5vw,2.75rem)",
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
  color: C.text,
};

const h2Style: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: "clamp(1.35rem,2vw,1.65rem)",
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.015em",
  color: C.text,
};

const h3Style: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: "1.15rem",
  fontWeight: 600,
  lineHeight: 1.3,
  color: C.text,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "'Geist', sans-serif",
  fontSize: "0.95rem",
  lineHeight: 1.7,
  color: C.muted,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Geist', sans-serif",
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: C.gold,
};

const sections: { id: string; icon: React.ReactNode; title: string; summary: string }[] = [
  {
    id: "methodes",
    icon: <Brain size={20} />,
    title: "Méthodes et tactiques pour dirigeants",
    summary: "Approches éprouvées pour négocier un package à haute valeur ajoutée.",
  },
  {
    id: "remuneration",
    icon: <Star size={20} />,
    title: "Package de rémunération globale",
    summary: "Fixe, variable, actions, avantages — décrypter chaque composante.",
  },
  {
    id: "benchmark",
    icon: <TrendingUp size={20} />,
    title: "Benchmark des salaires par secteur",
    summary: "Fourchettes de rémunération actualisées pour postes de direction.",
  },
  {
    id: "indemnites",
    icon: <Shield size={20} />,
    title: "Négocier ses indemnités de départ",
    summary: "Golden parachute, clause de non-concurrence, période de transition.",
  },
  {
    id: "directive",
    icon: <Gavel size={20} />,
    title: "Directive européenne sur la transparence salariale",
    summary: "Ce qui change pour les cadres dirigeants en 2025-2026.",
  },
  {
    id: "evaluer",
    icon: <Scale size={20} />,
    title: "Évaluer son salaire : outils et repères",
    summary: "Benchmarks, grilles sectorielles et simulateurs pour dirigeants.",
  },
  {
    id: "pieges",
    icon: <AlertTriangle size={20} />,
    title: "Les pièges à éviter en négociation",
    summary: "Erreurs stratégiques qui coûtent des centaines de milliers d'euros.",
  },
];

export default function NegociationPage() {
  return (
    <div style={{ background: C.ivory, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: C.forest,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 24px",
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
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.55)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = C.gold;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <ArrowLeft size={14} />
              Ressources
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span
              style={{
                color: "white",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "-0.01em",
              }}
            >
              Négociation salariale
            </span>
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: C.gold,
              background: "rgba(228,177,24,0.12)",
              padding: "4px 12px",
              borderRadius: 100,
            }}
          >
            Guide exécutif
          </span>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.forest} 0%, #0a2b1d 100%)`,
          padding: "80px 24px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(228,177,24,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <div style={{ ...labelStyle, marginBottom: 12 }}>Ressource PRSTO</div>
          <h1
            style={{
              ...h1Style,
              color: "white",
              fontSize: "clamp(2rem,4vw,3rem)",
              marginBottom: 16,
            }}
          >
            Négociation salariale
            <br />
            <span style={{ color: C.gold }}>& rémunération dirigeant</span>
          </h1>
          <p
            style={{
              ...bodyStyle,
              color: "rgba(255,255,255,0.7)",
              fontSize: "1.05rem",
              maxWidth: 580,
            }}
          >
            Maîtrisez l&apos;art de la négociation executive : décryptage complet des packages de
            rémunération, benchmarks sectoriels, cadre juridique et tactiques confidentielles pour
            maximiser la valeur de votre prochain mandat.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 28,
              flexWrap: "wrap",
            }}
          >
            {["Négociation", "Rémunération", "Benchmark", "Indemnités", "Transparence"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "4px 14px",
                    borderRadius: 100,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Summary / Table of contents */}
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "48px 24px 32px",
        }}
      >
        <div
          style={{
            ...labelStyle,
            marginBottom: 20,
          }}
        >
          Au sommaire
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 10,
          }}
        >
          {sections.map((s) => (
            <Link
              key={s.id}
              href={`#${s.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderRadius: 12,
                background: "white",
                border: "1px solid rgba(16,56,38,0.06)",
                textDecoration: "none",
                color: C.text,
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = C.gold;
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = "0 4px 16px rgba(16,56,38,0.06)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(16,56,38,0.06)";
                el.style.transform = "none";
                el.style.boxShadow = "none";
              }}
            >
              <span style={{ color: C.gold, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontSize: "0.72rem",
                    color: C.muted,
                  }}
                >
                  {s.summary}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "16px 24px 80px",
        }}
      >
        {/* 1. Méthodes et tactiques */}
        <section id="methodes" style={{ marginBottom: 64 }}>
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <Brain size={20} />
            </div>
            <h2 style={h2Style}>Méthodes et tactiques pour dirigeants</h2>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(16,56,38,0.06)",
              padding: 32,
            }}
          >
            <p style={{ ...bodyStyle, marginBottom: 20 }}>
              La négociation salariale d&apos;un dirigeant ne ressemble en rien à celle d&apos;un
              cadre intermédiaire. Les enjeux sont multipliés, les leviers différents, et la
              contrepartie — le risque perçu par l&apos;entreprise — bien plus élevée. Voici les
              méthodes qui font la différence au niveau exécutif.
            </p>

            <div style={{ display: "grid", gap: 24 }}>
              {[
                {
                  title: "Ancrer en premier",
                  desc: "Ne jamais donner son chiffre en premier. Si l'entreprise insiste, proposez une fourchette large adossée à des benchmarks crédibles (ex: « Les études Korn Ferry pour un DAF de cette taille donnent 350-450 K€ »). L'ancrage déplace tout l'espace de négociation.",
                },
                {
                  title: "Négociation par mandat",
                  desc: "Un dirigeant ne négocie pas seul. Entourez-vous d'un conseil (avocat, chasseur de têtes, pair). Faites porter la négociation par un tiers — cela préserve la relation et permet des positions plus fermes sans risque politique.",
                },
                {
                  title: "BATANA system",
                  desc: "Formalisez votre Best Alternative to a Negotiated Agreement. Un dirigeant qui a une option crédible (autre offre, mission de consulting, année sabbatique) négocie 2 à 3 fois mieux. Calculez votre BATANA avant chaque séance.",
                },
                {
                  title: "Levier temporel",
                  desc: "Les comités de rémunération sont sous pression en fin de trimestre ou d'exercice fiscal. Programmez vos négociations entre mi-novembre et mi-décembre. Les budgets alloués non utilisés sont perdus — vos chances augmentent de 30%.",
                },
                {
                  title: "Package framing",
                  desc: "Ne discutez jamais le fixe isolément. Cadrez la conversation autour du « Total Rewards » — la valeur cumulée du package. Un dirigeant qui obtient 30% de bonus et des stock options excellemment structurées peut dépasser son fixe de 150%.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "16px 20px",
                    borderRadius: 12,
                    background: i % 2 === 0 ? C.lightBg : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: C.forest,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 style={{ ...h3Style, marginBottom: 6 }}>{item.title}</h3>
                    <p style={bodyStyle}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Package de rémunération globale */}
        <section id="remuneration" style={{ marginBottom: 64 }}>
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <Star size={20} />
            </div>
            <h2 style={h2Style}>Package de rémunération globale</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "Fixe",
                items: [
                  "Salaire de base garanti",
                  "Révision annuelle minimum 5%",
                  "Clause de rattrapage en cas de sous-performance sectorielle",
                  "Indexé sur le benchmark du comité des rémunérations",
                ],
                accent: C.forest,
              },
              {
                title: "Variable court terme",
                items: [
                  "Bonus annuel : 30-100% du fixe",
                  "Objectifs qualitatifs (40%) + quantitatifs (60%)",
                  "Plafond multiplicateur 1.5x à 3x",
                  "Paiement garanti première année (sign-on bonus)",
                ],
                accent: C.gold,
              },
              {
                title: "Variable long terme / Actions",
                items: [
                  "Stock Options / Stock Appreciation Rights",
                  "Performance Shares (vesting 3-5 ans)",
                  "Phantom Stock pour les non-actionnaires",
                  "Management Package Co-Investment",
                ],
                accent: C.forest,
              },
              {
                title: "Avantages & Perks",
                items: [
                  "Voiture de fonction (gamme premium)",
                  "Assurance santé mutuelle famille",
                  "Cotisation retraite surcomplémentaire",
                  "Budget représentation et frais de réception",
                ],
                accent: C.gold,
              },
              {
                title: "Protection & Sûreté",
                items: [
                  "Assurance perte d'emploi (GSC)",
                  "Couverture responsabilité civile dirigeants",
                  "Rachat d'heures de travail (conge non pris)",
                  "Clause de non-concurrence indemnisée",
                ],
                accent: C.forest,
              },
              {
                title: "Structures hybrides",
                items: [
                  "Carried Interest dans les fonds/investissement",
                  "Retainer de conseil post-mandat",
                  "Bonus de retention pluriannuel",
                  "Package de départ négocié à l'entrée",
                ],
                accent: C.gold,
              },
            ].map((col, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid rgba(16,56,38,0.06)",
                  padding: 28,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 32,
                    borderRadius: 4,
                    background: col.accent,
                    marginBottom: 16,
                  }}
                />
                <h3 style={{ ...h3Style, marginBottom: 16 }}>{col.title}</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {col.items.map((item, j) => (
                    <li
                      key={j}
                      style={{
                        ...bodyStyle,
                        fontSize: "0.85rem",
                        padding: "6px 0",
                        borderBottom:
                          j < col.items.length - 1
                            ? "1px solid rgba(16,56,38,0.04)"
                            : "none",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: C.gold,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          marginTop: 2,
                        }}
                      >
                        ▸
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Benchmark des salaires */}
        <section id="benchmark" style={{ marginBottom: 64 }}>
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <TrendingUp size={20} />
            </div>
            <h2 style={h2Style}>Benchmark des salaires par secteur</h2>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(16,56,38,0.06)",
              padding: 32,
              overflowX: "auto",
            }}
          >
            <p style={{ ...bodyStyle, marginBottom: 24 }}>
              Fourchettes de rémunération totale annuelle (fixe + variable) pour les postes de
              direction en France, actualisées aux données 2024-2025. Sources : Korn Ferry, WTW,
              Mercer, Robert Half Executive.
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.forest}` }}>
                  {["Fonction", "Secteur", "Médian (K€)", "Haut (K€)", "Top 10% (K€)"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 600,
                          color: C.text,
                          fontSize: "0.75rem",
                          letterSpacing: "0.03em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "CEO", sector: "Tech / SaaS", mid: "450", high: "750", top: "1 200" },
                  { role: "CEO", sector: "Industrie", mid: "380", high: "580", top: "900" },
                  { role: "CEO", sector: "Services Financiers", mid: "520", high: "850", top: "1 500" },
                  { role: "CFO / DAF", sector: "Tech", mid: "280", high: "420", top: "650" },
                  { role: "CFO / DAF", sector: "CAC 40", mid: "350", high: "550", top: "850" },
                  { role: "CTO / VP Eng.", sector: "Tech Scale-up", mid: "260", high: "400", top: "600" },
                  { role: "CMO", sector: "Grande Conso.", mid: "240", high: "360", top: "520" },
                  { role: "DRH", sector: "Services", mid: "220", high: "340", top: "500" },
                  { role: "COO", sector: "Logistique", mid: "300", high: "460", top: "700" },
                  { role: "Directeur Juridique", sector: "CAC 40", mid: "280", high: "420", top: "650" },
                  { role: "Directeur Commercial", sector: "B2B Tech", mid: "230", high: "380", top: "550" },
                ].map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(16,56,38,0.06)",
                      background: i % 2 === 0 ? C.lightBg : "transparent",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                        color: C.text,
                      }}
                    >
                      {row.role}
                    </td>
                    <td style={{ padding: "12px 16px", color: C.muted }}>{row.sector}</td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                        color: C.forest,
                      }}
                    >
                      {row.mid}
                    </td>
                    <td style={{ padding: "12px 16px", color: C.text }}>{row.high}</td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 700,
                        color: C.gold,
                      }}
                    >
                      {row.top}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p
              style={{
                ...bodyStyle,
                fontSize: "0.75rem",
                marginTop: 20,
                fontStyle: "italic",
              }}
            >
              * Les fourchettes incluent fixe + bonus cible. Le variable long terme (actions,
              stock-options) peut représenter 30 à 150% supplémentaires selon le secteur et la
              maturité de l&apos;entreprise.
            </p>
          </div>
        </section>

        {/* 4. Indemnités de départ */}
        <section id="indemnites" style={{ marginBottom: 64 }}>
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <Shield size={20} />
            </div>
            <h2 style={h2Style}>Négocier ses indemnités de départ</h2>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(16,56,38,0.06)",
              padding: 32,
            }}
          >
            <p style={{ ...bodyStyle, marginBottom: 24 }}>
              La négociation du départ est aussi importante que celle de l&apos;entrée. Un dirigeant
              bien protégé négocie mieux pendant son mandat. Voici les composantes critiques à
              verrouiller dans votre contrat.
            </p>

            <div style={{ display: "grid", gap: 20 }}>
              {[
                {
                  title: "Indemnité conventionnelle de départ",
                  desc: "Négociez 12 à 24 mois de rémunération totale (fixe + variable moyen des 3 dernières années). Le standard du CAC 40 est de 18 mois. Au-delà, le régime fiscal devient moins favorable — faites coïncider le montant avec le plafond de l'article 80 duodecies du CGI.",
                },
                {
                  title: "Clause de non-concurrence",
                  desc: "La contrepartie financière doit représenter 6 à 12 mois de rémunération totale. N'acceptez jamais une clause non-indemnisée. Vérifiez la proportionnalité — une clause trop large peut être requalifiée par les tribunaux.",
                },
                {
                  title: "Période de transition / Garden Leave",
                  desc: "Une période de 3 à 6 mois où vous restez salarié sans exercer de fonctions. Idéal pour préparer votre transition, lancer des projets personnels, ou négocier votre prochain poste sans précipitation.",
                },
                {
                  title: "Vesting accéléré des actions",
                  desc: "En cas de départ sans faute grave, négociez l'accélération du vesting de vos stock-options et actions de performance. Le standard est un vesting accéléré sur 12 mois supplémentaires ou un « single trigger » en cas de changement de contrôle.",
                },
                {
                  title: "Outplacement premium",
                  desc: "Exigez un accompagnement de réorientation payé par l'entreprise — cabinet spécialisé en outplacement executive (IMC, Keymœ, DBM). Durée : 12 à 18 mois. Coût : 20 000 à 40 000 €, entièrement à la charge de l'employeur.",
                },
                {
                  title: "Protection juridique",
                  desc: "Souscrivez une assurance de protection juridique couvrant les contentieux prud'homaux et la négociation de rupture. Incluez la prise en charge des honoraires d'avocat (spécialiste en droit social des dirigeants) dans le package de départ.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "18px 20px",
                    borderRadius: 12,
                    background: i % 2 === 0 ? C.lightBg : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: C.gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.text,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 style={{ ...h3Style, marginBottom: 6 }}>{item.title}</h3>
                    <p style={bodyStyle}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 28,
                padding: "16px 20px",
                borderRadius: 12,
                background: "rgba(228,177,24,0.08)",
                border: `1px solid rgba(228,177,24,0.2)`,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span style={{ color: C.gold, fontSize: "1.1rem", flexShrink: 0 }}>⚡</span>
              <p
                style={{
                  ...bodyStyle,
                  fontSize: "0.85rem",
                  color: C.text,
                }}
              >
                <strong>Conseil PRSTO :</strong> Négociez les indemnités de départ en même temps que
                le package d&apos;entrée. Après la signature, tout devient plus difficile. Le
                moment où l&apos;entreprise vous veut le plus est avant la signature du contrat.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Directive européenne */}
        <section id="directive" style={{ marginBottom: 64 }}>
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <Gavel size={20} />
            </div>
            <h2 style={h2Style}>Directive européenne sur la transparence salariale</h2>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(16,56,38,0.06)",
              padding: 32,
            }}
          >
            <p style={{ ...bodyStyle, marginBottom: 20 }}>
              Adoptée en 2023, la directive (UE) 2023/970 doit être transposée dans le droit
              français d&apos;ici juin 2026. Elle bouleverse les règles du jeu pour la négociation
              salariale des dirigeants.
            </p>

            <div style={{ display: "grid", gap: 16 }}>
              {[
                {
                  title: "Transparence des rémunérations à l'embauche",
                  desc: "Les employeurs devront communiquer le niveau de rémunération ou la fourchette salariale dans l'offre d'emploi ou avant l'entretien. Pour les postes de direction, cela signifie que les fourchettes deviendront publiques — un levier puissant pour les candidats.",
                },
                {
                  title: "Droit à l'information",
                  desc: "Les salariés pourront demander par écrit le niveau de rémunération moyen de leur catégorie de poste, par genre. Les dirigeants auront accès aux données de rémunération des postes comparables dans leur entreprise.",
                },
                {
                  title: "Interdiction des questions sur l'historique salarial",
                  desc: "Les recruteurs ne pourront plus demander le salaire antérieur. Cette disposition change la donne : sans point d'ancrage sur votre passé, vous négociez uniquement sur la valeur du poste.",
                },
                {
                  title: "Reporting et audits",
                  desc: "Les entreprises de plus de 250 salariés devront publier un rapport annuel sur les écarts de rémunération. En cas d'écart injustifié de plus de 5%, un audit conjoint avec les partenaires sociaux sera obligatoire.",
                },
                {
                  title: "Renversement de la charge de la preuve",
                  desc: "En cas de litige sur une différence de traitement, l'employeur devra prouver qu'elle est justifiée par des critères objectifs et non genrés. Cela renforce considérablement la position des dirigeants en contentieux.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "18px 20px",
                    borderRadius: 12,
                    border: "1px solid rgba(16,56,38,0.06)",
                    background: i % 2 === 0 ? C.lightBg : "transparent",
                  }}
                >
                  <h3 style={{ ...h3Style, marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: C.forest,
                        color: "white",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    {item.title}
                  </h3>
                  <p style={{ ...bodyStyle, paddingLeft: 32 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 28,
                padding: "16px 20px",
                borderRadius: 12,
                background: "rgba(16,56,38,0.04)",
                border: "1px solid rgba(16,56,38,0.1)",
              }}
            >
              <p
                style={{
                  ...bodyStyle,
                  fontSize: "0.85rem",
                  color: C.text,
                }}
              >
                <strong>Impact pour les dirigeants :</strong> La transparence profite aux candidats
                les mieux préparés. PRSTO intègre ces nouvelles contraintes dans ses algorithmes de
                scoring d&apos;offres et de simulation de négociation. Anticipez la directive dès
                maintenant pour en faire un levier, pas une contrainte.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Évaluer son salaire */}
        <section id="evaluer" style={{ marginBottom: 64 }}>
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <Scale size={20} />
            </div>
            <h2 style={h2Style}>Évaluer son salaire : outils et repères</h2>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(16,56,38,0.06)",
              padding: 32,
            }}
          >
            <p style={{ ...bodyStyle, marginBottom: 24 }}>
              Pour négocier, il faut savoir où l&apos;on se situe. Voici les outils et
              méthodologies pour évaluer précisément votre valeur de marché.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  title: "Rapports de cabinets spécialisés",
                  items: [
                    "Korn Ferry Executive Compensation Navigator",
                    "WTW Executive Compensation Report",
                    "Mercer Total Rewards Surveys",
                    "Robert Half Executive Salary Guide",
                    "Aon Executive Rewards Study",
                  ],
                },
                {
                  title: "Bases de données sectorielles",
                  items: [
                    "Observatoire des salaires APEC Cadres Dirigeants",
                    "Rapports annuels des comités de rémunération CAC 40",
                    "Enquête EY / Observatoire de l'Épargne Long Terme",
                    "Index de rémunération des sociétés du SBF 120",
                    "Données DARES sur les hauts salaires",
                  ],
                },
                {
                  title: "Outils PRSTO",
                  items: [
                    "Scoring d'offre : évaluation IA de votre package",
                    "Comparateur sectoriel temps réel",
                    "Simulateur de négociation intégré",
                    "Analyse des clauses contractuelles",
                    "Benchmark personnalisé par taille d'entreprise",
                  ],
                },
                {
                  title: "Indicateurs clés à suivre",
                  items: [
                    "Médiane de votre fonction dans votre secteur",
                    "Ratio fixe/variable par niveau de maturité d'entreprise",
                    "Évolution annuelle moyenne des packages executives",
                    "Premium sectoriel (finance vs industrie vs tech)",
                    "Écart hommes-femmes sur les postes comparables",
                  ],
                },
              ].map((col, i) => (
                <div
                  key={i}
                  style={{
                    padding: 24,
                    borderRadius: 12,
                    border: "1px solid rgba(16,56,38,0.06)",
                    background: C.lightBg,
                  }}
                >
                  <h3 style={{ ...h3Style, marginBottom: 14, fontSize: "0.95rem" }}>
                    {col.title}
                  </h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {col.items.map((item, j) => (
                      <li
                        key={j}
                        style={{
                          ...bodyStyle,
                          fontSize: "0.82rem",
                          padding: "5px 0",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            color: C.gold,
                            fontSize: "0.65rem",
                            marginTop: 4,
                          }}
                        >
                          ●
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 28,
                padding: "20px 24px",
                borderRadius: 12,
                background: C.forest,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: C.gold,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    marginBottom: 4,
                  }}
                >
                  Besoin d&apos;une évaluation personnalisée ?
                </div>
                <p style={{ ...bodyStyle, color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>
                  PRSTO analyse votre profil et vos offres pour vous donner une estimation précise
                  de votre valeur de marché.
                </p>
              </div>
              <Link
                href="/prsto"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  background: C.gold,
                  color: C.text,
                  padding: "10px 24px",
                  borderRadius: 100,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                Découvrir PRSTO
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Pièges à éviter */}
        <section id="pieges">
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
                width: 40,
                height: 40,
                borderRadius: 12,
                background: C.gold,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.text,
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h2 style={h2Style}>Les pièges à éviter en négociation</h2>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid rgba(16,56,38,0.06)",
              padding: 32,
            }}
          >
            <p style={{ ...bodyStyle, marginBottom: 28 }}>
              Après avoir accompagné des centaines de dirigeants dans leur négociation, voici les
              erreurs les plus fréquentes — et les plus coûteuses.
            </p>

            <div style={{ display: "grid", gap: 16 }}>
              {[
                {
                  title: "Négocier trop tôt ou trop tard",
                  desc: "Entamer la négociation avant d'avoir reçu une offre formelle affaiblit votre position. Attendre la signature sans discuter du package est tout aussi dangereux. Le bon moment ? Juste après la réception de l'offre écrite, avant tout retour verbal positif.",
                },
                {
                  title: "Se focaliser uniquement sur le fixe",
                  desc: "Un dirigeant qui obtient 10 K€ de plus sur le fixe mais laisse passer 200 K€ de stock-options a perdu. Évaluez chaque composante en valeur actualisée. Les avantages long terme représentent souvent 40 à 60% de la valeur totale du package.",
                },
                {
                  title: "Ignorer la fiscalité du package",
                  desc: "Les stock-options, l'intéressement, les indemnités de départ et les retraites surcomplémentaires ont des régimes fiscaux très différents. Un package de 500 K€ peut valoir 320 K€ net ou 450 K€ net selon sa structure. Faites systématiquement chiffrer par un expert.",
                },
                {
                  title: "Ne pas préparer son BATNA",
                  desc: "Un dirigeant qui n'a pas d'alternative crédible négocie à partir d'une position de faiblesse. Préparez toujours un plan B (autre piste, mission de consulting, projet entrepreneurial) avant d'entrer en négociation. Le BATNA est votre meilleur levier.",
                },
                {
                  title: "Négocier seul face au board",
                  desc: "Les comités de rémunération sont des professionnels de la négociation. Face à eux, un dirigeant isolé perd en moyenne 20 à 30% de son potentiel. Mandatez un conseil, un avocat spécialisé ou utilisez un intermédiaire.",
                },
                {
                  title: "Accepter les clauses floues",
                  desc: "« Bonus basé sur la performance », « objectifs définis annuellement », « révision possible » — ces formulations vous exposent à un risque majeur. Exigez des critères précis, mesurables et contractualisés dès la signature.",
                },
                {
                  title: "Sous-estimer l'importance des softs",
                  desc: "La réputation, le réseau, le style de leadership et la culture d'entreprise pèsent autant que les chiffres dans une négociation executive. Un dirigeant qui négocie dans un environnement culturellement aligné obtiendra 15 à 25% de mieux.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "18px 20px",
                    borderRadius: 12,
                    border: "1px solid rgba(197,75,60,0.08)",
                    background:
                      i % 2 === 0 ? "rgba(197,75,60,0.03)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#C54B3C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✕
                  </div>
                  <div>
                    <h3 style={{ ...h3Style, marginBottom: 6, color: "#C54B3C" }}>
                      {item.title}
                    </h3>
                    <p style={bodyStyle}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: 80,
            padding: "40px 32px",
            borderRadius: 20,
            background: C.forest,
            textAlign: "center" as const,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(228,177,24,0.1) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <h2
              style={{
                ...h2Style,
                color: "white",
                fontSize: "1.5rem",
                marginBottom: 12,
              }}
            >
              Prêt à négocier votre prochain package ?
            </h2>
            <p
              style={{
                ...bodyStyle,
                color: "rgba(255,255,255,0.6)",
                maxWidth: 480,
                margin: "0 auto 24px",
              }}
            >
              PRSTO analyse vos offres, simule vos négociations et vous prépare à chaque étape du
              processus. Rejoignez les 2 000+ dirigeants qui pilotent leur carrière avec l&apos;IA.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/prsto"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  background: C.gold,
                  color: C.text,
                  padding: "12px 28px",
                  borderRadius: 100,
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                Découvrir PRSTO
              </Link>
              <Link
                href="/prsto/ressources"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.7)",
                  padding: "12px 28px",
                  borderRadius: 100,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = C.gold;
                  el.style.color = C.gold;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,255,255,0.15)";
                  el.style.color = "rgba(255,255,255,0.7)";
                }}
              >
                Explorer toutes les ressources
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div
          style={{
            textAlign: "center" as const,
            paddingTop: 48,
            ...bodyStyle,
            fontSize: "0.72rem",
          }}
        >
          PRSTO — Copilote IA pour dirigeants. Données mises à jour en 2025. Les informations
          fournies ne constituent pas un conseil juridique ou financier.
        </div>
      </div>
    </div>
  );
}
