"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer, ToggleLeft, ToggleRight } from "lucide-react";
import CvTemplateRenderer from "@/components/cv-templates/CvTemplateRenderer";
import type { CvTemplateId, CvRenderData } from "@/components/cv-templates/cv-template-types";
import { resolveTemplate, TEMPLATE_LABELS } from "@/components/cv-templates/cv-template-types";
import { buildCvRenderData } from "@/lib/cv-render/build-data";

export default function PrintCvPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CvRenderData | null>(null);
  const [baseData, setBaseData] = useState<CvRenderData | null>(null); // CV maître
  const [loading, setLoading] = useState(true);
  const [templateOverride, setTemplateOverride] = useState<CvTemplateId | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [showAdapted, setShowAdapted] = useState(true);
  const [hasAdaptedData, setHasAdaptedData] = useState(false);

  useEffect(() => {
    const tpl = resolveTemplate(searchParams.get("template"));
    if (tpl) setTemplateOverride(tpl);

    params.then(async ({ id }) => {
      try {
        const [profRes, draftRes] = await Promise.all([
          fetch("/api/profile"),
          fetch(`/api/application-drafts/${id}`),
        ]);
        const prof = (await profRes.json()).profile;
        const draft = (await draftRes.json()).draft;

        if (draft?.job) {
          setJobTitle(draft.job.title || "");
          setJobCompany(draft.job.company || "");
        }

        const profileId = prof?.id;

        // Charger expériences et compétences du profil
        let experiences: { company: string; title: string; startDate?: string; endDate?: string | null; location?: string; description?: string | null; achievements?: string | null }[] = [];
        let skills: { name: string; category?: string }[] = [];

        if (profileId) {
          try {
            const [expRes, skillRes] = await Promise.all([
              fetch(`/api/experiences?profileId=${profileId}`).catch(() => null),
              fetch(`/api/skills?profileId=${profileId}`).catch(() => null),
            ]);
            if (expRes?.ok) experiences = await expRes.json();
            if (skillRes?.ok) skills = await skillRes.json();
          } catch { /* ignore */ }
        }

        // CV Maître (données brutes du profil)
        const baseRendered = buildCvRenderData({
          profile: prof,
          experiences: experiences.length > 0 ? experiences : undefined,
          skills: skills.length > 0 ? skills : undefined,
          targetJob: draft?.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
        });

        // CV Adapté — tenter de charger les données tailored depuis le draft
        let adaptedRendered: CvRenderData | null = null;

        if (draft?.tailoredResumeContent) {
          // Essayer de parser le contenu comme du JSON CvRenderData
          try {
            const parsed = JSON.parse(draft.tailoredResumeContent);
            if (parsed && parsed.identity && parsed.experiences) {
              // C'est un CvRenderData sérialisé — utiliser directement
              adaptedRendered = parsed as CvRenderData;
              setHasAdaptedData(true);
            }
          } catch {
            // Ce n'est pas du JSON — c'est du texte brut legacy
            // On utilise buildCvRenderData avec le texte comme fallback
            adaptedRendered = buildCvRenderData({
              profile: prof,
              generatedCvContent: draft.tailoredResumeContent,
              experiences: experiences.length > 0 ? experiences : undefined,
              skills: skills.length > 0 ? skills : undefined,
              targetJob: draft?.job ? { title: draft.job.title, company: draft.job.company || undefined } : undefined,
            });
            // C'est toujours mieux que rien
            setHasAdaptedData(true);
          }
        }

        // Appliquer le template
        const tplToUse = templateOverride || resolveTemplate(prof?.cvDefaultTemplate) || "ats_classic";

        baseRendered.template = tplToUse;
        if (adaptedRendered) {
          adaptedRendered.template = tplToUse;
          // Assurer que les options visuelles sont cohérentes
          adaptedRendered.options = {
            ...baseRendered.options,
            ...(adaptedRendered.options || {}),
          };
        }

        setBaseData(baseRendered);
        setData(adaptedRendered || baseRendered);
      } catch { /* ignore */ }
      setLoading(false);
    });
  }, [searchParams, params, templateOverride]);

  // Quand on change le template, l'appliquer aux deux versions
  const handleTemplateChange = useCallback((tpl: CvTemplateId) => {
    setTemplateOverride(tpl);
    setData(prev => prev ? { ...prev, template: tpl } : prev);
    setBaseData(prev => prev ? { ...prev, template: tpl } : prev);
  }, []);

  // Toggle adapté / maître
  const handleToggle = useCallback(() => {
    setShowAdapted(prev => {
      const next = !prev;
      if (next && data) {
        // déjà en mode adapté, rien à changer
      } else if (!next && baseData) {
        setData({ ...baseData, template: templateOverride || baseData.template });
      } else if (next && hasAdaptedData) {
        // Recharger est nécessaire mais on garde en state
      }
      return next;
    });
  }, [data, baseData, templateOverride, hasAdaptedData]);

  // Auto-print
  useEffect(() => {
    if (!loading && data) {
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [loading, data]);

  // Nom de fichier pour téléchargement
  const candidateName = data?.identity.fullName?.replace(/\s+/g, "_") || "Candidat";
  const companySlug = jobCompany.replace(/\s+/g, "_").slice(0, 30) || "Entreprise";
  const fileName = `CV_${candidateName}_${companySlug}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 size={30} className="animate-spin" style={{ color: "#C8A64E" }} />
    </div>
  );

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">Données introuvables</div>;

  return (
    <>
      <div className="no-print fixed top-3 right-3 z-50 flex gap-2 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
        {/* Toggle adapté / maître */}
        {hasAdaptedData && (
          <>
            <button
              onClick={handleToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-colors"
              style={{
                background: showAdapted ? "rgba(74,222,128,0.1)" : "rgba(156,163,175,0.1)",
                color: showAdapted ? "#22c55e" : "#888",
                borderColor: showAdapted ? "#22c55e" : "#ccc",
              }}
            >
              {showAdapted ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {showAdapted ? "CV Adapté" : "CV Maître"}
            </button>
            <span className="w-px h-6 self-center" style={{ background: "#ddd" }} />
          </>
        )}

        <span className="text-[10px] font-mono px-2 self-center" style={{ color: "#888" }}>Template :</span>
        {(Object.keys(TEMPLATE_LABELS) as CvTemplateId[]).map((t) => (
          <button key={t} onClick={() => handleTemplateChange(t)}
            className="px-3 py-1.5 rounded text-xs font-mono border transition-colors"
            style={{
              background: (templateOverride || data.template) === t ? "#C8A64E" : "#fff",
              color: (templateOverride || data.template) === t ? "#000" : "#666",
              borderColor: "#C8A64E",
            }}>
            {TEMPLATE_LABELS[t]}
          </button>
        ))}
        <span className="w-px h-6 self-center" style={{ background: "#ddd" }} />
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono"
          style={{ background: "#C8A64E", color: "#000", border: "none" }}>
          <Printer size={12} /> Imprimer / PDF
        </button>
      </div>

      <div className="bg-white">
        <CvTemplateRenderer data={data} />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background-color: #ffffff !important; 
            color: #000000 !important;
            height: 297mm !important;
            width: 210mm !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
