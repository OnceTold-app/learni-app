import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Verify token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get children with star totals
  const { data: children, error } = await supabase
    .from('learners')
    .select('id, name, year_level, created_at')
    .eq('account_id', user.id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get star totals for each child
  const enriched = await Promise.all((children || []).map(async (child) => {
    const { data: stars } = await supabase
      .from('star_ledger')
      .select('amount')
      .eq('learner_id', child.id)

    const totalStars = (stars || []).reduce((sum, s) => sum + (s.amount || 0), 0)

    // Get last session
    const { data: lastSession } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('learner_id', child.id)
      .order('created_at', { ascending: false })
      .limit(1)

    return {
      ...child,
      total_stars: totalStars,
      streak_days: 0, // TODO: calculate from sessions
      last_session: lastSession?.[0]?.created_at || null,
    }
  }))

  return NextResponse.json({ children: enriched })
}
