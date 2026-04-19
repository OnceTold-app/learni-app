'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEmail = identifier.includes('@')
  const isPin = /^\d{1,4}$/.test(secret) && !isEmail

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEmail) {
        // Parent login — email + password
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: secret,
        })
        if (authError) throw authError

        // Clear stale child session data when parent logs in
        const childKeys = [
          'learni_child_id',
          'learni_child_name',
          'learni_child_pin',
          'learni_child_username',
          'learni_year_level',
          'learni_session_language',
          'learni_session_topic',
          'learni_session_mode',
          'learni_subject',
          'learni_baseline_level',
          'learni_baseline_level_name',
          'learni_baseline_strengths',
          'learni_baseline_gaps',
          'learni_cached_stars',
          'learni_last_subject',
          'learni_voice_enabled',
        ]
        childKeys.forEach(k => localStorage.removeItem(k))

        localStorage.setItem('learni_parent_token', data.session?.access_token || '')
        localStorage.setItem('learni_parent_name', data.user?.user_metadata?.name || data.user?.user_metadata?.full_name || identifier.split('@')[0])
        localStorage.setItem('learni_parent_email', identifier)
        localStorage.setItem('learni_parent_id', data.user?.id || '')

        window.location.href = '/dashboard'
      } else {
        // Kid login — name/username + PIN
        const res = await fetch('/api/kid/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: identifier, pin: secret }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Wrong name or PIN')

        localStorage.setItem('learni_child_id', data.child.id)
        localStorage.setItem('learni_child_name', data.child.name)
        localStorage.setItem('learni_child_username', data.child.username || '')
        localStorage.setItem('learni_year_level', String(data.child.yearLevel))
        localStorage.setItem('learni_session_language', data.child.sessionLanguage || 'en')

        if (!data.child.hasOnboarded) {
          window.location.href = '/kid-welcome'
        } else {
          window.location.href = '/kid-hub'
        }
      }
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
        padding: 'clamp(24px, 6vw, 48px)',
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
          }}>Log in</h1>
          <p style={{ color: '#5a8a84', fontSize: '15px' }}>
            {isEmail ? 'Parent account' : identifier ? 'Kid login' : 'Parents use email. Kids use their username.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              {isEmail ? 'Email' : 'Email or username'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Email or kid's username"
              required
              autoCapitalize="none"
              autoCorrect="off"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid rgba(13,43,40,0.12)',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              {isEmail ? 'Password' : isPin ? 'PIN' : 'Password or PIN'}
            </label>
            <input
              type={isEmail ? 'password' : isPin || !identifier ? 'text' : 'password'}
              value={secret}
              onChange={e => {
                if (!isEmail && /^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                  setSecret(e.target.value)
                } else if (isEmail) {
                  setSecret(e.target.value)
                } else {
                  setSecret(e.target.value)
                }
              }}
              placeholder={isEmail ? 'Your password' : 'Password or 4-digit PIN'}
              required
              inputMode={!isEmail ? 'numeric' : undefined}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid rgba(13,43,40,0.12)',
                borderRadius: '12px',
                fontSize: isPin ? '24px' : '15px',
                fontFamily: isPin ? "'Nunito', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontWeight: isPin ? 900 : 400,
                letterSpacing: isPin ? '8px' : 'normal',
                textAlign: isPin ? 'center' : 'left',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#8abfba' : '#2ec4b6',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '16px',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
            }}>
            {loading ? 'Logging in...' : 'Log in →'}
          </button>
        </form>

        {isEmail && (
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
            <a href="/forgot-password" style={{ color: '#8abfba', textDecoration: 'none' }}>Forgot password?</a>
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#5a8a84' }}>
          Don&apos;t have an account? <a href="/signup" style={{ color: '#1a9e92', fontWeight: 600 }}>Sign up</a>
        </p>
      </div>
    </div>
  )
}
