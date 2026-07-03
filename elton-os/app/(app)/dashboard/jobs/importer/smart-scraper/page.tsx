"use client";

import { useState } from "react";
import { 
  Play, Loader2, CheckCircle2, AlertTriangle, 
  Building2, MapPin, Download, Database, Settings2, FileCode, ListFilter
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/EltonToast";
import { scrapeCustomUrl, importScrapedOffers } from "@/lib/actions/sourcing";

interface ScrapedOffer {
  title: string;
  company?: string;
  location?: string;
  contractType?: string;
  remote?: string;
  salary?: string;
  description?: string;
}

export default function SmartScraperPage() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"ai" | "selector">("ai");
  const [selector, setSelector] = useState("");
  const [scraping, setScraping] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scrapedData, setScrapedData] = useState<{ offers: ScrapedOffer[] } | null>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const toast = useToast();

  const handleScrape = async () => {
    if (!url.trim()) return;
    setScraping(true);
    setError(null);
    setScrapedData(null);
    setRawText("");
    setSelectedIndices(new Set());

    try {
      const res = await scrapeCustomUrl(url.trim(), mode === "selector" ? selector.trim() : undefined);
      if (!res.success) {
        throw new Error(res.error || "Échec du scraping");
      }
      setScrapedData(res.jsonData);
      if (res.rawText) setRawText(res.rawText);
      
      // Auto-select all offers by default
      if (res.jsonData?.offers) {
        setSelectedIndices(new Set(res.jsonData.offers.map((_: any, i: number) => i)));
      }
      toast.success("Scraping réussi !");
    } catch (e: any) {
      setError(e.message || "Erreur réseau ou configuration");
      toast.error("Erreur de scraping");
    } finally {
      setScraping(false);
    }
  };

  const handleImport = async () => {
    if (!scrapedData?.offers || selectedIndices.size === 0) return;
    setImporting(true);
    try {
      const selected = Array.from(selectedIndices).map(i => scrapedData.offers[i]);
      const res = await importScrapedOffers(selected);
      toast.success(`${res.imported} offre(s) importée(s) avec succès !`);
      setScrapedData(null);
      setUrl("");
    } catch {
      toast.error("Erreur lors de l'importation");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadJson = () => {
    if (!scrapedData) return;
    const blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `elton-os-scraped-jobs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <Database size={20} style={{ color: "var(--or)" }} />
            Scraper Intelligent IA & Sélecteurs
          </h1>
          <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
            Un outil d&apos;extraction de type Apify/Octoparse pour scraper n&apos;importe quelle page carrière ou site d&apos;emploi.
          </p>
        </div>
        <Link href="/sources" className="text-xs font-mono" style={{ color: "var(--or)" }}>
          ← Retour aux sources
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CONFIG PANEL */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--or)" }}>
              <Settings2 size={12} /> Configuration du Scraper
            </h3>

            {/* URL Input */}
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>URL DE LA PAGE *</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 mt-1 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
            </div>

            {/* Mode Select */}
            <div>
              <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>MODE D&apos;EXTRACTION</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setMode("ai")}
                  className="flex-1 py-1.5 rounded text-[11px] font-mono border"
                  style={{ 
                    background: mode === "ai" ? "rgba(200, 166, 78, 0.1)" : "transparent",
                    borderColor: mode === "ai" ? "var(--or)" : "var(--bordure-douce)",
                    color: mode === "ai" ? "var(--or)" : "var(--texte-secondaire)"
                  }}>
                  Extraction IA
                </button>
                <button onClick={() => setMode("selector")}
                  className="flex-1 py-1.5 rounded text-[11px] font-mono border"
                  style={{ 
                    background: mode === "selector" ? "rgba(200, 166, 78, 0.1)" : "transparent",
                    borderColor: mode === "selector" ? "var(--or)" : "var(--bordure-douce)",
                    color: mode === "selector" ? "var(--or)" : "var(--texte-secondaire)"
                  }}>
                  CSS Sélecteur
                </button>
              </div>
            </div>

            {/* CSS Selector Input (Conditional) */}
            {mode === "selector" && (
              <div>
                <label className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>CLASSE OU SÉLECTEUR CSS</label>
                <input type="text" value={selector} onChange={e => setSelector(e.target.value)}
                  placeholder="ex: .job-card, .job-title"
                  className="w-full px-2.5 py-1.5 mt-1 rounded border text-xs" style={{ borderColor: "var(--bordure)", background: "var(--fond)", color: "var(--texte)" }} />
                <p className="text-[9px] mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                  L&apos;extension extraira d&apos;abord le texte présent uniquement dans les éléments correspondants au sélecteur CSS.
                </p>
              </div>
            )}

            <button onClick={handleScrape} disabled={scraping || !url.trim()}
              className="w-full py-2 text-xs font-mono font-bold rounded cursor-pointer text-black flex items-center justify-center gap-2"
              style={{ background: "var(--or)" }}>
              {scraping ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              {scraping ? "Crawl en cours..." : "Lancer le Scraper"}
            </button>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-lg border text-xs space-y-1" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
            <p className="flex items-center gap-1.5" style={{ color: "var(--texte-secondaire)" }}>
              <AlertTriangle size={12} className="text-amber-500" />
              <strong>Conformité :</strong>
            </p>
            <p className="text-[11px]" style={{ color: "var(--texte-tertiaire)" }}>
              Certaines plateformes avec captchas ou pare-feux stricts (ex: LinkedIn, Indeed) bloquent les requêtes serveur directes. Pour ces sites, privilégiez le copier-coller ou notre extension Chrome.
            </p>
          </div>
        </div>

        {/* OUTPUT PANEL */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="p-4 rounded-lg border flex items-start gap-3" style={{ borderColor: "#ef4444", background: "rgba(239,68,68,0.05)" }}>
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-500">Erreur lors de l&apos;exécution du scraper</p>
                <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>{error}</p>
              </div>
            </div>
          )}

          {scrapedData?.offers && (
            <div className="p-4 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--texte-secondaire)" }}>
                  <ListFilter size={12} /> Résultats ({scrapedData.offers.length} offre(s) trouvée(s))
                </h3>
                <div className="flex gap-2">
                  <button onClick={handleDownloadJson}
                    className="px-2.5 py-1 text-[11px] font-mono rounded border flex items-center gap-1"
                    style={{ borderColor: "var(--bordure-douce)", color: "var(--texte-secondaire)" }}>
                    <Download size={10} /> JSON
                  </button>
                  <button onClick={handleImport} disabled={importing || selectedIndices.size === 0}
                    className="px-3 py-1 text-[11px] font-mono font-bold rounded text-black flex items-center gap-1"
                    style={{ background: selectedIndices.size === 0 ? "var(--bordure-douce)" : "var(--or)" }}>
                    {importing ? <Loader2 size={10} className="animate-spin" /> : <Database size={10} />}
                    Importer ({selectedIndices.size})
                  </button>
                </div>
              </div>

              {/* Table / List */}
              <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--bordure-douce)" }}>
                <table className="w-full text-xs text-left" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--fond)" }}>
                      <th className="py-2 px-3 w-10">
                        <input type="checkbox" 
                          checked={selectedIndices.size === scrapedData.offers.length} 
                          onChange={() => {
                            if (selectedIndices.size === scrapedData.offers.length) setSelectedIndices(new Set());
                            else setSelectedIndices(new Set(scrapedData.offers.map((_, i) => i)));
                          }}
                        />
                      </th>
                      <th className="py-2 px-2" style={{ color: "var(--texte-tertiaire)" }}>Poste</th>
                      <th className="py-2 px-2" style={{ color: "var(--texte-tertiaire)" }}>Entreprise</th>
                      <th className="py-2 px-2" style={{ color: "var(--texte-tertiaire)" }}>Lieu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapedData.offers.map((job, idx) => (
                      <tr key={idx} 
                        onClick={() => toggleSelect(idx)}
                        className="cursor-pointer border-t" style={{ 
                          borderColor: "var(--bordure-douce)",
                          background: selectedIndices.has(idx) ? "rgba(34,197,94,0.05)" : "transparent"
                        }}>
                        <td className="py-2 px-3">
                          <input type="checkbox" checked={selectedIndices.has(idx)} onChange={() => {}} />
                        </td>
                        <td className="py-2 px-2 font-medium" style={{ color: "var(--texte)" }}>{job.title}</td>
                        <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>
                          {job.company ? <span className="flex items-center gap-1"><Building2 size={10} /> {job.company}</span> : "—"}
                        </td>
                        <td className="py-2 px-2" style={{ color: "var(--texte-secondaire)" }}>
                          {job.location ? <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* JSON preview */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <FileCode size={10} /> Aperçu JSON de l&apos;export
                </div>
                <pre className="p-3 rounded text-[10px] font-mono max-h-40 overflow-y-auto leading-tight"
                  style={{ background: "var(--fond)", border: "1px solid var(--bordure-douce)", color: "var(--texte-secondaire)" }}>
                  {JSON.stringify(scrapedData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!scrapedData && !scraping && !error && (
            <div className="p-8 rounded-lg border border-dashed text-center flex flex-col items-center justify-center" 
                 style={{ borderColor: "var(--bordure-douce)", minHeight: 250 }}>
              <Database size={32} className="opacity-20 mb-3" style={{ color: "var(--texte-tertiaire)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--texte-secondaire)" }}>Aucun crawl actif</p>
              <p className="text-xs max-w-sm mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                Entrez une URL d&apos;offres d&apos;emploi et lancez le scraper pour extraire et structurer les données.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
