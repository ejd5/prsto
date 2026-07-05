import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createOrganization, ORG_TYPES, type OrgType, type OrgPlan } from "@/lib/enterprise";

// POST /api/enterprise/create
// Body: { name, type, plan?, contactName?, contactEmail?, contactPhone?, primaryColor? }
// Creates a new organization and adds creator as admin
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, plan, contactName, contactEmail, contactPhone, primaryColor } = body as {
      name: string;
      type: OrgType;
      plan?: OrgPlan;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      primaryColor?: string;
    };

    if (!name || !type) {
      return NextResponse.json({ error: "name et type requis" }, { status: 400 });
    }

    if (!ORG_TYPES.some((t) => t.id === type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    // Check if user is already admin of an org (limit 1 org per user as admin)
    const existingAdmin = await prisma.organizationMember.findFirst({
      where: { userId: session.userId, role: "admin", status: "active" },
    });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Vous êtes déjà admin d'une organisation. Une seule par compte." },
        { status: 400 }
      );
    }

    const result = await createOrganization({
      name,
      type,
      plan,
      contactName,
      contactEmail,
      contactPhone,
      primaryColor,
      adminUserId: session.userId,
    });

    return NextResponse.json({
      success: true,
      org: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        type: result.org.type,
        plan: result.org.plan,
        status: result.org.status,
        seatsLimit: result.org.seatsLimit,
      },
    });
  } catch (error) {
    console.error("[enterprise/create] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
