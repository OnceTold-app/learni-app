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

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { childId } = await req.json()
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Verify child belongs to parent
  const { data: child } = await supabase
    .from('learners')
    .select('id, account_id')
    .eq('id', childId)
    .single()

  if (!child || child.account_id !== account.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete related data first
  await supabase.from('star_ledger').delete().eq('learner_id', childId)
  await supabase.from('sessions').delete().eq('learner_id', childId)
  await supabase.from('jar_allocations').delete().eq('learner_id', childId)
  await supabase.from('reward_settings').delete().eq('learner_id', childId)
  await supabase.from('earni_profiles').delete().eq('learner_id', childId)
  await supabase.from('learners').delete().eq('id', childId)

  return NextResponse.json({ success: true })
}
