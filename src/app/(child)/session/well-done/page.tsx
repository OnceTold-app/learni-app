'use client'
import { useEffect, useState } from 'react'

export default function WellDonePage() {
  const [msg, setMsg] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [countdown, setCountdown] = useState(3)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read params from URL
    const params = new URLSearchParams(window.location.search)
    setMsg(params.get('msg') || 'Great session!')
    setEmoji(params.get('emoji') || '⭐')
    setMounted(true)

    // Countdown and redirect
    let count = 3
    const timer = setInterval(() => {
      count--
      setCountdown(count)
      if (count <= 0) {
        clearInterval(timer)
        window.location.href = '/kid-hub'
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Show blank teal loading screen while params parse — prevents error boundary on initial render
  if (!mounted || !msg) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d2b28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(46,196,182,0.2)',
          borderTop: '3px solid #2ec4b6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d2b28',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
      onClick={() => { window.location.href = '/kid-hub' }}
    >
      <div style={{ fontSize: '80px', marginBottom: '32px' }}>{emoji}</div>
      <div style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '22px',
        fontWeight: 900,
        color: 'white',
        marginBottom: '16px',
        maxWidth: '320px',
        lineHeight: 1.4,
      }}>
        {msg}
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '32px' }}>
        Tap anywhere to continue · {countdown}
      </div>
    </div>
  )
}
