// ─── Interview Studio — visual config ───
import {
  Timer, Clock, Briefcase, Building2, Globe, Target,
  Users, UserCheck, UserCog, Star, Shield, HelpCircle,
  MessageSquare, Lightbulb, AlertTriangle, CheckSquare,
  DollarSign, BarChart3, Zap, ListChecks, ArrowUpCircle,
  type LucideIcon,
} from "lucide-react";

export type SectionGroupKey =
  | "Pitchs" | "Contexte" | "Motivation" | "Questions" | "Réponses"
  | "Objections" | "À poser" | "Négociation" | "Stratégie" | "Logistique";

export interface SectionGroupVisual {
  label: string;
  icon: LucideIcon;
  color: string;        // accent text/border
  bg: string;           // card bg
  gradient: string;     // subtle gradient for hero cards
  dotColor: string;     // status dot
}

export const SECTION_GROUP_VISUALS: Record<SectionGroupKey, SectionGroupVisual> = {
  Pitchs: {
    label: "Pitchs",
    icon: Zap,
    color: "var(--or, #E4B118)",
    bg: "rgba(228,177,24,0.05)",
    gradient: "linear-gradient(135deg, rgba(228,177,24,0.06), rgba(228,177,24,0.01))",
    dotColor: "var(--or, #E4B118)",
  },
  Contexte: {
    label: "Contexte",
    icon: Building2,
    color: "var(--prsto-sage, #6A8F6D)",
    bg: "rgba(106,143,109,0.06)",
    gradient: "linear-gradient(135deg, rgba(106,143,109,0.08), rgba(106,143,109,0.02))",
    dotColor: "var(--prsto-sage, #6A8F6D)",
  },
  Motivation: {
    label: "Motivation",
    icon: Target,
    color: "var(--succes, #2E7D5E)",
    bg: "rgba(46,125,94,0.06)",
    gradient: "linear-gradient(135deg, rgba(46,125,94,0.08), rgba(46,125,94,0.02))",
    dotColor: "var(--succes, #2E7D5E)",
  },
  Questions: {
    label: "Questions",
    icon: HelpCircle,
    color: "var(--info, #4A7C9B)",
    bg: "rgba(74,124,155,0.06)",
    gradient: "linear-gradient(135deg, rgba(74,124,155,0.08), rgba(74,124,155,0.02))",
    dotColor: "var(--info, #4A7C9B)",
  },
  Réponses: {
    label: "Réponses",
    icon: MessageSquare,
    color: "var(--or, #E4B118)",
    bg: "rgba(228,177,24,0.05)",
    gradient: "linear-gradient(135deg, rgba(228,177,24,0.06), rgba(228,177,24,0.01))",
    dotColor: "var(--or, #E4B118)",
  },
  Objections: {
    label: "Objections",
    icon: Shield,
    color: "var(--erreur, #C54B3C)",
    bg: "rgba(197,75,60,0.06)",
    gradient: "linear-gradient(135deg, rgba(197,75,60,0.08), rgba(197,75,60,0.02))",
    dotColor: "var(--erreur, #C54B3C)",
  },
  "À poser": {
    label: "À poser",
    icon: UserCheck,
    color: "var(--prsto-sage, #6A8F6D)",
    bg: "rgba(106,143,109,0.06)",
    gradient: "linear-gradient(135deg, rgba(106,143,109,0.08), rgba(106,143,109,0.02))",
    dotColor: "var(--prsto-sage, #6A8F6D)",
  },
  Négociation: {
    label: "Négociation",
    icon: DollarSign,
    color: "var(--or, #E4B118)",
    bg: "rgba(228,177,24,0.05)",
    gradient: "linear-gradient(135deg, rgba(228,177,24,0.06), rgba(228,177,24,0.01))",
    dotColor: "var(--or, #E4B118)",
  },
  Stratégie: {
    label: "Stratégie",
    icon: BarChart3,
    color: "var(--prsto-forest, #103826)",
    bg: "rgba(16,56,38,0.05)",
    gradient: "linear-gradient(135deg, rgba(16,56,38,0.06), rgba(16,56,38,0.01))",
    dotColor: "var(--prsto-forest, #103826)",
  },
  Logistique: {
    label: "Logistique",
    icon: ListChecks,
    color: "var(--texte-tertiaire)",
    bg: "var(--fond-eleve)",
    gradient: "linear-gradient(135deg, var(--fond-eleve), transparent)",
    dotColor: "var(--texte-tertiaire)",
  },
};

