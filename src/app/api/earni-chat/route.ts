import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ reply: 'Invalid request.' }, { status: 400 })
    }

    // Keep conversation short to control costs
    const trimmed = messages.slice(-12)

    // Extract system message and user messages
    const systemMsg = trimmed.find((m: { role: string }) => m.role === 'system')?.content || ''
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
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemMsg,
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
