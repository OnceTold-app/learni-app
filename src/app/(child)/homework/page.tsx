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
  _debug?: string
}

export default function HomeworkPage() {
  const [childName, setChildName] = useState('Student')
  const [yearLevel, setYearLevel] = useState('5')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [response, setResponse] = useState<HelpResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: string; text: string }>>([])
  const [listening, setListening] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
    setYearLevel(localStorage.getItem('learni_year_level') || '5')
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, loading])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressImage(f, 3 * 1024 * 1024)
    setFile(compressed)
    setPreview(URL.createObjectURL(compressed))
    setResponse(null)
    setConversation([])
  }

  async function compressImage(file: File, maxBytes: number): Promise<File> {
    if (file.size <= maxBytes) return file
    return new Promise((resolve) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        const maxDim = 1600
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
          else { width = Math.round(width * maxDim / height); height = maxDim }
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
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
    try {
      const formData = new FormData()
      if (file && !question) formData.append('image', file)
      formData.append('childName', childName)
      formData.append('yearLevel', yearLevel)
      if (question) formData.append('question', question)

      const res = await fetch('/api/homework', { method: 'POST', body: formData })
      const text = await res.text()
      let data: HelpResponse
      try { data = JSON.parse(text) }
      catch { data = { earniSays: "Something went wrong. Try again or type your question." } }

      setResponse(data)
      setConversation(prev => [
        ...prev,
        ...(question ? [{ role: 'kid', text: question }] : []),
        { role: 'earni', text: data.earniSays || 'Let me take a look...' },
      ])

      // Speak Earni's response
      if (data.earniSays) {
        try {
          const ttsRes = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.earniSays }),
          })
          if (ttsRes.ok) {
            const blob = await ttsRes.blob()
            await new Audio(URL.createObjectURL(blob)).play()
          }
        } catch { /* silent */ }
      }
    } catch {
      setResponse({ earniSays: "Something went wrong. Try again or type your question." })
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
      if (transcript) handleSubmit(transcript)
    }
    recognition.start()
  }

  function startHomeworkSession() {
    const rawSubject = response?.subject || 'Reading & Writing'
    const helpWith = response?.helpWith || ''
    const subjectMap: Record<string, string> = {
      'maths': 'Maths', 'math': 'Maths', 'mathematics': 'Maths',
      'reading': 'Reading & Writing', 'writing': 'Reading & Writing',
      'reading & writing': 'Reading & Writing', 'english': 'Reading & Writing',
      'science': 'Reading & Writing', 'history': 'Reading & Writing',
      'geography': 'Reading & Writing', 'social studies': 'Reading & Writing',
    }
    const cleanSubject = subjectMap[rawSubject.toLowerCase()] || 'Reading & Writing'
    localStorage.setItem('learni_subject', cleanSubject)
    localStorage.setItem('learni_topic', helpWith || rawSubject)
    localStorage.setItem('learni_session_mode', 'learn')
    localStorage.setItem('learni_homework_context', helpWith || rawSubject)
    window.location.href = '/start-session'
  }

  const hasResponse = response && !loading

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28, #143330)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '76px 20px 20px' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>

          {/* Back link */}
          <a href="/kid-hub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Hub</a>

          {/* Header — only show before response */}
          {!response && (
            <div style={{ textAlign: 'center', margin: '24px 0 28px' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>📸</div>
              <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 900, color: 'white', margin: '0 0 6px' }}>
                Homework Helper
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
                Photo or type — Earni explains without giving answers
              </p>
            </div>
          )}

          {/* Upload zone — only show before any response */}
          {!response && !preview && (
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '40px 20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px dashed rgba(255,255,255,0.12)',
                  borderRadius: '20px', cursor: 'pointer', textAlign: 'center',
                  marginBottom: '10px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 800, color: '#2ec4b6' }}>
                  Take a photo or upload
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                  Snap your worksheet or exercise book
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" onChange={handleFileChange} style={{ display: 'none' }} />

              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: '10px 0' }}>or type your question</div>

              <form onSubmit={(e) => { e.preventDefault(); handleFollowUp() }}>
                <input
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  placeholder="What are you stuck on?"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', fontSize: '15px',
                    color: 'white', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </form>
            </div>
          )}

          {/* Photo preview — compact, dismissable after response */}
          {preview && !response && (
            <div style={{ marginBottom: '16px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Homework" style={{
                width: '100%', borderRadius: '14px',
                maxHeight: '260px', objectFit: 'contain',
                background: 'rgba(0,0,0,0.2)',
              }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => handleSubmit()}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                    color: 'white', border: 'none', borderRadius: '24px',
                    fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Ask Earni →
                </button>
                <button
                  onClick={() => { setPreview(null); setFile(null) }}
                  style={{
                    padding: '14px 16px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px', color: 'rgba(255,255,255,0.35)',
                    fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Retake
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🤔</div>
              <div style={{ fontSize: '14px' }}>Reading your homework...</div>
            </div>
          )}

          {/* Conversation */}
          {conversation.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'kid' ? 'flex-end' : 'flex-start',
              gap: '8px', marginBottom: '12px',
              alignItems: 'flex-end',
            }}>
              {msg.role === 'earni' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px',
                }}>🤖</div>
              )}
              <div style={{
                background: msg.role === 'kid' ? 'rgba(46,196,182,0.15)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${msg.role === 'kid' ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: msg.role === 'kid' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '12px 16px',
                maxWidth: '82%',
                fontSize: '14px', lineHeight: 1.6,
                color: 'rgba(255,255,255,0.9)',
                fontFamily: "'Nunito', sans-serif", fontWeight: 600,
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Practice questions — simple tappable list, only show once */}
          {hasResponse && response.practiceQuestions && response.practiceQuestions.length > 0 && conversation.length <= 2 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', paddingLeft: '4px' }}>
                Try these yourself
              </div>
              {response.practiceQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(`Help me with: ${q}`)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 14px', marginBottom: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px', cursor: 'pointer',
                    fontSize: '13px', color: 'rgba(255,255,255,0.7)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Primary CTA — Work through with Earni */}
          {hasResponse && (
            <button
              onClick={startHomeworkSession}
              style={{
                width: '100%', padding: '16px',
                background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                color: 'white', border: 'none', borderRadius: '28px',
                fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900,
                cursor: 'pointer', marginBottom: '10px',
                boxShadow: '0 6px 24px rgba(46,196,182,0.25)',
              }}
            >
              Work through this with Earni →
            </button>
          )}

          {/* New photo link — subtle */}
          {hasResponse && (
            <button
              onClick={() => { setPreview(null); setFile(null); setResponse(null); setConversation([]) }}
              style={{
                display: 'block', width: '100%', padding: '10px',
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.25)', fontSize: '13px',
                cursor: 'pointer', marginBottom: '8px',
              }}
            >
              Try a different photo
            </button>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Sticky input bar — only after response */}
      {hasResponse && (
        <div style={{
          padding: '12px 20px 28px',
          background: 'rgba(13,43,40,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', gap: '8px' }}>
            <button
              onClick={startListening}
              disabled={listening}
              style={{
                padding: '0 14px', height: '46px',
                background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                border: listening ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', cursor: listening ? 'default' : 'pointer', fontSize: '18px',
              }}
            >{listening ? '🎤' : '🎙️'}</button>
            <input
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFollowUp()}
              placeholder="Ask Earni anything..."
              style={{
                flex: 1, height: '46px', padding: '0 14px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', fontSize: '14px', color: 'white',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleFollowUp}
              disabled={!followUp.trim()}
              style={{
                padding: '0 18px', height: '46px',
                background: followUp.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.2)',
                color: 'white', border: 'none', borderRadius: '14px',
                fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '14px',
                cursor: followUp.trim() ? 'pointer' : 'default',
              }}
            >Ask</button>
          </div>
        </div>
      )}
    </div>
  )
}
