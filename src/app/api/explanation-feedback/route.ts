import { NextRequest, NextResponse } from 'next/server'
import { recordExplanationFeedback } from '@/lib/explanation-bank'

/**
 * POST /api/explanation-feedback
 * Called when a child taps "Makes sense!" or "I don't understand" after a teaching phase.
 * Updates the concept_bank quality metrics so better explanations surface over time.
 */
export async function POST(req: NextRequest) {
  try {
    const { explanationId, understood } = await req.json()
    if (!explanationId || typeof understood !== 'boolean') {
      return NextResponse.json({ error: 'explanationId and understood required' }, { status: 400 })
    }
    await recordExplanationFeedback(explanationId, understood)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Never fail silently
  }
}
