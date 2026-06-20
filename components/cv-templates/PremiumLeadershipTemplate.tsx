"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, accentHex, accentBg, showPhoto, showLinkedIn } from "./cv-template-utils";

export default function PremiumLeadershipTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const ac = accentHex(data);
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12, color: "#1a1a1a", maxWidth: 800, margin: "0 auto", background: "#fff" }}>
      {/* Header premium sombre */}
      <div style={{ background: ac, color: "#fff", padding: "40px 40px 30px", display: "flex", alignItems: "center", gap: 24 }}>
        {photo && i.photoUrl && (
          <img src={i.photoUrl} alt="" style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
        )}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{i.fullName || ""}</h1>
          <p style={{ fontSize: 15, opacity: 0.85, margin: "6px 0 12px", fontWeight: 600 }}>{i.title || ""}</p>
          <div style={{ fontSize: 11, opacity: 0.8, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {i.email && <span>✉ {i.email}</span>}
            {i.phone && <span>✆ {i.phone}</span>}
            {i.location && <span>📍 {i.location}</span>}
            {linkedin && <span>🔗 {i.linkedin?.replace("linkedin.com/in/", "")}</span>}
          </div>
        </div>
      </div>

      <div style={{ padding: "36px 40px", display: "flex", gap: 30 }}>
        {/* Colonne gauche principale */}
        <div style={{ flex: 1 }}>
          {data.summary && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Profil exécutif</h2>
              <p style={{ fontSize: 12, color: "#444", lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Parcours professionnel</h2>
              {data.experiences.map((exp, i) => (
                <div key={i} style={{ marginBottom: 16, position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 0, top: 6, width: 8, height: 8, borderRadius: "50%", background: ac }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{exp.title}</h3>
                    <span style={{ fontSize: 10, color: "#888", whiteSpace: "nowrap" }}>{formatDateRange(exp)}</span>
                  </div>
                  <p style={{ fontSize: 12, color: ac, margin: "2px 0 4px", fontWeight: 600 }}>{exp.company}</p>
                  {exp.location && <p style={{ fontSize: 10, color: "#999", margin: "0 0 4px" }}>{exp.location}</p>}
                  {exp.description && <p style={{ fontSize: 11, color: "#444", margin: 0 }}>{exp.description}</p>}
                  {(exp.bullets || exp.achievements)?.slice(0, 4).map((b, j) => <p key={j} style={{ fontSize: 11, color: "#555", margin: "2px 0 2px 8px" }}>• {b}</p>)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ width: 220, flexShrink: 0 }}>
          {/* Réalisations clés */}
          {data.achievements.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Réalisations</h2>
              {data.achievements.map((a, i) => (
                <div key={i} style={{ background: accentBg(data, 0.06), padding: "10px 12px", borderRadius: 6, marginBottom: 6, borderLeft: `3px solid ${ac}` }}>
                  <p style={{ fontSize: 10, color: "#888", margin: 0 }}>{a.label}</p>
                  {a.value && <p style={{ fontSize: 15, fontWeight: 700, color: ac, margin: "2px 0" }}>{a.value}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Compétences */}
          {data.skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Expertise</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.skills.map((s, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "4px 8px", background: accentBg(data, 0.06), borderRadius: 3 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Formation */}
          {data.education.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Formation</h2>
              {data.education.map((e, i) => (
                <p key={i} style={{ fontSize: 11, margin: "4px 0", lineHeight: 1.4 }}><strong>{e.degree}</strong><br />{e.school}{e.year ? ` (${e.year})` : ""}</p>
              ))}
            </div>
          )}

          {/* Langues */}
          {data.languages.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Langues</h2>
              {data.languages.map((l, i) => (
                <p key={i} style={{ fontSize: 11, margin: "3px 0" }}>{l.name}{l.level ? ` — ${l.level}` : ""}</p>
              ))}
            </div>
          )}

          {/* Certifications */}
          {data.certifications.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Certifications</h2>
              {data.certifications.map((c, i) => <p key={i} style={{ fontSize: 11, margin: "2px 0" }}>• {c}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
