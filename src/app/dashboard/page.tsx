'use client'

import { useState, useEffect } from 'react'

interface Child {
  id: string
  name: string
  year_level: number
  total_stars: number
  streak_days: number
  last_session: string | null
  avatar_url: string | null
}

interface SessionSummary {
  id: string
  completed_at: string
  duration_seconds: number
  stars_earned: number
  subject: string
  questions_correct: number
  questions_total: number
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
      {/* Hub title bar */}
      <div style={{
        background: '#0d2b28',
        padding: '14px 24px',
        textAlign: 'center',
      }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>The Hub</span>
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
            {/* Children list */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {children.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChild(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: c.id === selectedChild ? '2px solid #2ec4b6' : '2px solid transparent',
                    background: 'white',
                    cursor: 'pointer',
                    boxShadow: c.id === selectedChild ? '0 4px 16px rgba(46,196,182,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s',
                  }}
                >
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      width={40}
                      height={40}
                      style={{
                        borderRadius: '50%',
                        background: '#eef8f7',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: c.id === selectedChild ? 'linear-gradient(145deg, #2ec4b6, #1a9e92)' : '#eef8f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: "'Nunito', sans-serif",
                      color: c.id === selectedChild ? 'white' : '#1a9e92',
                      flexShrink: 0,
                    }}>
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '15px', color: '#0d2b28' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#5a8a84' }}>Year {c.year_level} · ⭐ {c.total_stars} stars</div>
                  </div>
                  {c.id === selectedChild && (
                    <a
                      href={`/manage-child?id=${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '11px', color: '#8abfba', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Manage
                    </a>
                  )}
                </button>
              ))}
              {children.length < 4 && (
                <a
                  href="/onboarding"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: '2px dashed rgba(13,43,40,0.12)',
                    background: 'transparent',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#5a8a84',
                    transition: 'all 0.15s',
                  }}
                >
                  + Add child
                </a>
              )}
            </div>

            {/* Stats cards */}
            <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
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
              href="/start-session"
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
              Start session with {child?.name || 'Earni'} →
            </a>

            {/* Progress report link */}
            {child && (
              <a
                href={`/progress?childId=${child.id}`}
                style={{
                  display: 'block',
                  background: 'white',
                  color: '#0d2b28',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  marginBottom: '24px',
                  border: '1px solid rgba(13,43,40,0.08)',
                }}
              >
                📊 View {child.name}&apos;s progress report
              </a>
            )}

            {/* Focus areas */}
            <FocusAreas childId={child?.id || ''} childName={child?.name || ''} />

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
                        {s.subject || 'Session'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#5a8a84' }}>
                        {new Date(s.completed_at).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{Math.round((s.duration_seconds || 0) / 60)} min
                        {' · '}{s.questions_correct || 0}/{s.questions_total || 0} correct
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
        @media (max-width: 480px) {
          .dashboard-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .dashboard-child-card { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}

// Focus areas component
function FocusAreas({ childId, childName }: { childId: string; childName: string }) {
  const [areas, setAreas] = useState<string[]>([])
  const [newArea, setNewArea] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!childId) return
    fetch(`/api/parent/focus?childId=${childId}`)
      .then(r => r.json())
      .then(d => { setAreas(d.focusAreas || []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [childId])

  async function save(updated: string[]) {
    setAreas(updated)
    const token = localStorage.getItem('learni_parent_token')
    await fetch('/api/parent/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ childId, focusAreas: updated }),
    })
  }

  function addArea() {
    const trimmed = newArea.trim()
    if (!trimmed || areas.includes(trimmed)) return
    save([...areas, trimmed])
    setNewArea('')
  }

  function removeArea(area: string) {
    save(areas.filter(a => a !== area))
  }

  if (!loaded || !childId) return null

  const SUGGESTIONS = ['Times tables', 'Fractions', 'Reading comprehension', 'Spelling', 'Division', 'Decimals', 'Word problems', 'Te Reo Māori', 'Descriptive writing', 'Telling time']
  const unusedSuggestions = SUGGESTIONS.filter(s => !areas.includes(s))

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d2b28', marginBottom: '8px' }}>
        Focus areas for {childName}
      </h3>
      <p style={{ fontSize: '13px', color: '#5a8a84', marginBottom: '12px' }}>
        Tell Earni what to prioritise in sessions
      </p>

      {/* Current focus areas */}
      {areas.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {areas.map(area => (
            <span key={area} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', background: 'rgba(46,196,182,0.1)',
              border: '1px solid rgba(46,196,182,0.2)', borderRadius: '20px',
              fontSize: '13px', fontWeight: 600, color: '#1a9e92',
            }}>
              {area}
              <button onClick={() => removeArea(area)} style={{
                background: 'none', border: 'none', color: '#8abfba',
                cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1,
              }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Add custom */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input
          value={newArea}
          onChange={e => setNewArea(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addArea()}
          placeholder="Add a focus area..."
          style={{
            flex: 1, padding: '8px 14px',
            border: '1.5px solid rgba(13,43,40,0.1)', borderRadius: '10px',
            fontSize: '13px', fontFamily: "'Plus Jakarta Sans', sans-serif",
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button onClick={addArea} disabled={!newArea.trim()} style={{
          padding: '8px 16px', background: newArea.trim() ? '#2ec4b6' : '#e0e0e0',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '13px', fontWeight: 700, cursor: newArea.trim() ? 'pointer' : 'default',
        }}>Add</button>
      </div>

      {/* Quick suggestions */}
      {unusedSuggestions.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {unusedSuggestions.slice(0, 5).map(s => (
            <button key={s} onClick={() => save([...areas, s])} style={{
              padding: '4px 10px', background: '#f7fafa',
              border: '1px solid rgba(13,43,40,0.06)', borderRadius: '14px',
              fontSize: '11px', color: '#5a8a84', cursor: 'pointer', fontWeight: 500,
            }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}
