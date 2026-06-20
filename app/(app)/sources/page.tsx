"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Plus, ExternalLink, Power, PowerOff, Edit3, Trash2,
  Save, Globe, Filter, Radar, Copy, Link, Loader2,
  Star, Building2,
} from "lucide-react";
import {
  getJobSources, addJobSource, toggleJobSource, deleteJobSource,
  type JobSourceData,
} from "@/lib/actions/job-source";
import { getPriorityRoles, getTargetCountries } from "@/lib/actions/profile";
import { generateMarketRadar, getMarketRadars } from "@/lib/actions/market-radar";
import { runFullSourcing, importFromPastedText, scanSingleUrl } from "@/lib/actions/sourcing";

const TYPE_LABELS: Record<string, string> = {
  generalist: "Généraliste",
  executive: "Cabinet",
  startup: "Startup / Remote",
  job_board: "Job Board",
  custom: "Custom",
};

const REGION_LABELS: Record<string, string> = {
  FR: "France", EU: "Europe", US: "USA", INTL: "International",
};

const ROLES_QUERIES = [
  { label: "Directeur Commercial", fr: "Directeur Commercial", en: "Sales Director" },
  { label: "Country Manager", fr: "Country Manager", en: "Country Manager" },
  { label: "Directeur National des Ventes", fr: "Directeur National des Ventes", en: "National Sales Director" },
  { label: "Directeur Général", fr: "Directeur Général", en: "General Manager" },
  { label: "Head of Sales Europe", fr: "Head of Sales Europe", en: "Head of Sales Europe" },
  { label: "Country Manager FR/EN/ES/PT", fr: "Country Manager francophone", en: "Country Manager French speaking" },
  { label: "General Manager Europe", fr: "General Manager Europe", en: "General Manager Europe" },
];

interface SourceItem {
  id: string; name: string; url: string; region: string; type: string;
  priority: number; active: boolean; notes: string | null;
  _count?: { opportunities: number; marketRadars: number };
}
interface CountryItem { code: string; name: string; }
interface RadarItem { id: string; role: string; country: string; searchUrl: string; jobSource?: { name: string } | null; }

