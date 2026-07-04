"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Building2, MapPin, Briefcase, AlertTriangle, ExternalLink, ClipboardPaste, Edit3, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

interface CapturedOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  description: string;
  sourceName: string;
  createdAt: string;
}

function CaptureContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [offer, setOffer] = useState<CapturedOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    if (jobId) {
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((d) => {
          const job = d.job || d;
          setOffer(job);
          setEditTitle(job.title || "");
          setEditCompany(job.company || "");
          setEditLocation(job.location || "");
        })
        .catch(() => setOffer(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [jobId]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>;
  }

  if (!jobId || !offer) {
    return (
      <div className="p-8 text-center rounded-lg border border-dashed" style={{ borderColor: "var(--bordure-douce)" }}>
        <AlertTriangle size={28} style={{ color: "var(--texte-tertiaire)", margin: "0 auto" }} />
        <p className="text-sm mt-3" style={{ color: "var(--texte-secondaire)" }}>Aucune offre importer valider.</p>
        <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>Importez depuis l&apos;extension Chrome ou utilisez Import Express.</p>
        <Link href="/dashboard/jobs/importer" className="inline-block mt-4 px-4 py-2 rounded-md text-xs font-mono border"
          style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
          Aller  Import Express
        </Link>
      </div>
    );
  }

  const handleSaveEdits = async () => {
    if (!offer) return;
    await fetch(`/api/jobs/${offer.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        company: editCompany,
        location: editLocation,
      }),
    });
    setOffer({ ...offer, title: editTitle, company: editCompany, location: editLocation });
    setEditing(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 className="text-lg font-bold mb-2" style={{ color: "var(--texte)" }}>
        <ClipboardPaste size={20} className="inline mr-2" style={{ color: "#22c55e" }} />
        Offre capture
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--texte-secondaire)" }}>
        Vrifiez les informations dtectes avant de crer l&apos;offre.
      </p>

      {/* Avertissement scurit */}
      <div className="p-3 mb-6 rounded-lg border flex items-start gap-2 text-xs"
        style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span><strong>Aucune candidature n&apos;a t envoye.</strong> Vous devez prparer manuellement la candidature.</span>
      </div>

      {/* Infos principalles */}
      <div className="p-4 rounded-lg border mb-4" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono" style={{ color: "var(--or)" }}>DTECT PAR L&apos;EXTENSION</span>
          <button onClick={() => setEditing(!editing)} className="text-xs font-mono flex items-center gap-1"
            style={{ color: "var(--texte-tertiaire)" }}>
            <Edit3 size={12} /> {editing ? "Annuler" : "Corriger"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Titre</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-2 rounded border text-sm" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Entreprise</label>
              <input type="text" value={editCompany} onChange={(e) => setEditCompany(e.target.value)}
                className="w-full p-2 rounded border text-sm" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>Lieu</label>
              <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                className="w-full p-2 rounded border text-sm" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>
            <button onClick={handleSaveEdits} className="px-3 py-1.5 rounded text-xs font-mono text-black" style={{ background: "var(--or)" }}>
              Enregistrer
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg font-bold" style={{ color: "var(--texte)" }}>{offer.title}</span>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--texte-secondaire)" }}>
              <span className="flex items-center gap-1"><Building2 size={10} /> {offer.company}</span>
              {offer.location && <span className="flex items-center gap-1"><MapPin size={10} /> {offer.location}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="p-4 rounded-lg border mb-4" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <h3 className="text-xs font-mono mb-2" style={{ color: "var(--texte-tertiaire)" }}>DESCRIPTION</h3>
        <p className="text-xs whitespace-pre-wrap" style={{ color: "var(--texte-secondaire)", maxHeight: 300, overflowY: "auto" }}>
          {offer.description?.slice(0, 3000) || "Aucune description"}
        </p>
      </div>

      {/* URL source */}
      <div className="p-3 rounded-lg border mb-4" style={{ borderColor: "var(--bordure-douce)" }}>
        <div className="flex items-center gap-2 text-xs">
          <ExternalLink size={10} style={{ color: "var(--texte-tertiaire)" }} />
          <a href={offer.sourceUrl} target="_blank" rel="noopener" className="font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {offer.sourceUrl?.slice(0, 80)}...
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/dashboard/jobs"
          className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-bold text-black"
          style={{ background: "#22c55e", textDecoration: "none" }}>
          <CheckCircle2 size={14} /> Offre cre — Voir dans Sourcing
        </Link>
        <Link href="/dashboard/jobs/importer"
          className="px-4 py-2 rounded-md text-xs font-mono border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", textDecoration: "none" }}>
          Importer une autre offre
        </Link>
      </div>
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} /></div>}>
      <CaptureContent />
    </Suspense>
  );
}
