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
  const [listening, setListening] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [followUp, setFollowUp] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
    setYearLevel(localStorage.getItem('learni_year_level') || '5')
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loading])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const compressed = await compressImage(f, 3 * 1024 * 1024)
    setFile(compressed)
    setPreview(URL.createObjectURL(compressed))
    setResponse(null)
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

      // Speak Earni's response then immediately go to session
      // Timeout: if TTS hangs for more than 8s, skip and go straight to session
      if (data.earniSays) {
        let navigated = false
        const fallback = setTimeout(() => {
          if (!navigated) { navigated = true; startHomeworkSessionWith(data) }
        }, 8000)
        try {
          const ttsRes = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.earniSays }),
          })
          if (ttsRes.ok) {
            const blob = await ttsRes.blob()
            const audio = new Audio(URL.createObjectURL(blob))
            audio.onended = () => { clearTimeout(fallback); if (!navigated) { navigated = true; startHomeworkSessionWith(data) } }
            audio.onerror = () => { clearTimeout(fallback); if (!navigated) { navigated = true; startHomeworkSessionWith(data) } }
            await audio.play()
          } else {
            clearTimeout(fallback)
            if (!navigated) { navigated = true; startHomeworkSessionWith(data) }
          }
        } catch {
          clearTimeout(fallback)
          if (!navigated) { navigated = true; startHomeworkSessionWith(data) }
        }
      } else {
        startHomeworkSessionWith(data)
      }
    } catch {
      setResponse({ earniSays: "Something went wrong. Try again or type your question." })
      setLoading(false)
    }
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

  function startHomeworkSessionWith(data: HelpResponse) {
    const rawSubject = data.subject || 'Reading & Writing'
    const helpWith = data.helpWith || ''
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
    // Pass Earni's teaching context so the session starts with continuity
    localStorage.setItem('learni_homework_earni_intro', data.earniSays || '')
    window.location.href = '/session'
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

              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: '10px 0' }}>or speak your question</div>
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

          {/* Loading state — the only thing shown after photo submitted */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤔</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '17px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
                Earni is reading your homework...
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                Getting ready to teach you
              </div>
            </div>
          )}

          {/* Error state only — if something went wrong */}
          {response && !loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>😬</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>
                {response.earniSays}
              </div>
              <button
                onClick={() => { setPreview(null); setFile(null); setResponse(null) }}
                style={{
                  padding: '12px 28px', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                  color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>


    </div>
  )
}
