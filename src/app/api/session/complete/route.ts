import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStarsEarned, starsToDollars } from '@/lib/stars'
import type { Subject, InputMode } from '@/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json()
  const {
    learnerId,
    subject,
    topic,
    questionsTotal,
    questionsCorrect,
    durationSeconds,
    inputModeUsed,
    streakDays,
  }: {
    learnerId: string
    subject: Subject
    topic: string
    questionsTotal: number
    questionsCorrect: number
    durationSeconds: number
    inputModeUsed: InputMode
    streakDays: number
  } = body

  // Verify this learner belongs to the authenticated user
  const { data: learner } = await supabase
    .from('learners')
    .select('id, account_id')
    .eq('id', learnerId)
    .single()

  if (!learner) {
    return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!account || learner.account_id !== account.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get reward settings to check weekly cap
  const { data: rewardSettings } = await supabase
    .from('reward_settings')
    .select('stars_per_dollar, weekly_star_cap, rewards_paused')
    .eq('learner_id', learnerId)
    .single()

  if (rewardSettings?.rewards_paused) {
    return NextResponse.json({ error: 'Rewards are paused' }, { status: 400 })
  }

  // Calculate stars earned this session
  const starsEarned = calculateStarsEarned(questionsCorrect, questionsTotal, streakDays)

  // Check weekly cap — sum stars earned this calendar week
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { data: weeklyEntries } = await supabase
    .from('star_ledger')
    .select('stars')
    .eq('learner_id', learnerId)
    .eq('type', 'earned')
    .gte('created_at', weekStart.toISOString())

  const weeklyTotal = weeklyEntries?.reduce((sum, e) => sum + e.stars, 0) ?? 0
  const cap = rewardSettings?.weekly_star_cap ?? 200
  const cappedStars = Math.max(0, Math.min(starsEarned, cap - weeklyTotal))

  // 1. Save the session row
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      learner_id: learnerId,
      subject,
      topic,
      questions_total: questionsTotal,
      questions_correct: questionsCorrect,
      stars_earned: cappedStars,
      duration_seconds: durationSeconds,
      input_mode_used: inputModeUsed,
    })
    .select()
    .single()

  if (sessionError || !session) {
    console.error('Session insert error:', sessionError)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }

  // 2. Add star ledger entry (only if stars were earned)
  if (cappedStars > 0) {
    const starsPerDollar = rewardSettings?.stars_per_dollar ?? 20
    const dollarValue = starsToDollars(cappedStars, starsPerDollar)

    await supabase.from('star_ledger').insert({
      learner_id: learnerId,
      session_id: session.id,
      type: 'earned',
      stars: cappedStars,
      dollar_value: dollarValue,
      note: `${topic} session`,
    })
  }

  return NextResponse.json({
    sessionId: session.id,
    starsEarned: cappedStars,
    weeklyCapReached: weeklyTotal + cappedStars >= cap,
  })
}
