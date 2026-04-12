'use client'

import { useState, useEffect } from 'react'

interface Child {
  id: string
  name: string
  year_level: number
  total_stars: number
  streak_days: number
  last_session: string | null
}

interface SessionSummary {
  id: string
  created_at: string
  duration_secs: number
  stars_earned: number
  subjects_covered: string[]
  correct_count: number
  total_questions: number
}

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [parentName, setParentName] = useState('')

  useEffect(() => {
    // Check auth
    const name = localStorage.getItem('learni_parent_name')
    if (!name) {
      window.location.href = '/login'
      return
    }
    setParentName(name)

    // Fetch children
    fetchChildren()
  }, [])

  async function fetchChildren() {
    try {
      const res = await fetch('/api/parent/children', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
      })
      const data = await res.json()
      setChildren(data.children || [])
      if (data.children?.length > 0) {
        setSelectedChild(data.children[0].id)
      }
    } catch { /* */ }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedChild) {
      fetchSessions(selectedChild)
    }
  }, [selectedChild])

  async function fetchSessions(childId: string) {
    try {
      const res = await fetch(`/api/parent/sessions?childId=${childId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
      })
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch { /* */ }
  }

  const child = children.find(c => c.id === selectedChild)
  const totalStars = child?.total_stars || 0
  const starRate = 20 // 20 stars = $1 (configurable later)
  const dollarsOwed = (totalStars / starRate).toFixed(2)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7fafa',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#0d2b28',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <a href="/" style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '20px',
            fontWeight: 900,
            color: 'white',
            textDecoration: 'none',
          }}>learni<span style={{ color: '#2ec4b6' }}>.</span></a>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginLeft: '12px' }}>The Hub</span>
        </div>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(46,196,182,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#2ec4b6' }}>{parentName.charAt(0).toUpperCase()}</span>
          {parentName}
        </a>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#5a8a84', padding: '48px 0' }}>Loading...</p>
        ) : children.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d2b28', marginBottom: '8px' }}>
              Welcome to the Hub
            </h2>
            <p style={{ color: '#5a8a84', marginBottom: '24px' }}>Add your first child to get started.</p>
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
            }}>Add a child →</a>
          </div>
        ) : (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {children.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChild(c.id)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      border: 'none',
                      background: c.id === selectedChild ? '#0d2b28' : 'white',
                      color: c.id === selectedChild ? 'white' : '#0d2b28',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Stars earned</div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#f5a623' }}>⭐ {totalStars}</div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Owed to {child?.name}</div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#2ec4b6' }}>${dollarsOwed}</div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Streak</div>
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#0d2b28' }}>🔥 {child?.streak_days || 0}</div>
              </div>
            </div>

            {/* Start session button */}
            <a
              href="/session"
              onClick={() => {
                if (child) {
                  localStorage.setItem('learni_child_id', child.id)
                  localStorage.setItem('learni_child_name', child.name)
                  localStorage.setItem('learni_year_level', String(child.year_level))
                }
              }}
              style={{
                display: 'block',
                background: '#2ec4b6',
                color: 'white',
                padding: '18px',
                borderRadius: '16px',
                textAlign: 'center',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '18px',
                fontWeight: 900,
                textDecoration: 'none',
                marginBottom: '24px',
                boxShadow: '0 6px 20px rgba(46,196,182,0.3)',
              }}
            >
              Start session with Earni →
            </a>

            {/* Recent sessions */}
            <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d2b28', marginBottom: '12px' }}>
              Recent sessions
            </h3>
            {sessions.length === 0 ? (
              <p style={{ color: '#5a8a84', fontSize: '14px' }}>No sessions yet. Start one!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sessions.slice(0, 10).map(s => (
                  <div key={s.id} style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d2b28' }}>
                        {s.subjects_covered?.join(', ') || 'Session'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5a8a84' }}>
                        {new Date(s.created_at).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{Math.round(s.duration_secs / 60)} min
                        {' · '}{s.correct_count}/{s.total_questions} correct
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 900,
                      fontSize: '15px',
                      color: '#f5a623',
                    }}>
                      ⭐ {s.stars_earned}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
      `}</style>
    </div>
  )
}
