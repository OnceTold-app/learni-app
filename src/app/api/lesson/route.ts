import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { CLAUDE_MODEL } from '@/lib/claude'
import { tutorPrompt, rapidFirePrompt, financialPrompt } from '@/lib/earni-prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Request Schema ───────────────────────────────────────────────────────────
const LessonRequestSchema = z.object({
  childName: z.string().min(1),
  yearLevel: z.number().int().min(1).max(13),
  subject: z.string().min(1),
  phase: z.enum(['warmup', 'lesson', 'financial', 'closing', 'reward']),
  topicId: z.string().optional(),
  learnerId: z.string().optional(),
  drillTopics: z.array(z.string()).optional().default([]),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  answer: z.string().optional(),
  currentQuestion: z.string().optional(),
  currentCorrectAnswer: z.string().optional(),
  masteryContext: z.object({
    topicId: z.string().optional(),
    correctCount: z.number().optional(),
    isMastered: z.boolean().optional(),
    streakCurrent: z.number().optional(),
    relatedTopics: z.array(z.object({
      topicId: z.string(),
      correctCount: z.number(),
      isMastered: z.boolean(),
    })).optional(),
  }).optional(),
  sessionStats: z.object({
    correctCount: z.number(),
    totalQuestions: z.number(),
    streakCount: z.number(),
    personalBest: z.number(),
    starsEarned: z.number(),
  }).optional().default({ correctCount: 0, totalQuestions: 0, streakCount: 0, personalBest: 0, starsEarned: 0 }),
  focusAreas: z.array(z.string()).optional().default([]),
  weakTopics: z.array(z.string()).optional().default([]),
  reviewTopics: z.array(z.string()).optional().default([]),
  childProfile: z.object({
    interests: z.array(z.string()).optional(),
    personality: z.string().optional(),
    challenges: z.string().optional(),
    parentGoals: z.string().optional(),
  }).optional().default({}),
})

type Phase = 'warmup' | 'lesson' | 'financial' | 'closing' | 'reward'

interface LessonResponse {
  earniSays: string
  question?: string | null
  answer?: string | null
  options: string[]
  inputType: 'text' | 'choice' | 'none'
  visual?: Record<string, unknown> | null
  checkIn: string[]
  stars: number
  hint?: string | null
}

// ─── Topic Validation ─────────────────────────────────────────────────────────
function validateQuestionTopic(question: string, answer: string | null, topicId: string): boolean {
  const q = (question + ' ' + (answer || '')).toLowerCase()
  if (topicId.startsWith('counting-')) {
    const n = topicId.replace('counting-', '')
    return q.includes('count') || q.includes(`in ${n}`) || q.includes(`by ${n}`) || q.includes('___') || q.includes('next')
  }
  if (topicId.startsWith('times-')) {
    const n = topicId.replace('times-', '')
    return q.includes('×') || q.includes('times') || q.includes(`× ${n}`) || q.includes(`${n} ×`)
  }
  if (topicId.startsWith('division-')) {
    return q.includes('÷') || q.includes('divide') || q.includes('division')
  }
  if (topicId.startsWith('addition-')) {
    return q.includes('+') || q.includes('add') || q.includes('sum') || q.includes('total') || q.includes('more')
  }
  if (topicId.startsWith('subtraction-')) {
    return q.includes('-') || q.includes('minus') || q.includes('subtract') || q.includes('less') || q.includes('take away')
  }
  return true
}

