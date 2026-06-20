"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, Check, AlertTriangle, Trash2, Save } from "lucide-react";
import { getProfile } from "@/lib/actions/profile";
import {
  getCVMaster, upsertCVMaster, updateCVMasterStatus, deleteCVMaster,
} from "@/lib/actions/cv-master";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

interface CVMasterItem {
  profileId: string; fileName: string; originalText: string; fileType: string;
  status: string; uploadedAt: string; fileSize: number | null;
}

interface ProfileRef { id: string; }

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  importé: { label: "Importé", color: "var(--texte-tertiaire)", icon: FileText },
  à_vérifier: { label: "À vérifier", color: "var(--avertissement)", icon: AlertTriangle },
  validé: { label: "Validé", color: "var(--succes)", icon: Check },
};

export default function CVMaitrePage() {
  const [profile, setProfile] = useState<ProfileRef | null>(null);
  const [cv, setCV] = useState<CVMasterItem | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const notify = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(async () => {
    const p = await getProfile();
    setProfile(p as unknown as ProfileRef | null);
    if (p) {
      const c = await getCVMaster(p.id);
      setCV(c as unknown as CVMasterItem | null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePasteImport = async () => {
    if (!profile || !pasteText.trim()) return;
    try {
      const c = await upsertCVMaster(profile.id, {
        fileName: fileName || "cv-maitre.txt",
        originalText: pasteText,
        fileType: "text",
        status: "importé",
      });
      setCV(c as unknown as CVMasterItem);
      setShowForm(false);
      setPasteText("");
      setFileName("");
      notify("ok", "CV importé avec succès");
    } catch { notify("err", "Erreur lors de l'import"); }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.type === "application/pdf") {
      notify("err", "Le parsing PDF n'est pas encore disponible. Collez le texte du CV dans l'onglet Texte.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      try {
        const c = await upsertCVMaster(profile.id, {
          fileName: file.name, originalText: text, fileType: file.type.includes("pdf") ? "pdf" : "text", status: "importé",
        });
        setCV(c as unknown as CVMasterItem);
        setShowForm(false);
        notify("ok", "Fichier importé avec succès");
      } catch { notify("err", "Erreur lors de l'import"); }
    };
    reader.readAsText(file);
  };

  const handleStatusChange = async (status: string) => {
    if (!cv) return;
    try {
      const updated = await updateCVMasterStatus(cv.profileId, status);
      setCV(updated as unknown as CVMasterItem);
      notify("ok", `Statut changé : ${status}`);
    } catch { notify("err", "Erreur changement de statut"); }
  };

  const handleDelete = async () => {
    if (!cv || !confirm("Supprimer définitivement ce CV maître ?")) return;
    await deleteCVMaster(cv.profileId);
    setCV(null);
    notify("ok", "CV supprimé");
  };

  const handleAISuggestion = (_target: string, item: SuggestionItem) => {
    if (_target === "skills" || _target === "languages" || _target === "education" || _target === "certifications") {
      setShowForm(true);
      setPasteText(prev => prev ? prev + "\n" + item.name : item.name);
      notify("ok", `Ajouté : ${item.name}`);
    }
  };

  const statusInfo = cv ? STATUS_LABELS[cv.status] || STATUS_LABELS["importé"] : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--texte)" }}>CV Maître</h1>
          <p className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            Document source — ne sera jamais modifié automatiquement
          </p>
        </div>
        {!cv && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-md border transition-colors"
            style={{ background: "var(--or)", color: "var(--fond)", borderColor: "var(--or)" }}>
            <Upload size={14} /> Importer
          </button>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div className="px-4 py-2 rounded-md text-sm font-mono border"
          style={{ background: msg.type === "ok" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)", color: msg.type === "ok" ? "var(--succes)" : "var(--erreur)", borderColor: msg.type === "ok" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)" }}>
          {msg.text}
        </div>
      )}

      {/* Alerte profil inexistant */}
      {!profile && (
        <div className="p-5 rounded-lg border text-center" style={{ background: "var(--fond-surface)", borderColor: "var(--avertissement)" }}>
          <AlertTriangle size={20} style={{ color: "var(--avertissement)" }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: "var(--texte-secondaire)" }}>
            Créez d&apos;abord votre profil exécutif avant d&apos;importer votre CV.
          </p>
        </div>
      )}

      {/* Formulaire d'import */}
      {showForm && profile && (
        <div className="p-5 rounded-lg border space-y-4" style={{ background: "var(--fond-surface)", borderColor: "var(--or)" }}>
          <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Importer le CV Maître</h3>
          <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
            Ce document est votre CV source. Il ne sera <strong>jamais</strong> modifié automatiquement.
            Chaque adaptation pour une offre sera une version séparée.
          </p>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider mb-1 block" style={{ color: "var(--texte-secondaire)" }}>Fichier (optionnel — titre du document)</label>
            <input type="text" value={fileName} onChange={e => setFileName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border" placeholder="cv-elton-duarteel-2026.txt"
              style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }} />
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider mb-1 block" style={{ color: "var(--texte-secondaire)" }}>Collez le texte intégral du CV</label>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
              rows={14} placeholder="Collez ici le contenu complet de votre CV maître..."

              className="w-full px-3 py-2 text-sm rounded-md border font-mono"
              style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)", resize: "vertical" }} />
          </div>

          <div className="flex gap-2">
            <button onClick={handlePasteImport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono rounded-md"
              style={{ background: "var(--or)", color: "var(--fond)" }}>
              <Save size={13} /> Enregistrer le CV
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-mono rounded-md border"
              style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Aperçu du CV */}
      {cv && (
        <div className="space-y-4">
          {/* Infos + statut */}
          <div className="p-5 rounded-lg border flex items-start justify-between" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: "var(--or)" }} />
                <span className="font-medium text-sm" style={{ color: "var(--texte)" }}>{cv.fileName}</span>
                {statusInfo && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                    style={{ background: `${statusInfo.color}15`, color: statusInfo.color, border: `1px solid ${statusInfo.color}40` }}>
                    <statusInfo.icon size={10} /> {statusInfo.label}
                  </span>
                )}
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
                {cv.fileType.toUpperCase()} · {cv.originalText.length.toLocaleString()} caractères · {cv.originalText.split(/\n\s*\n/).length}+ paragraphes
              </div>
              <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                Importé le {new Date(cv.uploadedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={cv.status} onChange={e => handleStatusChange(e.target.value)}
                className="px-2 py-1 text-xs font-mono rounded border"
                style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}>
                <option value="importé">Importé</option>
                <option value="à_vérifier">À vérifier</option>
                <option value="validé">Validé</option>
              </select>
              <button onClick={handleDelete} className="p-1.5 rounded" style={{ color: "var(--erreur)" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-5 rounded-lg border space-y-3" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
            <h3 className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--or)" }}>Aperçu du CV</h3>
            <pre className="text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-md border font-sans"
              style={{ background: "var(--fond)", borderColor: "var(--bordure-douce)", color: "var(--texte-secondaire)", maxHeight: "60vh", overflow: "auto" }}>
              {cv.originalText}
            </pre>
          </div>

          <div className="p-4 rounded-lg border flex items-center gap-3" style={{ background: "rgba(74,222,128,0.05)", borderColor: "rgba(74,222,128,0.2)" }}>
            <Check size={14} style={{ color: "var(--succes)" }} />
            <span className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
              Ce CV maître est protégé. Toute adaptation pour une offre sera stockée comme un document séparé lié à l&apos;offre.
            </span>
          </div>
        </div>
      )}

      {profile && <AIAssistant profileId={profile.id} onApply={handleAISuggestion} />}
    </div>
  );
}
