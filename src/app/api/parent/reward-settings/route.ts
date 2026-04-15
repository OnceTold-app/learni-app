import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SETTINGS = {
  starsPerDollar: 20,
  weeklyStarCap: 200,
  rewardsPaused: false,
}

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return null

  return { user, supabase }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user, supabase } = auth
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Verify the child belongs to this parent's account
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { data: learner } = await supabase
    .from('learners')
    .select('id')
    .eq('id', childId)
    .eq('account_id', account.id)
    .single()

  if (!learner) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const { data: settings } = await supabase
    .from('reward_settings')
    .select('stars_per_dollar, weekly_star_cap, rewards_paused')
    .eq('learner_id', childId)
    .single()

  if (!settings) {
    return NextResponse.json(DEFAULT_SETTINGS)
  }

  return NextResponse.json({
    starsPerDollar: settings.stars_per_dollar ?? DEFAULT_SETTINGS.starsPerDollar,
    weeklyStarCap: settings.weekly_star_cap ?? DEFAULT_SETTINGS.weeklyStarCap,
    rewardsPaused: settings.rewards_paused ?? DEFAULT_SETTINGS.rewardsPaused,
  })
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user, supabase } = auth
  const body = await req.json()
  const { childId, starsPerDollar, weeklyStarCap, rewardsPaused } = body

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Verify the child belongs to this parent's account
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { data: learner } = await supabase
    .from('learners')
    .select('id')
    .eq('id', childId)
    .eq('account_id', account.id)
    .single()

  if (!learner) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const { error } = await supabase
    .from('reward_settings')
    .upsert(
      {
        learner_id: childId,
        stars_per_dollar: starsPerDollar ?? DEFAULT_SETTINGS.starsPerDollar,
        weekly_star_cap: weeklyStarCap ?? DEFAULT_SETTINGS.weeklyStarCap,
        rewards_paused: rewardsPaused ?? DEFAULT_SETTINGS.rewardsPaused,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'learner_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
