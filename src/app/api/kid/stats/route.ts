import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Get total stars from star_ledger
  const { data: starData } = await supabase
    .from('star_ledger')
    .select('amount')
    .eq('learner_id', childId)

  const totalStars = (starData || []).reduce((sum, row) => sum + (row.amount || 0), 0)

  // Get sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, created_at, duration_seconds, stars_earned, subject, questions_correct, questions_total')
    .eq('learner_id', childId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate total stars from sessions if star_ledger is empty
  const sessionStars = (sessions || []).reduce((sum, s) => sum + (s.stars_earned || 0), 0)

  // Calculate streak
  const dates = (sessions || []).map(s => new Date(s.created_at).toDateString())
  const uniqueDates = [...new Set(dates)]
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (uniqueDates.includes(d.toDateString())) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  // Get jar allocation
  const { data: jars } = await supabase
    .from('jar_allocations')
    .select('save_pct, spend_pct, give_pct')
    .eq('learner_id', childId)
    .single()

  // Get avatar
  let avatarUrl = null
  const { data: profile } = await supabase
    .from('earni_profiles')
    .select('*')
    .eq('learner_id', childId)
    .single()

  if (profile) {
    // Check if there's a stored URL or avatar_data on the learner
    avatarUrl = profile.avatar_url || null
  }

  // Also check learners table for avatar_data
  if (!avatarUrl) {
    const { data: learner } = await supabase
      .from('learners')
      .select('avatar_data')
      .eq('id', childId)
      .single()
    if (learner?.avatar_data?.url) {
      avatarUrl = learner.avatar_data.url
    }
  }

  return NextResponse.json({
    totalStars: totalStars || sessionStars,
    streak,
    sessions: sessions || [],
    sessionCount: (sessions || []).length,
    jars: jars || { save_pct: 50, spend_pct: 30, give_pct: 20 },
    avatarUrl,
  })
}
