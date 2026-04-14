import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/question?topicId=times-all&yearLevel=5&learnerId=xxx
 *
 * Returns a question from the bank that this learner hasn't seen recently.
 * Falls back to any question if all have been seen recently (last 7 days).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get('topicId')
    const yearLevel = parseInt(searchParams.get('yearLevel') || '0')
    const learnerId = searchParams.get('learnerId')
    const difficulty = searchParams.get('difficulty') ? parseInt(searchParams.get('difficulty')!) : null

    if (!topicId || !yearLevel) {
      return NextResponse.json({ error: 'topicId and yearLevel are required' }, { status: 400 })
    }

    // Build base query
    let query = supabase
      .from('question_bank')
      .select('*')
      .eq('topic_id', topicId)
      .eq('year_level', yearLevel)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    // Get recently seen question IDs for this learner (last 7 days)
    let recentlySeenIds: string[] = []
    if (learnerId) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: history } = await supabase
        .from('learner_question_history')
        .select('question_id')
        .eq('learner_id', learnerId)
        .gte('seen_at', sevenDaysAgo)

      if (history && history.length > 0) {
        recentlySeenIds = history.map((h: { question_id: string }) => h.question_id)
      }
    }

    // Try to get an unseen question first
    let question = null

    if (recentlySeenIds.length > 0) {
      const { data: unseenQuestions } = await query
        .not('id', 'in', `(${recentlySeenIds.join(',')})`)
        .limit(20)

      if (unseenQuestions && unseenQuestions.length > 0) {
        // Pick a random one from the results
        question = unseenQuestions[Math.floor(Math.random() * unseenQuestions.length)]
      }
    }

    // Fall back to any question (seen or not)
    if (!question) {
      const { data: anyQuestions } = await query.limit(20)
      if (anyQuestions && anyQuestions.length > 0) {
        question = anyQuestions[Math.floor(Math.random() * anyQuestions.length)]
      }
    }

    if (!question) {
      return NextResponse.json({ error: 'No questions found for this topic', topicId, yearLevel }, { status: 404 })
    }

    // Record that this learner has seen this question (fire and forget)
    if (learnerId && question.id) {
      supabase.from('learner_question_history').insert({
        learner_id: learnerId,
        question_id: question.id,
        seen_at: new Date().toISOString(),
        was_correct: null,
        attempts: 1,
      }).then(() => {}).catch(() => {})
    }

    return NextResponse.json({
      source: 'bank',
      ...question,
    })
  } catch (error) {
    console.error('Question bank API error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}

/**
 * PATCH /api/question — record result for a question
 * Body: { learnerId, questionId, wasCorrect }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { learnerId, questionId, wasCorrect } = await req.json()
    if (!learnerId || !questionId) {
      return NextResponse.json({ error: 'learnerId and questionId required' }, { status: 400 })
    }

    // Upsert history record
    await supabase.from('learner_question_history').upsert({
      learner_id: learnerId,
      question_id: questionId,
      seen_at: new Date().toISOString(),
      was_correct: wasCorrect,
    }, { onConflict: 'learner_id,question_id' })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Question PATCH error:', error)
    return NextResponse.json({ error: 'Failed to record result' }, { status: 500 })
  }
}
