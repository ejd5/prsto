"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  BarChart3,
  Globe,
  Sparkles,
  Bell,
  Search,
  ChevronDown,
  MessageSquare,
  Heart,
  TrendingUp,
  User,
  BookOpen,
  Shield,
  Zap,
  Calendar,
  Crown,
  Send,
} from "lucide-react";
import { ToastProvider } from "@/components/ui/EltonToast";
import { UxModeProvider } from "@/lib/ux-mode";

// ── Navigation PRSTO V2 — 5 sections, vocabulaire "campagne dirigeant" ──
// Restructurée pour réduire la charge cognitive (4±2 chunks) et affirmer
// le positionnement executive. Le Conseiller (second brain IA) est mis
// en avant dans INTELLIGENCE + un CTA bas de sidebar.
const NAV_SECTIONS = [
  {
    title: "Campagne",
    items: [
      { href: "/", label: "Cockpit", icon: LayoutDashboard },
      { href: "/opportunites", label: "Pipelines ouverts", icon: Briefcase },
      { href: "/dashboard/jobs/pipeline", label: "Missions en cours", icon: BarChart3 },
      { href: "/dashboard/jobs/analytics", label: "Radar marché", icon: TrendingUp },
      { href: "/performance", label: "Indicateurs", icon: TrendingUp },
    ],
  },
  {
    title: "Arsenaux",
    items: [
      { href: "/cv-maitre", label: "CV Maître", icon: FileText },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/proof-vault", label: "Proof Vault", icon: Shield },
    ],
  },
  {
    title: "Training Camp",
    items: [
      { href: "/entretiens", label: "Entretiens", icon: Calendar },
      { href: "/mock-interview/panel", label: "Mocks", icon: MessageSquare },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/conseiller", label: "Conseiller IA", icon: Sparkles },
      { href: "/assistant-recherche", label: "Recherche IA", icon: Search },
      { href: "/ai-optimize", label: "CV AI", icon: Zap },
      { href: "/linkedin-optimizer", label: "LinkedIn Optimizer", icon: Globe },
    ],
  },
  {
    title: "Réglages",
    items: [
      { href: "/profil", label: "Mon Profil", icon: User },
      { href: "/parametres", label: "Paramètres", icon: Settings },
      { href: "/guide", label: "Guide", icon: BookOpen },
    ],
  },
];

import Image from "next/image";

