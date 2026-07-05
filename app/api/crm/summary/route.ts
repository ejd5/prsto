import { NextResponse } from "next/server";
import { getCrmDashboardSummary } from "@/lib/actions/crm";

export async function GET() {
  const summary = await getCrmDashboardSummary();
  return NextResponse.json(summary);
}
