import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { CLAUDE_MODEL } from '@/lib/claude'
import { tutorPrompt, rapidFirePrompt, financialPrompt } from '@/lib/earni-prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Session phases
type Phase = 'warmup' | 'lesson' | 'financial' | 'closing' | 'reward'

interface LessonRequest {
  childName: string
  yearLevel: number
  subject: string
  phase: Phase
  // Question bank: topic key + learner for spaced repetition
  topicId?: string
  learnerId?: string
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
  // Child profile
  childProfile?: {
    interests?: string[]
    personality?: string
    challenges?: string
    parentGoals?: string
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
      topicId,
      learnerId,
      drillTopics = [],
      history = [],
      answer,
      currentQuestion,
      currentCorrectAnswer,
      sessionStats = { correctCount: 0, totalQuestions: 0, streakCount: 0, personalBest: 0, starsEarned: 0 },
      focusAreas = [],
      weakTopics = [],
      reviewTopics = [],
      childProfile = {},
    } = body

    // ─── Question Bank Helpers ────────────────────────────────────────────────
    const supabase = getSupabase()

    // Extract questions already asked this session from conversation history
    const sessionAskedQuestions = new Set<string>()
    for (const msg of history) {
      if (msg.role === 'assistant') {
        try {
          const parsed = JSON.parse(msg.content)
          if (parsed.question) sessionAskedQuestions.add(parsed.question.toLowerCase().trim())
        } catch { /* not JSON, skip */ }
      }
    }
    // Also add currentQuestion if present
    if (currentQuestion) sessionAskedQuestions.add(currentQuestion.toLowerCase().trim())

    async function fetchBankQuestion(tid: string, year: number): Promise<Record<string, unknown> | null> {
      try {
        const baseQuery = supabase
          .from('question_bank')
          .select('*')
          .eq('topic_id', tid)
          .eq('year_level', year)

        // Build combined exclusion list: 7-day history + current session
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        let dbSeenIds: string[] = []
        if (learnerId) {
          const { data: dbHistory } = await supabase
            .from('learner_question_history')
            .select('question_id')
            .eq('learner_id', learnerId)
            .gte('seen_at', sevenDaysAgo)
          dbSeenIds = dbHistory?.map((h: { question_id: string }) => h.question_id) || []
        }

        // Get a pool of candidates, filter out session-asked questions client-side
        let candidates: Record<string, unknown>[] = []
        if (dbSeenIds.length > 0) {
          const { data: unseen } = await baseQuery
            .not('id', 'in', `(${dbSeenIds.join(',')})`)
            .limit(40)
          candidates = unseen || []
        }
        // Fallback: use all questions if unseen pool is empty
        if (candidates.length === 0) {
          const { data: all } = await baseQuery.limit(40)
          candidates = all || []
        }

        // Filter out questions asked this session
        const fresh = candidates.filter((q: Record<string, unknown>) => {
          const qText = ((q.question as string) || '').toLowerCase().trim()
          return !sessionAskedQuestions.has(qText)
        })

        const pool = fresh.length > 0 ? fresh : candidates // fallback to any if all seen
        if (pool.length === 0) return null

        const q = pool[Math.floor(Math.random() * pool.length)]

        // Record in history
        if (learnerId) {
          void (async () => { try { await supabase.from('learner_question_history').insert({ learner_id: learnerId, question_id: q.id, seen_at: new Date().toISOString(), was_correct: null, attempts: 1 }) } catch { /* ignore */ } })()
        }
        return q
      } catch { return null }
    }

    async function fetchConceptBank(tid: string, year: number): Promise<Record<string, unknown> | null> {
      try {
        const { data: exact } = await supabase
          .from('concept_bank').select('*')
          .eq('topic_id', tid).eq('year_level', year).limit(1).single()
        if (exact) return exact
        const { data: nearby } = await supabase
          .from('concept_bank').select('*').eq('topic_id', tid)
          .order('year_level', { ascending: true }).limit(10)
        if (nearby && nearby.length > 0) {
          return nearby.reduce((p: { year_level: number }, c: { year_level: number }) =>
            Math.abs(c.year_level - year) < Math.abs(p.year_level - year) ? c : p
          )
        }
        return null
      } catch { return null }
    }

    // Celebration lines for correct answers (avoid Claude call)
    const celebrations = [
      `Nailed it! ⭐`, `Yes! That's exactly right! 🎉`, `Boom! ${childName} knows their stuff! 🔥`,
      `Ka pai! (That's Māori for 'well done') ✨`, `Correct! You're on a roll! 💪`,
      `That's it! Nice work! ⚡`, `Yes! Keep that momentum going! 🌟`, `Spot on! Legend! 🏆`,
    ]
    function randomCelebration() { return celebrations[Math.floor(Math.random() * celebrations.length)] }

