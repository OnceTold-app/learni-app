import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function GET(req: NextRequest) {
  // Simple auth — check for admin token
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const adminEmail = 'admin@olckersgroup.com'

  const supabase = getSupabase()

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: account } = await supabase.from('accounts').select('email').eq('user_id', user.id).single()
    if (account?.email !== adminEmail && user.email !== adminEmail) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
  } else {
    // Allow with admin secret for cron/scripts
    const secret = req.nextUrl.searchParams.get('secret')
    if (secret !== process.env.ADMIN_REPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Accounts
  const { data: allAccounts } = await supabase.from('accounts').select('id, email, full_name, plan, trial_ends_at, subscription_status, created_at')
  const { data: newAccountsWeek } = await supabase.from('accounts').select('id').gte('created_at', weekAgo)
  const { data: newAccountsMonth } = await supabase.from('accounts').select('id').gte('created_at', monthAgo)

  // Trial status
  const trialing = (allAccounts || []).filter(a => {
    if (!a.trial_ends_at) return false
    return new Date(a.trial_ends_at) > now && a.subscription_status !== 'active'
  })
  const expired = (allAccounts || []).filter(a => {
    if (!a.trial_ends_at) return false
    return new Date(a.trial_ends_at) <= now && a.subscription_status !== 'active'
  })
  const active = (allAccounts || []).filter(a => a.subscription_status === 'active')

  // Learners
  const { data: allLearners } = await supabase.from('learners').select('id, name, year_level, account_id, topic_mastery, baseline_results')

  // Sessions — today
  const { data: sessionsToday } = await supabase.from('sessions').select('id, stars_earned, questions_correct, questions_total, duration_seconds').gte('completed_at', today)
  // Sessions — this week
  const { data: sessionsWeek } = await supabase.from('sessions').select('id, stars_earned, questions_correct, questions_total, duration_seconds, learner_id').gte('completed_at', weekAgo)
  // Sessions — all time
  const { data: sessionsAll } = await supabase.from('sessions').select('id, stars_earned, duration_seconds')

  // Stars
  const { data: starsAll } = await supabase.from('star_ledger').select('stars')
  const totalStarsEarned = (starsAll || []).reduce((s, r) => s + (r.stars || 0), 0)

  // Calculate metrics
  const totalSessionsToday = (sessionsToday || []).length
  const totalSessionsWeek = (sessionsWeek || []).length
  const totalSessionsAllTime = (sessionsAll || []).length
  const totalMinutesToday = (sessionsToday || []).reduce((s, r) => s + (r.duration_seconds || 0), 0) / 60
  const totalMinutesWeek = (sessionsWeek || []).reduce((s, r) => s + (r.duration_seconds || 0), 0) / 60
  const avgAccuracyWeek = (() => {
    const totals = (sessionsWeek || []).reduce((acc, s) => ({ c: acc.c + (s.questions_correct || 0), t: acc.t + (s.questions_total || 0) }), { c: 0, t: 0 })
    return totals.t > 0 ? Math.round((totals.c / totals.t) * 100) : 0
  })()

  // Active learners (had session this week)
  const activeLearnerIds = [...new Set((sessionsWeek || []).map(s => s.learner_id))]

  // Per-learner breakdown
  const learnerBreakdown = (allLearners || []).map(l => {
    const learnerSessions = (sessionsWeek || []).filter(s => s.learner_id === l.id)
    const learnerStars = learnerSessions.reduce((s, r) => s + (r.stars_earned || 0), 0)
    const mastery = l.topic_mastery || {}
    const topicCount = Object.keys(mastery).length
    const masteredCount = Object.values(mastery).filter((t: unknown) => {
      const topic = t as { correct: number; total: number }
      return topic.total >= 3 && (topic.correct / topic.total) >= 0.8
    }).length

    return {
      name: l.name,
      yearLevel: l.year_level,
      sessionsThisWeek: learnerSessions.length,
      starsThisWeek: learnerStars,
      topicsAttempted: topicCount,
      topicsMastered: masteredCount,
      hasBaseline: !!l.baseline_results,
    }
  })

  // Revenue estimate
  const activeSubscribers = active.length
  const mrr = activeSubscribers * 49 // Simplified — doesn't count add-on children
  const trialConversionRate = expired.length > 0 ? Math.round((active.length / (active.length + expired.length)) * 100) : 0

  // Get feedback this week
  const { data: feedback } = await supabase
    .from('session_feedback')
    .select('rating, earni_rating, free_text, created_at')
    .gte('created_at', weekAgo)
    .order('created_at', { ascending: false })

  const avgRating = feedback && feedback.length > 0
    ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
    : 'No feedback yet'
  const avgEarni = feedback && feedback.length > 0
    ? (feedback.reduce((s, f) => s + (f.earni_rating || 0), 0) / feedback.filter(f => f.earni_rating).length).toFixed(1)
    : 'No feedback yet'

  return NextResponse.json({
    generated: now.toISOString(),
    overview: {
      totalAccounts: (allAccounts || []).length,
      newThisWeek: (newAccountsWeek || []).length,
      newThisMonth: (newAccountsMonth || []).length,
      trialing: trialing.length,
      trialExpired: expired.length,
      activeSubscribers: active.length,
      totalLearners: (allLearners || []).length,
      activeLearners: activeLearnerIds.length,
    },
    sessions: {
      today: totalSessionsToday,
      thisWeek: totalSessionsWeek,
      allTime: totalSessionsAllTime,
      minutesToday: Math.round(totalMinutesToday),
      minutesThisWeek: Math.round(totalMinutesWeek),
      avgAccuracyWeek: `${avgAccuracyWeek}%`,
    },
    stars: {
      totalEarned: totalStarsEarned,
    },
    revenue: {
      activeSubscribers,
      estimatedMRR: `$${mrr} NZD`,
      trialConversionRate: `${trialConversionRate}%`,
    },
    learners: learnerBreakdown,
    feedback: {
      thisWeek: (feedback || []).length,
      avgSessionRating: avgRating,
      avgEarniRating: avgEarni,
      recentComments: (feedback || []).filter(f => f.free_text).slice(0, 5).map(f => f.free_text),
    },
    accounts: (allAccounts || []).map(a => ({
      email: a.email,
      name: a.full_name,
      plan: a.plan || 'trial',
      status: a.subscription_status || 'trialing',
      trialEnds: a.trial_ends_at,
    })),
  })
}
