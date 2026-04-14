'use client'

import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#0d2b28',
        borderTop: '1px solid rgba(46, 196, 182, 0.25)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        zIndex: 9999,
        flexWrap: 'wrap',
      }}
    >
      <p
        style={{
          color: '#a8d5d1',
          fontSize: '13px',
          margin: 0,
          maxWidth: '600px',
          lineHeight: 1.5,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        We use cookies to improve your experience.{' '}
        <a href="/privacy" style={{ color: '#2ec4b6', textDecoration: 'underline' }}>
          Privacy Policy
        </a>
      </p>
      <button
        onClick={accept}
        style={{
          background: '#2ec4b6',
          color: '#0d2b28',
          border: 'none',
          borderRadius: '50px',
          padding: '8px 20px',
          fontSize: '13px',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Accept
      </button>
    </div>
  )
}
