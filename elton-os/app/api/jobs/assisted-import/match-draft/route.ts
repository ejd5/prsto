import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";

function checkAuth(request: Request): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const token = request.headers.get("x-api-token");
  return token === process.env.SOURCING_CRON_TOKEN;
}

function corsJson(data: Record<string, unknown>, request: Request, status = 200): Response {
  return withExtensionCors(NextResponse.json(data, { status }), request);
}

export async function OPTIONS(request: Request) {
  return createCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return corsJson({ success: false, error: "Non autorisé." }, request, 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const sourceUrl: string = body.sourceUrl || "";
    const title: string = body.title || "";
    const company: string = body.company || "";

    if (!sourceUrl && !(title && company)) {
      return corsJson({ success: false, error: "sourceUrl ou title+company requis" }, request, 400);
    }

    const suggestions: Array<{ draftId: string; title: string; company: string; updatedAt: Date | null }> = [];
    let match: { draftId: string; confidence: "high" | "medium" | "low"; title: string; company: string } | null = null;

    // Stratégie 1 : correspondance exacte par sourceUrl
    if (sourceUrl) {
      const job = await prisma.job.findFirst({
        where: { sourceUrl },
        include: { draft: { select: { id: true } } },
      });
      if (job?.draft) {
        const draft = job.draft;
        match = { draftId: draft.id, confidence: "high", title: job.title, company: job.company || "" };
        return corsJson({ success: true, match, suggestions: [] }, request);
      }
    }

    // Stratégie 2 : correspondance par titre + company
    if (title) {
      const jobs = await prisma.job.findMany({
        where: {
          title: { contains: title },
          ...(company ? { company: { contains: company } } : {}),
        },
        include: {
          draft: { select: { id: true, updatedAt: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
      });

      for (const job of jobs) {
        const draft = job.draft;
        if (draft) {
          const conf = job.sourceUrl === sourceUrl ? "high"
            : job.title.toLowerCase() === title.toLowerCase() && job.company?.toLowerCase() === company.toLowerCase() ? "medium"
            : "low";
          suggestions.push({ draftId: draft.id, title: job.title, company: job.company || "", updatedAt: draft.updatedAt || null });
          if (!match || conf === "high" || (conf === "medium" && match.confidence !== "high")) {
            match = { draftId: draft.id, confidence: conf, title: job.title, company: job.company || "" };
          }
        }
      }
    }

    return corsJson({ success: true, match, suggestions }, request);
  } catch (e: unknown) {
    return corsJson({ success: false, error: (e as Error).message }, request, 500);
  }
}
