-- Migration: add_vault_columns
-- Run in Supabase SQL editor

ALTER TABLE learners ADD COLUMN IF NOT EXISTS vault_tier integer NOT NULL DEFAULT 1;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS jar_split jsonb DEFAULT '{"save": 50, "spend": 40, "give": 10}';
ALTER TABLE learners ADD COLUMN IF NOT EXISTS goal_vault jsonb DEFAULT NULL;
ALTER TABLE learners ADD COLUMN IF NOT EXISTS vault_unlocked_modules text[] DEFAULT ARRAY[]::text[];
