'use client'

import { useState, useEffect } from 'react'
import { getCurrentRank, getNextRank, getProgressToNextRank } from '@/lib/ranks'

interface SessionData {
  id: string
  completed_at: string
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
  const [needsBaseline, setNeedsBaseline] = useState(false)
  const [topicsMastered, setTopicsMastered] = useState(0)
  const [badges, setBadges] = useState<Array<{ id: string; name: string; emoji: string; desc: string; earned: boolean; isNew: boolean }>>([])

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
        // Check if baseline needed (no sessions yet)
        if (!data.sessions || data.sessions.length === 0) {
          setNeedsBaseline(true)
        }
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
      }
      // Load mastery for ranking
      const masteryRes = await fetch(`/api/kid/mastery?childId=${childId}`)
      if (masteryRes.ok) {
        const masteryData = await masteryRes.json()
        const mastered = Object.values(masteryData.mastery || {}).filter(
          (s: unknown) => {
            const stats = s as { correct: number; total: number }
            return stats.total >= 3 && (stats.correct / stats.total) >= 0.8
          }
        ).length
        setTopicsMastered(mastered)
      }

      // Load achievements
      const badgeRes = await fetch(`/api/kid/achievements?childId=${childId}`)
      if (badgeRes.ok) {
        const badgeData = await badgeRes.json()
        setBadges(badgeData.badges || [])
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
          {/* Rank */}
          {(() => {
            const rank = getCurrentRank(totalStars, topicsMastered)
            const next = getNextRank(totalStars, topicsMastered)
            const progress = getProgressToNextRank(totalStars, topicsMastered)
            return (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: rank.color, fontFamily: "'Nunito', sans-serif" }}>
                  {rank.emoji} {rank.title}
                </span>
                {next && (
                  <div style={{ marginTop: '6px', maxWidth: '200px', margin: '6px auto 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '3px' }}>
                      <span>{rank.title}</span>
                      <span>{next.emoji} {next.title}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: rank.color, width: `${progress}%`, borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
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

        {/* Baseline prompt */}
        {needsBaseline && (
          <a
            href="/baseline"
            style={{
              display: 'block',
              background: 'rgba(245,166,35,0.1)',
              border: '1.5px solid rgba(245,166,35,0.25)',
              padding: '18px 20px',
              borderRadius: '16px',
              textDecoration: 'none',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎯</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: '#f5a623', marginBottom: '4px' }}>Let&apos;s find your level!</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Quick assessment so Earni knows where to start</div>
          </a>
        )}

        {/* Start session button */}
        <a
          href="/start-session"
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
                const date = new Date(s.completed_at)
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

        {/* Achievements */}
        {badges.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Achievements</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {badges.map(b => (
                <div key={b.id} style={{
                  background: b.earned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: b.isNew ? '1.5px solid #f5a623' : b.earned ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  textAlign: 'center',
                  minWidth: '80px',
                  opacity: b.earned ? 1 : 0.35,
                  position: 'relative',
                }}>
                  {b.isNew && (
                    <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#f5a623', color: 'white', borderRadius: '10px', fontSize: '9px', fontWeight: 800, padding: '2px 6px' }}>NEW!</div>
                  )}
                  <div style={{ fontSize: '24px' }}>{b.emoji}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{b.name}</div>
                </div>
              ))}
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
