-- ============================================================
-- PRSTO — Mock Interview Module (Supabase PostgreSQL Schema)
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. PORTRAITS — photos des membres du panel
CREATE TABLE IF NOT EXISTS mock_interview_portraits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  voice TEXT DEFAULT 'gemini',
  traits TEXT[] DEFAULT '{}',
  gender TEXT DEFAULT 'female',
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SESSIONS
CREATE TABLE IF NOT EXISTS mock_interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  language TEXT DEFAULT 'fr',
  company TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT DEFAULT '',
  panel_portrait_ids UUID[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'preparing'
    CHECK (status IN ('preparing','in_progress','completed','cancelled')),
  questions_asked TEXT[] DEFAULT '{}',
  audit_report JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON mock_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON mock_interview_sessions(status);

-- 3. QUESTIONS
CREATE TABLE IF NOT EXISTS mock_interview_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES mock_interview_sessions(id) ON DELETE CASCADE,
  portrait_id UUID REFERENCES mock_interview_portraits(id),
  question_text TEXT NOT NULL,
  type TEXT DEFAULT 'opening'
    CHECK (type IN ('opening','follow_up','behavioral','stress','closing')),
  asked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_session ON mock_interview_questions(session_id);

-- 4. REPONSES
CREATE TABLE IF NOT EXISTS mock_interview_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES mock_interview_questions(id) ON DELETE CASCADE,
  transcript TEXT DEFAULT '',
  wpm NUMERIC DEFAULT 0,
  silence_ratio NUMERIC DEFAULT 0,
  posture_score NUMERIC DEFAULT 0,
  gaze_score NUMERIC DEFAULT 0,
  interruptions INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. QUOTA
CREATE TABLE IF NOT EXISTS mock_interview_quota (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  used_this_month INT DEFAULT 0,
  monthly_limit INT DEFAULT 5,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Row Level Security (optionnel)
ALTER TABLE mock_interview_portraits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interview_quota ENABLE ROW LEVEL SECURITY;

-- Lectures publiques pour les portraits
CREATE POLICY "Portraits public read" ON mock_interview_portraits
  FOR SELECT USING (true);

-- Sessions : propre user ou service_role
CREATE POLICY "Sessions own user" ON mock_interview_sessions
  FOR ALL USING (user_id = current_setting('app.user_id', true));

-- Quota : propre user
CREATE POLICY "Quota own user" ON mock_interview_quota
  FOR ALL USING (user_id = current_setting('app.user_id', true));
