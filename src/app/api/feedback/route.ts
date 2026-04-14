import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, learnerId, rating, enjoyed, struggledWith, earniRating, wouldDoAgain, freeText, submittedBy } = body

    if (!learnerId) return NextResponse.json({ error: 'learnerId required' }, { status: 400 })

    const { error } = await supabase()
      .from('session_feedback')
      .insert({
        session_id: sessionId || null,
        learner_id: learnerId,
        rating: rating || null,
        enjoyed: enjoyed || null,
        struggled_with: struggledWith || null,
        earni_rating: earniRating || null,
        would_do_again: wouldDoAgain ?? null,
        free_text: freeText || null,
        submitted_by: submittedBy || 'kid',
      })

    if (error) {
      console.error('Feedback save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Admin only — get all feedback
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.ADMIN_REPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase()
    .from('session_feedback')
    .select('*, learners(name, year_level)')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ feedback: data || [] })
}
