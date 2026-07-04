"use client";

import type { CvRenderData } from "./cv-template-types";
import { formatDateRange, accentHex, accentBg, showPhoto, showLinkedIn, getTargetJobLabel, isAdapted } from "./cv-template-utils";

export default function ModernExecutiveTemplate({ data }: { data: CvRenderData }) {
  const i = data.identity;
  const ac = accentHex(data);
  const photo = showPhoto(data);
  const linkedin = showLinkedIn(data);
  const targetLabel = getTargetJobLabel(data);
  const adapted = isAdapted(data);

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10.5, width: "100%", color: "#1a1a1a", display: "flex", background: "#fff", height: "100%", lineHeight: 1.3 }}>
      {/* Sidebar gauche */}
      <div style={{ width: 200, background: ac, color: "#fff", padding: "20px 14px 16px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        {photo && i.photoUrl && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <img src={i.photoUrl} alt="" style={{ width: 70, height: 90, borderRadius: "6px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)" }} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px", color: "#fff" }}>{i.fullName || ""}</h1>
          <p style={{ fontSize: 10, opacity: 0.8, margin: 0 }}>{i.title || ""}</p>
          {adapted && targetLabel && (
            <p style={{ fontSize: 8, opacity: 0.6, margin: "2px 0 0", fontStyle: "italic" }}>Candidature : {targetLabel}</p>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, opacity: 0.7 }}>Contact</h3>
          <div style={{ fontSize: 9.5, lineHeight: 1.5, opacity: 0.9 }}>
            {i.email && <div>✉ {i.email}</div>}
            {i.phone && <div>✆ {i.phone}</div>}
            {i.location && <div>📍 {i.location}</div>}
            {linkedin && <div style={{ wordBreak: "break-all", fontSize: 9 }}>🔗 {i.linkedin?.replace("linkedin.com/in/", "")}</div>}
          </div>
        </div>

        {data.skills.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, opacity: 0.7 }}>Compétences clés</h3>
            {data.skills.slice(0, 14).map((s, i) => (
              <div key={i} style={{ fontSize: 9.5, padding: "1px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{s}</div>
            ))}
          </div>
        )}

        {data.languages.length > 0 && (
          <div style={{ marginTop: "auto" }}>
            <h3 style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, opacity: 0.7 }}>Langues</h3>
            {data.languages.map((l, i) => (
              <div key={i} style={{ fontSize: 9.5, padding: "1px 0" }}>{l.name}{l.level ? ` — ${l.level}` : ""}</div>
            ))}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, padding: "28px 30px 20px", display: "flex", flexDirection: "column" }}>
        {data.summary && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Profil exécutif</h2>
            <p style={{ fontSize: 10.5, color: "#444", lineHeight: 1.45, margin: 0 }}>{data.summary}</p>
          </div>
        )}

        {data.experiences.length > 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Expériences professionnelles</h2>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {data.experiences.map((exp, j) => (
                <div key={j} style={{ marginBottom: j < data.experiences.length - 1 ? 6 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>{exp.title}</h3>
                    <span style={{ fontSize: 9, color: "#888", whiteSpace: "nowrap" }}>{formatDateRange(exp)}</span>
                  </div>
                  <p style={{ fontSize: 10.5, color: ac, margin: "2px 0 3px", fontWeight: 600 }}>{exp.company}</p>
                  {exp.location && <p style={{ fontSize: 9, color: "#999", margin: "0 0 2px" }}>{exp.location}</p>}
                  {exp.description && <p style={{ fontSize: 10, color: "#444", margin: 0 }}>{exp.description}</p>}
                  {(exp.bullets || exp.achievements)?.slice(0, 3).map((b, k) => <p key={k} style={{ fontSize: 9.5, color: "#555", margin: "1px 0 1px 4px" }}>• {b}</p>)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
          {data.education.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Formation</h2>
              {data.education.map((e, j) => (
                <p key={j} style={{ fontSize: 9.5, margin: "2px 0", lineHeight: 1.3 }}><strong>{e.degree}</strong><br />{e.school}{e.year ? ` (${e.year})` : ""}</p>
              ))}
            </div>
          )}
          {data.certifications.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, color: ac, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Certifications</h2>
              {data.certifications.map((c, j) => <p key={j} style={{ fontSize: 9.5, margin: "1px 0" }}>• {c}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
