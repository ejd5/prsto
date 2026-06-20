"use client";

import { useState, useEffect } from "react";
import { Loader2, Printer, ArrowLeft } from "lucide-react";

interface DraftData {
  tailoredResumeContent: string | null;
  job: { title: string; company: string | null; location: string | null };
}

interface ProfileData {
  fullName: string; title: string; phone: string; email: string; linkedin: string; location: string; photoUrl: string | null;
}

export default function CvPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<"classic" | "modern">("modern");
  const [showPhoto] = useState(true);

  useEffect(() => {
    params.then(async ({ id }) => {
      const [draftRes, profRes] = await Promise.all([
        fetch(`/api/application-drafts/${id}`),
        fetch("/api/profile"),
      ]);
      const draftData = await draftRes.json();
      const profData = await profRes.json();
      setDraft(draftData.draft);
      setProfile(profData.profile);
      setLoading(false);
      // Auto-print after load
      setTimeout(() => window.print(), 1200);
    });
  }, [params]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fff" }}>
      <div className="text-center">
        <Loader2 size={30} className="animate-spin mx-auto mb-3" style={{ color: "#C8A64E" }} />
        <p className="text-sm" style={{ color: "#666" }}>Préparation du CV...</p>
      </div>
    </div>
  );

  const resumeText = draft?.tailoredResumeContent || "";
  const job = draft?.job;
  const p = profile;

  // Parser le texte du CV en sections
  const lines = resumeText.split("\n").filter((l) => l.trim().length > 0);
  const sections: Record<string, string[]> = { header: [], summary: [], experience: [], skills: [], formation: [], languages: [], certifications: [] };
  let currentSection = "header";
  for (const line of lines) {
    const upper = line.trim().toUpperCase();
    if (upper.includes("RÉSUMÉ") || upper.includes("RESUME")) { currentSection = "summary"; continue; }
    if (upper.includes("EXPÉRIENCE") || upper.includes("EXPERIENCE")) { currentSection = "experience"; continue; }
    if (upper.includes("COMPÉTENCE") || upper.includes("COMPETENCE") || upper.includes("SKILLS")) { currentSection = "skills"; continue; }
    if (upper.includes("FORMATION")) { currentSection = "formation"; continue; }
    if (upper.includes("LANGUE") || upper.includes("LANGUES")) { currentSection = "languages"; continue; }
    if (upper.includes("CERTIFICATION")) { currentSection = "certifications"; continue; }
    sections[currentSection].push(line.trim());
  }

  return (
    <>
      {/* Boutons d'action (cachés à l'impression) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 no-print" style={{ printColorAdjust: "exact" }}>
        <button onClick={() => setTemplate("modern")} className="px-3 py-1.5 rounded text-xs font-mono border"
          style={{ background: template === "modern" ? "#C8A64E" : "#fff", color: template === "modern" ? "#000" : "#666", borderColor: "#C8A64E" }}>
          Moderne
        </button>
        <button onClick={() => setTemplate("classic")} className="px-3 py-1.5 rounded text-xs font-mono border"
          style={{ background: template === "classic" ? "#C8A64E" : "#fff", color: template === "classic" ? "#000" : "#666", borderColor: "#C8A64E" }}>
          Classique
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono font-bold"
          style={{ background: "#C8A64E", color: "#000", border: "none" }}>
          <Printer size={12} /> Imprimer PDF
        </button>
      </div>

      {/* Page CV */}
      <div className="min-h-screen" style={{ background: "#fff", fontFamily: "Georgia, 'Times New Roman', serif" }}>

        {template === "modern" ? (
          <div className="max-w-[210mm] mx-auto" style={{ color: "#1a1a1a" }}>
            {/* Header moderne */}
            <div className="flex items-start gap-6 p-10 pb-6" style={{ borderBottom: "3px solid #C8A64E" }}>
              {showPhoto && p?.photoUrl && (
                <img src={p.photoUrl} alt="" className="rounded-full flex-shrink-0"
                  style={{ width: 100, height: 100, objectFit: "cover", border: "2px solid #C8A64E" }} />
              )}
              <div className="flex-1">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px" }}>{p?.fullName || ""}</h1>
                <p style={{ fontSize: 15, color: "#C8A64E", margin: "4px 0 10px", fontWeight: 600 }}>{p?.title || ""}</p>
                <div style={{ fontSize: 11, color: "#555", display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                  {p?.email && <span>✉ {p.email}</span>}
                  {p?.phone && <span>✆ {p.phone}</span>}
                  {p?.location && <span>📍 {p.location}</span>}
                  {p?.linkedin && <span>🔗 {p.linkedin}</span>}
                </div>
              </div>
            </div>

            <div className="px-10 py-6 space-y-5" style={{ fontSize: 12, lineHeight: 1.7 }}>
              {/* Résumé */}
              {sections.summary.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C8A64E", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Résumé</h2>
                  <p style={{ color: "#333", margin: 0 }}>{sections.summary.join(" ")}</p>
                </div>
              )}

              {/* Expériences */}
              {sections.experience.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C8A64E", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Expérience professionnelle</h2>
                  <div className="space-y-4">
                    {sections.experience.map((exp, i) => (
                      <div key={i} style={{ paddingLeft: exp.startsWith("•") ? 12 : 0 }}>
                        {exp.startsWith("•") ? (
                          <p style={{ color: "#333", margin: "2px 0" }}>{exp.replace("• ", "")}</p>
                        ) : (
                          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: "6px 0 2px" }}>{exp}</h3>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compétences */}
              {sections.skills.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C8A64E", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Compétences</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 4px" }}>
                    {sections.skills.map((s, i) => {
                      const clean = s.replace(/^[•\-]\s*/, "");
                      return <span key={i} style={{ background: "#F5F0E8", color: "#333", padding: "2px 10px", borderRadius: 3, fontSize: 11 }}>{clean}</span>;
                    })}
                  </div>
                </div>
              )}

              {/* Formation */}
              {sections.formation.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C8A64E", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Formation</h2>
                  {sections.formation.map((f, i) => (
                    <p key={i} style={{ color: "#333", margin: "1px 0", fontSize: 12 }}>{f.replace(/^[•\-]\s*/, "")}</p>
                  ))}
                </div>
              )}

              {/* Langues */}
              {sections.languages.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C8A64E", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Langues</h2>
                  {sections.languages.map((l, i) => (
                    <p key={i} style={{ color: "#333", margin: "1px 0", fontSize: 12 }}>{l.replace(/^[•\-]\s*/, "")}</p>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {sections.certifications.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "#C8A64E", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Certifications</h2>
                  {sections.certifications.map((c, i) => (
                    <p key={i} style={{ color: "#333", margin: "1px 0", fontSize: 12 }}>{c.replace(/^[•\-]\s*/, "")}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-10 py-4 text-center" style={{ borderTop: "1px solid #ddd", fontSize: 9, color: "#999" }}>
              CV généré par ELTON OS — {job?.title || ""} — {job?.company || ""}
            </div>
          </div>
        ) : (
          /* ─── Template Classique ─── */
          <div className="max-w-[210mm] mx-auto p-10" style={{ color: "#1a1a1a" }}>
            <div className="text-center mb-6">
              {showPhoto && p?.photoUrl && (
                <img src={p.photoUrl} alt="" className="rounded-full mx-auto mb-3"
                  style={{ width: 90, height: 90, objectFit: "cover", border: "2px solid #C8A64E" }} />
              )}
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 2 }}>{p?.fullName || ""}</h1>
              <p style={{ fontSize: 14, color: "#555", margin: "4px 0" }}>{p?.title || ""}</p>
              <div style={{ fontSize: 10, color: "#777", display: "flex", justifyContent: "center", gap: 16, marginTop: 6 }}>
                {p?.email && <span>{p.email}</span>}
                {p?.phone && <span>{p.phone}</span>}
                {p?.location && <span>{p.location}</span>}
              </div>
            </div>
            <div className="text-center mb-6" style={{ borderTop: "1px solid #C8A64E", borderBottom: "1px solid #C8A64E", padding: "6px 0" }} />

            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              {resumeText.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} style={{ height: 8 }} />;
                const upper = trimmed.toUpperCase();
                if (["RÉSUMÉ", "RESUME", "EXPÉRIENCE", "EXPERIENCE", "COMPÉTENCES", "COMPETENCES", "FORMATION", "LANGUES", "CERTIFICATIONS"].some((t) => upper.startsWith(t))) {
                  return <h2 key={i} style={{ fontSize: 14, fontWeight: 700, margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #ddd", paddingBottom: 3 }}>{trimmed}</h2>;
                }
                return <p key={i} style={{ margin: "2px 0", color: "#333" }}>{trimmed}</p>;
              })}
            </div>
            <div className="text-center mt-8 pt-4" style={{ borderTop: "1px solid #ddd", fontSize: 9, color: "#999" }}>
              CV généré par ELTON OS — {job?.title || ""} — {job?.company || ""}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: #fff !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>
    </>
  );
}
