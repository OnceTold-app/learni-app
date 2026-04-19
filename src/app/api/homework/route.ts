import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const HOMEWORK_PROMPT = `You are Earni, an AI tutor helping a child understand their homework. A photo of their homework has been shared with you.

## CRITICAL RULES — READ THESE FIRST
1. **NEVER give the answer directly.** You are a tutor, not an answer key.
2. **Help them UNDERSTAND the question.** Many kids struggle because they don't understand what's being asked.
3. **Teach the METHOD**, not the solution. Show them HOW to approach the problem.
4. **Use scaffolding:** Break complex problems into smaller steps.
5. **If there are multiple questions**, address them one at a time. Ask which one they want help with.

## HOW TO HELP
1. First, read and identify what's on the homework sheet.
2. Explain what the question is asking in simple, kid-friendly language.
3. Give a similar example (NOT the actual question) and solve that together.
4. Guide them to apply the same method to their actual question.
5. If they're completely stuck, give progressively more specific hints — but NEVER the final answer.

## RESPONSE FORMAT
Return JSON:
{
  "earniSays": "What Earni says to the child (warm, encouraging)",
  "questionsFound": ["Question 1 text", "Question 2 text"],
  "subject": "Maths/Reading/Science/etc",
  "helpWith": "Brief description of what the homework is about",
  "hint": "A helpful starting point without giving the answer",
  "visual": null or { visual aid if helpful },
  "checkIn": ["Help me with #1", "Help me with #2", "I don't understand any of it"]
}

## PERSONALITY
- Warm, patient, encouraging — like a kind older sibling
- "Let's figure this out together!"
- Never make them feel bad for not knowing
- Celebrate when they work it out: "See? You DID know how to do it!"
- If the photo is unclear, ask them to describe the question instead`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get('image') as File
    const childName = formData.get('childName') as string || 'there'
    const yearLevel = formData.get('yearLevel') as string || '5'
    const question = formData.get('question') as string || ''

    if (!image && !question) {
      return NextResponse.json({ error: 'Image or question required' }, { status: 400 })
    }

    // Build messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = []

    if (image) {
      const bytes = await image.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mediaType = image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      })
    }

    const textPrompt = question
      ? `${childName} (Year ${yearLevel}) is asking about their homework. They said: "${question}". Help them understand without giving the answer.`
      : `${childName} (Year ${yearLevel}) has shared a photo of their homework. Look at it carefully, identify the questions, and help them understand how to approach it — WITHOUT giving any answers directly.`

    content.push({ type: 'text', text: textPrompt })

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: [{ type: 'text', text: HOMEWORK_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

    // Parse JSON
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed)
    } catch {
      // Extract first JSON object
      let depth = 0, start = -1
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') { if (depth === 0) start = i; depth++ }
        else if (text[i] === '}') {
          depth--
          if (depth === 0 && start >= 0) {
            try { return NextResponse.json(JSON.parse(text.slice(start, i + 1))) } catch { /* */ }
            start = -1
          }
        }
      }
      return NextResponse.json({ earniSays: text.replace(/[{}"[\]]/g, '').trim() || "Let me take a look at that..." })
    }
  } catch (error) {
    console.error('Homework API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
