import Link from "next/link";
import { Crown, ScanLine, FileText, Sparkles, Briefcase, MessageSquare, Ban, Mail, Search, Brain, Wand2, Link2, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Outils PRSTO — 13 outils IA premium pour cadres dirigeants",
  description: "Catalogue complet des outils PRSTO : ATS Checker 35 points, AI Resume Agent, Bullet Point Writer executive, Cover Letter Generator 3 tons, Resignation Letter executive, et plus.",
};

const TOOLS = [
  {
    id: "ats-checker",
    name: "ATS Resume Checker",
    description: "Analyse 35 critères ATS dont 12 signaux exécutifs uniques (gouvernance, P&L, M&A, portée internationale). Rezi en analyse 23.",
    icon: ScanLine,
    href: "/prsto/ats-checker",
    badge: "35 points",
    badgeColor: "#10B981",
    category: "CV",
    betterThan: "Rezi (23 points)",
  },
  {
    id: "resume-agent",
    name: "AI Resume Agent",
    description: "Agent conversationnel qui vous interview sur votre carrière et construit votre CV Master de façon incrémentale. Pas un formulaire, une vraie conversation.",
    icon: Brain,
    href: "/prsto/outils/agent-cv",
    badge: "Agentic",
    badgeColor: "#F59E0B",
    category: "CV",
    betterThan: "Rezi AI Agent (one-shot)",
  },
  {
    id: "bullet-writer",
    name: "Bullet Point Writer",
    description: "Génère 5 bullets exécutifs par expérience (P&L, team size, board reporting, M&A) — pas de bullets génériques.",
    icon: Sparkles,
    href: "/cv-maitre",
    badge: "Executive",
    badgeColor: "#8B5CF6",
    category: "CV",
    betterThan: "Rezi (generic bullets)",
  },
  {
    id: "summary-generator",
    name: "Executive Summary Generator",
    description: "Génère 3 versions de votre profil (board-ready, visionnaire, opérationnel) en 50-90 mots chacune.",
    icon: FileText,
    href: "/cv-maitre",
    badge: "3 tons",
    badgeColor: "#3B82F6",
    category: "CV",
    betterThan: "Rezi (1 generic)",
  },
  {
    id: "cover-letter",
    name: "Cover Letter Generator",
    description: "Génère 3 versions de lettre de motivation selon la cible : Board, CEO pair, ou Fondateur. Chaque ton a sa logique.",
    icon: Mail,
    href: "/prsto/outils/cover-letter",
    badge: "3 tons",
    badgeColor: "#EC4899",
    category: "Carrière",
    betterThan: "Rezi (1 generic)",
  },
  {
    id: "resignation-letter",
    name: "Resignation Letter Executive",
    description: "Lettre de démission avec clauses garden leave, non-compète, mandat social au Board, plan de passation.",
    icon: Ban,
    href: "/prsto/outils/resignation-letter",
    badge: "Executive",
    badgeColor: "#EF4444",
    category: "Carrière",
    betterThan: "Rezi (generic)",
  },
  {
    id: "ai-interview",
    name: "AI Mock Interview Panel",
    description: "Entretien visio avec 5 rôles Comex (CEO, CFO, DRH, Pair, Investisseur). Voix Google TTS + webcam + SpeechRecognition.",
    icon: MessageSquare,
    href: "/mock-interview/panel",
    badge: "Visio",
    badgeColor: "#06B6D4",
    category: "Training Camp",
    betterThan: "Rezi (text only)",
  },
  {
    id: "conseiller",
    name: "Conseiller IA (Second Brain)",
    description: "Chat IA avec mémoire long-terme (RAG 1024-dim) sur votre profil, opportunités, preuves, entretiens. Réponses en 6 blocs structurés.",
    icon: Brain,
    href: "/conseiller",
    badge: "RAG",
    badgeColor: "#F59E0B",
    category: "Training Camp",
    betterThan: "Rezi (no memory)",
  },
  {
    id: "cv-master",
    name: "CV Master Adaptatif",
    description: "Votre CV maître exécutif avec adaptation automatique par offre, traduction multi-langue, scoring temps réel.",
    icon: FileText,
    href: "/cv-maitre",
    badge: "Multi-langue",
    badgeColor: "#10B981",
    category: "Arsenaux",
    betterThan: "Rezi (EN only)",
  },
  {
    id: "opportunites",
    name: "Pipeline Opportunités",
    description: "Suivi des opportunités avec scoring exécutif (location, secteur, package), recommandations d'action, offres similaires via RAG.",
    icon: Briefcase,
    href: "/opportunites",
    badge: "Scoring",
    badgeColor: "#8B5CF6",
    category: "Campagne",
    betterThan: "Rezi (basic tracking)",
  },
  {
    id: "proof-vault",
    name: "Proof Vault (Realized RAG)",
    description: "Coffre-fort de vos preuves (réalisations chiffrées) vectorisées et interrogées par le Conseiller IA.",
    icon: Crown,
    href: "/proof-vault",
    badge: "RAG",
    badgeColor: "#F59E0B",
    category: "Arsenaux",
    betterThan: "Rezi (no equivalent)",
  },
  {
    id: "linkedin-optimizer",
    name: "LinkedIn Optimizer",
    description: "Optimisation de votre profil LinkedIn avec IA, scoring, mots-clés cibles, suggestions de reformulation executive.",
    icon: Link2,
    href: "/linkedin-optimizer",
    badge: "LinkedIn",
    badgeColor: "#0A66C2",
    category: "Arsenaux",
    betterThan: "Rezi (no equivalent)",
  },
  {
    id: "translate",
    name: "Traduction Multi-langue",
    description: "Traduction FR/EN/ES via Riva Translate 4B (NVIDIA NIM, gratuit) avec fallback GLM-5.2.",
    icon: RefreshCw,
    href: "/cv-maitre",
    badge: "FR/EN/ES",
    badgeColor: "#10B981",
    category: "Arsenaux",
    betterThan: "Rezi (EN only)",
  },
];

