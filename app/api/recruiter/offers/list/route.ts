import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    offers: [],
    message: "Offres clients — les offres importées apparaîtront ici",
  });
}
