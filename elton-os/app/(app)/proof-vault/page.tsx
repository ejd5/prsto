"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Shield, Plus, Trash2, Edit3, Lock, EyeOff, FileText, MessageSquare, Bot, Link } from "lucide-react";
import { getProfile } from "@/lib/actions/profile";
import { getExperiences } from "@/lib/actions/experience";
import {
  getProofEntries, addProofEntry, updateProofEntry, deleteProofEntry,
  type ProofEntryData,
} from "@/lib/actions/proof-entry";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface ProofEntryItem {
  id: string; category: string; title: string; value: string; context: string | null;
  period: string | null; confidence: string | null; verifiable: boolean;
  isConfidential: boolean; usableForCV: boolean; usableForLetter: boolean; sendableToAI: boolean;
  documentUrl: string | null; experienceId: string | null;
  experience: { id: string; title: string; company: string; } | null;
}

interface ExperienceRef { id: string; title: string; company: string; }

interface ProfileRef { id: string; }

const CATEGORIES = [
  "CA", "croissance", "équipe", "budget", "P&L",
  "ouverture_marché", "négociation", "transformation_commerciale",
  "CRM", "langues", "international", "management",
  "secteur", "formation", "certification", "autre",
];

const CONFIDENCE_LEVELS = ["faible", "moyen", "fort"];

const EMPTY_PROOF: ProofEntryData = {
  category: "CA", title: "", value: "", context: "", period: "",
  confidence: "moyen", verifiable: false,
  isConfidential: false, usableForCV: true, usableForLetter: true,
  sendableToAI: true, documentUrl: "", experienceId: "",
};

