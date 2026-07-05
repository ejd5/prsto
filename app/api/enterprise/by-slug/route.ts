import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/enterprise/by-slug?slug=...
// Public endpoint — returns org public info for white-label pages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug requis" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        primaryColor: true,
        logoUrl: true,
        defaultLanguage: true,
        customDomain: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    return NextResponse.json({ org });
  } catch (error) {
    console.error("[enterprise/by-slug] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
