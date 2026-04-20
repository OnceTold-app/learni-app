/**
 * explanation-bank.ts
 *
 * Manages Earni's teaching explanations.
 * First child to encounter a topic → Claude generates + stores.
 * All subsequent children → served from bank for free.
 * Feedback loop: "Makes sense!" / "I don't understand" improve quality over time.
 */

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface Explanation {
  id: string
  topic_id: string
  year_level: number
  subject: string
  concept: string
  body: string
  analogy?: string
  mental_test?: string
  visual?: Record<string, unknown>
  times_served: number
  times_understood: number
  times_not_understood: number
}

/**
 * Get the best explanation for a topic+year from the bank.
 * "Best" = highest understood rate (min 3 served), otherwise most recent.
 * Returns null if nothing in bank yet.
 */
export async function getBankedExplanation(
  topicId: string,
  yearLevel: number
): Promise<Explanation | null> {
  try {
    const supabase = getSupabase()

    // Query concept_bank — the unified explanation store
    const { data, error } = await supabase
      .from('concept_bank')
      .select('*')
      .eq('topic_id', topicId)
      .eq('year_level', yearLevel)
      .order('times_understood', { ascending: false })
      .limit(5)

    if (error || !data || data.length === 0) return null

    const wellServed = data.filter((e: Record<string, number>) => e.times_served >= 3)
    const best = wellServed.length > 0 ? wellServed[0] : data[0]

    // Increment times_served
    void supabase
      .from('concept_bank')
      .update({ times_served: (best.times_served || 0) + 1 })
      .eq('id', best.id)

    return {
      id: best.id,
      topic_id: best.topic_id,
      year_level: best.year_level,
      subject: best.subject || '',
      concept: best.concept_name || best.concept || '',
      body: best.explanation_1 || best.body || '',
      analogy: best.analogy,
      mental_test: best.mental_test,
      visual: best.visual_suggestion || best.visual,
      times_served: best.times_served || 0,
      times_understood: best.times_understood || 0,
      times_not_understood: best.times_not_understood || 0,
    }
  } catch {
    return null
  }
}

/**
 * Store a new explanation in the bank after Claude generates it.
 * Called after first API generation for a topic.
 */
export async function storeExplanation(params: {
  topicId: string
  yearLevel: number
  subject: string
  concept: string
  body: string
  analogy?: string
  mentalTest?: string
  visual?: Record<string, unknown>
  source?: string
}): Promise<void> {
  try {
    const supabase = getSupabase()
    // Store in concept_bank — the unified explanation store
    await supabase.from('concept_bank').insert({
      topic_id: params.topicId,
      year_level: params.yearLevel,
      subject: params.subject,
      concept_name: params.concept,
      explanation_1: params.body,
      analogy: params.analogy || null,
      mental_test: params.mentalTest || null,
      visual_suggestion: params.visual || null,
      source: params.source || 'generated',
      times_served: 1,
    })
  } catch (e) {
    console.error('[explanation-bank] store failed (non-blocking):', e)
  }
}

/**
 * Record feedback on an explanation.
 * Called when child taps "Makes sense!" or "I don't understand".
 */
export async function recordExplanationFeedback(
  explanationId: string,
  understood: boolean
): Promise<void> {
  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('concept_bank')
      .select('times_understood, times_not_understood')
      .eq('id', explanationId)
      .single()

    if (!data) return

    await supabase
      .from('concept_bank')
      .update({
        times_understood: understood ? (data.times_understood || 0) + 1 : (data.times_understood || 0),
        times_not_understood: understood ? (data.times_not_understood || 0) : (data.times_not_understood || 0) + 1,
      })
      .eq('id', explanationId)
  } catch (e) {
    console.error('[explanation-bank] feedback failed (non-blocking):', e)
  }
}

/**
 * Determine topic ID from subject + topic string.
 * Mirrors the slugify logic in homework route.
 */
export function topicToExplanationId(subject: string, topic: string): string {
  const subjectPrefix: Record<string, string> = {
    'maths': 'maths', 'math': 'maths', 'mathematics': 'maths',
    'reading & writing': 'reading', 'reading': 'reading', 'writing': 'reading', 'english': 'reading',
    'science': 'science', 'history': 'history', 'geography': 'geography',
    'social studies': 'social-studies',
  }
  const prefix = subjectPrefix[subject.toLowerCase()] ||
    subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(and|or|the|a|an|of|in|on|with|for)\b/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)

  return `${prefix}-${slug}`
}
