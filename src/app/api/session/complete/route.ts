import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const CompleteSessionSchema = z.object({
  childId: z.string().min(1),
  starsEarned: z.number().int().min(0).default(0),
  correctCount: z.number().int().min(0).default(0),
  totalQuestions: z.number().int().min(0).default(0),
  subjects: z.array(z.string()).optional().default(['Maths']),
  duration: z.number().int().min(0).default(0),
  jarAllocation: z.object({
    save: z.number().min(0).max(100).optional(),
    spend: z.number().min(0).max(100).optional(),
    give: z.number().min(0).max(100).optional(),
  }).optional(),
  weakTopics: z.array(z.string()).optional().default([]),
  strongTopics: z.array(z.string()).optional().default([]),
})

export async function POST(req: NextRequest) {
  try {
    const parseResult = CompleteSessionSchema.safeParse(await req.json())
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const {
      childId,
      starsEarned,
      correctCount,
      totalQuestions,
      subjects,
      duration,
      jarAllocation,
      weakTopics,
      strongTopics,
    } = parseResult.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        learner_id: childId,
        duration_seconds: duration,
        stars_earned: starsEarned,
        questions_correct: correctCount,
        questions_total: totalQuestions,
        subject: subjects.join(', '),
        topic: subjects.join(', '),
        completed_at: new Date().toISOString(),
        weak_topics: weakTopics,
        strong_topics: strongTopics,
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session save error:', sessionError)
      return NextResponse.json({ error: 'Failed to save session', detail: sessionError.message }, { status: 500 })
    }

    if (starsEarned > 0 && session?.id) {
      const { error: starError } = await supabase.from('star_ledger').insert({
        learner_id: childId,
        session_id: session.id,
        type: 'earned',
        stars: starsEarned,
        note: `Session: ${subjects.join(', ')}`,
      })
      if (starError) {
        console.error('Star ledger error:', starError)
      }
    }

    if (jarAllocation) {
      await supabase.from('jar_allocations').upsert({
        learner_id: childId,
        save_pct: jarAllocation.save ?? 50,
        spend_pct: jarAllocation.spend ?? 30,
        give_pct: jarAllocation.give ?? 20,
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
