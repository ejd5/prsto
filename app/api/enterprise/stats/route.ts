import { NextResponse } from "next/server";
import { requireOrgAdmin, getOrgStats } from "@/lib/enterprise";

// GET /api/enterprise/stats — org dashboard stats (admin only)
export async function GET() {
  try {
    const adminContext = await requireOrgAdmin();
    if (!adminContext) {
      return NextResponse.json({ error: "Droits admin requis" }, { status: 403 });
    }

    const stats = await getOrgStats(adminContext.org!.id);

    return NextResponse.json({
      org: {
        id: adminContext.org!.id,
        name: adminContext.org!.name,
        slug: adminContext.org!.slug,
        type: adminContext.org!.type,
        plan: adminContext.org!.plan,
        status: adminContext.org!.status,
        primaryColor: adminContext.org!.primaryColor,
        logoUrl: adminContext.org!.logoUrl,
        customDomain: adminContext.org!.customDomain,
        commissionRate: adminContext.org!.commissionRate,
        totalCommission: adminContext.org!.totalCommission,
      },
      ...stats,
    });
  } catch (error) {
    console.error("[enterprise/stats] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
