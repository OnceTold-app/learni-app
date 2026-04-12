'use client'

import { useState } from 'react'

export default function KidLoginPage() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/kid/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Store child info
      localStorage.setItem('learni_child_id', data.child.id)
      localStorage.setItem('learni_child_name', data.child.name)
      localStorage.setItem('learni_child_username', data.child.username || '')
      localStorage.setItem('learni_year_level', String(data.child.yearLevel))
      localStorage.setItem('learni_session_language', data.child.sessionLanguage || 'en')

      // First time? Go pick a username
      if (!data.child.hasOnboarded) {
        window.location.href = '/kid-welcome'
      } else {
        window.location.href = '/kid-hub'
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d2b28',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '28px',
        padding: '48px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          margin: '0 auto 20px',
          boxShadow: '0 0 0 8px rgba(46,196,182,0.1)',
        }}>🤖</div>

        <h1 style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '28px',
          fontWeight: 900,
          color: 'white',
          marginBottom: '6px',
        }}>Hey! 👋</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '28px' }}>
          Your name or username, and your PIN.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name or username"
            required
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              fontSize: '18px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              color: 'white',
              outline: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />

          <input
            type="text"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="PIN"
            required
            maxLength={4}
            inputMode="numeric"
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              fontSize: '32px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              color: 'white',
              outline: 'none',
              textAlign: 'center',
              letterSpacing: '12px',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ color: '#ff9080', fontSize: '14px', margin: 0, fontWeight: 600 }}>{error}</p>
          )}

          <button type="submit" disabled={loading || pin.length < 4} style={{
            width: '100%',
            padding: '16px',
            background: (loading || pin.length < 4) ? 'rgba(46,196,182,0.3)' : '#2ec4b6',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '18px',
            fontWeight: 900,
            cursor: (loading || pin.length < 4) ? 'not-allowed' : 'pointer',
            marginTop: '4px',
            boxShadow: pin.length >= 4 ? '0 6px 20px rgba(46,196,182,0.3)' : 'none',
          }}>
            {loading ? 'Checking...' : "Let's go! →"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.35)' }}>I&apos;m a parent →</a>
        </p>
      </div>
    </div>
  )
}
