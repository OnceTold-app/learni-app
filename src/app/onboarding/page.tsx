'use client'

import { useState } from 'react'

const YEAR_LEVELS = Array.from({ length: 13 }, (_, i) => i + 1)

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'mi', label: 'Te Reo Māori' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'zh', label: 'Mandarin' },
  { value: 'hi', label: 'Hindi' },
  { value: 'sm', label: 'Samoan' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'other', label: 'Other' },
]

const SESSION_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'mi', label: 'Te Reo Māori' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'zh', label: 'Mandarin' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
]

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [pin, setPin] = useState('')
  const [language, setLanguage] = useState('en')
  const [sessionLanguage, setSessionLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('learni_parent_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const res = await fetch('/api/parent/add-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          age: age ? parseInt(age) : null,
          yearLevel: parseInt(yearLevel),
          pin: pin || '0000',
          language,
          sessionLanguage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add child')
      }

      // Store child info for session
      localStorage.setItem('learni_child_id', data.child.id)
      localStorage.setItem('learni_child_name', data.child.name)
      localStorage.setItem('learni_year_level', String(data.child.year_level))

      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid rgba(13,43,40,0.12)',
    borderRadius: '12px',
    fontSize: '16px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
    background: 'white',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7fafa',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: 'clamp(24px, 6vw, 48px)',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/dashboard" style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '24px',
            fontWeight: 900,
            color: '#0d2b28',
            textDecoration: 'none',
          }}>learni<span style={{ color: '#2ec4b6' }}>.</span></a>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '26px',
            fontWeight: 900,
            color: '#0d2b28',
            marginTop: '16px',
            marginBottom: '8px',
          }}>Add your child</h1>
          <p style={{ color: '#5a8a84', fontSize: '15px' }}>
            Earni will personalise everything for them.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              Child&apos;s first name
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lia" required style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
                Age
              </label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 9" min="4" max="18" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
                Year level *
              </label>
              <select value={yearLevel} onChange={e => setYearLevel(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select</option>
                {YEAR_LEVELS.map(y => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              Language spoken at home
            </label>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              Earni should teach in
            </label>
            <select value={sessionLanguage} onChange={e => setSessionLanguage(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {SESSION_LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#8abfba', marginTop: '4px' }}>Earni adapts naturally — if your child mixes languages, Earni keeps up.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              4-digit PIN <span style={{ color: '#8abfba', fontWeight: 400 }}>(for child login)</span>
            </label>
            <input type="text" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" maxLength={4} pattern="[0-9]{4}" inputMode="numeric" style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '24px', fontFamily: "'Nunito', sans-serif", fontWeight: 900 }} />
          </div>

          {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            width: '100%',
            padding: '16px',
            background: loading ? '#8abfba' : '#2ec4b6',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '17px',
            fontWeight: 900,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '4px',
            boxShadow: '0 6px 20px rgba(46,196,182,0.3)',
          }}>
            {loading ? 'Adding...' : 'Add child & go to Hub →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#8abfba' }}>
          You can add up to 4 children. Extra children are +$19/month each.
        </p>
      </div>
    </div>
  )
}
