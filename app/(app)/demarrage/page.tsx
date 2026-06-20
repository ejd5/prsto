"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  User,
  Target,
  Briefcase,
  Wrench,
  FileText,
  Shield,
  Search,
  Cpu,
  Award,
  Save,
  Play,
  ArrowRight,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Download,
} from "lucide-react";
import { getOnboardingState, saveOnboardingStep, getOnboardingStep } from "@/lib/actions/onboarding";
import { upsertProfile } from "@/lib/actions/profile";
import { addExperience, updateExperience, deleteExperience } from "@/lib/actions/experience";
import { previewExperiencesFromMasterResume, importSelectedExperiences } from "@/lib/actions/resume-import";
import { getSuggestions } from "@/lib/ai/suggestions";
import type { ExtractedExperience } from "@/lib/resume/experience-extractor";
import type { SuggestionItem } from "@/lib/ai/suggestions";
import { addSkill, deleteSkill } from "@/lib/actions/skill";
import { addProofEntry, updateProofEntry, deleteProofEntry } from "@/lib/actions/proof-entry";
import { upsertCVMaster } from "@/lib/actions/cv-master";
import { addJobSource, toggleJobSource } from "@/lib/actions/job-source";
import { updateSettings, testConnection } from "@/lib/actions/settings";
import type { AgentReadinessResult } from "@/lib/onboarding/readiness";
import { SECTION_ORDER } from "@/lib/onboarding/readiness";

const STEPS = [
  { id: 1, label: "Bienvenue", icon: Sparkles },
  { id: 2, label: "Identité", icon: User },
  { id: 3, label: "Ciblage", icon: Target },
  { id: 4, label: "Expériences", icon: Briefcase },
  { id: 5, label: "Compétences", icon: Wrench },
  { id: 6, label: "CV Maître", icon: FileText },
  { id: 7, label: "Proof Vault", icon: Shield },
  { id: 8, label: "Sources", icon: Search },
  { id: 9, label: "IA", icon: Cpu },
  { id: 10, label: "Résumé", icon: Award },
];

// Mapping ?section= → step number
const SECTION_TO_STEP: Record<string, number> = {
  identity: 2,
  targeting: 3,
  experience: 4,
  experiences: 4,
  skills: 5,
  cv: 6,
  cvMaster: 6,
  proof: 7,
  proofVault: 7,
  sources: 8,
  ai: 9,
  ia: 9,
  summary: 10,
};

const CATEGORIES = [
  "CA", "croissance", "équipe", "budget", "P&L", "ouverture_marché",
  "négociation", "transformation_commerciale", "CRM", "langues",
  "international", "management", "secteur", "formation", "certification", "autre",
];

const SKILL_CATEGORIES = ["technique", "management", "business", "langue", "outil"];

interface ExpItem { id: string; company: string; title: string; startDate: string; endDate: string; description: string; teamSize: string; revenue: string; budget: string; sector: string; country: string; }
interface SkillItem { id: string; name: string; category: string; level: string; source: string; }
interface ProofItem { id: string; category: string; title: string; value: string; context: string; period: string; confidence: string; verifiable: boolean; }
interface SourceItem { id: string; name: string; url: string; region: string; type: string; priority: number; active: boolean; }
interface CvMasterItem { id: string; fileName: string; originalText: string; status: string; }
interface ProfileData { id: string; fullName: string; title: string; email: string; phone: string; linkedin: string; location: string; photoUrl: string; mobility: string; summary: string; languages: string; education: string; certifications: string; yearsExp: number; sectors: string; functions: string; remotePreference: string; targetSalary: string; constraints: string; preferredTone: string; cvDefaultTemplate: string; cvIncludePhoto: boolean; cvIncludeLinkedIn: boolean; cvAccentColor: string; }

