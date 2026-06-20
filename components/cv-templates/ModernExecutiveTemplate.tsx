"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, accentHex, accentBg, showPhoto, showLinkedIn } from "./cv-template-utils";

export default function ModernExecutiveTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const ac = accentHex(data);
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12, color: "#1a1a1a", maxWidth: 800, margin: "0 auto", display: "flex", background: "#fff", minHeight: "100vh" }}>
      {/* Sidebar gauche */}
      <div style={{ width: 240, background: ac, color: "#fff", padding: "36px 20px", flexShrink: 0 }}>
        {photo && i.photoUrl && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src={i.photoUrl} alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
          </div>
        )}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px", color: "#fff" }}>{i.fullName || ""}</h1>
          <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>{i.title || ""}</p>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, opacity: 0.7 }}>Contact</h3>
          <div style={{ fontSize: 11, lineHeight: 1.8, opacity: 0.9 }}>
            {i.email && <div>✉ {i.email}</div>}
            {i.phone && <div>✆ {i.phone}</div>}
            {i.location && <div>📍 {i.location}</div>}
            {linkedin && <div>🔗 {i.linkedin?.replace("linkedin.com/in/", "")}</div>}
          </div>
        </div>

        {/* Compétences sidebar */}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, opacity: 0.7 }}>Compétences clés</h3>
            {data.skills.map((s, i) => (
              <div key={i} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{s}</div>
            ))}
          </div>
        )}

        {/* Langues sidebar */}
        {data.languages.length > 0 && (
          <div>
            <h3 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, opacity: 0.7 }}>Langues</h3>
            {data.languages.map((l, i) => (
              <div key={i} style={{ fontSize: 11, padding: "2px 0" }}>{l.name}{l.level ? ` — ${l.level}` : ""}</div>
            ))}
          </div>
        )}
      </div>

      {/* Contenu principal à droite */}
      <div style={{ flex: 1, padding: "36px 30px" }}>
        {data.summary && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Résumé</h2>
            <p style={{ fontSize: 12, color: "#444", lineHeight: 1.7, margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {data.experiences.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Expérience professionnelle</h2>
            {data.experiences.map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: `2px solid ${accentBg(data, 0.3)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{exp.title}</h3>
                  <span style={{ fontSize: 10, color: "#888" }}>{formatDateRange(exp)}</span>
                </div>
                <p style={{ fontSize: 11, color: "#666", margin: "2px 0 6px" }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                {exp.description && <p style={{ fontSize: 11, color: "#444", margin: 0 }}>{exp.description}</p>}
                {(exp.bullets || exp.achievements)?.slice(0, 3).map((b, j) => <p key={j} style={{ fontSize: 11, color: "#555", margin: "2px 0 2px 8px" }}>• {b}</p>)}
              </div>
            ))}
          </div>
        )}

        {/* Réalisations */}
        {data.achievements.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Réalisations clés</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {data.achievements.map((a, i) => (
                <div key={i} style={{ background: accentBg(data, 0.06), padding: 10, borderRadius: 4 }}>
                  <p style={{ fontSize: 10, color: "#888", margin: 0 }}>{a.label}</p>
                  {a.value && <p style={{ fontSize: 16, fontWeight: 700, color: ac, margin: "2px 0" }}>{a.value}</p>}
                  {a.description && <p style={{ fontSize: 10, color: "#666", margin: 0 }}>{a.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formation */}
        {data.education.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Formation</h2>
            {data.education.map((e, i) => (
              <p key={i} style={{ fontSize: 11, margin: "2px 0" }}><strong>{e.degree}</strong>{e.school ? ` — ${e.school}` : ""}{e.year ? ` (${e.year})` : ""}</p>
            ))}
          </div>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Certifications</h2>
            {data.certifications.map((c, i) => <p key={i} style={{ fontSize: 11, margin: "2px 0" }}>• {c}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
