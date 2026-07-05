"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, showPhoto, showLinkedIn, getTargetJobLabel, isAdapted } from "./cv-template-utils";

const BURGUNDY = "#5A1E2B";
const CHARCOAL = "#1F2933";
const IVORY = "#F7F3EC";

export default function ExecutiveBordeauxTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);
  const targetLabel = getTargetJobLabel(data);
  const adapted = isAdapted(data);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10.5, width: "100%", color: CHARCOAL, background: IVORY, lineHeight: 1.3, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header sobre */}
      <div style={{ background: BURGUNDY, color: "#fff", padding: "20px 30px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {photo && i.photoUrl && (
            <img src={i.photoUrl} alt="" style={{ width: 60, height: 75, borderRadius: "6px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1, fontFamily: "'Times New Roman', serif" }}>{i.fullName || ""}</h1>
            <p style={{ fontSize: 11, margin: "3px 0 0", opacity: 0.85, fontWeight: 600 }}>{i.title || ""}</p>
            {adapted && targetLabel && (
              <p style={{ fontSize: 8.5, opacity: 0.6, margin: "2px 0 0", fontStyle: "italic" }}>Candidature : {targetLabel}</p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 9.5, opacity: 0.8, flexWrap: "wrap" }}>
          {i.email && <span>{i.email}</span>}
          {i.phone && <span>{i.phone}</span>}
          {i.location && <span>{i.location}</span>}
          {linkedin && <span>{i.linkedin?.replace(/^https?:\/\/(www\.)?/, "").replace("linkedin.com/in/", "")}</span>}
        </div>
      </div>

      <div style={{ padding: "20px 28px", display: "flex", gap: 20, flex: 1 }}>
        {/* Colonne gauche */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {data.summary && (
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Times New Roman', serif" }}>Profil exécutif</h2>
              <p style={{ fontSize: 10, color: CHARCOAL, lineHeight: 1.35, margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'Times New Roman', serif" }}>Expériences professionnelles</h2>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {data.experiences.map((exp, j) => (
                  <div key={j} style={{ position: "relative", paddingLeft: 14, marginBottom: j < data.experiences.length - 1 ? 6 : 0 }}>
                    <div style={{ position: "absolute", left: 0, top: 3, width: 6, height: 6, borderRadius: "50%", background: BURGUNDY, border: "1.5px solid #fff", boxShadow: `0 0 0 1px ${BURGUNDY}` }} />
                    {j < data.experiences.length - 1 && (
                      <div style={{ position: "absolute", left: 2.5, top: 12, width: 1, bottom: -8, background: "#E8E2DA" }} />
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, margin: 0, fontFamily: "'Times New Roman', serif" }}>{exp.title}</h3>
                      <span style={{ fontSize: 9, color: "#888", whiteSpace: "nowrap", marginLeft: 8 }}>{formatDateRange(exp)}</span>
                    </div>
                    <p style={{ fontSize: 10, color: BURGUNDY, margin: "1px 0 3px", fontWeight: 600 }}>{exp.company}</p>
                    {exp.description && <p style={{ fontSize: 9.5, color: "#555", margin: "0 0 1px", lineHeight: 1.3 }}>{exp.description}</p>}
                    {(exp.bullets || exp.achievements)?.slice(0, 3).map((b, k) => <p key={k} style={{ fontSize: 9.5, color: "#666", margin: "0 0 1px 3px", lineHeight: 1.25 }}>— {b}</p>)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {data.achievements.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 9.5, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Times New Roman', serif" }}>Réalisations clés</h2>
              {data.achievements.map((a, k) => (
                <div key={k} style={{ background: "#fff", padding: "5px 8px", borderRadius: 4, marginBottom: 3, borderLeft: `3px solid ${BURGUNDY}` }}>
                  <p style={{ fontSize: 8.5, color: "#999", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{a.label}</p>
                  {a.value && <p style={{ fontSize: 12, fontWeight: 700, color: BURGUNDY, margin: "1px 0" }}>{a.value}</p>}
                </div>
              ))}
            </div>
          )}

          {data.skills.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 9.5, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Times New Roman', serif" }}>Expertise</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {data.skills.map((s, k) => (
                  <span key={k} style={{ fontSize: 9.5, padding: "2px 6px", background: "#fff", borderRadius: 3, border: "1px solid #E8E2DA", color: CHARCOAL }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {data.languages.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 9.5, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Times New Roman', serif" }}>Langues</h2>
              {data.languages.map((l, k) => (
                <p key={k} style={{ fontSize: 9.5, margin: "1px 0", color: CHARCOAL }}>{l.name}{l.level ? ` — ${l.level}` : ""}</p>
              ))}
            </div>
          )}

          {data.education.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 9.5, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Times New Roman', serif" }}>Formation</h2>
              {data.education.map((e, k) => (
                <p key={k} style={{ fontSize: 9, margin: "2px 0", lineHeight: 1.25, color: "#555" }}><strong>{e.degree}</strong>{e.school ? <><br />{e.school}</> : ""}{e.year ? ` (${e.year})` : ""}</p>
              ))}
            </div>
          )}

          {data.certifications.length > 0 && (
            <div>
              <h2 style={{ fontSize: 9.5, fontWeight: 700, color: BURGUNDY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Times New Roman', serif" }}>Certifications</h2>
              {data.certifications.map((c, k) => <p key={k} style={{ fontSize: 9, margin: "1px 0", color: "#555" }}>— {c}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
