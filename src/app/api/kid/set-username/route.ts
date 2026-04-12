import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { childId, username } = await req.json()

  if (!childId || !username) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const cleaned = username.trim().replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20)
  if (cleaned.length < 2) {
    return NextResponse.json({ error: 'Username needs at least 2 characters' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Check uniqueness
  const { data: existing } = await supabase
    .from('learners')
    .select('id')
    .ilike('username', cleaned)
    .neq('id', childId)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'That username is taken — try another!' }, { status: 409 })
  }

  const { error } = await supabase
    .from('learners')
    .update({ username: cleaned, has_onboarded: true })
    .eq('id', childId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ username: cleaned })
}
