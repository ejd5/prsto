"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, showPhoto, showLinkedIn, getTargetJobLabel, findAtsKeywordsInText, isAdapted } from "./cv-template-utils";

const DEEP_BLUE = "#17324D";
const STEEL_BLUE = "#2F5D7C";

export default function StrategicBlueTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);
  const targetLabel = getTargetJobLabel(data);
  const adapted = isAdapted(data);

  const kpis = data.achievements.filter(a => a.value && /\d/.test(a.value)).slice(0, 4);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10.5, width: "100%", color: "#202833", background: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Bandeau haut */}
      <div style={{ background: DEEP_BLUE, color: "#fff", padding: "24px 36px 18px", display: "flex", alignItems: "center", gap: 20 }}>
        {photo && i.photoUrl && (
          <img src={i.photoUrl} alt="" style={{ width: 60, height: 75, borderRadius: "6px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{i.fullName || ""}</h1>
          <p style={{ fontSize: 12, opacity: 0.85, margin: "3px 0 2px", fontWeight: 600 }}>{i.title || ""}</p>
          {adapted && targetLabel && (
            <p style={{ fontSize: 9, opacity: 0.6, margin: "0 0 4px", fontStyle: "italic" }}>Candidature : {targetLabel}</p>
          )}
          <div style={{ display: "flex", gap: 16, fontSize: 9, opacity: 0.75, flexWrap: "wrap" }}>
            {i.email && <span>{i.email}</span>}
            {i.phone && <span>{i.phone}</span>}
            {i.location && <span>{i.location}</span>}
            {linkedin && <span>{i.linkedin?.replace(/^https?:\/\/(www\.)?/, "")}</span>}
          </div>
        </div>
      </div>

      {/* KPI row */}
      {kpis.length > 0 && (
        <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${DEEP_BLUE}` }}>
          {kpis.map((kpi, k) => (
            <div key={k} style={{ flex: 1, textAlign: "center", padding: "8px 6px", background: "#EAF1F6", borderRight: k < kpis.length - 1 ? "1px solid #d0dde8" : "none" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: DEEP_BLUE, margin: 0 }}>{kpi.value}</p>
              <p style={{ fontSize: 8, color: STEEL_BLUE, margin: "1px 0 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "24px 36px", display: "flex", gap: 28, flex: 1 }}>
        {/* Colonne gauche */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {data.summary && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, borderBottom: `2px solid ${DEEP_BLUE}`, paddingBottom: 3 }}>Résumé</h2>
              <p style={{ fontSize: 10.5, color: "#444", lineHeight: 1.45, margin: 0 }}>{data.summary}</p>
            </div>
          )}

          {data.experiences.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8, borderBottom: `2px solid ${DEEP_BLUE}`, paddingBottom: 3 }}>Expériences professionnelles</h2>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {data.experiences.map((exp, j) => (
                  <div key={j} style={{ paddingBottom: j < data.experiences.length - 1 ? 8 : 0, borderBottom: j < data.experiences.length - 1 ? "1px solid #EAF1F6" : "none", marginBottom: j < data.experiences.length - 1 ? 6 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ fontSize: 11.5, fontWeight: 700, margin: 0, color: "#202833" }}>{exp.title}</h3>
                      <span style={{ fontSize: 9, color: STEEL_BLUE, whiteSpace: "nowrap", marginLeft: 8, fontWeight: 600 }}>{formatDateRange(exp)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: DEEP_BLUE, margin: "2px 0 4px", fontWeight: 600 }}>{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
                    {exp.description && <p style={{ fontSize: 10, color: "#555", margin: "0 0 3px" }}>{exp.description}</p>}
                    {(exp.bullets || exp.achievements)?.slice(0, 3).map((b, k) => (
                      <p key={k} style={{ fontSize: 9.5, color: "#666", margin: "1px 0 1px 0", paddingLeft: 10, position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: DEEP_BLUE }}>▸</span> {b}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ width: 200, flexShrink: 0 }}>
          {data.skills.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Compétences clés</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {data.skills.map((s, k) => {
                  const isMatch = findAtsKeywordsInText(s, data).length > 0;
                  return (
                    <span key={k} style={{ fontSize: 9.5, padding: "4px 8px", background: isMatch ? "#C8DFEF" : "#EAF1F6", color: DEEP_BLUE, borderRadius: 3, fontWeight: isMatch ? 600 : 500 }}>{s}</span>
                  );
                })}
              </div>
            </div>
          )}

          {data.languages.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Langues</h2>
              {data.languages.map((l, k) => (
                <p key={k} style={{ fontSize: 10, margin: "2px 0", color: "#202833" }}>{l.name}{l.level ? ` — ${l.level}` : ""}</p>
              ))}
            </div>
          )}

          {data.education.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Formation</h2>
              {data.education.map((e, k) => (
                <p key={k} style={{ fontSize: 9.5, margin: "2px 0", lineHeight: 1.3, color: "#555" }}><strong>{e.degree}</strong>{e.school ? <><br />{e.school}</> : ""}{e.year ? ` (${e.year})` : ""}</p>
              ))}
            </div>
          )}

          {data.certifications.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: DEEP_BLUE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Certifications</h2>
              {data.certifications.map((c, k) => <p key={k} style={{ fontSize: 9.5, margin: "2px 0", color: "#555" }}>— {c}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
