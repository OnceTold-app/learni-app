import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const KidLoginSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pin: z.string().min(1, 'PIN is required'),
})

export async function POST(req: NextRequest) {
  const parseResult = KidLoginSchema.safeParse(await req.json())
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Name and PIN required', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  const { name, pin } = parseResult.data
  const trimmed = name.trim()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  // Find child by username OR name + pin
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
    },
  })
}
