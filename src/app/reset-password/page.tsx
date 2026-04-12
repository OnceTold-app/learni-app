'use client'

import { useState, useEffect } from 'react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Supabase sends the access token in the URL hash
    // The client library picks it up automatically
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords don\'t match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
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
      background: '#f7fafa',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
        <a href="/" style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '24px',
          fontWeight: 900,
          color: '#0d2b28',
          textDecoration: 'none',
        }}>learni<span style={{ color: '#2ec4b6' }}>.</span></a>

        {done ? (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '8px' }}>Password updated</h1>
            <p style={{ color: '#5a8a84', fontSize: '15px' }}>You&apos;re all set. Log in with your new password.</p>
            <a href="/login" style={{
              display: 'inline-block',
              marginTop: '20px',
              background: '#2ec4b6',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '30px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '16px',
              fontWeight: 900,
              textDecoration: 'none',
            }}>Log in →</a>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginTop: '20px', marginBottom: '8px' }}>New password</h1>
            <p style={{ color: '#5a8a84', fontSize: '15px', marginBottom: '24px' }}>Choose a new password for your account.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(13,43,40,0.12)', borderRadius: '12px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Type it again" required
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(13,43,40,0.12)', borderRadius: '12px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', background: loading ? '#8abfba' : '#2ec4b6', color: 'white', border: 'none', borderRadius: '30px', fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving...' : 'Set new password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
