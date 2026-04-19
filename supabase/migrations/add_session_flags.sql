-- session_flags table
-- Records any Earni responses that triggered output moderation
-- Visible to parents in dashboard for review

create table if not exists session_flags (
  id uuid default gen_random_uuid() primary key,
  learner_id uuid references learners(id) on delete cascade,
  flagged_at timestamptz not null default now(),
  reason text not null,
  response_excerpt text,
  reviewed boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now()
);

-- Index for parent dashboard query
create index if not exists session_flags_learner_id_idx on session_flags(learner_id);
create index if not exists session_flags_flagged_at_idx on session_flags(flagged_at desc);

-- RLS: parents can read flags for their children
alter table session_flags enable row level security;

create policy "Parents can view flags for their children"
  on session_flags for select
  using (
    learner_id in (
      select id from learners where parent_id = auth.uid()
    )
  );

create policy "Service role can insert flags"
  on session_flags for insert
  with check (true);
