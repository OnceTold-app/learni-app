import { NextResponse } from 'next/server'
import { generateExplanation, generateGreeting, generateSessionSummary } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Verify auth on every API route
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json()
  const { action, childName, yearLevel, question, correctAnswer, topic, streakDays, correct, total, starsEarned } = body

  try {
    switch (action) {

      case 'explanation': {
        if (!question || !correctAnswer || !childName || !yearLevel) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        const text = await generateExplanation(question, correctAnswer, childName, yearLevel)
        return NextResponse.json({ text })
      }

      case 'greeting': {
        if (!childName || !topic) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        const text = await generateGreeting(childName, topic, streakDays ?? 0)
        return NextResponse.json({ text })
      }

      case 'summary': {
        if (!childName || !topic || correct == null || total == null || starsEarned == null) {
          return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }
        const text = await generateSessionSummary(childName, topic, correct, total, starsEarned)
        return NextResponse.json({ text })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Lesson API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
