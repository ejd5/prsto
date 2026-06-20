"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  CheckCircle2,
  TrendingUp,
  Clock,
  Globe,
  Sparkles,
  Search,
  Star,
  Loader2,
  Brain,
  Send,
  Users,
  Award,
  AlertTriangle,
  Cpu,
  XCircle,
  Zap,
  Play,
  ArrowRight,
} from "lucide-react";
import { getOpportunityStats } from "@/lib/actions/opportunity";
import { getJobSourceStats } from "@/lib/actions/job-source";
import { getAnalysisStats } from "@/lib/actions/analysis";
import { getDocumentStats } from "@/lib/actions/document";
import { getPipelineStats } from "@/lib/actions/pipeline";
import { getInterviewStats } from "@/lib/actions/interview";
import { getSettings, getAIPrompts } from "@/lib/actions/settings";
import { getDashboardPerformance } from "@/lib/actions/performance";
import { getOnboardingState } from "@/lib/actions/onboarding";
import AIAssistant from "@/components/ai-assistant";
import type { SuggestionItem } from "@/lib/ai/suggestions";
import type { AgentReadinessResult } from "@/lib/onboarding/readiness";
import type { GlobalPerformance, ActionItem } from "@/lib/performance/engine";
import type { WeeklyRecommendation } from "@/lib/performance/recommendations";