function PRSTOLogo({ size = 56, fullWidth }: { size?: number; fullWidth?: boolean }) {
  if (fullWidth) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/branding/logo-prsto.png"
        alt="PRSTO"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    );
  }
  return (
    <Image
      src="/branding/logo-prsto.png"
      alt="PRSTO"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState("");
  const [profile, setProfile] = useState<{ fullName: string; title: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifCount] = useState(2); // Demo notification count

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.profile?.fullName) setProfile(d.profile);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.authenticated && d.user?.role) setUserRole(d.user.role);
    }).catch(() => {});
  }, []);

  const displayName = profile?.fullName || "Utilisateur";
  const displayTitle = profile?.title || "Cadre Dirigeant";
  const avatarInitial = (displayName || "R").charAt(0).toUpperCase();
  const firstName = displayName.split(" ")[0];

  const isPrintPage =
    pathname.endsWith("/print-cv") ||
    pathname.endsWith("/cv-print") ||
    pathname.endsWith("/print");

  if (isPrintPage) {
    return (
      <UxModeProvider>
      <ToastProvider>
        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
      </ToastProvider>
      </UxModeProvider>
    );
  }

  const isHome = pathname === "/";

  const pageTitle = (() => {
    if (pathname === "/") return "Cockpit";
    if (pathname.startsWith("/conseiller")) return "Conseiller IA";
    if (pathname.startsWith("/assistant-recherche")) return "Recherche IA";
    if (pathname.startsWith("/ai-optimize")) return "CV AI";
    if (pathname.startsWith("/linkedin-optimizer")) return "LinkedIn Optimizer";
    if (pathname.startsWith("/dashboard/jobs/analytics")) return "Radar Marché";
    if (pathname.startsWith("/dashboard/jobs/pipeline")) return "Missions en cours";
    if (pathname.startsWith("/dashboard/jobs")) return "Missions en cours";
    if (pathname.startsWith("/cv-maitre")) return "CV Maître";
    if (pathname.startsWith("/documents")) return "Documents";
    if (pathname.startsWith("/entretiens")) return "Entretiens";
    if (pathname.startsWith("/opportunites")) return "Pipelines ouverts";
    if (pathname.startsWith("/profil")) return "Mon Profil";
    if (pathname.startsWith("/performance")) return "Indicateurs";
    if (pathname.startsWith("/parametres")) return "Paramètres";
    if (pathname.startsWith("/demarrage")) return "Démarrage";
    if (pathname.startsWith("/guide")) return "Guide PRSTO";
    if (pathname.startsWith("/mock-interview")) return "Mocks";
    if (pathname.startsWith("/proof-vault")) return "Proof Vault";
    return "PRSTO";
  })();

  return (
    <UxModeProvider>
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>

        {/* ══ SIDEBAR — Fidèle aux maquettes PRSTO ══ */}
        <aside
          className="w-[250px] flex-shrink-0 flex flex-col"
          style={{
            background: "#0E3A29",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-center px-4 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.08)", minHeight: 56, background: "#0B2E21" }}
          >
            <Link href="/" className="block w-full max-w-[120px]">
              <PRSTOLogo fullWidth />
            </Link>
          </div>

          {/* Nav Sections */}
          <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-3 px-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div
                  className="px-2 pb-1 text-[9px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        className={`relative flex items-center gap-2.5 py-2 px-3 rounded-xl transition-all duration-200 text-[12.5px] font-medium group ${
                          isActive ? "nav-item-active" : ""
                        }`}
                        style={{
                          color: isActive ? "#F2B11A" : "rgba(255,255,255,0.65)",
                          background: isActive ? "rgba(242,177,26,0.12)" : "transparent",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                          if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
                        }}
                        onMouseLeave={e => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                          if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
                        }}
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                            style={{ width: 3, height: 18, background: "#F2B11A" }}
                          />
                        )}
                        <Icon
                          size={14}
                          className="flex-shrink-0"
                          style={{ color: isActive ? "#F2B11A" : "rgba(255,255,255,0.45)" }}
                        />
                        <span>{item.label}</span>
                        {/* Badge for demo notifications on entretiens */}
                        {item.href === "/entretiens" && notifCount > 0 && (
                          <span
                            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "#F2B11A", color: "#0B1F18" }}
                          >
                            {notifCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom — Conseiller CTA + Premium Status + Profile */}
          <div
            className="px-3 py-4 border-t flex flex-col gap-3"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {/* Conseiller IA CTA — second brain accessible partout */}
            <Link
              href="/conseiller"
              className="rounded-xl p-3 space-y-1.5 block transition-all duration-200 hover:translate-y-[-1px]"
              style={{
                background: "linear-gradient(135deg, rgba(228,177,24,0.18) 0%, rgba(228,177,24,0.06) 100%)",
                border: "1px solid rgba(228,177,24,0.35)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "#F2C94C" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#F2C94C" }}>
                  Conseiller IA
                </span>
                <span
                  className="ml-auto text-[8.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{ background: "rgba(228,177,24,0.25)", color: "#F2C94C" }}
                >
                  Nouveau
                </span>
              </div>
              <p className="text-[9.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                Une question sur votre campagne ? Demandez à votre second brain.
              </p>
            </Link>

            {/* Premium CTA */}
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "linear-gradient(135deg, rgba(242,177,26,0.12) 0%, rgba(242,177,26,0.04) 100%)",
                border: "1px solid rgba(242,177,26,0.25)",
              }}
            >
              <div className="flex items-center gap-2">
                <Crown size={14} style={{ color: "#F2B11A" }} />
                <span className="text-[10px] font-bold text-[#F2B11A] uppercase tracking-wider">PRSTO Elite</span>
              </div>
              <p className="text-[9.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                Conseiller illimité, Mock Panel, coaching humain.
              </p>
              <Link href="/prsto/executive-brief" className="sidebar-premium-cta w-full">
                Passer Elite
              </Link>
            </div>

            {/* Profile row */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm"
                style={{ background: "#F2B11A", color: "#0B1F18" }}
              >
                {avatarInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">{displayName}</div>
                <div className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{displayTitle}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ MAIN AREA ══ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── TOP HEADER — matching brand mockups ── */}
          <header
            className="flex-shrink-0 flex items-center justify-between px-6 h-[56px] border-b"
            style={{ background: "white", borderColor: "rgba(14,56,38,0.08)" }}
          >
            {/* Page title */}
            <div>
              <div
                className="text-sm font-bold tracking-tight"
                style={{ color: "#0B1F18", fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)" }}
              >
                {pageTitle}
              </div>
            </div>

            {/* Search bar */}
            <div
              className="flex items-center gap-2 px-3 rounded-xl h-9 w-[280px] transition-all duration-200 focus-within:ring-2"
              style={{
                background: "#FAF6EF",
                border: "1px solid rgba(14,56,38,0.1)",
              }}
            >
              <Search size={13} style={{ color: "rgba(14,56,38,0.4)" }} className="flex-shrink-0" />
              <span className="text-xs flex-1" style={{ color: "rgba(14,56,38,0.4)" }}>
                Rechercher emplois, entreprises...
              </span>
              <kbd
                className="text-[10px] px-1.5 rounded font-mono"
                style={{ background: "rgba(14,56,38,0.06)", color: "rgba(14,56,38,0.4)" }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <button
                className="relative p-2 rounded-xl transition-colors duration-200"
                style={{ background: "transparent", color: "rgba(14,56,38,0.5)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAF6EF"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                title="Notifications"
              >
                <Bell size={16} />
                {notifCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "#F2B11A", color: "#0B1F18" }}
                  >
                    {notifCount}
                  </span>
                )}
              </button>

              {/* Time */}
              <span className="text-[11px] font-mono" style={{ color: "rgba(14,56,38,0.35)" }}>
                {currentTime}
              </span>

              {/* User profile button */}
              <button
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200"
                style={{
                  background: "#FAF6EF",
                  borderColor: "rgba(14,56,38,0.1)",
                  color: "#0B1F18",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(242,177,26,0.4)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,56,38,0.1)"}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                  style={{ background: "#0E3A29", color: "#F2B11A" }}
                >
                  {avatarInitial}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-semibold" style={{ color: "#0B1F18" }}>{firstName}</div>
                </div>
                <ChevronDown size={11} style={{ color: "rgba(14,56,38,0.4)" }} />
              </button>
            </div>
          </header>

          {/* ── CONTENT ── */}
          <div className="flex-1 overflow-hidden flex">
            <main className="flex-1 overflow-y-auto">
              <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
            </main>

            {isHome && (
              <aside
                className="w-[280px] flex-shrink-0 flex flex-col overflow-y-auto border-l"
                style={{ background: "white", borderColor: "rgba(14,56,38,0.08)" }}
              >
                <AICopilotSidebar />
              </aside>
            )}
          </div>
        </div>
      </div>
    </ToastProvider>
    </UxModeProvider>
  );
}

// ── AI Copilot Sidebar Panel ──
function AICopilotSidebar() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUICK_ACTIONS = [
    { icon: "📋", label: "Generate Executive Brief", sub: "Synthèse de vos opportunités" },
    { icon: "📊", label: "Market & Role Intelligence", sub: "Analyse des offres en cours" },
    { icon: "🎙️", label: "Interview Prep Studio", sub: "Préparation entretien" },
    { icon: "📄", label: "Document Generation", sub: "CV et lettre de motivation" },
    { icon: "🧠", label: "Strategic Recommendations", sub: "Prochaines actions" },
  ];

  const handleSend = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;
    setMessages((prev) => [...prev, { sender: "user", text: cleanText }]);
    setMessage("");
    setIsTyping(true);
    setError(null);
    try {
      const { getCopilotResponse } = await import("@/lib/actions/ai-copilot");
      const result = await getCopilotResponse(cleanText);
      setMessages((prev) => [...prev, { sender: "ai", text: result.content }]);
      if (result.error && result.source === "no_key") {
        setError("DeepSeek non configuré — réponses basées sur vos données locales");
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
      setError("Erreur de communication avec le serveur");
    }
    setIsTyping(false);
  };

  return (
    <>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b"
        style={{ borderColor: "rgba(14,56,38,0.08)" }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#F2B11A" }}>✦</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#0B1F18" }}>
            PRSTO Copilot
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
          Online
        </span>
      </div>

      {messages.length === 0 ? (
        <>
          <div className="px-4 py-4 flex-shrink-0 border-b" style={{ borderColor: "rgba(14,56,38,0.08)" }}>
            <h2
              className="text-base font-bold leading-snug"
              style={{
                color: "#0B1F18",
                fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
              }}
            >
              Bonjour.
            </h2>
            <p className="text-xs mt-1" style={{ color: "rgba(14,56,38,0.5)" }}>
              Comment puis-je vous guider aujourd'hui ?
            </p>
          </div>

          <div className="px-3 py-3 flex-shrink-0 space-y-1.5 border-b" style={{ borderColor: "rgba(14,56,38,0.08)" }}>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.label)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200"
                style={{
                  background: "#FAF6EF",
                  borderColor: "rgba(14,56,38,0.08)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(242,177,26,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(242,177,26,0.04)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,56,38,0.08)";
                  (e.currentTarget as HTMLElement).style.background = "#FAF6EF";
                }}
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-medium leading-tight" style={{ color: "#0B1F18" }}>
                    {action.label}
                  </div>
                  <div className="text-[10px] mt-px" style={{ color: "rgba(14,56,38,0.45)" }}>
                    {action.sub}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-0 flex flex-col">
          <div className="flex justify-between items-center px-1 flex-shrink-0">
            <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: "rgba(14,56,38,0.35)" }}>
              Discussion
            </span>
            <button
              onClick={() => setMessages([])}
              className="text-[10px] font-mono transition-colors"
              style={{ color: "rgba(14,56,38,0.35)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#0B1F18"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(14,56,38,0.35)"}
            >
              Réinitialiser
            </button>
          </div>

          {error && (
            <div
              className="flex-shrink-0 px-2 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(242,177,26,0.08)", color: "#D4A017" }}
            >
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-3 flex-1">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] rounded-xl p-2.5 text-xs ${
                  msg.sender === "user" ? "self-end ml-auto" : "self-start mr-auto"
                }`}
                style={{
                  background: msg.sender === "user" ? "#0E3A29" : "#FAF6EF",
                  color: msg.sender === "user" ? "white" : "#0B1F18",
                  border: msg.sender === "ai" ? "1px solid rgba(14,56,38,0.08)" : "none",
                }}
              >
                {msg.text.split("\n").map((line, lidx) => (
                  <p key={lidx} className={lidx > 0 ? "mt-1.5" : ""}>
                    {line.split("**").map((chunk, cidx) =>
                      cidx % 2 === 1
                        ? <strong key={cidx} style={{ color: "#F2B11A" }}>{chunk}</strong>
                        : chunk
                    )}
                  </p>
                ))}
              </div>
            ))}

            {isTyping && (
              <div
                className="flex items-center gap-1.5 self-start mr-auto rounded-xl border p-2.5 text-xs"
                style={{ background: "#FAF6EF", borderColor: "rgba(14,56,38,0.08)" }}
              >
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "#F2B11A",
                        animation: `pulse-or 1s ease-in-out ${d}ms infinite`,
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono" style={{ color: "rgba(14,56,38,0.45)" }}>PRSTO réfléchit...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-3 py-3 flex-shrink-0 border-t" style={{ borderColor: "rgba(14,56,38,0.08)" }}>
        <div
          className="flex items-center gap-2 px-3 rounded-xl h-[38px] transition-all duration-200"
          style={{
            background: "#FAF6EF",
            border: "1px solid rgba(14,56,38,0.1)",
          }}
          onFocus={() => {}}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(message); }}
            placeholder="Posez votre question..."
            className="flex-1 bg-transparent border-none outline-none text-xs"
            style={{ color: "#0B1F18" }}
          />
          <button
            onClick={() => handleSend(message)}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "#0E3A29" }}
          >
            <Send size={10} color="#F2B11A" />
          </button>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex-1 px-4 py-5 flex flex-col justify-end">
          <div
            className="p-4 rounded-xl"
            style={{ background: "rgba(242,177,26,0.05)", border: "1px solid rgba(242,177,26,0.12)" }}
          >
            <div className="text-[22px] leading-none mb-2" style={{ color: "#F2B11A" }}>"</div>
            <p className="italic text-xs leading-relaxed" style={{ color: "rgba(14,56,38,0.6)" }}>
              Votre prochain poste ne se trouve pas.<br />Il se prépare.<br />
              <strong style={{ color: "#0B1F18" }}>PRSTO : le copilote carrière des cadres dirigeants.</strong>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 rounded-full border-2 border-t-[#F2B11A] animate-spin" style={{ borderColor: "rgba(242,177,26,0.2)", borderTopColor: "#F2B11A" }} />
    </div>
  );
}
