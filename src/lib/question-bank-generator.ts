// ─────────────────────────────────────────────────────────────────────────────
// LEARNI QUESTION BANK TOPIC REGISTRY
// Defines all mastery topics, their tier, and sub-level identifiers.
// Used by session routing, mastery tracking, and UI components.
// ─────────────────────────────────────────────────────────────────────────────

export interface MasteryTopic {
  /** Unique identifier used in DB and API calls */
  id: string
  /** Human-readable name */
  name: string
  /** 1 = Foundations, 2 = Fluency, 3 = Elite */
  tier: 1 | 2 | 3
  /** Sub-level label, e.g. "1-10", "×2", "÷5", "1001-10000" */
  sub_level: string
  /** Category grouping */
  category: 'counting' | 'addition' | 'subtraction' | 'times-tables' | 'division'
  /** Mastery threshold — how many correct answers = mastered */
  mastery_threshold: number
  /** For Tier 2 tables: streak mode threshold */
  streak_threshold?: number
  /** Display style hints for UI */
  style?: 'speed-drill' | 'streak' | 'standard' | 'elite'
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — FOUNDATIONS
// Instant recall. Speed drill (beat your time). 30 correct = mastered.
// ─────────────────────────────────────────────────────────────────────────────
export const TIER_1_TOPICS: MasteryTopic[] = [
  // Counting
  {
    id: 'counting-2s',
    name: 'Counting in 2s',
    tier: 1,
    sub_level: '2s',
    category: 'counting',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'counting-5s',
    name: 'Counting in 5s',
    tier: 1,
    sub_level: '5s',
    category: 'counting',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'counting-10s',
    name: 'Counting in 10s',
    tier: 1,
    sub_level: '10s',
    category: 'counting',
    mastery_threshold: 30,
    style: 'speed-drill',
  },

  // Addition — Tier 1
  {
    id: 'addition-1-10',
    name: 'Addition 1–10',
    tier: 1,
    sub_level: '1-10',
    category: 'addition',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'addition-11-20',
    name: 'Addition 11–20',
    tier: 1,
    sub_level: '11-20',
    category: 'addition',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'addition-21-50',
    name: 'Addition 21–50',
    tier: 1,
    sub_level: '21-50',
    category: 'addition',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'addition-51-100',
    name: 'Addition 51–100',
    tier: 1,
    sub_level: '51-100',
    category: 'addition',
    mastery_threshold: 30,
    style: 'speed-drill',
  },

  // Subtraction — Tier 1
  {
    id: 'subtraction-1-10',
    name: 'Subtraction 1–10',
    tier: 1,
    sub_level: '1-10',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'subtraction-11-20',
    name: 'Subtraction 11–20',
    tier: 1,
    sub_level: '11-20',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'subtraction-21-50',
    name: 'Subtraction 21–50',
    tier: 1,
    sub_level: '21-50',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
  {
    id: 'subtraction-51-100',
    name: 'Subtraction 51–100',
    tier: 1,
    sub_level: '51-100',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'speed-drill',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — FLUENCY
// Standard questions. Streak mode for tables (10 correct in a row).
// 30 correct = mastered.
// ─────────────────────────────────────────────────────────────────────────────
export const TIER_2_TOPICS: MasteryTopic[] = [
  // Addition — Tier 2
  {
    id: 'addition-101-500',
    name: 'Addition 101–500',
    tier: 2,
    sub_level: '101-500',
    category: 'addition',
    mastery_threshold: 30,
    style: 'standard',
  },
  {
    id: 'addition-501-1000',
    name: 'Addition 501–1000',
    tier: 2,
    sub_level: '501-1000',
    category: 'addition',
    mastery_threshold: 30,
    style: 'standard',
  },

  // Subtraction — Tier 2
  {
    id: 'subtraction-101-500',
    name: 'Subtraction 101–500',
    tier: 2,
    sub_level: '101-500',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'standard',
  },
  {
    id: 'subtraction-501-1000',
    name: 'Subtraction 501–1000',
    tier: 2,
    sub_level: '501-1000',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'standard',
  },

  // Times tables ×2–×12 (each separate, streak mode)
  ...([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map(n => ({
    id: `times-${n}`,
    name: `Times table ×${n}`,
    tier: 2 as const,
    sub_level: `×${n}`,
    category: 'times-tables' as const,
    mastery_threshold: 30,
    streak_threshold: 10,
    style: 'streak' as const,
  })),

  // Division ÷2–÷12 (each separate)
  ...([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map(n => ({
    id: `division-${n}`,
    name: `Division ÷${n}`,
    tier: 2 as const,
    sub_level: `÷${n}`,
    category: 'division' as const,
    mastery_threshold: 30,
    style: 'standard' as const,
  })),
]

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3 — ELITE ⭐
// Pen and paper acceptable. No calculator. Gold styling.
// 30 correct = mastered.
// ─────────────────────────────────────────────────────────────────────────────
export const TIER_3_TOPICS: MasteryTopic[] = [
  // Addition — Tier 3
  {
    id: 'addition-1001-10000',
    name: 'Addition 1,001–10,000',
    tier: 3,
    sub_level: '1001-10000',
    category: 'addition',
    mastery_threshold: 30,
    style: 'elite',
  },
  {
    id: 'addition-10001-100000',
    name: 'Addition 10,001–100,000',
    tier: 3,
    sub_level: '10001-100000',
    category: 'addition',
    mastery_threshold: 30,
    style: 'elite',
  },
  {
    id: 'addition-100001-1000000',
    name: 'Addition 100,001–1,000,000',
    tier: 3,
    sub_level: '100001-1000000',
    category: 'addition',
    mastery_threshold: 30,
    style: 'elite',
  },

  // Subtraction — Tier 3
  {
    id: 'subtraction-1001-10000',
    name: 'Subtraction 1,001–10,000',
    tier: 3,
    sub_level: '1001-10000',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'elite',
  },
  {
    id: 'subtraction-10001-100000',
    name: 'Subtraction 10,001–100,000',
    tier: 3,
    sub_level: '10001-100000',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'elite',
  },
  {
    id: 'subtraction-100001-1000000',
    name: 'Subtraction 100,001–1,000,000',
    tier: 3,
    sub_level: '100001-1000000',
    category: 'subtraction',
    mastery_threshold: 30,
    style: 'elite',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// FULL REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_MASTERY_TOPICS: MasteryTopic[] = [
  ...TIER_1_TOPICS,
  ...TIER_2_TOPICS,
  ...TIER_3_TOPICS,
]

/** Lookup a topic by ID */
export function getTopicById(id: string): MasteryTopic | undefined {
  return ALL_MASTERY_TOPICS.find(t => t.id === id)
}

/** Get all topics for a specific tier */
export function getTopicsByTier(tier: 1 | 2 | 3): MasteryTopic[] {
  return ALL_MASTERY_TOPICS.filter(t => t.tier === tier)
}

/** Get tier counts for display: "Tier 1: 3/11 mastered" */
export function getTierCounts(): { tier: 1 | 2 | 3; total: number; label: string }[] {
  return [1, 2, 3].map(tier => ({
    tier: tier as 1 | 2 | 3,
    total: ALL_MASTERY_TOPICS.filter(t => t.tier === tier).length,
    label: tier === 1 ? 'Foundations' : tier === 2 ? 'Fluency' : 'Elite ⭐',
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION GENERATORS
// For each topic, generate a random question appropriate to that range/type.
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface GeneratedQuestion {
  topic_id: string
  question: string
  answer: string
  input_type: 'text'
  tier: 1 | 2 | 3
  sub_level: string
}

/** Generate a random question for a given topic ID */
export function generateQuestion(topicId: string): GeneratedQuestion | null {
  const topic = getTopicById(topicId)
  if (!topic) return null

  let question = ''
  let answer = ''

  switch (topicId) {
    // ── Counting ────────────────────────────────────────────────────────────
    case 'counting-2s': {
      const start = rand(0, 9) * 2
      const next = start + 2
      question = `Count in 2s: ${start}, ${start + 2 > next ? '' : start + 2}, ___`
      question = `What comes next? ${start}, ${start + 2}, ___`
      answer = String(start + 4)
      break
    }
    case 'counting-5s': {
      const start = rand(0, 9) * 5
      question = `What comes next? ${start}, ${start + 5}, ___`
      answer = String(start + 10)
      break
    }
    case 'counting-10s': {
      const start = rand(0, 9) * 10
      question = `What comes next? ${start}, ${start + 10}, ___`
      answer = String(start + 20)
      break
    }

    // ── Addition ────────────────────────────────────────────────────────────
    case 'addition-1-10': {
      const a = rand(1, 9); const b = rand(1, 10 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-11-20': {
      const a = rand(6, 14); const b = rand(11 - a > 1 ? 11 - a : 1, 20 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-21-50': {
      const a = rand(10, 40); const b = rand(1, 50 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-51-100': {
      const a = rand(25, 75); const b = rand(1, 100 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-101-500': {
      const a = rand(50, 400); const b = rand(1, 500 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-501-1000': {
      const a = rand(250, 750); const b = rand(1, 1000 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-1001-10000': {
      const a = rand(500, 8000); const b = rand(1, 10000 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-10001-100000': {
      const a = rand(5000, 80000); const b = rand(1, 100000 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }
    case 'addition-100001-1000000': {
      const a = rand(50000, 800000); const b = rand(1, 1000000 - a)
      question = `${a} + ${b} = ?`
      answer = String(a + b)
      break
    }

    // ── Subtraction ─────────────────────────────────────────────────────────
    case 'subtraction-1-10': {
      const a = rand(2, 10); const b = rand(1, a)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-11-20': {
      const a = rand(11, 20); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-21-50': {
      const a = rand(21, 50); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-51-100': {
      const a = rand(51, 100); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-101-500': {
      const a = rand(101, 500); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-501-1000': {
      const a = rand(501, 1000); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-1001-10000': {
      const a = rand(1001, 10000); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-10001-100000': {
      const a = rand(10001, 100000); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }
    case 'subtraction-100001-1000000': {
      const a = rand(100001, 1000000); const b = rand(1, a - 1)
      question = `${a} − ${b} = ?`
      answer = String(a - b)
      break
    }

    // ── Times tables ─────────────────────────────────────────────────────────
    default: {
      if (topicId.startsWith('times-')) {
        const n = parseInt(topicId.replace('times-', ''), 10)
        const other = rand(1, 12)
        question = `${n} × ${other} = ?`
        answer = String(n * other)
      } else if (topicId.startsWith('division-')) {
        const divisor = parseInt(topicId.replace('division-', ''), 10)
        const quotient = rand(1, 12)
        const dividend = divisor * quotient
        question = `${dividend} ÷ ${divisor} = ?`
        answer = String(quotient)
      }
      break
    }
  }

  if (!question) return null

  return {
    topic_id: topicId,
    question,
    answer,
    input_type: 'text',
    tier: topic.tier,
    sub_level: topic.sub_level,
  }
}

/** Generate a batch of unique questions for a topic */
export function generateQuestionBatch(topicId: string, count: number = 10): GeneratedQuestion[] {
  const seen = new Set<string>()
  const results: GeneratedQuestion[] = []
  let attempts = 0

  while (results.length < count && attempts < count * 5) {
    attempts++
    const q = generateQuestion(topicId)
    if (q && !seen.has(q.question)) {
      seen.add(q.question)
      results.push(q)
    }
  }

  return results
}
