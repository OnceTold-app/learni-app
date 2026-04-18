import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CHECKIN_PROMPT = `You are Earni, a warm AI tutor helping a child decide what to learn today.

Your job in this conversation:
1. Understand what the child wants to work on (or needs to work on)
2. Optionally offer a nudge toward a skill they're close to mastering
3. Decide what topic to teach and start the session

RESPONSE FORMAT — return JSON:
{
  "earniSays": "Your response to the child",
  "action": "continue" | "nudge" | "start_session",
  "topicId": "topic-id-if-starting" | null,
  "subject": "Maths" | "Reading & Writing" | "Money & Life" | null
}

action:
- "continue": keep the conversation going, ask a follow-up
- "nudge": offer the achievement nudge (use when you have enough info about topic)
- "start_session": you have enough info, set topicId and subject, tell child you're starting

topicId mapping (use the closest match):
- Times tables: times-2 through times-12 (e.g. "times-5" for 5 times tables)
- Addition: addition-1-10, addition-11-20, addition-21-50, addition-51-100, addition-101-500
- Subtraction: subtraction-1-10, subtraction-11-20, subtraction-21-50, subtraction-51-100
- Division: division-2 through division-12
- Counting: counting-2s, counting-5s, counting-10s
- Fractions: fractions-basic
- Decimals/percentages: decimals, percentages
- Money: what-is-saving, spending-wisely
- If subject is unclear or child says general: leave topicId null, set subject only

TONE:
- Warm, direct, 1-2 sentences max
- Year 1-4: simple language, encouraging
- Year 5+: more conversational, treat them as capable
- Never list options — make a recommendation or ask one clear question
- After 2 exchanges, commit to starting the session — don't keep asking

NUDGE:
If nudge is provided in context, after acknowledging what child said, add ONE sentence:
"By the way — you're really close to mastering [nudge]. Want to go for that today?"
Then wait for response. If yes → start_session with that topic. If no → start what they said.`

export async function POST(req: NextRequest) {
  try {
    const { childId, childName, yearLevel, message, history, phase, nudge } = await req.json()
    
    const messages = history
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'child' ? 'user' : 'assistant',
        content: m.role === 'earni' ? m.content : `${childName} says: "${m.content}"`
      }))
    
    // Add current message if not already in history
    if (messages.length === 0 || messages[messages.length-1].role !== 'user') {
      messages.push({ role: 'user', content: `${childName} says: "${message}"` })
    }

    const contextNote = [
      `Child: ${childName}, Year ${yearLevel}`,
      nudge ? `Achievement nudge available: ${nudge}` : '',
      `Current phase: ${phase}`,
    ].filter(Boolean).join('\n')

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: CHECKIN_PROMPT + `\n\nCONTEXT:\n${contextNote}`,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed)
    } catch {
      // Extract JSON from response
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        return NextResponse.json(JSON.parse(match[0]))
      }
      return NextResponse.json({
        earniSays: "What are you working on at school right now?",
        action: "continue",
        topicId: null,
        subject: null
      })
    }
  } catch (error) {
    console.error('Checkin error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
