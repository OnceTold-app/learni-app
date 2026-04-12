'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      // Store parent info
      localStorage.setItem('learni_parent_token', data.session?.access_token || '')
      localStorage.setItem('learni_parent_name', data.user?.user_metadata?.name || data.user?.user_metadata?.full_name || email.split('@')[0])
      localStorage.setItem('learni_parent_id', data.user?.id || '')

      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '24px',
            fontWeight: 900,
            color: '#0d2b28',
            textDecoration: 'none',
          }}>learni<span style={{ color: '#2ec4b6' }}>.</span></a>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            color: '#0d2b28',
            marginTop: '16px',
            marginBottom: '8px',
          }}>Welcome back</h1>
          <p style={{ color: '#5a8a84', fontSize: '15px' }}>Log in to the Hub</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(13,43,40,0.12)', borderRadius: '12px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(13,43,40,0.12)', borderRadius: '12px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#8abfba' : '#2ec4b6', color: 'white', border: 'none', borderRadius: '30px', fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
            {loading ? 'Logging in...' : 'Log in →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#5a8a84' }}>
          Don&apos;t have an account? <a href="/signup" style={{ color: '#1a9e92', fontWeight: 600 }}>Sign up</a>
        </p>
      </div>
    </div>
  )
}
