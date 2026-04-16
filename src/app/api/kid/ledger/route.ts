import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: ledger } = await supabase
    .from('star_ledger')
    .select('*')
    .eq('learner_id', childId)
    .order('created_at', { ascending: false })
    .limit(50)

  const entries = ledger || []

  const totalEarned = entries.filter(e => e.type === 'earned').reduce((s, e) => s + (e.stars || 0), 0)
  const totalPaidOut = entries.filter(e => e.type === 'payout').reduce((s, e) => s + Math.abs(e.stars || 0), 0)
  const lastPayout = entries.find(e => e.type === 'payout') || null

  return NextResponse.json({
    ledger: entries.slice(0, 10),
    lifetimeStats: { totalEarned, totalPaidOut, lastPayout }
  })
}
