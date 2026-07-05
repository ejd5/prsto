import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanImportedJobText } from "@/lib/jobs/text-sanitizer";
import { ensureApplicationDraftForJob } from "@/lib/jobs/application-pipeline";

/**
 * POST /api/jobs/importer/extension
 *
 * Reoit une annonce capture par l'extension Chrome PRSTO Importer.
 * Parse, nettoie, et cre une draft valider dans PRSTO.
 *
 * Rgles strictes :
 * - Aucune candidature automatique
 * - Aucun envoi d'email
 * - Aucun Browser Agent
 * - L'utilisateur doit valider dans PRSTO
 */

function parseExtensionPayload(body: Record<string, unknown>) {
  const sourcePlatform = (body.sourcePlatform as string || "").trim();
  const sourceUrl = (body.sourceUrl as string || "").trim();
  const rawText = (body.rawText as string || "").trim();
  const detectedTitle = (body.detectedTitle as string || "").trim();
  const detectedCompany = (body.detectedCompany as string || "").trim();
  const detectedLocation = (body.detectedLocation as string || "").trim();

  if (!rawText) {
    return { error: "Aucun texte extrait. Vrifiez que vous tes sur une page d'annonce." };
  }
  if (!sourceUrl) {
    return { error: "URL source manquante." };
  }

  // Nettoyer le texte
  let cleaned = cleanImportedJobText(rawText);

  // Si le texte est trop court aprs nettoyage, on garde le brut
  if (cleaned.length < 100) {
    cleaned = rawText.slice(0, 10000);
  }

  // Extraire titre
  let title = detectedTitle;
  if (!title || title.length < 3) {
    const lines = cleaned.split(/\n/).filter((l: string) => l.trim().length > 3);
    title = lines[0]?.trim().slice(0, 200) || "Offre importe";
  }

  // Extraire entreprise
  let company = detectedCompany;
  if (!company || company.length < 2 || company === "Non dtecte") {
    const lines = cleaned.split(/\n/).filter((l: string) => l.trim().length > 3);
    company = lines[1]?.trim().slice(0, 200) || "Entreprise inconnue";
  }

  // Description = texte nettoy (max 5000 car.)
  const description = cleaned.slice(0, 5000);

  return {
    title: title.slice(0, 200),
    company: company.slice(0, 200),
    location: detectedLocation.slice(0, 200),
    description,
    sourceUrl: sourceUrl.slice(0, 500),
    sourcePlatform,
    rawText: cleaned.slice(0, 10000),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = parseExtensionPayload(body);

    if ("error" in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    // Trouver ou crer la source "Import Express"
    let source = await prisma.importSource.findFirst({
      where: { name: "Import Express" },
    });
    if (!source) {
      source = await prisma.importSource.create({
        data: { name: "Import Express", type: "browser", enabled: true },
      });
    }

    // Crer l'offre avec statut "new" (valider par l'utilisateur)
    const job = await prisma.job.create({
      data: {
        title: parsed.title,
        company: parsed.company,
        location: parsed.location || null,
        sourceUrl: parsed.sourceUrl,
        description: parsed.description,
        sourceId: source.id,
        externalId: `extension::${Buffer.from(parsed.sourceUrl).toString("base64").slice(0, 40)}`,
        status: "new",
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    // Stocker le raw text dans RawJob pour traabilit
    await prisma.rawJob.create({
      data: {
        sourceId: source.id,
        externalId: job.externalId,
        sourceUrl: parsed.sourceUrl,
        rawTitle: parsed.title,
        rawCompany: parsed.company,
        rawLocation: parsed.location,
        rawDescription: parsed.rawText,
        fetchedAt: new Date(),
      },
    });

    // Auto-créer un ApplicationDraft pour faire apparaître l'offre dans le pipeline
    await ensureApplicationDraftForJob(job.id);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      title: parsed.title,
      company: parsed.company,
      location: parsed.location,
      sourceUrl: parsed.sourceUrl,
      message: "Offre cre. Consultez PRSTO pour vrifier et prparer la candidature.",
    });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
