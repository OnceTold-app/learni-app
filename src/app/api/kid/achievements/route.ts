import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface Stats {
  totalSessions: number
  // Per-subject star counts
  mathsStars: number
  readingStars: number
  wealthStars: number
  totalStars: number
  // Streak
  streakDays: number
  // Mastery
  masteredTopics: number
  masteredCategories: string[]  // category names where ALL topics are mastered
  // Return behaviour
  longestAbsenceDays: number   // longest gap between sessions
  // Existing
  bestStreak: number
  totalQuestions: number
}

interface Badge {
  id: string
  name: string
  emoji: string
  subject: string | null
  earniSays: string
  desc: string
  check: (s: Stats) => boolean
}

// Badge definitions
const BADGES: Badge[] = [
  // ── EFFORT: per-subject star milestones ─────────────────────────────────────
  // Maths effort
  { id: 'maths_spark',       name: 'First Spark',      emoji: '✨', subject: 'Maths',       desc: 'Earn your first Maths star',         earniSays: "You started. That's everything.",                          check: (s: Stats) => s.mathsStars >= 1 },
  { id: 'maths_warm',        name: 'Getting Warm',     emoji: '🌡️', subject: 'Maths',       desc: 'Earn 50 Maths stars',                earniSays: "You're building something here.",                          check: (s: Stats) => s.mathsStars >= 50 },
  { id: 'maths_way',         name: 'On Your Way',      emoji: '🛤️', subject: 'Maths',       desc: 'Earn 150 Maths stars',               earniSays: 'This is becoming a habit — a good one.',                   check: (s: Stats) => s.mathsStars >= 150 },
  { id: 'maths_on',          name: 'Switched On',      emoji: '💡', subject: 'Maths',       desc: 'Earn 400 Maths stars',               earniSays: "You've put in real work. It shows.",                       check: (s: Stats) => s.mathsStars >= 400 },
  { id: 'maths_sharp',       name: 'Sharp',            emoji: '🎯', subject: 'Maths',       desc: 'Earn 1,000 Maths stars',             earniSays: 'Not many kids get here. You did.',                         check: (s: Stats) => s.mathsStars >= 1000 },
  { id: 'maths_brilliant',   name: 'Brilliant',        emoji: '🌠', subject: 'Maths',       desc: 'Earn 2,500 Maths stars',             earniSays: 'You should be proud of this.',                             check: (s: Stats) => s.mathsStars >= 2500 },
  { id: 'maths_extra',       name: 'Extraordinary',    emoji: '🚀', subject: 'Maths',       desc: 'Earn 6,000 Maths stars',             earniSays: 'This is exceptional. Remember this feeling.',              check: (s: Stats) => s.mathsStars >= 6000 },

  // Reading effort
  { id: 'reading_spark',     name: 'First Spark',      emoji: '✨', subject: 'Reading',     desc: 'Earn your first Reading star',       earniSays: "You started. That's everything.",                          check: (s: Stats) => s.readingStars >= 1 },
  { id: 'reading_warm',      name: 'Getting Warm',     emoji: '🌡️', subject: 'Reading',     desc: 'Earn 50 Reading stars',              earniSays: "You're building something here.",                          check: (s: Stats) => s.readingStars >= 50 },
  { id: 'reading_way',       name: 'On Your Way',      emoji: '🛤️', subject: 'Reading',     desc: 'Earn 150 Reading stars',             earniSays: 'This is becoming a habit — a good one.',                   check: (s: Stats) => s.readingStars >= 150 },
  { id: 'reading_on',        name: 'Switched On',      emoji: '💡', subject: 'Reading',     desc: 'Earn 400 Reading stars',             earniSays: "You've put in real work. It shows.",                       check: (s: Stats) => s.readingStars >= 400 },
  { id: 'reading_sharp',     name: 'Sharp',            emoji: '🎯', subject: 'Reading',     desc: 'Earn 1,000 Reading stars',           earniSays: 'Not many kids get here. You did.',                         check: (s: Stats) => s.readingStars >= 1000 },
  { id: 'reading_brilliant', name: 'Brilliant',        emoji: '🌠', subject: 'Reading',     desc: 'Earn 2,500 Reading stars',           earniSays: 'You should be proud of this.',                             check: (s: Stats) => s.readingStars >= 2500 },
  { id: 'reading_extra',     name: 'Extraordinary',    emoji: '🚀', subject: 'Reading',     desc: 'Earn 6,000 Reading stars',           earniSays: 'This is exceptional. Remember this feeling.',              check: (s: Stats) => s.readingStars >= 6000 },

  // Wealth Wise effort
  { id: 'wealth_spark',      name: 'First Spark',      emoji: '✨', subject: 'Wealth Wise', desc: 'Earn your first Wealth Wise star',   earniSays: "You started. That's everything.",                          check: (s: Stats) => s.wealthStars >= 1 },
  { id: 'wealth_warm',       name: 'Getting Warm',     emoji: '🌡️', subject: 'Wealth Wise', desc: 'Earn 50 Wealth Wise stars',          earniSays: "You're building something here.",                          check: (s: Stats) => s.wealthStars >= 50 },
  { id: 'wealth_way',        name: 'On Your Way',      emoji: '🛤️', subject: 'Wealth Wise', desc: 'Earn 150 Wealth Wise stars',         earniSays: 'This is becoming a habit — a good one.',                   check: (s: Stats) => s.wealthStars >= 150 },
  { id: 'wealth_on',         name: 'Switched On',      emoji: '💡', subject: 'Wealth Wise', desc: 'Earn 400 Wealth Wise stars',         earniSays: "You've put in real work. It shows.",                       check: (s: Stats) => s.wealthStars >= 400 },
  { id: 'wealth_sharp',      name: 'Sharp',            emoji: '🎯', subject: 'Wealth Wise', desc: 'Earn 1,000 Wealth Wise stars',       earniSays: 'Not many kids get here. You did.',                         check: (s: Stats) => s.wealthStars >= 1000 },
  { id: 'wealth_brilliant',  name: 'Brilliant',        emoji: '🌠', subject: 'Wealth Wise', desc: 'Earn 2,500 Wealth Wise stars',       earniSays: 'You should be proud of this.',                             check: (s: Stats) => s.wealthStars >= 2500 },
  { id: 'wealth_extra',      name: 'Extraordinary',    emoji: '🚀', subject: 'Wealth Wise', desc: 'Earn 6,000 Wealth Wise stars',       earniSays: 'This is exceptional. Remember this feeling.',              check: (s: Stats) => s.wealthStars >= 6000 },

  // ── CONSISTENCY: streak and return ──────────────────────────────────────────
  { id: 'streak_3',          name: 'Showed Up',        emoji: '🔥', subject: null,          desc: '3 day streak',                       earniSays: "Three days straight. That's how it starts.",               check: (s: Stats) => s.streakDays >= 3 },
  { id: 'streak_7',          name: 'Making it a Habit',emoji: '📅', subject: null,          desc: '7 day streak',                       earniSays: "A whole week. You're serious about this.",                 check: (s: Stats) => s.streakDays >= 7 },
  { id: 'streak_30',         name: 'The Real Deal',    emoji: '💎', subject: null,          desc: '30 day streak',                      earniSays: "A month. You've earned every star.",                       check: (s: Stats) => s.streakDays >= 30 },
  { id: 'back_again',        name: 'Back Again',       emoji: '🔄', subject: null,          desc: 'Returns after 7+ days away',         earniSays: 'You came back. That matters more than you think.',         check: (s: Stats) => s.longestAbsenceDays >= 7 && s.totalSessions >= 2 },
  { id: 'never_quit',        name: 'Never Quit',       emoji: '🧗', subject: null,          desc: 'Returns after 30+ days away',        earniSays: "Some people don't come back. You did.",                    check: (s: Stats) => s.longestAbsenceDays >= 30 && s.totalSessions >= 2 },

  // ── MASTERY: skill based ─────────────────────────────────────────────────────
  { id: 'cracked_it',        name: 'Cracked It',       emoji: '🟢', subject: null,          desc: 'First skill mastered',               earniSays: 'You owned that. Completely.',                              check: (s: Stats) => s.masteredTopics >= 1 },
  { id: 'on_a_roll',         name: 'On a Roll',        emoji: '🎳', subject: null,          desc: '5 skills mastered',                  earniSays: 'Five skills locked in. Keep going.',                       check: (s: Stats) => s.masteredTopics >= 5 },
  { id: 'getting_dangerous', name: 'Getting Dangerous',emoji: '⚡', subject: null,          desc: '15 skills mastered',                 earniSays: "You're becoming someone who's good at this.",              check: (s: Stats) => s.masteredTopics >= 15 },
  { id: 'unstoppable',       name: 'Unstoppable',      emoji: '🏆', subject: null,          desc: 'All topics in one category mastered',earniSays: "You've mastered an entire area. That's rare.",             check: (s: Stats) => s.masteredCategories.length >= 1 },
]

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const db = supabase()

  // Get earned badges
  const { data: earned } = await db
    .from('achievements')
    .select('badge_id, earned_at')
    .eq('learner_id', childId)

  const earnedIds = (earned || []).map(e => e.badge_id)

  // Get stats for checking new badges
  const { data: sessions } = await db
    .from('sessions')
    .select('stars_earned, questions_correct, questions_total, created_at, subject')
    .eq('learner_id', childId)

  const allSessions = sessions || []
  const totalStars = allSessions.reduce((s, r) => s + (r.stars_earned || 0), 0)
  const totalQuestions = allSessions.reduce((s, r) => s + (r.questions_total || 0), 0)

  // Per-subject stars — match by subject field in sessions table
  const mathsStars = allSessions
    .filter(s => {
      const sub = (s.subject || '').toLowerCase()
      return sub.includes('maths') || sub.includes('math') || sub.includes('counting') || sub.includes('addition') || sub.includes('subtraction') || sub.includes('times') || sub.includes('division')
    })
    .reduce((acc, s) => acc + (s.stars_earned || 0), 0)

  const readingStars = allSessions
    .filter(s => {
      const sub = (s.subject || '').toLowerCase()
      return sub.includes('reading') || sub.includes('writing') || sub.includes('spelling') || sub.includes('grammar') || sub.includes('comprehension')
    })
    .reduce((acc, s) => acc + (s.stars_earned || 0), 0)

  const wealthStars = allSessions
    .filter(s => {
      const sub = (s.subject || '').toLowerCase()
      return sub.includes('wealth') || sub.includes('money') || sub.includes('financial') || sub.includes('saving') || sub.includes('vault')
    })
    .reduce((acc, s) => acc + (s.stars_earned || 0), 0)

  // Calculate streak
  const dates = [...new Set(allSessions.map(s => new Date(s.created_at).toDateString()))]
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (dates.includes(d.toDateString())) streak++
    else if (i > 0) break
  }

  // Mastery stats
  const { data: masteryRows } = await db
    .from('topic_mastery')
    .select('topic_id, is_mastered')
    .eq('learner_id', childId)
    .eq('is_mastered', true)

  const masteredTopics = (masteryRows || []).length

  // Check if all topics in a category are mastered
  const { ALL_MASTERY_TOPICS } = await import('@/lib/question-bank-generator')
  const masteredIds = new Set((masteryRows || []).map(r => r.topic_id))
  const categories = [...new Set(ALL_MASTERY_TOPICS.map(t => t.category))]
  const masteredCategories = categories.filter(cat => {
    const catTopics = ALL_MASTERY_TOPICS.filter(t => t.category === cat)
    return catTopics.length > 0 && catTopics.every(t => masteredIds.has(t.id))
  })

  // Longest absence calculation
  const sessionDates = allSessions
    .map(s => new Date(s.created_at).getTime())
    .sort((a, b) => a - b)

  let longestAbsenceDays = 0
  for (let i = 1; i < sessionDates.length; i++) {
    const gap = (sessionDates[i] - sessionDates[i - 1]) / (1000 * 60 * 60 * 24)
    if (gap > longestAbsenceDays) longestAbsenceDays = gap
  }

  const stats: Stats = {
    totalSessions: allSessions.length,
    mathsStars,
    readingStars,
    wealthStars,
    totalStars,
    streakDays: streak,
    masteredTopics,
    masteredCategories,
    longestAbsenceDays,
    bestStreak: 0,
    totalQuestions,
  }

  // Check for new badges
  const newBadges: string[] = []
  for (const badge of BADGES) {
    if (!earnedIds.includes(badge.id) && badge.check(stats)) {
      await db.from('achievements').insert({ learner_id: childId, badge_id: badge.id })
      newBadges.push(badge.id)
    }
  }

  const earnedMap = Object.fromEntries((earned || []).map(e => [e.badge_id, e.earned_at]))

  const allBadges = BADGES.map(b => ({
    id: b.id,
    name: b.name,
    emoji: b.emoji,
    subject: b.subject,
    earniSays: b.earniSays,
    desc: b.desc,
    earned: earnedIds.includes(b.id) || newBadges.includes(b.id),
    isNew: newBadges.includes(b.id),
    earnedAt: earnedMap[b.id] || null,
  }))

  return NextResponse.json({ badges: allBadges, newBadges })
}
