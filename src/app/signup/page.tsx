'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (authError) throw authError

      // Create account record with 14-day trial
      if (authData.user) {
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + 14)

        const { error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: authData.user.id,
            email,
            full_name: name,
            plan: 'trial',
            subscription_status: 'trialing',
            trial_ends_at: trialEnd.toISOString(),
          })

        if (accountError && !accountError.message.includes('duplicate')) {
          console.error('Account creation error:', accountError)
        }
      }

      // Auto-login: store session so they go straight to dashboard
      if (authData.session) {
        localStorage.setItem('learni_parent_token', authData.session.access_token)
        localStorage.setItem('learni_parent_name', name)
        localStorage.setItem('learni_parent_id', authData.user?.id || '')
      }

      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            color: '#0d2b28',
            marginBottom: '12px',
          }}>You&apos;re in!</h1>
          <p style={{ color: '#5a8a84', fontSize: '16px', lineHeight: 1.6, marginBottom: '24px' }}>
            Your 14-day free trial has started. Let&apos;s add your child.
          </p>
          <a href="/onboarding" style={{
            display: 'inline-block',
            background: '#2ec4b6',
            color: 'white',
            padding: '14px 28px',
            borderRadius: '30px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '16px',
            textDecoration: 'none',
          }}>Add your child →</a>
        </div>
      </div>
    )
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
          }}>Create your account</h1>
          <p style={{ color: '#5a8a84', fontSize: '15px' }}>
            Free to start. Set up takes 30 seconds.
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah"
              required
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
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
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
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

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '14px', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
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
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Creating account...' : 'Start free →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#5a8a84' }}>
          Already have an account? <a href="/login" style={{ color: '#1a9e92', fontWeight: 600 }}>Log in</a>
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#8abfba' }}>
          By signing up you agree to our <a href="/privacy" style={{ color: '#8abfba', textDecoration: 'underline' }}>Privacy Policy</a> and <a href="/terms" style={{ color: '#8abfba', textDecoration: 'underline' }}>Terms</a>
        </p>
      </div>
    </div>
  )
}
