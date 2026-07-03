import { NextResponse } from "next/server";
import { runFullSourcing } from "@/lib/actions/sourcing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Vérification du token (sécurisé par variable d'env)
  const expectedToken = process.env.SOURCING_CRON_TOKEN;
  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  try {
    const result = await runFullSourcing(true);
    return NextResponse.json({
      success: true,
      totalFound: result.totalFound,
      totalNew: result.totalNew,
      totalDuplicates: result.totalDuplicates,
      summary: result.summary,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
