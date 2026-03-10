-- ============================================================
-- SystemMD — Public Blueprint Tables
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Waitlist table (email collection)
CREATE TABLE IF NOT EXISTS waitlist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  blueprint_count INT DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  verify_token    TEXT
);

-- 1a. Add new columns to existing waitlist (safe to run multiple times)
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS verified     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS verify_token TEXT;

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- 2. Public blueprints table (no auth required)
CREATE TABLE IF NOT EXISTS public_blueprints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  idea_text    TEXT NOT NULL,
  title        TEXT,
  status       TEXT NOT NULL DEFAULT 'generating'
                 CHECK (status IN ('generating', 'complete', 'failed')),
  score_total  INT,
  content      JSONB,
  cursorrules  TEXT,
  build_md     TEXT,
  schema_sql   TEXT,
  env_example  TEXT,
  readme_md    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_blueprints_email   ON public_blueprints(email);
CREATE INDEX IF NOT EXISTS idx_public_blueprints_created ON public_blueprints(created_at);
CREATE INDEX IF NOT EXISTS idx_public_blueprints_status  ON public_blueprints(status);

-- 3. Enable RLS
ALTER TABLE waitlist          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_blueprints ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "public_insert_waitlist"
  ON waitlist FOR INSERT WITH CHECK (true);

CREATE POLICY "public_insert_blueprints"
  ON public_blueprints FOR INSERT WITH CHECK (true);

CREATE POLICY "public_select_blueprints"
  ON public_blueprints FOR SELECT USING (true);

CREATE POLICY "public_update_blueprints"
  ON public_blueprints FOR UPDATE USING (true);

-- 5. Auto updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waitlist_updated_at
  BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER public_blueprints_updated_at
  BEFORE UPDATE ON public_blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
