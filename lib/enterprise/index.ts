/**
 * PRSTO Enterprise lib
 * ===================
 * Helpers for organizations (white-label, invitations, members, stats).
 *
 * Better than Rezi:
 * - FR/EN/ES multi-language (Rezi: EN only)
 * - Executive-focused (cabinets recrutement exec, business schools, coaches)
 * - Higher commission rate (70% like Rezi but with executive-tier pricing → higher absolute €)
 */

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { randomBytes } from "crypto";

// ─── Types ─────────────────────────────────────────────────
export type OrgType = "recruitment" | "business_school" | "coach" | "outplacement" | "association";
export type OrgPlan = "starter" | "growth" | "enterprise";
export type MemberRole = "admin" | "reviewer" | "member";

export const ORG_TYPES: Array<{ id: OrgType; label: string; description: string }> = [
  { id: "recruitment", label: "Cabinet de recrutement", description: "Cabinets executive (Spencer Stuart, Egon Zehnder, etc.)" },
  { id: "business_school", label: "Business school", description: "HEC, INSEAD, ESSEC, EDHEC career centers" },
  { id: "coach", label: "Coach carrière executive", description: "Coaches indépendants certifiés" },
  { id: "outplacement", label: "Cabinet d'outplacement", description: "LHH, Page Executive, Michael Page" },
  { id: "association", label: "Association executives", description: "FrenchTech, INSEAD Alumni, etc." },
];

export const ORG_PLANS: Array<{ id: OrgPlan; label: string; price: number; seats: number; features: string[] }> = [
  {
    id: "starter",
    label: "Starter",
    price: 499,
    seats: 20,
    features: [
      "20 sièges inclus",
      "White-label (logo + couleurs)",
      "Subdomain personnalisé",
      "1 coach admin",
      "Support email",
    ],
  },
  {
    id: "growth",
    label: "Growth",
    price: 1499,
    seats: 100,
    features: [
      "100 sièges inclus",
      "Tout Starter +",
      "Multi-admins",
      "Analytics avancés",
      "Custom domain (votre URL)",
      "API access",
      "Support prioritaire",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: 0, // Sur devis
    seats: 999999,
    features: [
      "Sièges illimités",
      "Tout Growth +",
      "SSO Google/LinkedIn",
      "Custom IA training",
      "Dedicated account manager",
      "SLA 99.9%",
    ],
  },
];

// ─── Slug generation ───────────────────────────────────────
export function generateOrgSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ─── Get current user's org ────────────────────────────────
export async function getCurrentUserOrg(): Promise<{
  org: Awaited<ReturnType<typeof prisma.organization.findFirst>>;
  membership: Awaited<ReturnType<typeof prisma.organizationMember.findFirst>>;
} | null> {
  const session = await getSession();
  if (!session) return null;

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.userId, status: "active" },
    include: { organization: true },
  });

  if (!membership) return null;
  return { org: membership.organization, membership };
}

export async function requireOrgAdmin(): Promise<{
  org: Awaited<ReturnType<typeof prisma.organization.findFirst>>;
  membership: Awaited<ReturnType<typeof prisma.organizationMember.findFirst>>;
} | null> {
  const result = await getCurrentUserOrg();
  if (!result) return null;
  if (result.membership?.role !== "admin") return null;
  return result;
}

// ─── Create organization ───────────────────────────────────
export async function createOrganization(params: {
  name: string;
  type: OrgType;
  plan?: OrgPlan;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryColor?: string;
  logoUrl?: string;
  defaultLanguage?: string;
  adminUserId: string;
}): Promise<{ org: Awaited<ReturnType<typeof prisma.organization.create>>; membership: Awaited<ReturnType<typeof prisma.organizationMember.create>> }> {
  const slug = await ensureUniqueSlug(generateOrgSlug(params.name));
  const plan = params.plan || "growth";
  const seatsLimit = plan === "starter" ? 20 : plan === "growth" ? 100 : 999999;

  const org = await prisma.organization.create({
    data: {
      name: params.name,
      slug,
      type: params.type,
      plan,
      seatsLimit,
      status: "trial",
      contactName: params.contactName,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone,
      primaryColor: params.primaryColor || "#1a3a2e",
      logoUrl: params.logoUrl,
      defaultLanguage: params.defaultLanguage || "fr",
    },
  });

  // Add creator as admin
  const membership = await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: params.adminUserId,
      role: "admin",
      status: "active",
      joinedAt: new Date(),
    },
  });

  // Increment seatsUsed
  await prisma.organization.update({
    where: { id: org.id },
    data: { seatsUsed: 1 },
  });

  return { org, membership };
}

// ─── Invitations ───────────────────────────────────────────
export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createInvitation(params: {
  organizationId: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
}): Promise<{ invitation: Awaited<ReturnType<typeof prisma.organizationInvitation.create>>; token: string }> {
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.organizationInvitation.create({
    data: {
      organizationId: params.organizationId,
      email: params.email.toLowerCase(),
      role: params.role,
      token,
      invitedBy: params.invitedBy,
      expiresAt,
    },
  });

  return { invitation, token };
}

export async function acceptInvitation(token: string, userId: string, userEmail: string): Promise<{
  success: boolean;
  error?: string;
  orgId?: string;
}> {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) {
    return { success: false, error: "Invitation introuvable" };
  }

  if (invitation.acceptedAt) {
    return { success: false, error: "Invitation déjà acceptée" };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: "Invitation expirée" };
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { success: false, error: "Cet email ne correspond pas à l'invitation" };
  }

  // Check if already a member
  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId,
      },
    },
  });

  if (existing && existing.status === "active") {
    return { success: false, error: "Vous êtes déjà membre de cette organisation" };
  }

  // Check seats
  if (invitation.organization.seatsUsed >= invitation.organization.seatsLimit) {
    return { success: false, error: "Limite de sièges atteinte pour cette organisation" };
  }

  // Create or update membership
  if (existing) {
    await prisma.organizationMember.update({
      where: { id: existing.id },
      data: { status: "active", joinedAt: new Date(), role: invitation.role },
    });
  } else {
    await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        status: "active",
        joinedAt: new Date(),
      },
    });
  }

  // Mark invitation as accepted
  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  // Increment seatsUsed
  await prisma.organization.update({
    where: { id: invitation.organizationId },
    data: { seatsUsed: { increment: 1 } },
  });

  return { success: true, orgId: invitation.organizationId };
}

// ─── Stats ─────────────────────────────────────────────────
export async function getOrgStats(orgId: string): Promise<{
  members: { total: number; active: number; invited: number; admins: number; reviewers: number };
  seats: { used: number; limit: number; remaining: number };
  recentActivity: Array<{ type: string; date: string; user: string }>;
}> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { name: true, email: true, createdAt: true } } },
    orderBy: { invitedAt: "desc" },
  });

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { seatsUsed: true, seatsLimit: true },
  });

  return {
    members: {
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      invited: members.filter((m) => m.status === "invited").length,
      admins: members.filter((m) => m.role === "admin").length,
      reviewers: members.filter((m) => m.role === "reviewer").length,
    },
    seats: {
      used: org?.seatsUsed || 0,
      limit: org?.seatsLimit || 0,
      remaining: (org?.seatsLimit || 0) - (org?.seatsUsed || 0),
    },
    recentActivity: members.slice(0, 10).map((m) => ({
      type: m.status === "active" ? "joined" : "invited",
      date: (m.joinedAt || m.invitedAt).toISOString(),
      user: m.user?.name || m.user?.email || "Unknown",
    })),
  };
}