    // Build child context string
    const profileContext = [
      childProfile?.interests?.length ? `Interests: ${childProfile.interests.join(', ')}. Use these in examples!` : '',
      childProfile?.personality ? `Personality: ${childProfile.personality}. Adapt your pace and style.` : '',
      childProfile?.challenges ? `Learning note: ${childProfile.challenges}. Be extra patient and use more visuals.` : '',
      childProfile?.parentGoals ? `Parent's goal: ${childProfile.parentGoals}` : '',
    ].filter(Boolean).join(' ')

    // Build the system prompt based on phase
    let systemPrompt: string
    switch (phase) {
      case 'warmup':
        systemPrompt = rapidFirePrompt(childName, yearLevel, drillTopics.length > 0 ? drillTopics : ['times tables', 'number bonds'])
        break
      case 'lesson':
        systemPrompt = tutorPrompt(childName, yearLevel, subject, drillTopics[0] || '') + (profileContext ? `\n\n## CHILD PROFILE\n${profileContext}` : '')
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

      // Reinforce subject on EVERY message so Claude never drifts
      const subjectNote = `[SUBJECT: ${subject}. Stay on this subject for the ENTIRE session. Never switch to maths or anything else unless the subject IS maths.]`

      if (isAskingForHelp) {
        messages.push({
          role: 'user',
          content: `${childName} needs help with "${currentQuestion}". They said: "${answer}". Give a warm hint for ${subject} WITHOUT the answer. Guide them step by step. ${subjectNote}`,
        })
      } else {
        messages.push({
          role: 'user',
          content: isCorrect
            ? `${childName} answered "${answer}" to "${currentQuestion}" — CORRECT! ${
                phase === 'warmup' || phase === 'closing'
                  ? `Celebrate then give the next ${subject} question.`
                  : `Celebrate! Then give the next ${subject} problem. Increase difficulty if streak >= 3. ${sessionStats.streakCount >= 3 ? 'INCREASE difficulty.' : ''}${sessionStats.correctCount > 0 && sessionStats.totalQuestions > 3 && (sessionStats.correctCount / sessionStats.totalQuestions) < 0.4 ? ' DECREASE difficulty.' : ''}`
              } ${subjectNote}`
            : `${childName} answered "${answer}" to "${currentQuestion}" — INCORRECT. Correct: "${currentCorrectAnswer}". ${
                phase === 'warmup' || phase === 'closing'
                  ? `Kindly correct, then give a different ${subject} question.`
                  : `Use the misconception engine for ${subject}: re-explain differently, give a simpler ${subject} example. Never make them feel bad.`
              } ${subjectNote}`,
        })
      }
    } else if (messages.length === 0) {
      // First question of this phase
      messages.push({
        role: 'user',
        content: phase === 'warmup'
          ? (() => {
              const isMaths = !subject || subject === 'Maths' || subject.toLowerCase().includes('maths') || subject.toLowerCase().includes('math')
              const drillDesc = isMaths
                ? 'times tables, number bonds, addition, subtraction, basic maths facts'
                : `${subject} review questions — quick recall on what they already know`
              return `Start the warm-up rapid fire. Drill: ${drillDesc} for Year ${yearLevel}. Quick questions, one at a time, don't repeat back-to-back. Personal best: ${sessionStats.personalBest}. Say something like "Let's warm up your brain, ${childName}! Ready?" then give the first question.`
            })()
          : phase === 'closing'
            ? `Start the closing rapid fire. This tests ONLY what ${childName} just learned TODAY in the ${subject} lesson. Only ask questions from today's lesson content — make sure it's locked in. Say "Last round — let's see if today's lesson stuck. No thinking, just knowing. Go." then give the first question.`
            : phase === 'financial'
              ? `Now teach a financial literacy concept connected to today's ${subject} lesson. ${childName} earned ${sessionStats.starsEarned} stars so far. TEACH the concept first with real examples using their star earnings, THEN ask questions. Use the teach → practice cycle.`
              : `You are tutoring ${childName} (Year ${yearLevel}) in: ${subject}.
${focusAreas.length > 0 ? `Parent's priority topics: ${focusAreas.join(', ')}. ` : ''}${weakTopics.length > 0 ? `Needs extra help with: ${weakTopics.join(', ')}. ` : ''}

START BY TEACHING. Do NOT ask a question yet.
Your first message should:
1. Welcome them warmly and tell them what you're going to learn today
2. Explain the concept clearly with a real-world analogy or story
3. Show an example (use the visual field for maths)
4. End with a check-in: ask if it makes sense before moving to practice

Example opening: "Hey ${childName}! Today we're going to learn about [topic]. Here's what's cool about it..."

Remember: you're a tutor, not a quiz machine. Teach first. Questions come AFTER understanding.`,
      })
    }

