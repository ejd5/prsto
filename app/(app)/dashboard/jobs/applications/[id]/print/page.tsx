"use client";

import { useState, useEffect } from "react";
import { Loader2, Printer } from "lucide-react";

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [docType, setDocType] = useState("");

  useEffect(() => {
    params.then(async ({ id }) => {
      const type = new URLSearchParams(window.location.search).get("type") || "full";
      setDocType(type);
      const res = await fetch(`/api/application-drafts/${id}`);
      const data = await res.json();
      const draft = data.draft;
      if (!draft) { setLoading(false); return; }
      const job = draft.job;
      const co = draft.company || "Inconnu";
      setTitle(`Candidature - ${job.title} - ${job.company}`);
      let text = "";
      if (type === "resume") text = draft.tailoredResumeContent || "";
      else if (type === "letter") text = draft.motivationLetterLong || "";
      else text = [
        `=== DOSSIER DE CANDIDATURE ===`,
        `Poste : ${job.title}`,
        `Entreprise : ${job.company}`,
        `Localisation : ${job.location || "N/A"}`,
        `Score : ${draft.matchScore || "?"}/100`,
        ``,
        `=== CV ADAPTÉ ===`,
        draft.tailoredResumeContent || "",
        ``,
        `=== LETTRE DE MOTIVATION ===`,
        draft.motivationLetterLong || "",
      ].join("\n\n");
      setContent(text);
      setLoading(false);
    });
  }, [params]);

  const fit = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fit") === "1";

  // Fit scaling hook
  useEffect(() => {
    if (typeof window === "undefined" || !fit) return;
    const handleResize = () => {
      const container = document.getElementById("letter-fit-container");
      if (!container) return;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const targetH = 1123; // A4 height
      const targetW = 794;  // A4 width
      const scale = Math.min((vh - 40) / targetH, (vw - 40) / targetW, 1);
      container.style.setProperty("--letter-scale", scale.toString());
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fit]);

  const parseLetter = (text: string) => {
    const lines = text.split("\n").map(l => l.trim());
    let objectText = "";
    let salutationText = "";
    const bodyParagraphs: string[] = [];
    const signatureLines: string[] = [];
    let inSignature = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      if (line.toLowerCase().startsWith("objet")) {
        objectText = line;
      } else if (line.toLowerCase().startsWith("madame, monsieur") || line.toLowerCase().startsWith("madame monsieur")) {
        salutationText = line;
      } else if (
        line.toLowerCase().startsWith("cordialement") || 
        line.toLowerCase().startsWith("bien cordialement") || 
        line.toLowerCase().startsWith("sincères salutations") || 
        line.toLowerCase().startsWith("je vous prie d'agréer") ||
        line.toLowerCase().startsWith("veuillez agréer")
      ) {
        inSignature = true;
        signatureLines.push(line);
      } else if (inSignature) {
        signatureLines.push(line);
      } else {
        bodyParagraphs.push(line);
      }
    }

    return { objectText, salutationText, bodyParagraphs, signatureLines };
  };

  const parsed = parseLetter(content);
  const hasParsed = (parsed.objectText || parsed.salutationText || parsed.bodyParagraphs.length > 0) && docType === "letter";

  if (loading) return <div className="p-12 flex justify-center" style={{ background: "#fff" }}><Loader2 size={20} className="animate-spin" /></div>;

  return (
    <div style={{ background: fit ? "#111" : "#fff", color: "#000", minHeight: "100vh", display: fit ? "flex" : "block", justifyContent: "center", alignItems: "center", overflow: fit ? "hidden" : "auto", position: "relative" }}>
      {fit && (
        <div className="no-print" style={{ position: "fixed", top: "15px", right: "15px", zIndex: 1000 }}>
          <button 
            onClick={() => window.close()}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
              transition: "transform 0.2s"
            }}
            title="Fermer la prévisualisation"
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            ✕
          </button>
        </div>
      )}
      {!fit && (
        <div className="no-print" style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ background: "#B8860B", color: "#000", border: "none", cursor: "pointer" }}>
            <Printer size={14} /> Imprimer / PDF
          </button>
        </div>
      )}
      <div 
        id="letter-fit-container"
        style={fit ? {
          width: "210mm",
          height: "297mm",
          padding: "3.5cm 2.5cm",
          boxSizing: "border-box",
          background: "#fff",
          transform: "scale(var(--letter-scale, 1))",
          transformOrigin: "top center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        } : { 
          padding: "3cm 2.5cm", 
          maxWidth: "210mm", 
          margin: "0 auto",
          background: "#fff",
          minHeight: "297mm",
          boxSizing: "border-box"
        }}
      >
        {hasParsed ? (
          <div style={{ fontFamily: "'Times New Roman', serif", fontSize: "12pt", lineHeight: 1.6, color: "#000", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
            {parsed.objectText && (
              <div style={{ fontWeight: "bold", marginBottom: "3rem" }}>
                {parsed.objectText}
              </div>
            )}
            {parsed.salutationText && (
              <div style={{ marginBottom: "2.5rem" }}>
                {parsed.salutationText}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {parsed.bodyParagraphs.map((p, idx) => (
                <p key={idx} style={{ margin: 0, textIndent: "1.25cm", textAlign: "justify" }}>
                  {p}
                </p>
              ))}
            </div>
            {parsed.signatureLines.length > 0 && (
              <div style={{ marginTop: "5rem", textAlign: "left" }}>
                {parsed.signatureLines.map((line, idx) => {
                  const isName = idx === 1 || line.toUpperCase().includes("ELTON DUARTE");
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        fontWeight: isName ? "bold" : "normal", 
                        marginBottom: idx === 0 ? "1.2rem" : "0.3rem" 
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontFamily: "'Times New Roman', serif", fontSize: "12pt", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {content}
          </div>
        )}
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
          html, body { background: #fff !important; }
          body > div { background: #fff !important; }
          aside, nav, header, footer { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
        }
        ${fit ? `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #111 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
          }
        ` : ""}
      `}</style>
    </div>
  );
}
