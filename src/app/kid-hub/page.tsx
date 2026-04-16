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

const PATH_NODES = [
  { id: 'counting', label: 'Counting', tier: 1, icon: '🔢',
    topics: ['counting-2s', 'counting-5s', 'counting-10s'] },
  { id: 'addition-t1', label: 'Addition', tier: 1, icon: '➕',
    topics: ['addition-1-10', 'addition-11-20', 'addition-21-50', 'addition-51-100'] },
  { id: 'subtraction-t1', label: 'Subtraction', tier: 1, icon: '➖',
    topics: ['subtraction-1-10', 'subtraction-11-20', 'subtraction-21-50', 'subtraction-51-100'] },
  { id: 'times-tables', label: 'Times Tables', tier: 2, icon: '✖️',
    topics: ['times-2','times-3','times-4','times-5','times-6','times-7','times-8','times-9','times-10','times-11','times-12'] },
  { id: 'division', label: 'Division', tier: 2, icon: '➗',
    topics: ['division-2','division-3','division-4','division-5','division-6','division-7','division-8','division-9','division-10','division-11','division-12'] },
  { id: 'addition-t2', label: 'Addition+', tier: 2, icon: '➕',
    topics: ['addition-101-500', 'addition-501-1000'] },
  { id: 'subtraction-t2', label: 'Subtraction+', tier: 2, icon: '➖',
    topics: ['subtraction-101-500', 'subtraction-501-1000'] },
  { id: 'elite', label: 'Elite ⭐', tier: 3, icon: '🏆',
    topics: ['addition-1001-10000', 'addition-10001-100000', 'addition-100001-1000000'] },
]

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
  // Path UI state
  const [expandedNode, setExpandedNode] = useState<string | null>(null)
  const [earningsExpanded, setEarningsExpanded] = useState(false)

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
        if (!data.sessions || data.sessions.length === 0) {
          setNeedsBaseline(true)
        }
        const lvlName = localStorage.getItem('learni_baseline_level_name') || ''
        if (lvlName) setBaselineLevelName(lvlName)
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
      }
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
      const badgeRes = await fetch(`/api/kid/achievements?childId=${childId}`)
      if (badgeRes.ok) {
        const badgeData = await badgeRes.json()
        setBadges(badgeData.badges || [])
      }
    } catch {
      setStatsError(true)
    }
    setLoading(false)
  }

  const displayName = username || childName

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
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Skeleton width={120} height={120} borderRadius='50%' style={{ margin: '0 auto 16px' }} />
            <Skeleton width='40%' height={28} borderRadius={8} style={{ margin: '0 auto 8px' }} />
            <Skeleton width='50%' height={6} borderRadius={3} style={{ margin: '6px auto 8px' }} />
          </div>
          <Skeleton height={64} borderRadius={20} style={{ marginBottom: '24px' }} />
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
              <Skeleton width={64} height={64} borderRadius='50%' />
              <Skeleton width={80} height={14} borderRadius={6} style={{ marginTop: '8px' }} />
              <Skeleton width={3} height={40} borderRadius={2} style={{ marginTop: '8px' }} />
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

  // ─── Compute path node statuses ────────────────────────────────────────────
  const tmMap = new Map(topicMastery.map(r => [r.topic_id, r]))

  const tier1Nodes = PATH_NODES.filter(n => n.tier === 1)
  const tier1Complete = tier1Nodes.every(node =>
    node.topics.every(t => tmMap.get(t)?.is_mastered === true)
  )

  const tier2Nodes = PATH_NODES.filter(n => n.tier === 2)
  const tier2AllTopics = tier2Nodes.flatMap(n => n.topics)
  const tier2MasteredCount = tier2AllTopics.filter(t => tmMap.get(t)?.is_mastered === true).length
  const tier2Progress = tier2AllTopics.length > 0 ? tier2MasteredCount / tier2AllTopics.length : 0

  const nodeStatuses = Object.fromEntries(
    PATH_NODES.map(node => {
      const masteredCount = node.topics.filter(t => tmMap.get(t)?.is_mastered === true).length
      const isComplete = masteredCount === node.topics.length
      const isStarted = node.topics.some(t => (tmMap.get(t)?.correct_count ?? 0) > 0)
      let isLocked: boolean
      if (node.tier === 1) isLocked = false
      else if (node.tier === 2) isLocked = !tier1Complete
      else isLocked = tier2Progress < 0.5
      return [node.id, { isComplete, isStarted, isLocked, masteredCount }]
    })
  ) as Record<string, { isComplete: boolean; isStarted: boolean; isLocked: boolean; masteredCount: number }>

  // Determine continue target
  const continueNode =
    PATH_NODES.find(n => {
      const s = nodeStatuses[n.id]
      return !s.isLocked && s.isStarted && !s.isComplete
    }) ||
    PATH_NODES.find(n => {
      const s = nodeStatuses[n.id]
      return !s.isLocked && !s.isStarted
    })
  const continueTopicId = continueNode
    ? (continueNode.topics.find(t => !(tmMap.get(t)?.is_mastered === true)) ?? continueNode.topics[0])
    : null

  // Weekly stars
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStars = sessions
    .filter(s => new Date(s.completed_at) >= weekAgo)
    .reduce((sum, s) => sum + (s.stars_earned || 0), 0)

  // ─── Render helpers ─────────────────────────────────────────────────────────
  function startTopic(topicId: string) {
    localStorage.setItem('learni_session_topic', topicId)
    localStorage.setItem('learni_subject', 'Maths')
    localStorage.setItem('learni_session_mode', 'practice')
    window.location.href = '/session'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28 0%, #143330 50%, #1a3d39 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: '120px',
    }}>
      {/* ─── Sticky Top Bar ────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(13,43,40,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: '#f5a623' }}>
            {streak}
          </span>
        </div>
        {/* Name */}
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900, color: 'white' }}>
          Hey {displayName}!
        </span>
        {/* Stars + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: '#f5a623' }}>
              {totalStars.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}
          >
            🔒 out
          </button>
        </div>
      </div>

      <div className="kid-hub-content" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px 20px 0' }}>

        {/* ─── Earnings Banner ─────────────────────────────────────────────── */}
        <button
          onClick={() => setEarningsExpanded(x => !x)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(46,196,182,0.12), rgba(46,196,182,0.06))',
            border: '1px solid rgba(46,196,182,0.2)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: '16px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: '#2ec4b6' }}>
                This week: {weekStars} ⭐
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                Tap to see earnings history
              </div>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{earningsExpanded ? '▲' : '▼'}</span>
        </button>

        {/* ─── Continue CTA ────────────────────────────────────────────────── */}
        {continueTopicId ? (
          <button
            onClick={() => startTopic(continueTopicId)}
            style={{
              display: 'block',
              width: '100%',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white',
              padding: '18px 20px',
              borderRadius: '20px',
              textAlign: 'center',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '18px',
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              marginBottom: '28px',
              boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
            }}
          >
            ▶ Continue where you left off
          </button>
        ) : (
          <a
            href="/start-session"
            style={{
              display: 'block',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white',
              padding: '18px 20px',
              borderRadius: '20px',
              textAlign: 'center',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '18px',
              fontWeight: 900,
              textDecoration: 'none',
              marginBottom: '28px',
              boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
            }}
          >
            Start learning with Earni →
          </a>
        )}

        {/* ─── Baseline Prompts ────────────────────────────────────────────── */}
        {needsBaseline && !baselineLevelName && (
          <a
            href="/baseline"
            style={{
              display: 'block',
              background: 'rgba(245,166,35,0.1)',
              border: '1.5px solid rgba(245,166,35,0.25)',
              padding: '16px 20px',
              borderRadius: '16px',
              textDecoration: 'none',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900, color: '#f5a623', marginBottom: '3px' }}>Let&apos;s find your level!</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Quick assessment so Earni knows where to start</div>
          </a>
        )}

        {/* ─── Path Header ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
          }}>
            ══  your path  ══
          </div>
        </div>

        {/* ─── Path Nodes ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          {PATH_NODES.map((node, idx) => {
            const { isComplete, isStarted, isLocked, masteredCount } = nodeStatuses[node.id]
            const isExpanded = expandedNode === node.id
            const isLast = idx === PATH_NODES.length - 1

            return (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {/* Node row: line-left + circle + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '340px' }}>
                  {/* Node circle */}
                  <div
                    onClick={() => {
                      if (isLocked) return
                      setExpandedNode(isExpanded ? null : node.id)
                    }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: isComplete
                        ? '#2ec4b6'
                        : isStarted
                        ? 'rgba(46,196,182,0.2)'
                        : isLocked
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(46,196,182,0.1)',
                      border: isComplete
                        ? '3px solid #2ec4b6'
                        : isStarted
                        ? '3px solid #2ec4b6'
                        : isLocked
                        ? '2px solid rgba(255,255,255,0.1)'
                        : '2px solid rgba(46,196,182,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      cursor: isLocked ? 'default' : 'pointer',
                      boxShadow: isComplete
                        ? '0 0 24px rgba(46,196,182,0.4)'
                        : isStarted && !isComplete
                        ? '0 0 20px rgba(46,196,182,0.3)'
                        : 'none',
                      animation: isStarted && !isComplete ? 'pathPulse 2s infinite' : 'none',
                      flexShrink: 0,
                      transition: 'transform 0.15s',
                    }}
                  >
                    {isComplete ? '✓' : isLocked ? '🔒' : node.icon}
                  </div>

                  {/* Label + progress */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: '16px',
                      fontWeight: 900,
                      color: isLocked ? 'rgba(255,255,255,0.25)' : isComplete ? '#2ec4b6' : 'white',
                    }}>
                      {node.label}
                      {node.id === expandedNode && !isLocked && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>▲</span>
                      )}
                    </div>
                    {!isLocked && (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: 600 }}>
                        {isComplete
                          ? `✓ All ${node.topics.length} mastered`
                          : `${masteredCount} / ${node.topics.length} mastered`}
                      </div>
                    )}
                    {isLocked && node.tier === 2 && (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                        Complete Tier 1 to unlock
                      </div>
                    )}
                    {isLocked && node.tier === 3 && (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                        Master 50% of Tier 2 to unlock
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded sub-topic chips */}
                {isExpanded && !isLocked && (
                  <div style={{
                    width: '100%',
                    maxWidth: '340px',
                    paddingLeft: '80px',
                    marginTop: '10px',
                    marginBottom: '4px',
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {node.topics.map(topicId => {
                        const masteryRow = tmMap.get(topicId)
                        const topicDef = ALL_MASTERY_TOPICS.find(t => t.id === topicId)
                        const isMastered = masteryRow?.is_mastered === true
                        const inProgress = masteryRow && !isMastered && (masteryRow.correct_count ?? 0) > 0

                        let chipStyle: React.CSSProperties
                        let chipEmoji: string
                        if (isMastered) {
                          chipStyle = {
                            background: 'rgba(46,196,182,0.18)',
                            border: '1px solid rgba(46,196,182,0.5)',
                            color: '#2ec4b6',
                          }
                          chipEmoji = '✅'
                        } else if (inProgress) {
                          chipStyle = {
                            background: 'rgba(245,166,35,0.15)',
                            border: '1px solid rgba(245,166,35,0.4)',
                            color: '#f5a623',
                          }
                          chipEmoji = '🔶'
                        } else {
                          chipStyle = {
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: 'rgba(255,255,255,0.5)',
                          }
                          chipEmoji = '⬜'
                        }

                        return (
                          <button
                            key={topicId}
                            onClick={() => startTopic(topicId)}
                            style={{
                              ...chipStyle,
                              borderRadius: '10px',
                              padding: '5px 12px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: "'Nunito', sans-serif",
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            {chipEmoji} {topicDef?.sub_level ?? topicId}
                            {inProgress && masteryRow && topicDef && (
                              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                                {masteryRow.correct_count}/{topicDef.mastery_threshold}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Connecting line to next node */}
                {!isLast && (
                  <div style={{
                    width: '3px',
                    height: '32px',
                    margin: '8px 0',
                    borderLeft: '3px dashed',
                    borderColor: isComplete ? '#2ec4b6' : 'rgba(255,255,255,0.1)',
                    alignSelf: 'flex-start',
                    marginLeft: 'calc((100% - 340px) / 2 + 31px)',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* ─── Collapsible: Full Mastery Map ───────────────────────────────── */}
        <div style={{ marginBottom: '12px' }}>
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
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900 }}>My Full Mastery Map</span>
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{masteryExpanded ? '▲' : '▼'}</span>
          </button>

          {/* Tier summary row */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderTop: 'none',
            borderRadius: masteryExpanded ? '0' : '0 0 16px 16px',
            padding: '10px 18px',
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
                {ts.tier === 1 ? '🟢' : ts.tier === 2 ? '🔵' : '⭐'} Tier {ts.tier}: {ts.mastered}/{ts.total}
                {ts.tier < 3 && <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '6px' }}>·</span>}
              </span>
            )) : (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Start a session to track your mastery!</span>
            )}
          </div>

          {masteryExpanded && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: 'none',
              borderRadius: '0 0 16px 16px',
              padding: '16px',
            }}>
              {/* Heatmap toggle */}
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

              {/* Category chip rows */}
              {(() => {
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
                    chipStyle = { background: 'rgba(245,166,35,0.2)', border: '1px solid rgba(245,166,35,0.6)', color: '#f5a623' }
                  } else if (isMastered) {
                    chipStyle = { background: 'rgba(46,196,182,0.15)', border: '1px solid rgba(46,196,182,0.5)', color: '#2ec4b6' }
                  } else if (inProgress) {
                    chipStyle = { background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.4)', color: '#f5a623' }
                  } else {
                    chipStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                  }

                  return (
                    <button
                      key={topic.id}
                      onClick={() => startTopic(topic.id)}
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
                      {inProgress && <span style={{ fontSize: '10px' }}>{row!.correct_count}/{topic.mastery_threshold}</span>}
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
                          <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
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
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(245,166,35,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
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

        {/* ─── Collapsible: Earnings History ───────────────────────────────── */}
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
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900 }}>Earnings History</span>
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
              {/* Recent sessions */}
              {sessions.length > 0 ? (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Recent sessions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessions.slice(0, 8).map(s => {
                      const date = new Date(s.completed_at)
                      const mins = Math.round((s.duration_seconds || 0) / 60)
                      return (
                        <div key={s.id} style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
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
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                  No sessions yet — start learning to earn stars! 🌟
                </div>
              )}

              {/* Achievements */}
              {badges.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Achievements
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {badges.map(b => (
                      <div key={b.id} style={{
                        background: b.earned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: b.isNew ? '1.5px solid #f5a623' : b.earned ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        textAlign: 'center',
                        minWidth: '76px',
                        opacity: b.earned ? 1 : 0.35,
                        position: 'relative',
                      }}>
                        {b.isNew && (
                          <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#f5a623', color: 'white', borderRadius: '10px', fontSize: '9px', fontWeight: 800, padding: '2px 6px' }}>NEW!</div>
                        )}
                        <div style={{ fontSize: '22px' }}>{b.emoji}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{b.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Rank + profile links ────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {(() => {
            const rank = getCurrentRank(totalStars, topicsMastered)
            const next = getNextRank(totalStars, topicsMastered)
            const progress = getProgressToNextRank(totalStars, topicsMastered)
            return (
              <div style={{ marginBottom: '12px' }}>
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <a href="/kid-welcome" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>✏️ Username</a>
            <a href="/kid-avatar" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>🎨 My look</a>
          </div>
        </div>

        {/* ─── Switch user ─────────────────────────────────────────────────── */}
        <button
          onClick={async () => {
            const childId = localStorage.getItem('learni_child_id')
            if (childId) {
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
            margin: '8px auto 32px',
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
        @keyframes pathPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(46,196,182,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(46,196,182,0); }
        }
        @media (min-width: 768px) {
          .kid-hub-content { max-width: 700px !important; }
        }
      `}</style>
    </div>
  )
}
