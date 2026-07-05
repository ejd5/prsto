import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrg, requireOrgAdmin, type MemberRole } from "@/lib/enterprise";

// GET /api/enterprise/members — list org members (admin only)
export async function GET() {
  try {
    const adminContext = await requireOrgAdmin();
    if (!adminContext) {
      return NextResponse.json({ error: "Droits admin requis" }, { status: 403 });
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: adminContext.org!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        status: m.status,
        invitedAt: m.invitedAt,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    console.error("[enterprise/members] GET Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/enterprise/members — update role or remove
// Body: { memberId, action: "promote_admin" | "demote_member" | "promote_reviewer" | "remove" }
export async function PATCH(request: Request) {
  try {
    const adminContext = await requireOrgAdmin();
    if (!adminContext) {
      return NextResponse.json({ error: "Droits admin requis" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, action } = body as { memberId: string; action: "promote_admin" | "demote_member" | "promote_reviewer" | "remove" };

    if (!memberId || !action) {
      return NextResponse.json({ error: "memberId et action requis" }, { status: 400 });
    }

    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.organizationId !== adminContext.org!.id) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    // Prevent self-demotion (admin can't remove their own admin role if last admin)
    if (member.userId === adminContext.membership!.userId && (action === "demote_member" || action === "remove")) {
      const adminCount = await prisma.organizationMember.count({
        where: {
          organizationId: adminContext.org!.id,
          role: "admin",
          status: "active",
        },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Vous êtes le dernier admin. Désignez un autre admin avant de partir." }, { status: 400 });
      }
    }

    if (action === "remove") {
      await prisma.organizationMember.update({
        where: { id: memberId },
        data: { status: "removed" },
      });
      await prisma.organization.update({
        where: { id: adminContext.org!.id },
        data: { seatsUsed: { decrement: 1 } },
      });
    } else {
      const newRole: MemberRole = action === "promote_admin" ? "admin" : action === "promote_reviewer" ? "reviewer" : "member";
      await prisma.organizationMember.update({
        where: { id: memberId },
        data: { role: newRole },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[enterprise/members] PATCH Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
