import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const { dossierId } = await params;

  const shareUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/prsto/share/${dossierId}`;

  return NextResponse.json({
    success: true,
    shareUrl: shareUrl,
    message: "Lien de partage généré — envoyez-le à votre client",
    expiresIn: "7 jours",
  });
}
