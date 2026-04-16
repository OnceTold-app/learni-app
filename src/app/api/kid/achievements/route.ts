import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Badge definitions
const BADGES = [
  { id: 'first_session', name: 'First Steps', emoji: '👣', desc: 'Complete your first session', check: (s: Stats) => s.totalSessions >= 1 },
  { id: 'star_collector_50', name: 'Star Collector', emoji: '⭐', desc: 'Earn 50 stars', check: (s: Stats) => s.totalStars >= 50 },
  { id: 'star_collector_200', name: 'Star Hoarder', emoji: '🌟', desc: 'Earn 200 stars', check: (s: Stats) => s.totalStars >= 200 },
  { id: 'star_collector_500', name: 'Superstar', emoji: '💫', desc: 'Earn 500 stars', check: (s: Stats) => s.totalStars >= 500 },
  { id: 'streak_3', name: 'Warming Up', emoji: '🔥', desc: '3-day streak', check: (s: Stats) => s.streakDays >= 3 },
  { id: 'streak_7', name: 'On Fire', emoji: '🔥🔥', desc: '7-day streak', check: (s: Stats) => s.streakDays >= 7 },
  { id: 'streak_30', name: 'Unstoppable', emoji: '🏆', desc: '30-day streak', check: (s: Stats) => s.streakDays >= 30 },
  { id: 'perfect_session', name: 'Perfect Score', emoji: '💯', desc: 'Get every question right in a session', check: (s: Stats) => s.hadPerfectSession },
  { id: 'speed_star', name: 'Speed Star', emoji: '⚡', desc: '10 rapid fire in a row', check: (s: Stats) => s.bestStreak >= 10 },
  { id: 'marathon', name: 'Marathon Learner', emoji: '🏃', desc: '10 sessions completed', check: (s: Stats) => s.totalSessions >= 10 },
  { id: 'century', name: 'Century Club', emoji: '💪', desc: '100 questions answered', check: (s: Stats) => s.totalQuestions >= 100 },
  { id: 'helper', name: 'Smart Cookie', emoji: '🍪', desc: 'Ask for help 5 times (asking is smart!)', check: (s: Stats) => s.helpRequests >= 5 },
  { id: 'saver', name: 'Money Wise', emoji: '🐷', desc: 'Put 60%+ in Save jar 3 times', check: (s: Stats) => s.highSaveCount >= 3 },
  { id: 'generous', name: 'Big Heart', emoji: '💙', desc: 'Put 30%+ in Give jar 3 times', check: (s: Stats) => s.highGiveCount >= 3 },
]

interface Stats {
  totalSessions: number
  totalStars: number
  streakDays: number
  hadPerfectSession: boolean
  bestStreak: number
  totalQuestions: number
  helpRequests: number
  highSaveCount: number
  highGiveCount: number
}

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
    .select('stars_earned, questions_correct, questions_total, created_at')
    .eq('learner_id', childId)

  const { data: jars } = await db
    .from('jar_allocations')
    .select('save_pct, give_pct')
    .eq('learner_id', childId)

  const totalStars = (sessions || []).reduce((s, r) => s + (r.stars_earned || 0), 0)
  const totalQuestions = (sessions || []).reduce((s, r) => s + (r.questions_total || 0), 0)
  const hadPerfect = (sessions || []).some(s => s.questions_total > 3 && s.questions_correct === s.questions_total)

  // Calculate streak
  const dates = [...new Set((sessions || []).map(s => new Date(s.created_at).toDateString()))]
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (dates.includes(d.toDateString())) streak++
    else if (i > 0) break
  }

  const stats: Stats = {
    totalSessions: (sessions || []).length,
    totalStars,
    streakDays: streak,
    hadPerfectSession: hadPerfect,
    bestStreak: 0, // Would need to track in session
    totalQuestions,
    helpRequests: 0, // Would need to track
    highSaveCount: (jars || []).filter(j => (j.save_pct || 0) >= 60).length,
    highGiveCount: (jars || []).filter(j => (j.give_pct || 0) >= 30).length,
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
    ...b,
    earned: earnedIds.includes(b.id) || newBadges.includes(b.id),
    isNew: newBadges.includes(b.id),
    earnedAt: earnedMap[b.id] || null,
    check: undefined,
  }))

  return NextResponse.json({ badges: allBadges, newBadges })
}
