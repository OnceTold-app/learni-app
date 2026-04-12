import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
// River voice — gender neutral, perfect for Earni
const VOICE_ID = 'SAz9YHcvj6GT2YYXdXww'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    // Keep it snappy — truncate very long text
    const cleanText = text.slice(0, 500)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      console.error('ElevenLabs error:', response.status, await response.text())
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
    }

    // Stream the audio back
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Speak API error:', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
