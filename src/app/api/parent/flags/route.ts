import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/parent/flags?childId=xxx
 * Returns flagged session responses for a child — parent dashboard use only.
 */
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const db = supabase()
  const { data, error } = await db
    .from('session_flags')
    .select('*')
    .eq('learner_id', childId)
    .order('flagged_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flags: data || [] })
}

/**
 * PATCH /api/parent/flags — mark a flag as reviewed
 */
export async function PATCH(req: NextRequest) {
  const { flagId } = await req.json()
  if (!flagId) return NextResponse.json({ error: 'flagId required' }, { status: 400 })

  const db = supabase()
  await db
    .from('session_flags')
    .update({ reviewed: true, reviewed_at: new Date().toISOString() })
    .eq('id', flagId)

  return NextResponse.json({ ok: true })
}
