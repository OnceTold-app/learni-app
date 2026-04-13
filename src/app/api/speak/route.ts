import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
// River voice — gender neutral, perfect for Earni
const VOICE_ID = 'SAz9YHcvj6GT2YYXdXww'

// Simple in-memory cache for common phrases
const audioCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_SIZE = 50

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    // Keep it snappy — truncate very long text
    const cleanText = text.slice(0, 300) // Reduced from 500 to save credits

    // Check cache for short common phrases
    const cacheKey = cleanText.toLowerCase().trim()
    const cached = audioCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(cached.buffer, {
        headers: { 'Content-Type': 'audio/mpeg', 'X-Cache': 'HIT' },
      })
    }

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

    // Cache and return
    const audioBuffer = await response.arrayBuffer()

    // Store in cache for common phrases
    if (cleanText.length < 100) {
      if (audioCache.size >= MAX_CACHE_SIZE) {
        // Evict oldest
        const oldest = [...audioCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
        if (oldest) audioCache.delete(oldest[0])
      }
      audioCache.set(cacheKey, { buffer: audioBuffer, timestamp: Date.now() })
    }

    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('Speak API error:', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
