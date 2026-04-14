import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/concept?topicId=times-all&yearLevel=5
 *
 * Returns the pre-written concept explanation for a topic+year combo.
 * If exact year not found, falls back to nearest year.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const topicId = searchParams.get('topicId')
    const yearLevel = parseInt(searchParams.get('yearLevel') || '0')

    if (!topicId || !yearLevel) {
      return NextResponse.json({ error: 'topicId and yearLevel are required' }, { status: 400 })
    }

    // Try exact year first
    const { data: exact } = await supabase
      .from('concept_bank')
      .select('*')
      .eq('topic_id', topicId)
      .eq('year_level', yearLevel)
      .limit(1)
      .single()

    if (exact) {
      return NextResponse.json({ source: 'bank', ...exact })
    }

    // Fall back to nearest year for this topic
    const { data: nearby } = await supabase
      .from('concept_bank')
      .select('*')
      .eq('topic_id', topicId)
      .order('year_level', { ascending: true })
      .limit(10)

    if (nearby && nearby.length > 0) {
      // Find closest year
      const closest = nearby.reduce((prev: { year_level: number }, curr: { year_level: number }) =>
        Math.abs(curr.year_level - yearLevel) < Math.abs(prev.year_level - yearLevel) ? curr : prev
      )
      return NextResponse.json({ source: 'bank', ...closest })
    }

    return NextResponse.json({ error: 'No concept found for this topic', topicId, yearLevel }, { status: 404 })
  } catch (error) {
    console.error('Concept bank API error:', error)
    return NextResponse.json({ error: 'Failed to fetch concept' }, { status: 500 })
  }
}
