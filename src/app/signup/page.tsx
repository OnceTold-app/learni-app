'use client'

import { useState, useEffect } from 'react'
import { track, identify } from '@/lib/posthog'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')

  useEffect(() => {
    // Capture referral code from URL (?ref=XXXXXX)
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) sessionStorage.setItem('learni_referral_code', ref)
    track('viewed_signup')
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoadingPhase('Setting up your account...')
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

      // Create account record
      if (authData.user) {
        const isTester = couponCode.trim().toLowerCase() === 'testi'
        const trialDays = 7
        const trialEnd = new Date()
        trialEnd.setDate(trialEnd.getDate() + trialDays)

        // Generate unique 6-char referral code
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()

        // Check for referral code in session storage
        const referredBy = sessionStorage.getItem('learni_referral_code') || null

        const { error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: authData.user.id,
            email,
            full_name: name,
            plan: 'trial',
            subscription_status: 'trialing',
            trial_ends_at: trialEnd.toISOString(),
            referral_code: referralCode,
            referred_by: referredBy,
            referral_free_month: false,
          })

        if (accountError && !accountError.message.includes('duplicate')) {
          console.error('Account creation error:', accountError)
        }

        // If referred by someone, track via API
        if (referredBy) {
          try {
            await fetch('/api/referral/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referral_code: referredBy, new_user_email: email }),
            })
          } catch { /* non-fatal */ }
        }
      }

      // Auto-login: store session so they go straight to dashboard
      if (authData.session) {
        localStorage.setItem('learni_parent_token', authData.session.access_token)
        localStorage.setItem('learni_parent_name', name)
        localStorage.setItem('learni_parent_email', email)
        localStorage.setItem('learni_parent_id', authData.user?.id || '')
      }

      // PostHog: identify and track signup
      if (authData.user) {
        identify(authData.user.id, { email, name, plan: 'trial' })
        track('signed_up', { method: 'email', plan: 'trial' })
        // Track referral if present
        const ref = sessionStorage.getItem('learni_referral_code')
        if (ref) track('signed_up_with_referral', { referral_code: ref })
      }

      // Send welcome email (fire and forget — don't block signup)
      try {
        await fetch('/api/auth/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        })
      } catch (emailErr) {
        console.warn('Welcome email failed (non-fatal):', emailErr)
      }

      // Testi code = skip Stripe, go straight to dashboard
      const isTester = couponCode.trim().toLowerCase() === 'testi'
      if (isTester) {
        setLoadingPhase('All set! Taking you in...')
        window.location.href = '/dashboard'
      } else {
        // Redirect to Stripe Checkout
        setLoadingPhase('Redirecting to payment...')
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, childCount: 1 }),
        })
        const checkoutData = await checkoutRes.json()
        if (checkoutData.url) {
          window.location.href = checkoutData.url
        } else {
          throw new Error(checkoutData.error || 'Failed to create checkout session')
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setLoading(false)
      setLoadingPhase('')
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
          }}>Create your account</h1>
          <p style={{ color: '#5a8a84', fontSize: '15px' }}>
            Free to start. Set up takes 30 seconds.
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              Your name (parent / guardian)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah (your name, not your child's)"
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

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>
              Access code <span style={{ fontWeight: 400, color: '#8abfba' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              placeholder="Enter code if you have one"
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
            {loading ? loadingPhase : 'Start free →'}
          </button>

          {couponCode.trim().toLowerCase() !== 'testi' && (
            <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: '12px', color: '#8abfba' }}>
              No charge today — $49/month starts after your 7-day trial. Cancel any time.
            </p>
          )}
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
