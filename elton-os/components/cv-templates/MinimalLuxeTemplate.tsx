"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, showPhoto, showLinkedIn, getTargetJobLabel, isAdapted } from "./cv-template-utils";

const NEAR_BLACK = "#111111";
const CHAMPAGNE = "#C9A85D";
const IVORY = "#FAF7EF";
const WARM_GRAY = "#6F6A60";

export default function MinimalLuxeTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);
  const targetLabel = getTargetJobLabel(data);
  const adapted = isAdapted(data);

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10.5, width: "100%", color: NEAR_BLACK, background: IVORY, lineHeight: 1.4, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "32px 50px 20px" }}>
        {photo && i.photoUrl && (
          <img src={i.photoUrl} alt="" style={{ width: 55, height: 70, borderRadius: "6px", objectFit: "cover", marginBottom: 10, border: `1px solid ${CHAMPAGNE}` }} />
        )}
        <h1 style={{ fontSize: 20, fontWeight: 400, margin: 0, letterSpacing: 2, textTransform: "uppercase" }}>{i.fullName || ""}</h1>
        <div style={{ width: 30, height: 1, background: CHAMPAGNE, margin: "8px auto" }} />
        <p style={{ fontSize: 11, color: WARM_GRAY, margin: "0 0 2px", fontWeight: 400 }}>{i.title || ""}</p>
        {adapted && targetLabel && (
          <p style={{ fontSize: 8, color: WARM_GRAY, margin: "0 0 4px", fontStyle: "italic", opacity: 0.7 }}>Candidature : {targetLabel}</p>
        )}
        <div style={{ fontSize: 9, color: WARM_GRAY, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
          {i.email && <span>{i.email}</span>}
          {i.phone && <span>{i.phone}</span>}
          {i.location && <span>{i.location}</span>}
          {linkedin && <span>{i.linkedin?.replace(/^https?:\/\/(www\.)?/, "").replace("linkedin.com/in/", "")}</span>}
        </div>
      </div>

      <div style={{ height: 1, background: CHAMPAGNE, opacity: 0.25, margin: "0 50px" }} />

      <div style={{ padding: "24px 50px 20px", display: "flex", gap: 30, flex: 1 }}>
        {/* Colonne gauche */}
        <div style={{ flex: 1 }}>
          {data.summary && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 9, fontWeight: 600, color: CHAMPAGNE, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Profil</h2>
              <p style={{ fontSize: 10.5, color: "#333", lineHeight: 1.5, margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 9, fontWeight: 600, color: CHAMPAGNE, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Expériences professionnelles</h2>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {data.experiences.map((exp, j) => (
                  <div key={j} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>{exp.title}</h3>
                      <span style={{ fontSize: 8.5, color: WARM_GRAY, whiteSpace: "nowrap", marginLeft: 10 }}>{formatDateRange(exp)}</span>
                    </div>
                    <p style={{ fontSize: 10, color: WARM_GRAY, margin: "2px 0 4px" }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                    {exp.description && <p style={{ fontSize: 10, color: "#444", margin: "0 0 2px" }}>{exp.description}</p>}
                    {(exp.bullets || exp.achievements)?.slice(0, 3).map((b, k) => (
                      <p key={k} style={{ fontSize: 9.5, color: "#555", margin: "1px 0 1px 0" }}>{b}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ width: 170, flexShrink: 0 }}>
          {data.skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 9, fontWeight: 600, color: CHAMPAGNE, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Expertise</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {data.skills.map((s, k) => (
                  <span key={k} style={{ fontSize: 9.5, color: NEAR_BLACK, paddingBottom: 3, borderBottom: "1px solid rgba(201,168,93,0.12)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {data.languages.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 9, fontWeight: 600, color: CHAMPAGNE, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Langues</h2>
              {data.languages.map((l, k) => (
                <p key={k} style={{ fontSize: 9.5, margin: "2px 0", color: "#333" }}>{l.name}{l.level ? ` · ${l.level}` : ""}</p>
              ))}
            </div>
          )}

          {data.education.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 9, fontWeight: 600, color: CHAMPAGNE, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Formation</h2>
              {data.education.map((e, k) => (
                <p key={k} style={{ fontSize: 9, margin: "2px 0", lineHeight: 1.3, color: "#444" }}><strong>{e.degree}</strong>{e.school ? <><br />{e.school}</> : ""}{e.year ? ` (${e.year})` : ""}</p>
              ))}
            </div>
          )}

          {data.certifications.length > 0 && (
            <div>
              <h2 style={{ fontSize: 9, fontWeight: 600, color: CHAMPAGNE, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Certifications</h2>
              {data.certifications.map((c, k) => <p key={k} style={{ fontSize: 9, margin: "1px 0", color: "#444" }}>{c}</p>)}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: CHAMPAGNE, opacity: 0.2, margin: "0 50px 20px" }} />
    </div>
  );
}
