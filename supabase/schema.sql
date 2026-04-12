-- ═══════════════════════════════════════════════════════════
-- EARNI — Supabase Database Schema
-- Run this entire file in the Supabase SQL editor.
-- Run it once on a fresh project — it is idempotent.
-- ═══════════════════════════════════════════════════════════

-- ── ACCOUNTS ────────────────────────────────────────────────
-- The paying subscriber: parent, guardian, or adult learner.
-- One account per household. Children are NOT users.
create table if not exists accounts (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade not null unique,
  email                  text not null,
  full_name              text,
  plan                   text not null default 'free',
    -- free | starter | family
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text default 'trialing',
    -- trialing | active | cancelled | past_due
  trial_ends_at          timestamptz,
  created_at             timestamptz default now()
);

-- ── LEARNERS ─────────────────────────────────────────────────
-- Each child or adult student under an account.
-- Children never have their own login.
create table if not exists learners (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid references accounts(id) on delete cascade not null,
  name             text not null,
  age              int,
  year_level       int,            -- NZ Year 1-13
  curriculum       text default 'nz',
  primary_language text default 'en',
  input_mode       text default 'tap',  -- tap | voice | type
  is_active        boolean default true,
  pin              text,           -- 4-digit PIN, store hashed
  created_at       timestamptz default now()
);

-- ── EARNI PROFILES ───────────────────────────────────────────
-- Avatar the child designs. One per learner.
create table if not exists earni_profiles (
  id           uuid primary key default gen_random_uuid(),
  learner_id   uuid references learners(id) on delete cascade not null unique,
  colour       text not null default '#2ec4b6',
  shape        text not null default 'round',     -- round | square | star | cloud
  eyes         text not null default 'happy',     -- happy | cool | sparkle | sleepy
  accessory    text not null default 'none',      -- none | cap | bow | star
  catchphrase  text not null default 'Let''s go!',
  updated_at   timestamptz default now()
);

-- ── REWARD SETTINGS ──────────────────────────────────────────
-- Parent configures how stars convert to dollars.
create table if not exists reward_settings (
  id                uuid primary key default gen_random_uuid(),
  learner_id        uuid references learners(id) on delete cascade not null unique,
  stars_per_dollar  int not null default 20,   -- 20 stars = $1.00
  weekly_star_cap   int default 200,
  payment_method    text default 'cash',       -- cash | bank_transfer | other
  rewards_paused    boolean default false,
  updated_at        timestamptz default now()
);

-- ── SESSIONS ─────────────────────────────────────────────────
-- One row per completed lesson session.
create table if not exists sessions (
  id                uuid primary key default gen_random_uuid(),
  learner_id        uuid references learners(id) on delete cascade not null,
  subject           text not null,    -- maths | english | language | financial
  topic             text not null,    -- e.g. 'addition_to_20'
  questions_total   int not null default 0,
  questions_correct int not null default 0,
  stars_earned      int not null default 0,
  duration_seconds  int,
  input_mode_used   text,
  completed_at      timestamptz default now()
);

-- ── STAR LEDGER ──────────────────────────────────────────────
-- Transaction log of all star events.
-- NEVER update totals — always insert a new row.
-- earned rows are positive, paid_out rows are negative.
create table if not exists star_ledger (
  id           uuid primary key default gen_random_uuid(),
  learner_id   uuid references learners(id) on delete cascade not null,
  session_id   uuid references sessions(id) on delete set null,
  type         text not null,          -- earned | paid_out | jar_allocation
  stars        int not null,           -- positive = earned, negative = paid out
  dollar_value numeric(10,2),          -- calculated at time of entry
  note         text,
  created_at   timestamptz default now()
);

-- ── JAR ALLOCATIONS ──────────────────────────────────────────
-- Spend / Save / Give percentage split. Must sum to 100.
create table if not exists jar_allocations (
  id           uuid primary key default gen_random_uuid(),
  learner_id   uuid references learners(id) on delete cascade not null unique,
  spend_pct    int not null default 50,
  save_pct     int not null default 40,
  give_pct     int not null default 10,
  constraint pct_sum_check check (spend_pct + save_pct + give_pct = 100),
  updated_at   timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Enable on every table. Account holders see only their data.
-- ═══════════════════════════════════════════════════════════

alter table accounts        enable row level security;
alter table learners        enable row level security;
alter table earni_profiles  enable row level security;
alter table reward_settings enable row level security;
alter table sessions        enable row level security;
alter table star_ledger     enable row level security;
alter table jar_allocations enable row level security;

-- Accounts: user sees only their own row
create policy "accounts: own row" on accounts
  for all using (user_id = auth.uid());

-- Learners: account holder sees their learners
create policy "learners: own account" on learners
  for all using (
    account_id in (
      select id from accounts where user_id = auth.uid()
    )
  );

-- Helper: get learner IDs for the current user
-- Used by child table policies below
create or replace function get_my_learner_ids()
returns setof uuid language sql security definer as $$
  select l.id
  from learners l
  join accounts a on a.id = l.account_id
  where a.user_id = auth.uid()
$$;

-- earni_profiles
create policy "earni_profiles: own learners" on earni_profiles
  for all using (learner_id in (select get_my_learner_ids()));

-- reward_settings
create policy "reward_settings: own learners" on reward_settings
  for all using (learner_id in (select get_my_learner_ids()));

-- sessions
create policy "sessions: own learners" on sessions
  for all using (learner_id in (select get_my_learner_ids()));

-- star_ledger
create policy "star_ledger: own learners" on star_ledger
  for all using (learner_id in (select get_my_learner_ids()));

-- jar_allocations
create policy "jar_allocations: own learners" on jar_allocations
  for all using (learner_id in (select get_my_learner_ids()));

-- ═══════════════════════════════════════════════════════════
-- INDEXES — for common query patterns
-- ═══════════════════════════════════════════════════════════

create index if not exists idx_learners_account     on learners(account_id);
create index if not exists idx_sessions_learner     on sessions(learner_id);
create index if not exists idx_sessions_completed   on sessions(completed_at desc);
create index if not exists idx_star_ledger_learner  on star_ledger(learner_id);
create index if not exists idx_star_ledger_created  on star_ledger(created_at desc);
