"use client";

import { useState } from "react";
import { ClipboardPaste, Loader2, CheckCircle2, Building2, MapPin, Briefcase, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/EltonToast";

export default function ImportExpressPage() {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<{
    title: string; company: string; location: string;
    contractType: string; salary: string; description: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedId, setImportedId] = useState<string | null>(null);
  const toast = useToast();

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/market-radar/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setPreview({
        title: data.title || text.split("\n")[0]?.slice(0, 80) || "Offre importée",
        company: data.company || "Entreprise inconnue",
        location: data.location || "",
        contractType: data.contractType || "",
        salary: data.salary || "",
        description: text.slice(0, 5000),
      });
    } catch {
      setPreview({
        title: text.split("\n")[0]?.slice(0, 80) || "Offre importée",
        company: "Entreprise inconnue",
        location: "",
        contractType: "",
        salary: "",
        description: text.slice(0, 5000),
      });
    }
    setAnalyzing(false);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const res = await fetch("/api/jobs/importer/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: preview.title,
          company: preview.company,
          location: preview.location,
          contractType: preview.contractType,
          salary: preview.salary,
          description: preview.description,
          sourceName: "Import Express",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportedId(data.jobId);
        toast.success("Offre importée avec succès !");
      } else {
        toast.error("Erreur : " + (data.error || "inconnue"));
      }
    } catch {
      toast.error("Erreur lors de l'import. Vérifiez les données.");
    }
    setImporting(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 className="text-lg font-bold mb-2" style={{ color: "var(--texte)" }}>
        <ClipboardPaste size={20} className="inline mr-2" style={{ color: "var(--or)" }} />
        Import Express
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--texte-secondaire)" }}>
        Collez le texte d&apos;une annonce depuis LinkedIn, Indeed, APEC ou toute autre plateforme.
        PRSTO structure l&apos;annonce automatiquement.
      </p>

      {/* Avertissement sécurité */}
      <div className="p-3 mb-6 rounded-lg border flex items-start gap-2 text-xs"
        style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" }}>
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>PRSTO ne postule jamais automatiquement.</strong> Aucune candidature n&apos;est envoyée sans votre validation explicite.
          Vous restez maître de chaque action.
        </span>
      </div>

      {importedId ? (
        <div className="p-8 rounded-lg border text-center" style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
          <CheckCircle2 size={40} style={{ color: "#22c55e", margin: "0 auto" }} />
          <p className="text-sm font-bold mt-3" style={{ color: "#22c55e" }}>Offre importée avec succès !</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/dashboard/jobs"
              className="px-4 py-2 rounded-md text-xs font-mono border"
              style={{ borderColor: "var(--or)", color: "var(--or)", textDecoration: "none" }}>
              Voir mes offres
            </Link>
            <button onClick={() => { setImportedId(null); setPreview(null); setText(""); }}
              className="px-4 py-2 rounded-md text-xs font-mono border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Importer une autre offre
            </button>
          </div>
        </div>
      ) : preview ? (
        <div>
          {/* Preview */}
          <div className="p-4 rounded-lg border mb-4" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: "var(--texte)" }}>
              Aperçu de l&apos;offre
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: "var(--texte)" }}>{preview.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                {preview.company !== "Entreprise inconnue" && (
                  <span className="flex items-center gap-1"><Building2 size={10} /> {preview.company}</span>
                )}
                {preview.location && (
                  <span className="flex items-center gap-1"><MapPin size={10} /> {preview.location}</span>
                )}
                {preview.contractType && (
                  <span className="flex items-center gap-1"><Briefcase size={10} /> {preview.contractType}</span>
                )}
                {preview.salary && (
                  <span className="flex items-center gap-1">{preview.salary}</span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
              <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                {preview.description.slice(0, 300)}...
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleImport} disabled={importing}
              className="px-4 py-2 rounded-md text-xs font-mono font-bold text-black"
              style={{ background: "var(--or)" }}>
              {importing ? (
                <><Loader2 size={12} className="inline mr-1 animate-spin" /> Import en cours…</>
              ) : (
                "Importer dans mes offres"
              )}
            </button>
            <button onClick={() => { setPreview(null); setText(""); }}
              className="px-4 py-2 rounded-md text-xs font-mono border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez ici le texte complet de l&apos;annonce (Cmd+A puis Cmd+C sur la page de l&apos;offre)..."
            rows={12}
            className="w-full p-4 rounded-lg border text-sm resize-y"
            style={{
              borderColor: "var(--bordure)",
              background: "var(--fond)",
              color: "var(--texte)",
              fontFamily: "monospace",
            }}
          />

          <button onClick={handleAnalyze} disabled={analyzing || !text.trim()}
            className="px-4 py-2 rounded-md text-xs font-mono font-bold text-black"
            style={{
              background: text.trim() ? "var(--or)" : "var(--bordure-douce)",
              opacity: text.trim() ? 1 : 0.5,
              cursor: text.trim() ? "pointer" : "not-allowed",
            }}>
            {analyzing ? (
              <><Loader2 size={12} className="inline mr-1 animate-spin" /> Analyse en cours…</>
            ) : (
              "Analyser l'annonce"
            )}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 rounded-lg border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
        <h3 className="text-xs font-bold mb-2" style={{ color: "var(--texte-tertiaire)" }}>Comment ça marche ?</h3>
        <ol className="text-xs space-y-1" style={{ color: "var(--texte-tertiaire)" }}>
          <li>1. Ouvrez l&apos;annonce sur LinkedIn, Indeed, APEC ou toute autre plateforme</li>
          <li>2. Sélectionnez tout le texte (Cmd+A) et copiez-le (Cmd+C)</li>
          <li>3. Collez-le ici (Cmd+V) et cliquez sur &ldquo;Analyser l&apos;annonce&rdquo;</li>
          <li>4. Vérifiez l&apos;aperçu puis cliquez sur &ldquo;Importer dans mes offres&rdquo;</li>
          <li>5. L&apos;offre apparaîtra dans votre Sourcing avec un score automatique</li>
        </ol>
      </div>
    </div>
  );
}