export default function DemarragePage({ searchParams }: { searchParams?: Promise<{ section?: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [readiness, setReadiness] = useState<AgentReadinessResult | null>(null);

  // Data
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [expList, setExpList] = useState<ExpItem[]>([]);
  const [skillList, setSkillList] = useState<SkillItem[]>([]);
  const [proofList, setProofList] = useState<ProofItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [cvMaster, setCvMaster] = useState<CvMasterItem | null>(null);
  const [profileId, setProfileId] = useState<string>("");

  // Form state
  const [identityForm, setIdentityForm] = useState({ fullName: "", title: "", email: "", phone: "", linkedin: "", location: "", mobility: "", summary: "" });
  const [targetingForm, setTargetingForm] = useState({ sectors: "", functions: "", yearsExp: 0, remotePreference: "", targetSalary: "" });
  const [expForm, setExpForm] = useState({ company: "", title: "", startDate: "", endDate: "", description: "", teamSize: "", revenue: "", budget: "", sector: "", country: "" });
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState({ name: "", category: "technique", level: "confirmé" });
  const [langForm, setLangForm] = useState("");
  const [eduForm, setEduForm] = useState("");
  const [certForm, setCertForm] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [proofForm, setProofForm] = useState({ category: "CA", title: "", value: "", context: "", period: "", confidence: "moyen", verifiable: false });
  const [editingProofId, setEditingProofId] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState({ name: "", url: "", region: "FR", type: "job_board", priority: 0 });
  const [iaMode, setIaMode] = useState("local");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionTarget, setSuggestionTarget] = useState<string>("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleSuggest = async (target: "skills" | "languages" | "education" | "certifications") => {
    if (!profileId) return;
    setSuggestionLoading(true);
    setSuggestionTarget(target);
    setSuggestionError(null);
    try {
      const result = await getSuggestions(profileId, target);
      setSuggestions(result.suggestions);
      if (result.source === "no_key") {
        setSuggestionError("DeepSeek non configuré — suggestions basées sur votre profil et CV.");
      }
    } catch {
      setSuggestions([]);
      setSuggestionError("Erreur lors de la génération des suggestions.");
    }
    setSuggestionLoading(false);
  };

  const applySuggestion = (item: SuggestionItem) => {
    if (suggestionTarget === "skills") {
      setSkillForm({ name: item.name, category: item.category || "technique", level: item.level || "confirmé" });
    } else if (suggestionTarget === "languages") {
      setLangForm((prev: string) => {
        const existing = prev ? prev.split(",").map(s => s.trim().replace(/[\[\]"]/g, "")) : [];
        if (!existing.includes(item.name)) {
          existing.push(item.name);
        }
        return `[${existing.join(", ")}]`;
      });
    } else if (suggestionTarget === "education") {
      setEduForm((prev: string) => {
        const existing = prev ? prev.split(",").map(s => s.trim().replace(/[\[\]"]/g, "")) : [];
        if (!existing.includes(item.name)) {
          existing.push(item.name);
        }
        return `[${existing.join(", ")}]`;
      });
    } else if (suggestionTarget === "certifications") {
      setCertForm((prev: string) => {
        const existing = prev ? prev.split(",").map(s => s.trim().replace(/[\[\]"]/g, "")) : [];
        if (!existing.includes(item.name)) {
          existing.push(item.name);
        }
        return `[${existing.join(", ")}]`;
      });
    }
  };

  // Scan & import state
  const [scanningCV, setScanningCV] = useState(false);
  const [scannedExps, setScannedExps] = useState<ExtractedExperience[]>([]);
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
  const [scanError, setScanError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleScan = async () => {
    if (!profileId) return;
    setScanningCV(true);
    setScanError(null);
    setImportDone(false);
    setImportMsg(null);
    const result = await previewExperiencesFromMasterResume(profileId);
    if (result.error) setScanError(result.error);
    setScannedExps(result.experiences);
    setSelectedScanIds(new Set(result.experiences.map((e: ExtractedExperience) => e.id)));
    setScanningCV(false);
  };

  const toggleScanExp = (id: string) => {
    setSelectedScanIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImportExp = async () => {
    if (!profileId) return;
    const toImport = scannedExps.filter((e: ExtractedExperience) => selectedScanIds.has(e.id));
    if (toImport.length === 0) return;
    const result = await importSelectedExperiences(profileId, toImport);
    setImportDone(true);
    setImportMsg(`${result.imported} expérience(s) importée(s) depuis le CV maître.${result.skipped > 0 ? ` ${result.skipped} doublon(s) ignoré(s).` : ""}`);
    setScannedExps([]);
    await loadData();
  };

  const importExpForm = (exp: ExtractedExperience) => ({
    company: exp.company || "",
    title: exp.title || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    description: exp.description,
    teamSize: exp.teamSize || "",
    revenue: exp.revenue || "",
    budget: exp.budget || "",
    sector: exp.sector || "",
    country: exp.country || "",
  });

  const loadData = async () => {
    const data = await getOnboardingState();
    setReadiness(data.readiness);
    if (data.profile) {
      setProfileId(data.profile.id);
      setProfileData({ ...data.profile as ProfileData, constraints: data.profile.constraints || "", preferredTone: data.profile.preferredTone || "", cvDefaultTemplate: (data.profile as Record<string, unknown>).cvDefaultTemplate as string || "ats_classic", cvIncludePhoto: (data.profile as Record<string, unknown>).cvIncludePhoto as boolean ?? true, cvIncludeLinkedIn: (data.profile as Record<string, unknown>).cvIncludeLinkedIn as boolean ?? false, cvAccentColor: (data.profile as Record<string, unknown>).cvAccentColor as string || "champagne" });
      setIdentityForm({
        fullName: data.profile.fullName || "",
        title: data.profile.title || "",
        email: data.profile.email || "",
        phone: data.profile.phone || "",
        linkedin: data.profile.linkedin || "",
        location: data.profile.location || "",
        mobility: data.profile.mobility || "",
        summary: data.profile.summary || "",
      });
      setTargetingForm({
        sectors: data.profile.sectors || "",
        functions: data.profile.functions || "",
        yearsExp: data.profile.yearsExp || 0,
        remotePreference: data.profile.remotePreference || "",
        targetSalary: data.profile.targetSalary || "",
      });
      setLangForm(data.profile.languages || "");
      setEduForm(data.profile.education || "");
      setCertForm(data.profile.certifications || "");
    }
    setExpList(data.experiences || []);
    setSkillList(data.skills || []);
    setProofList(data.proofEntries || []);
    setSources(data.jobSources || []);
    setCvMaster(data.cvMaster);
    if (data.cvMaster) {
      setCvText(data.cvMaster.originalText || "");
      setCvFileName(data.cvMaster.fileName || "");
    }
    if (data.settings) {
      setIaMode(data.settings.confidentialityMode || "local");
      setApiKeyInput(data.settings.apiKey || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    async function load() {
      const data = await getOnboardingState();
      setReadiness(data.readiness);
      if (data.profile) {
        setProfileId(data.profile.id);
        setProfileData({ ...data.profile as ProfileData, constraints: data.profile.constraints || "", preferredTone: data.profile.preferredTone || "", cvDefaultTemplate: (data.profile as Record<string, unknown>).cvDefaultTemplate as string || "ats_classic", cvIncludePhoto: (data.profile as Record<string, unknown>).cvIncludePhoto as boolean ?? true, cvIncludeLinkedIn: (data.profile as Record<string, unknown>).cvIncludeLinkedIn as boolean ?? false, cvAccentColor: (data.profile as Record<string, unknown>).cvAccentColor as string || "champagne" });
        setIdentityForm({
          fullName: data.profile.fullName || "",
          title: data.profile.title || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          linkedin: data.profile.linkedin || "",
          location: data.profile.location || "",
          mobility: data.profile.mobility || "",
          summary: data.profile.summary || "",
        });
        setTargetingForm({
          sectors: data.profile.sectors || "",
          functions: data.profile.functions || "",
          yearsExp: data.profile.yearsExp || 0,
          remotePreference: data.profile.remotePreference || "",
          targetSalary: data.profile.targetSalary || "",
        });
        setLangForm(data.profile.languages || "");
        setEduForm(data.profile.education || "");
        setCertForm(data.profile.certifications || "");
      }
      setExpList(data.experiences || []);
      setSkillList(data.skills || []);
      setProofList(data.proofEntries || []);
      setSources(data.jobSources || []);
      setCvMaster(data.cvMaster);
      if (data.cvMaster) {
        setCvText(data.cvMaster.originalText || "");
        setCvFileName(data.cvMaster.fileName || "");
      }
      if (data.settings) {
        setIaMode(data.settings.confidentialityMode || "local");
        setApiKeyInput(data.settings.apiKey || "");
      }
      setLoading(false);
    }
    load();
    getOnboardingStep().then((cookieStep) => {
      // Si ?section= est dans l'URL, priorité au paramètre d'URL
      searchParams?.then((sp) => {
        const section = sp?.section;
        if (section && SECTION_TO_STEP[section]) {
          setStep(SECTION_TO_STEP[section]);
        } else {
          setStep(cookieStep);
        }
      }).catch(() => {
        setStep(cookieStep);
      });
    });
  }, []);

  const handleStepChange = async (newStep: number) => {
    setStep(newStep);
    await saveOnboardingStep(newStep);
  };

  const saveIdentity = async () => {
    if (!profileData) return;
    setSaving(true);
    await upsertProfile({
      ...profileData,
      fullName: identityForm.fullName,
      title: identityForm.title,
      email: identityForm.email,
      phone: identityForm.phone,
      linkedin: identityForm.linkedin,
      location: identityForm.location,
      mobility: identityForm.mobility,
      summary: identityForm.summary,
      cvDefaultTemplate: profileData?.cvDefaultTemplate || "ats_classic",
      cvIncludePhoto: profileData?.cvIncludePhoto ?? true,
      cvIncludeLinkedIn: profileData?.cvIncludeLinkedIn ?? false,
      cvAccentColor: profileData?.cvAccentColor || "champagne",
    });
    await loadData();
    setSaving(false);
  };

  const saveTargeting = async () => {
    if (!profileData) return;
    setSaving(true);
    await upsertProfile({
      ...profileData,
      fullName: identityForm.fullName,
      title: identityForm.title,
      email: identityForm.email,
      phone: identityForm.phone,
      linkedin: identityForm.linkedin,
      location: identityForm.location,
      mobility: identityForm.mobility,
      summary: identityForm.summary,
      sectors: targetingForm.sectors,
      functions: targetingForm.functions,
      yearsExp: targetingForm.yearsExp,
      remotePreference: targetingForm.remotePreference,
      targetSalary: targetingForm.targetSalary,
    });
    await loadData();
    setSaving(false);
  };

  const addExp = async () => {
    if (!expForm.company || !expForm.title || !expForm.startDate) return;
    setSaving(true);
    if (editingExpId) {
      await updateExperience(editingExpId, { ...expForm, sector: expForm.sector, country: expForm.country, responsibilities: "", tools: "", achievements: "" });
      setEditingExpId(null);
    } else {
      await addExperience(profileId || (await getOrCreateProfile()), { ...expForm, sector: expForm.sector, country: expForm.country, responsibilities: "", tools: "", achievements: "" });
    }
    setExpForm({ company: "", title: "", startDate: "", endDate: "", description: "", teamSize: "", revenue: "", budget: "", sector: "", country: "" });
    await loadData();
    setSaving(false);
  };

  const editExp = (exp: ExpItem) => {
    setEditingExpId(exp.id);
    setExpForm({ company: exp.company, title: exp.title, startDate: exp.startDate, endDate: exp.endDate || "", description: exp.description || "", teamSize: exp.teamSize || "", revenue: exp.revenue || "", budget: exp.budget || "", sector: exp.sector || "", country: exp.country || "" });
  };

  const removeExp = async (id: string) => {
    setSaving(true);
    await deleteExperience(id);
    await loadData();
    setSaving(false);
  };

  const addSkillItem = async () => {
    if (!skillForm.name) return;
    setSaving(true);
    if (!profileId) await getOrCreateProfile();
    const pid = profileId || (await getOrCreateProfile());
    await addSkill(pid, { ...skillForm, source: "manual" });
    setSkillForm({ name: "", category: "technique", level: "confirmé" });
    await loadData();
    setSaving(false);
  };

  const removeSkill = async (id: string) => {
    setSaving(true);
    await deleteSkill(id);
    await loadData();
    setSaving(false);
  };

  const saveSkillsLang = async () => {
    if (!profileData) return;
    setSaving(true);
    const pid = profileId || (await getOrCreateProfile());
    await upsertProfile({
      ...profileData,
      fullName: identityForm.fullName,
      title: identityForm.title,
      email: identityForm.email,
      phone: identityForm.phone,
      linkedin: identityForm.linkedin,
      location: identityForm.location,
      mobility: identityForm.mobility,
      summary: identityForm.summary,
      languages: langForm,
      education: eduForm,
      certifications: certForm,
    });
    setProfileId(pid);
    await loadData();
    setSaving(false);
  };

  const saveCv = async () => {
    if (!cvText.trim()) return;
    setSaving(true);
    const pid = profileId || (await getOrCreateProfile());
    await upsertCVMaster(pid, {
      fileName: cvFileName || "cv-maitre.txt",
      originalText: cvText,
      fileType: "text",
      status: "importé",
    });
    setProfileId(pid);
    await loadData();
    setSaving(false);
  };

  const addProof = async () => {
    if (!proofForm.title || !proofForm.value) return;
    setSaving(true);
    const pid = profileId || (await getOrCreateProfile());
    if (editingProofId) {
      await updateProofEntry(editingProofId, { ...proofForm, isConfidential: false, usableForCV: true, usableForLetter: true, sendableToAI: true, documentUrl: "", experienceId: "" });
      setEditingProofId(null);
    } else {
      await addProofEntry(pid, { ...proofForm, isConfidential: false, usableForCV: true, usableForLetter: true, sendableToAI: true, documentUrl: "", experienceId: "" });
    }
    setProofForm({ category: "CA", title: "", value: "", context: "", period: "", confidence: "moyen", verifiable: false });
    setProfileId(pid);
    await loadData();
    setSaving(false);
  };

  const editProof = (p: ProofItem) => {
    setEditingProofId(p.id);
    setProofForm({ category: p.category, title: p.title, value: p.value, context: p.context || "", period: p.period || "", confidence: p.confidence, verifiable: p.verifiable });
  };

  const removeProof = async (id: string) => {
    setSaving(true);
    await deleteProofEntry(id);
    await loadData();
    setSaving(false);
  };

  const addSource = async () => {
    if (!sourceForm.name || !sourceForm.url) return;
    setSaving(true);
    await addJobSource({ ...sourceForm, active: true, notes: "" });
    setSourceForm({ name: "", url: "", region: "FR", type: "job_board", priority: 0 });
    await loadData();
    setSaving(false);
  };

  const toggleSource = async (id: string, active: boolean) => {
    await toggleJobSource(id, active);
    await loadData();
  };

  const saveIA = async () => {
    setSaving(true);
    await updateSettings({
      confidentialityMode: iaMode,
      apiKey: apiKeyInput || undefined,
      aiProvider: iaMode !== "local" ? "deepseek" : "none",
    });
    await loadData();
    setSaving(false);
  };

  const testIA = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection();
    setTestResult(result.success ? "Connexion réussie" : `Échec: ${result.error}`);
    setTesting(false);
  };

  const getOrCreateProfile = async (): Promise<string> => {
    const p = await upsertProfile({
      fullName: identityForm.fullName || "Candidat",
      title: identityForm.title || "",
      email: identityForm.email || "",
      phone: identityForm.phone || "",
      linkedin: identityForm.linkedin || "",
      location: identityForm.location || "",
      mobility: identityForm.mobility || "",
      languages: langForm || "",
      yearsExp: targetingForm.yearsExp || 0,
      sectors: targetingForm.sectors || "",
      functions: targetingForm.functions || "",
      education: eduForm || "",
      certifications: certForm || "",
      remotePreference: targetingForm.remotePreference || "",
      targetSalary: targetingForm.targetSalary || "",
      summary: identityForm.summary || "",
      constraints: "",
      preferredTone: "",
      photoUrl: "",
      cvDefaultTemplate: "ats_classic",
      cvIncludePhoto: true,
      cvIncludeLinkedIn: false,
      cvAccentColor: "champagne",
    });
    setProfileId(p.id);
    return p.id;
  };

  const nextStep = async () => {
    if (step < 10) await handleStepChange(step + 1);
  };
  const prevStep = async () => {
    if (step > 1) await handleStepChange(step - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>
            Démarrage guidé
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Configurez votre agent de recherche exécutive en 15 minutes
          </p>
        </div>
        {readiness && (
          <div className="text-right">
            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
              Agent prêt à
            </div>
            <div className="text-3xl font-bold" style={{ color: readiness.globalScore >= 75 ? "var(--succes)" : "var(--or)" }}>
              {readiness.globalScore}%
            </div>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {STEPS.map((s, i) => {
          const isCurrent = s.id === step;
          const isDone = s.id < step;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => s.id < step ? handleStepChange(s.id) : null}
                disabled={s.id > step}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono transition-colors whitespace-nowrap"
                style={{
                  background: isCurrent ? "var(--or)" : isDone ? "var(--or-faible)" : "var(--fond-eleve)",
                  color: isCurrent ? "#000" : isDone ? "var(--or)" : "var(--texte-tertiaire)",
                  cursor: s.id > step ? "default" : "pointer",
                  opacity: s.id > step ? 0.4 : 1,
                }}
              >
                {isDone ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="w-3 h-px" style={{ background: "var(--bordure)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="p-6 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        {step === 1 && (
          <div className="space-y-6 text-center">
            <Sparkles size={40} style={{ color: "var(--or)", margin: "0 auto" }} />
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--texte)" }}>Bienvenue dans ELTON OS</h2>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--texte-secondaire)" }}>
                Votre assistant de recherche d&apos;emploi exécutive. En 10 étapes, configurez votre agent pour qu&apos;il trouve,
                analyse et candidate aux meilleures offres — automatiquement.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-mono">
              <div className="p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div className="font-bold" style={{ color: "var(--or)" }}>~15 min</div>
                <div style={{ color: "var(--texte-tertiaire)" }}>de setup</div>
              </div>
              <div className="p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div className="font-bold" style={{ color: "var(--or)" }}>10 étapes</div>
                <div style={{ color: "var(--texte-tertiaire)" }}>guidées</div>
              </div>
              <div className="p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div className="font-bold" style={{ color: "var(--or)" }}>100%</div>
                <div style={{ color: "var(--texte-tertiaire)" }}>réversible</div>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
              Toutes les données restent en local. Le mode manuel reste disponible.
            </p>
            <button
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
              style={{ background: "var(--or)", color: "#000" }}
            >
              <Play size={14} /> Commencer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>Votre identité exécutive</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nom complet*" value={identityForm.fullName} onChange={v => setIdentityForm(f => ({ ...f, fullName: v }))} />
              <Field label="Titre / poste actuel*" value={identityForm.title} onChange={v => setIdentityForm(f => ({ ...f, title: v }))} />
              <Field label="Email" value={identityForm.email} onChange={v => setIdentityForm(f => ({ ...f, email: v }))} />
              <Field label="Téléphone" value={identityForm.phone} onChange={v => setIdentityForm(f => ({ ...f, phone: v }))} />
              <Field label="LinkedIn" value={identityForm.linkedin} onChange={v => setIdentityForm(f => ({ ...f, linkedin: v }))} placeholder="https://linkedin.com/in/..." />
              <Field label="Ville / Localisation" value={identityForm.location} onChange={v => setIdentityForm(f => ({ ...f, location: v }))} />
            </div>
            <Field label="Mobilité" value={identityForm.mobility} onChange={v => setIdentityForm(f => ({ ...f, mobility: v }))} placeholder="France, Suisse, Belgique..." />
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Résumé exécutif</label>
              <textarea
                value={identityForm.summary}
                onChange={e => setIdentityForm(f => ({ ...f, summary: e.target.value }))}
                rows={3}
                className="w-full p-3 rounded-md border text-sm"
                style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}
                placeholder="Directeur Commercial avec 15+ ans d'expérience..."
              />
            </div>
            <button
              onClick={saveIdentity}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ background: "var(--or)", color: "#000" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>Ciblage exécutif</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Secteurs d'activité" value={targetingForm.sectors} onChange={v => setTargetingForm(f => ({ ...f, sectors: v }))} placeholder="Industrie, Tech, Santé..." />
              <Field label="Fonctions" value={targetingForm.functions} onChange={v => setTargetingForm(f => ({ ...f, functions: v }))} placeholder="Direction Commerciale, Country Manager..." />
              <Field label="Années d'expérience" value={String(targetingForm.yearsExp || "")} onChange={v => setTargetingForm(f => ({ ...f, yearsExp: parseInt(v) || 0 }))} type="number" />
              <Field label="Préférence remote" value={targetingForm.remotePreference} onChange={v => setTargetingForm(f => ({ ...f, remotePreference: v }))} placeholder="remote, hybride, présentiel" />
              <Field label="Salaire cible (fourchette)" value={targetingForm.targetSalary} onChange={v => setTargetingForm(f => ({ ...f, targetSalary: v }))} placeholder="120-150k€" />
            </div>
            <button
              onClick={saveTargeting}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ background: "var(--or)", color: "#000" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>Expériences professionnelles</h2>
            {expList.map((exp) => (
              <div key={exp.id} className="flex items-start justify-between p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--texte)" }}>{exp.title} chez {exp.company}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{exp.startDate} — {exp.endDate || "présent"}</div>
                  {exp.description && <div className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>{exp.description.slice(0, 100)}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => editExp(exp)} className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}><Wrench size={12} /></button>
                  <button onClick={() => removeExp(exp.id)} className="p-1 rounded" style={{ color: "var(--erreur)" }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}

            {/* ── Import depuis CV maître ── */}
            {!importDone ? (
              <>
                {/* Si CV présent */}
                {cvMaster && (
                  <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: "var(--or)", background: "var(--fond-surface)" }}>
                    <h3 className="text-sm font-mono uppercase flex items-center gap-2" style={{ color: "var(--or)" }}>
                      <FileText size={14} /> Importer depuis mon CV maître
                    </h3>
                    <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                      Votre CV maître peut contenir vos expériences passées. ELTON OS peut les détecter et vous proposer un import contrôlé.
                    </p>

                    {/* Scan button */}
                    {scannedExps.length === 0 && !scanningCV && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleScan}
                          disabled={scanningCV}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                          style={{ background: "var(--or)", color: "#000" }}
                        >
                          {scanningCV ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                          Scanner mon CV maître
                        </button>
                        <button
                          onClick={() => router.push("/cv-maitre")}
                          className="inline-flex items-center gap-1 text-xs font-mono"
                          style={{ color: "var(--or)" }}
                        >
                          Voir le CV maître <ArrowRight size={10} />
                        </button>
                      </div>
                    )}

                    {/* Loading */}
                    {scanningCV && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                        <Loader2 size={12} className="animate-spin" /> Analyse du CV en cours...
                      </div>
                    )}

                    {/* Error */}
                    {scanError && (
                      <div className="p-2 rounded text-xs" style={{ background: "rgba(239,68,68,0.05)", color: "var(--erreur)", border: "1px solid var(--erreur)" }}>
                        <AlertTriangle size={12} className="inline mr-1" />{scanError}
                      </div>
                    )}

                    {/* Scanned experiences */}
                    {scannedExps.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                          {scannedExps.length} expérience(s) détectée(s)
                        </div>
                        {scannedExps.map((exp: ExtractedExperience) => {
                          const isSelected = selectedScanIds.has(exp.id);
                          return (
                            <div key={exp.id}
                              className="p-3 rounded-md border transition-colors"
                              style={{
                                borderColor: isSelected ? "var(--succes)" : "var(--bordure-douce)",
                                background: isSelected ? "rgba(74,222,128,0.03)" : "var(--fond)",
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleScanExp(exp.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold" style={{ color: "var(--texte)" }}>
                                      {exp.title || "Poste inconnu"}
                                    </span>
                                    {exp.company && (
                                      <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                                        — {exp.company}
                                      </span>
                                    )}
                                    {/* Confidence badge */}
                                    {exp.confidenceScore < 50 ? (
                                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "var(--avertissement)" }}>
                                        À vérifier
                                      </span>
                                    ) : null}
                                  </div>
                                  {exp.startDate && (
                                    <div className="text-xs font-mono mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>
                                      {exp.startDate}{exp.endDate ? ` → ${exp.endDate}` : ""}
                                    </div>
                                  )}
                                  {exp.achievements.length > 0 && (
                                    <ul className="mt-1 space-y-0.5">
                                      {exp.achievements.slice(0, 3).map((a: string, i: number) => (
                                        <li key={i} className="text-xs" style={{ color: "var(--texte-secondaire)" }}>• {a}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {/* Warnings */}
                                  {exp.warnings.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                      {exp.warnings.slice(0, 3).map((w: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1 text-xs" style={{ color: "var(--avertissement)" }}>
                                          <AlertTriangle size={9} /> {w}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-3 mt-1">
                                    <button
                                      onClick={() => {
                                        setExpForm(importExpForm(exp));
                                        setEditingExpId(null);
                                      }}
                                      className="text-xs font-mono"
                                      style={{ color: "var(--info)" }}
                                    >
                                      <Wrench size={10} className="inline mr-1" />Modifier avant import
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Import button */}
                        <button
                          onClick={handleImportExp}
                          disabled={selectedScanIds.size === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium mt-2"
                          style={{
                            background: selectedScanIds.size > 0 ? "var(--or)" : "var(--fond-eleve)",
                            color: selectedScanIds.size > 0 ? "#000" : "var(--texte-tertiaire)",
                          }}
                        >
                          <Download size={12} />
                          Importer {selectedScanIds.size} expérience(s) sélectionnée(s)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Pas de CV */}
                {!cvMaster && (
                  <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: "var(--avertissement)", background: "rgba(245,158,11,0.03)" }}>
                    <h3 className="text-sm font-mono uppercase flex items-center gap-2" style={{ color: "var(--avertissement)" }}>
                      <AlertTriangle size={14} /> Importer depuis mon CV maître
                    </h3>
                    <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
                      Aucun CV maître validé. Importez d&apos;abord votre CV dans l&apos;étape suivante, puis revenez ici pour importer vos expériences automatiquement.
                    </p>
                    <button
                      onClick={() => handleStepChange(6)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                      style={{ background: "var(--or)", color: "#000" }}
                    >
                      Aller au CV Maître <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Import success message */
              <div className="p-4 rounded-lg border" style={{ borderColor: "var(--succes)", background: "rgba(74,222,128,0.05)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} style={{ color: "var(--succes)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--succes)" }}>Import terminé</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                  {importMsg}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                  Vérifiez les expériences ci-dessous. Les expériences existantes n&apos;ont pas été modifiées.
                </p>
              </div>
            )}

            <div className="p-4 rounded border space-y-3" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
              <h3 className="text-sm font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>
                {editingExpId ? "Modifier l'expérience" : "Ajouter une expérience"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Entreprise*" value={expForm.company} onChange={v => setExpForm(f => ({ ...f, company: v }))} />
                <Field label="Titre du poste*" value={expForm.title} onChange={v => setExpForm(f => ({ ...f, title: v }))} />
                <Field label="Date début* (YYYY-MM)" value={expForm.startDate} onChange={v => setExpForm(f => ({ ...f, startDate: v }))} placeholder="2020-01" />
                <Field label="Date fin" value={expForm.endDate} onChange={v => setExpForm(f => ({ ...f, endDate: v }))} placeholder="2024-06" />
                <Field label="Secteur" value={expForm.sector} onChange={v => setExpForm(f => ({ ...f, sector: v }))} />
                <Field label="Pays" value={expForm.country} onChange={v => setExpForm(f => ({ ...f, country: v }))} />
              </div>
              <Field label="Description" value={expForm.description} onChange={v => setExpForm(f => ({ ...f, description: v }))} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Taille équipe" value={expForm.teamSize} onChange={v => setExpForm(f => ({ ...f, teamSize: v }))} placeholder="25" />
                <Field label="CA / Revenue" value={expForm.revenue} onChange={v => setExpForm(f => ({ ...f, revenue: v }))} placeholder="10M€" />
                <Field label="Budget / P&L" value={expForm.budget} onChange={v => setExpForm(f => ({ ...f, budget: v }))} placeholder="5M€" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addExp}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ background: "var(--or)", color: "#000" }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  {editingExpId ? "Mettre à jour" : "Ajouter"}
                </button>
                {editingExpId && (
                  <button onClick={() => { setEditingExpId(null); setExpForm({ company: "", title: "", startDate: "", endDate: "", description: "", teamSize: "", revenue: "", budget: "", sector: "", country: "" }); }} className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>Compétences & Langues</h2>

            {/* Suggestions IA */}
            {profileId && !suggestionLoading && suggestions.length === 0 && (
              <div className="p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: "var(--or)", background: "var(--or-faible)" }}>
                <div className="flex items-center gap-2">
                  <Cpu size={14} style={{ color: "var(--or)" }} />
                  <span className="text-xs" style={{ color: "var(--texte)" }}>Suggestions IA basées sur votre profil et CV</span>
                </div>
                <div className="flex gap-1.5">
                  {(["skills", "languages", "education", "certifications"] as const).map((target) => (
                    <button
                      key={target}
                      onClick={() => handleSuggest(target)}
                      className="px-2.5 py-1 text-xs font-mono rounded transition-colors"
                      style={{ background: "var(--fond-surface)", color: "var(--or)", border: "1px solid var(--or)" }}
                    >
                      {target === "skills" ? "Compétences" : target === "languages" ? "Langues" : target === "education" ? "Formations" : "Certifications"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestionLoading && (
              <div className="p-3 rounded-lg border flex items-center gap-2" style={{ borderColor: "var(--or)", background: "var(--or-faible)" }}>
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--or)" }} />
                <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                  {suggestionTarget === "skills" ? "Analyse de votre profil pour les compétences..." : suggestionTarget === "languages" ? "Analyse de votre CV pour les langues..." : suggestionTarget === "education" ? "Analyse de votre parcours pour les formations..." : "Analyse de votre profil pour les certifications..."}
                </span>
              </div>
            )}

            {suggestionError && suggestions.length === 0 && (
              <div className="p-2 rounded text-xs flex items-center gap-1" style={{ background: "rgba(245,158,11,0.05)", color: "var(--avertissement)" }}>
                <AlertTriangle size={10} /> {suggestionError}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="p-3 rounded-lg border space-y-2" style={{ borderColor: "var(--or)", background: "var(--fond-surface)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase" style={{ color: "var(--or)" }}>
                    Suggestions {suggestionTarget === "skills" ? "compétences" : suggestionTarget === "languages" ? "langues" : suggestionTarget === "education" ? "formations" : "certifications"}
                  </span>
                  <button
                    onClick={() => { setSuggestions([]); setSuggestionError(null); }}
                    className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}
                  >
                    <X size={12} /> Fermer
                  </button>
                </div>
                {suggestionError && (
                  <p className="text-xs" style={{ color: "var(--avertissement)" }}>{suggestionError}</p>
                )}
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {suggestions.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border text-xs" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--texte)" }}>{item.name}</span>
                          {item.category && (
                            <span className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: "var(--or-faible)", color: "var(--or)", fontSize: "9px" }}>
                              {item.category}
                            </span>
                          )}
                          {item.level && (
                            <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                              {item.level}
                            </span>
                          )}
                          <span className="text-xs font-mono" style={{ color: item.confidence >= 70 ? "var(--succes)" : "var(--avertissement)" }}>
                            {item.confidence}%
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{item.reason}</p>
                      </div>
                      <button
                        onClick={() => applySuggestion(item)}
                        className="flex-shrink-0 px-2 py-1 rounded text-xs font-mono transition-colors"
                        style={{ background: "var(--or)", color: "#000" }}
                      >
                        {suggestionTarget === "skills" ? "Ajouter" : "Ajouter"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-mono uppercase mb-2" style={{ color: "var(--texte-tertiaire)" }}>Compétences ({skillList.length})</h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {skillList.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                    {s.name} ({s.category})
                    <button onClick={() => removeSkill(s.id)} style={{ color: "var(--erreur)" }}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <Field label="Compétence" value={skillForm.name} onChange={v => setSkillForm(f => ({ ...f, name: v }))} />
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Catégorie</label>
                  <select value={skillForm.category} onChange={e => setSkillForm(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 rounded-md border text-xs" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                    {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={addSkillItem} disabled={saving} className="px-3 py-2 rounded-md text-xs font-medium" style={{ background: "var(--or)", color: "#000" }}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                </button>
              </div>
            </div>
            <Field label="Langues" value={langForm} onChange={setLangForm} placeholder='["Français (natif)", "Anglais (courant)"]' />
            <Field label="Formation" value={eduForm} onChange={setEduForm} placeholder='["Master Management", "MBA"]' />
            <Field label="Certifications" value={certForm} onChange={setCertForm} placeholder='["Certification CRM", "PMP"]' />
            <button
              onClick={saveSkillsLang}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ background: "var(--or)", color: "#000" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>CV Maître</h2>
            <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
              Copiez-collez le texte intégral de votre CV. Il servira de source de vérité pour générer des documents et alimenter le Proof Vault.
            </p>
            <Field label="Nom du fichier" value={cvFileName} onChange={setCvFileName} placeholder="cv-executif.txt" />
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Texte du CV*</label>
              <textarea
                value={cvText}
                onChange={e => setCvText(e.target.value)}
                rows={15}
                className="w-full p-3 rounded-md border text-sm font-mono"
                style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}
                placeholder="Collez ici le texte intégral de votre CV..."
              />
            </div>
            {cvMaster && (
              <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                CV actuel : {cvMaster.fileName} · {cvMaster.originalText.length} caractères · Statut : {cvMaster.status}
              </div>
            )}
            <button
              onClick={saveCv}
              disabled={saving || !cvText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{ background: "var(--or)", color: "#000" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer le CV
            </button>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>Proof Vault</h2>
            <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
              Chaque entrée est un fait vérifiable (chiffre, réalisation) que l&apos;IA pourra utiliser pour personnaliser vos documents.
            </p>
            {proofList.map((p) => (
              <div key={p.id} className="flex items-start justify-between p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--or-faible)", color: "var(--or)" }}>{p.category}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--texte)" }}>{p.title}</span>
                    {p.verifiable && <CheckCircle2 size={12} style={{ color: "var(--succes)" }} />}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--or)" }}>{p.value}</div>
                  {p.context && <div className="text-xs mt-0.5" style={{ color: "var(--texte-tertiaire)" }}>{p.context}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => editProof(p)} className="p-1 rounded" style={{ color: "var(--texte-tertiaire)" }}><Wrench size={12} /></button>
                  <button onClick={() => removeProof(p.id)} className="p-1 rounded" style={{ color: "var(--erreur)" }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            <div className="p-4 rounded border space-y-3" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
              <h3 className="text-sm font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>
                {editingProofId ? "Modifier l'entrée" : "Ajouter une entrée"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Catégorie</label>
                  <select value={proofForm.category} onChange={e => setProofForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Titre*" value={proofForm.title} onChange={v => setProofForm(f => ({ ...f, title: v }))} placeholder="Croissance CA 2022-2023" />
                <Field label="Valeur / Chiffre*" value={proofForm.value} onChange={v => setProofForm(f => ({ ...f, value: v }))} placeholder="+32% CA" />
                <Field label="Contexte" value={proofForm.context} onChange={v => setProofForm(f => ({ ...f, context: v }))} placeholder="Période COVID, transformation..." />
                <Field label="Période" value={proofForm.period} onChange={v => setProofForm(f => ({ ...f, period: v }))} placeholder="2022-2023" />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Confiance</label>
                  <select value={proofForm.confidence} onChange={e => setProofForm(f => ({ ...f, confidence: e.target.value }))}
                    className="px-3 py-2 rounded-md border text-xs" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                    <option value="faible">Faible</option>
                    <option value="moyen">Moyen</option>
                    <option value="fort">Fort</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                  <input type="checkbox" checked={proofForm.verifiable} onChange={e => setProofForm(f => ({ ...f, verifiable: e.target.checked }))} />
                  Vérifiable
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addProof} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--or)", color: "#000" }}>
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  {editingProofId ? "Mettre à jour" : "Ajouter"}
                </button>
                {editingProofId && (
                  <button onClick={() => { setEditingProofId(null); setProofForm({ category: "CA", title: "", value: "", context: "", period: "", confidence: "moyen", verifiable: false }); }} className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Annuler</button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>Sources d&apos;emploi</h2>
            <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
              Activez vos sources pour suivre les offres. Au moins une source prioritaire est recommandée.
            </p>
            {sources.map((src) => (
              <div key={src.id} className="flex items-center justify-between p-3 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--texte)" }}>{src.name}</div>
                  <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{src.url} · {src.region} · {src.type}</div>
                </div>
                <button
                  onClick={() => toggleSource(src.id, !src.active)}
                  className="px-3 py-1 rounded-full text-xs font-mono transition-colors"
                  style={{
                    background: src.active ? "rgba(34,197,94,0.15)" : "var(--fond-eleve)",
                    color: src.active ? "var(--succes)" : "var(--texte-tertiaire)",
                  }}
                >
                  {src.active ? "Activée" : "Inactive"}
                </button>
              </div>
            ))}
            <div className="p-4 rounded border space-y-3" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
              <h3 className="text-sm font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Ajouter une source</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nom*" value={sourceForm.name} onChange={v => setSourceForm(f => ({ ...f, name: v }))} placeholder="LinkedIn" />
                <Field label="URL*" value={sourceForm.url} onChange={v => setSourceForm(f => ({ ...f, url: v }))} placeholder="https://..." />
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Région</label>
                  <select value={sourceForm.region} onChange={e => setSourceForm(f => ({ ...f, region: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                    <option value="FR">FR</option><option value="EU">EU</option><option value="US">US</option><option value="INTL">INTL</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>Type</label>
                  <select value={sourceForm.type} onChange={e => setSourceForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border text-xs" style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                    <option value="job_board">Job Board</option><option value="executive">Executive</option><option value="startup">Startup</option><option value="generalist">Généraliste</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs" style={{ color: "var(--texte-secondaire)" }}>
                    <input type="checkbox" checked={sourceForm.priority === 1} onChange={e => setSourceForm(f => ({ ...f, priority: e.target.checked ? 1 : 0 }))} />
                    Prioritaire
                  </label>
                </div>
              </div>
              <button onClick={addSource} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--or)", color: "#000" }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Ajouter
              </button>
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--texte)" }}>IA & Confidentialité</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-mono uppercase mb-2" style={{ color: "var(--texte-tertiaire)" }}>Mode de confidentialité</h3>
                <div className="space-y-2">
                  {[
                    { value: "local", label: "Local uniquement", desc: "Aucune donnée n'est envoyée à une IA externe. Templates locaux." },
                    { value: "anonymise", label: "Anonymisé", desc: "Les données sont anonymisées avant envoi à DeepSeek." },
                    { value: "complet", label: "Complet", desc: "Les données vérifiées (Proof Vault) sont envoyées pour des résultats optimaux." },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors"
                      style={{ borderColor: iaMode === opt.value ? "var(--or)" : "var(--bordure-douce)", background: iaMode === opt.value ? "var(--or-faible)" : "var(--fond)" }}>
                      <input type="radio" name="iaMode" value={opt.value} checked={iaMode === opt.value} onChange={e => setIaMode(e.target.value)} className="mt-0.5" />
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--texte)" }}>{opt.label}</div>
                        <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {iaMode !== "local" && (
                <>
                  <Field label="Clé API DeepSeek" value={apiKeyInput} onChange={setApiKeyInput} placeholder="sk-..." />
                  <div className="flex items-center gap-2">
                    <button onClick={testIA} disabled={testing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: "var(--fond-eleve)", color: "var(--texte)" }}>
                      {testing ? <Loader2 size={12} className="animate-spin" /> : <Cpu size={12} />}
                      Tester la connexion
                    </button>
                    {testResult && (
                      <span className="text-xs" style={{ color: testResult.includes("réussie") ? "var(--succes)" : "var(--erreur)" }}>
                        {testResult}
                      </span>
                    )}
                  </div>
                </>
              )}
              <button
                onClick={saveIA}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ background: "var(--or)", color: "#000" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {step === 10 && readiness && (
          <div className="space-y-6">
            <div className="text-center">
              <Award size={40} style={{ color: "var(--or)", margin: "0 auto" }} />
              <h2 className="text-xl font-bold mt-2" style={{ color: "var(--texte)" }}>Résumé de votre configuration</h2>
            </div>

            {/* Global score */}
            <div className="text-center p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
              <div className="text-xs font-mono uppercase mb-1" style={{ color: "var(--texte-tertiaire)" }}>Score Agent Readiness</div>
              <div className="text-5xl font-bold" style={{ color: readiness.globalScore >= 75 ? "var(--succes)" : "var(--or)" }}>
                {readiness.globalScore}%
              </div>
              <div className="text-sm mt-1 font-mono" style={{ color: "var(--texte-secondaire)" }}>
                Statut : {readiness.status === "active" ? "Actif" : readiness.status === "ready" ? "Prêt" : readiness.status === "almost_ready" ? "Presque prêt" : readiness.status === "in_progress" ? "En cours" : "Non démarré"}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {SECTION_ORDER.map((key) => {
                const b = readiness.breakdown[key];
                if (!b) return null;
                const pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-32 text-xs font-mono" style={{ color: b.ok ? "var(--succes)" : "var(--texte-tertiaire)" }}>
                      {b.ok ? <CheckCircle2 size={12} className="inline mr-1" /> : <Circle size={12} className="inline mr-1" />}
                      {b.label}
                    </div>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "var(--fond-eleve)" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 67 ? "var(--succes)" : pct >= 34 ? "var(--or)" : "var(--erreur)" }} />
                    </div>
                    <div className="text-xs font-mono w-16 text-right" style={{ color: "var(--texte-secondaire)" }}>{b.score}/{b.max}</div>
                  </div>
                );
              })}
            </div>

            {/* Next action */}
            <div className="p-4 rounded-lg border" style={{ borderColor: "var(--bordure)", background: "var(--fond)" }}>
              <div className="text-xs font-mono uppercase mb-1" style={{ color: "var(--texte-tertiaire)" }}>Prochaine action recommandée</div>
              <div className="text-sm" style={{ color: "var(--texte)" }}>{readiness.nextBestAction}</div>
            </div>

            {/* Missing */}
            {readiness.missingFields.length > 0 && (
              <div>
                <div className="text-xs font-mono uppercase mb-2" style={{ color: "var(--texte-tertiaire)" }}>Éléments manquants ({readiness.missingFields.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {readiness.missingFields.map((f, i) => {
                    const fieldToPath: Record<string, string> = {
                      "Nom complet": "/profil",
                      "Titre / poste actuel": "/profil",
                      "Email": "/profil",
                      "Téléphone": "/profil",
                      "Au moins un rôle prioritaire": "/profil",
                      "Au moins un pays cible": "/profil",
                      "Secteurs d'activité": "/profil",
                      "Fonctions": "/profil",
                      "Années d'expérience": "/profil",
                      "Au moins 2 expériences professionnelles": "/profil",
                      "Au moins une expérience avec description": "/profil",
                      "Au moins une expérience avec chiffres (équipe, CA, budget)": "/profil",
                      "Au moins 5 compétences": "/profil",
                      "Langues parlées": "/profil",
                      "CV Maître importé": "/cv-maitre",
                      "Au moins un chiffre dans le Proof Vault": "/proof-vault",
                      "Au moins 3 entrées dans le Proof Vault": "/proof-vault",
                      "Au moins une entrée vérifiable dans le Proof Vault": "/proof-vault",
                      "Au moins une source d'emploi active": "/sources",
                      "Au moins une source marquée prioritaire": "/sources",
                      "Mode de confidentialité IA configuré": "/parametres",
                      "Clé API DeepSeek configurée": "/parametres",
                      "Au moins une opportunité dans le pipeline": "/pipeline",
                    };
                    const path = fieldToPath[f];
                    return path ? (
                      <button key={i} onClick={() => router.push(path)}
                        className="px-2 py-1 rounded-full text-xs cursor-pointer transition-colors hover:brightness-125"
                        style={{ background: "rgba(239,68,68,0.1)", color: "var(--erreur)" }}
                        title={`Aller à ${path}`}>
                        {f}
                      </button>
                    ) : (
                      <span key={i} className="px-2 py-1 rounded-full text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "var(--erreur)" }}>{f}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
                style={{ background: "var(--or)", color: "#000" }}
              >
                <ArrowRight size={14} /> Aller au Dashboard
              </button>
              {readiness.globalScore >= 50 && (
                <button
                  onClick={() => router.push("/opportunites")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
                  style={{ background: "var(--fond-eleve)", color: "var(--texte)" }}
                >
                  <Search size={14} /> Explorer les offres
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors"
          style={{ color: step === 1 ? "var(--texte-tertiaire)" : "var(--texte)", opacity: step === 1 ? 0.4 : 1 }}
        >
          <ChevronLeft size={14} /> Précédent
        </button>
        <button
          onClick={() => router.push("/")}
          className="text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{ color: "var(--texte-tertiaire)", background: "var(--fond-eleve)" }}
        >
          Sauvegarder et quitter
        </button>
        <button
          onClick={nextStep}
          disabled={step === 10}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: "var(--or)", color: "#000", opacity: step === 10 ? 0.4 : 1 }}
        >
          Suivant <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-mono uppercase" style={{ color: "var(--texte-tertiaire)" }}>{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border text-sm"
        style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}
      />
    </div>
  );
}
