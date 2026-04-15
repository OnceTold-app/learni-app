-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_mastery_tables
-- Created: 2026-04-15
-- Description: Adds topic_mastery and fact_mastery tables for the Learni
--              mastery system overhaul (Three-Tier mastery tracking).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── topic_mastery ─────────────────────────────────────────────────────────────
-- Tracks per-learner mastery state for each topic (e.g. "addition-1-10", "times-7")
-- One row per (learner_id, topic_id) pair.

CREATE TABLE IF NOT EXISTS topic_mastery (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id       uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  topic_id         text NOT NULL,          -- e.g. "addition-1-10", "times-7", "division-4"
  tier             integer NOT NULL CHECK (tier IN (1, 2, 3)),
  correct_count    integer NOT NULL DEFAULT 0,
  streak_current   integer NOT NULL DEFAULT 0,
  streak_best      integer NOT NULL DEFAULT 0,
  is_mastered      boolean NOT NULL DEFAULT false,
  last_seen        timestamptz,
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (learner_id, topic_id)
);

-- Index for fast per-learner queries
CREATE INDEX IF NOT EXISTS idx_topic_mastery_learner_id ON topic_mastery(learner_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_topic_id   ON topic_mastery(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_mastery_tier        ON topic_mastery(tier);

-- RLS: service role only (app uses service role key)
ALTER TABLE topic_mastery ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_full_access_topic_mastery"
  ON topic_mastery
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── fact_mastery ──────────────────────────────────────────────────────────────
-- Tracks per-learner mastery of individual multiplication facts.
-- Used to power the 12×12 times table heatmap.
-- One row per (learner_id, factor_a, factor_b) triple.

CREATE TABLE IF NOT EXISTS fact_mastery (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id       uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  factor_a         integer NOT NULL CHECK (factor_a BETWEEN 1 AND 12),
  factor_b         integer NOT NULL CHECK (factor_b BETWEEN 1 AND 12),
  correct_streak   integer NOT NULL DEFAULT 0,
  total_correct    integer NOT NULL DEFAULT 0,
  total_attempts   integer NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (learner_id, factor_a, factor_b)
);

-- Index for fast per-learner queries
CREATE INDEX IF NOT EXISTS idx_fact_mastery_learner_id ON fact_mastery(learner_id);

-- RLS: service role only
ALTER TABLE fact_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_fact_mastery"
  ON fact_mastery
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── updated_at trigger (optional but nice) ────────────────────────────────────
-- Auto-updates the updated_at column on every row change.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_topic_mastery_updated_at'
  ) THEN
    CREATE TRIGGER set_topic_mastery_updated_at
      BEFORE UPDATE ON topic_mastery
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_fact_mastery_updated_at'
  ) THEN
    CREATE TRIGGER set_fact_mastery_updated_at
      BEFORE UPDATE ON fact_mastery
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
