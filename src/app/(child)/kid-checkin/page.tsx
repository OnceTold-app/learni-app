'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: 'earni' | 'child'; content: string }
interface CheckinResponse {
  earniSays: string
  action: 'continue' | 'nudge' | 'start_session'
  topicId?: string | null
  subject?: string | null
  suggestions?: string[]
  baselineLevel?: number
  baselineName?: string
}

// ─── Year-level helpers ───────────────────────────────────────────────────────
function isYoung(yl: number) { return yl <= 6 }
function primaryInput(yl: number): 'suggestions' | 'equal' | 'text' {
  if (yl <= 3) return 'suggestions'
  if (yl <= 6) return 'equal'
  return 'text'
}

// ─── Earni avatar with animated thinking dots ─────────────────────────────────
function EarniAvatar({ thinking, size = 80 }: { thinking?: boolean; size?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #2ec4b6 0%, #1a9e92 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45,
        boxShadow: thinking ? '0 0 0 6px rgba(46,196,182,0.15), 0 0 0 12px rgba(46,196,182,0.07)' : '0 0 0 4px rgba(46,196,182,0.12)',
        transition: 'box-shadow 0.3s',
        flexShrink: 0,
      }}>
        🤖
      </div>
      {thinking && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '16px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#2ec4b6', opacity: 0.6,
              animation: `checkinDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function KidCheckinPage() {
  // Child context
  const [childName, setChildName] = useState('')
  const [yearLevel, setYearLevel] = useState(5)

  // Conversation
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<string>('greeting')
  const [exchangeCount, setExchangeCount] = useState(0) // max 2 before auto-start

  // Input state
  const [textInput, setTextInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('') // live voice-to-text shown on screen
  const [voiceEnabled, setVoiceEnabled] = useState(true) // Year 1-6 default on, 7+ off

  // Check-in context (for passing to API)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [lastTopicRef, setLastTopicRef] = useState('')
  const [daysSinceRef, setDaysSinceRef] = useState(-1)
  const [nudgeRef, setNudgeRef] = useState('')

  // Refs
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Init
  useEffect(() => {
    const name = localStorage.getItem('learni_child_name') || ''
    const yl = parseInt(localStorage.getItem('learni_year_level') || '5')
    const cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    setChildName(cleanName)
    setYearLevel(yl)
    setVoiceEnabled(yl <= 6) // default on for younger, off for older
    startCheckin(cleanName, yl)
  }, [])

  // ── Speak helper ─────────────────────────────────────────────────────────────
  const speak = useCallback(async (text: string, yl: number) => {
    if (yl > 6) return // text-only for Year 7+
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    try {
      const r = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!r.ok) return
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { audioRef.current = null }
      await audio.play()
    } catch { /* silent fail */ }
  }, [])

  // ── Load check-in context ────────────────────────────────────────────────────
  async function startCheckin(name: string, yl: number) {
    setLoading(true)
    const childId = localStorage.getItem('learni_child_id')
    const hasBaseline = !!localStorage.getItem('learni_baseline_level')
    let sessionsCount = 0
    let lastTopic = ''
    let daysSince = -1
    let nudge = ''

    if (childId) {
      try {
        const [statsRes, masteryRes] = await Promise.all([
          fetch(`/api/kid/stats?childId=${childId}`),
          fetch(`/api/kid/mastery?childId=${childId}`),
        ])
        const stats = await statsRes.json()
        const mastery = await masteryRes.json()

        sessionsCount = (stats.sessions || []).length
        if (stats.sessions?.length > 0) {
          lastTopic = stats.sessions[0].subject || ''
          const lastDate = new Date(stats.sessions[0].completed_at || stats.sessions[0].created_at)
          daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        // Find closest-to-mastery topic for nudge
        if (mastery.topicMastery) {
          const best = mastery.topicMastery
            .filter((t: any) => !t.is_mastered && t.correct_count >= 5)
            .sort((a: any, b: any) => b.correct_count - a.correct_count)[0]
          if (best) {
            const pct = Math.round((best.correct_count / 30) * 100)
            nudge = `${best.topic_id.replace(/-/g, ' ')} (${pct}% to mastery)`
          }
        }
      } catch { /* best effort */ }
    }

    const firstTime = sessionsCount === 0 && !hasBaseline
    setIsFirstTime(firstTime)
    setLastTopicRef(lastTopic)
    setDaysSinceRef(daysSince)
    setNudgeRef(nudge)

    // Build opening greeting locally — no API call for the first message
    let greeting: string
    let openingSuggestions: string[]

    if (firstTime) {
      if (yl <= 3) {
        greeting = `Hey ${name}! 👋 I'm Earni — your learning buddy. What's your favourite thing at school?`
        openingSuggestions = ['Maths!', 'Reading', 'Drawing', 'Other']
      } else if (yl <= 6) {
        greeting = `Hey ${name}! 👋 I'm Earni. What are you working on at school right now?`
        openingSuggestions = ['Maths', 'Reading', 'Writing', 'Something else']
      } else {
        greeting = `Hey ${name}. I'm Earni — your AI tutor. What are you working on at school?`
        openingSuggestions = ['Maths', 'Reading', 'Science', 'Other']
      }
    } else if (daysSince === 0 && lastTopic) {
      greeting = yl <= 6
        ? `Hey ${name}! 👋 Last time we did ${lastTopic.toLowerCase()}. Same again, or something different?`
        : `Hey ${name}. Last time: ${lastTopic.toLowerCase()}. Same again or something different?`
      openingSuggestions = [`${lastTopic} again`, 'Something different']
    } else if (daysSince >= 1 && daysSince <= 6) {
      greeting = yl <= 6
        ? `Good to see you, ${name}! 😊 What's your class working on this week?`
        : `Good to see you, ${name}. What's your class working on this week?`
      openingSuggestions = ['Maths', 'Reading & Writing', 'Wealth Wise', 'Something else']
    } else {
      greeting = yl <= 6
        ? `Welcome back, ${name}! 🌟 What are you working on at school right now?`
        : `Welcome back, ${name}. What are you working on at school right now?`
      openingSuggestions = ['Maths', 'Reading & Writing', 'Wealth Wise', 'Something else']
    }

    setMessages([{ role: 'earni', content: greeting }])
    setSuggestions(openingSuggestions)
    setLoading(false)
    setPhase('topic')
    speak(greeting, yl)
  }

  // ── Microphone ───────────────────────────────────────────────────────────────
  function stopListening() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* */ }
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setListening(false)
    setTranscript('')
  }

  function toggleMic() {
    if (listening) { stopListening(); return }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input not supported in this browser. Try Chrome.'); return }

    // Stop any playing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setTextInput('')

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en'

    recognition.onstart = () => {
      setListening(true)
      setTranscript('')
      // Auto-off after 10s of silence
      silenceTimerRef.current = setTimeout(() => stopListening(), 10000)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onerror = () => {
      setListening(false)
      setTranscript('')
    }

    recognition.onresult = (e: any) => {
      // Reset silence timer on any speech
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => stopListening(), 10000)

      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }

      setTranscript(interim || final)

      if (final.trim()) {
        stopListening()
        setTranscript('')
        setTextInput(final.trim())
        // Show what was heard then auto-send
        setTimeout(() => sendMessage(final.trim(), 'voice'), 400)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  async function sendMessage(text: string, inputMethod: 'text' | 'voice' | 'suggestion' = 'text') {
    const msg = text.trim()
    if (!msg || loading || phase === 'starting') return
    stopListening()
    setTextInput('')
    setSuggestions([])

    const userMsg: Message = { role: 'child', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    const newExchangeCount = exchangeCount + 1
    setExchangeCount(newExchangeCount)

    try {
      const r = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: localStorage.getItem('learni_child_id'),
          childName,
          yearLevel,
          message: msg,
          history: newMessages,
          phase,
          nudge: newExchangeCount === 1 ? nudgeRef : '', // nudge on first reply only
          isFirstTime,
          lastTopic: lastTopicRef,
          daysSinceLastSession: daysSinceRef,
          inputMethod,
          exchangeCount: newExchangeCount,
          // Force start after 2 exchanges — never let it drag on
          forceStart: newExchangeCount >= 2,
        }),
      })
      const d: CheckinResponse = await r.json()

      const earniMsg: Message = { role: 'earni', content: d.earniSays }
      setMessages(prev => [...prev, earniMsg])
      speak(d.earniSays, yearLevel)

      // Update suggestions from response
      if (d.suggestions && d.suggestions.length > 0) {
        setSuggestions(d.suggestions)
      }

      // Store baseline if calibration
      if (d.baselineLevel) {
        localStorage.setItem('learni_baseline_level', String(d.baselineLevel))
        if (d.baselineName) localStorage.setItem('learni_baseline_level_name', d.baselineName)
        setIsFirstTime(false)
      }

      // Start session — or force-start after 2 exchanges
      if (d.action === 'start_session' || newExchangeCount >= 2) {
        setPhase('starting')
        if (d.topicId) localStorage.setItem('learni_session_topic', d.topicId)
        if (d.subject) localStorage.setItem('learni_subject', d.subject)
        localStorage.setItem('learni_session_mode', 'full')
        // Pass checkin context to session
        localStorage.setItem('learni_checkin_context', JSON.stringify({
          lastWords: msg,
          inputMethod,
          nudgeAccepted: nudgeRef && msg.toLowerCase().includes('yes'),
          topic: d.topicId || '',
          subject: d.subject || '',
        }))
        setTimeout(() => { window.location.href = '/session' }, 1200)
      } else if (d.action === 'nudge') {
        setPhase('nudge')
      } else {
        setPhase('topic')
      }
    } catch {
      setMessages(prev => [...prev, { role: 'earni', content: 'Hmm, something went wrong. Let\'s try again!' }])
      setLoading(false)
    }
    if (phase !== 'starting') setLoading(false)
  }

  // ── Derived UI state ──────────────────────────────────────────────────────────
  const inputPrimary = primaryInput(yearLevel)
  const showSuggestions = suggestions.length > 0 && phase !== 'starting'
  const showInput = phase !== 'starting'

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(180deg, #0a2420 0%, #0d2b28 60%, #112e2b 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Back button — top left, unobtrusive */}
      <button
        onClick={() => { window.location.href = '/kid-hub' }}
        style={{
          position: 'absolute', top: '16px', left: '16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.25)', fontSize: '13px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          zIndex: 10,
        }}
      >
        ← Hub
      </button>

      {/* ── Earni avatar zone — always visible, centred ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '48px',
        paddingBottom: '16px',
        flexShrink: 0,
      }}>
        <EarniAvatar thinking={loading} size={72} />
        {!loading && messages.length === 0 && (
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
          }}>
            Earni is getting ready...
          </div>
        )}
      </div>

      {/* ── Conversation bubbles — scrollable ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 20px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'child' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              animation: 'bubbleIn 0.2s ease',
            }}
          >
            {m.role === 'earni' ? (
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '18px 18px 18px 4px',
                padding: '12px 16px',
                fontSize: yearLevel <= 6 ? '16px' : '15px',
                color: 'white',
                lineHeight: 1.55,
                fontFamily: yearLevel <= 6 ? "'Nunito', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontWeight: yearLevel <= 6 ? 700 : 400,
              }}>
                {m.content}
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                borderRadius: '18px 18px 4px 18px',
                padding: '12px 16px',
                fontSize: '15px',
                color: '#0d2b28',
                fontWeight: 700,
                lineHeight: 1.5,
              }}>
                {m.content}
              </div>
            )}
          </div>
        ))}

        {/* Thinking state — 3 dots with Earni attribution */}
        {loading && messages.length > 0 && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px',
              padding: '12px 18px',
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#2ec4b6', opacity: 0.7,
                  animation: `checkinDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Session starting state */}
        {phase === 'starting' && (
          <div style={{
            alignSelf: 'center',
            marginTop: '8px',
            color: '#2ec4b6',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: '16px',
            animation: 'fadeIn 0.3s ease',
          }}>
            Starting your session... ✨
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom input zone — always visible ── */}
      {showInput && (
        <div style={{
          flexShrink: 0,
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '12px 16px 24px',
        }}>
          {/* Suggestion chips — primary for Year 1-3, shown for all when available */}
          {showSuggestions && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '10px',
              justifyContent: inputPrimary === 'suggestions' ? 'center' : 'flex-start',
            }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s, 'suggestion')}
                  disabled={loading}
                  style={{
                    padding: yearLevel <= 3 ? '12px 20px' : '9px 16px',
                    borderRadius: '30px',
                    fontSize: yearLevel <= 3 ? '15px' : '13px',
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: i === 0 ? 'rgba(46,196,182,0.18)' : 'rgba(255,255,255,0.07)',
                    border: i === 0 ? '1.5px solid rgba(46,196,182,0.4)' : '1.5px solid rgba(255,255,255,0.12)',
                    color: i === 0 ? '#2ec4b6' : 'rgba(255,255,255,0.7)',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Voice transcript — shows live what mic heard */}
          {transcript && (
            <div style={{
              background: 'rgba(46,196,182,0.08)',
              border: '1px solid rgba(46,196,182,0.2)',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '10px',
              fontStyle: 'italic',
            }}>
              🎤 "{transcript}"
            </div>
          )}

          {/* Text input row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Text field */}
            <input
              ref={inputRef}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && textInput.trim()) {
                  sendMessage(textInput, 'text')
                }
                // Stop mic if typing
                if (listening) stopListening()
              }}
              placeholder={
                yearLevel <= 3 ? 'Type here...' :
                yearLevel <= 6 ? 'Type your answer...' :
                'What are you working on?'
              }
              disabled={loading || phase === 'starting'}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${listening ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '24px',
                fontSize: '15px',
                color: 'white',
                outline: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                opacity: loading ? 0.6 : 1,
              }}
            />

            {/* Mic button — pulsing red dot when active */}
            <button
              onClick={toggleMic}
              disabled={loading || phase === 'starting'}
              title={listening ? 'Tap to stop' : 'Tap to speak'}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${listening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                opacity: loading ? 0.4 : 1,
              }}
            >
              {listening ? (
                <>
                  <span style={{ fontSize: '18px' }}>🎤</span>
                  {/* Pulsing red indicator */}
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'micPulse 1s ease-in-out infinite',
                  }} />
                </>
              ) : (
                <span style={{ fontSize: '18px' }}>🎤</span>
              )}
            </button>

            {/* Send button */}
            <button
              onClick={() => { if (textInput.trim()) sendMessage(textInput, 'text') }}
              disabled={!textInput.trim() || loading || phase === 'starting'}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: textInput.trim() && !loading ? '#2ec4b6' : 'rgba(46,196,182,0.15)',
                border: 'none',
                cursor: textInput.trim() && !loading ? 'pointer' : 'not-allowed',
                color: 'white', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                opacity: !textInput.trim() || loading ? 0.4 : 1,
              }}
            >
              →
            </button>
          </div>

          {/* Year 7+ audio toggle — subtle, opt-in */}
          {yearLevel >= 7 && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button
                onClick={() => {
                  setVoiceEnabled(v => !v)
                  if (!voiceEnabled && audioRef.current) { audioRef.current.pause(); audioRef.current = null }
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', color: 'rgba(255,255,255,0.25)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {voiceEnabled ? '🔊 Voice on — tap to mute' : '🔇 Voice off — tap for audio'}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes checkinDot {
          0%, 80%, 100% { transform: scaleY(0.5); opacity: 0.4; }
          40% { transform: scaleY(1.2); opacity: 1; }
        }
        @keyframes micPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
