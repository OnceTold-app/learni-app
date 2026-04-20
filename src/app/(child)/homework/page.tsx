'use client'

import { useState, useEffect, useRef } from 'react'

interface HelpResponse {
  earniSays: string
  questionsFound?: string[]
  subject?: string
  helpWith?: string
  hint?: string
  practiceQuestions?: string[]
  checkIn?: string[]
}

export default function HomeworkPage() {
  const [childName, setChildName] = useState('Student')
  const [yearLevel, setYearLevel] = useState('5')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [response, setResponse] = useState<HelpResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: string; text: string }>>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [listening, setListening] = useState(false)
  const [trainingPlan, setTrainingPlan] = useState<string[] | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [debugSteps, setDebugSteps] = useState<string[]>([])

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
    setYearLevel(localStorage.getItem('learni_year_level') || '5')
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    // Compress image to stay under Anthropic's 5MB base64 limit
    // Base64 adds ~33% overhead, so raw file must be under ~3.5MB
    const compressed = await compressImage(f, 3 * 1024 * 1024) // 3MB raw target
    setFile(compressed)
    setPreview(URL.createObjectURL(compressed))
    setResponse(null)
    setConversation([])
    setDebugSteps([])
  }

  async function compressImage(file: File, maxBytes: number): Promise<File> {
    if (file.size <= maxBytes) return file // Already small enough
    return new Promise((resolve) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        // Scale down proportionally — max 1600px wide
        const maxDim = 1600
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
          else { width = Math.round(width * maxDim / height); height = maxDim }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        // Try quality 0.85 first, then 0.7 if still too large
        canvas.toBlob((blob) => {
          if (blob && blob.size <= maxBytes) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else {
            canvas.toBlob((blob2) => {
              resolve(new File([blob2 || blob!], file.name, { type: 'image/jpeg' }))
            }, 'image/jpeg', 0.65)
          }
        }, 'image/jpeg', 0.85)
      }
      img.src = url
    })
  }

  async function handleSubmit(question?: string) {
    setLoading(true)
    setDebugSteps([])
    const addStep = (msg: string) => setDebugSteps(prev => [...prev, msg])
    try {
      // Step 1: build form data
      addStep(`✅ Step 1: Building request...`)
      const formData = new FormData()
      if (file && !question) {
        formData.append('image', file)
        addStep(`✅ Step 2: Photo attached — ${file.name} (${file.type}, ${(file.size/1024).toFixed(1)}KB)`)
      }
      formData.append('childName', childName)
      formData.append('yearLevel', yearLevel)
      if (question) formData.append('question', question)

      // Step 3: send request
      addStep(`✅ Step 3: Sending to Earni...`)
      const res = await fetch('/api/homework', { method: 'POST', body: formData })
      addStep(`✅ Step 4: Got response — HTTP ${res.status}`)

      const text = await res.text()
      addStep(`✅ Step 5: Response body (${text.length} chars): ${text.slice(0, 120)}`)

      let data
      try {
        data = JSON.parse(text)
      } catch {
        addStep(`❌ Step 6: JSON parse failed — raw: ${text.slice(0, 200)}`)
        setLoading(false)
        return
      }
      addStep(`✅ Step 6: Parsed — earniSays: ${(data.earniSays || '').slice(0, 80)}`)
      if (data._debug) addStep(`⚠️ Debug: ${data._debug}`)


      setResponse(data)
      setConversation(prev => [
        ...prev,
        ...(question ? [{ role: 'kid', text: question }] : []),
        { role: 'earni', text: data.earniSays || 'Let me take a look...' },
      ])

      // Speak if voice is available
      if (data.earniSays) {
        try {
          const ttsRes = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.earniSays }),
          })
          if (ttsRes.ok) {
            const blob = await ttsRes.blob()
            const audio = new Audio(URL.createObjectURL(blob))
            await audio.play()
          }
        } catch { /* silent */ }
      }
    } catch (err) {
      console.error('Homework submit error:', err)
      setResponse({ earniSays: "Something went wrong. Try typing your question instead, or take a new photo." })
    }
    setLoading(false)
  }

  function handleFollowUp() {
    if (!followUp.trim()) return
    const q = followUp.trim()
    setFollowUp('')
    handleSubmit(q)
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-NZ'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim()
      if (transcript) {
        setConversation(prev => [...prev, { role: 'kid', text: transcript }])
        handleSubmit(transcript)
      }
    }
    recognition.start()
  }

  async function generateTrainingPlan() {
    if (!response) return
    setGeneratingPlan(true)
    try {
      const topics = response.questionsFound?.join(', ') || response.helpWith || response.subject || 'homework'
      const formData = new FormData()
      formData.append('childName', childName)
      formData.append('yearLevel', yearLevel)
      formData.append('question', `Based on this homework about "${topics}", create a 5-day training plan. Each day should have a different focus that builds the skills needed. Day 1 = basics, Day 5 = challenge level. Return JSON: { "earniSays": "intro", "trainingPlan": ["Day 1: ...", "Day 2: ...", "Day 3: ...", "Day 4: ...", "Day 5: ..."], "checkIn": ["Start Day 1 now", "Save for later"] }`)
      const res = await fetch('/api/homework', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.trainingPlan) {
        setTrainingPlan(data.trainingPlan)
        setConversation(prev => [...prev, { role: 'earni', text: data.earniSays || "Here's your training plan for the week!" }])
      }
      // Save focus areas AND homework topics so sessions use them
      const childId = localStorage.getItem('learni_child_id')
      if (childId) {
        const token = localStorage.getItem('learni_parent_token') || ''
        await fetch('/api/parent/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ childId, focusAreas: [topics] }),
        }).catch(() => {})
        // Store homework context for session to pick up
        localStorage.setItem('learni_homework_topics', topics)
        localStorage.setItem('learni_subject', topics)
        localStorage.setItem('learni_session_mode', 'learn')
      }
    } catch { /* */ }
    setGeneratingPlan(false)
  }

  async function startHomeworkSession() {
    // Map subject to a clean session subject + pass context as topic
    const rawSubject = response?.subject || 'Reading & Writing'
    const helpWith = response?.helpWith || ''

    // Map to valid session subjects
    const subjectMap: Record<string, string> = {
      'maths': 'Maths', 'math': 'Maths', 'mathematics': 'Maths',
      'reading': 'Reading & Writing', 'writing': 'Reading & Writing',
      'reading & writing': 'Reading & Writing', 'english': 'Reading & Writing',
      'science': 'Reading & Writing', 'history': 'Reading & Writing',
      'geography': 'Reading & Writing', 'social studies': 'Reading & Writing',
    }
    const cleanSubject = subjectMap[rawSubject.toLowerCase()] || 'Reading & Writing'
    const topicContext = helpWith || rawSubject

    localStorage.setItem('learni_subject', cleanSubject)
    localStorage.setItem('learni_topic', topicContext)
    localStorage.setItem('learni_session_mode', 'learn')
    localStorage.setItem('learni_homework_context', topicContext)
    window.location.href = '/start-session'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28, #143330)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '76px 24px 120px',
      overflowY: 'auto',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <a href="/kid-hub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Back to Hub</a>

        <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📸</div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>
            Homework Helper
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Take a photo of your homework and Earni will help you understand it
          </p>
        </div>

        {/* Upload area */}
        {!preview && (
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%',
                padding: '48px 24px',
                background: 'rgba(255,255,255,0.04)',
                border: '2px dashed rgba(255,255,255,0.12)',
                borderRadius: '20px',
                cursor: 'pointer',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 800, color: '#2ec4b6' }}>
                Take a photo or upload
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                JPG, PNG — snap your worksheet, textbook, or exercise book
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', margin: '12px 0' }}>or</div>

            {/* Voice input */}
            <button
              onClick={startListening}
              disabled={listening}
              style={{
                width: '100%',
                padding: '16px',
                background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                border: listening ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                cursor: listening ? 'default' : 'pointer',
                textAlign: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{listening ? '🎤' : '🎙️'}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800, color: listening ? '#ef4444' : '#2ec4b6' }}>
                {listening ? 'Listening...' : 'Read your question aloud'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                {listening ? 'Speak now — Earni is listening' : 'Tap and read the question from your sheet'}
              </div>
            </button>

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', margin: '8px 0' }}>or type it</div>

            <form onSubmit={(e) => { e.preventDefault(); handleFollowUp() }}>
              <input
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                placeholder="Type your homework question..."
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  fontSize: '15px',
                  color: 'white',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </form>
          </div>
        )}

        {/* Photo preview */}
        {preview && (
          <div style={{ marginBottom: '20px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Homework" style={{
              width: '100%', borderRadius: '16px', maxHeight: '300px', objectFit: 'contain',
              background: 'rgba(255,255,255,0.04)',
            }} />

            {!response && !loading && (
              <button
                onClick={() => handleSubmit()}
                style={{
                  width: '100%', padding: '16px', marginTop: '12px',
                  background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                  color: 'white', border: 'none', borderRadius: '30px',
                  fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900,
                  cursor: 'pointer', boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
                }}
              >
                Help me with this! →
              </button>
            )}

            <button
              onClick={() => { setPreview(null); setFile(null); setResponse(null); setConversation([]) }}
              style={{
                width: '100%', padding: '10px', marginTop: '8px',
                background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', color: 'rgba(255,255,255,0.3)',
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Take a different photo
            </button>
          </div>
        )}

        {/* Debug steps — visible during and after loading */}
        {debugSteps.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '6px', color: '#2ec4b6' }}>Debug log:</div>
            {debugSteps.map((step, i) => <div key={i}>{step}</div>)}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤔</div>
            Earni is reading your homework...
          </div>
        )}

        {/* Conversation */}
        {conversation.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {conversation.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'kid' ? 'flex-end' : 'flex-start',
                gap: '8px',
              }}>
                {msg.role === 'earni' && (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0,
                  }}>🤖</div>
                )}
                <div style={{
                  background: msg.role === 'kid' ? 'rgba(46,196,182,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${msg.role === 'kid' ? 'rgba(46,196,182,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  maxWidth: '85%',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: 'white',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 600,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subject badge + what Earni identified */}
        {response?.subject && !loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{
              background: 'rgba(46,196,182,0.12)',
              border: '1px solid rgba(46,196,182,0.25)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#2ec4b6',
              fontFamily: "'Nunito', sans-serif",
            }}>
              {response.subject}
            </span>
            {response.helpWith && (
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                {response.helpWith}
              </span>
            )}
          </div>
        )}

        {/* Practice questions — different scenarios, same concept */}
        {response?.practiceQuestions && response.practiceQuestions.length > 0 && !loading && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Practice questions — try these yourself
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {response.practiceQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(`Can you help me with this practice question: ${q}`)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'white',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#2ec4b6', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: '13px', lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'rgba(255,255,255,0.75)' }}>{q}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '10px', fontStyle: 'italic' }}>
              Tap a question to work through it with Earni. These are practice questions — not your homework answers.
            </div>
          </div>
        )}

        {/* Check-in buttons */}
        {response?.checkIn && response.checkIn.length > 0 && !loading && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {response.checkIn.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(option)}
                style={{
                  padding: '8px 16px',
                  background: i === 0 ? 'rgba(46,196,182,0.12)' : 'rgba(255,255,255,0.04)',
                  border: i === 0 ? '1px solid rgba(46,196,182,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: i === 0 ? '#2ec4b6' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Work through with Earni button */}
        {response && !loading && (
          <button
            onClick={startHomeworkSession}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
              marginBottom: '12px',
            }}
          >
            🎤 Work through this with Earni →
          </button>
        )}

        {/* Training plan button */}
        {response && !loading && !trainingPlan && (
          <button
            onClick={generateTrainingPlan}
            disabled={generatingPlan}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '16px',
              cursor: generatingPlan ? 'default' : 'pointer',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800, color: '#a78bfa' }}>
              {generatingPlan ? 'Creating your plan...' : '📅 Create a week of training from this homework'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
              5 days of focused practice to master these skills
            </div>
          </button>
        )}

        {/* Training plan display */}
        {trainingPlan && (
          <div style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '16px',
          }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: '#a78bfa', marginBottom: '12px' }}>
              📅 Your Training Plan
            </div>
            {trainingPlan.map((day, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                marginBottom: '6px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.5,
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}>
                <span style={{ color: '#a78bfa', fontWeight: 800, flexShrink: 0, fontFamily: "'Nunito', sans-serif" }}>Day {i + 1}</span>
                <span>{day.replace(/^Day \d+:?\s*/i, '')}</span>
              </div>
            ))}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <a href="/start-session" style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: '#a78bfa',
                color: 'white',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                fontFamily: "'Nunito', sans-serif",
              }}>
                Start Day 1 now →
              </a>
            </div>
          </div>
        )}

        {/* Follow-up input */}
        {response && !loading && (
          <form onSubmit={(e) => { e.preventDefault(); handleFollowUp() }} style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={startListening} disabled={listening} style={{
              padding: '12px',
              background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              border: listening ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              cursor: listening ? 'default' : 'pointer',
              fontSize: '18px',
            }}>{listening ? '🎤' : '🎙️'}</button>
            <input
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              placeholder="Ask or speak..."
              style={{
                flex: 1, padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                fontSize: '14px', color: 'white', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button type="submit" disabled={!followUp.trim()} style={{
              padding: '12px 20px',
              background: followUp.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.3)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '14px',
              cursor: followUp.trim() ? 'pointer' : 'default',
            }}>Ask</button>
          </form>
        )}

        {/* Disclaimer */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
          Earni helps you understand — never gives away answers. Your teacher will be proud! 🎓
        </p>
      </div>
    </div>
  )
}
