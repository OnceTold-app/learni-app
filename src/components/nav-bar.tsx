'use client'

import { useEffect, useState } from 'react'

export default function NavBar() {
  const [parentName, setParentName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem('learni_parent_name')
    if (name) {
      setParentName(name)
      setIsLoggedIn(true)
    }
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 900,
      height: '52px',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(46,196,182,0.12)',
    }}>
      <div style={{
        maxWidth: '980px',
        margin: '0 auto',
        height: '100%',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '20px',
          fontWeight: 900,
          color: '#0d2b28',
          textDecoration: 'none',
          letterSpacing: '-0.3px',
        }}>
          learni<span style={{ color: '#2ec4b6' }}>.</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLoggedIn ? (
            <a href="/dashboard" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: '#0d2b28',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              <span style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(46,196,182,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                color: '#1a9e92',
              }}>
                {parentName.charAt(0).toUpperCase()}
              </span>
              The Hub
            </a>
          ) : (
            <>
              <a href="/login" style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#5a8a84',
                textDecoration: 'none',
              }}>Hub login</a>
              <a href="/signup" style={{
                background: '#0d2b28',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}>Start free</a>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
