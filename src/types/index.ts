// ─────────────────────────────────────────────────────
// EARNI — TypeScript Types
// These mirror the Supabase database schema exactly.
// ─────────────────────────────────────────────────────

export type Plan = 'free' | 'starter' | 'family'
export type SubscriptionStatus = 'trialing' | 'active' | 'cancelled' | 'past_due'
export type InputMode = 'tap' | 'voice' | 'type'
export type LedgerType = 'earned' | 'paid_out' | 'jar_allocation'
export type Subject = 'maths' | 'english' | 'language' | 'financial'
export type Curriculum = 'nz' | 'au' | 'uk' | 'us'

// ── Database row types ──

export interface Account {
  id: string
  user_id: string
  email: string
  full_name: string | null
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  created_at: string
}

export interface Learner {
  id: string
  account_id: string
  name: string
  age: number | null
  year_level: number | null
  curriculum: Curriculum
  primary_language: string
  input_mode: InputMode
  is_active: boolean
  pin: string | null
  created_at: string
}

export interface EarniProfile {
  id: string
  learner_id: string
  colour: string
  shape: 'round' | 'square' | 'star' | 'cloud'
  eyes: 'happy' | 'cool' | 'sparkle' | 'sleepy'
  accessory: 'none' | 'cap' | 'bow' | 'star'
  catchphrase: string
  updated_at: string
}

export interface RewardSettings {
  id: string
  learner_id: string
  stars_per_dollar: number
  weekly_star_cap: number
  payment_method: string
  rewards_paused: boolean
  updated_at: string
}

export interface Session {
  id: string
  learner_id: string
  subject: Subject
  topic: string
  questions_total: number
  questions_correct: number
  stars_earned: number
  duration_seconds: number | null
  input_mode_used: InputMode | null
  completed_at: string
}

export interface StarLedgerEntry {
  id: string
  learner_id: string
  session_id: string | null
  type: LedgerType
  stars: number            // positive = earned, negative = paid out
  dollar_value: number | null
  note: string | null
  created_at: string
}

export interface JarAllocations {
  id: string
  learner_id: string
  spend_pct: number        // must sum to 100 with save + give
  save_pct: number
  give_pct: number
  updated_at: string
}

// ── App types ──

export interface LessonQuestion {
  id: string
  question: string
  options: [string, string, string]   // always exactly 3 options
  correct_index: 0 | 1 | 2
  topic: string
  year_level: number
  difficulty: 1 | 2 | 3 | 4 | 5
}

export interface SessionResult {
  questionsTotal: number
  questionsCorrect: number
  starsEarned: number
  durationSeconds: number
  topic: string
  subject: Subject
}

// ── Hub view types (aggregated for parent dashboard) ──

export interface LearnerSummary {
  learner: Learner
  profile: EarniProfile | null
  rewardSettings: RewardSettings
  jarAllocations: JarAllocations
  starsOwedTotal: number
  dollarsOwed: number
  sessionsThisWeek: number
  streakDays: number
}
