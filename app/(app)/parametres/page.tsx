"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/EltonToast";
import {
  Loader2, Save, Eye, EyeOff, RotateCcw, ToggleLeft, ToggleRight,
  Shield, Cpu, FileText, Database, Settings2, AlertTriangle, Download,
  Heart, CheckCircle2, XCircle,
} from "lucide-react";
import { getSettings, updateSettings, seedDefaultPrompts, testConnection } from "@/lib/actions/settings";
import { getAIPrompts, togglePromptActive, resetPromptToDefault, upsertAIPrompt } from "@/lib/actions/settings";
import { exportAllData } from "@/lib/actions/export";
import type { ConnectionTestResult } from "@/lib/ai/deepseek";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface SettingsState {
  aiProvider?: string | null;
  hasApiKey?: boolean | null;
  baseUrl?: string | null;
  defaultModel?: string | null;
  proModel?: string | null;
  timeout?: number | null;
  temperature?: number | null;
  localFallbackEnabled?: boolean | null;
  anonymizeName?: boolean | null;
  anonymizeEmail?: boolean | null;
  anonymizePhone?: boolean | null;
  anonymizeCompanies?: boolean | null;
  anonymizeSalary?: boolean | null;
  confidentialityMode?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}
type SettingsData = SettingsState | null;

interface PromptData {
  name: string;
  label?: string;
  description?: string | null;
  systemPrompt?: string | null;
  content?: string;
  variables?: string;
  temperature?: number | null;
  active?: boolean;
  preferredModel?: string | null;
  id?: string;
  updatedAt?: Date;
  outputSchema?: string | null;
  [key: string]: unknown;
}

const TABS = [
  { key: "general", label: "Général", icon: Settings2 },
  { key: "deepseek", label: "IA / OpenRouter", icon: Cpu },
  { key: "confidentialite", label: "Confidentialité", icon: Shield },
  { key: "prompts", label: "Prompts IA", icon: FileText },
  { key: "donnees", label: "Données", icon: Database },
  { key: "sante", label: "Santé", icon: Heart },
] as const;

