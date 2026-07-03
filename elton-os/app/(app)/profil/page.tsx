"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Plus, Trash2, Save, Briefcase, Award, Edit3, X } from "lucide-react";
import { normalizeCompensationTarget } from "@/lib/cv-render/normalize-compensation";
import {
  getProfile, upsertProfile,
  type ProfileData,
} from "@/lib/actions/profile";
import {
  getExperiences, addExperience, updateExperience, deleteExperience,
  type ExperienceData,
} from "@/lib/actions/experience";
import {
  getSkills, addSkill, updateSkill, deleteSkill,
  type SkillData,
} from "@/lib/actions/skill";
import AIAssistant, { type SuggestionTarget } from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";
interface ExpItem {
  id: string;
  title: string;
  company: string;
  sector: string | null;
  country: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  responsibilities: string | null;
  teamSize: string | null;
  revenue: string | null;
  budget: string | null;
  tools: string | null;
  achievements: string | null;
  profileId: string;
}

interface SkillItem {
  id: string;
  name: string;
  category: string;
  level: string;
  source: string;
  profileId: string;
}

const EMPTY_PROFILE: ProfileData = {
  fullName: "", title: "", summary: "", phone: "", email: "", linkedin: "",
  location: "", photoUrl: "", mobility: "", languages: "", yearsExp: 0, sectors: "",
  functions: "", education: "", certifications: "", remotePreference: "",
  targetSalary: "", constraints: "", preferredTone: "",
  cvDefaultTemplate: "ats_classic", cvIncludePhoto: true, cvIncludeLinkedIn: false, cvAccentColor: "champagne",
};

const EMPTY_EXP: ExperienceData = {
  title: "", company: "", sector: "", country: "", startDate: "", endDate: "",
  description: "", responsibilities: "", teamSize: "", revenue: "", budget: "",
  tools: "", achievements: "",
};

const EMPTY_SKILL: SkillData = {
  name: "", category: "management", level: "confirmé", source: "cv_master",
};

const CATEGORIES_SKILL = ["management", "technique", "business", "langue", "outil", "sectoriel", "autre"];
const LEVELS = ["débutant", "intermédiaire", "confirmé", "expert"];
const LANGUAGES_LIST = ["Français", "Anglais", "Espagnol", "Portugais", "Allemand", "Italien"];
const REMOTE_OPTIONS = ["", "remote", "hybride", "présentiel"];
const TONES = ["", "formel", "direct", "inspirant", "stratégique", "analytique", "relationnel"];

