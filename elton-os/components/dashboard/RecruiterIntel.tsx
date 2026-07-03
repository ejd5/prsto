"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardroomData } from "@/lib/actions/boardroom-dashboard";

interface RecruiterIntelProps {
  recruiters: BoardroomData["recruiters"];
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = [
    "linear-gradient(135deg, #C8A64E, #7A5F2A)",
    "linear-gradient(135deg, #60A5FA, #1D4ED8)",
    "linear-gradient(135deg, #4ADE80, #166534)",
    "linear-gradient(135deg, #F472B6, #9D174D)",
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ background: colors[colorIdx], fontSize: 12 }}>{initials}</div>
  );
}

export default function RecruiterIntel({ recruiters }: RecruiterIntelProps) {
  const router = useRouter();
  const [activeRecruiter, setActiveRecruiter] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleAiApproach = (name: string, company: string) => {
    setActiveRecruiter(name);
    setCopied(false);
    setTemplateText(`Bonjour ${name.split(" ")[0]},\n\nJ'ai suivi l'activité de ${company}. En tant que dirigeant spécialisé en transformation commerciale et pilotage de la croissance, je serais ravi d'échanger sur vos enjeux de recrutement.\n\nAu plaisir,\n[Votre Nom]`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(templateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (recruiters.length === 0) {
    return (
      <div className="widget-card flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="section-label">RECRUITER INTELLIGENCE</span>
          <button className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--or)" }}
            onClick={() => router.push("/dashboard/jobs/crm")}>View All</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,166,78,0.08)" }}>
            <span style={{ fontSize: 18, opacity: 0.5 }}>👤</span>
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--texte)" }}>Aucun contact recruteur</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--texte-tertiaire)" }}>Ajoute des contacts CRM pour voir apparaître ton réseau de recruteurs.</p>
          </div>
          <button onClick={() => router.push("/dashboard/jobs/crm")}
            className="text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>Gérer les contacts →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="widget-card flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">RECRUITER INTELLIGENCE</span>
        <button className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--or)" }}
          onClick={() => router.push("/dashboard/jobs/crm")}>View All</button>
      </div>

      <div className="flex-1 space-y-2">
        {recruiters.slice(0, 3).map((recruiter) => {
          const rateColor = recruiter.responseRate >= 95 ? "var(--succes)" : recruiter.responseRate >= 80 ? "var(--or)" : "var(--warning)";
          return (
            <div key={recruiter.id} className="flex items-center gap-2.5 p-2.5 rounded-lg"
              style={{ background: "var(--fond-widget)", border: "1px solid var(--bordure-douce)" }}>
              <Avatar name={recruiter.name} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 11.5, color: "var(--texte)" }}>{recruiter.name}</div>
                <div style={{ fontSize: 10, color: "var(--texte-tertiaire)", marginTop: 1 }}>{recruiter.company}</div>
                <div style={{ fontSize: 9.5, color: rateColor, marginTop: 2 }}>{recruiter.responseRate}% Response Rate</div>
              </div>
              <button
                className="flex-shrink-0 px-2 py-1 rounded text-xs font-semibold transition-all"
                style={{ background: "rgba(200,166,78,0.1)", color: "var(--or)", border: "1px solid rgba(200,166,78,0.25)", fontSize: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,166,78,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(200,166,78,0.1)"; }}
                onClick={() => handleAiApproach(recruiter.name, recruiter.company)}
              >✉️ Message IA</button>
            </div>
          );
        })}
      </div>

      {activeRecruiter && (
        <div className="absolute inset-0 z-20 p-4 rounded-xl flex flex-col justify-between"
          style={{ background: "rgba(13,31,24,0.98)", border: "1.5px solid var(--or)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block">Executive Approach</span>
              <h4 className="text-xs font-bold text-white">To: {activeRecruiter}</h4>
            </div>
            <button className="text-white/40 hover:text-white text-base" onClick={() => setActiveRecruiter(null)}>✕</button>
          </div>
          <textarea className="w-full flex-1 my-3 p-2 text-xs rounded border bg-black/40 text-white/80 focus:outline-none"
            style={{ borderColor: "rgba(255,255,255,0.1)" }} value={templateText} onChange={(e) => setTemplateText(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="px-3 py-1 rounded text-[10px] bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={() => setActiveRecruiter(null)}>Fermer</button>
            <button className="px-3 py-1 rounded text-[10px] font-bold transition-all"
              style={{ background: copied ? "var(--succes)" : "var(--or)", color: "#0B1F18" }} onClick={handleCopy}>
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
