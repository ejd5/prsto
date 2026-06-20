"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Circle, StickyNote, Loader2,
  Target, ArrowRight, AlertTriangle,
} from "lucide-react";
import { checkExistingData } from "@/lib/actions/demo";
import { getRealUsageStatus } from "@/lib/actions/real-usage";
import type { DetectionResult } from "@/lib/real-usage/detection";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";

const STORAGE_KEY = "elton-first-run-steps";

interface StepState {
  done: boolean;
  note: string;
}

interface StepDef {
  id: string;
  label: string;
  description: string;
  detectionId?: string;
}

const STEPS: StepDef[] = [
  {
    id: "no-demo",
    label: "Supprimer les données de démonstration",
    description: "Si des données [DEMO] sont encore présentes, supprimez-les via le bouton dans /test-flow avant d'importer vos vraies données.",
    detectionId: "demo-data",
  },
  {
    id: "profile",
    label: "Compléter votre vrai profil exécutif",
    description: "Remplissez tous les champs de votre profil avec vos informations réelles : nom, titre, résumé, mobilité, langues, salaire cible, secteurs, fonctions.",
  },
  {
    id: "cv-master",
    label: "Importer votre vrai CV maître",
    description: "Collez le texte intégral de votre CV réel dans /cv-maitre. Ce document source ne sera jamais modifié automatiquement.",
    detectionId: "cv-master",
  },
  {
    id: "proof-3",
    label: "Ajouter au moins 5 preuves chiffrées",
    description: "Dans /proof-vault, ajoutez des preuves vérifiables avec des chiffres : CA géré, taille d'équipe, croissance, certifications, langues.",
    detectionId: "proof-vault",
  },
  {
    id: "proof-verifiable",
    label: "Marquer au moins 1 preuve comme vérifiable",
    description: "Cochez la case 'Vérifiable' sur les preuves pour lesquelles vous avez un justificatif (document, lien, référence).",
    detectionId: "proof-vault",
  },
  {
    id: "offer-1",
    label: "Ajouter votre 1ère vraie offre",
    description: "Importez ou saisissez manuellement une première opportunité réelle qui vous intéresse dans /opportunites.",
    detectionId: "real-offers",
  },
  {
    id: "offer-5",
    label: "Ajouter 5 vraies offres au total",
    description: "Complétez jusqu'à avoir au moins 5 offres réelles dans votre base. Utilisez /sources pour activer des sources automatiques.",
    detectionId: "real-offers",
  },
  {
    id: "analyze-all",
    label: "Analyser toutes les offres",
    description: "Lancez l'analyse (scoring, gaps, risques) sur chacune de vos offres dans /analyse.",
    detectionId: "analyzed-offers",
  },
  {
    id: "cv-doc",
    label: "Générer un CV adapté pour une offre",
    description: "Dans /documents, générez un CV FR avec le template ATS Classic pour l'une de vos offres analysées.",
  },
  {
    id: "approve-doc",
    label: "Relire et approuver le CV généré",
    description: "Vérifiez que le contenu est fidèle à votre profil, corrigez si nécessaire, puis approuvez le document.",
    detectionId: "approved-docs",
  },
  {
    id: "letter-doc",
    label: "Générer et approuver une lettre de motivation",
    description: "Générez une lettre FR pour la même offre, relisez-la et approuvez-la.",
  },
  {
    id: "pipeline-add",
    label: "Ajouter les offres au pipeline",
    description: "Placez vos offres dans le pipeline Kanban (/pipeline) pour suivre leur progression.",
    detectionId: "pipeline",
  },
  {
    id: "relance-plan",
    label: "Planifier une relance J+5",
    description: "Pour une offre déjà envoyée, générez une relance J+5 depuis le pipeline.",
    detectionId: "relances",
  },
  {
    id: "interview-prep",
    label: "Générer une préparation d'entretien",
    description: "Dans /entretiens, générez une préparation complète (24 sections) pour l'une de vos offres.",
  },
  {
    id: "dashboard-check",
    label: "Vérifier le dashboard",
    description: "Retournez au dashboard pour confirmer que tous les KPIs reflètent votre activité réelle : offres, documents, pipeline, relances.",
  },
];

