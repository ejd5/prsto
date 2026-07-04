"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, Plus, Trash2, RefreshCw, ExternalLink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface PlatformStatus {
  platform: string;
  status: string;
  sessionAgeHours: number | null;
  lastError: string | null;
}

interface EditFormData {
  platform: string; label: string; searchUrl: string; maxResultsPerRun: number;
  locationPriority: number; scrollEnabled: boolean; maxScrolls: number;
  scrollDelayMs: number; fetchDetailsEnabled: boolean; maxDetailsPerRun: number;
}

interface BrowserConfig {
  id: string;
  platform: string;
  label: string;
  searchUrl: string;
  enabled: boolean;
  maxResultsPerRun: number;
  locationPriority: number | null;
  lastRunAt: string | null;
  lastError: string | null;
  lastOffersFound: number;
  lastDetailsFetched: number;
  scrollEnabled: boolean;
  maxScrolls: number;
  scrollDelayMs: number;
  fetchDetailsEnabled: boolean;
  maxDetailsPerRun: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  indeed: "#003A9B",
  apec: "#E2001A",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "PACA",
  2: "IDF",
  3: "France",
  4: "Intl",
};

export default function BrowserSettingsPage() {
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [configs, setConfigs] = useState<BrowserConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // New config form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: "linkedin", label: "", searchUrl: "", maxResultsPerRun: 10, locationPriority: 3, scrollEnabled: false, maxScrolls: 3, scrollDelayMs: 1000, fetchDetailsEnabled: false, maxDetailsPerRun: 3 });
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [statusRes, configsRes] = await Promise.all([
        fetch("/api/jobs/browser-agent/status").then(r => r.json()),
        fetch("/api/jobs/browser-agent/configs").then(r => r.json()),
      ]);
      setPlatforms(statusRes.platforms || []);
      setConfigs(configsRes.configs || []);
    } catch { setMsg("Erreur chargement"); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    setMsg(null);
    try {
      const res = await fetch("/api/jobs/browser-agent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      setMsg(data.message || "Connexion terminée");
      await load();
      if (data.status === "connected") {
        // Navigateur ouvert — attendre que l'utilisateur ferme
        alert("Un navigateur va s'ouvrir. Connectez-vous manuellement, puis revenez ici.");
      }
    } catch { setMsg("Erreur connexion"); }
    setConnecting(null);
  };

  const handleAddConfig = async () => {
    if (!form.label || !form.searchUrl) return;
    try {
      const res = await fetch("/api/jobs/browser-agent/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setForm({ platform: "linkedin", label: "", searchUrl: "", maxResultsPerRun: 10, locationPriority: 3, scrollEnabled: false, maxScrolls: 3, scrollDelayMs: 1000, fetchDetailsEnabled: false, maxDetailsPerRun: 3 });
        await load();
      }
    } catch { setMsg("Erreur ajout config"); }
  };

  const handleToggleConfig = async (id: string, enabled: boolean) => {
    await fetch(`/api/jobs/browser-agent/configs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, enabled: !enabled } : c));
  };

  const handleEditConfig = (config: BrowserConfig) => {
    setEditingConfigId(config.id);
    setEditForm({
      platform: config.platform,
      label: config.label,
      searchUrl: config.searchUrl,
      maxResultsPerRun: config.maxResultsPerRun,
      locationPriority: config.locationPriority || 3,
      scrollEnabled: config.scrollEnabled,
      maxScrolls: config.maxScrolls,
      scrollDelayMs: config.scrollDelayMs || 1000,
      fetchDetailsEnabled: config.fetchDetailsEnabled,
      maxDetailsPerRun: config.maxDetailsPerRun,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingConfigId || !editForm) return;
    try {
      await fetch(`/api/jobs/browser-agent/configs/${editingConfigId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingConfigId(null);
      setEditForm(null);
      await load();
      setMsg("Configuration mise à jour");
    } catch { setMsg("Erreur mise à jour"); }
  };

  const handleTestConfig = async (id: string) => {
    setTestingIds(prev => new Set(prev).add(id));
    setMsg(null);
    try {
      const res = await fetch("/api/jobs/browser-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId: id }),
      });
      const data = await res.json();
      setMsg(data.message || "Test terminé");
      await load();
    } catch { setMsg("Erreur test"); }
    setTestingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm("Supprimer cette configuration ?")) return;
    await fetch(`/api/jobs/browser-agent/configs/${id}`, { method: "DELETE" });
    await load();
  };

  const statusIcon = (status: string) => {
    if (status === "connected") return <CheckCircle2 size={14} style={{ color: "#22c55e" }} />;
    if (status === "needs_user_reauth") return <XCircle size={14} style={{ color: "#ef4444" }} />;
    if (status === "blocked") return <AlertTriangle size={14} style={{ color: "#ef4444" }} />;
    return <XCircle size={14} style={{ color: "#808080" }} />;
  };

  const statusLabel = (status: string) => {
    if (status === "connected") return "Connecté";
    if (status === "needs_user_reauth") return "Session expirée";
    if (status === "blocked") return "Bloqué";
    return "Non configuré";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <Globe size={22} style={{ color: "var(--or)" }} />
            Browser Agent
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Connectez votre session navigateur pour importer les offres de LinkedIn, Indeed et APEC
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
          <RefreshCw size={12} /> Rafraîchir
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-md text-xs flex items-center gap-2" style={{
          background: msg.includes("erreur") || msg.includes("Erreur") || msg.includes("expirée") || msg.includes("invalide")
            ? "rgba(239,68,68,0.08)"
            : msg.includes("Session") || msg.includes("connect")
              ? "rgba(99,102,241,0.08)"
              : "rgba(74,222,128,0.08)",
          color: msg.includes("erreur") || msg.includes("Erreur") || msg.includes("expirée") || msg.includes("invalide")
            ? "#ef4444"
            : msg.includes("Session") || msg.includes("connect")
              ? "#6366f1"
              : "#22c55e",
        }}>
          {testingIds.size > 0 && <Loader2 size={12} className="animate-spin mr-1" />}
          {testingIds.size > 0 ? "Test en cours (5–15 secondes)... " : ""}{msg}
        </div>
      )}

      {/* Statuts plateformes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {platforms.map(p => (
          <div key={p.platform} className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.platform] || "var(--or)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>
                  {p.platform === "linkedin" ? "LinkedIn" : p.platform === "indeed" ? "Indeed" : "APEC"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono" style={{ color: statusLabel(p.status) === "Connecté" ? "#22c55e" : (p.status === "not_configured" ? "#808080" : "#ef4444") }}>
                {statusIcon(p.status)} {statusLabel(p.status)}
              </div>
            </div>
            {p.sessionAgeHours !== null && (
              <div className="text-xs mb-2" style={{ color: "var(--texte-tertiaire)" }}>
                Session : {p.sessionAgeHours}h
              </div>
            )}
            {p.lastError && (
              <div className="text-xs mb-2" style={{ color: "#ef4444" }}>
                {p.lastError}
              </div>
            )}
            <button
              onClick={() => handleConnect(p.platform)}
              disabled={connecting === p.platform}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)" }}
            >
              {connecting === p.platform ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
              {p.status === "connected" ? "Reconnecter" : "Connecter la session"}
            </button>
          </div>
        ))}
      </div>

      {/* Configurations */}
      <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>
            URLs de recherche ({configs.length})
          </h3>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
            style={{ borderColor: "var(--or)", color: "var(--or)" }}>
            <Plus size={12} /> Ajouter une recherche
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: "var(--texte-tertiaire)" }}>
          Configurez des URLs de recherche pour que le Browser Agent les explore avec votre session connectée.
          Les offres trouvées seront importées dans le pipeline PRSTO.
        </p>

        {showForm && (
          <div className="p-4 rounded border space-y-3 mb-4" style={{ borderColor: "var(--or)", background: "var(--fond)" }}>
            <h4 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Nouvelle URL de recherche</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Plateforme</label>
                <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="input-prsto w-full mt-1">
                  <option value="linkedin">LinkedIn</option>
                  <option value="indeed">Indeed</option>
                  <option value="apec">APEC</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Priorité géographique</label>
                <select value={form.locationPriority} onChange={e => setForm(f => ({ ...f, locationPriority: parseInt(e.target.value) }))}
                  className="input-prsto w-full mt-1">
                  <option value={1}>PACA</option>
                  <option value={2}>Paris / IDF</option>
                  <option value={3}>France</option>
                  <option value={4}>International</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Label</label>
              <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="input-prsto w-full mt-1" placeholder="ex: Directeur Commercial PACA" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>URL de recherche</label>
              <input type="url" value={form.searchUrl} onChange={e => setForm(f => ({ ...f, searchUrl: e.target.value }))}
                className="input-prsto w-full mt-1" placeholder="https://www.linkedin.com/jobs/search/?keywords=..." />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Max résultats/run</label>
                <input type="number" value={form.maxResultsPerRun} onChange={e => setForm(f => ({ ...f, maxResultsPerRun: parseInt(e.target.value) || 10 }))}
                  className="input-prsto w-full mt-1" min={1} max={20} />
              </div>
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Scroll max</label>
                <input type="number" value={form.maxScrolls} onChange={e => setForm(f => ({ ...f, maxScrolls: Math.min(parseInt(e.target.value) || 0, 5) }))}
                  className="input-prsto w-full mt-1" min={0} max={5} />
              </div>
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Délai scroll (ms)</label>
                <input type="number" value={form.scrollDelayMs} onChange={e => setForm(f => ({ ...f, scrollDelayMs: parseInt(e.target.value) || 1000 }))}
                  className="input-prsto w-full mt-1" min={500} max={2000} />
              </div>
              <div>
                <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Détails max</label>
                <input type="number" value={form.maxDetailsPerRun} onChange={e => setForm(f => ({ ...f, maxDetailsPerRun: Math.min(parseInt(e.target.value) || 0, 5) }))}
                  className="input-prsto w-full mt-1" min={0} max={5} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.scrollEnabled} onChange={e => setForm(f => ({ ...f, scrollEnabled: e.target.checked }))} />
                <span style={{ color: "var(--texte-secondaire)", fontSize: "12px" }}>Scroll automatique</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.fetchDetailsEnabled} onChange={e => setForm(f => ({ ...f, fetchDetailsEnabled: e.target.checked }))} />
                <span style={{ color: "var(--texte-secondaire)", fontSize: "12px" }}>Enrichir descriptions</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddConfig}
                className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--or)", color: "#000" }}>
                Ajouter
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-md text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {configs.length === 0 && !showForm && (
          <div className="py-8 text-center text-xs" style={{ color: "var(--texte-tertiaire)" }}>
            Aucune URL configurée. Ajoutez-en une pour commencer.
          </div>
        )}

        <div className="space-y-1">
          {configs.map(c => (
            <div key={c.id}>
              {/* Edit form (when editing) */}
              {editingConfigId === c.id && editForm && (
                <div className="p-4 rounded border space-y-3 mb-2" style={{ borderColor: "var(--or)", background: "var(--fond)" }}>
                  <h4 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Modifier : {c.label}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Plateforme</label>
                      <select value={(editForm as EditFormData).platform as string} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { platform: e.target.value }))}
                        className="input-prsto w-full mt-1">
                        <option value="linkedin">LinkedIn</option>
                        <option value="indeed">Indeed</option>
                        <option value="apec">APEC</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Priorité géographique</label>
                      <select value={(editForm as EditFormData).locationPriority} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { locationPriority: parseInt(e.target.value) }))}
                        className="input-prsto w-full mt-1">
                        <option value={1}>PACA</option>
                        <option value={2}>Paris / IDF</option>
                        <option value={3}>France</option>
                        <option value={4}>International</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Label</label>
                    <input type="text" value={(editForm as EditFormData).label} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { label: e.target.value }))}
                      className="input-prsto w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>URL de recherche</label>
                    <input type="url" value={(editForm as EditFormData).searchUrl} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { searchUrl: e.target.value }))}
                      className="input-prsto w-full mt-1" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Max résultats</label>
                      <input type="number" value={(editForm as EditFormData).maxResultsPerRun} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { maxResultsPerRun: parseInt(e.target.value) || 10 }))}
                        className="input-prsto w-full mt-1" min={1} max={20} />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Scroll max</label>
                      <input type="number" value={(editForm as EditFormData).maxScrolls} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { maxScrolls: Math.min(parseInt(e.target.value) || 0, 5) }))}
                        className="input-prsto w-full mt-1" min={0} max={5} />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Délai scroll (ms)</label>
                      <input type="number" value={(editForm as EditFormData).scrollDelayMs} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { scrollDelayMs: parseInt(e.target.value) || 1000 }))}
                        className="input-prsto w-full mt-1" min={500} max={2000} />
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Détails max</label>
                      <input type="number" value={(editForm as EditFormData).maxDetailsPerRun} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { maxDetailsPerRun: Math.min(parseInt(e.target.value) || 0, 5) }))}
                        className="input-prsto w-full mt-1" min={0} max={5} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(editForm as EditFormData).scrollEnabled} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { scrollEnabled: e.target.checked }))} />
                      <span style={{ color: "var(--texte-secondaire)", fontSize: "12px" }}>Scroll automatique</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(editForm as EditFormData).fetchDetailsEnabled} onChange={e => setEditForm(prev => Object.assign({} as EditFormData, prev || {}, { fetchDetailsEnabled: e.target.checked }))} />
                      <span style={{ color: "var(--texte-secondaire)", fontSize: "12px" }}>Enrichir descriptions</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit}
                      className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--or)", color: "#000" }}>
                      Enregistrer
                    </button>
                    <button onClick={() => { setEditingConfigId(null); setEditForm(null); }}
                      className="px-3 py-1.5 rounded-md text-xs font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Config card */}
              <div className="flex items-start gap-3 p-3 rounded border text-xs" style={{ borderColor: c.enabled ? "var(--bordure-douce)" : "var(--bordure)", background: "var(--fond)", opacity: c.enabled ? 1 : 0.5 }}>
                <button onClick={() => handleToggleConfig(c.id, c.enabled)} className="mt-0.5">
                  {c.enabled ? <CheckCircle2 size={14} style={{ color: "#22c55e" }} /> : <XCircle size={14} style={{ color: "#808080" }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium" style={{ color: "var(--texte)" }}>{c.label}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: `${PLATFORM_COLORS[c.platform] || "#808080"}20`, color: PLATFORM_COLORS[c.platform] || "#808080" }}>
                      {c.platform}
                    </span>
                    {c.locationPriority && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                        {PRIORITY_LABELS[c.locationPriority] || `P${c.locationPriority}`}
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>max {c.maxResultsPerRun}/run</span>
                  </div>
                  <div className="mt-0.5 truncate" style={{ color: "var(--texte-tertiaire)" }}>{c.searchUrl}</div>
                  <div className="mt-0.5 flex gap-3 text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
                    {c.lastOffersFound !== undefined && <span>{c.lastOffersFound} offre(s)</span>}
                    {c.lastDetailsFetched > 0 && <span>{c.lastDetailsFetched} détail(s)</span>}
                    {c.scrollEnabled && <span>scroll {c.maxScrolls}x</span>}
                    {c.fetchDetailsEnabled && <span>détails {c.maxDetailsPerRun}x</span>}
                  </div>
                  {c.lastRunAt && (
                    <div className="mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                      Dernier run : {new Date(c.lastRunAt).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  {c.lastError && (
                    <div className="mt-0.5 flex items-center gap-1" style={{ color: "#ef4444" }}>
                      <AlertTriangle size={9} /> {c.lastError}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col gap-1">
                  <button onClick={() => handleEditConfig(c)}
                    className="px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                    Modifier
                  </button>
                  <button onClick={() => handleTestConfig(c.id)} disabled={testingIds.has(c.id)}
                    className="px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "var(--or)", color: testingIds.has(c.id) ? "var(--texte-tertiaire)" : "var(--or)" }}>
                    {testingIds.has(c.id) ? <Loader2 size={10} className="animate-spin inline" /> : null}
                    Tester
                  </button>
                  <button onClick={() => handleDeleteConfig(c.id)} className="px-2 py-1 rounded text-[10px] font-mono border" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                    <Trash2 size={10} className="inline mr-0.5" /> Suppr.
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border text-xs space-y-2" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Sécurité</h3>
          <ul className="space-y-1" style={{ color: "var(--texte-secondaire)" }}>
            <li>• PRSTO ne stocke <strong>aucun mot de passe</strong></li>
            <li>• Connexion manuelle dans un navigateur visible</li>
            <li>• Seule la session (cookies) est sauvegardée localement</li>
            <li>• Stockage : <code className="font-mono">~/.elton/browser-sessions/</code></li>
            <li>• Aucun contournement CAPTCHA, 2FA ou anti-bot</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border text-xs space-y-2" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond-surface)" }}>
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Configs de test (curl)</h3>
          <div className="space-y-1 font-mono" style={{ color: "var(--texte-secondaire)", fontSize: "10px", wordBreak: "break-all" }}>
            <p><strong style={{ color: "var(--texte)" }}>LinkedIn PACA</strong><br/>
            <span style={{ color: "var(--or)" }}>POST</span> /api/jobs/browser-agent/configs<br/>
            platform: linkedin, label: Dir. Commercial PACA<br/>
            locationPriority: 1, scroll: 3x, details: 3</p>
            <p><strong style={{ color: "var(--texte)" }}>Indeed Marseille</strong><br/>
            <span style={{ color: "var(--or)" }}>POST</span> /api/jobs/browser-agent/configs<br/>
            platform: indeed, label: Dir. Commercial Marseille<br/>
            locationPriority: 1, scroll: 2x, details: off</p>
            <p><strong style={{ color: "var(--texte)" }}>APEC France</strong><br/>
            <span style={{ color: "var(--or)" }}>POST</span> /api/jobs/browser-agent/configs<br/>
            platform: apec, label: Dir. Commercial France<br/>
            locationPriority: 3, scroll: 2x, details: off</p>
          </div>
        </div>
      </div>
    </div>
  );
}