// Pitch-specific role visuals
export interface PitchRoleVisual {
  key: string;
  label: string;
  role: string;
  duration: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  description: string;
}

export const PITCH_ROLES: PitchRoleVisual[] = [
  {
    key: "pitch_30s", label: "Pitch 30s", role: "Tous contextes",
    duration: "30 sec", icon: Timer,
    gradient: "linear-gradient(135deg, rgba(228,177,24,0.06), rgba(228,177,24,0.01))",
    borderColor: "var(--or, #E4B118)",
    description: "Version éclair — ascenseur",
  },
  {
    key: "pitch_2min", label: "Pitch 2 min", role: "Tous contextes",
    duration: "2 min", icon: Clock,
    gradient: "linear-gradient(135deg, rgba(228,177,24,0.06), rgba(228,177,24,0.01))",
    borderColor: "var(--or, #E4B118)",
    description: "Version complète — présentation générale",
  },
  {
    key: "pitch_dc", label: "Pitch DC", role: "Directeur Commercial",
    duration: "2 min", icon: Briefcase,
    gradient: "linear-gradient(135deg, rgba(106,143,109,0.06), rgba(106,143,109,0.01))",
    borderColor: "var(--prsto-sage, #6A8F6D)",
    description: "Axé résultats commerciaux & équipes terrain",
  },
  {
    key: "pitch_cm", label: "Pitch CM", role: "Country Manager",
    duration: "2 min", icon: Globe,
    gradient: "linear-gradient(135deg, rgba(16,56,38,0.05), rgba(16,56,38,0.01))",
    borderColor: "var(--prsto-forest, #103826)",
    description: "Axé vision pays & P&L complète",
  },
  {
    key: "pitch_dnv", label: "Pitch DNV", role: "Dir. National Ventes",
    duration: "2 min", icon: Users,
    gradient: "linear-gradient(135deg, rgba(46,125,94,0.06), rgba(46,125,94,0.01))",
    borderColor: "var(--succes, #2E7D5E)",
    description: "Axé force de vente & croissance CA",
  },
  {
    key: "pitch_dg", label: "Pitch DG", role: "Directeur Général",
    duration: "2 min", icon: UserCog,
    gradient: "linear-gradient(135deg, rgba(74,124,155,0.06), rgba(74,124,155,0.01))",
    borderColor: "var(--info, #4A7C9B)",
    description: "Axé vision stratégique & leadership",
  },
];

export function getSectionGroup(key: string): SectionGroupKey {
  const groupMap: Record<string, SectionGroupKey> = {
    pitch_30s: "Pitchs", pitch_2min: "Pitchs", pitch_dc: "Pitchs",
    pitch_cm: "Pitchs", pitch_dnv: "Pitchs", pitch_dg: "Pitchs",
    resume_entreprise: "Contexte", enjeux_poste: "Contexte",
    pourquoi_poste: "Motivation", pourquoi_moi: "Motivation",
    questions_rh: "Questions", questions_manager: "Questions", questions_dg: "Questions",
    reponses_star: "Réponses",
    objections: "Objections", reponses_objections: "Objections",
    questions_recruteur: "À poser", questions_manager_poser: "À poser", questions_ceo: "À poser",
    negociation: "Négociation",
    points_forts: "Stratégie", points_sensibles: "Stratégie", gaps_expliques: "Stratégie",
    checklist: "Logistique",
  };
  return groupMap[key] || "Logistique";
}
