"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, accentHex, accentBg, showPhoto, showLinkedIn, getTargetJobLabel, findAtsKeywordsInText, isAdapted } from "./cv-template-utils";

export default function AtsClassicTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const ac = accentHex(data);
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);
  const targetLabel = getTargetJobLabel(data);
  const adapted = isAdapted(data);

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10.5, width: "100%", color: "#333", background: "#fff", lineHeight: 1.35, padding: "24px 36px 20px", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 12, borderBottom: `2px solid ${accentBg(data, 0.3)}`, paddingBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 1, color: ac }}>{i.fullName || ""}</h1>
        <p style={{ fontSize: 11, margin: "3px 0 4px", fontWeight: 600, color: "#555" }}>{i.title || ""}</p>
        {adapted && targetLabel && (
          <p style={{ fontSize: 9, opacity: 0.7, margin: "0 0 4px", fontStyle: "italic", color: ac }}>Candidature : {targetLabel}</p>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 9, color: "#666", flexWrap: "wrap" }}>
          {i.location && <span>{i.location}</span>}
          {i.phone && <span>{i.phone}</span>}
          {i.email && <span>{i.email}</span>}
          {linkedin && <span>{i.linkedin?.replace(/^https?:\/\/(www\.)?/, "")}</span>}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {data.summary && (
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 2, marginBottom: 4 }}>Profil</h2>
            <p style={{ fontSize: 10, color: "#444", margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {data.experiences.length > 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 2, marginBottom: 6 }}>Expériences professionnelles</h2>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {data.experiences.map((exp, j) => (
                <div key={j} style={{ marginBottom: j < data.experiences.length - 1 ? 4 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontSize: 10.5, fontWeight: 700, margin: 0 }}>{exp.title}</h3>
                    <span style={{ fontSize: 9, color: "#666", whiteSpace: "nowrap" }}>{formatDateRange(exp)}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "#555", margin: "1px 0" }}>{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
                  {exp.description && <p style={{ fontSize: 9.5, color: "#444", margin: "1px 0 0", lineHeight: 1.25 }}>{exp.description}</p>}
                  {(exp.bullets || exp.achievements)?.slice(0, 3).map((b, k) => <p key={k} style={{ fontSize: 9.5, color: "#444", margin: "1px 0 1px 6px", lineHeight: 1.2 }}>• {b}</p>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.skills.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 2, marginBottom: 4 }}>Compétences</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {data.skills.map((s, k) => {
                const isMatch = findAtsKeywordsInText(s, data).length > 0;
                return (
                  <span key={k} style={{ background: isMatch ? accentBg(data, 0.2) : accentBg(data, 0.1), padding: "1px 6px", borderRadius: 3, fontSize: 9.5, color: "#333", fontWeight: isMatch ? 600 : 400 }}>{s}</span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
          {data.education.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 2, marginBottom: 4 }}>Formation</h2>
              {data.education.map((e, k) => (
                <div key={k} style={{ marginBottom: 1, fontSize: 9.5 }}>
                  <span style={{ fontWeight: 600 }}>{e.degree}</span>
                  {e.school && <span> — {e.school}</span>}
                  {e.year && <span style={{ color: "#888", marginLeft: 4 }}>{e.year}</span>}
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1, display: "flex", gap: 32 }}>
            {data.languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 2, marginBottom: 4 }}>Langues</h2>
                {data.languages.map((l, k) => (
                  <p key={k} style={{ fontSize: 9.5, margin: "1px 0" }}>{l.name}{l.level ? ` — ${l.level}` : ""}</p>
                ))}
              </div>
            )}

            {data.certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${accentBg(data, 0.2)}`, paddingBottom: 2, marginBottom: 4 }}>Certifications</h2>
                {data.certifications.map((c, k) => <p key={k} style={{ fontSize: 9.5, margin: "1px 0" }}>• {c}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
