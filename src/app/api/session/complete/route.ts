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

    // Save session — ACTUAL column names from DB:
    // id, learner_id, subject, topic, questions_total, questions_correct,
    // stars_earned, duration_seconds, input_mode_used, completed_at, weak_topics, strong_topics
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        learner_id: childId,
        duration_seconds: duration || 0,
        stars_earned: starsEarned || 0,
        questions_correct: correctCount || 0,
        questions_total: totalQuestions || 0,
        subject: (subjects || ['Maths']).join(', '),
        topic: (subjects || ['Maths']).join(', '),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session save error:', sessionError)
      return NextResponse.json({ error: 'Failed to save session', detail: sessionError.message }, { status: 500 })
    }

    // Add to star ledger — ACTUAL column names:
    // id, learner_id, session_id, type, stars, dollar_value, note, created_at
    if (starsEarned > 0 && session?.id) {
      const { error: starError } = await supabase.from('star_ledger').insert({
        learner_id: childId,
        session_id: session.id,
        type: 'earned',
        stars: starsEarned,
        note: `Session: ${(subjects || ['Practice']).join(', ')}`,
      })
      if (starError) {
        console.error('Star ledger error:', starError)
      }
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
