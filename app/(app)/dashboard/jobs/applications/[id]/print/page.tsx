"use client";

import { useState, useEffect } from "react";
import { Loader2, Printer } from "lucide-react";

export default function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ id }) => {
      const type = new URLSearchParams(window.location.search).get("type") || "full";
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

  if (loading) return <div className="p-12 flex justify-center" style={{ background: "#fff" }}><Loader2 size={20} className="animate-spin" /></div>;

  return (
    <div style={{ background: "#fff", color: "#000", minHeight: "100vh" }}>
      <div className="no-print" style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #ddd" }}>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ background: "#B8860B", color: "#000", border: "none", cursor: "pointer" }}>
          <Printer size={14} /> Imprimer / PDF
        </button>
      </div>
      <div style={{ padding: "2cm", maxWidth: "210mm", margin: "0 auto" }}>
        <div style={{ fontFamily: "'Times New Roman', serif", fontSize: "12pt", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {content}
        </div>
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
      `}</style>
    </div>
  );
}
