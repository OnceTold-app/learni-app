'use client'

import { useState, useEffect } from 'react'
import { getCurrentRank, getNextRank, getProgressToNextRank } from '@/lib/ranks'
import { Skeleton, SkeletonStyles } from '@/components/ui/skeleton'
import EarniFAB from '@/components/earni-fab'
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
  const [badges, setBadges] = useState<Array<{ id: string; name: string; emoji: string; desc: string; earned: boolean; isNew: boolean; earnedAt?: string | null }>>([])
  // Mastery map state
  const [tierSummary, setTierSummary] = useState<Array<{ tier: number; total: number; mastered: number }>>([])
  const [topicMastery, setTopicMastery] = useState<Array<{ topic_id: string; tier: number; correct_count: number; streak_current: number; is_mastered: boolean }>>([])
  const [factMastery, setFactMastery] = useState<FactMasteryData[]>([])
  const [masteryExpanded, setMasteryExpanded] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [starsPerDollar, setStarsPerDollar] = useState(20)
  const [rateSet, setRateSet] = useState(true) // default true with 20 stars = $1
  const [earningsExpanded, setEarningsExpanded] = useState(false)
  const [ledger, setLedger] = useState<Array<{ id: string; type: string; stars: number; dollar_value: number | null; note: string | null; created_at: string; session_id: string | null }>>([]) 
  const [lifetimeStats, setLifetimeStats] = useState<{ totalEarned: number; totalPaidOut: number; lastPayout: { dollar_value: number | null; created_at: string } | null }>({ totalEarned: 0, totalPaidOut: 0, lastPayout: null })
  // Money Vault state
  const [vaultTier, setVaultTier] = useState(1)
  const [jarSplit, setJarSplit] = useState<{ save: number; spend: number; give: number }>({ save: 50, spend: 40, give: 10 })
  const [goalVault, setGoalVault] = useState<{ name: string; target: number; progress?: number; cause?: string | null } | null>(null)
  const [editingJarSplit, setEditingJarSplit] = useState(false)
  const [draftSplit, setDraftSplit] = useState<{ save: number; spend: number; give: number }>({ save: 50, spend: 40, give: 10 })
  const [savingJarSplit, setSavingJarSplit] = useState(false)
  const [yearLevel, setYearLevel] = useState(1)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null)
  const [welcomeBackAction, setWelcomeBackAction] = useState('/session')

  useEffect(() => {
    const id = localStorage.getItem('learni_child_id')
    const name = localStorage.getItem('learni_child_name')
    const uname = localStorage.getItem('learni_child_username')
    if (!id || !name) { window.location.href = '/login'; return }
    setChildName(name)
    setUsername(uname || '')
    setAvatarUrl(localStorage.getItem('learni_avatar_url') || '')
    setYearLevel(parseInt(localStorage.getItem('learni_year_level') || '1'))
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
        // Welcome back message
        const sessionsArr = data.sessions || []
        if (sessionsArr.length > 0) {
          const lastSess = sessionsArr[0]
          const hoursAgo = Math.floor((Date.now() - new Date(lastSess.completed_at).getTime()) / 3600000)
          const lastTopic = lastSess.subject || 'your last lesson'
          const kidName = localStorage.getItem('learni_child_name') || ''
          const dName = kidName ? kidName.charAt(0).toUpperCase() + kidName.slice(1).toLowerCase() : kidName
          let wbMsg = ''
          if (hoursAgo >= 1 && hoursAgo < 24) {
            wbMsg = `Welcome back, ${dName}! Last time you worked on ${lastTopic}. Ready to keep going?`
          } else if (hoursAgo >= 24 && hoursAgo < 168) {
            wbMsg = `Good to see you, ${dName}! Last time: ${lastTopic}. Pick up where you left off?`
          } else if (hoursAgo >= 168) {
            wbMsg = `Hey ${dName} — it's been a little while. Let's ease back in with something familiar before we push forward.`
            setWelcomeBackAction('/start-session')
          }
          if (wbMsg) {
            setWelcomeBack(wbMsg)
            const yl = parseInt(localStorage.getItem('learni_year_level') || '1')
            if (yl <= 6) {
              fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: wbMsg }),
              }).then(res => res.ok ? res.blob() : null).then(blob => {
                if (blob) {
                  const url = URL.createObjectURL(blob)
                  const audio = new Audio(url)
                  audio.play().catch(() => {})
                }
              }).catch(() => {})
            }
          }
        }
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
          const rate = rewardData.starsPerDollar
          setStarsPerDollar(rate || 20)
          // Only show 'ask parent' if rate is explicitly 0 or null
          setRateSet(rate !== null && rate !== undefined && rate > 0)
        }
      }

      // Load vault data
      try {
        const vaultRes = await fetch(`/api/kid/vault?childId=${childId}`)
        if (vaultRes.ok) {
          const vaultData = await vaultRes.json()
          setVaultTier(vaultData.vaultTier || 1)
          const loadedSplit = vaultData.jarSplit || { save: 50, spend: 40, give: 10 }
          setJarSplit(loadedSplit)
          setDraftSplit(loadedSplit)
          setGoalVault(vaultData.goalVault || null)
        }
      } catch { /* best effort — vault columns may not exist yet */ }
    } catch {
      setStatsError(true)
    }
    setLoading(false)
  }

  const totalDollars = rateSet ? totalStars / starsPerDollar : 0

  function adjustJarSplit(
    key: 'save' | 'spend' | 'give',
    newVal: number,
    current: { save: number; spend: number; give: number }
  ): { save: number; spend: number; give: number } {
    const clamped = Math.min(80, Math.max(10, Math.round(newVal)))
    const delta = clamped - current[key]
    if (delta === 0) return current
    const others = (['save', 'spend', 'give'] as const).filter(k => k !== key)
    const totalOthers = others.reduce((s, k) => s + current[k], 0)
    const result = { ...current, [key]: clamped }
    let toDistribute = -delta
    others.forEach((k, i) => {
      if (i === others.length - 1) {
        result[k] = Math.min(80, Math.max(10, current[k] + toDistribute))
      } else {
        const share = totalOthers > 0 ? Math.round(toDistribute * current[k] / totalOthers) : 0
        result[k] = Math.min(80, Math.max(10, current[k] + share))
        toDistribute -= (result[k] - current[k])
      }
    })
    // Fix rounding to ensure total = 100
    const total = result.save + result.spend + result.give
    if (total !== 100) {
      const adjustable = others.filter(k => {
        const diff = 100 - total
        return diff > 0 ? result[k] < 80 : result[k] > 10
      })
      if (adjustable.length > 0) result[adjustable[adjustable.length - 1]] += (100 - total)
    }
    return result
  }

  async function saveJarSplitFn() {
    const childId = localStorage.getItem('learni_child_id')
    if (!childId) return
    setSavingJarSplit(true)
    try {
      await fetch(`/api/kid/vault?childId=${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jarSplit: draftSplit }),
      })
      setJarSplit({ ...draftSplit })
      setEditingJarSplit(false)
    } catch { /* best effort */ }
    setSavingJarSplit(false)
  }

  async function saveGoalVault() {
    const childId = localStorage.getItem('learni_child_id')
    if (!childId || !goalName.trim() || !goalTarget) return
    setSavingGoal(true)
    try {
      const target = parseFloat(goalTarget)
      const newGoal = { name: goalName.trim(), target, progress: 0, cause: null }
      await fetch(`/api/kid/vault?childId=${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalVault: newGoal }),
      })
      setGoalVault(newGoal)
      setGoalName('')
      setGoalTarget('')
    } catch { /* best effort */ }
    setSavingGoal(false)
  }

  async function saveCause(cause: string) {
    const childId = localStorage.getItem('learni_child_id')
    if (!childId) return
    const updated = goalVault ? { ...goalVault, cause } : { name: '', target: 0, progress: 0, cause }
    setGoalVault(updated)
    try {
      await fetch(`/api/kid/vault?childId=${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalVault: updated }),
      })
    } catch { /* best effort */ }
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
          }}>Hey {displayName(childName)}{yearLevel <= 6 ? '! 👋' : '.'}</h1>
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
            <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#f5a623' }}>
              {rateSet ? `⭐ ${totalStars} = $${starsToDollars(totalStars)} earned` : `⭐ ${totalStars}`}
            </div>
            {!rateSet && (
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

        {/* ─── MONEY VAULT SECTION ─────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '14px', marginTop: 0 }}>
            Your Money
          </h2>

          {/* Tier 1 — Piggy Bank (always unlocked) */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid #2ec4b6',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '10px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐷</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 900, color: '#f5a623' }}>⭐ {totalStars} stars</div>
            {rateSet && (
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#2ec4b6', marginTop: '4px' }}>
                = ${(totalStars / starsPerDollar).toFixed(2)} earned
              </div>
            )}
            {!rateSet && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Ask a parent to set your reward rate</div>
            )}
          </div>

          {/* Tier 2 — Three Jars */}
          {vaultTier < 2 ? (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/speak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: 'Finish the What is Saving lesson to unlock this!' }),
                  })
                  if (res.ok) {
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const audio = new Audio(url)
                    audio.play().catch(() => {})
                  }
                } catch { /* best effort */ }
                window.location.href = '/start-session'
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '16px',
                cursor: 'pointer', marginBottom: '10px', opacity: 0.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: 'white' }}>Three Jars</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Complete &apos;What is Saving?&apos; to unlock your jars</div>
                </div>
              </div>
            </button>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(46,196,182,0.3)',
              borderRadius: '16px', padding: '16px', marginBottom: '10px',
            }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: 'white', marginBottom: '12px' }}>Your Jars</div>
              {/* Jar display cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {([
                  { emoji: '💰', label: 'Save', key: 'save' as const, pct: jarSplit.save, color: '#4ade80' },
                  { emoji: '🛍️', label: 'Spend', key: 'spend' as const, pct: jarSplit.spend, color: '#ff9080' },
                  { emoji: '🤝', label: 'Give', key: 'give' as const, pct: jarSplit.give, color: '#93c5fd' },
                ]).map(jar => (
                  <div key={jar.label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${jar.color}55`,
                    borderRadius: '12px', padding: '10px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '22px', marginBottom: '4px' }}>{jar.emoji}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: jar.color }}>{jar.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: 'white', marginTop: '2px' }}>
                      ${(totalDollars * jar.pct / 100).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{jar.pct}%</div>
                  </div>
                ))}
              </div>

              {/* Edit mode */}
              {!editingJarSplit ? (
                <button
                  onClick={() => { setDraftSplit({ ...jarSplit }); setEditingJarSplit(true) }}
                  style={{
                    background: 'none', border: '1px solid rgba(46,196,182,0.3)',
                    borderRadius: '20px', padding: '6px 14px',
                    fontSize: '12px', fontWeight: 700, color: '#2ec4b6',
                    cursor: 'pointer', display: 'block', marginLeft: 'auto',
                  }}
                >
                  Adjust split →
                </button>
              ) : (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600 }}>
                    Each jar: min 10%, max 80% · total must equal 100%
                  </div>
                  {yearLevel <= 4 ? (
                    /* +/- buttons for Year 1-4 */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {([
                        { emoji: '💰', label: 'Save', key: 'save' as const, color: '#4ade80' },
                        { emoji: '🛍️', label: 'Spend', key: 'spend' as const, color: '#ff9080' },
                        { emoji: '🤝', label: 'Give', key: 'give' as const, color: '#93c5fd' },
                      ]).map(jar => (
                        <div key={jar.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px', width: '20px' }}>{jar.emoji}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: jar.color, width: '36px' }}>{jar.label}</span>
                          <button
                            onClick={() => setDraftSplit(adjustJarSplit(jar.key, draftSplit[jar.key] - 5, draftSplit))}
                            disabled={draftSplit[jar.key] <= 10}
                            style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: draftSplit[jar.key] <= 10 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: draftSplit[jar.key] <= 10 ? 'rgba(255,255,255,0.2)' : 'white',
                              fontSize: '18px', fontWeight: 700, cursor: draftSplit[jar.key] <= 10 ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              lineHeight: 1,
                            }}
                          >−</button>
                          <div style={{
                            flex: 1, textAlign: 'center',
                            fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: 'white',
                          }}>
                            {draftSplit[jar.key]}%
                          </div>
                          <button
                            onClick={() => setDraftSplit(adjustJarSplit(jar.key, draftSplit[jar.key] + 5, draftSplit))}
                            disabled={draftSplit[jar.key] >= 80}
                            style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: draftSplit[jar.key] >= 80 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: draftSplit[jar.key] >= 80 ? 'rgba(255,255,255,0.2)' : 'white',
                              fontSize: '18px', fontWeight: 700, cursor: draftSplit[jar.key] >= 80 ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              lineHeight: 1,
                            }}
                          >+</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Sliders for Year 5+ */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      {([
                        { emoji: '💰', label: 'Save', key: 'save' as const, color: '#4ade80' },
                        { emoji: '🛍️', label: 'Spend', key: 'spend' as const, color: '#ff9080' },
                        { emoji: '🤝', label: 'Give', key: 'give' as const, color: '#93c5fd' },
                      ]).map(jar => (
                        <div key={jar.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: jar.color }}>{jar.emoji} {jar.label}</span>
                            <span style={{ fontSize: '12px', fontWeight: 900, color: 'white', fontFamily: "'Nunito', sans-serif" }}>{draftSplit[jar.key]}%</span>
                          </div>
                          <input
                            type="range" min={10} max={80} step={5}
                            value={draftSplit[jar.key]}
                            onChange={e => setDraftSplit(adjustJarSplit(jar.key, parseInt(e.target.value), draftSplit))}
                            style={{ width: '100%', accentColor: jar.color }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={saveJarSplitFn}
                      disabled={savingJarSplit}
                      style={{
                        flex: 1, padding: '10px',
                        background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                        border: 'none', borderRadius: '20px',
                        fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900,
                        color: 'white', cursor: savingJarSplit ? 'not-allowed' : 'pointer',
                        opacity: savingJarSplit ? 0.7 : 1,
                      }}
                    >
                      {savingJarSplit ? 'Saving…' : 'Save split ✓'}
                    </button>
                    <button
                      onClick={() => setEditingJarSplit(false)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tier 3 — Goal Jar */}
          {vaultTier < 3 ? (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '16px', marginBottom: '10px', opacity: 0.5,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '24px' }}>🔒</span>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: 'white' }}>Goal Jar</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Complete &apos;Spending Wisely&apos; and &apos;Setting a Goal&apos; to unlock your Goal jar</div>
              </div>
            </div>
          ) : (() => {
            const saveProgress = totalDollars * jarSplit.save / 100
            if (!goalVault) {
              /* Setup card */
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(245,166,35,0.3)',
                  borderRadius: '16px', padding: '18px', marginBottom: '10px',
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '6px' }}>🎯</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: 'white' }}>What are you saving up for?</div>
                  </div>
                  <input
                    type="text"
                    value={goalName}
                    onChange={e => setGoalName(e.target.value.slice(0, 20))}
                    placeholder="e.g. New bike, Roblox..."
                    maxLength={20}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                      color: 'white', outline: 'none', marginBottom: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <span style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                    }}>$</span>
                    <input
                      type="number"
                      value={goalTarget}
                      onChange={e => setGoalTarget(e.target.value)}
                      placeholder="Target amount (NZD)"
                      min={1}
                      style={{
                        width: '100%', padding: '10px 14px 10px 24px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                        color: 'white', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    onClick={saveGoalVault}
                    disabled={savingGoal || !goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0}
                    style={{
                      width: '100%', padding: '12px',
                      background: (!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0)
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg, #f5a623, #e8940a)',
                      border: 'none', borderRadius: '20px',
                      fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900,
                      color: (!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0) ? 'rgba(255,255,255,0.3)' : 'white',
                      cursor: (!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingGoal ? 'Setting…' : 'Set my goal →'}
                  </button>
                </div>
              )
            } else if (saveProgress >= goalVault.target) {
              /* Celebration card */
              return (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(46,196,182,0.1))',
                  border: '1.5px solid rgba(245,166,35,0.4)',
                  borderRadius: '16px', padding: '18px', marginBottom: '10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: '#f5a623', marginBottom: '6px' }}>You did it!</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>
                    You saved ${saveProgress.toFixed(2)} for {goalVault.name}!
                  </div>
                  <button
                    onClick={async () => {
                      const childId = localStorage.getItem('learni_child_id')
                      if (!childId) return
                      setGoalVault(null)
                      await fetch(`/api/kid/vault?childId=${childId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ goalVault: null }),
                      })
                    }}
                    style={{
                      padding: '10px 24px',
                      background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                      border: 'none', borderRadius: '20px',
                      fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900,
                      color: 'white', cursor: 'pointer',
                    }}
                  >
                    Set a new goal →
                  </button>
                </div>
              )
            } else {
              /* Progress card */
              const progressPct = Math.min((saveProgress / goalVault.target) * 100, 100)
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(46,196,182,0.3)',
                  borderRadius: '16px', padding: '16px', marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🎯</span>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: 'white' }}>{goalVault.name}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                    ${saveProgress.toFixed(2)} / ${goalVault.target.toFixed(2)}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #2ec4b6, #4ade80)',
                      height: '100%', borderRadius: '8px',
                      width: `${progressPct.toFixed(0)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', textAlign: 'right' }}>
                    {progressPct.toFixed(0)}% there!
                  </div>
                </div>
              )
            }
          })()}

          {/* Tier 4 — Give Impact */}
          {vaultTier < 4 ? (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '16px', opacity: 0.5,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '24px' }}>🔒</span>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 900, color: 'white' }}>Give Impact</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Complete &apos;Giving and Why It Matters&apos; to unlock your Give impact page</div>
              </div>
            </div>
          ) : (() => {
            const giveDollars = totalDollars * jarSplit.give / 100
            const impactStatement =
              giveDollars < 1 ? 'Every cent adds up — keep going.'
              : giveDollars < 5 ? 'This could buy a meal for someone who needs one.'
              : giveDollars < 20 ? 'This could buy a book for a child who doesn\'t have one.'
              : 'This could make a real difference. What cause matters to you?'
            const causes = [
              { key: 'environment', emoji: '🌿', label: 'Environment' },
              { key: 'animals', emoji: '🐾', label: 'Animals' },
              { key: 'people', emoji: '👐', label: 'People' },
            ]
            const selectedCause = goalVault?.cause || null
            return (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(147,197,253,0.3)',
                borderRadius: '16px', padding: '18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🤝</span>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900, color: '#93c5fd' }}>Give Impact</div>
                </div>
                {/* Earni unlock message */}
                <div style={{
                  background: 'rgba(147,197,253,0.08)',
                  border: '1px solid rgba(147,197,253,0.15)',
                  borderRadius: '12px', padding: '10px 12px', marginBottom: '12px',
                  fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
                }}>
                  Your Give jar has money in it. That money can actually help someone. What matters to you?
                </div>
                {/* Give balance */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 900, color: '#93c5fd' }}>
                    ${giveDollars.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>in your Give jar</div>
                </div>
                {/* Impact statement */}
                <div style={{
                  fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center', marginBottom: '14px', lineHeight: 1.5,
                }}>
                  💡 {impactStatement}
                </div>
                {/* Cause selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {causes.map(cause => (
                    <button
                      key={cause.key}
                      onClick={() => saveCause(cause.key)}
                      style={{
                        padding: '12px 8px',
                        background: selectedCause === cause.key ? 'rgba(46,196,182,0.15)' : 'rgba(255,255,255,0.04)',
                        border: selectedCause === cause.key ? '2px solid #2ec4b6' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{cause.emoji}</div>
                      <div style={{
                        fontSize: '11px', fontWeight: 700,
                        color: selectedCause === cause.key ? '#2ec4b6' : 'rgba(255,255,255,0.6)',
                        fontFamily: "'Nunito', sans-serif",
                      }}>{cause.label}</div>
                    </button>
                  ))}
                </div>
                {/* NZ charities note */}
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '4px' }}>
                  KiwiHarvest · SPCA · Department of Conservation
                </div>
              </div>
            )
          })()}
        </div>

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
              <span style={{ fontSize: '20px' }}>⭐</span>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900 }}>My Skills</span>
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
                      border: '1.5px solid rgba(245,166,35,0.6)',
                      color: '#f5a623',
                    }
                  } else if (isMastered) {
                    chipStyle = {
                      background: 'rgba(46,196,182,0.15)',
                      border: '1.5px solid #2ec4b6',
                      color: '#2ec4b6',
                    }
                  } else if (inProgress) {
                    chipStyle = {
                      background: 'rgba(245,166,35,0.12)',
                      border: '1.5px solid rgba(245,166,35,0.3)',
                      color: '#f5a623',
                    }
                  } else {
                    chipStyle = {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.35)',
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
                      {topic.sub_level}{isMastered ? ' ✓' : ''}
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

        {/* Welcome back card */}
        {welcomeBack && (
          <div style={{
            background: 'rgba(46,196,182,0.08)',
            border: '1px solid rgba(46,196,182,0.15)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 12px',
              lineHeight: 1.5,
            }}>{welcomeBack}</p>
            <button
              onClick={() => {
                if (welcomeBackAction === '/session' && sessions.length > 0) {
                  localStorage.setItem('learni_session_topic', sessions[0].subject || '')
                  localStorage.setItem('learni_subject', sessions[0].subject || '')
                }
                window.location.href = welcomeBackAction
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                border: 'none',
                borderRadius: '100px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '14px',
                fontWeight: 900,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {welcomeBackAction === '/session' ? 'Continue →' : 'Start session →'}
            </button>
          </div>
        )}

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
                  {b.earned ? (
                    <div style={{ fontSize: '9px', fontWeight: 600, color: '#2ec4b6', marginTop: '3px' }}>
                      {b.earnedAt ? `Earned ${new Date(b.earnedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Earned'}
                    </div>
                  ) : (
                    <div style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>{b.desc}</div>
                  )}
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
      <EarniFAB context="child_portal" size="child" />
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


