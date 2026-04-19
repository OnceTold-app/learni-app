'use client'
import { useState, useEffect, useRef } from 'react'

export default function KidCheckinPage() {
  const [childName, setChildName] = useState('')
  const [yearLevel, setYearLevel] = useState(5)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [phase, setPhase] = useState<'greeting' | 'topic' | 'nudge' | 'starting'>('greeting')
  const [isFirstTime, setIsFirstTime] = useState(false)
  // Homework mode
  const [homeworkMode, setHomeworkMode] = useState(false)
  const [homeworkSubMode, setHomeworkSubMode] = useState<'choose' | 'photo' | 'type' | null>(null)
  const [homeworkText, setHomeworkText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const name = localStorage.getItem('learni_child_name') || ''
    const yl = parseInt(localStorage.getItem('learni_year_level') || '5')
    setChildName(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
    setYearLevel(yl)

    // Check start mode
    const startMode = localStorage.getItem('learni_start_mode')
    localStorage.removeItem('learni_start_mode')

    if (startMode === 'homework') {
      setHomeworkMode(true)
      setHomeworkSubMode('choose')
      const greeting = `Show me what you're working on — take a photo or tell me what it says.`
      setMessages([{ role: 'earni', content: greeting }])
      if (yl <= 6) speakText(greeting)
    } else {
      startCheckin(name, yl)
    }
  }, [])

  async function startCheckin(name: string, yl: number) {
    setLoading(true)
    const childId = localStorage.getItem('learni_child_id')

    // Check if first time
    const hasBaseline = !!localStorage.getItem('learni_baseline_level')
    let sessionsCount = 0
    let lastTopic = ''
    let nudgeText = ''

    if (childId) {
      try {
        const r = await fetch(`/api/kid/stats?childId=${childId}`)
        const d = await r.json()
        sessionsCount = (d.sessions || []).length
        if (d.sessions && d.sessions.length > 0) {
          lastTopic = d.sessions[0].subject || ''
        }
      } catch {}
    }

    const firstTime = sessionsCount === 0 && !hasBaseline
    setIsFirstTime(firstTime)

    if (firstTime) {
      const cleanName = (name || 'there').charAt(0).toUpperCase() + (name || 'there').slice(1).toLowerCase()
      const greeting = `Hey ${cleanName}! Before we start — let me ask you a few quick questions so I know exactly where to begin. Ready?`
      setMessages([{ role: 'earni', content: greeting }])
      setLoading(false)
      setPhase('topic')
      if (yl <= 6) speakText(greeting)
      return
    }

    // Get achievement nudge
    if (childId) {
      try {
        const r = await fetch(`/api/kid/mastery?childId=${childId}`)
        const d = await r.json()
        if (d.topicMastery) {
          const inProgress = d.topicMastery
            .filter((t: any) => !t.is_mastered && t.correct_count > 0)
            .sort((a: any, b: any) => b.correct_count - a.correct_count)[0]
          if (inProgress) {
            const pct = Math.round((inProgress.correct_count / 30) * 100)
            nudgeText = `${inProgress.topic_id.replace(/-/g, ' ')} (${pct}% there)`
          }
        }
      } catch {}
    }

    // Build greeting
    const cleanName = (name || 'there').charAt(0).toUpperCase() + (name || 'there').slice(1).toLowerCase()
    let greeting = ''
    if (!lastTopic) {
      greeting = `Hey ${cleanName}! What are you working on at school right now?`
    } else {
      greeting = `Last time we worked on ${lastTopic.toLowerCase()}. Same again, or something different today?`
    }

    const earniMsg = { role: 'earni', content: greeting }
    setMessages([earniMsg])
    setLoading(false)
    setPhase('topic')

    if (yl <= 6) speakText(greeting)
    if (nudgeText) localStorage.setItem('learni_checkin_nudge', nudgeText)
  }

  async function speakText(text: string) {
    try {
      const r = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (r.ok) {
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play().catch(() => {})
      }
    } catch {}
  }

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim()
      if (transcript) {
        setMessage(transcript)
        setTimeout(() => sendMessage(transcript), 100)
      }
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setHomeworkSubMode(null)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const userMsg = { role: 'child', content: '📷 [Photo sent]' }
      const newMessages = [...messages, userMsg]
      setMessages(newMessages)

      try {
        const r = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: localStorage.getItem('learni_child_id'),
            childName,
            yearLevel,
            message: 'I have a photo of my homework',
            history: newMessages,
            phase: 'topic',
            nudge: localStorage.getItem('learni_checkin_nudge') || '',
            mode: 'homework',
            imageBase64: base64,
          })
        })
        const d = await r.json()
        const earniResponse = { role: 'earni', content: d.earniSays }
        setMessages(prev => [...prev, earniResponse])
        if (yearLevel <= 6) speakText(d.earniSays)

        if (d.action === 'start_session') {
          setPhase('starting')
          if (d.topicId) localStorage.setItem('learni_session_topic', d.topicId)
          if (d.subject) localStorage.setItem('learni_subject', d.subject)
          localStorage.setItem('learni_session_mode', 'full')
          setTimeout(() => { window.location.href = '/session' }, 1500)
        } else {
          setPhase('topic')
          setHomeworkMode(false)
        }
      } catch {
        setMessages(prev => [...prev, { role: 'earni', content: "Hmm, I couldn't read that photo. Can you tell me what the homework says?" }])
        setHomeworkSubMode('type')
      }
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  async function sendHomeworkText() {
    const msg = homeworkText.trim()
    if (!msg || loading) return
    setHomeworkText('')
    setHomeworkSubMode(null)
    setHomeworkMode(false)
    await sendMessage(msg)
  }

  async function sendMessage(text?: string) {
    const msg = text || message.trim()
    if (!msg || loading) return
    setMessage('')

    const userMsg = { role: 'child', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

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
          nudge: localStorage.getItem('learni_checkin_nudge') || '',
          isFirstTime,
        })
      })
      const d = await r.json()

      const earniResponse = { role: 'earni', content: d.earniSays }
      setMessages(prev => [...prev, earniResponse])

      if (yearLevel <= 6) speakText(d.earniSays)

      // Store baseline level if calibration returned one
      if (d.baselineLevel) {
        localStorage.setItem('learni_baseline_level', String(d.baselineLevel))
        if (d.baselineName) {
          localStorage.setItem('learni_baseline_level_name', d.baselineName)
        }
        setIsFirstTime(false)
      }

      if (d.action === 'start_session') {
        setPhase('starting')
        if (d.topicId) localStorage.setItem('learni_session_topic', d.topicId)
        if (d.subject) localStorage.setItem('learni_subject', d.subject)
        localStorage.setItem('learni_session_mode', 'full')
        setTimeout(() => { window.location.href = '/session' }, 1500)
      } else if (d.action === 'nudge') {
        setPhase('nudge')
      } else {
        setPhase('topic')
      }
    } catch {
      setMessages(prev => [...prev, { role: 'earni', content: "Hmm, something went wrong. Let's try again!" }])
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d2b28', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => { if (window.history.length > 1) { window.history.back() } else { window.location.href = '/kid-hub' } }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px', cursor: 'pointer', padding: 0 }}>← Back</button>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: 'white', fontSize: '16px' }}>Earni</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'child' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            {m.role === 'earni' && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #2ec4b6, #1a9e92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🤖</div>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', fontSize: '15px', color: 'white', lineHeight: 1.5 }}>
                  {m.content}
                </div>
              </div>
            )}
            {m.role === 'child' && (
              <div style={{ background: '#2ec4b6', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', fontSize: '15px', color: '#0d2b28', fontWeight: 600, lineHeight: 1.5 }}>
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #2ec4b6, #1a9e92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '12px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Earni is thinking...
            </div>
          </div>
        )}
        {phase === 'starting' && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#2ec4b6', fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '18px' }}>
            Starting your session...
          </div>
        )}
      </div>

      {/* Homework mode — choose photo or type */}
      {homeworkMode && homeworkSubMode === 'choose' && phase !== 'starting' && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px', background: '#0d2b28' }}>
          <label style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px',
            background: 'rgba(46,196,182,0.12)',
            border: '1.5px solid rgba(46,196,182,0.3)',
            borderRadius: '16px',
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '15px',
            fontWeight: 800,
            color: '#2ec4b6',
          }}>
            📷 Take a photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelected}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={() => setHomeworkSubMode('type')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '15px',
              fontWeight: 800,
              color: 'white',
            }}
          >
            ✏️ Type it
          </button>
        </div>
      )}

      {/* Homework mode — type description */}
      {homeworkMode && homeworkSubMode === 'type' && phase !== 'starting' && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0d2b28' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600 }}>
            What does your homework say or ask?
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={homeworkText}
              onChange={e => setHomeworkText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendHomeworkText()}
              placeholder="Describe your homework..."
              autoFocus
              style={{
                flex: 1, padding: '12px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: '24px', fontSize: '15px',
                color: 'white', outline: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            <button
              onClick={sendHomeworkText}
              disabled={!homeworkText.trim() || loading}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: homeworkText.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.2)',
                border: 'none', cursor: homeworkText.trim() ? 'pointer' : 'not-allowed',
                color: 'white', fontSize: '18px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >→</button>
          </div>
        </div>
      )}

      {/* Normal input area */}
      {!homeworkMode && phase !== 'starting' && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', alignItems: 'center', background: '#0d2b28' }}>
          <input
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your answer..."
            style={{
              flex: 1, padding: '12px 16px',
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: '24px', fontSize: '15px',
              color: 'white', outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <button
            onClick={startListening}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${listening ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
              cursor: 'pointer', fontSize: '18px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {listening ? '🔴' : '🎤'}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={!message.trim() || loading}
            style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: message.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.2)',
              border: 'none', cursor: message.trim() ? 'pointer' : 'not-allowed',
              color: 'white', fontSize: '18px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >→</button>
        </div>
      )}
    </div>
  )
}
