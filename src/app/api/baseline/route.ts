import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASELINE_PROMPT = `You are Earni, running a baseline assessment for a child to find their exact level.

## HOW THIS WORKS
You ask 3-4 questions per level, starting from the very basics. Each level gets harder.
When the child gets 2+ wrong at a level, STOP and mark that as their ceiling.
Be warm and encouraging — this is NOT a test. It's "let's see what you already know!"

## LEVELS (NZ Curriculum aligned)
1. Counting & number recognition (Year 1)
2. Addition & subtraction to 20 (Year 1-2)
3. Times tables 2, 5, 10 (Year 2-3)
4. Addition & subtraction to 100 (Year 3)
5. All times tables to 12 (Year 4)
6. Fractions basics - halves, quarters (Year 3-4)
7. Division (Year 4-5)
8. Decimals & percentages (Year 5-6)
9. Fractions operations (Year 6-7)
10. Algebra basics (Year 7-8)
11. Geometry & measurement (Year 7-8)
12. Advanced algebra (Year 9-10)
13. Statistics & probability (Year 9-10)

## RESPONSE FORMAT
Return EXACTLY ONE JSON object:

When asking a maths question — ALWAYS use type-in (empty options array):
{
  "earniSays": "Encouraging intro (keep it light!)",
  "question": "What is 3 + 4?",
  "answer": "7",
  "options": [],
  "inputType": "text",
  "inputType": "text",
  "level": 2,
  "levelName": "Addition to 20",
  "questionNumber": 1,
  "totalAtLevel": 3,
  "visual": null
}

When assessment is complete:
{
  "earniSays": "Great job! I now know exactly where to start with you.",
  "complete": true,
  "results": {
    "solidAt": 4,
    "solidName": "Times tables to 12",
    "ceilingAt": 6,
    "ceilingName": "Fractions basics",
    "startTeachingAt": 5,
    "startTeachingName": "All times tables",
    "strengths": ["Addition", "Subtraction", "Basic times tables"],
    "gaps": ["Fractions", "Division"]
  }
}

## RULES
- Start at level 1 regardless of year level — everyone starts from the bottom
- Move up when they get 3/3 or 3/4 correct at a level
- Stop when they get 2+ wrong at a level
- Be WARM. "Let's see what you already know!" not "You're being tested."
- Questions should be quick — no word problems, just clean maths
- ALWAYS use type-in for maths ("options": [], "inputType": "text"). NEVER use multiple choice for the baseline.
- The child must TYPE their answer, not pick from options. This gives a true picture of what they know.
- Include visuals where helpful (dots, fractions, number lines)
- Keep earniSays to 1-2 sentences max during the assessment
- If they're flying through, say things like "Too easy for you!" "Let's try something harder!"
- If they struggle, say "No worries! That tells me where we should start. Super helpful!"
`

export async function POST(req: NextRequest) {
  try {
    const { childName, yearLevel, history = [], answer, currentQuestion, currentAnswer, currentLevel } = await req.json()

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [...history]

    if (answer && currentQuestion) {
      const isCorrect = answer.toLowerCase().trim() === currentAnswer?.toLowerCase().trim()
      messages.push({
        role: 'user',
        content: isCorrect
          ? `${childName} answered "${answer}" to "${currentQuestion}" at level ${currentLevel} — CORRECT. Continue the assessment.`
          : `${childName} answered "${answer}" to "${currentQuestion}" at level ${currentLevel} — INCORRECT. The correct answer was "${currentAnswer}". Track this and decide whether to continue at this level or stop.`
      })
    } else if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: `Start the baseline assessment for ${childName} (Year ${yearLevel}). Begin at level 1 with the easiest questions. Be warm and make it feel fun, not like a test. Say something like "Hey ${childName}! Before we start learning together, let's play a quick game to see what you already know. Ready? Here's an easy one to start!"`
      })
    }

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 600,
      system: BASELINE_PROMPT,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed)
    } catch {
      let depth = 0, start = -1
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') { if (depth === 0) start = i; depth++ }
        else if (text[i] === '}') {
          depth--
          if (depth === 0 && start >= 0) {
            try { return NextResponse.json(JSON.parse(text.slice(start, i + 1))) } catch { /* keep looking */ }
            start = -1
          }
        }
      }
      return NextResponse.json({ earniSays: text.replace(/[{}"\[\]]/g, '').trim() || "Let me try that again..." })
    }
  } catch (error) {
    console.error('Baseline error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
