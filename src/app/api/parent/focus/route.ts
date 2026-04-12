import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// GET focus areas for a child
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { data } = await supabase()
    .from('learners')
    .select('focus_areas')
    .eq('id', childId)
    .single()

  return NextResponse.json({ focusAreas: data?.focus_areas || [] })
}

// POST to update focus areas
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabase()
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await db.from('accounts').select('id').eq('user_id', user.id).single()
  if (!account) return NextResponse.json({ error: 'No account' }, { status: 404 })

  const { childId, focusAreas } = await req.json()
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Verify child belongs to parent
  const { data: child } = await db.from('learners').select('id, account_id').eq('id', childId).single()
  if (!child || child.account_id !== account.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await db
    .from('learners')
    .update({ focus_areas: focusAreas || [] })
    .eq('id', childId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
