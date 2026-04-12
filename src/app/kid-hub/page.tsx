'use client'

import { useState, useEffect } from 'react'

interface SessionData {
  id: string
  created_at: string
  stars_earned: number
  subject: string
  duration_seconds: number
}

export default function KidHubPage() {
  const [childName, setChildName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [totalStars, setTotalStars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('learni_child_id')
    const name = localStorage.getItem('learni_child_name')
    const uname = localStorage.getItem('learni_child_username')
    if (!id || !name) { window.location.href = '/login'; return }
    setChildName(name)
    setUsername(uname || '')
    setAvatarUrl(localStorage.getItem('learni_avatar_url') || '')
    fetchData(id)
  }, [])

  async function fetchData(childId: string) {
    try {
      const res = await fetch(`/api/kid/stats?childId=${childId}`)
      if (res.ok) {
        const data = await res.json()
        setTotalStars(data.totalStars || 0)
        setStreak(data.streak || 0)
        setSessions(data.sessions || [])
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  const displayName = username || childName

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d2b28' }}>
        <div style={{ color: 'white', fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 900 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28 0%, #143330 50%, #1a3d39 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
      paddingBottom: '120px',
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '20px' }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              width={120}
              height={120}
              style={{
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                margin: '0 auto 16px',
                display: 'block',
                boxShadow: '0 0 0 6px rgba(46,196,182,0.15)',
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 900,
              color: 'white',
              fontFamily: "'Nunito', sans-serif",
              margin: '0 auto 16px',
              boxShadow: '0 0 0 6px rgba(46,196,182,0.15)',
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            color: 'white',
            marginBottom: '4px',
          }}>Hey {displayName}! 👋</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Ready to learn and earn?</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            <a href="/kid-welcome" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>✏️ Username</a>
            <a href="/kid-avatar" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>🎨 My look</a>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#f5a623' }}>⭐ {totalStars}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: 600 }}>Stars</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#2ec4b6' }}>🔥 {streak}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: 600 }}>Streak</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#a78bfa' }}>📚 {sessions.length}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: 600 }}>Sessions</div>
          </div>
        </div>

        {/* Start session button */}
        <a
          href="/session"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
            color: 'white',
            padding: '20px',
            borderRadius: '20px',
            textAlign: 'center',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '20px',
            fontWeight: 900,
            textDecoration: 'none',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
          }}
        >
          Start learning with Earni →
        </a>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Recent sessions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.slice(0, 5).map(s => {
                const date = new Date(s.created_at)
                const mins = Math.round((s.duration_seconds || 0) / 60)
                return (
                  <div key={s.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                        {s.subject || 'Session'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                        {date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} · {mins} min
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f5a623', fontFamily: "'Nunito', sans-serif" }}>
                      +{s.stars_earned} ⭐
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => {
            localStorage.removeItem('learni_child_id')
            localStorage.removeItem('learni_child_name')
            localStorage.removeItem('learni_child_username')
            localStorage.removeItem('learni_year_level')
            localStorage.removeItem('learni_session_language')
            window.location.href = '/login'
          }}
          style={{
            display: 'block',
            margin: '32px auto 0',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Switch user
        </button>
      </div>
    </div>
  )
}
