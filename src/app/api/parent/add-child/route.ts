import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Verify token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get account
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const body = await req.json()
  const { name, age, yearLevel, pin, language, sessionLanguage } = body

  if (!name || !yearLevel) {
    return NextResponse.json({ error: 'Name and year level required' }, { status: 400 })
  }

  // Check child limit (1 on standard, up to 4 with add-ons)
  const { data: existing } = await supabase
    .from('learners')
    .select('id')
    .eq('account_id', account.id)

  if ((existing || []).length >= 4) {
    return NextResponse.json({ error: 'Maximum 4 children per account' }, { status: 400 })
  }

  // Create learner
  const { data: learner, error } = await supabase
    .from('learners')
    .insert({
      account_id: account.id,
      name,
      age: age || null,
      year_level: yearLevel,
      curriculum: 'nz',
      primary_language: language || 'en',
      session_language: sessionLanguage || 'en',
      input_mode: 'tap',
      pin: pin || '0000',
      has_onboarded: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Add child error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ child: learner })
}
