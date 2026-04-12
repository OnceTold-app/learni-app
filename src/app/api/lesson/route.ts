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
  // Parent-set focus areas
  focusAreas?: string[]
  // Mastery data
  weakTopics?: string[]
  reviewTopics?: string[]
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
      focusAreas = [],
      weakTopics = [],
      reviewTopics = [],
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
      const trimmedAnswer = answer.toLowerCase().trim()
      const trimmedCorrect = currentCorrectAnswer?.toLowerCase().trim() || ''
      const isCorrect = trimmedAnswer === trimmedCorrect

      // Detect if the child is asking for help instead of answering
      const helpPhrases = ['help', 'hint', 'i dont know', "i don't know", 'idk', 'stuck', 'confused', 'what', 'how', 'why', 'explain', 'huh', '?', 'please help']
      const isAskingForHelp = helpPhrases.some(p => trimmedAnswer.includes(p)) || trimmedAnswer === '?'

      if (isAskingForHelp) {
        messages.push({
          role: 'user',
          content: `${childName} is asking for help with "${currentQuestion}". They said: "${answer}". Be warm and encouraging. Give them a helpful hint WITHOUT giving the answer directly. Guide them toward the answer step by step. Remember: you're their supportive tutor, not a quiz master.`,
        })
      } else {
        messages.push({
          role: 'user',
          content: isCorrect
            ? `${childName} answered "${answer}" to "${currentQuestion}" — CORRECT! ${
                phase === 'warmup' || phase === 'closing'
                  ? `Streak: ${sessionStats.streakCount + 1}. Celebrate briefly ("Nice one!", "You got it!") then give the next question. Don't repeat the same question back-to-back, but it's fine to revisit questions later in the session.`
                  : `Stars: +4. Celebrate! Then give the next problem. Don't repeat the same question back-to-back.${sessionStats.streakCount >= 3 ? ' The child is doing well — INCREASE the difficulty slightly. Challenge them!' : ''}${sessionStats.correctCount > 0 && sessionStats.totalQuestions > 3 && (sessionStats.correctCount / sessionStats.totalQuestions) < 0.4 ? ' The child is struggling — DECREASE difficulty. Give easier problems to rebuild confidence.' : ''}`
              }`
            : `${childName} answered "${answer}" to "${currentQuestion}" — INCORRECT. The correct answer was "${currentCorrectAnswer}". ${
                phase === 'warmup' || phase === 'closing'
                  ? `Be kind: "Not quite! The answer was ${currentCorrectAnswer}." Then give a different question (not the same one straight away).`
                  : `Use the misconception engine: be warm and encouraging, identify what they likely confused, explain from a different angle, then give a simpler version. Don't give the exact same question straight away. NEVER make them feel bad.`
              }`,
        })
      }
    } else if (messages.length === 0) {
      // First question of this phase
      messages.push({
        role: 'user',
        content: phase === 'warmup'
          ? `Start the warm-up rapid fire. This tests PREVIOUS lessons — NOT today's topic. Drill a WIDE VARIETY: times tables (different numbers each time), number bonds, addition, subtraction, basic facts ${childName} should already know for Year ${yearLevel}. Don't repeat the same question back-to-back. Mix up the numbers and operations. It's fine to revisit a question later in the session. Personal best is ${sessionStats.personalBest} correct in a row. Say something encouraging like "Hey ${childName} — let's warm up that amazing brain! Ready?" then give the first question.`
          : phase === 'closing'
            ? `Start the closing rapid fire. This tests ONLY what ${childName} just learned TODAY in the ${subject} lesson. Only ask questions from today's lesson content — make sure it's locked in. Say "Last round — let's see if today's lesson stuck. No thinking, just knowing. Go." then give the first question.`
            : phase === 'financial'
              ? `Now teach a financial literacy concept connected to today's ${subject} lesson. ${childName} earned ${sessionStats.starsEarned} stars so far. TEACH the concept first with real examples using their star earnings, THEN ask questions. Use the teach → practice cycle.`
              : `Start the main lesson on ${subject} for Year ${yearLevel}.${focusAreas.length > 0 ? ` PRIORITY FOCUS AREAS set by parent: ${focusAreas.join(', ')}. Build the lesson around these topics.` : ''}${weakTopics.length > 0 ? ` WEAK AREAS from previous sessions: ${weakTopics.join(', ')}. Spend extra time on these — the child needs more practice here.` : ''}${reviewTopics.length > 0 ? ` DUE FOR REVIEW (haven't practiced recently): ${reviewTopics.join(', ')}. Work these in.` : ''} TEACH first — explain the concept clearly with a real-world example before asking any questions. The first 2-3 exchanges should be pure teaching with no questions. Say something like "Today we're going to learn about..."`,
      })
    }

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

    // Parse JSON response — handle multiple JSON objects from Claude
    try {
      // Try parsing the whole thing first
      const parsed = JSON.parse(text)
      return NextResponse.json({ phase, ...parsed })
    } catch {
      // Find the first complete JSON object
      let depth = 0
      let start = -1
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
          if (depth === 0) start = i
          depth++
        } else if (text[i] === '}') {
          depth--
          if (depth === 0 && start >= 0) {
            try {
              const parsed = JSON.parse(text.slice(start, i + 1))
              // If this is a teaching response with no question, check if there's a second JSON with the question
              if (!parsed.question && parsed.earniSays) {
                // Look for the next JSON object
                const remaining = text.slice(i + 1)
                let d2 = 0, s2 = -1
                for (let j = 0; j < remaining.length; j++) {
                  if (remaining[j] === '{') { if (d2 === 0) s2 = j; d2++ }
                  else if (remaining[j] === '}') {
                    d2--
                    if (d2 === 0 && s2 >= 0) {
                      try {
                        const second = JSON.parse(remaining.slice(s2, j + 1))
                        // Merge: use first earniSays, second's question/answer/visual
                        return NextResponse.json({ phase, ...parsed, ...second, earniSays: parsed.earniSays + (second.earniSays ? ' ' + second.earniSays : '') })
                      } catch { /* use first only */ }
                      break
                    }
                  }
                }
              }
              return NextResponse.json({ phase, ...parsed })
            } catch { /* keep looking */ }
            start = -1
          }
        }
      }
      // Last resort — strip JSON artifacts from text and return as earniSays
      const cleaned = text.replace(/[{}"\[\]]/g, '').replace(/earniSays:|question:|answer:|options:|visual:|inputType:|stars:|phase:/g, '').trim()
      return NextResponse.json({ phase, earniSays: cleaned || 'Let me think about that...' })
    }
  } catch (error) {
    console.error('Lesson API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong with the lesson' },
      { status: 500 }
    )
  }
}
