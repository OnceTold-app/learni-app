import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'
import { CHILD_SAFETY_SYSTEM_PROMPT, moderateEarniResponse } from '@/lib/child-safety'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const HOMEWORK_SYSTEM_PROMPT = `You are Earni — a warm, patient AI tutor helping a child understand their homework.

## SUBJECT DETECTION — CRITICAL
The homework may cover ANY subject: Maths, Reading & Writing, Science, History, Geography, Social Studies, Art, Music, Te Reo Māori, or anything else.
- Identify the subject from the CONTENT of the photo or question — do not assume it is Maths.
- Read carefully. A photo of a worksheet about ecosystems is Science. A story comprehension is Reading. A times table is Maths.
- If unsure, say what you think it looks like and ask the child to confirm.

## ABSOLUTE RULE — NEVER GIVE HOMEWORK ANSWERS
You must NEVER directly answer the actual homework questions.
- If a question on the sheet asks "What is 8 × 7?" — do not say 56.
- If a question asks "What caused World War 1?" — do not write the answer.
- If a question asks to find the main idea of a passage — do not state it.
Your job is to teach the METHOD and build understanding using DIFFERENT examples.

## HOW TO HELP
1. Identify the subject and what concept the homework is practising.
2. Explain the concept in simple, friendly language.
3. Give a DIFFERENT example (not from their sheet) and work through it together.
4. Ask which specific question they want help with — guide them, don't answer.
5. Use scaffolding: break it down into small steps.

## PRACTICE QUESTIONS
When generating practice questions:
- Use COMPLETELY DIFFERENT scenarios from the homework sheet.
- Teach the SAME underlying concept from a fresh angle.
- For Maths: different numbers, different context.
- For Reading: different passage or story.
- For Science: different organism, system, or example.
- For History/Social Studies: analogous situation from a different era or place.
- Never reuse the exact wording, numbers, or names from the homework.

## PERSONALITY
- Warm, encouraging — like a brilliant older sibling.
- "Let's figure this out together!"
- Celebrate effort: "See? You knew more than you thought!"
- Never make them feel bad for not knowing.
- If the photo is blurry or unclear, ask them to describe it in their own words.

## RESPONSE (via tool call)
Return these fields:
- earniSays: What Earni says (warm, clear, 2-4 sentences)
- subject: The subject identified (e.g. "Maths", "Reading & Writing", "Science", "History", "Te Reo Māori" etc)
- helpWith: Brief description of the concept being practised
- questionsFound: Array of question texts found on the sheet (quoted but NOT answered)
- hint: A helpful starting-point tip that builds understanding without giving the answer
- practiceQuestions: Array of 2-3 practice questions using DIFFERENT scenarios to teach the same concept
- checkIn: 2-3 response options for the child`

// Tool schema — guaranteed structure via tool_use
const homeworkTool = {
  name: 'homework_response',
  description: 'Return a structured homework help response',
  input_schema: {
    type: 'object' as const,
    properties: {
      earniSays: {
        type: 'string',
        description: 'What Earni says to the child — warm, helpful, 2-4 sentences. Never gives homework answers.',
      },
      subject: {
        type: 'string',
        description: 'Subject identified from the homework content (Maths, Science, Reading & Writing, History, etc)',
      },
      helpWith: {
        type: 'string',
        description: 'Brief description of the concept the homework is practising',
      },
      questionsFound: {
        type: 'array',
        items: { type: 'string' },
        description: 'The actual homework questions found — quoted but NOT answered',
      },
      hint: {
        type: 'string',
        description: 'A helpful starting point that builds understanding without giving the answer',
      },
      practiceQuestions: {
        type: 'array',
        items: { type: 'string' },
        description: 'DIFFERENT practice questions that teach the same concept using completely different scenarios',
      },
      checkIn: {
        type: 'array',
        items: { type: 'string' },
        description: '2-3 response options for the child (e.g. which question to focus on, or asking for another example)',
      },
    },
    required: ['earniSays', 'subject', 'helpWith', 'practiceQuestions', 'checkIn'],
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get('image') as File | null
    const childName = (formData.get('childName') as string) || 'there'
    const yearLevel = (formData.get('yearLevel') as string) || '5'
    const question = (formData.get('question') as string) || ''

    if (!image && !question) {
      return NextResponse.json({ error: 'Image or question required' }, { status: 400 })
    }

    // Build message content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = []

    if (image && !question) {
      // Photo submitted — encode as base64
      const bytes = await image.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mediaType = image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      })
      content.push({
        type: 'text',
        text: `${childName} (Year ${yearLevel}) has shared a photo of their homework. Identify the subject from the content, note the questions on the sheet (without answering them), and help them understand how to approach it. Build practice questions using completely different scenarios.`,
      })
    } else {
      // Follow-up text question
      content.push({
        type: 'text',
        text: `${childName} (Year ${yearLevel}) says: "${question}"\n\nRespond as Earni — help them understand without giving any direct answers to their homework. If they are asking about a specific homework question, teach the method using a different example.`,
      })
    }

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      // Prompt caching — system prompt cached after first call
      system: [{ type: 'text' as const, text: CHILD_SAFETY_SYSTEM_PROMPT + '\n\n---\n\n' + HOMEWORK_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } }],
      messages: [{ role: 'user', content }],
      tools: [homeworkTool],
      tool_choice: { type: 'any' as const },
    })

    // Extract tool_use block — guaranteed structure
    const toolBlock = response.content.find(b => b.type === 'tool_use')
    if (toolBlock && toolBlock.type === 'tool_use') {
      return NextResponse.json(toolBlock.input)
    }

    // Fallback: text response (shouldn't happen with tool_choice: any)
    const textBlock = response.content.find(b => b.type === 'text')
    const fallbackText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    return NextResponse.json({
      earniSays: fallbackText || "Let me take a look at that...",
      subject: 'Unknown',
      helpWith: '',
      practiceQuestions: [],
      checkIn: ["Help me with the first question", "I don't understand any of it"],
    })
  } catch (error) {
    console.error('Homework API error:', error)
    return NextResponse.json({
      earniSays: "Hmm, something went wrong. Can you try again or type out the question?",
      subject: 'Unknown',
      helpWith: '',
      practiceQuestions: [],
      checkIn: ["Try again", "Type my question instead"],
    }, { status: 500 })
  }
}
