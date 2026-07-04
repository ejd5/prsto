import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRecruiterDashboardStats } from "@/lib/recruiter/stats";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const stats = await getRecruiterDashboardStats(session.userId);
  return NextResponse.json({ success: true, stats });
}
