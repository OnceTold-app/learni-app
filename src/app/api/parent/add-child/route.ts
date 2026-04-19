import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const AddChildSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  yearLevel: z.number().int().min(1).max(13),
  age: z.number().int().min(0).max(20).optional(),
  pin: z.string().min(4).max(8).default('0000'),
  language: z.string().optional().default('en'),
  sessionLanguage: z.string().optional().default('en'),
  school: z.string().optional(),
  interests: z.array(z.string()).optional().default([]),
  personality: z.string().optional(),
  challenges: z.string().optional(),
  parentGoals: z.string().optional(),
  username: z.string().optional(),
})

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

  // Validate request body
  const parseResult = AddChildSchema.safeParse(await req.json())
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  const {
    name, age, yearLevel, pin, language, sessionLanguage,
    school, interests, personality, challenges, parentGoals, username,
  } = parseResult.data

  // Check child limit (max 4 per account)
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
      username: username ? username.toLowerCase().trim() : null,
      age: age || null,
      year_level: yearLevel,
      curriculum: 'nz',
      primary_language: language,
      session_language: sessionLanguage,
      input_mode: 'tap',
      pin,
      has_onboarded: false,
      school: school || null,
      interests,
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

  // Alert via Telegram if a non-English teaching language is requested
  if (sessionLanguage && sessionLanguage !== 'en') {
    const LANGUAGE_NAMES: Record<string, string> = {
      mi: 'Te Reo Māori', af: 'Afrikaans', zh: 'Mandarin',
      hi: 'Hindi', sm: 'Samoan', fr: 'French', es: 'Spanish',
    }
    const langName = LANGUAGE_NAMES[sessionLanguage] || sessionLanguage
    const parentEmail = user.email || 'unknown'
    const msg = `🌐 *Language Request — Action Required*\n\nA new child has been added with a non-English teaching language.\n\n*Language:* ${langName}\n*Child:* ${name} (Year ${yearLevel})\n*Parent:* ${parentEmail}\n\nPlease update Earni's prompts and content for ${langName} ASAP. Treat this as urgent.`
    try {
      const tgUrl = 'https://api.telegram.org/bot' + process.env.STERLING_TELEGRAM_TOKEN + '/sendMessage'
      await fetch(tgUrl, {
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
