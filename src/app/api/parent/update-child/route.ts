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

  const body = await req.json()
  const { childId, updates } = body

  if (!childId || !updates) {
    return NextResponse.json({ error: 'childId and updates required' }, { status: 400 })
  }

  // Verify child belongs to parent
  const { data: child } = await supabase
    .from('learners')
    .select('id, account_id')
    .eq('id', childId)
    .single()

  if (!child || child.account_id !== account.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Allowed fields to update
  const allowed: Record<string, unknown> = {}
  if (updates.pin !== undefined) allowed.pin = String(updates.pin).slice(0, 4)
  if (updates.username !== undefined) {
    const cleaned = updates.username.trim().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20)
    if (cleaned.length < 2) return NextResponse.json({ error: 'Username needs at least 2 characters' }, { status: 400 })
    
    // Check uniqueness
    const { data: existing } = await supabase
      .from('learners')
      .select('id')
      .ilike('username', cleaned)
      .neq('id', childId)
    
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Username taken' }, { status: 409 })
    }
    allowed.username = cleaned
  }
  if (updates.yearLevel !== undefined) allowed.year_level = updates.yearLevel
  if (updates.name !== undefined) allowed.name = updates.name
  if (updates.sessionLanguage !== undefined) allowed.session_language = updates.sessionLanguage
  if (updates.baselineResults !== undefined) allowed.baseline_results = updates.baselineResults
  if (updates.baselineDate !== undefined) allowed.baseline_date = updates.baselineDate

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('learners')
    .update(allowed)
    .eq('id', childId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
