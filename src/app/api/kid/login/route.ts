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

  // Find child by name + pin (case insensitive name)
  const { data: child, error } = await supabase
    .from('learners')
    .select('id, name, username, year_level, session_language, has_onboarded, account_id')
    .ilike('name', name.trim())
    .eq('pin', pin)
    .single()

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
