'use client'

import { useState, useEffect, useRef } from 'react'

interface HelpResponse {
  earniSays: string
  questionsFound?: string[]
  subject?: string
  helpWith?: string
  hint?: string
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

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
    setYearLevel(localStorage.getItem('learni_year_level') || '5')
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResponse(null)
    setConversation([])
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
      const data = await res.json()

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
    } catch {
      setResponse({ earniSays: "Hmm, I couldn't read that. Can you take a clearer photo or type the question?" })
    }
    setLoading(false)
  }

  function handleFollowUp() {
    if (!followUp.trim()) return
    const q = followUp.trim()
    setFollowUp('')
    handleSubmit(q)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28, #143330)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
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
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', margin: '12px 0' }}>or</div>

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

        {/* Follow-up input */}
        {response && !loading && (
          <form onSubmit={(e) => { e.preventDefault(); handleFollowUp() }} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              placeholder="Ask Earni anything about this..."
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
