import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASELINE_PROMPT = `You are Earni, running a baseline assessment for a child to find their exact level.

## HOW THIS WORKS
You ask 3 questions per level, starting from the very basics. Each level gets harder.
IMPORTANT: The system tracks wrong answers. When the system tells you to STOP, immediately return a complete=true result.
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
When asking a question:
{
  "earniSays": "Encouraging intro (1-2 sentences max)",
  "question": "What is 3 + 4?",
  "answer": "7",
  "options": [],
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
- Start at level 1 regardless of year level
- Move up when they get 3/3 correct at a level
- ALWAYS use type-in for maths ("options": [], "inputType": "text")
- Keep earniSays to 1-2 sentences max
- If they're flying through: "Too easy! Let's go harder!"
- If they struggle: "No worries! That tells me exactly where we start. So helpful!"
- Questions should be quick — no word problems, just clean maths
`

export async function POST(req: NextRequest) {
  try {
    const { childName, yearLevel, history = [], answer, currentQuestion, currentAnswer, currentLevel, wrongAtLevel = 0 } = await req.json()

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [...history]

    // Use wrongAtLevel from frontend (reliable, no history scanning needed)
    const isCurrentCorrect = answer && currentAnswer
      ? answer.toLowerCase().trim() === currentAnswer.toLowerCase().trim()
      : null

    const wrongAtCurrentLevel = wrongAtLevel || 0

    // Force stop if 2+ wrong at this level
    const forceStop = wrongAtCurrentLevel >= 2

    if (answer && currentQuestion) {
      if (forceStop) {
        messages.push({
          role: 'user',
          content: `${childName} has now got ${wrongAtCurrentLevel} wrong at level ${currentLevel}. STOP THE ASSESSMENT NOW. Return complete=true with results immediately. Their ceiling is level ${currentLevel}. Their solid level is ${(currentLevel || 1) - 1}. Start teaching at level ${currentLevel}. Be warm — say something like "Perfect, I know exactly where to start with you now!"`
        })
      } else {
        messages.push({
          role: 'user',
          content: isCurrentCorrect
            ? `${childName} answered "${answer}" to "${currentQuestion}" at level ${currentLevel} — CORRECT. Continue the assessment.`
            : `${childName} answered "${answer}" to "${currentQuestion}" at level ${currentLevel} — INCORRECT (correct: "${currentAnswer}"). That's ${wrongAtCurrentLevel} wrong at this level. ${wrongAtCurrentLevel >= 1 ? 'One more wrong and we stop this level.' : 'Continue.'}`
        })
      }
    } else if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: `Start the baseline assessment for ${childName} (Year ${yearLevel}). Begin at level 1. Say something like "Hey ${childName}! Let's play a quick game to see what you already know. Ready? Here's an easy one!"`
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