    // ─── Question Bank Interception — serve from bank when possible ─────────
    // Compute answer evaluation flags early so we can use them for bank routing
    const trimmedAnswer = answer?.toLowerCase().trim() || ''
    const trimmedCorrect = currentCorrectAnswer?.toLowerCase().trim() || ''
    const isCorrect = answer && currentQuestion ? trimmedAnswer === trimmedCorrect : false
    const helpPhrases = ['help', 'hint', 'i dont know', "i don't know", 'idk', 'stuck', 'confused', 'explain', 'please help']
    const isAskingForHelp = answer ? (helpPhrases.some(p => trimmedAnswer.includes(p)) || trimmedAnswer === '?') : false
    const isFirstMessage = history.length === 0 && !answer

    if (topicId) {
      // LESSON: first message → serve concept bank teaching content
      if (phase === 'lesson' && isFirstMessage) {
        const concept = await fetchConceptBank(topicId, yearLevel)
        if (concept) {
          const q = await fetchBankQuestion(topicId, yearLevel)
          const teachText = `Hey ${childName}! Today we're learning about **${concept.concept_name}**. 📚\n\n${concept.explanation_1}\n\n💡 *${concept.analogy}*\n\nDoes that make sense? Once you're ready, let's try a question!`
          if (q) {
            return NextResponse.json({
              phase, source: 'bank',
              earniSays: teachText,
              question: null, answer: null, visual: concept.visual_suggestion || null,
              conceptData: concept,
            })
          }
          return NextResponse.json({ phase, source: 'bank', earniSays: teachText, question: null, visual: concept.visual_suggestion || null })
        }
        // Concept bank empty → fall through to Claude
      }

      // WARMUP/CLOSING/LESSON: correct answer → celebrate + next bank question
      if (isCorrect && !isAskingForHelp) {
        const q = await fetchBankQuestion(topicId, yearLevel)
        if (q) {
          const celebration = randomCelebration()
          return NextResponse.json({
            phase, source: 'bank',
            earniSays: `${celebration} Next one:`,
            question: q.question, answer: q.answer,
            options: q.options || [], visual: q.visual || null,
            inputType: q.input_type || 'text',
            hint: q.hint_1 || null,
            hint2: q.hint_2 || null,
            hint3: q.hint_3 || null,
            questionId: q.id,
          })
        }
        // Bank empty → fall through to Claude
      }

      // WARMUP/CLOSING: first question → serve from bank with greeting
      if (isFirstMessage && (phase === 'warmup' || phase === 'closing')) {
        const q = await fetchBankQuestion(topicId, yearLevel)
        if (q) {
          const greeting = phase === 'warmup'
            ? `Let's warm up your brain, ${childName}! Ready? 🔥 Personal best: ${sessionStats.personalBest} — let's beat it!`
            : `Last round — let's see if today's lesson stuck. No thinking, just knowing. Go! ⚡`
          return NextResponse.json({
            phase, source: 'bank',
            earniSays: `${greeting}\n\n`,
            question: q.question, answer: q.answer,
            options: q.options || [], visual: q.visual || null,
            inputType: q.input_type || 'text',
            hint: q.hint_1 || null,
            hint2: q.hint_2 || null,
            hint3: q.hint_3 || null,
            questionId: q.id,
          })
        }
        // Bank empty → fall through to Claude
      }
    }
    // ─── End Question Bank Interception ──────────────────────────────────────

    // Use Haiku for rapid fire + financial (cheaper + faster), Sonnet only for main lesson + homework
    const model = (phase === 'warmup' || phase === 'closing' || phase === 'financial') ? 'claude-haiku-4-5-20251001' : CLAUDE_MODEL

    const response = await client.messages.create({
      model,
      max_tokens: phase === 'warmup' || phase === 'closing' ? 300 : 500,
      // Enable prompt caching — system prompt is identical every call
      // Cached reads cost 90% less than uncached
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }] as Parameters<typeof client.messages.create>[0]['system'],
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
