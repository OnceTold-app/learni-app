'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Pages where we suppress the shared header (they manage their own full-screen UI)
const SUPPRESS_HEADER = ['/session', '/baseline']

export default function ChildHeader() {
  const pathname = usePathname()
  const [childName, setChildName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [totalStars, setTotalStars] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || '')
    setUsername(localStorage.getItem('learni_child_username') || '')
    setAvatarUrl(localStorage.getItem('learni_avatar_url') || '')

    const childId = localStorage.getItem('learni_child_id')
    if (childId) {
      fetch(`/api/kid/stats?childId=${childId}`)
        .then(r => r.json())
        .then(d => setTotalStars(d.totalStars || 0))
        .catch(() => setTotalStars(parseInt(localStorage.getItem('learni_cached_stars') || '0')))
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Suppress on full-screen pages
  const suppress = SUPPRESS_HEADER.some(r => pathname?.startsWith(r))
  if (suppress) return null

  const displayName = username || childName
  const initial = displayName.charAt(0).toUpperCase()

  function handleLogout() {
    localStorage.removeItem('learni_child_id')
    localStorage.removeItem('learni_child_name')
    localStorage.removeItem('learni_child_pin')
    localStorage.removeItem('learni_child_username')
    localStorage.removeItem('learni_year_level')
    localStorage.removeItem('learni_avatar_url')
    localStorage.removeItem('learni_cached_stars')
    window.location.href = '/kid-login'
  }

  const menuItems = [
    { emoji: '🏠', label: 'My Hub', href: '/kid-hub' },
    { emoji: '💪', label: 'Practice a skill', href: '/start-session' },
    { emoji: '🎨', label: 'Change my look', href: '/kid-avatar' },
  ]

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 500,
      height: '52px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(46,196,182,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      {/* Logo */}
      <a href="/kid-hub" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '20px',
          fontWeight: 900,
          color: '#0d2b28',
          letterSpacing: '-0.02em',
        }}>
          learni<span style={{ color: '#2ec4b6' }}>.</span>
        </span>
      </a>

      {/* Right side — stars + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Star count */}
        {totalStars > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.25)',
            borderRadius: '20px',
            padding: '4px 10px',
          }}>
            <span style={{ fontSize: '13px' }}>⭐</span>
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: '13px',
              color: '#b8860b',
            }}>{totalStars}</span>
          </div>
        )}

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                width={34}
                height={34}
                style={{ borderRadius: '50%', display: 'block', border: '2px solid rgba(46,196,182,0.4)' }}
              />
            ) : (
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 900, color: 'white',
                fontFamily: "'Nunito', sans-serif",
                border: '2px solid rgba(46,196,182,0.4)',
              }}>
                {initial || '?'}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              width: '210px',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              zIndex: 600,
            }}>
              {/* Name */}
              <div style={{
                padding: '14px 16px 10px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '14px', color: '#0d2b28' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '12px', color: '#5a8a84', marginTop: '2px' }}>
                  ⭐ {totalStars} stars
                </div>
              </div>

              {/* Nav items */}
              {menuItems.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 16px',
                    fontSize: '14px', fontWeight: 600,
                    fontFamily: "'Nunito', sans-serif",
                    color: '#0d2b28', textDecoration: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{item.emoji}</span>
                  {item.label}
                </a>
              ))}

              {/* Log out */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>👋</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 600, color: '#e53e3e' }}>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
