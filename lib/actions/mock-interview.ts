"use server";

import { isSupabaseConfigured, query, insert, update } from "@/lib/supabase/server";

interface PortraitRow {
  id: string;
  name: string;
  title: string;
  image_url: string;
  voice: string;
  traits: string[];
  gender: string;
}

export async function getPortraits() {
  if (!isSupabaseConfigured()) return [];

  try {
    const data = await query<PortraitRow>("mock_interview_portraits", {
      select: "id, name, title, image_url, voice, traits, gender",
      order: { column: "sort_order", ascending: true },
    });
    return (data as PortraitRow[]) || [];
  } catch {
    return [];
  }
}

export async function checkQuota(userId: string) {
  if (!isSupabaseConfigured()) {
    return { used: 0, limit: 5, canProceed: true };
  }

  try {
    const data = await query<{
      used_this_month: number;
      monthly_limit: number;
    }>("mock_interview_quota", {
      select: "used_this_month, monthly_limit",
      eq: { user_id: userId },
      single: true,
    });
    const quota = data as { used_this_month: number; monthly_limit: number } | null;
    const used = quota?.used_this_month ?? 0;
    const limit = quota?.monthly_limit ?? 5;
    return { used, limit, canProceed: used < limit };
  } catch {
    return { used: 0, limit: 5, canProceed: true };
  }
}

export async function incrementQuota(userId: string) {
  if (!isSupabaseConfigured()) return false;

  try {
    const existing = await query<{ id: string; used_this_month: number }>(
      "mock_interview_quota",
      {
        select: "id, used_this_month",
        eq: { user_id: userId },
        single: true,
      },
    );

    const record = existing as { id: string; used_this_month: number } | null;

    if (record) {
      await update("mock_interview_quota", {
        used_this_month: record.used_this_month + 1,
        updated_at: new Date().toISOString(),
      }, { id: record.id });
    } else {
      await insert("mock_interview_quota", {
        user_id: userId,
        used_this_month: 1,
        monthly_limit: 5,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function createSession(data: {
  userId: string;
  language: string;
  company: string;
  jobTitle: string;
  jobDescription: string;
  strengths: string[];
  panelPortraitIds: string[];
}) {
  if (!isSupabaseConfigured()) {
    return { id: "local-demo-mode", error: null };
  }

  try {
    const session = await insert("mock_interview_sessions", {
      user_id: data.userId,
      language: data.language,
      company: data.company,
      job_title: data.jobTitle,
      job_description: data.jobDescription,
      strengths: data.strengths,
      panel_portrait_ids: data.panelPortraitIds,
      status: "in_progress",
      questions_asked: [],
    });
    return { id: (session as { id: string })?.id || "unknown", error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Erreur création session" };
  }
}

export async function saveQuestion(data: {
  sessionId: string;
  portraitId: string;
  questionText: string;
  type: string;
}) {
  if (!isSupabaseConfigured()) return null;

  try {
    const result = await insert("mock_interview_questions", {
      session_id: data.sessionId,
      portrait_id: data.portraitId,
      question_text: data.questionText,
      type: data.type,
    });
    return (result as { id: string })?.id || null;
  } catch {
    return null;
  }
}

export async function saveAnswer(data: {
  questionId: string;
  transcript: string;
  wpm: number;
  silenceRatio: number;
  postureScore: number;
  gazeScore: number;
  durationMs: number;
}) {
  if (!isSupabaseConfigured()) return false;

  try {
    await insert("mock_interview_answers", {
      question_id: data.questionId,
      transcript: data.transcript,
      wpm: data.wpm,
      silence_ratio: data.silenceRatio,
      posture_score: data.postureScore,
      gaze_score: data.gazeScore,
      duration_ms: data.durationMs,
    });
    return true;
  } catch {
    return false;
  }
}

export async function generateWithLLM(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<string | null> {
  try {
    const { generateWithDeepSeek } = await import("@/lib/ai/deepseek");
    const result = await generateWithDeepSeek({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      temperature: 0.5,
      maxTokens: 2000,
    });
    return result.success ? (result.content ?? null) : null;
  } catch {
    return null;
  }
}

export async function generatePrepContent(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ content: string | null; error: string | null }> {
  try {
    const { generateWithDeepSeek } = await import("@/lib/ai/deepseek");
    const result = await generateWithDeepSeek({
      systemPrompt: params.systemPrompt,
      userPrompt: params.userPrompt,
      temperature: 0.5,
      maxTokens: 3000,
    });

    if (result.success && result.content) {
      return { content: result.content, error: null };
    }
    return { content: null, error: result.error || "Échec de la génération" };
  } catch (err) {
    return {
      content: null,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}

export async function updateSessionAudit(
  sessionId: string,
  auditReport: Record<string, unknown>,
) {
  if (!isSupabaseConfigured()) return false;

  try {
    await update("mock_interview_sessions", {
      audit_report: auditReport,
      status: "completed",
      updated_at: new Date().toISOString(),
    }, { id: sessionId });
    return true;
  } catch {
    return false;
  }
}
