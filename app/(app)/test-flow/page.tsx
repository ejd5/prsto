"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Circle, Bug, StickyNote, ArrowRight, Loader2,
  FlaskConical, Trash2, AlertTriangle, Download, X, Plus,
} from "lucide-react";
import { checkExistingData, createDemoData, deleteDemoData } from "@/lib/actions/demo";

const STORAGE_KEY = "elton-test-flow-steps";

interface StepState {
  done: boolean;
  note: string;
  bug: boolean;
}

interface StepDef {
  id: number;
  label: string;
  path: string;
  verify: string;
}

const STEPS: StepDef[] = [
  {
    id: 1,
    label: "Créer un profil",
    path: "/profil",
    verify: "Remplir tous les champs (nom, titre, résumé, mobilité, langues, salaire cible) et sauvegarder. Vérifier que la sauvegarde fonctionne sans erreur.",
  },
  {
    id: 2,
    label: "Importer un CV maître",
    path: "/cv-maitre",
    verify: "Importer ou coller un CV en texte brut. Vérifier que le texte s'affiche correctement et que le statut passe à 'Importé'.",
  },
  {
    id: 3,
    label: "Ajouter 3 preuves Proof Vault",
    path: "/proof-vault",
    verify: "Créer 3 preuves (ex: CA, taille d'équipe, certification). Vérifier que chaque preuve apparaît dans la liste avec sa catégorie et son niveau de confiance.",
  },
  {
    id: 4,
    label: "Ajouter 2 opportunités proches",
    path: "/opportunites",
    verify: "Ajouter 2 offres avec des titres légèrement différents pour la même entreprise (ex: 'Directeur Commercial' et 'Dir. Commercial France'). Vérifier qu'elles apparaissent dans la liste.",
  },
  {
    id: 5,
    label: "Scanner les doublons",
    path: "/opportunites",
    verify: "Cliquer sur 'Scanner les doublons'. Vérifier que les 2 offres proches sont détectées et qu'un score de similarité est affiché.",
  },
  {
    id: 6,
    label: "Marquer une offre comme distincte ou doublon probable",
    path: "/opportunites",
    verify: "Sélectionner 2 offres à comparer, utiliser le panneau de comparaison, puis marquer l'une comme 'Doublon probable' ou 'Distinct'. Vérifier que le badge change.",
  },
  {
    id: 7,
    label: "Analyser une opportunité",
    path: "/analyse",
    verify: "Lancer l'analyse d'une opportunité. Vérifier que le score (0-100), les gaps, les risques et les points forts sont générés.",
  },
  {
    id: 8,
    label: "Générer un CV FR avec template ATS Classic",
    path: "/documents",
    verify: "Depuis une opportunité, générer un CV FR. Vérifier que le contenu est basé sur le profil/CV maître (pas d'invention).",
  },
  {
    id: 9,
    label: "Générer une lettre FR",
    path: "/documents",
    verify: "Générer une lettre de motivation FR. Vérifier que le ton correspond à l'offre et que les informations viennent du profil.",
  },
  {
    id: 10,
    label: "Générer un email FR",
    path: "/documents",
    verify: "Générer un email de candidature FR. Vérifier qu'il est concis, prêt à copier-coller.",
  },
  {
    id: 11,
    label: "Approuver un document",
    path: "/documents",
    verify: "Relire un document généré, corriger si nécessaire, puis cliquer sur 'Approuver'. Vérifier que le statut passe à 'APPROVED'.",
  },
  {
    id: 12,
    label: "Ajouter l'opportunité au pipeline",
    path: "/pipeline",
    verify: "Ajouter une opportunité au pipeline Kanban. Vérifier qu'elle apparaît dans la colonne 'Nouveau' ou 'À préparer'.",
  },
  {
    id: 13,
    label: "Marquer prêt à envoyer",
    path: "/pipeline",
    verify: "Déplacer l'opportunité dans la colonne 'Prêt à envoyer'. Vérifier que le changement est bien enregistré.",
  },
  {
    id: 14,
    label: "Générer une relance J+5",
    path: "/pipeline",
    verify: "Depuis le pipeline, générer une relance J+5. Vérifier que le texte est généré (pas d'envoi automatique).",
  },
  {
    id: 15,
    label: "Marquer relance envoyée",
    path: "/pipeline",
    verify: "Après avoir copié-collé et envoyé la relance manuellement, cliquer sur 'Marquer comme envoyé'. Vérifier que le statut change.",
  },
  {
    id: 16,
    label: "Générer une préparation entretien",
    path: "/entretiens",
    verify: "Sélectionner une opportunité et générer une préparation d'entretien. Vérifier que les 24 sections sont générées.",
  },
  {
    id: 17,
    label: "Vérifier dashboard KPIs",
    path: "/",
    verify: "Retourner au dashboard. Vérifier que les KPIs sont à jour : nombre d'opportunités, documents, pipeline actif, relances, entretiens préparés.",
  },
];

