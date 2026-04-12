import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'
import { tutorPrompt, rapidFirePrompt, financialPrompt } from '@/lib/earni-prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Session phases
type Phase = 'warmup' | 'lesson' | 'financial' | 'closing' | 'reward'

interface LessonRequest {
  childName: string
  yearLevel: number
  subject: string
  phase: Phase
  // For warmup/closing: previous topics to drill
  drillTopics?: string[]
  // For tracking conversation context
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  // Child's answer to evaluate
  answer?: string
  // Current question for answer evaluation
  currentQuestion?: string
  currentCorrectAnswer?: string
  // Session stats
  sessionStats?: {
    correctCount: number
    totalQuestions: number
    streakCount: number
    personalBest: number
    starsEarned: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: LessonRequest = await req.json()
    const {
      childName,
      yearLevel,
      subject,
      phase,
      drillTopics = [],
      history = [],
      answer,
      currentQuestion,
      currentCorrectAnswer,
      sessionStats = { correctCount: 0, totalQuestions: 0, streakCount: 0, personalBest: 0, starsEarned: 0 },
    } = body

    // Build the system prompt based on phase
    let systemPrompt: string
    switch (phase) {
      case 'warmup':
        systemPrompt = rapidFirePrompt(childName, yearLevel, drillTopics.length > 0 ? drillTopics : ['times tables', 'number bonds'])
        break
      case 'lesson':
        systemPrompt = tutorPrompt(childName, yearLevel, subject)
        break
      case 'financial': {
        const today = new Date()
        const isFriday = today.getDay() === 5
        systemPrompt = financialPrompt(childName, yearLevel, isFriday)
        break
      }
      case 'closing':
        systemPrompt = rapidFirePrompt(childName, yearLevel, [subject])
        break
      case 'reward':
        // Reward phase doesn't need Claude — it's calculated
        return NextResponse.json({
          phase: 'reward',
          starsEarned: sessionStats.starsEarned,
          correctCount: sessionStats.correctCount,
          totalQuestions: sessionStats.totalQuestions,
          streakCount: sessionStats.streakCount,
          personalBest: sessionStats.personalBest,
          earniSays: sessionStats.correctCount > sessionStats.totalQuestions * 0.8
            ? `Incredible session, ${childName}! ${sessionStats.starsEarned} stars — you were on fire today.`
            : sessionStats.correctCount > sessionStats.totalQuestions * 0.5
              ? `Solid work, ${childName}. ${sessionStats.starsEarned} stars earned. Every session you're getting stronger.`
              : `${sessionStats.starsEarned} stars earned, ${childName}. The hard sessions are the ones where you grow the most. Proud of you for sticking with it.`,
        })
      default:
        return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }

    // Build messages — include answer evaluation if provided
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [...history]

    if (answer && currentQuestion) {
      const isCorrect = answer.toLowerCase().trim() === currentCorrectAnswer?.toLowerCase().trim()
      messages.push({
        role: 'user',
        content: isCorrect
          ? `${childName} answered "${answer}" to "${currentQuestion}" — CORRECT. ${
              phase === 'warmup' || phase === 'closing'
                ? `Streak: ${sessionStats.streakCount + 1}. Generate next rapid fire question immediately.`
                : `Stars: +4. Generate the next problem.`
            }`
          : `${childName} answered "${answer}" to "${currentQuestion}" — INCORRECT. The correct answer was "${currentCorrectAnswer}". ${
              phase === 'warmup' || phase === 'closing'
                ? `Streak broken. Just say "Again." and give the same question back.`
                : `Use the misconception engine: identify what they likely confused, explain from a different angle, then give a simpler version of the same concept.`
            }`,
      })
    } else if (messages.length === 0) {
      // First question of this phase
      messages.push({
        role: 'user',
        content: phase === 'warmup'
          ? `Start the warm-up rapid fire. This tests PREVIOUS lessons — NOT today's topic. Drill general knowledge: times tables, number bonds, basic facts ${childName} should already know for Year ${yearLevel}. Personal best is ${sessionStats.personalBest} correct in a row. Say something like "Right ${childName} — let's wake up that brain. Stuff you already know. Fast as you can. Go." then give the first question.`
          : phase === 'closing'
            ? `Start the closing rapid fire. This tests ONLY what ${childName} just learned TODAY in the ${subject} lesson. Only ask questions from today's lesson content — make sure it's locked in. Say "Last round — let's see if today's lesson stuck. No thinking, just knowing. Go." then give the first question.`
            : phase === 'financial'
              ? `Now teach a financial literacy concept connected to today's ${subject} lesson. ${childName} earned ${sessionStats.starsEarned} stars so far. TEACH the concept first with real examples using their star earnings, THEN ask questions. Use the teach → practice cycle.`
              : `Start the main lesson on ${subject} for Year ${yearLevel}. TEACH first — explain the concept clearly with a real-world example before asking any questions. The first 2-3 exchanges should be pure teaching with no questions. Say something like "Today we're going to learn about..."`,
      })
    }

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

    // Try to parse JSON response
    try {
      // Extract JSON from response (handle if Claude wraps it)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { earniSays: text }
      return NextResponse.json({ phase, ...parsed })
    } catch {
      // If JSON parsing fails, return raw text
      return NextResponse.json({ phase, earniSays: text })
    }
  } catch (error) {
    console.error('Lesson API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong with the lesson' },
      { status: 500 }
    )
  }
}
