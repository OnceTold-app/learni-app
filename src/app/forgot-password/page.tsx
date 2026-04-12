'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
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

        {sent ? (
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '8px' }}>Check your email</h1>
            <p style={{ color: '#5a8a84', fontSize: '15px', lineHeight: '1.6' }}>
              We sent a reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
            </p>
            <p style={{ marginTop: '20px', fontSize: '13px', color: '#8abfba' }}>
              Didn&apos;t get it? Check your spam folder.
            </p>
            <a href="/login" style={{
              display: 'inline-block',
              marginTop: '20px',
              color: '#1a9e92',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}>← Back to login</a>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginTop: '20px', marginBottom: '8px' }}>Reset password</h1>
            <p style={{ color: '#5a8a84', fontSize: '15px', marginBottom: '24px' }}>Enter your email and we&apos;ll send a reset link.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(13,43,40,0.12)', borderRadius: '12px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', background: loading ? '#8abfba' : '#2ec4b6', color: 'white', border: 'none', borderRadius: '30px', fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending...' : 'Send reset link →'}
              </button>
            </form>

            <p style={{ marginTop: '20px', fontSize: '13px', color: '#5a8a84' }}>
              <a href="/login" style={{ color: '#1a9e92', fontWeight: 600, textDecoration: 'none' }}>← Back to login</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
