"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile } from "@/lib/actions/profile";
import { getCVMaster } from "@/lib/actions/cv-master";
import { getOpportunities } from "@/lib/actions/opportunity";
import {
  Briefcase,
  FileText,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Bell,
  ChevronRight,
  Target,
  Zap,
  Shield,
  Star,
  Building2,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface DashboardData {
  profileName: string;
  profileTitle: string;
  cvStatus: string | null;
  totalOpportunities: number;
  matchingCount: number;
  interviewCount: number;
  applicationCount: number;
  responseRate: number;
  recentOpps: Array<{
    id: string;
    title: string;
    company: string;
    scoreGlobal: number | null;
    status: string;
    country: string | null;
  }>;
  pipelineCounts: Record<string, number>;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#F2B11A";
  if (score >= 50) return "#f97316";
  return "#ef4444";
};

const PIPELINE_STAGES = [
  { key: "nouveau", label: "Opportunités découvertes", color: "#60A5FA" },
  { key: "postule", label: "Candidatures envoyées", color: "#F2B11A" },
  { key: "entretien", label: "En entretien", color: "#22c55e" },
  { key: "offre", label: "Offres reçues", color: "#a855f7" },
];

const UPCOMING_INTERVIEWS = [
  { date: "15 MAI", time: "14:00", title: "Directeur Industriel", company: "Industrie Performance — Paris", type: "Visioconférence", typeColor: "#60A5FA" },
  { date: "19 MAI", time: "10:30", title: "Directeur des Opérations", company: "TechBuild — Lyon", type: "Sur site", typeColor: "#22c55e" },
  { date: "23 MAI", time: "16:00", title: "Directeur de Production", company: "Green Solutions — Paris", type: "Visioconférence", typeColor: "#60A5FA" },
];

const ALERTS = [
  { text: "Nouvelle opportunité premium correspondant à votre profil", time: "Il y a 1h", icon: "🎯", color: "#F2B11A" },
  { text: "Entretien confirmé demain à 14h00 avec Industrie Performance", time: "Il y a 3h", icon: "📅", color: "#22c55e" },
  { text: "Votre profil a été vu par 5 recruteurs cette semaine", time: "Il y a 5h", icon: "👀", color: "#60A5FA" },
];

// Circular gauge SVG component
function CircularGauge({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(14,56,38,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={value >= 85 ? "#22c55e" : "#F2B11A"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.32, 0.72, 0, 1) 0.3s" }}
      />
    </svg>
  );
}

// Mini sparkline (SVG-based simple chart)
function MiniSparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const width = 120;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const polyline = points.join(" ");
  const areaPoints = [
    `0,${height}`,
    ...points,
    `${width},${height}`,
  ].join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile();
        const cv = profile ? await getCVMaster(profile.id) : null;
        const opportunities = await getOpportunities({});

        const opps = Array.isArray(opportunities) ? opportunities : [];
        const recentOpps = opps.slice(0, 6).map((o: Record<string, unknown>) => ({
          id: o.id as string,
          title: o.title as string,
          company: o.company as string,
          scoreGlobal: (o.scoreGlobal as number) ?? null,
          status: o.status as string,
          country: (o.country as string) ?? null,
        }));

        const pipelineCounts: Record<string, number> = {};
        for (const o of opps) {
          const s = (o.status as string) || "nouveau";
          pipelineCounts[s] = (pipelineCounts[s] || 0) + 1;
        }

        const matchingCount = opps.filter((o: Record<string, unknown>) => ((o.scoreGlobal as number) ?? 0) >= 70).length;
        const interviewCount = opps.filter((o: Record<string, unknown>) => o.status === "entretien").length;
        const applicationCount = opps.filter((o: Record<string, unknown>) =>
          ["postule", "relance", "entretien", "offre"].includes(o.status as string)
        ).length;

        setData({
          profileName: (profile as Record<string, unknown>)?.fullName as string || "Alexandre",
          profileTitle: (profile as Record<string, unknown>)?.title as string || "Cadre Dirigeant",
          cvStatus: (cv as Record<string, unknown>)?.status as string || null,
          totalOpportunities: opps.length,
          matchingCount,
          interviewCount,
          applicationCount,
          responseRate: opps.length > 0 ? Math.round((applicationCount / opps.length) * 100) : 0,
          recentOpps,
          pipelineCounts,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Profile strength computation (demo)
  const profileStrength = 87;
  const profileBreakdown = [
    { label: "Complétude du profil", value: 90 },
    { label: "Compétences clés", value: 85 },
    { label: "Expérience & réalisations", value: 88 },
    { label: "Visibilité auprès des recruteurs", value: 82 },
  ];

  const sparklineData = [62, 65, 70, 68, 75, 81, 87, 92];

  if (loading) {
    return (
      <div className="p-6 space-y-5 animate-fade-in-up">
        <div className="h-7 w-64 rounded-lg animate-pulse" style={{ background: "rgba(14,56,38,0.08)" }} />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(14,56,38,0.05)" }} />
          ))}
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr 1fr" }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(14,56,38,0.05)" }} />
          ))}
        </div>
      </div>
    );
  }

  const firstName = (data?.profileName || "Alexandre").split(" ")[0];

  return (
    <div className="p-6 space-y-5 animate-fade-in-up overflow-y-auto" style={{ background: "#FAF6EF" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium mb-1" style={{ color: "rgba(14,56,38,0.45)" }}>
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{
              color: "#0B1F18",
              fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
            }}
          >
            Bonjour {firstName},
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(14,56,38,0.5)" }}>
            Voici votre tableau de bord exécutif.
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(14,56,38,0.4)" }}>
            Pilotez vos opportunités, renforcez votre position et avancez avec clarté.
          </p>
        </div>
      </div>

      {/* ── 4 Metric Cards ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          {
            label: "OPPORTUNITÉS ACTIVES",
            value: data?.totalOpportunities ?? 0,
            trend: "+6 cette semaine",
            trendUp: true,
            icon: Briefcase,
            iconBg: "#EEF7F2",
            iconColor: "#0E3A29",
            href: "/opportunites",
          },
          {
            label: "CANDIDATURES EN COURS",
            value: data?.applicationCount ?? 0,
            trend: "+2 cette semaine",
            trendUp: true,
            icon: FileText,
            iconBg: "#FFF8E8",
            iconColor: "#D4A017",
            href: "/dashboard/jobs/pipeline",
          },
          {
            label: "ENTRETIENS À VENIR",
            value: data?.interviewCount ?? 0,
            trend: "Prochain : Demain 14:00",
            trendUp: null,
            icon: Calendar,
            iconBg: "#EFF6FF",
            iconColor: "#3B82F6",
            href: "/entretiens",
          },
          {
            label: "TAUX DE RÉPONSE",
            value: `${data?.responseRate ?? 0}%`,
            trend: "+12% vs semaine passée",
            trendUp: true,
            icon: TrendingUp,
            iconBg: "#F0FFF4",
            iconColor: "#22c55e",
            href: "/performance",
          },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="metric-card-executive group animate-entrance"
              style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <Icon size={18} style={{ color: card.iconColor }} />
                </div>
                <ArrowUpRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#F2B11A" }}
                />
              </div>
              <div
                className="text-3xl font-black tracking-tight"
                style={{
                  color: "#0B1F18",
                  fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
                }}
              >
                {card.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider mt-1 mb-2" style={{ color: "rgba(14,56,38,0.4)" }}>
                {card.label}
              </div>
              {card.trend && (
                <div className="flex items-center gap-1">
                  {card.trendUp !== null && (
                    <ArrowUp
                      size={10}
                      style={{ color: card.trendUp ? "#22c55e" : "#ef4444" }}
                    />
                  )}
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: card.trendUp !== null ? (card.trendUp ? "#22c55e" : "#ef4444") : "rgba(14,56,38,0.4)" }}
                  >
                    {card.trend}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Row 2: Profile Strength + Score Match + Pipeline ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>

        {/* Force du Profil — circular gauge */}
        <div className="dashboard-widget p-5 animate-entrance-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(14,56,38,0.45)" }}>
              Force du Profil
            </h3>
            <Link
              href="/profil"
              className="text-[10px] font-semibold flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ color: "#F2B11A" }}
            >
              Optimiser <ArrowRight size={10} />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Gauge */}
            <div className="relative flex-shrink-0">
              <CircularGauge value={profileStrength} size={100} strokeWidth={9} />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              >
                <span className="text-xl font-black" style={{ color: "#0B1F18" }}>{profileStrength}%</span>
                <span className="text-[8px] font-bold uppercase" style={{ color: "#22c55e" }}>Excellent</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-2">
              {profileBreakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px]" style={{ color: "rgba(14,56,38,0.5)" }}>{item.label}</span>
                    <span className="text-[9px] font-bold" style={{ color: "#0B1F18" }}>{item.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(14,56,38,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.value}%`,
                        background: item.value >= 85 ? "#22c55e" : "#F2B11A",
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-4 px-3 py-2 rounded-xl text-[10px] leading-relaxed"
            style={{ background: "rgba(242,177,26,0.06)", color: "rgba(14,56,38,0.6)" }}
          >
            💡 <strong style={{ color: "#0B1F18" }}>Recommandation :</strong> Ajoutez 2 réalisations chiffrées pour atteindre 90%.
          </div>
        </div>

        {/* Score de Match Global */}
        <div className="dashboard-widget p-5 animate-entrance-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(14,56,38,0.45)" }}>
              Score de Match Global
            </h3>
            <Link href="/opportunites" className="text-[10px] font-semibold" style={{ color: "#F2B11A" }}>
              Voir tout →
            </Link>
          </div>

          <div className="mb-3">
            <div
              className="text-4xl font-black"
              style={{
                color: "#22c55e",
                fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
              }}
            >
              {data?.matchingCount ?? 0} offres
            </div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "#22c55e" }}>à fort matching (≥70%)</div>
            <p className="text-[10px] mt-1" style={{ color: "rgba(14,56,38,0.45)" }}>
              Ce score est basé sur vos compétences, expériences et préférences.
            </p>
          </div>

          {/* Sparkline */}
          <div className="flex items-end gap-2 mt-4">
            <MiniSparkline data={sparklineData} color="#22c55e" height={48} />
            <div className="flex-1">
              <div className="flex justify-between text-[9px]" style={{ color: "rgba(14,56,38,0.35)" }}>
                <span>Il y a 2 sem.</span>
                <span>Il y a 1 sem.</span>
                <span>Aujourd'hui</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline de Candidatures */}
        <div className="dashboard-widget p-5 animate-entrance-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(14,56,38,0.45)" }}>
              Pipeline de Candidatures
            </h3>
            <Link href="/dashboard/jobs/pipeline" className="text-[10px] font-semibold" style={{ color: "#F2B11A" }}>
              Voir le pipeline →
            </Link>
          </div>

          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage, i) => {
              const count = data?.pipelineCounts[stage.key] || (i === 0 ? data?.totalOpportunities || 0 : 0);
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: stage.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium" style={{ color: "rgba(14,56,38,0.6)" }}>
                        {stage.label}
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: "#0B1F18" }}>{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="mt-4 pt-3 border-t text-[10px]"
            style={{ borderColor: "rgba(14,56,38,0.06)", color: "rgba(14,56,38,0.4)" }}
          >
            Total : <strong style={{ color: "#0B1F18" }}>{data?.totalOpportunities ?? 0}</strong> opportunités suivies
          </div>
        </div>
      </div>

      {/* ── Row 3: Top Opportunities + Alerts + Interviews ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.8fr 1fr 1fr" }}>

        {/* Top Opportunités */}
        <div className="dashboard-widget animate-entrance-5">
          <div
            className="px-5 py-3 flex items-center justify-between border-b"
            style={{ borderColor: "rgba(14,56,38,0.06)" }}
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(14,56,38,0.45)" }}>
              Top Opportunités pour vous
            </h3>
            <Link
              href="/opportunites"
              className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: "#F2B11A" }}
            >
              Tout voir <ArrowRight size={10} />
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(14,56,38,0.04)" }}>
            {data?.recentOpps.length === 0 ? (
              <div className="py-10 text-center px-5">
                <Briefcase size={24} className="mx-auto mb-2" style={{ color: "rgba(14,56,38,0.15)" }} />
                <p className="text-sm font-medium" style={{ color: "#0B1F18" }}>Aucune offre pour le moment</p>
                <p className="text-[11px] mt-1 max-w-xs mx-auto" style={{ color: "rgba(14,56,38,0.4)" }}>
                  Importez vos offres depuis LinkedIn ou vos sources.
                </p>
                <Link
                  href="/opportunites"
                  className="inline-flex items-center gap-1 mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "#0E3A29", color: "#F2B11A" }}
                >
                  <Zap size={11} /> Importer des offres
                </Link>
              </div>
            ) : data?.recentOpps.map((opp, idx) => {
              const score = opp.scoreGlobal ?? 0;
              const scoreColor = SCORE_COLOR(score);
              return (
                <Link
                  key={opp.id}
                  href={`/opportunites/${opp.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 group"
                  style={{ background: "white" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAF6EF"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}
                >
                  {/* Score badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${scoreColor}12`, color: scoreColor }}
                  >
                    {opp.scoreGlobal ?? "—"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold truncate" style={{ color: "#0B1F18" }}>
                      {opp.title}
                    </div>
                    <div className="text-[10.5px] flex items-center gap-1 mt-0.5" style={{ color: "rgba(14,56,38,0.5)" }}>
                      <Building2 size={9} />
                      {opp.company}
                      {opp.country && (
                        <>
                          <span style={{ color: "rgba(14,56,38,0.25)" }}>·</span>
                          <MapPin size={9} />
                          {opp.country}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score percent + status */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    {opp.scoreGlobal && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${scoreColor}12`, color: scoreColor }}
                      >
                        {opp.scoreGlobal}% match
                      </span>
                    )}
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(242,177,26,0.1)", color: "#D4A017" }}
                    >
                      Premium
                    </span>
                  </div>

                  <ExternalLink
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: "rgba(14,56,38,0.35)" }}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Alertes */}
        <div className="dashboard-widget animate-entrance-6">
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{ borderColor: "rgba(14,56,38,0.06)" }}
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(14,56,38,0.45)" }}>
              Alertes
            </h3>
            <Link href="/opportunites" className="text-[10px] font-semibold" style={{ color: "#F2B11A" }}>
              Tout voir →
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(14,56,38,0.04)" }}>
            {ALERTS.map((alert, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: `${alert.color}12` }}
                >
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] leading-relaxed" style={{ color: "#0B1F18" }}>{alert.text}</p>
                  <span className="text-[9px] mt-0.5 block" style={{ color: "rgba(14,56,38,0.35)" }}>{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendrier Entretiens */}
        <div className="dashboard-widget animate-entrance-7">
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{ borderColor: "rgba(14,56,38,0.06)" }}
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(14,56,38,0.45)" }}>
              Calendrier Entretiens
            </h3>
            <Link href="/entretiens" className="text-[10px] font-semibold" style={{ color: "#F2B11A" }}>
              Tout voir →
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(14,56,38,0.04)" }}>
            {UPCOMING_INTERVIEWS.map((iv, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                {/* Date block */}
                <div
                  className="text-center flex-shrink-0 w-12 py-1.5 rounded-xl"
                  style={{ background: "rgba(14,56,38,0.05)" }}
                >
                  <div className="text-[8px] font-bold uppercase" style={{ color: "rgba(14,56,38,0.4)" }}>
                    {iv.date.split(" ")[1]}
                  </div>
                  <div className="text-base font-black" style={{ color: "#0B1F18" }}>
                    {iv.date.split(" ")[0]}
                  </div>
                  <div className="text-[9px]" style={{ color: "rgba(14,56,38,0.5)" }}>{iv.time}</div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-semibold leading-tight" style={{ color: "#0B1F18" }}>{iv.title}</p>
                  <p className="text-[9.5px] mt-0.5" style={{ color: "rgba(14,56,38,0.5)" }}>{iv.company}</p>
                  <span
                    className="inline-block mt-1 text-[8.5px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${iv.typeColor}12`, color: iv.typeColor }}
                  >
                    {iv.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer Banner ── */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between animate-entrance-8"
        style={{ background: "#0E3A29" }}
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none" style={{ color: "#F2B11A" }}>"</div>
          <p className="text-sm italic leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            Les bonnes opportunités ne se trouvent pas.<br />
            <strong style={{ color: "white" }}>Elles se reconnaissent.</strong>
          </p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          {[
            { icon: Shield, text: "Sélection rigoureuse", sub: "Opportunités qualifiées" },
            { icon: Target, text: "Processus confidentiel", sub: "Discrétion garantie" },
            { icon: Star, text: "Support dédié", sub: "Experts à vos côtés" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="text-center">
                <Icon size={18} className="mx-auto mb-1" style={{ color: "rgba(255,255,255,0.5)" }} />
                <div className="text-[9.5px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{item.text}</div>
                <div className="text-[8.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.sub}</div>
              </div>
            );
          })}
        </div>
        <Link
          href="/assistant-recherche"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: "#F2B11A", color: "#0B1F18" }}
        >
          Prendre rendez-vous →
        </Link>
      </div>

    </div>
  );
}
