import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const ELEVENLABS_VOICE_ID = 'SAz9YHcvj6GT2YYXdXww'

// Languages not supported by OpenAI TTS — fall back to ElevenLabs
const ELEVENLABS_FALLBACK_LANGUAGES = ['mi', 'sm', 'af']

// Simple in-memory cache for common phrases
const audioCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_SIZE = 100

export async function POST(req: NextRequest) {
  try {
    const { text, language = 'en' } = await req.json()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const cleanText = text.slice(0, 400)

    // Check cache
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
      // ElevenLabs fallback for unsupported languages
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
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      )
      if (!response.ok) throw new Error(`ElevenLabs error: ${response.status}`)
      audioBuffer = await response.arrayBuffer()
    } else {
      // GPT-4o-mini-TTS — instruction-following, expressive, warm
      // Nova voice: warm, clear, good for children's education
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: 'nova',
          instructions:
            'You are Earni, a warm and encouraging AI tutor for children. Speak clearly and naturally at a pace appropriate for learning. Be warm and enthusiastic for correct answers, gentle and patient for explanations, direct and friendly for greetings. Never robotic — always human and caring.',
          response_format: 'mp3',
        }),
      })
      if (!response.ok) {
        const err = await response.text()
        throw new Error(`OpenAI TTS error: ${response.status} ${err}`)
      }
      audioBuffer = await response.arrayBuffer()
    }

    // Cache the result
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = audioCache.keys().next().value
      if (oldestKey) audioCache.delete(oldestKey)
    }
    audioCache.set(cacheKey, { buffer: audioBuffer, timestamp: Date.now() })

    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
