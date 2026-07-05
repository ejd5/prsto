import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgAdmin, createInvitation, type MemberRole } from "@/lib/enterprise";

// POST /api/enterprise/invite
// Body: { email, role?: "member" | "reviewer" }
// Sends an invitation (creates OrganizationInvitation)
export async function POST(request: Request) {
  try {
    const adminContext = await requireOrgAdmin();
    if (!adminContext) {
      return NextResponse.json({ error: "Droits admin requis" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = "member" } = body as { email: string; role?: MemberRole };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    if (!["member", "reviewer", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    // Check seats
    const org = adminContext.org;
    if (org && org.seatsUsed !== null && org.seatsLimit !== null && org.seatsUsed >= org.seatsLimit) {
      return NextResponse.json({ error: "Limite de sièges atteinte" }, { status: 400 });
    }

    // Check if already invited (pending)
    const existingInvitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId: adminContext.org!.id,
        email: email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvitation) {
      return NextResponse.json({ error: "Invitation déjà envoyée à cet email" }, { status: 400 });
    }

    // Check if already member
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: adminContext.org!.id,
            userId: existingUser.id,
          },
        },
      });
      if (existingMember && existingMember.status === "active") {
        return NextResponse.json({ error: "Cet utilisateur est déjà membre" }, { status: 400 });
      }
    }

    const { invitation, token } = await createInvitation({
      organizationId: adminContext.org!.id,
      email: email.toLowerCase(),
      role,
      invitedBy: adminContext.membership!.userId,
    });

    // In production: send email with accept URL
    // For now, return the token (admin can share manually)
    const acceptUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/enterprise/accept-invite?token=${token}`;

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        acceptUrl, // For dev/testing — in prod, sent via email
      },
    });
  } catch (error) {
    console.error("[enterprise/invite] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/enterprise/invite — list pending invitations
export async function GET() {
  try {
    const adminContext = await requireOrgAdmin();
    if (!adminContext) {
      return NextResponse.json({ error: "Droits admin requis" }, { status: 403 });
    }

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: adminContext.org!.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("[enterprise/invite] GET Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
