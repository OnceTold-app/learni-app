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
  const { name, age, yearLevel, pin, language, sessionLanguage, school, interests, personality, challenges, parentGoals } = body

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
      school: school || null,
      interests: interests || [],
      personality: personality || null,
      learning_challenges: challenges || null,
      parent_goals: parentGoals || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Add child error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Alert Sterling via Telegram if a non-English teaching language is requested
  if (sessionLanguage && sessionLanguage !== 'en') {
    const LANGUAGE_NAMES: Record<string, string> = {
      mi: 'Te Reo Māori', af: 'Afrikaans', zh: 'Mandarin',
      hi: 'Hindi', sm: 'Samoan', fr: 'French', es: 'Spanish',
    }
    const langName = LANGUAGE_NAMES[sessionLanguage] || sessionLanguage
    const parentEmail = user.email || 'unknown'
    const msg = `🌐 *Language Request — Action Required*\n\nA new child has been added with a non-English teaching language.\n\n*Language:* ${langName}\n*Child:* ${name} (Year ${yearLevel})\n*Parent:* ${parentEmail}\n\nPlease update Earni's prompts and content for ${langName} ASAP. Treat this as urgent.`
    try {
      await fetch(\`https://api.telegram.org/bot\${process.env.STERLING_TELEGRAM_TOKEN}/sendMessage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.STERLING_CHAT_ID,
          text: msg,
          parse_mode: 'Markdown',
        }),
      })
    } catch (e) {
      console.warn('Telegram alert failed (non-fatal):', e)
    }
  }

  return NextResponse.json({ child: learner })
}
