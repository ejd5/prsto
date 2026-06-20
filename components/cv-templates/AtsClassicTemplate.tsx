"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, accentHex, accentBg, showPhoto, showLinkedIn } from "./cv-template-utils";

export default function AtsClassicTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const ac = accentHex(data);
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 12, color: "#1a1a1a", maxWidth: 800, margin: "0 auto", background: "#fff", padding: "48px 40px", lineHeight: 1.6 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24, borderBottom: `2px solid ${ac}`, paddingBottom: 18 }}>
        {photo && i.photoUrl && (
          <img src={i.photoUrl} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 10, border: `2px solid ${ac}` }} />
        )}
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 2 }}>{i.fullName || ""}</h1>
        <p style={{ fontSize: 14, color: ac, margin: "4px 0 8px" }}>{i.title || ""}</p>
        <div style={{ fontSize: 10, color: "#666", display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
          {i.email && <span>{i.email}</span>}
          {i.phone && <span>{i.phone}</span>}
          {i.location && <span>{i.location}</span>}
          {linkedin && <span>{i.linkedin}</span>}
        </div>
      </div>

      {/* Résumé */}
      {data.summary && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, fontStyle: "italic", color: "#444", margin: 0 }}>{data.summary}</p>
        </div>
      )}

      {/* Expériences */}
      {data.experiences.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 4, marginBottom: 10 }}>Expérience professionnelle</h2>
          {data.experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{exp.title}</h3>
                <span style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>{formatDateRange(exp)}</span>
              </div>
              <p style={{ fontSize: 12, color: "#555", margin: "2px 0" }}>{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
              {exp.description && <p style={{ fontSize: 11, color: "#444", margin: "4px 0 0" }}>{exp.description}</p>}
              {(exp.bullets || exp.achievements)?.map((b, j) => <p key={j} style={{ fontSize: 11, color: "#444", margin: "2px 0 2px 12px" }}>• {b}</p>)}
            </div>
          ))}
        </div>
      )}

      {/* Compétences */}
      {data.skills.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 4, marginBottom: 8 }}>Compétences</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ background: accentBg(data, 0.1), padding: "3px 10px", borderRadius: 3, fontSize: 11, color: "#333" }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Formation */}
      {data.education.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 4, marginBottom: 8 }}>Formation</h2>
          {data.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{e.degree}</span>
              {e.school && <span> — {e.school}</span>}
              {e.year && <span style={{ color: "#888", marginLeft: 8 }}>{e.year}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Langues */}
      {data.languages.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 4, marginBottom: 8 }}>Langues</h2>
          <div style={{ display: "flex", gap: 16 }}>
            {data.languages.map((l, i) => (
              <span key={i} style={{ fontSize: 12 }}>{l.name}{l.level ? ` (${l.level})` : ""}</span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 4, marginBottom: 8 }}>Certifications</h2>
          {data.certifications.map((c, i) => <p key={i} style={{ fontSize: 12, margin: "2px 0" }}>• {c}</p>)}
        </div>
      )}
    </div>
  );
}
