'use client'

import { useState, useEffect } from 'react'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Mandarin' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
]

export default function ManageChildPage() {
  const [childId, setChildId] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [sessionLanguage, setSessionLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showRemove, setShowRemove] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (!id) { window.location.href = '/dashboard'; return }
    setChildId(id)
    fetchChild(id)
  }, [])

  async function fetchChild(id: string) {
    const token = localStorage.getItem('learni_parent_token')
    const res = await fetch('/api/parent/children', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    const child = (data.children || []).find((c: { id: string }) => c.id === id)
    if (child) {
      setName(child.name)
      setUsername(child.username || '')
      setYearLevel(String(child.year_level))
      setSessionLanguage(child.session_language || 'en')
    }
  }

  async function handleSaveAll() {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/parent/update-child', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}`,
        },
        body: JSON.stringify({
          childId,
          name,
          username,
          ...(pin ? { pin } : {}),
          yearLevel: parseInt(yearLevel),
          session_language: sessionLanguage,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('✓ Saved!')
      setIsDirty(false)
      setTimeout(() => setMessage(''), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${name}? This will delete all their sessions, stars, and data. This cannot be undone.`)) return

    try {
      const res = await fetch('/api/parent/remove-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}`,
        },
        body: JSON.stringify({ childId }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      window.location.href = '/dashboard'
    } catch {
      setError('Failed to remove child')
    }
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    border: '1.5px solid rgba(13,43,40,0.12)',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
    width: '100%',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7fafa',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px' }}>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#5a8a84', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>← Back to Hub</a>

        <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px' }}>
          Manage {name || 'child'}
        </h1>
        <p style={{ color: '#5a8a84', fontSize: '14px', marginBottom: '28px' }}>
          Change login details, year level, or remove this child.
        </p>

        {message && <div style={{ background: '#e6f9f7', color: '#1a9e92', padding: '10px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>{message}</div>}
        {error && <div style={{ background: '#fff5f5', color: '#e53e3e', padding: '10px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5a8a84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setIsDirty(true) }}
              style={inputStyle}
            />
          </div>

          {/* Username */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5a8a84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Username</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#2ec4b6', fontWeight: 800, fontSize: '16px' }}>@</span>
              <input
                value={username}
                onChange={e => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 20)); setIsDirty(true) }}
                placeholder="not set yet"
                style={inputStyle}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#8abfba', marginTop: '6px' }}>Your child uses this to log in. Letters, numbers, dashes only.</p>
          </div>

          {/* PIN */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5a8a84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PIN</label>
            <input
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setIsDirty(true) }}
              placeholder="Enter new 4-digit PIN"
              maxLength={4}
              inputMode="numeric"
              style={{ ...inputStyle, letterSpacing: '6px', textAlign: 'center', fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '20px' }}
            />
            <p style={{ fontSize: '11px', color: '#8abfba', marginTop: '6px' }}>Leave blank to keep existing PIN unchanged.</p>
          </div>

          {/* Year level */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5a8a84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Year level</label>
            <select
              value={yearLevel}
              onChange={e => { setYearLevel(e.target.value); setIsDirty(true) }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {Array.from({ length: 13 }, (_, i) => i + 1).map(y => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>

          {/* Teaching language */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#5a8a84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Teaching language</label>
            <p style={{ fontSize: '11px', color: '#8abfba', marginTop: '-4px', marginBottom: '8px' }}>What language Earni teaches in</p>
            <select
              value={sessionLanguage}
              onChange={e => { setSessionLanguage(e.target.value); setIsDirty(true) }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          {/* Single Save Changes button */}
          <button
            onClick={handleSaveAll}
            disabled={!isDirty || loading}
            style={{
              width: '100%',
              padding: '16px',
              background: !isDirty ? '#c8e6e4' : '#2ec4b6',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '16px',
              fontWeight: 900,
              cursor: !isDirty ? 'default' : 'pointer',
              transition: 'background 0.15s',
              boxShadow: isDirty ? '0 4px 16px rgba(46,196,182,0.25)' : 'none',
            }}
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>

          {/* Remove child */}
          <div style={{ marginTop: '12px' }}>
            {!showRemove ? (
              <button onClick={() => setShowRemove(true)} style={{ background: 'none', border: 'none', color: '#e53e3e', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', opacity: 0.6 }}>
                Remove this child...
              </button>
            ) : (
              <div style={{ background: '#fff5f5', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(229,62,62,0.15)' }}>
                <p style={{ fontSize: '14px', color: '#e53e3e', fontWeight: 600, marginBottom: '12px' }}>
                  This will permanently delete {name}&apos;s sessions, stars, and all data. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleRemove} style={{
                    padding: '12px 20px',
                    background: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>Yes, remove {name}</button>
                  <button onClick={() => setShowRemove(false)} style={{
                    padding: '12px 20px',
                    background: '#f7fafa',
                    color: '#0d2b28',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
