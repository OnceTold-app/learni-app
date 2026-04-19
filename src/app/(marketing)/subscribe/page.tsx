'use client'

import { useState, useEffect } from 'react'
import { track } from '@/lib/posthog'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [childCount, setChildCount] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEmail(localStorage.getItem('learni_parent_email') || '')
  }, [])

  const monthlyPrice = 49 + (childCount - 1) * 19

  async function handleCheckout() {
    setLoading(true)
    track('checkout_clicked', { child_count: childCount, monthly_price: monthlyPrice })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, childCount }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed')
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7fafa',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', textDecoration: 'none' }}>
            learni<span style={{ color: '#2ec4b6' }}>.</span>
          </a>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 900, color: '#0d2b28', marginTop: '16px', marginBottom: '4px' }}>
            Start your subscription
          </h1>
          <p style={{ color: '#5a8a84', fontSize: '14px' }}>7-day free trial · Cancel anytime</p>
        </div>

        {/* Child count */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '8px' }}>
            How many children?
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setChildCount(n)} style={{
                flex: 1, padding: '12px',
                background: childCount === n ? '#0d2b28' : 'white',
                color: childCount === n ? 'white' : '#0d2b28',
                border: childCount === n ? 'none' : '1.5px solid rgba(13,43,40,0.1)',
                borderRadius: '12px', fontSize: '18px', fontWeight: 900,
                fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div style={{
          background: '#f7fafa', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', color: '#5a8a84' }}>Learni Standard (1 child)</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0d2b28' }}>$49/mo</span>
          </div>
          {childCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', color: '#5a8a84' }}>+{childCount - 1} extra {childCount - 1 === 1 ? 'child' : 'children'}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0d2b28' }}>+${(childCount - 1) * 19}/mo</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0d2b28' }}>Total</span>
            <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#2ec4b6' }}>${monthlyPrice}/mo</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8abfba', marginTop: '6px', textAlign: 'center' }}>
            First 7 days free · Then ${monthlyPrice} NZD/month
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0d2b28', marginBottom: '6px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            style={{
              width: '100%', padding: '12px 16px', border: '1.5px solid rgba(13,43,40,0.12)',
              borderRadius: '12px', fontSize: '15px', fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }} />
        </div>

        <button onClick={handleCheckout} disabled={loading || !email}
          style={{
            width: '100%', padding: '16px',
            background: loading || !email ? '#8abfba' : '#2ec4b6',
            color: 'white', border: 'none', borderRadius: '30px',
            fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900,
            cursor: loading || !email ? 'not-allowed' : 'pointer',
          }}>
          {loading ? 'Redirecting to checkout...' : 'Start 7-day free trial →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#8abfba' }}>
          Have a promo code? You can enter it at checkout.
        </p>
      </div>
    </div>
  )
}
