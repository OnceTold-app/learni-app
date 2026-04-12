import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { name, pin } = await req.json()

  if (!name || !pin) {
    return NextResponse.json({ error: 'Name and PIN required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Find child by name OR username + pin
  const trimmed = name.trim()
  
  // Try username first, then name
  let child = null
  let error = null

  const { data: byUsername, error: err1 } = await supabase
    .from('learners')
    .select('id, name, username, year_level, session_language, has_onboarded, account_id')
    .ilike('username', trimmed)
    .eq('pin', pin)
    .single()

  if (byUsername) {
    child = byUsername
  } else {
    const { data: byName, error: err2 } = await supabase
      .from('learners')
      .select('id, name, username, year_level, session_language, has_onboarded, account_id')
      .ilike('name', trimmed)
      .eq('pin', pin)
      .single()
    child = byName
    error = err2
    if (err1 && err2) error = err2
  }

  if (error || !child) {
    return NextResponse.json({ error: "Hmm, that doesn't match. Check your name and PIN!" }, { status: 401 })
  }

  return NextResponse.json({
    child: {
      id: child.id,
      name: child.name,
      username: child.username,
      yearLevel: child.year_level,
      sessionLanguage: child.session_language,
      hasOnboarded: child.has_onboarded,
    }
  })
}