export default function ProofVaultPage() {
  const [profile, setProfile] = useState<ProfileRef | null>(null);
  const [entries, setEntries] = useState<ProofEntryItem[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRef[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProofEntryData>(EMPTY_PROOF);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [embedStats, setEmbedStats] = useState<{ total: number; byType: Record<string, number> } | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const loadStats = async () => {
    try {
      const r = await fetch("/api/embeddings/index");
      const d = await r.json();
      if (d.success) setEmbedStats({ total: d.total, byType: d.byType });
    } catch {}
  };

  const reindex = async () => {
    setReindexing(true);
    try {
      const r = await fetch("/api/embeddings/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "index_proofs" }),
      });
      const d = await r.json();
      if (d.success) {
        notify("ok", d.message || "Indexation réussie");
        loadStats();
      } else {
        notify("err", d.error || "Erreur d'indexation");
      }
    } catch (e) {
      notify("err", "Erreur réseau");
    } finally {
      setReindexing(false);
    }
  };

  const load = useCallback(async () => {
    const p = await getProfile();
    setProfile(p as unknown as ProfileRef | null);
    if (p) {
      const e = await getProofEntries(p.id);
      setEntries(e as unknown as ProofEntryItem[]);
      const exps = await getExperiences(p.id);
      setExperiences(exps as unknown as ExperienceRef[]);
    }
  }, []);

  useEffect(() => { load(); loadStats(); }, [load]);

  const openNew = () => { setForm(EMPTY_PROOF); setEditingId(null); setShowForm(true); };
  const openEdit = (entry: ProofEntryItem) => {
    setForm({
      category: entry.category, title: entry.title, value: entry.value,
      context: entry.context || "", period: entry.period || "",
      confidence: entry.confidence || "moyen", verifiable: entry.verifiable,
      isConfidential: entry.isConfidential, usableForCV: entry.usableForCV,
      usableForLetter: entry.usableForLetter, sendableToAI: entry.sendableToAI,
      documentUrl: entry.documentUrl || "", experienceId: entry.experienceId || "",
    });
    setEditingId(entry.id); setShowForm(true);
  };
  const save = async () => {
    if (!profile || !form.title || !form.value) return;
    try {
      if (editingId) {
        await updateProofEntry(editingId, form);
      } else {
        await addProofEntry(profile.id, form);
      }
      setShowForm(false);
      const e = await getProofEntries(profile.id);
      setEntries(e);
      notify("ok", "Preuve sauvegardée");
    } catch { notify("err", "Erreur"); }
  };
  const remove = async (id: string) => {
    if (!profile) return;
    await deleteProofEntry(id);
    const e = await getProofEntries(profile.id);
    setEntries(e);
    notify("ok", "Preuve supprimée");
  };

  const handleAISuggestion = (_target: string, item: SuggestionItem) => {
    const proofData = item as SuggestionItem & { value?: string; context?: string; category?: string };
    setForm({
      category: proofData.category || "CA",
      title: item.name,
      value: proofData.value || item.name,
      context: proofData.context || "",
      period: "",
      confidence: item.confidence >= 70 ? "fort" : item.confidence >= 40 ? "moyen" : "faible",
      verifiable: item.confidence >= 50,
      isConfidential: false,
      usableForCV: true,
      usableForLetter: true,
      sendableToAI: true,
      documentUrl: "",
      experienceId: "",
    });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    notify("ok", `Preuve suggérée : ${item.name} — vérifiez et sauvegardez`);
  };

  const filtered = filterCat ? entries.filter((e: ProofEntryItem) => e.category === filterCat) : entries;

  const inputClass = "w-full px-3 py-2 text-sm rounded-md border";
  const inputStyle = { background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" };
  const labelStyle = { color: "var(--texte-secondaire)", fontSize: "0.67rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: "4px", display: "block" as const };
  const checkboxLabel = { color: "var(--texte-secondaire)", fontSize: "0.75rem" };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Proof Vault</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {entries.length} preuve(s) — source de vérité pour toutes les affirmations
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-2">
            {embedStats && embedStats.byType.proof_entry > 0 && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-md border"
                style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}
                title={`${embedStats.total} embeddings au total`}>
                IA: {embedStats.byType.proof_entry || 0} preuve(s) indexée(s)
              </span>
            )}
            <button onClick={reindex} disabled={reindexing}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)", opacity: reindexing ? 0.5 : 1 }}
              onMouseEnter={e => { if (!reindexing) { e.currentTarget.style.borderColor = "var(--or)"; e.currentTarget.style.color = "var(--or)"; } }}
              onMouseLeave={e => { if (!reindexing) { e.currentTarget.style.borderColor = "var(--bordure)"; e.currentTarget.style.color = "var(--texte-secondaire)"; } }}>
              <RefreshCw size={12} className={reindexing ? "animate-spin" : ""} /> {reindexing ? "Indexation..." : "Réindexer IA"}
            </button>
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
              style={{ background: "var(--or)", color: "var(--fond)", borderColor: "var(--or)" }}>
              <Plus size={14} /> Ajouter une preuve
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {!profile && (
        <div className="p-5 rounded-lg border text-center" style={{ background: "var(--fond-surface)", borderColor: "var(--avertissement)" }}>
          <Shield size={20} style={{ color: "var(--avertissement)" }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>Créez d&apos;abord votre profil exécutif.</p>
        </div>
      )}

      {/* Filtres */}
      {profile && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCat("")}
            className="px-3 py-1 rounded-full text-xs font-mono border transition-colors"
            style={{ background: !filterCat ? "var(--or-faible)" : "var(--fond)", borderColor: !filterCat ? "var(--or)" : "var(--bordure)", color: !filterCat ? "var(--or)" : "var(--texte-secondaire)" }}>
            Tous ({entries.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = entries.filter((e: ProofEntryItem) => e.category === cat).length;
            if (!count) return null;
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className="px-3 py-1 rounded-full text-xs font-mono border transition-colors"
                style={{ background: filterCat === cat ? "var(--or-faible)" : "var(--fond)", borderColor: filterCat === cat ? "var(--or)" : "var(--bordure)", color: filterCat === cat ? "var(--or)" : "var(--texte-secondaire)" }}>
                {cat.replace(/_/g, " ")} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
            {editingId ? "Modifier la preuve" : "Nouvelle preuve"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Catégorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className={inputClass} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Titre *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className={inputClass} style={inputStyle} placeholder="ex: Croissance CA 2023" />
            </div>
            <div>
              <label style={labelStyle}>Valeur / Chiffre *</label>
              <input type="text" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                className={inputClass} style={inputStyle} placeholder="ex: +32% CA, 25 personnes" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Période</label>
              <input type="text" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                className={inputClass} style={inputStyle} placeholder="2022-2023" />
            </div>
            <div>
              <label style={labelStyle}>Niveau de confiance</label>
              <select value={form.confidence} onChange={e => setForm({ ...form, confidence: e.target.value })}
                className={inputClass} style={inputStyle}>
                {CONFIDENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Liée à une expérience</label>
              <select value={form.experienceId} onChange={e => setForm({ ...form, experienceId: e.target.value })}
                className={inputClass} style={inputStyle}>
                <option value="">Aucune</option>
                {experiences.map((exp: ExperienceRef) => (
                  <option key={exp.id} value={exp.id}>{exp.title} — {exp.company}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Contexte</label>
            <textarea value={form.context} onChange={e => setForm({ ...form, context: e.target.value })}
              rows={2} className={inputClass} style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Entreprise, circonstances, équipe..." />
          </div>
          <div>
            <label style={labelStyle}>URL document justificatif</label>
            <input type="text" value={form.documentUrl} onChange={e => setForm({ ...form, documentUrl: e.target.value })}
              className={inputClass} style={inputStyle} placeholder="https://..." />
          </div>

          {/* Permissions */}
          <div className="p-3 rounded-md space-y-1" style={{ background: "var(--fond)" }}>
            <label className="text-xs font-mono uppercase tracking-wider mb-2 block" style={{ color: "var(--texte-tertiaire)" }}>
              Permissions d&apos;utilisation
            </label>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.verifiable} onChange={e => setForm({ ...form, verifiable: e.target.checked })} />
                <span style={checkboxLabel}>Vérifiable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isConfidential} onChange={e => setForm({ ...form, isConfidential: e.target.checked })} />
                <span className="flex items-center gap-1" style={checkboxLabel}><Lock size={10} /> Confidentiel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.usableForCV} onChange={e => setForm({ ...form, usableForCV: e.target.checked })} />
                <span className="flex items-center gap-1" style={checkboxLabel}><FileText size={10} /> Utilisable CV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.usableForLetter} onChange={e => setForm({ ...form, usableForLetter: e.target.checked })} />
                <span className="flex items-center gap-1" style={checkboxLabel}><MessageSquare size={10} /> Utilisable lettre</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.sendableToAI} onChange={e => setForm({ ...form, sendableToAI: e.target.checked })} />
                <span className="flex items-center gap-1" style={checkboxLabel}><Bot size={10} /> Envoyable IA</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={save}
              className="px-4 py-2 text-xs font-mono rounded-md" style={{ background: "var(--or)", color: "var(--fond)" }}>
              {editingId ? "Modifier" : "Ajouter"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-mono rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des preuves */}
      <div className="space-y-3">
        {filtered.length === 0 && profile && (
          <div className="p-12 rounded-lg border text-center" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <Shield size={24} style={{ color: "var(--texte-tertiaire)" }} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm" style={{ color: "var(--texte-tertiaire)" }}>Aucune preuve. Ajoutez votre première preuve.</p>
          </div>
        )}

        {filtered.map((entry: ProofEntryItem) => (
          <div key={entry.id} className="p-4 rounded-lg border flex items-start justify-between group" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                  {entry.category.replace(/_/g, " ")}
                </span>
                <span className="font-medium text-sm" style={{ color: "var(--texte)" }}>{entry.title}</span>
                <span className="text-sm font-bold" style={{ color: "var(--or)" }}>{entry.value}</span>
                {entry.confidence && (
                  <span className="text-xs font-mono" style={{ color: entry.confidence === "fort" ? "var(--succes)" : entry.confidence === "faible" ? "var(--avertissement)" : "var(--texte-tertiaire)" }}>
                    {entry.confidence === "fort" ? "🛡️" : entry.confidence === "faible" ? "⚠️" : "•"} {entry.confidence}
                  </span>
                )}
                {entry.isConfidential && <Lock size={11} style={{ color: "var(--erreur)" }} />}
              </div>
              {entry.context && <div className="text-xs" style={{ color: "var(--texte-secondaire)" }}>{entry.context}</div>}
              <div className="flex items-center gap-3 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                {entry.period && <span>{entry.period}</span>}
                {entry.experience && (
                  <span className="flex items-center gap-1"><Link size={10} /> {entry.experience.title} — {entry.experience.company}</span>
                )}
                <span className="flex items-center gap-1">
                  {entry.usableForCV ? <FileText size={10} style={{ color: "var(--succes)" }} /> : <EyeOff size={10} />}
                  {entry.usableForLetter ? <MessageSquare size={10} style={{ color: "var(--succes)" }} /> : <EyeOff size={10} />}
                  {entry.sendableToAI ? <Bot size={10} style={{ color: "var(--succes)" }} /> : <EyeOff size={10} />}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(entry)} className="p-1.5 rounded" style={{ color: "var(--texte-secondaire)" }}><Edit3 size={13} /></button>
              <button onClick={() => remove(entry.id)} className="p-1.5 rounded" style={{ color: "var(--erreur)" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
      {profile && <AIAssistant profileId={profile.id} onApply={handleAISuggestion} />}
    </div>
  );
}