export async function POST(req: NextRequest) {
  try {
    // ─── Validate Request ─────────────────────────────────────────────────────
    const parseResult = LessonRequestSchema.safeParse(await req.json())
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }
    const body = parseResult.data

    const {
      childName,
      yearLevel,
      subject,
      phase,
      topicId,
      learnerId,
      drillTopics,
      history,
      answer,
      currentQuestion,
      currentCorrectAnswer,
      sessionStats,
      focusAreas,
      weakTopics,
      childProfile,
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
    if (currentQuestion) sessionAskedQuestions.add(currentQuestion.toLowerCase().trim())

    async function fetchBankQuestion(tid: string, year: number): Promise<Record<string, unknown> | null> {
      try {
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

        const yearCandidates = [year, year - 1, year + 1, year - 2, year + 2].filter(y => y >= 1 && y <= 13)
        let candidates: Record<string, unknown>[] = []

        for (const tryYear of yearCandidates) {
          const baseQuery = supabase
            .from('question_bank')
            .select('*')
            .eq('topic_id', tid)
            .eq('year_level', tryYear)

          if (dbSeenIds.length > 0) {
            const { data: unseen } = await baseQuery
              .not('id', 'in', `(${dbSeenIds.join(',')})`)
              .limit(40)
            candidates = unseen || []
          }
          if (candidates.length === 0) {
            const { data: all } = await baseQuery.limit(40)
            candidates = all || []
          }
          if (candidates.length > 0) break
        }

        const fresh = candidates.filter((q: Record<string, unknown>) => {
          const qText = ((q.question as string) || '').toLowerCase().trim()
          return !sessionAskedQuestions.has(qText)
        })

        const pool = fresh.length > 0 ? fresh : candidates
        if (pool.length === 0) return null

        const q = pool[Math.floor(Math.random() * pool.length)]
        if (learnerId) {
          void (async () => {
            try {
              await supabase.from('learner_question_history').insert({
                learner_id: learnerId,
                question_id: q.id,
                seen_at: new Date().toISOString(),
                was_correct: null,
                attempts: 1,
              })
            } catch { /* ignore */ }
          })()
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

    // ── Per-challenge specific instructions ──────────────────────────────────
    const challengeInstructions: Record<string, string> = {
      dyslexia: 'DYSLEXIA: Use short sentences. Avoid dense text. Never ask to spell under pressure. Break reading into small chunks. Praise effort loudly.',
      dyscalculia: 'DYSCALCULIA: Extra visual aids always. Break numbers into tiny steps. Use real-world anchors (money, objects). Celebrate process not just correct answers. Never rush.',
      adhd: 'ADHD: Short bursts only. High energy pacing. Celebrate every single answer. Never dwell on wrong answers — move fast. Keep momentum.',
      asd: 'ASD: Be literal and precise. No idioms, no sarcasm. Predictable structure — tell them what comes next. Explicit transitions. Avoid open-ended questions.',
      anxiety: 'MATHS ANXIETY: Heavy encouragement. Normalise mistakes out loud (\'everyone finds this tricky!\'). No time pressure language. Celebrate the attempt not just the answer.',
      esl: "ESL: Simple vocabulary. No idioms. Check comprehension before moving on. Use their language for celebration words — e.g. 'Très bien!' for French, 'Shabash!' for Hindi/Urdu.",
    }

    function getChallengeInstruction(challenges?: string): string {
      if (!challenges) return ''
      const key = challenges.toLowerCase().trim()
      if (challengeInstructions[key]) return challengeInstructions[key]
      for (const [k, v] of Object.entries(challengeInstructions)) {
        if (key.includes(k)) return v
      }
      return `LEARNING NOTE (${challenges}): Be extra patient and use more visuals. Adapt pace to this child's needs.`
    }

    const profileContext = [
      childProfile?.interests?.length ? `Interests: ${childProfile.interests.join(', ')}. Use these in examples!` : '',
      childProfile?.personality ? `Personality: ${childProfile.personality}. Adapt your pace and style.` : '',
      childProfile?.challenges ? getChallengeInstruction(childProfile.challenges) : '',
      childProfile?.parentGoals ? `Parent's goal: ${childProfile.parentGoals}` : '',
    ].filter(Boolean).join(' ')

    // ── Mastery context string ──────────────────────────────────────────────
    const masteryContextLines: string[] = []
    if (body.masteryContext) {
      const mc = body.masteryContext
      if (mc.topicId) {
        if (mc.isMastered) {
          masteryContextLines.push(`${mc.topicId} is MASTERED — challenge with harder variants or move to next tier.`)
        } else if (typeof mc.correctCount === 'number') {
          masteryContextLines.push(`${mc.topicId} is at ${mc.correctCount}/30 correct — focus here, building towards mastery.`)
        }
      }
      if (mc.relatedTopics && mc.relatedTopics.length > 0) {
        for (const rt of mc.relatedTopics) {
          if (rt.isMastered) {
            masteryContextLines.push(`${rt.topicId} is mastered — use as review/warmup only.`)
          } else if (rt.correctCount < 5) {
            masteryContextLines.push(`${rt.topicId} is weak (${rt.correctCount}/30) — reinforce with basics.`)
          }
        }
      }
    }
    const masteryContextStr = masteryContextLines.length > 0
      ? `\n\n## MASTERY PROGRESS\n${masteryContextLines.join('\n')}\nUse this to guide question difficulty and topic focus.`
      : ''

    // ─── Topic lock instruction for system prompt ─────────────────────────────
    function topicLockInstruction(tid: string): string {
      const relatedTopicHint = tid.startsWith('times-') ? 'division' :
        tid.startsWith('division-') ? 'multiplication' :
        tid.startsWith('addition-') ? 'subtraction' :
        tid.startsWith('subtraction-') ? 'addition' : ''
      return `\nCRITICAL TOPIC LOCK: You are teaching "${tid}" ONLY.
Every question you generate MUST be about ${tid}.
It is IMPOSSIBLE for you to teach any other topic.${relatedTopicHint ? `\nIf you find yourself thinking about ${relatedTopicHint}, STOP and return to ${tid}.` : ''}`
    }

    // Build the system prompt based on phase
    let systemPrompt: string
    switch (phase) {
      case 'warmup':
        systemPrompt = rapidFirePrompt(childName, yearLevel, drillTopics.length > 0 ? drillTopics : ['times tables', 'number bonds'])
        break
      case 'lesson': {
        const isMoneySubject = subject.toLowerCase().includes('money') || subject.toLowerCase().includes('financial') || subject.toLowerCase().includes('wealth') || subject.toLowerCase().includes('wise')
        if (isMoneySubject) {
          systemPrompt = financialPrompt(childName, yearLevel, false)
        } else {
          systemPrompt = tutorPrompt(childName, yearLevel, subject, topicId || drillTopics[0] || '')
            + (profileContext ? `\n\n## CHILD PROFILE\n${profileContext}` : '')
            + `\n\n## YEAR LEVEL CEILING\nCRITICAL: Never escalate difficulty more than 1 year above the child's registered year level (Year ${yearLevel}).\n- Max difficulty: Year ${yearLevel + 1} content\n- If child is consistently correct, stay at ceiling \u2014 do NOT keep escalating\n- If child is performing above ceiling for 3+ questions in a row, include a note in earniSays: "You're flying through this! I'll let your parent know you might be ready for harder work."\n- Never teach concepts from 2+ years above their level`
            + `\n\n## CONTENT CALIBRATION \u2014 CRITICAL\nThis child is in Year ${yearLevel}. \n- MINIMUM difficulty: Year ${Math.max(1, yearLevel - 1)} content\n- MAXIMUM difficulty: Year ${yearLevel + 1} content\n- START at exactly Year ${yearLevel} difficulty\n- Do NOT give Year 1 questions to a Year 4 child. Do NOT give Year 9 questions to a Year 4 child.\n- If the topic requested is simpler than Year ${yearLevel}, teach it at Year ${yearLevel} depth and complexity\n- Year ${yearLevel} examples: ${yearLevel <= 3 ? 'counting objects, number bonds, simple addition to 20' : yearLevel <= 6 ? 'times tables, fractions, place value to 1000' : yearLevel <= 9 ? 'algebra basics, decimals, percentages, ratios' : 'quadratics, statistics, trigonometry basics'}`
            + masteryContextStr
            + (topicId ? topicLockInstruction(topicId) : '')
        }
        break
      }
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

    const trimmedAnswer = answer?.toLowerCase().trim() || ''
    const trimmedCorrect = currentCorrectAnswer?.toLowerCase().trim() || ''
    const isCorrect = answer && currentQuestion ? trimmedAnswer === trimmedCorrect : false
    const helpPhrases = ['help', 'hint', 'i dont know', "i don't know", 'idk', 'stuck', 'confused', 'what', 'how', 'why', 'explain', 'huh', '?', 'please help']
    const isAskingForHelp = answer ? (helpPhrases.some(p => trimmedAnswer.includes(p)) || trimmedAnswer === '?') : false
    const isFirstMessage = history.length === 0 && !answer

    if (answer && currentQuestion) {
      const subjectNote = `[SUBJECT: ${subject}. Stay on this subject for the ENTIRE session.]`

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
            : `${childName} answered "${answer}" to "${currentQuestion}" — INCORRECT (correct answer: "${currentCorrectAnswer}").

${
  phase === 'warmup' || phase === 'closing'
    ? `Kindly correct them and give a different ${subject} question.`
    : `WRONG ANSWER PROTOCOL — follow exactly:
1. FIRST, immediately acknowledge the wrong answer warmly but clearly:
   - Year 1-3: Say "Ooh, not quite! Let's figure it out together."
   - Year 4-7: Say "Not quite — let's look at why."
   - Year 8-13: Say "That's not correct — let's work through it."
2. THEN give a hint or re-explanation
3. Do NOT skip straight to re-explanation — the child must know they got it wrong first
4. Keep it warm and brief — never make them feel bad`
} ${subjectNote}`,
        })
      }
    } else if (messages.length === 0) {
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

    // ─── Question Bank Interception — serve from bank for practice topics ────
    if (topicId) {
      // LESSON: first message → serve concept bank teaching content
      if (phase === 'lesson' && isFirstMessage) {
        const concept = await fetchConceptBank(topicId, yearLevel)
        if (concept) {
          const q = await fetchBankQuestion(topicId, yearLevel)
          const teachText = `Hey ${childName}! Today we're learning about **${concept.concept_name}**. 📚\n\n${concept.explanation_1}\n\n💡 *${concept.analogy}*\n\nDoes that make sense? Once you're ready, let's try a question!`
          return NextResponse.json({
            phase, source: 'bank',
            earniSays: teachText,
            question: null, answer: null, visual: concept.visual_suggestion || null,
            conceptData: concept,
            ...(q ? {} : {}),
          })
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
            ? `Hey ${childName}! Let's go — first question:`
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

    // ─── Claude via tool_use for guaranteed JSON structure ────────────────────
    const model = (phase === 'warmup' || phase === 'closing' || phase === 'financial') ? 'claude-haiku-4-5-20251001' : CLAUDE_MODEL

    const response = await client.messages.create({
      model,
      max_tokens: phase === 'warmup' || phase === 'closing' ? 300 : 600,
      // Prompt caching — system prompt cached after first call, 90% cheaper reads
      system: [{ type: 'text' as const, text: systemPrompt, cache_control: { type: 'ephemeral' as const } }],
      messages,
      tools: [{
        name: 'lesson_response',
        description: 'Structure the lesson response for the child',
        input_schema: {
          type: 'object' as const,
          properties: {
            earniSays: { type: 'string', description: 'What Earni says to the child — encouragement, teaching, or feedback' },
            question: { type: 'string', description: 'The question to ask (null if teaching/no question this turn)' },
            answer: { type: 'string', description: 'The correct answer (null if no question)' },
            options: { type: 'array', items: { type: 'string' }, description: 'Multiple choice options (empty array if not choice type)' },
            inputType: { type: 'string', enum: ['text', 'choice', 'none'], description: 'How the child should respond' },
            visual: { type: 'object', description: 'Optional visual aid (null if none)' },
            checkIn: { type: 'array', items: { type: 'string' }, description: 'Quick check-in prompts (empty array if none)' },
            stars: { type: 'number', description: 'Stars awarded this turn (0-3)' },
            hint: { type: 'string', description: 'A hint for this question (null if none)' },
          },
          required: ['earniSays', 'inputType', 'stars', 'options', 'checkIn'],
        },
      }],
      tool_choice: { type: 'any' as const },
    })

    const toolBlock = response.content.find(b => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      // Fallback: try to extract text if tool use failed unexpectedly
      const textBlock = response.content.find(b => b.type === 'text')
      const fallbackText = textBlock && textBlock.type === 'text' ? textBlock.text : 'Let me think about that...'
      return NextResponse.json({ phase, earniSays: fallbackText, inputType: 'text', stars: 0, options: [], checkIn: [] })
    }

    const parsed = toolBlock.input as LessonResponse

    // ─── Server-side topic validation ─────────────────────────────────────────
    if (topicId && parsed.question) {
      const isOnTopic = validateQuestionTopic(parsed.question, parsed.answer || null, topicId)
      if (!isOnTopic) {
        const bankQ = await fetchBankQuestion(topicId, yearLevel)
        if (bankQ) {
          parsed.question = bankQ.question as string
          parsed.answer = bankQ.answer as string
          parsed.options = (bankQ.options as string[]) || []
        }
      }
    }

    return NextResponse.json({ phase, ...parsed })

  } catch (error) {
    console.error('Lesson API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong with the lesson' },
      { status: 500 }
    )
  }
}