const EMPTY_SOURCE: JobSourceData = {
  name: "", url: "", region: "EU", type: "custom", priority: 0, active: true, notes: "",
};

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [radars, setRadars] = useState<RadarItem[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<"sources" | "import" | "radar" | "radar-generator">("sources");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState(-1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<JobSourceData>(EMPTY_SOURCE);

  // Radar generator state
  const [selRole, setSelRole] = useState("");
  const [selCountry, setSelCountry] = useState("");
  const [selLang, setSelLang] = useState("fr");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = useCallback(async () => {
    const [srcs, r, c, radEntries] = await Promise.all([
      getJobSources(),
      getPriorityRoles(),
      getTargetCountries(),
      getMarketRadars(),
    ]);
    setSources(srcs as unknown as SourceItem[]);
    setCountries(c as unknown as CountryItem[]);
    setRadars(radEntries as unknown as RadarItem[]);
    if (r.length && !selRole) setSelRole(r[0].name);
    if (c.length && !selCountry) setSelCountry(c[0].code);
  }, [selCountry, selRole]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    try {
      await addJobSource(form);
      setShowForm(false);
      setForm(EMPTY_SOURCE);
      await load();
      notify("ok", "Source ajoutée");
    } catch { notify("err", "Erreur"); }
  };

  const toggle = async (id: string, active: boolean) => {
    await toggleJobSource(id, !active);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette source ?")) return;
    await deleteJobSource(id);
    await load();
  };

  const openEdit = (src: SourceItem) => {
    setForm({ name: src.name, url: src.url, region: src.region, type: src.type, priority: src.priority, active: src.active, notes: src.notes || "" });
    setShowForm(true);
  };

  // ─── Sourcing IA ───
  const [scanning, setScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [scanUrlLabel, setScanUrlLabel] = useState("");
  const [scanningUrl, setScanningUrl] = useState(false);
  const [scanUrlResult, setScanUrlResult] = useState<{ found: number; imported: number; duplicates: number; offers: { title: string; company: string }[]; error?: string } | null>(null);
  const [scanResults, setScanResults] = useState<{
    totalFound: number; totalNew: number; totalDuplicates: number; bySource: { name: string; found: number; imported: number }[]; summary: string;
  } | null>(null);

  const [pasteText, setPasteText] = useState("");
  const [pasteSource, setPasteSource] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasteResult, setPasteResult] = useState<{ found: number; imported: number; duplicates: number; offers: { title: string; company: string }[]; error?: string } | null>(null);

  const handleScanSingleUrl = async () => {
    if (!scanUrl.trim()) return;
    setScanningUrl(true);
    setScanUrlResult(null);
    try {
      const result = await scanSingleUrl(scanUrl);
      setScanUrlResult(result);
      if (result.imported > 0) await load();
    } catch (e: unknown) {
      const err = e as Error;
      setScanUrlResult({ found: 0, imported: 0, duplicates: 0, offers: [], error: err.message });
    }
    setScanningUrl(false);
  };

  const handleScanAll = async () => {
    setScanning(true);
    setScanResults(null);
    try {
      const result = await runFullSourcing();
      setScanResults(result);
      if (result.totalNew > 0) await load();
    } catch (e: unknown) {
      const err = e as Error;
      setScanResults({ totalFound: 0, totalNew: 0, totalDuplicates: 0, bySource: [], summary: err.message });
    }
    setScanning(false);
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim() || !pasteSource.trim()) return;
    setPasting(true);
    setPasteResult(null);
    try {
      const result = await importFromPastedText(pasteSource, pasteText);
      setPasteResult(result);
      if (result.imported > 0) await load();
    } catch (e: unknown) {
      const err = e as Error;
      setPasteResult({ found: 0, imported: 0, duplicates: 0, offers: [], error: err.message });
    }
    setPasting(false);
  };

  // ─── Market Radar Generator ───
  const buildSearchUrl = (sourceUrl: string, role: string, lang: string): string => {
    const terms = lang === "en" ? role : role;
    const countryName = countries.find((c: CountryItem) => c.code === selCountry)?.name || selCountry;

    if (sourceUrl.includes("linkedin.com")) {
      return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(terms)}&location=${encodeURIComponent(countryName)}`;
    }
    if (sourceUrl.includes("indeed.com") || sourceUrl.includes("indeed.fr")) {
      return `${sourceUrl}q-${encodeURIComponent(terms.replace(/\s+/g, "-"))}-l-${encodeURIComponent(countryName)}`;
    }
    if (sourceUrl.includes("apec.fr")) {
      return `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(terms)}`;
    }
    if (sourceUrl.includes("cadremploi.fr")) {
      return `https://www.cadremploi.fr/emploi/recherche?mots_cles=${encodeURIComponent(terms)}`;
    }
    if (sourceUrl.includes("michaelpage")) {
      return `${sourceUrl}?search=${encodeURIComponent(terms)}`;
    }
    if (sourceUrl.includes("hays.fr")) {
      return `https://www.hays.fr/search/jobs?q=${encodeURIComponent(terms)}`;
    }
    if (sourceUrl.includes("welcometothejungle")) {
      return `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(terms)}`;
    }
    return `${sourceUrl}search?q=${encodeURIComponent(terms)}&l=${encodeURIComponent(countryName)}`;
  };

  const generateSearch = async (sourceId: string, sourceUrl: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;
    setGeneratingFor(sourceId);
    const role = selRole;
    const url = buildSearchUrl(sourceUrl, role, selLang);
    await generateMarketRadar(sourceId, role, selCountry, url);
    await load();
    setGeneratingFor(null);
    notify("ok", `Lien généré pour ${source.name}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify("ok", "Lien copié !");
  };

  const filteredSources = sources.filter(s => {
    if (filterType && s.type !== filterType) return false;
    if (filterPriority >= 0 && s.priority !== filterPriority) return false;
    return true;
  });

  const typeCounts = sources.reduce((acc: Record<string, number>, s: SourceItem) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Sources d&apos;emploi</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {sources.filter((s: SourceItem) => s.active).length}/{sources.length} actives
          </p>
        </div>
        <button onClick={() => { setForm(EMPTY_SOURCE); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
          style={{ background: "var(--or)", color: "var(--fond)", borderColor: "var(--or)" }}>
          <Plus size={14} /> Ajouter une source
        </button>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--bordure)" }}>
        {([
          ["sources", Search, "Sources"],
          ["radar", Radar, "Market Radar"],
          ["import", Radar, "Import IA"],
          ["radar-generator", Globe, "Générateur de recherche"],
        ] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors"
            style={{ color: tab === key ? "var(--or)" : "var(--texte-tertiaire)", borderBottom: tab === key ? "2px solid var(--or)" : "2px solid transparent", marginBottom: -1 }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ─── TAB SOURCES ─── */}
      {tab === "sources" && (
        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={12} style={{ color: "var(--texte-tertiaire)" }} />
            <button onClick={() => { setFilterType(""); setFilterPriority(-1); }}
              className="px-2.5 py-1 rounded-full text-xs font-mono border"
              style={{ background: !filterType && filterPriority < 0 ? "var(--or-faible)" : "var(--fond)", borderColor: !filterType && filterPriority < 0 ? "var(--or)" : "var(--bordure)", color: !filterType && filterPriority < 0 ? "var(--or)" : "var(--texte-secondaire)" }}>
              Tous
            </button>
            {["generalist", "executive", "startup", "custom"].map(t => {
              const count = typeCounts[t] || 0;
              if (!count) return null;
              return (
                <button key={t} onClick={() => setFilterType(t === filterType ? "" : t)}
                  className="px-2.5 py-1 rounded-full text-xs font-mono border"
                  style={{ background: filterType === t ? "var(--or-faible)" : "var(--fond)", borderColor: filterType === t ? "var(--or)" : "var(--bordure)", color: filterType === t ? "var(--or)" : "var(--texte-secondaire)" }}>
                  {TYPE_LABELS[t] || t} ({count})
                </button>
              );
            })}
            <span className="mx-1" style={{ color: "var(--texte-tertiaire)" }}>|</span>
            <button onClick={() => setFilterPriority(1 === filterPriority ? -1 : 1)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border"
              style={{ background: filterPriority === 1 ? "var(--or-faible)" : "var(--fond)", borderColor: filterPriority === 1 ? "var(--or)" : "var(--bordure)", color: filterPriority === 1 ? "var(--or)" : "var(--texte-secondaire)" }}>
              <Star size={10} /> Prioritaires
            </button>
          </div>

          {/* Formulaire add/edit */}
          {showForm && (
            <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field label="Nom" value={form.name} onChange={v => setForm({ ...form, name: v })} />
                <Field label="URL" value={form.url} onChange={v => setForm({ ...form, url: v })} />
                <div>
                  <label className="label-xs">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-elton">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-xs">Région</label>
                  <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} className="input-elton">
                    {Object.entries(REGION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Notes" value={form.notes || ""} onChange={v => setForm({ ...form, notes: v })} textarea />
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.priority === 1} onChange={e => setForm({ ...form, priority: e.target.checked ? 1 : 0 })} />
                    <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Prioritaire</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                    <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Actif</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={save}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono rounded-md"
                  style={{ background: "var(--or)", color: "var(--fond)" }}>
                  <Save size={12} /> Ajouter
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-mono rounded-md border"
                  style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste */}
          <div className="space-y-1.5">
            {filteredSources.map(src => (
              <div key={src.id}
                className="flex items-center justify-between p-3 rounded-md border group"
                style={{ background: "var(--fond-surface)", borderColor: src.active ? "var(--bordure)" : "var(--bordure-douce)", opacity: src.active ? 1 : 0.5 }}>
                <div className="flex items-center gap-4 min-w-0">
                  <button onClick={() => toggle(src.id, src.active)}
                    className="p-1 rounded flex-shrink-0"
                    title={src.active ? "Désactiver" : "Activer"}
                    style={{ color: src.active ? "var(--succes)" : "var(--texte-tertiaire)" }}>
                    {src.active ? <Power size={14} /> : <PowerOff size={14} />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--texte)" }}>
                        {src.name}
                      </span>
                      {src.priority === 1 && <Star size={11} style={{ color: "var(--or)" }} />}
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                        {TYPE_LABELS[src.type] || src.type}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                        {REGION_LABELS[src.region] || src.region}
                      </span>
                    </div>
                    <div className="text-xs font-mono truncate mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                      {src.url}
                      {src._count?.opportunities ? ` · ${src._count?.opportunities} opp.` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <a href={src.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded" style={{ color: "var(--info)" }} title="Ouvrir">
                    <ExternalLink size={13} />
                  </a>
                  <button onClick={() => openEdit(src)}
                    className="p-1.5 rounded" style={{ color: "var(--texte-secondaire)" }} title="Modifier">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => remove(src.id)}
                    className="p-1.5 rounded" style={{ color: "var(--erreur)" }} title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {filteredSources.length === 0 && (
              <div className="p-10 text-center" style={{ color: "var(--texte-tertiaire)" }}>
                <Search size={20} className="mx-auto mb-2 opacity-30" />
                <span className="text-xs font-mono">Aucune source trouvée</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB MARKET RADAR ─── */}
      {tab === "radar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
              {radars.length} liens de recherche
            </span>
            <button onClick={() => setTab("radar-generator")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border"
              style={{ borderColor: "var(--or)", color: "var(--or)" }}>
              <Globe size={12} /> Générer des liens
            </button>
          </div>
          <div className="space-y-1.5">
            {radars.map((r: RadarItem) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-md border group"
                style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
                <div className="min-w-0 flex items-center gap-3">
                  <Radar size={14} style={{ color: "var(--or)", flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm" style={{ color: "var(--texte)" }}>{r.role}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--fond)", color: "var(--texte-tertiaire)" }}>
                        {r.country}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                        via {r.jobSource?.name}
                      </span>
                    </div>
                    <div className="text-xs font-mono truncate mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{r.searchUrl}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => copyToClipboard(r.searchUrl)}
                    className="p-1.5 rounded" style={{ color: "var(--or)" }} title="Copier le lien">
                    <Copy size={13} />
                  </button>
                  <a href={r.searchUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded" style={{ color: "var(--info)" }} title="Ouvrir">
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
            {radars.length === 0 && (
              <div className="p-10 text-center" style={{ color: "var(--texte-tertiaire)" }}>
                <Radar size={20} className="mx-auto mb-2 opacity-30" />
                <span className="text-xs font-mono">Aucun lien Market Radar. Générez-en depuis l&apos;onglet Générateur.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB IMPORT IA ─── */}
      {tab === "import" && (
        <div className="space-y-6">
          {/* Scan automatique */}
          <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
            <h3 className="text-sm font-mono uppercase flex items-center gap-2" style={{ color: "var(--or)" }}>
              <Radar size={14} /> Scan automatique des sources
            </h3>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              Lance le scan de toutes vos sources actives. DeepSeek analyse chaque URL et extrait les offres d&apos;emploi.
              Les doublons avec vos offres existantes sont automatiquement ignorés.
            </p>

            {sources.filter(s => s.active).length === 0 && (
              <div className="p-2 rounded text-xs" style={{ background: "rgba(245,158,11,0.08)", color: "var(--avertissement)" }}>
                Aucune source active. Ajoutez et activez des sources dans l&apos;onglet Sources d&apos;abord.
              </div>
            )}

            {sources.filter(s => s.active).length > 0 && (
              <button
                onClick={handleScanAll}
                disabled={scanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors"
                style={{ background: "var(--or)", color: "#000" }}
              >
                {scanning ? <Loader2 size={12} className="animate-spin" /> : <Radar size={12} />}
                {scanning ? "Scan en cours..." : "Scanner toutes les sources actives"}
              </button>
            )}

            {/* Résultats du scan */}
            {scanResults && (
              <div className="space-y-3 p-3 rounded border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span style={{ color: "var(--succes)" }}>{scanResults.totalNew} importée(s)</span>
                  <span style={{ color: "var(--texte-tertiaire)" }}>{scanResults.totalFound} trouvée(s)</span>
                  {scanResults.totalDuplicates > 0 && <span style={{ color: "var(--avertissement)" }}>{scanResults.totalDuplicates} doublon(s)</span>}
                </div>
                <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{scanResults.summary}</p>
                {scanResults.bySource.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs" style={{ color: "var(--texte-secondaire)" }}>
                    <span>{r.name}</span>
                    <span>{r.imported}/{r.found} importée(s)</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scanner une URL libre */}
          <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-sm font-mono uppercase flex items-center gap-2" style={{ color: "var(--texte-secondaire)" }}>
              <Link size={14} /> Scanner une URL libre
            </h3>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              Collez l&apos;URL d&apos;une page d&apos;offres pour la scanner avec DeepSeek.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Nom (optionnel)</label>
                <input type="text" value={scanUrlLabel} onChange={e => setScanUrlLabel(e.target.value)}
                  className="input-elton w-full mt-1" placeholder="ex: LinkedIn recherche" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>URL</label>
                <input type="url" value={scanUrl} onChange={e => setScanUrl(e.target.value)}
                  className="input-elton w-full mt-1" placeholder="https://..." />
              </div>
            </div>
            <button
              onClick={handleScanSingleUrl}
              disabled={scanningUrl || !scanUrl.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium"
              style={{ background: scanUrl.trim() ? "var(--or)" : "var(--fond-eleve)", color: scanUrl.trim() ? "#000" : "var(--texte-tertiaire)" }}
            >
              {scanningUrl ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
              {scanningUrl ? "Scan en cours..." : "Scanner cette URL"}
            </button>
            {scanUrlResult && (
              <div className="p-3 rounded border text-xs space-y-1" style={{ borderColor: scanUrlResult.error ? "var(--erreur)" : "var(--succes)" }}>
                {scanUrlResult.error ? (
                  <p style={{ color: "var(--erreur)" }}>⚠ {scanUrlResult.error}</p>
                ) : (
                  <>
                    <p style={{ color: "var(--succes)" }}>{scanUrlResult.imported} importée(s) · {scanUrlResult.duplicates} doublon(s) · {scanUrlResult.found} trouvée(s)</p>
                    {scanUrlResult.offers.map((o, i) => (
                      <p key={i} style={{ color: "var(--texte-secondaire)" }}>✓ {o.title} — {o.company}</p>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Copier-coller */}
          <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-sm font-mono uppercase flex items-center gap-2" style={{ color: "var(--texte-secondaire)" }}>
              <Copy size={14} /> Import par copier-coller
            </h3>
            <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              Pour les sites qui bloquent l&apos;accès automatique (LinkedIn, Indeed...), copiez le texte des résultats de recherche
              et collez-le ci-dessous. DeepSeek extrait les offres automatiquement.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Nom de la source</label>
                <input type="text" value={pasteSource} onChange={e => setPasteSource(e.target.value)}
                  className="input-elton w-full mt-1" placeholder="ex: LinkedIn, APEC, Welcome to the Jungle..."
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Texte des offres copiées</label>
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                  rows={8} className="input-elton w-full mt-1 font-mono text-xs"
                  placeholder="Collez ici le contenu des offres d'emploi copiées depuis votre navigateur..."
                />
              </div>
            </div>
            <button
              onClick={handlePasteImport}
              disabled={pasting || !pasteText.trim() || !pasteSource.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors"
              style={{ background: pasteText.trim() ? "var(--or)" : "var(--fond-eleve)", color: pasteText.trim() ? "#000" : "var(--texte-tertiaire)" }}
            >
              {pasting ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
              {pasting ? "Analyse DeepSeek en cours..." : "Importer avec DeepSeek"}
            </button>

            {/* Résultat copier-coller */}
            {pasteResult && (
              <div className="space-y-2 p-3 rounded border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
                {pasteResult.error ? (
                  <p className="text-xs" style={{ color: "var(--erreur)" }}>⚠ {pasteResult.error}</p>
                ) : (
                  <>
                    <div className="text-xs font-mono" style={{ color: pasteResult.imported > 0 ? "var(--succes)" : "var(--texte-tertiaire)" }}>
                      {pasteResult.imported} offre(s) importée(s) · {pasteResult.duplicates} doublon(s) ignoré(s) · {pasteResult.found} trouvée(s)
                    </div>
                    {pasteResult.offers.map((o, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                        <span style={{ color: "var(--succes)" }}>✓</span>
                        <span className="font-medium" style={{ color: "var(--texte)" }}>{o.title}</span>
                        <span>— {o.company}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB RADAR GENERATOR ─── */}
      {tab === "radar-generator" && (
        <div className="space-y-6">
          <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label-xs">Rôle cible</label>
                <select value={selRole} onChange={e => setSelRole(e.target.value)} className="input-elton">
                  {ROLES_QUERIES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label-xs">Pays</label>
                <select value={selCountry} onChange={e => setSelCountry(e.target.value)} className="input-elton">
                  {countries.map((c: CountryItem) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-xs">Langue de recherche</label>
                <select value={selLang} onChange={e => setSelLang(e.target.value)} className="input-elton">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--texte-secondaire)" }}>
                Sources actives — cliquez pour générer
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sources.filter(s => s.active).slice(0, 30).map((src: SourceItem) => (
                  <button key={src.id} onClick={() => generateSearch(src.id, src.url)}
                    disabled={generatingFor === src.id}
                    className="flex items-center justify-between p-2.5 rounded-md border text-left text-sm transition-colors"
                    style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={13} style={{ color: "var(--texte-tertiaire)", flexShrink: 0 }} />
                      <span className="truncate text-xs">{src.name}</span>
                    </div>
                    {generatingFor === src.id ? (
                      <Loader2 size={13} className="animate-spin" style={{ color: "var(--or)" }} />
                    ) : (
                      <Link size={13} style={{ color: "var(--texte-tertiaire)" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Requêtes suggérées */}
          <div className="p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: "var(--or)" }}>
              Requêtes prêtes à copier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "Directeur Commercial France",
                "Sales Director France",
                "Country Manager France",
                "Directeur National des Ventes",
                "General Manager France",
                "Head of Sales Europe",
                "Country Manager French speaking",
                "Sales Director French English Spanish Portuguese",
                "Directeur Commercial Suisse",
                "Country Manager Belgium",
                "Sales Director Luxembourg",
                "French speaking General Manager Europe",
                "Chief Revenue Officer Europe",
                "Directeur Commercial International",
              ].map(q => (
                <div key={q}
                  className="flex items-center justify-between p-2.5 rounded-md border cursor-pointer"
                  style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}
                  onClick={() => copyToClipboard(q)}>
                  <span className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>{q}</span>
                  <Copy size={12} style={{ color: "var(--texte-tertiaire)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Composants réutilisables ─── */
function Field({ label, value, onChange, textarea }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <div>
      <label className="label-xs">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
          className="input-elton" style={{ resize: "vertical" }} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="input-elton" />
      )}
    </div>
  );
}
