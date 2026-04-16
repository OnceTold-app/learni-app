'use client'

import { useState, useEffect } from 'react'
import { getCurrentRank, getNextRank, getProgressToNextRank } from '@/lib/ranks'
import { Skeleton, SkeletonStyles } from '@/components/ui/skeleton'
import TimesTableHeatmap, { FactMasteryData } from '@/components/times-table-heatmap'
import { ALL_MASTERY_TOPICS } from '@/lib/question-bank-generator'

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
  const [totalStars, setTotalStars] = useState(() => {
    if (typeof window === 'undefined') return 0
    const cached = localStorage.getItem('learni_cached_stars')
    return cached ? parseInt(cached) : 0
  })
  const [streak, setStreak] = useState(0)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [needsBaseline, setNeedsBaseline] = useState(false)
  const [baselineLevelName, setBaselineLevelName] = useState('')
  const [topicsMastered, setTopicsMastered] = useState(0)
  const [badges, setBadges] = useState<Array<{ id: string; name: string; emoji: string; desc: string; earned: boolean; isNew: boolean }>>([])
  // Mastery map state
  const [tierSummary, setTierSummary] = useState<Array<{ tier: number; total: number; mastered: number }>>([])
  const [topicMastery, setTopicMastery] = useState<Array<{ topic_id: string; tier: number; correct_count: number; streak_current: number; is_mastered: boolean }>>([])
  const [factMastery, setFactMastery] = useState<FactMasteryData[]>([])
  const [masteryExpanded, setMasteryExpanded] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [starsPerDollar, setStarsPerDollar] = useState(20)
  const [rateSet, setRateSet] = useState(false)
  const [earningsExpanded, setEarningsExpanded] = useState(false)
  const [ledger, setLedger] = useState<Array<{ id: string; type: string; stars: number; dollar_value: number | null; note: string | null; created_at: string; session_id: string | null }>>([]) 
  const [lifetimeStats, setLifetimeStats] = useState<{ totalEarned: number; totalPaidOut: number; lastPayout: { dollar_value: number | null; created_at: string } | null }>({ totalEarned: 0, totalPaidOut: 0, lastPayout: null })

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
        const freshStars = data.totalStars || 0
        setTotalStars(freshStars)
        localStorage.setItem('learni_cached_stars', String(freshStars))
        setStreak(data.streak || 0)
        setSessions(data.sessions || [])
        // Check if baseline needed (no sessions yet)
        if (!data.sessions || data.sessions.length === 0) {
          setNeedsBaseline(true)
        }
        // Load baseline level name
        const lvlName = localStorage.getItem('learni_baseline_level_name') || ''
        if (lvlName) setBaselineLevelName(lvlName)
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
      }
      // Load mastery for ranking + mastery map
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
        if (masteryData.tierSummary) setTierSummary(masteryData.tierSummary)
        if (masteryData.topicMastery) setTopicMastery(masteryData.topicMastery)
        if (masteryData.factMastery) setFactMastery(masteryData.factMastery)
      }

      // Load achievements
      const badgeRes = await fetch(`/api/kid/achievements?childId=${childId}`)
      if (badgeRes.ok) {
        const badgeData = await badgeRes.json()
        setBadges(badgeData.badges || [])
      }

      // Load earnings ledger
      const ledgerRes = await fetch(`/api/kid/ledger?childId=${childId}`)
      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json()
        setLedger(ledgerData.ledger || [])
        setLifetimeStats(ledgerData.lifetimeStats || { totalEarned: 0, totalPaidOut: 0, lastPayout: null })
      }

      // Load reward settings (parent token required)
      const parentToken = localStorage.getItem('learni_parent_token')
      if (parentToken) {
        const rewardRes = await fetch(`/api/parent/reward-settings?childId=${childId}`, {
          headers: { 'Authorization': `Bearer ${parentToken}` },
        })
        if (rewardRes.ok) {
          const rewardData = await rewardRes.json()
          setStarsPerDollar(rewardData.starsPerDollar || 20)
          setRateSet(true)
        }
      }
    } catch {
      setStatsError(true)
    }
    setLoading(false)
  }

  const displayUsername = username || childName
  const displayName = (name: string) => name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name
  const starsToDollars = (stars: number) => (stars / starsPerDollar).toFixed(2)

  const hasCachedData = typeof window !== 'undefined' && localStorage.getItem('learni_cached_stars') !== null
  if (loading && !hasCachedData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d2b28 0%, #143330 50%, #1a3d39 100%)',
        padding: '24px',
        paddingBottom: '120px',
      }}>
        <SkeletonStyles />
        <div className="kid-hub-content" style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '20px' }}>
          {/* Avatar skeleton */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Skeleton width={120} height={120} borderRadius='50%' style={{ margin: '0 auto 16px' }} />
            <Skeleton width='40%' height={28} borderRadius={8} style={{ margin: '0 auto 8px' }} />
            <Skeleton width='25%' height={14} borderRadius={6} style={{ margin: '0 auto 6px' }} />
            <Skeleton width='50%' height={6} borderRadius={3} style={{ margin: '6px auto 8px' }} />
            <Skeleton width='30%' height={12} borderRadius={6} style={{ margin: '0 auto' }} />
          </div>
          {/* Stats grid skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <Skeleton width='60%' height={28} borderRadius={6} style={{ margin: '0 auto 8px' }} />
                <Skeleton width='40%' height={11} borderRadius={4} style={{ margin: '0 auto' }} />
              </div>
            ))}
          </div>
          {/* CTA skeleton */}
          <Skeleton height={64} borderRadius={20} style={{ marginBottom: '24px' }} />
          {/* Sessions skeleton */}
          <Skeleton width='30%' height={14} borderRadius={6} style={{ marginBottom: '12px' }} />
          {[0,1,2].map(i => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '14px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Skeleton width='55%' height={14} borderRadius={4} style={{ marginBottom: '6px' }} />
                <Skeleton width='35%' height={11} borderRadius={4} />
              </div>
              <Skeleton width={40} height={14} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0d2b28 0%, #143330 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '40px 32px',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>😅</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '20px', color: 'white', margin: '0 0 10px' }}>
            Couldn&apos;t load your stats
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
            Something went wrong. Your stars and progress are safe - just give it another try.
          </p>
          <button
            onClick={() => {
              setStatsError(false)
              setLoading(true)
              const id = localStorage.getItem('learni_child_id')
              if (id) fetchData(id)
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            Try again →
          </button>
          <button
            onClick={() => { window.location.href = '/start-session' }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Start a session anyway
          </button>
        </div>
      </div>
    )
  }

  function handleLogout() {
    localStorage.removeItem('learni_child_id')
    localStorage.removeItem('learni_child_name')
    localStorage.removeItem('learni_child_pin')
    localStorage.removeItem('learni_year_level')
    localStorage.removeItem('learni_child_username')
    window.location.href = '/login'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28 0%, #143330 50%, #1a3d39 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: '120px',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '14px',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
        }}>My Hub</span>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          🔒 Log out
        </button>
      </div>

      <div className="kid-hub-content" style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '4px' }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayUsername}
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
              {displayUsername.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            color: 'white',
            marginBottom: '4px',
          }}>Hey {displayName(childName)}! 👋</h1>
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

        {/* Streak banner */}
        {streak > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(239,68,68,0.1))',
            border: '1px solid rgba(245,166,35,0.25)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '32px' }}>🔥</span>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 900, color: '#f5a623' }}>{streak} day streak!</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Keep it going - don&apos;t break the chain!</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="kid-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#f5a623' }}>⭐ {totalStars}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: 600 }}>Stars</div>
            {rateSet ? (
              <div style={{ fontSize: '11px', color: '#f5a623', marginTop: '2px', fontWeight: 700 }}>= ${starsToDollars(totalStars)} earned</div>
            ) : (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', fontWeight: 600, lineHeight: 1.3 }}>Ask your parent to set your reward rate!</div>
            )}
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
        {needsBaseline && !baselineLevelName && (
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
        {baselineLevelName && (
          <div style={{
            background: 'rgba(46,196,182,0.08)',
            border: '1.5px solid rgba(46,196,182,0.2)',
            padding: '14px 18px',
            borderRadius: '14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '22px' }}>📊</span>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800, color: '#2ec4b6' }}>Starting level: {baselineLevelName}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Earni will teach from here</div>
            </div>
          </div>
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

        {/* ─── MASTERY MAP SECTION ─────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          {/* Header row */}
          <button
            onClick={() => setMasteryExpanded(x => !x)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: masteryExpanded ? '16px 16px 0 0' : '16px',
              padding: '14px 18px',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900 }}>My Mastery Map</span>
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{masteryExpanded ? '▲' : '▼'}</span>
          </button>

          {/* Tier summary - always visible */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderTop: 'none',
            borderRadius: masteryExpanded ? '0' : '0 0 16px 16px',
            padding: '12px 18px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {tierSummary.length > 0 ? tierSummary.map(ts => (
              <span key={ts.tier} style={{
                fontSize: '12px',
                fontWeight: 700,
                color: ts.tier === 3 ? '#f5a623' : ts.tier === 2 ? '#2ec4b6' : 'rgba(255,255,255,0.6)',
                fontFamily: "'Nunito', sans-serif",
              }}>
                {ts.tier === 1 ? '🟢' : ts.tier === 2 ? '🔵' : '⭐'} Tier {ts.tier}: {ts.mastered}/{ts.total} mastered
                {ts.tier < 3 && <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '6px' }}>·</span>}
              </span>
            )) : (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Start a session to track your mastery!</span>
            )}
          </div>

          {/* Expanded content */}
          {masteryExpanded && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              padding: '16px',
            }}>
              {/* Times Table Detail — collapsible heatmap */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setShowHeatmap(x => !x)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📊 Times Table Detail {showHeatmap ? '▲' : '▼'}
                </button>
                {showHeatmap && (
                  <div style={{ marginTop: '12px' }}>
                    <TimesTableHeatmap masteryData={factMastery} />
                  </div>
                )}
              </div>

              {/* Category rows */}
              {(() => {
                const tmMap = new Map(topicMastery.map(r => [r.topic_id, r]))

                const CATEGORIES: Array<{ key: string; label: string }> = [
                  { key: 'counting', label: 'Counting' },
                  { key: 'addition', label: 'Addition' },
                  { key: 'subtraction', label: 'Subtraction' },
                  { key: 'times-tables', label: 'Times Tables' },
                  { key: 'division', label: 'Division' },
                ]

                const eliteTopics = ALL_MASTERY_TOPICS.filter(t => t.tier === 3)

                const renderChip = (topic: typeof ALL_MASTERY_TOPICS[number], isElite: boolean) => {
                  const row = tmMap.get(topic.id)
                  const isMastered = row?.is_mastered === true
                  const inProgress = row && !isMastered && row.correct_count > 0

                  let chipStyle: React.CSSProperties
                  if (isMastered && isElite) {
                    chipStyle = {
                      background: 'rgba(245,166,35,0.2)',
                      border: '1px solid rgba(245,166,35,0.6)',
                      color: '#f5a623',
                    }
                  } else if (isMastered) {
                    chipStyle = {
                      background: 'rgba(46,196,182,0.15)',
                      border: '1px solid rgba(46,196,182,0.5)',
                      color: '#2ec4b6',
                    }
                  } else if (inProgress) {
                    chipStyle = {
                      background: 'rgba(245,166,35,0.12)',
                      border: '1px solid rgba(245,166,35,0.4)',
                      color: '#f5a623',
                    }
                  } else {
                    chipStyle = {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.4)',
                    }
                  }

                  return (
                    <button
                      key={topic.id}
                      onClick={() => {
                        localStorage.setItem('learni_session_topic', topic.id)
                        localStorage.setItem('learni_subject', 'Maths')
                        localStorage.setItem('learni_session_mode', 'practice')
                        window.location.href = '/session'
                      }}
                      style={{
                        ...chipStyle,
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'Nunito', sans-serif",
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {topic.sub_level}
                      {inProgress && (
                        <span style={{ fontSize: '10px' }}>{row!.correct_count}/{topic.mastery_threshold}</span>
                      )}
                    </button>
                  )
                }

                return (
                  <>
                    {CATEGORIES.map(({ key, label }) => {
                      const topics = ALL_MASTERY_TOPICS.filter(t => t.category === key && t.tier !== 3)
                      if (topics.length === 0) return null
                      return (
                        <div key={key} style={{ marginBottom: '12px' }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: 'rgba(255,255,255,0.35)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginBottom: '6px',
                          }}>
                            {label}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {topics.map(topic => renderChip(topic, false))}
                          </div>
                        </div>
                      )
                    })}

                    {eliteTopics.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: 'rgba(245,166,35,0.7)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '6px',
                        }}>
                          ⭐ Elite
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {eliteTopics.map(topic => renderChip(topic, true))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </div>
        {/* ─── END MASTERY MAP SECTION ──────────────────────────── */}

        {/* ─── EARNINGS HISTORY SECTION ──────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setEarningsExpanded(x => !x)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: earningsExpanded ? '16px 16px 0 0' : '16px',
              padding: '14px 18px',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💰</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900 }}>Earnings History</span>
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{earningsExpanded ? '▲' : '▼'}</span>
          </button>

          {earningsExpanded && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              padding: '16px',
            }}>
              {/* Lifetime total */}
              <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(46,196,182,0.08)', borderRadius: '12px', border: '1px solid rgba(46,196,182,0.15)' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#2ec4b6', fontFamily: "'Nunito', sans-serif" }}>
                  ⭐ {lifetimeStats.totalEarned.toLocaleString()} stars earned{rateSet ? ` = $${starsToDollars(lifetimeStats.totalEarned)} total` : ''}
                </div>
              </div>

              {/* Last payout */}
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px', fontWeight: 600 }}>
                {lifetimeStats.lastPayout
                  ? `Last paid: $${(lifetimeStats.lastPayout.dollar_value || 0).toFixed(2)} on ${new Date(lifetimeStats.lastPayout.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Not paid out yet'}
              </div>

              {/* Ledger entries */}
              {ledger.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>No earnings yet. Start a session!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ledger.map((entry, i) => (
                    <div key={entry.id || i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>
                          {new Date(entry.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: entry.type === 'payout' ? '#4ade80' : '#2ec4b6' }}>
                          {entry.type === 'payout'
                            ? `💰 Paid out: ${entry.stars} ⭐${entry.dollar_value ? ` = $${Number(entry.dollar_value).toFixed(2)}` : ''}`
                            : `+${entry.stars} ⭐ · $${starsToDollars(entry.stars)} ${entry.note || 'Session'}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* ─── END EARNINGS HISTORY SECTION ──────────────────────────── */}

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

        {/* Switch user / sign out */}
        <button
          onClick={async () => {
            const childId = localStorage.getItem('learni_child_id')
            if (childId) {
              // Schedule daily summary email (fires after 10 min if they don't return)
              try {
                await fetch('/api/session/daily-summary', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ childId }),
                })
              } catch { /* fire and forget */ }
            }
            handleLogout()
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
      <style jsx global>{`
        @media (min-width: 768px) {
          .kid-hub-content { max-width: 700px !important; }
        }
        @media (max-width: 400px) {
          .kid-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}

