-- explanation_bank table
-- Stores Earni's teaching explanations, growing organically as children use the app.
-- First child to encounter a topic pays the API cost; all subsequent get it free.
-- Feedback loop: "Makes sense!" increments times_understood, "I don't understand"
-- increments times_not_understood. Poor-performing explanations get replaced over time.

create table if not exists explanation_bank (
  id uuid default gen_random_uuid() primary key,
  topic_id text not null,           -- e.g. 'reading-nouns', 'maths-times-tables', 'reading-ar-vowels'
  year_level int not null,          -- 1-13
  subject text not null,            -- 'Maths', 'Reading & Writing', 'Science' etc
  concept text not null,            -- Human-readable concept name e.g. 'Nouns'
  body text not null,               -- The full teaching explanation text
  analogy text,                     -- The core analogy used (e.g. 'noun as a sticky note label')
  mental_test text,                 -- The rule/test to remember (e.g. 'Can I touch it, see it, or visit it?')
  visual jsonb,                     -- Optional visual hint for the session renderer
  times_served int not null default 0,
  times_understood int not null default 0,
  times_not_understood int not null default 0,
  source text not null default 'generated',  -- 'generated' | 'homework' | 'manual'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists explanation_bank_topic_year_idx on explanation_bank(topic_id, year_level);
create index if not exists explanation_bank_subject_idx on explanation_bank(subject);

-- Best explanation per topic: highest understood rate, min 5 served
create index if not exists explanation_bank_quality_idx on explanation_bank(topic_id, year_level, times_understood desc);
