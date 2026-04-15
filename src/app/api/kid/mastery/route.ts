import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ALL_MASTERY_TOPICS, getTopicById } from '@/lib/question-bank-generator'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// GET mastery data for a child — used by session, kid hub, and mastery map
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const db = supabase()

  // Fetch legacy mastery from learners.topic_mastery (JSONB)
  const { data: learnerData } = await db
    .from('learners')
    .select('topic_mastery')
    .eq('id', childId)
    .single()

  const mastery = learnerData?.topic_mastery || {}

  // Fetch structured topic_mastery rows (new system)
  let topicMasteryRows: Array<{
    topic_id: string
    tier: number
    correct_count: number
    streak_current: number
    streak_best: number
    is_mastered: boolean
    last_seen: string | null
  }> = []
  try {
    const { data: tmRows } = await db
      .from('topic_mastery')
      .select('topic_id, tier, correct_count, streak_current, streak_best, is_mastered, last_seen')
      .eq('learner_id', childId)
    topicMasteryRows = tmRows || []
  } catch {
    // table may not exist yet — graceful fallback
  }

  // Fetch fact_mastery rows for heatmap
  let factMasteryRows: Array<{
    factor_a: number
    factor_b: number
    correct_streak: number
    total_correct: number
    total_attempts: number
  }> = []
  try {
    const { data: fmRows } = await db
      .from('fact_mastery')
      .select('factor_a, factor_b, correct_streak, total_correct, total_attempts')
      .eq('learner_id', childId)
    factMasteryRows = fmRows || []
  } catch {
    // table may not exist yet — graceful fallback
  }

  // Build tier summary: how many mastered per tier
  const tmByTopicId = new Map(topicMasteryRows.map(r => [r.topic_id, r]))

  const tierSummary = [1, 2, 3].map(tier => {
    const tierTopics = ALL_MASTERY_TOPICS.filter(t => t.tier === tier)
    const mastered = tierTopics.filter(t => {
      const row = tmByTopicId.get(t.id)
      return row?.is_mastered === true
    }).length
    return { tier, total: tierTopics.length, mastered }
  })

  // Build weak/strong/review from legacy mastery JSONB
  const weakTopics: string[] = []
  const strongTopics: string[] = []
  const reviewTopics: string[] = []

  for (const [topic, stats] of Object.entries(mastery)) {
    const s = stats as { correct: number; total: number; lastSeen: string }
    const pct = s.total > 0 ? (s.correct / s.total) * 100 : 0
    if (pct < 60 && s.total >= 2) weakTopics.push(topic)
    else if (pct > 85 && s.total >= 3) strongTopics.push(topic)

    if (s.lastSeen) {
      const daysSince = (Date.now() - new Date(s.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince > 3 && pct < 90) reviewTopics.push(topic)
    }
  }

  return NextResponse.json({
    mastery,
    weakTopics,
    strongTopics,
    reviewTopics,
    topicMastery: topicMasteryRows,
    factMastery: factMasteryRows,
    tierSummary,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse factor_a and factor_b from a times table question string
// e.g. "7 × 8 = ?" → { a: 7, b: 8 }
// ─────────────────────────────────────────────────────────────────────────────
function parseTimesFactors(question: string): { a: number; b: number } | null {
  // Match patterns: "7 × 8", "7 x 8", "7 * 8", "7×8"
  const match = question.match(/(\d+)\s*[×x\*]\s*(\d+)/)
  if (!match) return null
  const a = parseInt(match[1], 10)
  const b = parseInt(match[2], 10)
  if (isNaN(a) || isNaN(b) || a < 1 || a > 12 || b < 1 || b > 12) return null
  return { a, b }
}

// POST to update mastery after a session
export async function POST(req: NextRequest) {
  const { childId, results } = await req.json()
  if (!childId || !results) return NextResponse.json({ error: 'childId and results required' }, { status: 400 })

  const db = supabase()

  // ── Legacy JSONB mastery update (learners.topic_mastery) ──────────────────
  const { data } = await db
    .from('learners')
    .select('topic_mastery')
    .eq('id', childId)
    .single()

  const mastery = data?.topic_mastery || {}

  for (const r of results) {
    if (!r.topic) continue
    const topic = r.topic.toLowerCase().trim()
    if (!mastery[topic]) mastery[topic] = { correct: 0, total: 0, lastSeen: new Date().toISOString() }
    mastery[topic].total += 1
    if (r.correct) mastery[topic].correct += 1
    mastery[topic].lastSeen = new Date().toISOString()
  }

  await db
    .from('learners')
    .update({ topic_mastery: mastery })
    .eq('id', childId)

  // ── New structured topic_mastery table ────────────────────────────────────
  const topicUpdates: Array<{
    topicId: string
    correct: boolean
    question?: string
  }> = []

  for (const r of results) {
    if (!r.topic) continue
    const topicId = r.topic.toLowerCase().trim()
    topicUpdates.push({ topicId, correct: !!r.correct, question: r.question || '' })
  }

  // Process topic_mastery upserts
  for (const upd of topicUpdates) {
    const topicDef = getTopicById(upd.topicId)
    const tier = topicDef?.tier ?? 1

    try {
      // Fetch existing row
      const { data: existing } = await db
        .from('topic_mastery')
        .select('*')
        .eq('learner_id', childId)
        .eq('topic_id', upd.topicId)
        .single()

      if (existing) {
        const newCorrectCount = upd.correct ? existing.correct_count + 1 : existing.correct_count
        const newStreak = upd.correct ? existing.streak_current + 1 : 0
        const newBest = Math.max(existing.streak_best, newStreak)
        const threshold = topicDef?.mastery_threshold ?? 30
        const isMastered = newCorrectCount >= threshold

        await db
          .from('topic_mastery')
          .update({
            correct_count: newCorrectCount,
            streak_current: newStreak,
            streak_best: newBest,
            is_mastered: isMastered,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('learner_id', childId)
          .eq('topic_id', upd.topicId)
      } else {
        const newCorrectCount = upd.correct ? 1 : 0
        const newStreak = upd.correct ? 1 : 0
        await db.from('topic_mastery').insert({
          learner_id: childId,
          topic_id: upd.topicId,
          tier,
          correct_count: newCorrectCount,
          streak_current: newStreak,
          streak_best: newStreak,
          is_mastered: false,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch {
      // topic_mastery table may not exist yet — skip gracefully
    }

    // ── fact_mastery update for times tables ──────────────────────────────
    const isTimesTopic = upd.topicId.includes('times') || upd.topicId.includes('multiplication')
    if (isTimesTopic && upd.question) {
      const factors = parseTimesFactors(upd.question)
      if (factors) {
        try {
          const { data: existingFact } = await db
            .from('fact_mastery')
            .select('*')
            .eq('learner_id', childId)
            .eq('factor_a', factors.a)
            .eq('factor_b', factors.b)
            .single()

          if (existingFact) {
            const newStreak = upd.correct ? existingFact.correct_streak + 1 : 0
            await db
              .from('fact_mastery')
              .update({
                correct_streak: newStreak,
                total_correct: upd.correct ? existingFact.total_correct + 1 : existingFact.total_correct,
                total_attempts: existingFact.total_attempts + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('learner_id', childId)
              .eq('factor_a', factors.a)
              .eq('factor_b', factors.b)
          } else {
            await db.from('fact_mastery').insert({
              learner_id: childId,
              factor_a: factors.a,
              factor_b: factors.b,
              correct_streak: upd.correct ? 1 : 0,
              total_correct: upd.correct ? 1 : 0,
              total_attempts: 1,
              updated_at: new Date().toISOString(),
            })
          }
        } catch {
          // fact_mastery table may not exist yet — skip gracefully
        }
      }
    }
  }

  return NextResponse.json({ success: true, mastery })
}
