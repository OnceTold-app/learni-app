import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { childId, stars, dollarValue, note } = await req.json()
  if (!childId || !stars) return NextResponse.json({ error: 'childId and stars required' }, { status: 400 })

  // Verify child belongs to this account
  const { data: account } = await supabase.from('accounts').select('id').eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  const { data: learner } = await supabase.from('learners').select('id').eq('id', childId).eq('account_id', account.id).single()
  if (!learner) return NextResponse.json({ error: 'Child not found' }, { status: 403 })

  // Write payout record to star_ledger
  const { error } = await supabase.from('star_ledger').insert({
    learner_id: childId,
    type: 'payout',
    stars: -Math.abs(stars), // negative = paid out
    dollar_value: dollarValue || null,
    note: note || 'Parent paid out reward',
    created_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
