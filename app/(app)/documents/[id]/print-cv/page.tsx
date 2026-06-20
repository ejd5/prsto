"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Printer, LayoutTemplate } from "lucide-react";
import CvTemplateRenderer from "@/components/cv-templates/CvTemplateRenderer";
import type { CvTemplateId, CvRenderData } from "@/components/cv-templates/cv-template-types";
import { resolveTemplate, TEMPLATE_LABELS, ACCENT_COLORS, resolveAccent } from "@/components/cv-templates/cv-template-types";
import { buildCvRenderData } from "@/lib/cv-render/build-data";

export default function PrintCvPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<CvRenderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateOverride, setTemplateOverride] = useState<CvTemplateId | null>(null);

  useEffect(() => {
    const tpl = resolveTemplate(searchParams.get("template"));
    if (tpl) setTemplateOverride(tpl);
    params.then(async ({ id }) => {
      try {
        const [profRes, docRes] = await Promise.all([
          fetch("/api/profile"),
          fetch(`/api/application-drafts/${id}`),
        ]);
        const prof = (await profRes.json()).profile;
        const doc = (await docRes.json()).draft;

        const rendered = buildCvRenderData({
          profile: prof,
          generatedCvContent: doc?.tailoredResumeContent,
          experiences: [],
          skills: [],
          targetJob: doc?.job ? { title: doc.job.title, company: doc.job.company || undefined } : undefined,
        });

        if (templateOverride) rendered.template = templateOverride;
        setData(rendered);
      } catch { /* ignore */ }
      setLoading(false);
    });
  }, [searchParams, params, templateOverride]);

  // Auto-print
  useEffect(() => {
    if (!loading && data) {
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [loading, data]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 size={30} className="animate-spin" style={{ color: "#C8A64E" }} />
    </div>
  );

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-white text-sm text-gray-500">Données introuvables</div>;

  return (
    <>
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        {(Object.keys(TEMPLATE_LABELS) as CvTemplateId[]).map((t) => (
          <button key={t} onClick={() => setTemplateOverride(t)}
            className="px-3 py-1.5 rounded text-xs font-mono border"
            style={{
              background: data.template === t ? "#C8A64E" : "#fff",
              color: data.template === t ? "#000" : "#666",
              borderColor: "#C8A64E",
            }}>
            {TEMPLATE_LABELS[t]}
          </button>
        ))}
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-mono"
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
          body { margin: 0; padding: 0; background: #fff !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </>
  );
}
