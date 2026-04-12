import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// GET mastery data for a child — used by session to know what to drill
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { data } = await supabase()
    .from('learners')
    .select('topic_mastery')
    .eq('id', childId)
    .single()

  const mastery = data?.topic_mastery || {}

  // Find weak topics (mastery < 60%) and strong topics (mastery > 85%)
  const weakTopics: string[] = []
  const strongTopics: string[] = []
  const reviewTopics: string[] = [] // Haven't been seen in 3+ sessions

  for (const [topic, stats] of Object.entries(mastery)) {
    const s = stats as { correct: number; total: number; lastSeen: string }
    const pct = s.total > 0 ? (s.correct / s.total) * 100 : 0
    if (pct < 60 && s.total >= 2) weakTopics.push(topic)
    else if (pct > 85 && s.total >= 3) strongTopics.push(topic)

    // Check if needs review (last seen > 3 days ago)
    if (s.lastSeen) {
      const daysSince = (Date.now() - new Date(s.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince > 3 && pct < 90) reviewTopics.push(topic)
    }
  }

  return NextResponse.json({ mastery, weakTopics, strongTopics, reviewTopics })
}

// POST to update mastery after a session
export async function POST(req: NextRequest) {
  const { childId, results } = await req.json()
  if (!childId || !results) return NextResponse.json({ error: 'childId and results required' }, { status: 400 })

  // results = [{ topic: "times tables", correct: true/false }, ...]
  const db = supabase()

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

  return NextResponse.json({ success: true, mastery })
}
