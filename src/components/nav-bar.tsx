'use client'

import { useEffect, useState, useRef } from 'react'

export default function NavBar() {
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const name = localStorage.getItem('learni_parent_name')
    const email = localStorage.getItem('learni_parent_email') || ''
    if (name) {
      setParentName(name)
      setParentEmail(email)
      setIsLoggedIn(true)
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSignOut() {
    localStorage.removeItem('learni_parent_token')
    localStorage.removeItem('learni_parent_name')
    localStorage.removeItem('learni_parent_email')
    localStorage.removeItem('learni_parent_id')
    localStorage.removeItem('learni_child_id')
    localStorage.removeItem('learni_child_name')
    localStorage.removeItem('learni_child_username')
    localStorage.removeItem('learni_year_level')
    localStorage.removeItem('learni_session_language')
    window.location.href = '/'
  }

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
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '10px',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'white',
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  {parentName.charAt(0).toUpperCase()}
                </span>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '260px',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {/* Profile header */}
                  <div style={{
                    padding: '18px 20px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 800,
                        color: 'white',
                        fontFamily: "'Nunito', sans-serif",
                      }}>
                        {parentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '14px', color: '#0d2b28' }}>{parentName}</div>
                        {parentEmail && <div style={{ fontSize: '12px', color: '#5a8a84', marginTop: '1px' }}>{parentEmail}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '6px 0' }}>
                    <a href="/dashboard" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                      <span style={menuIconStyle}>🏠</span>
                      The Hub
                    </a>
                    <a href="/onboarding" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                      <span style={menuIconStyle}>👶</span>
                      Add a child
                    </a>
                    <a href="/kid-login" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                      <span style={menuIconStyle}>🎮</span>
                      Kid login
                    </a>
                  </div>

                  {/* Sign out */}
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '6px 0' }}>
                    <button onClick={handleSignOut} style={{
                      ...menuItemStyle,
                      width: '100%',
                      border: 'none',
                      background: 'none',
                      color: '#e53e3e',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      <span style={menuIconStyle}>👋</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/login" style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#5a8a84',
                textDecoration: 'none',
              }}>Log in</a>
              <a href="/signup" style={{
                background: '#0d2b28',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}>Try free →</a>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#0d2b28',
  textDecoration: 'none',
  transition: 'background 0.1s',
}

const menuIconStyle: React.CSSProperties = {
  fontSize: '16px',
  width: '20px',
  textAlign: 'center',
}
