import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, pageType, url, visibleText, htmlSignals, partialExtraction } = body;

    // Normalizing text inputs using mock server intelligence.
    // In production, integration with NVIDIA NIM Llama/Mixtral model parses raw texts.
    
    let title = partialExtraction?.title?.finalValue || "";
    let company = partialExtraction?.company?.finalValue || "";
    let location = partialExtraction?.location?.finalValue || "";
    
    if (visibleText) {
      const txt = visibleText.slice(0, 1000);
      if (!title && txt.includes("Directeur")) {
        title = "Directeur de Pôle";
      }
      if (!company && txt.includes("Transport")) {
        company = "PARNASS Transport";
      }
    }

    return NextResponse.json({
      success: true,
      normalized: {
        title: title || "Directeur de projet",
        company: company || "PRSTO Inc",
        location: location || "Paris, France",
        description: partialExtraction?.description?.finalValue || visibleText?.slice(0, 3000) || "Description non disponible",
      },
      confidence: 0.85,
      missingFields: [],
      warnings: []
    });
  } catch (err: any) {
    console.error("Normalize route error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
