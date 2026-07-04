import { NextResponse } from "next/server";
import {
  markSent,
  markFollowedUp,
  markRecruiterReplied,
  markInterviewScheduled,
  markOffer,
  markRejected,
  archiveApplication,
} from "@/lib/jobs/application-pipeline";

const ACTIONS: Record<string, (id: string, extra?: string) => Promise<{ success: boolean; error?: string }>> = {
  mark_sent: (id) => markSent(id),
  mark_followed_up: (id) => markFollowedUp(id),
  mark_replied: (id) => markRecruiterReplied(id),
  schedule_interview: (id, extra) => markInterviewScheduled(id, extra),
  mark_offer: (id) => markOffer(id),
  mark_rejected: (id) => markRejected(id),
  archive: (id) => archiveApplication(id),
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string;
    const interviewAt = body.interviewAt as string | undefined;

    if (!action || !(action in ACTIONS)) {
      return NextResponse.json({ success: false, error: `Action inconnue : ${action}` }, { status: 400 });
    }

    const result = await ACTIONS[action](id, interviewAt);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
