import { NextRequest, NextResponse } from 'next/server'

function buildSystemPrompt(contextMsg: string): string {
  const context = contextMsg.match(/context:(\S+)/)?.[1] || ''
  const question = contextMsg.match(/question:(.+?)(?:\s+topic:|$)/)?.[1]?.trim() || ''
  const topic = contextMsg.match(/topic:(.+)/)?.[1]?.trim() || ''

  if (context === 'parent_portal') {
    return `You are Earni, the friendly AI assistant for Learni — an educational app for kids.
You are currently helping a PARENT. Use a direct, professional, and helpful tone.
Answer questions about the app, subscriptions, how to support their child's learning, curriculum, or any general queries.
Be concise and clear. Do not use excessive emojis. Keep responses under 120 words.`
  }

  if (context === 'child_portal') {
    return `You are Earni, a warm and encouraging AI tutor for kids.
You are on the Kid Hub screen. Help the child understand what they can do here, encourage them to start a session, or answer any questions they have.
Use simple, fun language. Be supportive and positive. Keep responses short (under 80 words). Use 1-2 emojis max.`
  }

  if (context === 'session_picker') {
    return `You are Earni, a warm and encouraging AI tutor for kids.
You are helping the child pick what to learn next. If they seem unsure, ask what subject they find fun or tricky, and suggest a session type.
Use simple, fun language. Be supportive and enthusiastic. Keep responses short (under 80 words). Use 1-2 emojis max.`
  }

  if (context === 'in_session') {
    const questionHint = question ? ` They are currently working on: "${question}".` : ''
    const topicHint = topic ? ` The topic is: ${topic}.` : ''
    return `You are Earni, a warm and patient AI tutor for kids currently in a learning session.${questionHint}${topicHint}
The child has asked for help. Give a warm, encouraging hint or explanation — do NOT just give away the answer.
Guide them step by step. Use simple language, be supportive. Keep responses under 100 words. Use 1-2 emojis max.`
  }

  // Default fallback
  return `You are Earni, a warm and encouraging AI tutor assistant for the Learni app.
Help users with questions about learning, the app, or anything they need support with.
Be friendly, concise, and helpful. Keep responses under 100 words.`
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ reply: 'Invalid request.' }, { status: 400 })
    }

    // Keep conversation short to control costs
    const trimmed = messages.slice(-12)

    // Extract context from system message and build a proper system prompt
    const rawSystemContent = trimmed.find((m: { role: string }) => m.role === 'system')?.content || ''
    const systemPrompt = buildSystemPrompt(rawSystemContent)

    const chatMsgs = trimmed
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'sk-ant-api03-placeholder') {
      // Fallback: use a simple canned response if no API key
      return NextResponse.json({
        reply: "Hey! I'm Earni. Our chat is being set up — in the meantime, check out learniapp.co or email hello@learniapp.co with any questions!"
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Haiku sufficient for homepage FAQ chat
        max_tokens: 500,
        system: systemPrompt,
        messages: chatMsgs,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return NextResponse.json({
        reply: "Sorry, I'm having a moment. Try again in a sec, or email hello@learniapp.co!"
      })
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text || "Sorry, I couldn't think of a response. Try asking again?"

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({
      reply: "Something went wrong on my end. Email hello@learniapp.co and a human will help!"
    })
  }
}
