'use client'

import { useState, useEffect } from 'react'

export default function KidWelcomePage() {
  const [childName, setChildName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('learni_child_name') || ''
    setChildName(name)
    // Suggest a username based on their name
    setUsername(name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const childId = localStorage.getItem('learni_child_id')
      const res = await fetch('/api/kid/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, username }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      localStorage.setItem('learni_child_username', data.username)
      window.location.href = '/kid-avatar'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Try another username')
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
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          margin: '0 auto 24px',
          boxShadow: '0 0 0 8px rgba(46,196,182,0.1), 0 0 0 16px rgba(46,196,182,0.05)',
        }}>🤖</div>

        <h1 style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '32px',
          fontWeight: 900,
          color: 'white',
          marginBottom: '8px',
        }}>Hey {childName}! 🎉</h1>

        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '16px',
          marginBottom: '8px',
          lineHeight: 1.5,
        }}>
          I&apos;m Earni — your study buddy.
        </p>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '15px',
          marginBottom: '32px',
        }}>
          First things first — pick a username. This is yours.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: '#2ec4b6',
              fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
            }}>@</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20))}
              placeholder="your-username"
              required
              minLength={2}
              maxLength={20}
              style={{
                width: '100%',
                padding: '18px 18px 18px 40px',
                background: 'rgba(255,255,255,0.07)',
                border: '2px solid rgba(46,196,182,0.3)',
                borderRadius: '16px',
                fontSize: '22px',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            Letters, numbers, dashes, and underscores only. 2-20 characters.
          </p>

          {error && (
            <p style={{ color: '#ff9080', fontSize: '14px', margin: 0, fontWeight: 600 }}>{error}</p>
          )}

          <button type="submit" disabled={loading || username.length < 2} style={{
            width: '100%',
            padding: '18px',
            background: (loading || username.length < 2) ? 'rgba(46,196,182,0.3)' : '#2ec4b6',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '20px',
            fontWeight: 900,
            cursor: (loading || username.length < 2) ? 'not-allowed' : 'pointer',
            marginTop: '8px',
            boxShadow: username.length >= 2 ? '0 8px 24px rgba(46,196,182,0.35)' : 'none',
          }}>
            {loading ? 'Saving...' : "That's me — let's learn! 🚀"}
          </button>
        </form>
      </div>
    </div>
  )
}