interface OppStats { total: number; nouveau: number; aAnalyser: number; postule: number; }
interface SourceStats { total: number; actives: number; prioritaires: number; }
interface AnalysisStats { analysed: number; averageScore: number; highOpportunities: number; avoidOpportunities: number; toAnalyze: number; }
interface DocStats { total: number; toValidate: number; validated: number; }
interface PipelineStats { inPipeline: number; envoyees: number; relancesAFaire: number; relancesRetard: number; entretiens: number; offres: number; refus: number; }
interface InterviewStats { total: number; brouillons: number; prets: number; }
interface PerfData { global: GlobalPerformance; topActions: ActionItem[]; topAlerts: WeeklyRecommendation[]; }

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [oppStats, setOppStats] = useState<OppStats>({ total: 0, nouveau: 0, aAnalyser: 0, postule: 0 });
  const [sourceStats, setSourceStats] = useState<SourceStats>({ total: 0, actives: 0, prioritaires: 0 });
  const [analysisStats, setAnalysisStats] = useState<AnalysisStats>({ analysed: 0, averageScore: 0, highOpportunities: 0, avoidOpportunities: 0, toAnalyze: 0 });
  const [docStats, setDocStats] = useState<DocStats>({ total: 0, toValidate: 0, validated: 0 });
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({ inPipeline: 0, envoyees: 0, relancesAFaire: 0, relancesRetard: 0, entretiens: 0, offres: 0, refus: 0 });
  const [interviewStats, setInterviewStats] = useState<InterviewStats>({ total: 0, brouillons: 0, prets: 0 });
  const [aiMode, setAiMode] = useState<string>("local");
  const [promptsActifs, setPromptsActifs] = useState(0);
  const [perf, setPerf] = useState<PerfData | null>(null);
  const [agentReadiness, setAgentReadiness] = useState<AgentReadinessResult | null>(null);

  const load = useCallback(async () => {
    const [opp, src, analysis, docs, pipeline, interviews, settings, prompts, perfData, onboardingData] = await Promise.all([
      getOpportunityStats(),
      getJobSourceStats(),
      getAnalysisStats(),
      getDocumentStats(),
      getPipelineStats(),
      getInterviewStats(),
      getSettings(),
      getAIPrompts(),
      getDashboardPerformance(),
      getOnboardingState(),
    ]);
    setOppStats(opp as OppStats);
    setSourceStats(src as SourceStats);
    setAnalysisStats(analysis as AnalysisStats);
    setDocStats(docs as DocStats);
    setPipelineStats(pipeline as PipelineStats);
    setInterviewStats(interviews as InterviewStats);
    setAiMode(!settings?.aiProvider || settings.aiProvider === "none" ? "local" : settings.aiProvider);
    setPromptsActifs((prompts || []).filter((p: { active: boolean }) => p.active).length);
    setPerf(perfData as PerfData);
    setAgentReadiness(onboardingData.readiness);
    setLoading(false);
  }, []);

  const handleAISuggestion = (_target: string, item: SuggestionItem) => {
    alert(`Suggestion : ${item.name} — ${item.reason}\nAjoutez-la depuis la page Profil.`);
  };

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--texte)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texte-secondaire)" }}>
            ELTON OS — Recherche Exécutive
          </p>
        </div>
        <div
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
          style={{ background: "var(--fond-eleve)", color: "var(--texte-secondaire)" }}
        >
          <Globe size={12} />
          <span className="font-mono">12 pays · 31 sources · {sourceStats.actives} actives</span>
        </div>
      </div>

      {/* Agent Readiness Card */}
      {!loading && agentReadiness && agentReadiness.status !== "active" && (
        <div className="p-5 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "var(--or)" }} />
                <h2 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>
                  Démarrage guidé
                </h2>
              </div>
              <p className="text-sm mt-2" style={{ color: "var(--texte)" }}>
                Complétez le démarrage guidé pour activer CV adaptés, scoring, sourcing, relances et entretiens.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: "var(--or)" }}>{agentReadiness.globalScore}%</div>
                <div className="text-xs font-mono" style={{ color: "var(--texte-tertiaire)" }}>Agent readiness</div>
              </div>
              <button
                onClick={() => router.push("/demarrage")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ background: "var(--or)", color: "#000" }}
              >
                {agentReadiness.status === "not_started" ? (
                  <><Play size={14} /> Démarrer</>
                ) : agentReadiness.status === "in_progress" ? (
                  <><ArrowRight size={14} /> Reprendre</>
                ) : (
                  <><Sparkles size={14} /> Finaliser</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--or)" }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={Briefcase} label="Opportunités" value={oppStats.total || 0} color="var(--or)" href="/opportunites" router={router} />
            <StatCard icon={Brain} label="Analysées" value={`${analysisStats.analysed || 0} · ${analysisStats.averageScore || 0}/100`} color="var(--info)" href="/analyse" router={router} />
            <StatCard icon={Search} label="Sources actives" value={`${sourceStats.actives || 0}/${sourceStats.total || 0}`} color="var(--info)" href="/sources" router={router} />
            <StatCard icon={Star} label="Score ≥ 70" value={analysisStats.highOpportunities || 0} color="var(--succes)" href="/opportunites" router={router} />
            <StatCard icon={FileText} label="Documents" value={`${docStats.total || 0} · ${docStats.validated || 0} validés`} color="var(--or)" href="/documents" router={router} />
            <StatCard icon={TrendingUp} label="Pipeline" value={pipelineStats.inPipeline || 0} color="var(--info)" href="/pipeline" router={router} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={Send} label="Envoyées" value={pipelineStats.envoyees || 0} color="var(--succes)" href="/pipeline" router={router} />
            <StatCard icon={Clock} label="Relances à faire" value={pipelineStats.relancesAFaire || 0} color="var(--warning)" href="/pipeline" router={router} />
            <StatCard icon={AlertTriangle} label="En retard" value={pipelineStats.relancesRetard || 0} color="var(--erreur)" href="/pipeline" router={router} />
            <StatCard icon={Users} label="Entretiens" value={pipelineStats.entretiens || 0} color="var(--info)" href="/pipeline" router={router} />
            <StatCard icon={Award} label="Offres" value={pipelineStats.offres || 0} color="var(--succes)" href="/pipeline" router={router} />
            <StatCard icon={CheckCircle2} label="Refus" value={pipelineStats.refus || 0} color="var(--texte-tertiaire)" href="/pipeline" router={router} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard icon={Brain} label="Entretiens préparés" value={`${interviewStats.total || 0} · ${interviewStats.prets || 0} prêts`} color="var(--or)" href="/entretiens" router={router} />
            <StatCard icon={FileText} label="Prompts actifs" value={`${promptsActifs}/12`} color="var(--info)" href="/parametres" router={router} />
            <StatCard icon={Cpu} label="Mode IA" value={aiMode} color="var(--texte-tertiaire)" href="/parametres" router={router} />
            {perf && <StatCard icon={TrendingUp} label="Taux réponse" value={`${perf.global.tauxReponse}%`} color={perf.global.tauxReponse >= 30 ? "var(--succes)" : "var(--warning)"} href="/performance" router={router} />}
            {perf && <StatCard icon={Users} label="Taux entretien" value={`${perf.global.tauxEntretien}%`} color={perf.global.tauxEntretien >= 20 ? "var(--succes)" : "var(--warning)"} href="/performance" router={router} />}
            {perf && <StatCard icon={Send} label="Prêtes à envoyer" value={perf.global.candidaturesPretes} color="var(--or)" href="/pipeline" router={router} />}
          </div>
          {perf && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={XCircle} label="À éviter" value={perf.global.aEviter} color="var(--erreur)" href="/opportunites" router={router} />
              <StatCard icon={CheckCircle2} label="Docs approuvés" value={perf.global.documentsApprouves} color="var(--succes)" href="/documents" router={router} />
              <StatCard icon={Award} label="Offres reçues" value={perf.global.offresRecues} color="var(--succes)" href="/pipeline" router={router} />
              <StatCard icon={Zap} label="Actions du jour" value={perf.topActions?.length || 0} color="var(--or)" href="/performance" router={router} />
            </div>
          )}
          {perf && perf.topAlerts?.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-md border text-xs" style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
              <AlertTriangle size={14} style={{ color: "var(--erreur)", marginTop: 1, flexShrink: 0 }} />
              <div>
                {perf.topAlerts.map((a: WeeklyRecommendation, i: number) => (
                  <p key={i} style={{ color: "var(--texte)" }}>{a.message}</p>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pipeline + Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lien vers le Pipeline Kanban complet */}
        <div className="lg:col-span-2 p-6 rounded-lg border cursor-pointer transition-colors"
          style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}
          onClick={() => router.push("/pipeline")}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--or)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider" style={{ color: "var(--texte-secondaire)" }}>Pipeline Kanban</h2>
            <span className="text-xs font-mono" style={{ color: "var(--or)" }}>Voir tout →</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[
              { label: "Envoyé", count: pipelineStats.envoyees, color: "var(--succes)" },
              { label: "Relance 1", count: 0, color: "var(--or)" },
              { label: "Relance 2", count: 0, color: "var(--or)" },
              { label: "Ent. RH", count: pipelineStats.entretiens, color: "var(--info)" },
              { label: "Ent. Dir.", count: 0, color: "var(--info)" },
              { label: "Offres", count: pipelineStats.offres, color: "var(--succes)" },
              { label: "Refus", count: pipelineStats.refus, color: "var(--erreur)" },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 rounded border" style={{ borderColor: "var(--bordure-douce)", background: "var(--fond)" }}>
                <div className="text-lg font-bold" style={{ color: item.color }}>{item.count}</div>
                <div className="text-xs mt-1 font-mono" style={{ color: "var(--texte-tertiaire)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="p-6 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
          <h2 className="text-sm font-mono uppercase tracking-wider mb-5" style={{ color: "var(--texte-secondaire)" }}>Actions rapides</h2>
          <div className="space-y-2">
            <QuickAction icon={Briefcase} label="Ajouter une opportunité" href="/opportunites" router={router} />
            <QuickAction icon={TrendingUp} label="Pipeline Kanban" href="/pipeline" router={router} />
            <QuickAction icon={FileText} label="Importer mon CV maître" href="/cv-maitre" router={router} />
            <QuickAction icon={Globe} label="Gérer les sources" href="/sources" router={router} />
            <QuickAction icon={Brain} label="Préparer un entretien" href="/entretiens" router={router} />
            <QuickAction icon={Sparkles} label="Paramètres IA" href="/parametres" router={router} />
          </div>
        </div>
      </div>

      {/* Checklist des phases */}
      <div className="p-6 rounded-lg border" style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}>
        <h2 className="text-sm font-mono uppercase tracking-wider mb-4" style={{ color: "var(--texte-secondaire)" }}>Progression ELTON OS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-1.5 gap-x-6 text-xs font-mono">
          <PhaseItem done={true} label="Phase 1 — Setup, Prisma, DB, Design System" />
          <PhaseItem done={true} label="Phase 2 — Profil, CV Maître, Proof Vault" />
          <PhaseItem done={true} label="Phase 3 — Sources, Opportunités, Market Radar" />
          <PhaseItem done={true} label="Phase 4 — Analyse heuristique & Scoring" />
          <PhaseItem done={true} label="Phase 5 — Génération CV/Lettre/Email" />
          <PhaseItem done={true} label="Phase 6 — Pipeline Kanban & Relances" />
          <PhaseItem done={true} label="Phase 7 — Interview War Room & Paramètres" />
        </div>
      </div>
      <AIAssistant onApply={handleAISuggestion} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, href, router }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>; label: string; value: string | number; color: string; href: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      onClick={() => router.push(href)}
      className="p-4 rounded-lg border text-left transition-colors"
      style={{ background: "var(--fond-surface)", borderColor: "var(--bordure)" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bordure)"; }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} style={{ color }} />
        <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--texte-tertiaire)" }}>
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--texte)" }}>
        {value}
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, label, href, router }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; href: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full text-left px-4 py-2.5 rounded-md text-sm border transition-colors"
      style={{ background: "var(--fond)", borderColor: "var(--bordure)", color: "var(--texte)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--or)";
        e.currentTarget.style.color = "var(--or)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--bordure)";
        e.currentTarget.style.color = "var(--texte)";
      }}>
      <div className="flex items-center gap-2">
        <Icon size={14} />
        <span>{label}</span>
      </div>
    </button>
  );
}

function PhaseItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="py-1" style={{ color: done ? "var(--succes)" : "var(--texte-tertiaire)" }}>
      {done ? "✅" : "⏳"} {label}
    </div>
  );
}