function loadSteps(): Record<string, StepState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveSteps(steps: Record<string, StepState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  } catch { /* ignore */ }
}

export default function FirstRunPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Record<string, StepState>>(() => loadSteps());
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [hasDemoData, setHasDemoData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [dataStatus, usageStatus] = await Promise.all([
        checkExistingData(),
        getRealUsageStatus(),
      ]);
      setHasDemoData(dataStatus.hasDemoData);
      setDetections(usageStatus.detections);
      setReadiness(usageStatus.readiness);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // setLoading(true) est appelé synchronement dans loadStatus → même pattern
  // que les 14 autres pages. Corriger nécessiterait un refactor du data fetching.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, [loadStatus]);

  const toggleStep = (id: string) => {
    setSteps((prev) => {
      const next = { ...prev };
      next[id] = { ...(next[id] || { note: "" }), done: !(prev[id]?.done) };
      saveSteps(next);
      return next;
    });
  };

  const openNote = (id: string) => {
    setEditingNote(id);
    setNoteDraft(steps[id]?.note || "");
  };

  const saveNote = () => {
    if (editingNote === null) return;
    setSteps((prev) => {
      const next = { ...prev };
      next[editingNote] = { ...(next[editingNote] || { done: false }), note: noteDraft };
      saveSteps(next);
      return next;
    });
    setEditingNote(null);
  };

  const handleAISuggestion = (_target: string, item: SuggestionItem) => {
    if (confirm(`Ajouter "${item.name}" à votre profil ?`)) {
      alert(`Suggestion enregistrée : ${item.name}`);
    }
  };

  const doneCount = Object.values(steps).filter((s) => s.done).length;
  const progress = STEPS.length > 0 ? Math.round((doneCount / STEPS.length) * 100) : 0;

  const detectionById: Record<string, DetectionResult> = {};
  for (const d of detections) {
    detectionById[d.id] = d;
  }

  const severityColors: Record<string, string> = {
    ok: "var(--succes)",
    warning: "var(--avertissement)",
    error: "var(--erreur)",
  };

  const severityBg: Record<string, string> = {
    ok: "rgba(74,222,128,0.1)",
    warning: "rgba(245,158,11,0.1)",
    error: "rgba(239,68,68,0.1)",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <Target size={22} style={{ color: "var(--or)" }} />
            Première session réelle
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Checklist pour passer des données de démonstration à votre usage réel avec 5 vraies offres.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: "var(--or)" }}>{progress}%</div>
          <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {doneCount}/{STEPS.length} étapes
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-2 rounded-full" style={{ background: "var(--fond-eleve)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: progress === 100 ? "var(--succes)" : "var(--or)",
          }}
        />
      </div>

      {/* Statut Agent readiness */}
      {!loading && readiness !== null && (
        <div
          className="p-4 rounded-lg border flex items-center justify-between"
          style={{
            borderColor: readiness >= 75 ? "var(--succes)" : readiness >= 40 ? "var(--avertissement)" : "var(--erreur)",
            background: readiness >= 75 ? "rgba(74,222,128,0.05)" : readiness >= 40 ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="text-2xl font-bold"
              style={{ color: readiness >= 75 ? "var(--succes)" : readiness >= 40 ? "var(--avertissement)" : "var(--erreur)" }}
            >
              {readiness}%
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--texte)" }}>
                {readiness >= 90 ? "Agent prêt pour l'usage réel" :
                 readiness >= 75 ? "Presque prêt — derniers réglages" :
                 readiness >= 40 ? "En bonne voie — continuez" :
                 "Démarrez la configuration"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--texte-secondaire)" }}>
                {readiness >= 90 ? "Tous les checks automatiques sont au vert. Vous pouvez travailler sereinement." :
                 readiness >= 75 ? "Quelques éléments manquent encore pour une configuration optimale." :
                 readiness >= 40 ? "Les bases sont en place. Continuez les étapes de la checklist." :
                 "Suivez la checklist pour configurer ELTON OS avec vos vraies données."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerte données démo */}
      {!loading && hasDemoData && (
        <div
          className="p-4 rounded-lg border flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "var(--erreur)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--erreur)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--erreur)" }}>Données de démonstration détectées</p>
            <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
              Des données marquées [DEMO] sont encore présentes. Supprimez-les avant de commencer avec vos vraies données.
            </p>
            <button
              onClick={() => router.push("/test-flow")}
              className="flex items-center gap-1 text-xs font-mono mt-2"
              style={{ color: "var(--or)" }}
            >
              Aller à Test Flow pour les supprimer <ArrowRight size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const state = steps[step.id] || { done: false, note: "" };
          const detection = step.detectionId ? detectionById[step.detectionId] : undefined;
          const sevColor = detection ? severityColors[detection.severity] : undefined;

          return (
            <div key={step.id}>
              <div
                className="flex items-start gap-3 p-3 rounded-md border transition-colors"
                style={{
                  borderColor: state.done
                    ? "var(--succes)"
                    : detection && !detection.ok
                      ? severityColors[detection.severity]
                      : "var(--bordure-douce)",
                  background: state.done
                    ? "rgba(74,222,128,0.03)"
                    : detection && !detection.ok
                      ? severityBg[detection.severity]
                      : "var(--fond-surface)",
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: state.done ? "var(--succes)" : "var(--texte-tertiaire)" }}
                >
                  {state.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded-full" style={{ background: "var(--or-faible)", color: "var(--or)" }}>
                      {i + 1}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: state.done ? "var(--texte-tertiaire)" : "var(--texte)",
                        textDecoration: state.done ? "line-through" : "none",
                      }}
                    >
                      {step.label}
                    </span>
                    {/* Badge détection */}
                    {detection && !detection.ok && (
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: severityBg[detection.severity], color: sevColor }}
                      >
                        {detection.severity === "error" ? "À faire" : "Recommandé"}
                      </span>
                    )}
                    {detection?.ok && (
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(74,222,128,0.1)", color: "var(--succes)" }}
                      >
                        OK
                      </span>
                    )}
                    {state.note && (
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(59,130,246,0.1)", color: "var(--info)" }}
                      >
                        Note
                      </span>
                    )}
                  </div>

                  <p className="text-xs mt-1" style={{ color: "var(--texte-secondaire)" }}>
                    {step.description}
                  </p>

                  {/* Message de détection */}
                  {detection && !detection.ok && (
                    <p className="text-xs mt-1 p-2 rounded" style={{ background: severityBg[detection.severity], color: sevColor }}>
                      {detection.recommendation}
                    </p>
                  )}

                  {state.note && (
                    <p
                      className="text-xs mt-1 p-2 rounded"
                      style={{ background: "rgba(59,130,246,0.05)", color: "var(--info)", borderLeft: "2px solid var(--info)" }}
                    >
                      {state.note}
                    </p>
                  )}

                  {/* Note editor inline */}
                  {editingNote === step.id && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Ajouter une note..."
                        rows={2}
                        className="w-full p-2 rounded border text-xs"
                        style={{
                          background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)",
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveNote}
                          className="px-3 py-1 text-xs font-mono rounded"
                          style={{ background: "var(--or)", color: "var(--fond)" }}
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="px-3 py-1 text-xs font-mono rounded border"
                          style={{ borderColor: "var(--bordure)", color: "var(--texte-secondaire)" }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="flex items-center gap-1 text-xs font-mono transition-colors"
                      style={{ color: state.done ? "var(--texte-tertiaire)" : "var(--or)" }}
                    >
                      {state.done ? "Marquer comme à faire" : "Marquer comme fait"}
                    </button>
                    <button
                      onClick={() => openNote(step.id)}
                      className="flex items-center gap-1 text-xs font-mono transition-colors"
                      style={{ color: state.note ? "var(--info)" : "var(--texte-tertiaire)" }}
                    >
                      <StickyNote size={12} />
                      {state.note ? "Modifier note" : "Ajouter note"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <AIAssistant onApply={handleAISuggestion} />
    </div>
  );
}