export default function ParametresPage() {
  const toast = useToast();
  const [tab, setTab] = useState<string>("general");
  const [stats, setStats] = useState({ opportunités: 0, drafts: 0, documents: 0, sources: 0 });
  const [aiStatus, setAiStatus] = useState<"ok" | "info" | "warning">("info");
  const [aiDetail, setAiDetail] = useState("Non configuré");

  useEffect(() => {
    fetch("/api/elton-os/health").then(r => r.json()).then(d => {
      if (d.status === "ok") {
        setStats({
          opportunités: d.stats?.opportunities || 0,
          drafts: d.stats?.drafts || 0,
          documents: d.stats?.documents || 0,
          sources: d.stats?.sources || 0,
        });
        setAiStatus(d.ai?.configured ? "ok" : "info");
        setAiDetail(d.ai?.configured ? `${d.ai.provider} (configuré)` : "Non configuré");
      }
    }).catch(() => {});
  }, []);
  const [settings, setSettings] = useState<SettingsData>(null);
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptForm, setPromptForm] = useState<Partial<PromptData>>({});
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionResult(null);
    try {
      const result = await testConnection();
      setConnectionResult(result);
    } catch (e: unknown) {
      const err = e as Error;
      setConnectionResult({ success: false, status: "network_error", error: err.message || "Erreur inconnue" });
    } finally {
      setTesting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p] = await Promise.all([getSettings(), getAIPrompts()]);
    setSettings(s as unknown as SettingsState);
    setPrompts(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await updateSettings(data as unknown as Parameters<typeof updateSettings>[0]);
      notify("ok", "Paramètres sauvegardés");
      await load();
    } catch { notify("err", "Erreur lors de la sauvegarde"); }
    setSaving(false);
  };

  const handleSeedPrompts = async () => {
    setSaving(true);
    try {
      const count = await seedDefaultPrompts();
      notify("ok", `${count} prompts réinitialisés`);
      await load();
    } catch { notify("err", "Erreur lors de la réinitialisation"); }
    setSaving(false);
  };

  const handleTogglePrompt = async (name: string, active: boolean) => {
    await togglePromptActive(name, active);
    await load();
  };

  const handleResetPrompt = async (name: string) => {
    await resetPromptToDefault(name);
    notify("ok", `Prompt "${name}" réinitialisé`);
    await load();
  };

  const handleEditPrompt = (p: PromptData) => {
    setEditingPrompt(p.name ?? null);
    setPromptForm({
      name: p.name,
      label: p.label || "",
      description: p.description || "",
      systemPrompt: p.systemPrompt || "",
      content: p.content || "",
      variables: p.variables || "",
      temperature: p.temperature ?? 0.5,
      active: p.active ?? true,
    });
  };

  const handleSavePrompt = async () => {
    setSaving(true);
    try {
      await upsertAIPrompt(promptForm as unknown as Parameters<typeof upsertAIPrompt>[0]);
      notify("ok", "Prompt sauvegardé");
      setEditingPrompt(null);
      await load();
    } catch { notify("err", "Erreur"); }
    setSaving(false);
  };

  const handleExport = async () => {
    setSaving(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prsto-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("ok", "Export JSON téléchargé");
    } catch { notify("err", "Erreur lors de l'export"); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  const hasApiKey = settings?.hasApiKey;

  const handleAISuggestion = (_target: string, _item: SuggestionItem) => {
    toast.info(`Suggestion : ${_item.name} — ${_item.reason}`);
  };

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>Paramètres Cabinet</h1>
        <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
          Configuration PRSTO — toutes les données restent locales
        </p>
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--fond-eleve)" }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} data-testid={`tab-${key}`}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md transition-colors"
            style={{ background: tab === key ? "var(--fond-surface)" : "transparent", color: tab === key ? "var(--or)" : "var(--texte-tertiaire)" }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Général */}
      {tab === "general" && (
        <div className="space-y-4 p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Paramètres généraux</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>Provider IA</label>
              <select value={settings?.aiProvider || "none"} onChange={e => {
                const provider = e.target.value;
                if (provider === "openrouter") {
                  handleSave({ aiProvider: provider, baseUrl: "https://openrouter.ai/api", defaultModel: "google/gemma-4-26b-a4b-it:free" });
                } else if (provider === "deepseek") {
                  handleSave({ aiProvider: provider, baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat" });
                } else {
                  handleSave({ aiProvider: provider });
                }
              }}
                className="input-prsto text-xs w-full">
                <option value="none">Aucun (local templates)</option>
                <option value="openrouter">OpenRouter (gratuit)</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>Modèle par défaut</label>
              <input type="text" defaultValue={settings?.defaultModel || ""}
                onBlur={e => handleSave({ defaultModel: e.target.value })}
                className="input-prsto text-xs w-full" placeholder={settings?.aiProvider === "openrouter" ? "google/gemma-4-26b-a4b-it:free" : "deepseek-chat"} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>Timeout (s)</label>
              <input type="number" defaultValue={settings?.timeout ?? 25}
                onBlur={e => handleSave({ timeout: parseInt(e.target.value) || 25 })}
                className="input-prsto text-xs w-full" min={5} max={120} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>Température</label>
              <input type="number" defaultValue={settings?.temperature ?? 0.4}
                onBlur={e => handleSave({ temperature: parseFloat(e.target.value) || 0.4 })}
                className="input-prsto text-xs w-full" min={0} max={2} step={0.1} />
            </div>
          </div>
        </div>
      )}

      {/* DeepSeek */}
      {tab === "deepseek" && (
        <div className="space-y-4 p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-center gap-2">
            <Cpu size={16} style={{ color: "var(--or)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Fournisseur IA</h3>
          </div>

          <div className="p-3 rounded-md border text-xs" style={{ background: "var(--fond-eleve)", borderColor: "var(--bordure-douce)", color: "var(--texte-secondaire)" }}>
            {settings?.aiProvider === "openrouter"
              ? "OpenRouter : modèles gratuits (Qwen 3.6 Plus, Llama 3.3 70B). OpenAI-compatible."
              : settings?.aiProvider === "deepseek"
                ? "DeepSeek : payant par usage. Performant pour le code et l'analyse."
                : "Aucun fournisseur configuré. Activez OpenRouter (gratuit) ou DeepSeek pour l'IA."}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>Clé API</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type={showKey ? "text" : "password"} value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="input-prsto text-xs w-full pr-8" placeholder={hasApiKey ? "••••••••••••••••" : "sk-..."} />
                <button onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--texte-tertiaire)" }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={() => { handleSave({ apiKey }); setApiKey(""); }}
                disabled={!apiKey}
                className="flex items-center gap-1 px-4 py-2 text-xs font-mono rounded-md"
                style={{ background: apiKey ? "var(--or)" : "var(--fond-eleve)", color: apiKey ? "var(--fond)" : "var(--texte-tertiaire)" }}>
                <Save size={12} /> Sauvegarder
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--avertissement)" }}>
              La clé n&apos;est jamais affichée après sauvegarde. Elle est hachée en base.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono" style={{ color: "var(--texte-secondaire)" }}>URL de base</label>
            <input type="text" defaultValue={settings?.baseUrl || (settings?.aiProvider === "openrouter" ? "https://openrouter.ai/api" : "https://api.deepseek.com")}
              onBlur={e => handleSave({ baseUrl: e.target.value })}
              className="input-prsto text-xs w-full"
              placeholder={settings?.aiProvider === "openrouter" ? "https://openrouter.ai/api" : "https://api.deepseek.com"} />
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "var(--bordure-douce)" }}>
            <button onClick={handleTestConnection} disabled={testing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--or-faible)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
              {testing ? <Loader2 size={12} className="animate-spin" /> : <Cpu size={12} />}
              {testing ? "Test en cours..." : `Tester la connexion ${settings?.aiProvider === "openrouter" ? "OpenRouter" : "DeepSeek"}`}
            </button>

            {connectionResult && (
              <div className={connectionResult.success ? "connexion-ok-prsto" : "connexion-err-prsto"}
                style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 6, border: "1px solid",
                  borderColor: connectionResult.success ? "var(--succes)" : "var(--erreur)",
                  background: connectionResult.success ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                  fontSize: "0.75rem",
                }}>
                <p style={{ fontWeight: 700, color: connectionResult.success ? "var(--succes)" : "var(--erreur)" }}>
                  {connectionResult.success ? "✓ Connecté" :
                    connectionResult.status === "no_key" ? "✗ Clé absente" :
                    connectionResult.status === "timeout" ? "✗ Timeout" :
                    connectionResult.status === "model_unavailable" ? "✗ Modèle indisponible" :
                    connectionResult.status === "invalid_response" ? "✗ Réponse invalide" :
                    "✗ Erreur réseau"}
                </p>
                {connectionResult.error && (
                  <p style={{ color: "var(--texte-secondaire)", marginTop: 4 }}>{connectionResult.error}</p>
                )}
                <div style={{ marginTop: 6, display: "flex", gap: 16, color: "var(--texte-tertiaire)", fontSize: "0.7rem" }}>
                  {connectionResult.model && <span>Modèle : {connectionResult.model}</span>}
                  {connectionResult.responseTimeMs != null && <span>Temps : {connectionResult.responseTimeMs}ms</span>}
                  {connectionResult.maskedKey && <span>Clé : {connectionResult.maskedKey}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confidentialité */}
      {tab === "confidentialite" && (
        <div className="space-y-4 p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--or)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Confidentialité</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Fallback local</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>Utiliser les templates locaux si l&apos;IA échoue</p>
              </div>
              <button onClick={() => handleSave({ localFallbackEnabled: !(settings?.localFallbackEnabled !== false) })}
                style={{ color: settings?.localFallbackEnabled !== false ? "var(--succes)" : "var(--texte-tertiaire)" }}>
                {settings?.localFallbackEnabled !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              </button>
            </div>

            <h4 className="text-xs font-mono uppercase mt-4" style={{ color: "var(--texte-tertiaire)" }}>Anonymisation automatique</h4>

            {[
              { key: "anonymizeName", label: "Nom", desc: "Remplacer le nom par [CANDIDAT]" },
              { key: "anonymizeEmail", label: "Email", desc: "Remplacer l&apos;email par [EMAIL]" },
              { key: "anonymizePhone", label: "Téléphone", desc: "Remplacer le tél par [TEL]" },
              { key: "anonymizeCompanies", label: "Entreprises", desc: "Remplacer les noms d&apos;entreprises" },
              { key: "anonymizeSalary", label: "Salaire", desc: "Masquer les montants de salaire" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
                <div>
                  <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{desc}</p>
                </div>
                <button onClick={() => handleSave({ [key]: !settings?.[key] })}
                  style={{ color: settings?.[key] ? "var(--or)" : "var(--texte-tertiaire)" }}>
                  {settings?.[key] ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompts IA */}
      {tab === "prompts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="flex items-center gap-2">
              <FileText size={16} style={{ color: "var(--or)" }} />
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Prompts IA</h3>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{prompts.length} prompts • {prompts.filter((p: PromptData) => p.active).length} actifs</p>
              </div>
            </div>
            <button onClick={handleSeedPrompts} disabled={saving}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              <RotateCcw size={12} /> Réinitialiser les 12 prompts
            </button>
          </div>

          {editingPrompt && (
            <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
              <h4 className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>Édition : {promptForm.name}</h4>
              <div className="space-y-2">
                <input type="text" value={promptForm.label} onChange={e => setPromptForm({ ...promptForm, label: e.target.value })}
                  className="input-prsto text-xs w-full" placeholder="Label" />
                <input type="text" value={promptForm.description || ""} onChange={e => setPromptForm({ ...promptForm, description: e.target.value })}
                  className="input-prsto text-xs w-full" placeholder="Description" />
                <textarea value={promptForm.systemPrompt || ""} onChange={e => setPromptForm({ ...promptForm, systemPrompt: e.target.value })}
                  className="input-prsto text-xs w-full font-mono resize-y" rows={3} placeholder="System prompt" />
                <textarea value={promptForm.content || ""} onChange={e => setPromptForm({ ...promptForm, content: e.target.value })}
                  className="input-prsto text-xs w-full font-mono resize-y" rows={4} placeholder="User prompt template" />
                <div className="flex gap-4">
                  <input type="text" value={promptForm.variables || ""} onChange={e => setPromptForm({ ...promptForm, variables: e.target.value })}
                    className="input-prsto text-xs flex-1" placeholder='Variables: ["offer","profile"]' />
                  <input type="number" value={promptForm.temperature ?? 0.5} onChange={e => setPromptForm({ ...promptForm, temperature: parseFloat(e.target.value) })}
                    className="input-prsto text-xs w-24" min={0} max={2} step={0.1} placeholder="Temp" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingPrompt(null)}
                  className="px-4 py-1.5 text-xs font-mono rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                  Annuler
                </button>
                <button onClick={handleSavePrompt} disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs font-mono rounded-md"
                  style={{ background: "var(--or)", color: "var(--fond)" }}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Sauvegarder
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {prompts.map((p: PromptData) => (
              <div key={p.name} className="p-4 rounded-lg border space-y-2"
                style={{ background: "var(--fond-surface)", borderColor: p.active ? "var(--bordure)" : "var(--bordure-douce)", opacity: p.active ? 1 : 0.6 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTogglePrompt(p.name, !p.active)} title={p.active ? "Désactiver" : "Activer"}
                      style={{ color: p.active ? "var(--succes)" : "var(--texte-tertiaire)" }}>
                      {p.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <span className="text-sm font-mono font-bold" style={{ color: "var(--texte)" }}>{p.label}</span>
                    <span className="text-xs font-mono opacity-40" style={{ color: "var(--texte-tertiaire)" }}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditPrompt(p)}
                      className="text-xs px-2 py-1 rounded border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                      Modifier
                    </button>
                    <button onClick={() => handleResetPrompt(p.name)}
                      className="text-xs px-2 py-1 rounded border" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
                      Reset
                    </button>
                  </div>
                </div>
                {p.description && (
                  <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{p.description}</p>
                )}
                <pre className="text-xs font-mono truncate" style={{ color: "var(--texte-secondaire)" }}>{p.content}</pre>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  <span>Variables: {p.variables}</span>
                  <span>Temp: {p.temperature ?? "défaut"}</span>
                  {p.preferredModel && <span>Model: {p.preferredModel}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Données locales */}
      {tab === "donnees" && (
        <div className="space-y-4 p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} style={{ color: "var(--or)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Données locales</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md"
                style={{ background: "var(--or)", color: "var(--fond)" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Exporter tout (JSON)
              </button>
              <a href="/api/elton-os/export"
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md"
                style={{ background: "#22c55e", color: "#000", textDecoration: "none" }}>
                <Download size={12} />
                Export ZIP (Backup)
              </a>
            </div>
          </div>

          <div className="p-3 rounded-md border text-xs" style={{ background: "var(--fond-eleve)", borderColor: "var(--bordure-douce)", color: "var(--texte-secondaire)" }}>
            Toutes les données PRSTO sont stockées localement dans une base SQLite. Aucune donnée ne quitte votre machine sans votre action explicite. L&apos;export JSON inclut toutes vos données (profil, CV, preuves, offres, analyses, documents, pipeline, relances, entretiens) — <strong>sans la clé API</strong>.
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Emplacement base de données</p>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  <code style={{ color: "var(--or)", background: "var(--fond-eleve)", padding: "1px 4px", borderRadius: 3 }}>prisma/dev.db</code>
                  {" "}dans le répertoire du projet
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--succes)" }}>SQLite</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Sauvegarde recommandée</p>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  Copiez <code style={{ color: "var(--or)", background: "var(--fond-eleve)", padding: "1px 4px", borderRadius: 3 }}>prisma/dev.db</code> vers un emplacement sécurisé (cloud, disque externe) chaque semaine
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--info)" }}>Hebdo</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Export JSON</p>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  Export complet de toutes vos données au format JSON (profil, CV, preuves, offres, pipeline, etc.). Clé API exclue.
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--succes)" }}>OK</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Mode IA</p>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  {settings?.aiProvider === "none" || !settings?.aiProvider
                    ? "Local uniquement (templates)"
                    : `${settings?.aiProvider}${settings?.hasApiKey ? " (clé configurée)" : " (pas de clé)"}`}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{
                background: settings?.aiProvider && settings?.aiProvider !== "none" ? "rgba(74,222,128,0.1)" : "rgba(156,163,175,0.1)",
                color: settings?.aiProvider && settings?.aiProvider !== "none" ? "var(--succes)" : "var(--texte-tertiaire)",
              }}>
                {settings?.aiProvider === "none" || !settings?.aiProvider ? "Local" : settings?.aiProvider}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Confidentialité</p>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  {settings?.confidentialityMode || "local"} • Anonymisation {settings?.anonymizeName ? "ON" : "OFF"}
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--succes)" }}>Protégé</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md border" style={{ borderColor: "var(--bordure-douce)" }}>
              <div>
                <p className="text-xs font-mono" style={{ color: "var(--texte)" }}>Fallback local</p>
                <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  {settings?.localFallbackEnabled !== false ? "Activé — si l'IA échoue, templates locaux utilisés" : "Désactivé"}
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: settings?.localFallbackEnabled !== false ? "var(--succes)" : "var(--avertissement)" }}>
                {settings?.localFallbackEnabled !== false ? "ON" : "OFF"}
              </span>
            </div>

            <div className="p-3 rounded-md border text-xs" style={{ background: "var(--fond-eleve)", borderColor: "var(--avertissement)", color: "var(--avertissement)" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>Sauvegardez régulièrement votre fichier <code style={{ color: "var(--or)" }}>prisma/dev.db</code>. Utilisez l&apos;export JSON pour une sauvegarde lisible et portable de vos données.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "sante" && (
        <div className="space-y-4 p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} style={{ color: "var(--or)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Santé système</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--texte-secondaire)" }}>
            Vérification rapide de votre configuration PRSTO. Aucune donnée sensible affichée.
          </p>

          <HealthCard
            label="Base de données locale"
            status="ok"
            detail="SQLite"
            icon={<Database size={14} />}
          />

          <HealthCard
            label="Offres importées"
            status="ok"
            detail={`${stats.opportunités} offres`}
            icon={<Database size={14} />}
          />

          <HealthCard
            label="Candidatures"
            status={stats.drafts > 0 ? "ok" : "info"}
            detail={stats.drafts > 0 ? `${stats.drafts} dossier(s)` : "Aucune candidature pour l'instant"}
            icon={<FileText size={14} />}
          />

          <HealthCard
            label="Documents générés"
            status={stats.documents > 0 ? "ok" : "info"}
            detail={`${stats.documents} document(s)`}
            icon={<FileText size={14} />}
          />

          <HealthCard
            label="Sources d'emploi"
            status={stats.sources > 0 ? "ok" : "warning"}
            detail={`${stats.sources} source(s)`}
            icon={<Database size={14} />}
          />

          <HealthCard
            label="AI Provider"
            status={aiStatus}
            detail={aiDetail}
            icon={<Cpu size={14} />}
          />

          <HealthCard
            label="Fallback local"
            status={settings?.localFallbackEnabled !== false ? "ok" : "info"}
            detail={settings?.localFallbackEnabled !== false ? "Activé — génération sans IA disponible" : "Désactivé"}
            icon={<Settings2 size={14} />}
          />

          <HealthCard
            label="Export ZIP disponible"
            status="ok"
            detail={<span>GET /api/elton-os/export <a href="/api/elton-os/export" className="underline" style={{ color: "var(--or)" }}>Télécharger</a></span>}
            icon={<Download size={14} />}
          />

          <button onClick={() => window.location.href = "/?checklist=1"}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md mt-4"
            style={{ background: "var(--or)", color: "#000", border: "none", cursor: "pointer" }}>
            <CheckCircle2 size={12} />
            Voir la checklist release
          </button>
        </div>
      )}
    </div>
      <AIAssistant onApply={handleAISuggestion} />
    </>
  );
}

/* ── HealthCard ───────────────────────────── */

function HealthCard({ label, status, detail, icon }: {
  label: string; status: "ok" | "warning" | "info"; detail: string | React.ReactNode; icon: React.ReactNode;
}) {
  const colors = {
    ok: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: "#22c55e", text: "var(--succes)" },
    warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: "#f59e0b", text: "var(--avertissement)" },
    info: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", icon: "#3b82f6", text: "var(--info)" },
  };
  const c = colors[status];
  return (
    <div className="flex items-center justify-between p-3 rounded-md border text-xs" style={{ background: c.bg, borderColor: c.border }}>
      <div className="flex items-center gap-2">
        <span style={{ color: c.icon }}>{icon}</span>
        <span style={{ color: "var(--texte)" }}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span style={{ color: c.text }}>{detail}</span>
        {status === "ok" && <CheckCircle2 size={12} style={{ color: "#22c55e" }} />}
        {status === "warning" && <AlertTriangle size={12} style={{ color: "#f59e0b" }} />}
        {status === "info" && <XCircle size={12} style={{ color: "#3b82f6" }} />}
      </div>
    </div>
  );
}