export default function ProfilPage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<ExpItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tab, setTab] = useState<"profil" | "experiences" | "skills">("profil");

  // Form states for add/edit experience
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState<ExperienceData>(EMPTY_EXP);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // Form states for skills
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillForm, setSkillForm] = useState<SkillData>(EMPTY_SKILL);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const [langList, setLangList] = useState<string[]>([]);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const load = useCallback(async () => {
    const p = await getProfile();
    if (p) {
      setProfileId(p.id);
      setProfile({
        fullName: p.fullName, title: p.title, summary: p.summary,
        phone: p.phone || "", email: p.email || "", linkedin: p.linkedin || "",
        location: p.location || "", photoUrl: p.photoUrl || "", mobility: p.mobility || "",
        languages: p.languages || "", yearsExp: p.yearsExp || 0,
        sectors: p.sectors || "", functions: p.functions || "",
        education: p.education || "", certifications: p.certifications || "",
        remotePreference: p.remotePreference || "",
        targetSalary: p.targetSalary || "",
        constraints: p.constraints || "",
        preferredTone: p.preferredTone || "",
        cvDefaultTemplate: (p as Record<string, unknown>).cvDefaultTemplate as string || "ats_classic",
        cvIncludePhoto: ((p as Record<string, unknown>).cvIncludePhoto as boolean) ?? true,
        cvIncludeLinkedIn: ((p as Record<string, unknown>).cvIncludeLinkedIn as boolean) ?? false,
        cvAccentColor: (p as Record<string, unknown>).cvAccentColor as string || "champagne",
      });
      setLangList(p.languages ? JSON.parse(p.languages) : []);
      const exps = await getExperiences(p.id);
      setExperiences(exps as unknown as ExpItem[]);
      const sk = await getSkills(p.id);
      setSkills(sk as unknown as SkillItem[]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    try {
      const data = { ...profile, languages: JSON.stringify(langList) };
      const p = await upsertProfile(data);
      setProfileId(p.id);
      notify("ok", "Profil sauvegardé");
    } catch {
      notify("err", "Erreur lors de la sauvegarde");
    }
  };

  // ─── Experiences ───
  const openNewExp = () => { setExpForm(EMPTY_EXP); setEditingExpId(null); setShowExpForm(true); };
  const openEditExp = (exp: ExpItem) => {
    setExpForm({ title: exp.title, company: exp.company, sector: exp.sector || "", country: exp.country || "", startDate: exp.startDate, endDate: exp.endDate || "", description: exp.description || "", responsibilities: exp.responsibilities || "", teamSize: exp.teamSize || "", revenue: exp.revenue || "", budget: exp.budget || "", tools: exp.tools || "", achievements: exp.achievements || "" });
    setEditingExpId(exp.id);
    setShowExpForm(true);
  };
  const saveExp = async () => {
    if (!profileId || !expForm.title || !expForm.company) return;
    try {
      if (editingExpId) {
        await updateExperience(editingExpId, expForm);
      } else {
        await addExperience(profileId, expForm);
      }
      setShowExpForm(false);
      const exps = await getExperiences(profileId);
      setExperiences(exps as unknown as ExpItem[]);
      notify("ok", "Expérience sauvegardée");
    } catch { notify("err", "Erreur expérience"); }
  };
  const removeExp = async (id: string) => {
    await deleteExperience(id);
    const exps = await getExperiences(profileId!);
    setExperiences(exps as unknown as ExpItem[]);
    notify("ok", "Expérience supprimée");
  };

  // ─── Skills ───
  const openNewSkill = () => { setSkillForm(EMPTY_SKILL); setEditingSkillId(null); setShowSkillForm(true); };
  const openEditSkill = (sk: SkillItem) => {
    setSkillForm({ name: sk.name, category: sk.category, level: sk.level, source: sk.source });
    setEditingSkillId(sk.id);
    setShowSkillForm(true);
  };
  const saveSkill = async () => {
    if (!profileId || !skillForm.name) return;
    try {
      if (editingSkillId) {
        await updateSkill(editingSkillId, skillForm);
      } else {
        await addSkill(profileId, skillForm);
      }
      setShowSkillForm(false);
      const sks = await getSkills(profileId);
      setSkills(sks as unknown as SkillItem[]);
      notify("ok", "Compétence sauvegardée");
    } catch { notify("err", "Erreur compétence"); }
  };
  const removeSkill = async (id: string) => {
    await deleteSkill(id);
    const sks = await getSkills(profileId!);
    setSkills(sks as unknown as SkillItem[]);
    notify("ok", "Compétence supprimée");
  };

  const toggleLang = (lang: string) => {
    setLangList(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const handleAISuggestion = (target: SuggestionTarget, item: SuggestionItem) => {
    if (target === "skills") {
      setSkillForm({ name: item.name, category: item.category || "management", level: item.level || "confirmé", source: "cv_master" });
      setShowSkillForm(true);
    } else if (target === "languages") {
      const langName = item.name.split("(")[0].trim();
      if (!langList.includes(langName)) {
        setLangList(prev => [...prev, langName]);
      }
    } else if (target === "education") {
      setProfile(prev => {
        const existing = prev.education ? JSON.parse(prev.education || "[]") : [];
        existing.push(item.name);
        return { ...prev, education: JSON.stringify(existing) };
      });
    } else if (target === "certifications") {
      setProfile(prev => {
        const existing = prev.certifications ? JSON.parse(prev.certifications || "[]") : [];
        existing.push(item.name);
        return { ...prev, certifications: JSON.stringify(existing) };
      });
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-md border transition-colors";
  const inputStyle = { background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" };
  const labelStyle = { color: "var(--texte-secondaire)", fontSize: "0.7rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: "4px", display: "block" as const };

  return (
    <>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>Profil Cabinet</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {profileId ? "Gérez votre cabinet" : "Créez votre cabinet"}
          </p>
        </div>
        <button onClick={saveProfile}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
          style={{ background: "var(--or)", color: "var(--fond)", borderColor: "var(--or)" }}>
          <Save size={14} /> Sauvegarder
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "var(--succes)" : "var(--erreur)" }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--bordure)" }}>
        {([
          ["profil", User, "Profil"],
          ["experiences", Briefcase, "Expériences"],
          ["skills", Award, "Compétences"],
        ] as const).map(([key, Icon, label]) => (
          <button key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors"
            style={{ color: tab === key ? "var(--or)" : "var(--texte-tertiaire)", borderBottom: tab === key ? "2px solid var(--or)" : "2px solid transparent", marginBottom: -1 }}
          >
            <Icon size={13} /> {label}
            {key === "experiences" && <span style={{ color: "var(--texte-tertiaire)" }}>({experiences.length})</span>}
            {key === "skills" && <span style={{ color: "var(--texte-tertiaire)" }}>({skills.length})</span>}
          </button>
        ))}
      </div>

      {/* ─── TAB PROFIL ─── */}
      {tab === "profil" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Identité */}
          <div className="md:col-span-2 p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Identité</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nom complet" value={profile.fullName} onChange={v => setProfile({ ...profile, fullName: v })} inputClass={inputClass} inputStyle={inputStyle} />
              <Field label="Email" value={profile.email} onChange={v => setProfile({ ...profile, email: v })} inputClass={inputClass} inputStyle={inputStyle} />
              <Field label="Téléphone" value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} inputClass={inputClass} inputStyle={inputStyle} />
              <div>
                <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--texte-tertiaire)" }}>Photo de profil</label>
                <div className="flex items-center gap-3">
                  {profile.photoUrl && <img src={profile.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--or)" }} />}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setProfile({ ...profile, photoUrl: reader.result as string });
                    reader.readAsDataURL(file);
                  }} className="text-xs" style={{ color: "var(--texte-secondaire)" }} />
                  {profile.photoUrl && (
                    <button onClick={() => setProfile({ ...profile, photoUrl: "" })} className="text-xs" style={{ color: "#ef4444" }}>Supprimer</button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="LinkedIn URL" value={profile.linkedin} onChange={v => setProfile({ ...profile, linkedin: v })} inputClass={inputClass} inputStyle={inputStyle} />
              <Field label="Localisation" value={profile.location} onChange={v => setProfile({ ...profile, location: v })} inputClass={inputClass} inputStyle={inputStyle} />
            </div>
          </div>

          {/* Ciblage */}
          <div className="md:col-span-2 p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Ciblage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Poste cible principal" value={profile.title} onChange={v => setProfile({ ...profile, title: v })} inputClass={inputClass} inputStyle={inputStyle} />
              <Field label="Années d'expérience" type="number" value={String(profile.yearsExp)} onChange={v => setProfile({ ...profile, yearsExp: Number(v) || 0 })} inputClass={inputClass} inputStyle={inputStyle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChipField label="Rôles ciblés" items={safeParseList(profile.functions)} onChange={items => setProfile({ ...profile, functions: JSON.stringify(items) })} placeholder="Ajouter un rôle…" />
              <ChipField label="Secteurs ciblés" items={safeParseList(profile.sectors)} onChange={items => setProfile({ ...profile, sectors: JSON.stringify(items) })} placeholder="Ajouter un secteur…" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChipField label="Mobilité (pays)" items={safeParseList(profile.mobility)} onChange={items => setProfile({ ...profile, mobility: JSON.stringify(items) })} placeholder="Ajouter un pays…" />
              <div>
                <Field label="Rémunération cible" value={profile.targetSalary} onChange={v => setProfile({ ...profile, targetSalary: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="ex: 120-180K€ + variable 30%" />
                {profile.targetSalary && (() => { const n = normalizeCompensationTarget(profile.targetSalary); return !n.isValid ? <p className="text-[10px] mt-1" style={{ color: "#f59e0b" }}>⚠ {n.warning}</p> : null; })()}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Langues parlées</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES_LIST.map(lang => (
                  <button key={lang} onClick={() => toggleLang(lang)}
                    className="px-3 py-1.5 rounded-md text-xs font-mono border transition-colors"
                    style={{
                      background: langList.includes(lang) ? "var(--or-faible)" : "var(--fond)",
                      borderColor: langList.includes(lang) ? "var(--or)" : "var(--bordure)",
                      color: langList.includes(lang) ? "var(--or)" : "var(--texte-secondaire)",
                    }}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label style={labelStyle}>Préférence remote</label>
                <select value={profile.remotePreference} onChange={e => setProfile({ ...profile, remotePreference: e.target.value })}
                  className={inputClass} style={inputStyle}>
                  {REMOTE_OPTIONS.map(o => <option key={o} value={o}>{o || "Non défini"}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ton préféré</label>
                <select value={profile.preferredTone} onChange={e => setProfile({ ...profile, preferredTone: e.target.value })}
                  className={inputClass} style={inputStyle}>
                  {TONES.map(o => <option key={o} value={o}>{o || "Non défini"}</option>)}
                </select>
              </div>
              <Field label="Contraintes" value={profile.constraints} onChange={v => setProfile({ ...profile, constraints: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="ex: Pas de relocalisation" />
            </div>
          </div>

          {/* Résumé + Formation */}
          <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Résumé Cabinet</h3>
            <textarea value={profile.summary}
              onChange={e => setProfile({ ...profile, summary: e.target.value })}
              rows={5} className={inputClass} style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Rédigez un résumé cabinet percutant..." />
          </div>
          <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Formation & Certifications</h3>
            <Field label="Formation (JSON)" value={profile.education} onChange={v => setProfile({ ...profile, education: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder='[{"diplome":"Master","ecole":"HEC","annee":2010}]' type="text" textarea />
            <Field label="Certifications (JSON)" value={profile.certifications} onChange={v => setProfile({ ...profile, certifications: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder='["PMP", "Six Sigma Black Belt"]' type="text" />
          </div>
        </div>
      )}

      {/* ─── TAB EXPERIENCES ─── */}
      {tab === "experiences" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{experiences.length} expérience(s)</span>
            <button onClick={openNewExp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", color: "var(--or)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
              <Plus size={13} /> Ajouter
            </button>
          </div>

          {showExpForm && (
            <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                {editingExpId ? "Modifier l'expérience" : "Nouvelle expérience"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Poste *" value={expForm.title} onChange={v => setExpForm({ ...expForm, title: v })} inputClass={inputClass} inputStyle={inputStyle} />
                <Field label="Entreprise *" value={expForm.company} onChange={v => setExpForm({ ...expForm, company: v })} inputClass={inputClass} inputStyle={inputStyle} />
                <Field label="Secteur" value={expForm.sector} onChange={v => setExpForm({ ...expForm, sector: v })} inputClass={inputClass} inputStyle={inputStyle} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Pays" value={expForm.country} onChange={v => setExpForm({ ...expForm, country: v })} inputClass={inputClass} inputStyle={inputStyle} />
                <Field label="Début (YYYY-MM)" value={expForm.startDate} onChange={v => setExpForm({ ...expForm, startDate: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="2020-01" />
                <Field label="Fin (vide = actuel)" value={expForm.endDate} onChange={v => setExpForm({ ...expForm, endDate: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="2024-06" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Taille d'équipe" value={expForm.teamSize} onChange={v => setExpForm({ ...expForm, teamSize: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="5-15" />
                <Field label="CA / Fourchette" value={expForm.revenue} onChange={v => setExpForm({ ...expForm, revenue: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="ex: +32% ou 5-10M€" />
                <Field label="Budget / P&L" value={expForm.budget} onChange={v => setExpForm({ ...expForm, budget: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder="ex: 2M€ P&L" />
              </div>
              <Field label="Description" value={expForm.description} onChange={v => setExpForm({ ...expForm, description: v })} inputClass={inputClass} inputStyle={inputStyle} textarea />
              <Field label="Responsabilités" value={expForm.responsibilities} onChange={v => setExpForm({ ...expForm, responsibilities: v })} inputClass={inputClass} inputStyle={inputStyle} textarea />
              <Field label="Outils utilisés (JSON)" value={expForm.tools} onChange={v => setExpForm({ ...expForm, tools: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder='["Salesforce", "HubSpot"]' />
              <Field label="Réalisations clés (JSON)" value={expForm.achievements} onChange={v => setExpForm({ ...expForm, achievements: v })} inputClass={inputClass} inputStyle={inputStyle} placeholder='["+45% CA en 18 mois", "Ouverture 3 pays"]' />
              <div className="flex gap-2">
                <button onClick={saveExp}
                  className="px-4 py-2 text-xs font-mono rounded-md" style={{ background: "var(--or)", color: "var(--fond)" }}>
                  {editingExpId ? "Modifier" : "Ajouter"}
                </button>
                <button onClick={() => setShowExpForm(false)}
                  className="px-4 py-2 text-xs font-mono rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {experiences.map(exp => (
            <div key={exp.id as string} className="p-4 rounded-lg border flex items-start justify-between group" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
              <div className="space-y-1">
                <div className="font-medium text-sm" style={{ color: "var(--texte)" }}>{exp.title} — {exp.company}</div>
                <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                  {exp.startDate} → {exp.endDate || "Aujourd'hui"}
                  {exp.sector ? ` · ${exp.sector}` : ""}
                  {exp.country ? ` · ${exp.country}` : ""}
                  {exp.teamSize ? ` · Équipe: ${exp.teamSize}` : ""}
                </div>
                {exp.description && <div className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>{exp.description.slice(0, 200)}{exp.description.length > 200 ? "..." : ""}</div>}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditExp(exp)} className="p-1.5 rounded" style={{ color: "var(--texte-secondaire)" }}><Edit3 size={13} /></button>
                <button onClick={() => removeExp(exp.id)} className="p-1.5 rounded" style={{ color: "var(--erreur)" }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB SKILLS ─── */}
      {tab === "skills" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{skills.length} compétence(s)</span>
            <button onClick={openNewSkill}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)", color: "var(--or)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
              <Plus size={13} /> Ajouter
            </button>
          </div>

          {showSkillForm && (
            <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
              <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>
                {editingSkillId ? "Modifier la compétence" : "Nouvelle compétence"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Field label="Nom *" value={skillForm.name} onChange={v => setSkillForm({ ...skillForm, name: v })} inputClass={inputClass} inputStyle={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Catégorie</label>
                  <select value={skillForm.category} onChange={e => setSkillForm({ ...skillForm, category: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    {CATEGORIES_SKILL.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Niveau</label>
                  <select value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}
                    className={inputClass} style={inputStyle}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Source</label>
                <select value={skillForm.source} onChange={e => setSkillForm({ ...skillForm, source: e.target.value })}
                  className={inputClass} style={{ ...inputStyle, maxWidth: 200 }}>
                  <option value="cv_master">CV Maître</option>
                  <option value="proof_vault">Proof Vault</option>
                  <option value="manuel">Manuel</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={saveSkill}
                  className="px-4 py-2 text-xs font-mono rounded-md" style={{ background: "var(--or)", color: "var(--fond)" }}>
                  {editingSkillId ? "Modifier" : "Ajouter"}
                </button>
                <button onClick={() => setShowSkillForm(false)}
                  className="px-4 py-2 text-xs font-mono rounded-md border" style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {["management", "technique", "business", "langue", "outil", "sectoriel", "autre"].map(cat => {
            const catSkills = skills.filter((s: SkillItem) => s.category === cat);
            if (!catSkills.length) return null;
            return (
              <div key={cat}>
                <div className="text-xs font-mono uppercase tracking-wider mb-2" style={{ color: "var(--texte-tertiaire)" }}>{cat}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {catSkills.map((sk: SkillItem) => (
                    <div key={sk.id} className="p-3 rounded-md border flex items-center justify-between group" style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)" }}>
                      <div>
                        <span className="text-sm" style={{ color: "var(--texte)" }}>{sk.name}</span>
                        <span className="ml-2 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>{sk.level}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditSkill(sk)} className="p-1 rounded" style={{ color: "var(--texte-secondaire)" }}><Edit3 size={11} /></button>
                        <button onClick={() => removeSkill(sk.id)} className="p-1 rounded" style={{ color: "var(--erreur)" }}><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Préférences CV */}
    <div className="md:col-span-2 p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
      <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Préférences CV</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--texte-tertiaire)" }}>Modèle par défaut</label>
          <select value={profile.cvDefaultTemplate} onChange={v => setProfile({ ...profile, cvDefaultTemplate: v.target.value })}
            className={inputClass} style={inputStyle}>
            <option value="ats_classic">ATS Classique</option>
            <option value="modern_executive">Moderne Cabinet</option>
            <option value="premium_leadership">Premium Leadership</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono mb-1.5" style={{ color: "var(--texte-tertiaire)" }}>Couleur d&apos;accent</label>
          <select value={profile.cvAccentColor} onChange={v => setProfile({ ...profile, cvAccentColor: v.target.value })}
            className={inputClass} style={inputStyle}>
            <option value="champagne">Champagne</option>
            <option value="navy">Bleu nuit</option>
            <option value="graphite">Graphite</option>
            <option value="burgundy">Bordeaux</option>
            <option value="emerald">Vert exécutif</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="cvIncludePhoto" checked={profile.cvIncludePhoto}
            onChange={e => setProfile({ ...profile, cvIncludePhoto: e.target.checked })} />
          <label htmlFor="cvIncludePhoto" className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Afficher la photo sur le CV</label>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="cvIncludeLinkedIn" checked={profile.cvIncludeLinkedIn}
            onChange={e => setProfile({ ...profile, cvIncludeLinkedIn: e.target.checked })} />
          <label htmlFor="cvIncludeLinkedIn" className="text-xs" style={{ color: "var(--texte-secondaire)" }}>Afficher LinkedIn sur le CV</label>
        </div>
      </div>
      <p className="text-[10px] font-mono" style={{ color: "var(--texte-tertiaire)" }}>
        LinkedIn est désactivé par défaut. Activez-le uniquement si vous souhaitez le voir apparaître sur vos CV.
      </p>
    </div>
    <AIAssistant profileId={profileId || ""} onApply={handleAISuggestion} />
    </>
  );
}

/* ─── Helpers ────────────────────────────── */

function safeParseList(raw: string): string[] {
  if (!raw) return [];
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr.filter(Boolean).map(String) : []; } catch { return raw.split(",").map(s => s.trim()).filter(Boolean); }
}

/* ─── Composant Field réutilisable ─── */
function Field({ label, value, onChange, inputClass, inputStyle, placeholder, type = "text", textarea }: {
  label: string; value: string; onChange: (v: string) => void; inputClass: string;
  inputStyle: Record<string, string>; placeholder?: string; type?: string; textarea?: boolean;
}) {
  const labelStyle = { color: "var(--texte-secondaire)", fontSize: "0.67rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: "4px", display: "block" as const };
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={inputClass}
          style={{ ...inputStyle, resize: "vertical" }} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputClass}
          style={inputStyle} placeholder={placeholder} />
      )}
    </div>
  );
}

/* ─── Composant ChipField ────────────────── */

function ChipField({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const val = input.trim();
    if (!val) return;
    if (!items.includes(val)) onChange([...items, val]);
    setInput("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label style={{ color: "var(--texte-secondaire)", fontSize: "0.67rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.15em", marginBottom: "4px", display: "block" }}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2" style={{ minHeight: 28 }}>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono"
            style={{ background: "var(--or-faible)", color: "var(--or)", border: "1px solid var(--or)" }}>
            {item}
            <button onClick={() => removeItem(i)} style={{ color: "var(--or)", cursor: "pointer", background: "none", border: "none", padding: 0, fontSize: 12, lineHeight: 1 }}><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          placeholder={placeholder}
          className="flex-1 px-2 py-1.5 rounded text-xs font-mono border"
          style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)", outline: "none" }} />
        <button onClick={addItem} className="px-2 py-1 rounded text-xs font-mono border"
          style={{ borderColor: "var(--or)", color: "var(--or)", background: "transparent" }}>+</button>
      </div>
    </div>
  );
}
