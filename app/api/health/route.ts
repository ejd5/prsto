import { NextResponse } from "next/server";
import { withExtensionCors, createCorsPreflightResponse } from "@/lib/http/extension-cors";

export async function GET(request: Request) {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    const response = NextResponse.json({
      status: "ok",
      version: "2.7.2",
      timestamp: new Date().toISOString(),
      db: "connected",
    });
    return withExtensionCors(response, request);
  } catch {
    const response = NextResponse.json({
      status: "degraded",
      version: "2.7.2",
      timestamp: new Date().toISOString(),
      db: "disconnected",
    });
    return withExtensionCors(response, request);
  }
}

export async function OPTIONS(request: Request) {
  return createCorsPreflightResponse(request);
}
