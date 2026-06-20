"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  LayoutDashboard,
  User,
  Shield,
  Briefcase,
  Search,
  FileText,
  Columns,
  Settings,
  BarChart3,
  BookOpen,
  Calendar,
  FlaskConical,
  ClipboardCheck,
  TrendingUp,
  Sparkles,
  Play,
  Radar,
  GitBranch,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/elton-os", label: "ELTON OS", icon: Sparkles },
  { href: "/demarrage", label: "Démarrage guidé", icon: Sparkles },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/cv-maitre", label: "CV Maître", icon: FileText },
  { href: "/proof-vault", label: "Proof Vault", icon: Shield },
  { href: "/sources", label: "Sources", icon: Search },
  { href: "/opportunites", label: "Opportunités", icon: Briefcase },
  { href: "/analyse", label: "Analyse", icon: BarChart3 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/pipeline", label: "Pipeline", icon: Columns },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/entretiens", label: "Entretiens", icon: Calendar },
  { href: "/parametres", label: "Paramètres", icon: Settings },
  { href: "/guide", label: "Guide complet", icon: BookOpen },
  { href: "/quality-check", label: "Qualité doc", icon: ClipboardCheck },
  { href: "/test-flow", label: "Test flow", icon: FlaskConical },
  { href: "/first-run", label: "First run", icon: Play },
  { href: "/dashboard/jobs", label: "Sourcing", icon: Radar },
  { href: "/dashboard/jobs/pipeline", label: "Pipeline offres", icon: GitBranch },
  { href: "/dashboard/jobs/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "var(--bordure)", background: "var(--fond-surface)" }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: "var(--bordure)" }}>
          <span className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: "var(--or)" }}>
            ELTON OS
          </span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--or)", opacity: 0.6 }} />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors"
                style={{
                  color: isActive ? "var(--texte)" : "var(--texte-secondaire)",
                  background: isActive ? "var(--or-faible)" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="ml-auto"
                    style={{
                      width: 3,
                      height: 14,
                      borderRadius: 2,
                      background: "var(--or)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-3 border-t text-xs" style={{ borderColor: "var(--bordure)", color: "var(--texte-tertiaire)" }}>
          <span className="font-mono">v0.1.0 · MVP</span>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--fond)" }}>
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--or)", borderTopColor: "transparent" }} /></div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
