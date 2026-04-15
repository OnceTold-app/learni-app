import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
// River voice — gender neutral, ElevenLabs fallback for unsupported languages
const ELEVENLABS_VOICE_ID = 'SAz9YHcvj6GT2YYXdXww'

// Cartesia — Grace voice (Australian English, closest to NZ accent)
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY || ''
const CARTESIA_VOICE_ID = 'a4a16c5e-5902-4732-b9b6-2a48efd2e11b'
const CARTESIA_MODEL = 'sonic-2'

// Languages not supported by Cartesia — fall back to ElevenLabs
const ELEVENLABS_FALLBACK_LANGUAGES = ['mi', 'sm', 'af']

// Simple in-memory cache for common phrases
const audioCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_SIZE = 50

export async function POST(req: NextRequest) {
  try {
    const { text, language = 'en' } = await req.json()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    // Keep it snappy — truncate very long text
    const cleanText = text.slice(0, 300)

    // Check cache for short common phrases
    const cacheKey = `${language}:${cleanText.toLowerCase().trim()}`
    const cached = audioCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(cached.buffer, {
        headers: { 'Content-Type': 'audio/mpeg', 'X-Cache': 'HIT' },
      })
    }

    const useElevenLabs = ELEVENLABS_FALLBACK_LANGUAGES.includes(language)

    let audioBuffer: ArrayBuffer

    if (useElevenLabs) {
      // ElevenLabs fallback for mi (Te Reo Māori), sm (Samoan), af (Afrikaans)
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
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
        }
      )

      if (!response.ok) {
        console.error('ElevenLabs error:', response.status, await response.text())
        return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
      }

      audioBuffer = await response.arrayBuffer()
    } else {
      // Cartesia — primary TTS (20x cheaper, supports en, fr, es, de, zh, hi, ja, ko, pt, ar)
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': CARTESIA_API_KEY,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: CARTESIA_MODEL,
          transcript: cleanText,
          voice: {
            mode: 'id',
            id: CARTESIA_VOICE_ID,
          },
          output_format: {
            container: 'mp3',
            encoding: 'mp3',
            sample_rate: 44100,
          },
        }),
      })

      if (!response.ok) {
        console.error('Cartesia error:', response.status, await response.text())
        return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
      }

      audioBuffer = await response.arrayBuffer()
    }

    // Cache short common phrases
    if (cleanText.length < 100) {
      if (audioCache.size >= MAX_CACHE_SIZE) {
        // Evict oldest
        const oldest = [...audioCache.entries()].sort(
          (a, b) => a[1].timestamp - b[1].timestamp
        )[0]
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
