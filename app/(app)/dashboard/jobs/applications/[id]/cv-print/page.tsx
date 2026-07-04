"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Download, Printer, AlertTriangle } from "lucide-react";
import CvTemplateRenderer from "@/components/cv-templates/CvTemplateRenderer";
import type { CvTemplateId, CvRenderData } from "@/components/cv-templates/cv-template-types";
import { resolveTemplate, TEMPLATE_LABELS, TEMPLATE_BADGES } from "@/components/cv-templates/cv-template-types";
import { buildCvRenderData } from "@/lib/cv-render/build-data";
import CvAutoFit from "@/components/cv-templates/CvAutoFit";

const EXPERIMENTAL_TEMPLATES: CvTemplateId[] = [
  "premium_leadership", "executive_bordeaux", "strategic_blue", "minimal_luxe",
];

const VALIDATED_TEMPLATES: CvTemplateId[] = [
  "ats_classic", "modern_executive",
];

export default function CvPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const isPrintMode = searchParams.get("print") === "1";
  const [data, setData] = useState<CvRenderData | null>(null);
  const [baseData, setBaseData] = useState<CvRenderData | null>(null); // CV maître
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<CvTemplateId>("ats_classic");
  const [draftId, setDraftId] = useState<string>("");
  const [showAdapted, setShowAdapted] = useState(true);
  const [hasAdaptedData, setHasAdaptedData] = useState(false);

  const [adaptedData, setAdaptedData] = useState<CvRenderData | null>(null);

  useEffect(() => {
    const tplParam = resolveTemplate(searchParams.get("template"));
    params.then(async ({ id }) => {
      setDraftId(id);
      try {
        const [draftRes, profRes] = await Promise.all([
          fetch(`/api/application-drafts/${id}`),
          fetch("/api/profile"),
        ]);
        const draftData = await draftRes.json();
        const profData = await profRes.json();
        const prof = profData.profile;
        const draft = draftData.draft;

        let experiences: { company: string; title: string; startDate?: string; endDate?: string | null; description?: string | null; achievements?: string | null }[] = [];
        let skills: { name: string; category?: string }[] = [];
        if (prof?.id) {
          try {
            const [expRes, skillRes] = await Promise.all([
              fetch(`/api/experiences?profileId=${prof.id}`),
              fetch(`/api/skills?profileId=${prof.id}`),
            ]);
            if (expRes.ok) experiences = await expRes.json();
            if (skillRes.ok) skills = await skillRes.json();
          } catch { /* ignore */ }
        }

        // Base/Master CV Data
        const baseRendered = buildCvRenderData({
          profile: prof,
          experiences: experiences.length > 0 ? experiences : undefined,
          skills: skills.length > 0 ? skills : undefined,
          targetJob: draft?.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
        });

        // Tailored/Adapted CV Data
        let adaptedRendered: CvRenderData | null = null;
        if (draft?.tailoredResumeContent) {
          try {
            const parsed = JSON.parse(draft.tailoredResumeContent);
            if (parsed && parsed.identity && parsed.experiences) {
              adaptedRendered = parsed as CvRenderData;
              setHasAdaptedData(true);
            }
          } catch {
            adaptedRendered = buildCvRenderData({
              profile: prof,
              generatedCvContent: draft.tailoredResumeContent,
              experiences: experiences.length > 0 ? experiences : undefined,
              skills: skills.length > 0 ? skills : undefined,
              targetJob: draft?.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
            });
            setHasAdaptedData(true);
          }
        }

        const defaultTpl = tplParam || resolveTemplate(prof?.cvDefaultTemplate) || "ats_classic";
        
        const forceMaster = searchParams.get("mode") === "master";
        
        baseRendered.template = defaultTpl;
        if (adaptedRendered) {
          adaptedRendered.template = defaultTpl;
          adaptedRendered.options = {
            ...baseRendered.options,
            ...(adaptedRendered.options || {}),
          };
          if (prof?.photoUrl && !adaptedRendered.identity.photoUrl) {
            adaptedRendered.identity.photoUrl = prof.photoUrl;
          }
        }

        setTemplate(defaultTpl);
        setBaseData(baseRendered);
        setAdaptedData(adaptedRendered);
        setShowAdapted(!forceMaster);
        setData(forceMaster || !adaptedRendered ? baseRendered : adaptedRendered);
      } catch { /* ignore */ }
      setLoading(false);
    });
  }, [params, searchParams]);

  const fit = searchParams.get("fit") === "1";

  // Fit scaling hook
  useEffect(() => {
    if (typeof window === "undefined" || !fit) return;
    const handleResize = () => {
      const container = document.getElementById("cv-fit-container");
      if (!container) return;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const targetH = 1123; // A4 height in pixels at 96 dpi
      const targetW = 794;  // A4 width in pixels
      const scale = Math.min((vh - 20) / targetH, (vw - 20) / targetW, 1);
      container.style.setProperty("--cv-scale", scale.toString());
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fit]);

  const handleDownloadPdf = useCallback(async () => {
    if (!draftId) return;
    const modeParam = searchParams.get("mode") === "master" ? "&mode=master" : "";
    const url = `/api/application-drafts/${draftId}/documents/cv?template=${template}${modeParam}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || "Le PDF n'a pas pu être généré. Vérifiez la configuration NEXT_PUBLIC_CV_HTML_PDF.");
        return;
      }
      const ctype = response.headers.get("content-type") || "";
      if (!ctype.includes("application/pdf")) {
        alert("Le serveur n'a pas retourné un PDF. Vérifiez le service HTML-to-PDF.");
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const fnMatch = disposition.match(/filename[^;=\n]*=((['"])[^'"]*\2|[^;\n]*)/);
      let filename = fnMatch ? fnMatch[1].replace(/['"]/g, "") : "CV.pdf";
      if (!filename.endsWith(".pdf")) filename += ".pdf";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Erreur réseau lors du téléchargement du PDF.");
    }
  }, [draftId, template, searchParams]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleTemplateChange = useCallback((tpl: CvTemplateId) => {
    setTemplate(tpl);
    setData(prev => prev ? { ...prev, template: tpl } : prev);
    setBaseData(prev => prev ? { ...prev, template: tpl } : prev);
    setAdaptedData(prev => prev ? { ...prev, template: tpl } : prev);
  }, []);

  const handleToggle = useCallback(() => {
    setShowAdapted(prev => {
      const next = !prev;
      if (next && adaptedData) {
        setData({ ...adaptedData, template });
      } else if (!next && baseData) {
        setData({ ...baseData, template });
      }
      return next;
    });
  }, [adaptedData, baseData, template]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 size={30} className="animate-spin" style={{ color: "#C8A64E" }} />
    </div>
  );

  if (!data) return <div className="h-screen flex items-center justify-center bg-white text-sm text-gray-500">Données introuvables</div>;

  if (isPrintMode) {
    return (
      <>
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
        <div 
          id="cv-fit-container"
          className="bg-white" 
          style={fit ? { 
            width: "210mm", 
            height: "297mm", 
            overflow: "hidden",
            transform: "scale(var(--cv-scale, 1))",
            transformOrigin: "top center",
            margin: "0 auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
          } : { 
            width: "210mm", 
            height: "297mm", 
            overflow: "hidden" 
          }} 
          data-cv-render-ready="true"
        >
          <CvTemplateRenderer data={data} />
          <style>{`
            @page { margin: 0; size: A4; }
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              background-color: ${fit ? "#111111" : "#ffffff"} !important; 
              color: #000000 !important;
              width: ${fit ? "100vw" : "210mm"} !important;
              height: ${fit ? "100vh" : "297mm"} !important;
              overflow: hidden !important;
              display: ${fit ? "flex" : "block"} !important;
              justify-content: ${fit ? "center" : "initial"} !important;
              align-items: ${fit ? "center" : "initial"} !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `}</style>
        </div>
      </>
    );
  }

  const templateKeys = Object.keys(TEMPLATE_LABELS) as CvTemplateId[];

  return (
    <>
      {/* Panneau flottant — ne cache jamais le CV car absolute/fixed en dehors du flux */}
      <div className="no-print fixed top-3 right-3 z-50 flex flex-col gap-2 bg-white/95 backdrop-blur p-3 rounded-xl shadow-xl border" style={{ maxWidth: 380, borderColor: "#e5e7eb" }}>
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#888" }}>Modèle CV</p>
          {hasAdaptedData && (
            <button
              onClick={handleToggle}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-colors"
              style={{
                background: showAdapted ? "rgba(34,197,94,0.1)" : "rgba(156,163,175,0.1)",
                color: showAdapted ? "#22c55e" : "#888",
                borderColor: showAdapted ? "#22c55e" : "#ccc",
              }}
            >
              {showAdapted ? "CV Adapté" : "CV Maître"}
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5 max-h-[30vh] overflow-y-auto">
          {templateKeys.map((t) => {
            const active = (template === t);
            const badge = TEMPLATE_BADGES[t];
            const isExperimental = EXPERIMENTAL_TEMPLATES.includes(t);
            return (
              <button key={t} onClick={() => handleTemplateChange(t)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all"
                style={{
                  background: active ? "#C8A64E" : "#fff",
                  color: active ? "#000" : "#444",
                  borderColor: active ? "#C8A64E" : "#ddd",
                }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: badge?.preview || "#C8A64E" }} />
                <span>{TEMPLATE_LABELS[t]}</span>
                {!isExperimental && <span className="text-[9px] px-1 py-0.5 rounded-full ml-0.5" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>Validé</span>}
                {isExperimental && <span className="text-[9px] px-1 py-0.5 rounded-full ml-0.5" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Exp.</span>}
                {badge?.label && (
                  <span className="text-[9px] px-1 py-0.5 rounded-full ml-0.5 border" style={{ borderColor: badge.preview + "40", color: badge.preview }}>{badge.label}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1.5 border-t" style={{ borderColor: "#eee" }}>
          <button onClick={handleDownloadPdf}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "#C8A64E", color: "#000", border: "none" }}>
            <Download size={13} /> Télécharger PDF
          </button>
          <button onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border"
            style={{ background: "#f5f5f5", color: "#555", borderColor: "#ddd" }}>
            <Printer size={13} /> Imprimer
          </button>
        </div>

        {EXPERIMENTAL_TEMPLATES.includes(template) && (
          <div className="text-[10px] flex items-start gap-1" style={{ color: "#f59e0b" }}>
            <AlertTriangle size={10} className="shrink-0 mt-0.5" />
            <span>Vérifiez avant envoi.</span>
          </div>
        )}
      </div>

      {/* CV — pleine page, aperçu WYSIWYG de l'A4 exact */}
      <div className="bg-gray-100 flex justify-center min-h-screen py-10" data-cv-render-ready="true">
        <div style={{ width: "210mm", height: "297mm", background: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          <CvTemplateRenderer data={data} />
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 10mm 14mm; size: A4; }
        }
      `}</style>
    </>
  );
}