function loadSteps(): Record<number, StepState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveSteps(steps: Record<number, StepState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  } catch { /* ignore */ }
}

export default function TestFlowPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<Record<number, StepState>>(() => loadSteps());
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoDeleting, setDemoDeleting] = useState(false);
  const [demoStatus, setDemoStatus] = useState<{
    hasProfile: boolean;
    hasOpportunities: boolean;
    hasDocuments: boolean;
    hasDemoData: boolean;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    let ignore = false;
    checkExistingData().then((status) => {
      if (!ignore) setDemoStatus(status);
    });
    return () => { ignore = true; };
  }, []);

  const refreshStatus = useCallback(async () => {
    const status = await checkExistingData();
    setDemoStatus(status);
  }, []);

  const toggleStep = (id: number) => {
    setSteps((prev) => {
      const next = { ...prev };
      next[id] = { ...(next[id] || { note: "", bug: false }), done: !(prev[id]?.done) };
      saveSteps(next);
      return next;
    });
  };

  const toggleBug = (id: number) => {
    setSteps((prev) => {
      const next = { ...prev };
      next[id] = { ...(next[id] || { done: false, note: "" }), bug: !(prev[id]?.bug) };
      saveSteps(next);
      return next;
    });
  };

  const openNote = (id: number) => {
    setEditingNote(id);
    setNoteDraft(steps[id]?.note || "");
  };

  const saveNote = () => {
    if (editingNote === null) return;
    setSteps((prev) => {
      const next = { ...prev };
      next[editingNote] = { ...(next[editingNote] || { done: false, bug: false }), note: noteDraft };
      saveSteps(next);
      return next;
    });
    setEditingNote(null);
  };

  const handleCreateDemo = async () => {
    if (demoStatus?.hasProfile && !demoStatus?.hasDemoData) {
      if (!confirm("ATTENTION : Des données réelles existent déjà dans ELTON OS. Les données de démonstration seront clairement marquées [DEMO] et n'écraseront pas vos données réelles. Continuer ?")) return;
    }
    setDemoLoading(true);
    setMessage(null);
    try {
      const result = await createDemoData();
      if (result.success) {
        setMessage({ type: "success", text: "Données démo créées avec succès. 10 offres, 6 candidatures, pipeline complet. Elles sont marquées [DEMO]." });
      } else {
        setMessage({ type: "error", text: result.error || "Erreur création données démo" });
      }
      await refreshStatus();
    } catch (e: unknown) {
      setMessage({ type: "error", text: `Erreur : ${(e as Error).message || String(e)}` });
    }
    setDemoLoading(false);
  };

  const handleDeleteDemo = async () => {
    if (!confirm("Supprimer toutes les données de démonstration (marquées [DEMO]) ? Cette action est irréversible. Vos données réelles ne seront pas affectées.")) return;
    setDemoDeleting(true);
    setMessage(null);
    try {
      const result = await deleteDemoData();
      const d = result.deleted;
      setMessage({
        type: "success",
        text: `Données démo supprimées : ${d?.jobs ?? 0} offres, ${d?.drafts ?? 0} candidatures, ${d?.scores ?? 0} scores, ${d?.sources ?? 0} sources, ${d?.profiles ?? 0} profils, ${d?.sessions ?? 0} sessions.`,
      });
      await refreshStatus();
    } catch (e: unknown) {
      setMessage({ type: "error", text: `Erreur : ${(e as Error).message || String(e)}` });
    }
    setDemoDeleting(false);
  };

  const doneCount = Object.values(steps).filter((s) => s.done).length;
  const bugCount = Object.values(steps).filter((s) => s.bug).length;
  const progress = STEPS.length > 0 ? Math.round((doneCount / STEPS.length) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--texte)" }}>
            <FlaskConical size={22} style={{ color: "var(--or)" }} />
            Test flow complet
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            Checklist interactive des 17 étapes du parcours utilisateur ELTON OS.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: "var(--or)" }}>{progress}%</div>
          <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
            {doneCount}/{STEPS.length} fait · {bugCount} bug{bugCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-2 rounded-full" style={{ background: "var(--fond-eleve)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: bugCount > 0 ? "var(--warning)" : "var(--succes)" }}
        />
      </div>

      {/* Message toast */}
      {message && (
        <div
          className="p-3 rounded-md border text-xs flex items-start justify-between"
          style={{
            borderColor: message.type === "success" ? "var(--succes)" : message.type === "warning" ? "var(--warning)" : "var(--erreur)",
            background: message.type === "success" ? "rgba(74,222,128,0.05)" : message.type === "warning" ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.05)",
            color: "var(--texte-secondaire)",
          }}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ color: "var(--texte-tertiaire)" }}><X size={14} /></button>
        </div>
      )}

      {/* Données démo */}
      <div
        className="p-4 rounded-lg border space-y-3"
        style={{
          borderColor: demoStatus?.hasDemoData ? "var(--succes)" : "var(--bordure)",
          background: "var(--fond-surface)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download size={16} style={{ color: "var(--or)" }} />
            <h3 className="text-sm font-bold" style={{ color: "var(--texte)" }}>Données de démonstration</h3>
            {demoStatus?.hasDemoData && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(74,222,128,0.1)", color: "var(--succes)" }}
              >
                Créées
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateDemo}
              disabled={demoLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
              style={{ borderColor: "var(--or)", color: "var(--or)" }}
            >
              {demoLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Créer données démo
            </button>
            {demoStatus?.hasDemoData && (
              <button
                onClick={handleDeleteDemo}
                disabled={demoDeleting}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors"
                style={{ borderColor: "var(--erreur)", color: "var(--erreur)" }}
              >
                {demoDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Supprimer données démo
              </button>
            )}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--texte-secondaire)" }}>
          Crée un profil fictif, un CV, 3 preuves, 2 opportunités similaires et un document approuvé. Toutes ces données sont marquées <strong style={{ color: "var(--or)" }}>[DEMO]</strong> pour les distinguer de vos données réelles.
        </p>

        {demoStatus?.hasProfile && !demoStatus?.hasDemoData && (
          <div
            className="p-2 rounded text-xs flex items-start gap-2"
            style={{ background: "rgba(245,158,11,0.08)", color: "var(--warning)", border: "1px solid var(--warning)" }}
          >
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 0 }} />
            <span>Des données réelles existent. Les données démo seront marquées [DEMO] et n&apos;écraseront rien. Pensez à les supprimer après le test.</span>
          </div>
        )}

        {/* Légende */}
        <div className="flex gap-6 text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>
          <span className="flex items-center gap-1"><CheckCircle2 size={12} style={{ color: "var(--succes)" }} /> Fait</span>
          <span className="flex items-center gap-1"><Bug size={12} style={{ color: "var(--erreur)" }} /> Bug</span>
          <span className="flex items-center gap-1"><StickyNote size={12} style={{ color: "var(--info)" }} /> Note</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1">
        {STEPS.map((step) => {
          const state = steps[step.id] || { done: false, note: "", bug: false };
          return (
            <div key={step.id}>
              <div
                className="flex items-start gap-3 p-3 rounded-md border transition-colors"
                style={{
                  borderColor: state.done ? "var(--succes)" : state.bug ? "var(--erreur)" : "var(--bordure-douce)",
                  background: state.done
                    ? "rgba(74,222,128,0.03)"
                    : state.bug
                      ? "rgba(239,68,68,0.03)"
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
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: state.done ? "var(--texte-tertiaire)" : "var(--texte)",
                        textDecoration: state.done ? "line-through" : "none",
                      }}
                    >
                      {step.id}. {step.label}
                    </span>
                    {/* Badges */}
                    {state.bug && (
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(239,68,68,0.1)", color: "var(--erreur)" }}
                      >
                        Bug signalé
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
                    {step.verify}
                  </p>

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
                      onClick={() => router.push(step.path)}
                      className="flex items-center gap-1 text-xs font-mono transition-colors"
                      style={{ color: "var(--or)" }}
                    >
                      Aller à la page <ArrowRight size={10} />
                    </button>
                    <button
                      onClick={() => openNote(step.id)}
                      className="flex items-center gap-1 text-xs font-mono transition-colors"
                      style={{ color: state.note ? "var(--info)" : "var(--texte-tertiaire)" }}
                    >
                      <StickyNote size={12} />
                      {state.note ? "Modifier note" : "Ajouter note"}
                    </button>
                    <button
                      onClick={() => toggleBug(step.id)}
                      className="flex items-center gap-1 text-xs font-mono transition-colors"
                      style={{ color: state.bug ? "var(--erreur)" : "var(--texte-tertiaire)" }}
                    >
                      <Bug size={12} />
                      {state.bug ? "Retirer bug" : "Signaler bug"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (!confirm("Réinitialiser toute la checklist ? Les étapes cochées, notes et bugs seront effacés.")) return;
            setSteps({});
            saveSteps({});
            setMessage({ type: "success", text: "Checklist réinitialisée." });
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-md border"
          style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}
        >
          <Trash2 size={12} />
          Réinitialiser la checklist
        </button>
      </div>
    </div>
  );
}