export default function OutilsHubPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
            <Crown size={14} />
            <span className="text-xs font-mono uppercase tracking-wide">13 outils IA · Executive-grade</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4" style={{ color: "var(--prsto-forest)" }}>
            La suite PRSTO
          </h1>
          <p className="text-base max-w-3xl mx-auto" style={{ color: "var(--texte-secondaire)" }}>
            Chaque outil a été conçu spécifiquement pour les cadres dirigeants. Là où Rezi propose 13 outils génériques pour tous chercheurs d'emploi, PRSTO propose 13 outils executive-grade avec mémoire IA (RAG), multi-langue, et tons board-ready.
          </p>
          <div className="mt-5 inline-flex flex-wrap gap-3 text-xs justify-center">
            <span className="px-3 py-1.5 rounded-full" style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte-secondaire)" }}>
              ✓ 35 points ATS (vs 23 Rezi)
            </span>
            <span className="px-3 py-1.5 rounded-full" style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte-secondaire)" }}>
              ✓ FR / EN / ES (vs EN Rezi)
            </span>
            <span className="px-3 py-1.5 rounded-full" style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte-secondaire)" }}>
              ✓ RAG 1024-dim (vs none Rezi)
            </span>
            <span className="px-3 py-1.5 rounded-full" style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte-secondaire)" }}>
              ✓ Tons board-ready
            </span>
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="block p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "#FFF", border: "1px solid #E5E7EB" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${tool.badgeColor}15` }}>
                    <Icon size={20} style={{ color: tool.badgeColor }} />
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-1 rounded uppercase tracking-wide"
                    style={{ background: `${tool.badgeColor}15`, color: tool.badgeColor }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--texte)" }}>
                  {tool.name}
                </h3>
                <p className="text-xs mb-3" style={{ color: "var(--texte-secondaire)" }}>
                  {tool.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
                  <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: "var(--texte-tertiaire)" }}>
                    {tool.category}
                  </span>
                  <span className="text-[10px]" style={{ color: "#10B981" }}>
                    {"›"} {tool.betterThan}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 p-8 rounded-2xl text-center" style={{ background: "var(--prsto-forest)" }}>
          <h2 className="font-serif text-2xl mb-3" style={{ color: "#FFF" }}>
            Prêt à essayer ?
          </h2>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.8)" }}>
            Commencez par le ATS Checker (gratuit, sans inscription) ou créez votre compte pour accéder aux 12 autres outils.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/prsto/ats-checker"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#FFF", color: "var(--prsto-forest)" }}
            >
              Tester ATS Checker (gratuit)
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "transparent", color: "#FFF", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              Créer mon compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
