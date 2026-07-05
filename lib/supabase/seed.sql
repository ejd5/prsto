-- ============================================================
-- SEED DATA — Portraits du Panel
-- Exécuter dans Supabase SQL Editor après le schema.sql
-- ============================================================

INSERT INTO mock_interview_portraits (name, title, image_url, voice, traits, gender, sort_order) VALUES
  ('Ingrid Dubois',  'Directrice des Ressources Humaines', '/branding/portraits/drh-ingrid/ingrid-01.png', 'gemini', ARRAY['exigeante', 'bienveillante', 'analytique'], 'female', 1),
  ('Paul Mercier',   'CEO — Directeur Général',            '/branding/portraits/ceo-paul/paul-01.png',     'gemini', ARRAY['stratégique', 'direct', 'visionnaire'], 'male', 2),
  ('John Koffi',     'CTO — Directeur Technique',          '/branding/portraits/cto-john/john-01.png',     'gemini', ARRAY['technique', 'précis', 'pédagogue'], 'male', 3),
  ('Sabrina Lopez',  'Directrice Marketing',               '/branding/portraits/dirmarketing-sabrina/sabrina-01.png', 'gemini', ARRAY['créative', 'persuasive', 'analytique'], 'female', 4),
  ('Lola Petit',     'Responsable RH & Talents',           '/branding/portraits/rhmanager-lola/lola-01.png', 'gemini', ARRAY['empathique', 'organisée', 'discrete'], 'female', 5),
  ('David Rousseau', 'Membre du Conseil d''Administration','/branding/portraits/boardmanager-david/david-01.png', 'gemini', ARRAY['exigeant', 'expérimenté', 'strategic'], 'male', 6)
ON CONFLICT DO NOTHING;
