import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      childId,
      starsEarned,
      correctCount,
      totalQuestions,
      subjects,
      duration,
      jarAllocation,
    } = body

    if (!childId) {
      return NextResponse.json({ error: 'childId required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Save session (column names match actual schema)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        learner_id: childId,
        duration_seconds: duration || 0,
        stars_earned: starsEarned || 0,
        questions_correct: correctCount || 0,
        questions_total: totalQuestions || 0,
        subject: (subjects || ['Maths']).join(', '),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session save error:', sessionError)
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
    }

    // Add to star ledger (append-only)
    if (starsEarned > 0) {
      await supabase.from('star_ledger').insert({
        learner_id: childId,
        session_id: session?.id,
        amount: starsEarned,
        reason: `Session: ${(subjects || ['Practice']).join(', ')}`,
      })
    }

    // Update jar allocation if provided
    if (jarAllocation) {
      await supabase.from('jar_allocations').upsert({
        learner_id: childId,
        save_pct: jarAllocation.save || 50,
        spend_pct: jarAllocation.spend || 30,
        give_pct: jarAllocation.give || 20,
      }, { onConflict: 'learner_id' })
    }

    return NextResponse.json({
      success: true,
      sessionId: session?.id,
      starsEarned,
    })
  } catch (error) {
    console.error('Session complete error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
