"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Users, Mail, Crown, Shield, TrendingUp, Settings, Plus, Copy, Check, AlertTriangle } from "lucide-react";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  plan: string;
  status: string;
  primaryColor: string;
  logoUrl?: string;
  customDomain?: string;
  commissionRate: number;
  totalCommission: number;
}

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image?: string | null;
  role: string;
  status: string;
  invitedAt: string;
  joinedAt: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface Stats {
  members: { total: number; active: number; invited: number; admins: number; reviewers: number };
  seats: { used: number; limit: number; remaining: number };
  recentActivity: Array<{ type: string; date: string; user: string }>;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  recruitment: "Cabinet de recrutement",
  business_school: "Business school",
  coach: "Coach carrière",
  outplacement: "Cabinet d'outplacement",
  association: "Association",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "#F59E0B" },
  reviewer: { label: "Reviewer", color: "#3B82F6" },
  member: { label: "Membre", color: "#9CA3AF" },
};

export default function EnterpriseDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fond)" }}><Loader2 className="animate-spin" /></div>}>
      <EnterpriseDashboardInner />
    </Suspense>
  );
}

function EnterpriseDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [welcomeBanner, setWelcomeBanner] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "reviewer" | "admin">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ url?: string; error?: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "recruitment" as "recruitment" | "business_school" | "coach" | "outplacement" | "association",
    plan: "growth" as "starter" | "growth" | "enterprise",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, membersRes, invitesRes] = await Promise.all([
        fetch("/api/enterprise/stats"),
        fetch("/api/enterprise/members"),
        fetch("/api/enterprise/invite"),
      ]);

      if (statsRes.status === 403) {
        // Not an admin yet — show create form
        setOrg(null);
        setLoading(false);
        return;
      }

      if (!statsRes.ok) {
        setError("Erreur de chargement");
        setLoading(false);
        return;
      }

      const statsData = await statsRes.json();
      const membersData = await membersRes.json();
      const invitesData = await invitesRes.json();

      setOrg(statsData.org);
      setStats({
        members: statsData.members,
        seats: statsData.seats,
        recentActivity: statsData.recentActivity,
      });
      setMembers(membersData.members || []);
      setInvitations(invitesData.invitations || []);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setWelcomeBanner(true);
      setTimeout(() => setWelcomeBanner(false), 5000);
    }
    if (searchParams.get("error")) {
      setError(searchParams.get("error"));
    }
    load();
  }, [searchParams, load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteResult({ error: "Email invalide" });
      return;
    }
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/enterprise/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteResult({ error: data.error || "Erreur" });
      } else {
        setInviteResult({ url: data.invitation.acceptUrl });
        setInviteEmail("");
        setInviteRole("member");
        load(); // refresh invitations list
      }
    } catch {
      setInviteResult({ error: "Erreur réseau" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleMemberAction = async (memberId: string, action: "promote_admin" | "demote_member" | "promote_reviewer" | "remove") => {
    if (!confirm(`Confirmer l'action: ${action} ?`)) return;
    setActionLoading(memberId);
    try {
      const res = await fetch("/api/enterprise/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, action }),
      });
      if (res.ok) load();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setError("Nom requis");
      return;
    }
    setCreateLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enterprise/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      load();
    } catch {
      setError("Erreur réseau");
    } finally {
      setCreateLoading(false);
    }
  };

  const copyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fond)" }}>
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--prsto-forest)" }} />
      </div>
    );
  }

  // No org yet — show create form
  if (!org && !showCreateForm) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <Crown size={48} className="mx-auto mb-4" style={{ color: "var(--prsto-forest)" }} />
          <h1 className="font-serif text-3xl mb-3" style={{ color: "var(--prsto-forest)" }}>
            Créez votre organisation
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--texte-secondaire)" }}>
            Vous n'êtes pas encore admin d'une organisation. Créez la vôtre pour commencer à inviter des membres et profiter du white-label PRSTO.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            style={{ background: "var(--prsto-forest)", color: "#FFF" }}
          >
            <Plus size={16} /> Créer mon organisation
          </button>
          <div className="mt-6">
            <Link href="/prsto/enterprise" className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
              ← En savoir plus sur PRSTO Enterprise
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Create form
  if (showCreateForm && !org) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ background: "var(--prsto-ivory)" }}>
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl p-8" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <h1 className="font-serif text-2xl mb-2" style={{ color: "var(--prsto-forest)" }}>
              Créer mon organisation
            </h1>
            <p className="text-xs mb-6" style={{ color: "var(--texte-tertiaire)" }}>
              Configuration en 1 minute. Vous serez admin automatiquement.
            </p>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-mono mb-1.5 uppercase" style={{ color: "var(--texte-secondaire)" }}>Nom de l'organisation *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Cabinet Dupont Executive"
                  required
                  className="w-full p-3 rounded-lg text-sm outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--texte-tertiaire)" }}>
                  Sera utilisé pour générer votre subdomain: cabinet-dupont-executive.prsto.ai
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5 uppercase" style={{ color: "var(--texte-secondaire)" }}>Type d'organisation *</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as "recruitment" | "business_school" | "coach" | "outplacement" | "association" })}
                  className="w-full p-3 rounded-lg text-sm outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
                >
                  <option value="recruitment">Cabinet de recrutement</option>
                  <option value="business_school">Business school</option>
                  <option value="coach">Coach carrière</option>
                  <option value="outplacement">Cabinet d'outplacement</option>
                  <option value="association">Association executives</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono mb-1.5 uppercase" style={{ color: "var(--texte-secondaire)" }}>Plan</label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value as "starter" | "growth" | "enterprise" })}
                  className="w-full p-3 rounded-lg text-sm outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
                >
                  <option value="starter">Starter — 499€/mois, 20 sièges</option>
                  <option value="growth">Growth — 1499€/mois, 100 sièges</option>
                  <option value="enterprise">Enterprise — Sur devis, illimité</option>
                </select>
              </div>

              {error && (
                <div className="text-xs p-3 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "var(--prsto-forest)", color: "#FFF" }}
                >
                  {createLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Créer l'organisation
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!org || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--fond)" }}>
        <p style={{ color: "var(--texte-tertiaire)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "var(--prsto-ivory)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Welcome banner */}
        {welcomeBanner && (
          <div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <Check size={20} style={{ color: "#10B981" }} />
            <p className="text-sm" style={{ color: "#065f46" }}>
              Bienvenue dans votre dashboard enterprise ! Vous pouvez maintenant inviter des membres.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl p-6 mb-6 flex items-start justify-between" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ background: org.primaryColor, color: "#FFF" }}
            >
              {org.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-serif text-2xl mb-1" style={{ color: "var(--texte)" }}>{org.name}</h1>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded font-mono" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                  {PLAN_LABELS[org.plan] || org.plan}
                </span>
                <span style={{ color: "var(--texte-tertiaire)" }}>
                  {ORG_TYPE_LABELS[org.type] || org.type}
                </span>
                <span style={{ color: "var(--texte-tertiaire)" }}>
                  Slug: <code className="px-1 py-0.5 rounded" style={{ background: "#F9FAFB" }}>{org.slug}</code>
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: "var(--texte-tertiaire)" }}>
              Commission accumulée
            </div>
            <div className="text-2xl font-bold" style={{ color: "#10B981" }}>
              {org.totalCommission.toFixed(2)}€
            </div>
            <div className="text-[10px]" style={{ color: "var(--texte-tertiaire)" }}>
              Taux: {(org.commissionRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl p-5" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <Users size={18} className="mb-2" style={{ color: "var(--prsto-forest)" }} />
            <div className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{stats.members.active}</div>
            <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Membres actifs</div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <Mail size={18} className="mb-2" style={{ color: "#F59E0B" }} />
            <div className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{stats.members.invited}</div>
            <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Invitations en attente</div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <Crown size={18} className="mb-2" style={{ color: "#7C3AED" }} />
            <div className="text-2xl font-bold" style={{ color: "var(--texte)" }}>{stats.members.admins}</div>
            <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Admins</div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
            <TrendingUp size={18} className="mb-2" style={{ color: "#10B981" }} />
            <div className="text-2xl font-bold" style={{ color: "var(--texte)" }}>
              {stats.seats.used}<span className="text-sm" style={{ color: "var(--texte-tertiaire)" }}>/<span>{stats.seats.limit === 999999 ? "∞" : stats.seats.limit}</span></span>
            </div>
            <div className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>Sièges utilisés</div>
          </div>
        </div>

        {/* Invite form */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wide" style={{ color: "var(--texte-secondaire)" }}>
              <Mail size={12} className="inline mr-1" /> Inviter un membre
            </h2>
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--prsto-forest)" }}
            >
              <Plus size={12} /> {showInviteForm ? "Annuler" : "Nouvelle invitation"}
            </button>
          </div>

          {showInviteForm && (
            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="p-2.5 rounded-lg text-sm outline-none md:col-span-2"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "member" | "reviewer" | "admin")}
                className="p-2.5 rounded-lg text-sm outline-none"
                style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "var(--texte)" }}
              >
                <option value="member">Membre</option>
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviteLoading}
                className="md:col-span-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "var(--prsto-forest)", color: "#FFF" }}
              >
                {inviteLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Envoyer l'invitation
              </button>
            </form>
          )}

          {inviteResult?.error && (
            <div className="text-xs p-3 rounded mb-3" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {inviteResult.error}
            </div>
          )}

          {inviteResult?.url && (
            <div className="text-xs p-3 rounded mb-3 flex items-center gap-2" style={{ background: "rgba(16,185,129,0.1)", color: "#065f46" }}>
              <Check size={14} />
              <span className="flex-1">Invitation créée. Partagez ce lien (valide 7 jours):</span>
              <code className="px-2 py-1 rounded text-[10px] flex-1 truncate" style={{ background: "#FFF", color: "var(--texte)" }}>
                {inviteResult.url}
              </code>
              <button
                onClick={() => copyInviteUrl(inviteResult.url!)}
                className="text-xs flex items-center gap-1"
                style={{ color: "var(--prsto-forest)" }}
              >
                {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                {copiedUrl ? "Copié" : "Copier"}
              </button>
            </div>
          )}

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: "var(--texte-tertiaire)" }}>
                Invitations en attente ({invitations.length})
              </div>
              <div className="space-y-2">
                {invitations.map((inv) => {
                  const role = ROLE_LABELS[inv.role] || { label: inv.role, color: "#666" };
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                      <div className="flex items-center gap-3">
                        <Mail size={14} style={{ color: "#F59E0B" }} />
                        <span className="text-sm" style={{ color: "var(--texte)" }}>{inv.email}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase" style={{ background: `${role.color}15`, color: role.color }}>
                          {role.label}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--texte-tertiaire)" }}>
                        Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Members list */}
        <div className="rounded-2xl p-6" style={{ background: "#FFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-sm font-mono uppercase tracking-wide mb-4" style={{ color: "var(--texte-secondaire)" }}>
            <Users size={12} className="inline mr-1" /> Membres ({members.length})
          </h2>
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: "var(--texte-tertiaire)" }}>
                Aucun membre. Invitez votre premier candidat ci-dessus.
              </p>
            ) : (
              members.map((m) => {
                const role = ROLE_LABELS[m.role] || { label: m.role, color: "#666" };
                const isActive = m.status === "active";
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: org.primaryColor, color: "#FFF" }}
                      >
                        {(m.name || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--texte)" }}>
                          {m.name || m.email.split("@")[0]}
                        </div>
                        <div className="text-xs truncate" style={{ color: "var(--texte-tertiaire)" }}>{m.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase" style={{ background: `${role.color}15`, color: role.color }}>
                        {role.label}
                      </span>
                      <span className="text-[10px]" style={{ color: isActive ? "#10B981" : "#F59E0B" }}>
                        {isActive ? "Actif" : "Invité"}
                      </span>
                      {actionLoading === m.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <select
                          value=""
                          onChange={(e) => e.target.value && handleMemberAction(m.id, e.target.value as "promote_admin" | "demote_member" | "promote_reviewer" | "remove")}
                          className="text-xs p-1 rounded outline-none"
                          style={{ background: "#FFF", border: "1px solid #E5E7EB", color: "var(--texte-secondaire)" }}
                        >
                          <option value="">Actions…</option>
                          {m.role !== "admin" && <option value="promote_admin">→ Admin</option>}
                          {m.role !== "reviewer" && <option value="promote_reviewer">→ Reviewer</option>}
                          {m.role !== "member" && <option value="demote_member">→ Membre</option>}
                          <option value="remove">Retirer</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs" style={{ color: "var(--texte-tertiaire)" }}>
          <p>
            Besoin d'aide ? <a href="mailto:enterprise@prsto.ai" style={{ color: "var(--prsto-forest)" }}>enterprise@prsto.ai</a>
            {" · "}
            <Link href="/prsto/enterprise" style={{ color: "var(--prsto-forest)" }}>Voir les features Enterprise</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
