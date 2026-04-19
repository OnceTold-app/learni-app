'use client'

import { useState, useEffect, useRef } from 'react'
import { SkeletonLight, SkeletonStyles } from '@/components/ui/skeleton'
import { track } from '@/lib/posthog'
import EarniFAB from '@/components/earni-fab'

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

interface WeeklyStats {
  totalStars: number
  dollarsOwed: number
  streak: number
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'No sessions yet'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Last session: today'
  if (diffDays === 1) return 'Last session: yesterday'
  return `Last session: ${diffDays} days ago`
}

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [childrenError, setChildrenError] = useState(false)
  const [parentName, setParentName] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [referralCopied, setReferralCopied] = useState(false)
  const [rewardSettings, setRewardSettings] = useState({ starsPerDollar: 20, weeklyStarCap: 200, rewardsPaused: false })
  const [rewardSettingsDraft, setRewardSettingsDraft] = useState({ starsPerDollar: 20, weeklyStarCap: 200, rewardsPaused: false })
  const [rewardSaving, setRewardSaving] = useState(false)
  const [rewardSaved, setRewardSaved] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState(false)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [childWeeklyStats, setChildWeeklyStats] = useState<Record<string, WeeklyStats>>({})
  const [childLastSession, setChildLastSession] = useState<Record<string, string>>({})
  const [applyToAll, setApplyToAll] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [periodStars, setPeriodStars] = useState<number | null>(null)
  const [periodStreak, setPeriodStreak] = useState<number | null>(null)
  const [sessionFlags, setSessionFlags] = useState<Array<{ id: string; flagged_at: string; reason: string; response_excerpt: string; reviewed: boolean }>>([])
  const lastActivityRef = useRef(Date.now())

  // Inactivity timeout — log parent out after 10 minutes
  useEffect(() => {
    const TIMEOUT_MS = 10 * 60 * 1000  // 10 minutes
    const WARNING_MS = 9 * 60 * 1000   // warn at 9 minutes

    function resetActivity() {
      lastActivityRef.current = Date.now()
      setShowInactivityWarning(false)
    }

    const events: (keyof WindowEventMap)[] = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetActivity))

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      if (idle >= TIMEOUT_MS) {
        localStorage.clear()
        window.location.href = '/login'
      } else if (idle >= WARNING_MS) {
        setShowInactivityWarning(true)
      }
    }, 30000)

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity))
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Clear any stale child session data to prevent it leaking into parent nav
    const childKeys = [
      'learni_child_id',
      'learni_child_name',
      'learni_child_pin',
      'learni_child_username',
      'learni_year_level',
      'learni_session_language',
      'learni_session_topic',
      'learni_session_mode',
      'learni_subject',
      'learni_baseline_level',
      'learni_baseline_level_name',
      'learni_baseline_strengths',
      'learni_baseline_gaps',
      'learni_cached_stars',
      'learni_last_subject',
      'learni_voice_enabled',
    ]
    childKeys.forEach(k => localStorage.removeItem(k))

    // Check auth
    const name = localStorage.getItem('learni_parent_name')
    if (!name) {
      window.location.href = '/login'
      return
    }
    setParentName(name)

    // Fetch account status (includes referral code + trial info)
    fetch('/api/account/status', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.referralCode) setReferralCode(d.referralCode)
        const trialEnd = d.trial_ends_at || null
        if (trialEnd) setTrialEndsAt(trialEnd)
        const subStatus = d.subscriptionStatus || d.subscription_status || null
        if (subStatus) setSubscriptionStatus(subStatus)
        // If trialing but no explicit status, derive from trial dates
        if (!subStatus && trialEnd && new Date(trialEnd) > new Date()) {
          setSubscriptionStatus('trialing')
        }
      })
      .catch(() => {})

    // Fetch children
    fetchChildren()
  }, [])

  async function fetchChildren() {
    try {
      const res = await fetch('/api/parent/children', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('learni_parent_token')
        window.location.href = '/login?reason=expired'
        return
      }
      const data = await res.json()
      const kids: Child[] = data.children || []
      setChildren(kids)
      if (kids.length > 0) {
        setSelectedChild(kids[0].id)
      }

      // Compute last session relative times from child data
      const lastSessionMap: Record<string, string> = {}
      kids.forEach(c => {
        lastSessionMap[c.id] = getRelativeTime(c.last_session)
      })
      setChildLastSession(lastSessionMap)

      // Fetch weekly stats for all children in parallel
      if (kids.length > 1) {
        const weeklyResults = await Promise.all(
          kids.map(c =>
            fetch(`/api/kid/stats?childId=${c.id}&period=week`)
              .then(r => r.json())
              .catch(() => ({ totalStars: 0, dollarsOwed: 0, streak: 0 }))
          )
        )
        const weeklyMap: Record<string, WeeklyStats> = {}
        kids.forEach((c, i) => {
          weeklyMap[c.id] = {
            totalStars: weeklyResults[i].totalStars || 0,
            dollarsOwed: weeklyResults[i].dollarsOwed || 0,
            streak: weeklyResults[i].streak || c.streak_days || 0,
          }
        })
        setChildWeeklyStats(weeklyMap)
      }
    } catch {
      setChildrenError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedChild) {
      fetchSessions(selectedChild)
      fetchRewardSettings(selectedChild)
      fetchPeriodStats(selectedChild, statsPeriod)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild])

  useEffect(() => {
    if (selectedChild) {
      fetchPeriodStats(selectedChild, statsPeriod)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsPeriod])

  async function fetchPeriodStats(childId: string, period: 'week' | 'month' | 'all') {
    try {
      const res = await fetch(`/api/kid/stats?childId=${childId}&period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setPeriodStars(data.totalStars ?? 0)
        setPeriodStreak(data.streak ?? 0)
      }
    } catch { /* */ }
  }

  async function fetchRewardSettings(childId: string) {
    try {
      const res = await fetch(`/api/parent/reward-settings?childId=${childId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
      })
      const data = await res.json()
      if (data.starsPerDollar !== undefined) {
        setRewardSettings(data)
        setRewardSettingsDraft(data)
      }
    } catch { /* */ }
  }

  async function saveRewardSettingsForChild(childId: string) {
    await fetch('/api/parent/reward-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}`,
      },
      body: JSON.stringify({ childId, ...rewardSettingsDraft }),
    })
  }

  async function saveRewardSettings() {
    if (!selectedChild) return
    setRewardSaving(true)
    try {
      if (applyToAll && children.length > 1) {
        await Promise.all(children.map(c => saveRewardSettingsForChild(c.id)))
      } else {
        await saveRewardSettingsForChild(selectedChild)
      }
      setRewardSettings(rewardSettingsDraft)
      setRewardSaved(true)
      setTimeout(() => setRewardSaved(false), 2500)
    } catch { /* */ }
    setRewardSaving(false)
  }

  async function refreshChildStats(childId: string) {
    try {
      const res = await fetch(`/api/kid/stats?childId=${childId}`)
      if (res.ok) {
        const data = await res.json()
        setChildren(prev => prev.map(c =>
          c.id === childId ? { ...c, total_stars: data.totalStars || 0 } : c
        ))
      }
    } catch { /* */ }
  }

  async function handlePayout() {
    if (!selectedChild || totalStars === 0 || rewardSettings.rewardsPaused) return
    setPayoutLoading(true)
    try {
      const res = await fetch('/api/parent/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}`,
        },
        body: JSON.stringify({
          childId: selectedChild,
          stars: totalStars,
          dollarValue: parseFloat(dollarsOwed),
        }),
      })
      if (res.ok) {
        setPayoutSuccess(true)
        setTimeout(() => {
          setPayoutSuccess(false)
          if (selectedChild) refreshChildStats(selectedChild)
        }, 1500)
      }
    } catch { /* */ }
    setPayoutLoading(false)
  }

  async function fetchSessions(childId: string) {
    try {
      const res = await fetch(`/api/parent/sessions?childId=${childId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
      })
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch { /* */ }

    // Fetch safety flags for this child
    try {
      const flagRes = await fetch(`/api/parent/flags?childId=${childId}`)
      const flagData = await flagRes.json()
      setSessionFlags(flagData.flags || [])
    } catch { /* */ }
  }

  const child = children.find(c => c.id === selectedChild)
  const totalStars = child?.total_stars || 0
  const dollarsOwed = (totalStars / rewardSettings.starsPerDollar).toFixed(2)

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>The Hub</span>
        <a href="/account" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#5a8a84', textDecoration: 'none', fontWeight: 500 }}>⚙️ Account</a>
      </div>

      {/* Trial banner */}
      {subscriptionStatus !== 'active' && trialEndsAt && (() => {
        const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
        const expired = daysLeft <= 0 && subscriptionStatus === 'trialing'
        if (expired) return (
          <div key="trial-expired" style={{ background: 'rgba(229,62,62,0.10)', borderBottom: '1px solid rgba(229,62,62,0.18)', padding: '10px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#c53030' }}>
            Your trial has ended · <a href="/account" style={{ color: '#c53030', textDecoration: 'underline' }}>Upgrade to continue →</a>
          </div>
        )
        if (daysLeft >= 1 && daysLeft <= 5) return (
          <div key="trial-warning" style={{ background: 'rgba(200,200,200,0.10)', borderBottom: '1px solid rgba(13,43,40,0.08)', padding: '10px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#5a8a84' }}>
            Free trial · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          </div>
        )
        if (daysLeft >= 6 && daysLeft <= 7) return (
          <div key="trial-urgent" style={{ background: 'rgba(245,166,35,0.12)', borderBottom: '1px solid rgba(245,166,35,0.20)', padding: '10px 24px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#b7791f' }}>
            Free trial · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining — ends soon
          </div>
        )
        return null
      })()}

      <div className="dashboard-main" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        {(subscriptionStatus === 'trialing' || (trialEndsAt && subscriptionStatus !== 'active')) && trialEndsAt && (() => {
          const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
          if (daysLeft <= 0) return (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#c0392b', fontWeight: 600 }}>Your trial has ended</span>
              <a href="/account" style={{ fontSize: '13px', color: '#c0392b', fontWeight: 700, textDecoration: 'none' }}>Upgrade to continue →</a>
            </div>
          )
          if (daysLeft <= 2) return (
            <div style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '12px', padding: '12px 20px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: '#e8930e', fontWeight: 600 }}>Free trial · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining — ends soon</span>
            </div>
          )
          return (
            <div style={{ background: 'rgba(46,196,182,0.06)', border: '1px solid rgba(46,196,182,0.15)', borderRadius: '12px', padding: '10px 20px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#1a8f85', fontWeight: 600 }}>Free trial · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
            </div>
          )
        })()}
        {loading ? (
          <>
            <SkeletonStyles />
            {/* Children tabs skeleton */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[0,1].map(i => (
                <div key={i} style={{ padding: '14px 20px', borderRadius: '16px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
                  <SkeletonLight width={40} height={40} borderRadius='50%' />
                  <div style={{ flex: 1 }}>
                    <SkeletonLight width='70%' height={15} borderRadius={4} style={{ marginBottom: '6px' }} />
                    <SkeletonLight width='50%' height={12} borderRadius={4} />
                  </div>
                </div>
              ))}
            </div>
            {/* Stats cards skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <SkeletonLight width='50%' height={11} borderRadius={4} style={{ marginBottom: '8px' }} />
                  <SkeletonLight width='65%' height={32} borderRadius={6} />
                </div>
              ))}
            </div>
            {/* CTA + sessions skeleton */}
            <SkeletonLight height={58} borderRadius={16} style={{ marginBottom: '24px' }} />
            <SkeletonLight width='30%' height={18} borderRadius={6} style={{ marginBottom: '12px' }} />
            {[0,1,2].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ flex: 1 }}>
                  <SkeletonLight width='45%' height={14} borderRadius={4} style={{ marginBottom: '6px' }} />
                  <SkeletonLight width='60%' height={12} borderRadius={4} />
                </div>
                <SkeletonLight width={40} height={18} borderRadius={4} />
              </div>
            ))}
          </>
        ) : childrenError ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😅</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d2b28', marginBottom: '8px' }}>
              Couldn&apos;t load your children
            </h2>
            <p style={{ color: '#5a8a84', marginBottom: '24px', fontSize: '14px' }}>
              Something went wrong connecting to Learni. Your data is safe.
            </p>
            <button
              onClick={() => {
                setChildrenError(false)
                setLoading(true)
                fetchChildren()
              }}
              style={{
                display: 'inline-block',
                background: '#2ec4b6',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '30px',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                marginRight: '12px',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'none',
                border: '1px solid rgba(13,43,40,0.12)',
                color: '#5a8a84',
                padding: '14px 20px',
                borderRadius: '30px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Refresh page
            </button>
          </div>
        ) : children.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d2b28', marginBottom: '8px' }}>
              Welcome to your Hub
            </h2>
            <p style={{ color: '#5a8a84', marginBottom: '24px' }}>Add your first child to get started with Earni.</p>
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
              marginBottom: '16px',
            }}>Add a child →</a>
            <div style={{ marginTop: '8px' }}>
              <a href="/account" style={{ fontSize: '13px', color: '#5a8a84', textDecoration: 'none' }}>⚙️ Account settings</a>
              <span style={{ color: '#ccc', margin: '0 8px' }}>·</span>
              <a href="/login" onClick={() => { localStorage.clear(); }} style={{ fontSize: '13px', color: '#5a8a84', textDecoration: 'none' }}>Log out</a>
            </div>
          </div>
        ) : (
          <>
            {/* Family Overview Summary Row — only show when 2+ children */}
            {children.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  Family overview
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                }}>
                  {children.map(c => {
                    const stats = childWeeklyStats[c.id]
                    const isSelected = c.id === selectedChild
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChild(c.id)}
                        style={{
                          minWidth: '160px',
                          maxWidth: '160px',
                          flexShrink: 0,
                          background: 'rgba(255,255,255,0.04)',
                          border: isSelected ? '1.5px solid #2ec4b6' : '1.5px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          backdropFilter: 'blur(4px)',
                          backgroundColor: isSelected ? 'rgba(46,196,182,0.08)' : '#0d2b28',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '14px', color: 'white', marginBottom: '8px' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '3px' }}>
                          ⭐ {stats?.totalStars ?? 0} this week
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '3px' }}>
                          💰 ${stats?.dollarsOwed !== undefined ? Number(stats.dollarsOwed).toFixed(2) : '0.00'} owed
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                          🔥 {stats?.streak ?? c.streak_days ?? 0} day streak
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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
                    <div style={{ fontSize: '11px', color: '#8abfba', marginTop: '2px' }}>
                      {childLastSession[c.id] || (c.last_session ? getRelativeTime(c.last_session) : 'No sessions yet')}
                    </div>
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

            {/* Stats period toggle */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: 'rgba(13,43,40,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
              {(['week', 'month', 'all'] as const).map(p => (
                <button key={p} onClick={() => setStatsPeriod(p)} style={{
                  padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: statsPeriod === p ? 'white' : 'transparent',
                  color: statsPeriod === p ? '#0d2b28' : '#5a8a84',
                  boxShadow: statsPeriod === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'All time'}
                </button>
              ))}
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
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#f5a623' }}>⭐ {periodStars !== null ? periodStars : totalStars}</div>
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
                <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#0d2b28' }}>🔥 {periodStreak !== null ? periodStreak : (child?.streak_days || 0)}</div>
              </div>
            </div>

            {/* Reward Settings panel */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              marginBottom: '24px',
            }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '16px', color: '#0d2b28', marginBottom: '4px' }}>💰 Reward settings</div>
              <div style={{ fontSize: '13px', color: '#5a8a84', marginBottom: '16px' }}>
                ⭐ {totalStars} stars = 💰 ${dollarsOwed} earned
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>Stars per $1</label>
                  <input
                    type="number"
                    min={1}
                    value={rewardSettingsDraft.starsPerDollar}
                    onChange={e => setRewardSettingsDraft(prev => ({ ...prev, starsPerDollar: Math.max(1, parseInt(e.target.value) || 1) }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid rgba(13,43,40,0.1)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: '#0d2b28',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '6px' }}>Weekly star cap</label>
                  <input
                    type="number"
                    min={0}
                    placeholder={!rewardSettingsDraft.weeklyStarCap || rewardSettingsDraft.weeklyStarCap === 0 ? 'No cap' : ''}
                    value={rewardSettingsDraft.weeklyStarCap > 0 ? rewardSettingsDraft.weeklyStarCap : ''}
                    onChange={e => setRewardSettingsDraft(prev => ({ ...prev, weeklyStarCap: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid rgba(13,43,40,0.1)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: '#0d2b28',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={rewardSettingsDraft.rewardsPaused}
                  onChange={e => setRewardSettingsDraft(prev => ({ ...prev, rewardsPaused: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#2ec4b6', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#0d2b28', fontWeight: 600 }}>Pause rewards</span>
              </label>

              <button
                onClick={saveRewardSettings}
                disabled={rewardSaving}
                style={{
                  background: rewardSaved ? '#1a9e92' : '#2ec4b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: rewardSaving ? 'default' : 'pointer',
                  transition: 'background 0.15s',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                {rewardSaved ? '✓ Saved!' : rewardSaving ? 'Saving…' : 'Save settings'}
              </button>

              {/* Apply to all children checkbox */}
              {children.length > 1 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={e => setApplyToAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#2ec4b6', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: '#5a8a84', fontWeight: 500 }}>Apply this rate to all my children</span>
                </label>
              )}

              {/* Payout button */}
              <div style={{ marginBottom: '12px' }}>
                <button
                  onClick={handlePayout}
                  disabled={payoutLoading || totalStars === 0 || rewardSettings.rewardsPaused}
                  style={{
                    background: payoutSuccess ? '#1a9e92' : (totalStars === 0 || rewardSettings.rewardsPaused) ? '#c8e6e4' : '#2ec4b6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 20px',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: (payoutLoading || totalStars === 0 || rewardSettings.rewardsPaused) ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {payoutLoading ? (
                    <>
                      <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Processing…
                    </>
                  ) : payoutSuccess ? (
                    '✓ Marked as paid! Stars reset.'
                  ) : (
                    `💰 Mark $${dollarsOwed} as paid →`
                  )}
                </button>
                <p style={{ fontSize: '11px', color: '#8abfba', margin: '6px 0 0' }}>
                  This records a payout in your child&apos;s ledger and resets their balance.
                </p>
              </div>

              <p style={{ fontSize: '11px', color: '#8abfba', margin: 0 }}>
                You set the rate — Earni tracks the stars. When it&apos;s time to pay out, just hand over the cash!
              </p>
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
              sessions.length > 0 ? (
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
              ) : (
                <div style={{
                  display: 'block',
                  background: 'rgba(13,43,40,0.03)',
                  color: '#8abfba',
                  padding: '14px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  marginBottom: '24px',
                  border: '1px dashed rgba(13,43,40,0.10)',
                  cursor: 'not-allowed',
                }}>
                  📊 Print Report
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#8abfba', marginTop: '4px' }}>Complete a session to unlock your first report</div>
                </div>
              )
            )}

            {/* Refer a friend */}
            {referralCode && (
              <ReferAFriend
                referralCode={referralCode}
                copied={referralCopied}
                onCopy={() => {
                  const url = `https://learniapp.co/signup?ref=${referralCode}`
                  navigator.clipboard.writeText(url).then(() => {
                    setReferralCopied(true)
                    track('referral_link_copied', { referral_code: referralCode })
                    setTimeout(() => setReferralCopied(false), 3000)
                  })
                }}
              />
            )}

            {/* Focus areas */}
            <FocusAreas childId={child?.id || ''} childName={child?.name || ''} />

            {/* Safety alerts — shown only when flags exist */}
            {sessionFlags.filter(f => !f.reviewed).length > 0 && (
              <div style={{
                background: '#fff5f5',
                border: '1.5px solid #fed7d7',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '15px', color: '#c53030', marginBottom: '10px' }}>
                  ⚠️ Safety alert — {sessionFlags.filter(f => !f.reviewed).length} flagged response{sessionFlags.filter(f => !f.reviewed).length !== 1 ? 's' : ''}
                </div>
                <p style={{ fontSize: '13px', color: '#744210', marginBottom: '12px', lineHeight: 1.6 }}>
                  Earni’s output moderation flagged the following responses before they were shown to {child?.name}. They were replaced with a safe fallback. Please review.
                </p>
                {sessionFlags.filter(f => !f.reviewed).slice(0, 5).map(flag => (
                  <div key={flag.id} style={{
                    background: 'white',
                    border: '1px solid #fed7d7',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '8px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#c53030', fontWeight: 700, marginBottom: '4px' }}>
                      {new Date(flag.flagged_at).toLocaleString('en-NZ')} · {flag.reason}
                    </div>
                    <div style={{ fontSize: '13px', color: '#744210', fontStyle: 'italic', marginBottom: '8px' }}>
                      &ldquo;{flag.response_excerpt?.slice(0, 200)}&rdquo;
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/parent/flags', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ flagId: flag.id }),
                        })
                        setSessionFlags(prev => prev.map(f => f.id === flag.id ? { ...f, reviewed: true } : f))
                      }}
                      style={{
                        fontSize: '12px', fontWeight: 700,
                        background: 'none', border: '1px solid #c53030',
                        borderRadius: '8px', padding: '4px 12px',
                        color: '#c53030', cursor: 'pointer',
                      }}
                    >
                      Mark as reviewed
                    </button>
                  </div>
                ))}
              </div>
            )}

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

      {/* Inactivity warning banner */}
      {showInactivityWarning && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0d2b28',
          border: '1.5px solid rgba(245,166,35,0.5)',
          borderRadius: '16px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 500,
          maxWidth: '90vw',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '14px', color: '#f5a623', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Still there? You&apos;ll be logged out in 1 minute due to inactivity.
          </span>
          <button
            onClick={() => {
              lastActivityRef.current = Date.now()
              setShowInactivityWarning(false)
            }}
            style={{
              background: '#2ec4b6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Stay logged in
          </button>
        </div>
      )}

      <EarniFAB context="parent_portal" size="parent" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        @media (min-width: 768px) {
          .dashboard-main { max-width: 900px !important; margin: 0 auto !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .dashboard-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .dashboard-child-card { padding: 16px !important; }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

// Refer a Friend component
function ReferAFriend({ referralCode, copied, onCopy }: { referralCode: string; copied: boolean; onCopy: () => void }) {
  const referralUrl = `https://learniapp.co/signup?ref=${referralCode}`
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d2b28, #1a4a44)',
      borderRadius: '16px',
      padding: '20px 22px',
      marginBottom: '20px',
      color: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '22px' }}>🎁</span>
        <div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: '16px' }}>Refer a friend — you both get a free month</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Share your link. When they sign up, we flag you both for a free month on your next bill.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          padding: '9px 12px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}>{referralUrl}</div>
        <button
          onClick={onCopy}
          style={{
            background: copied ? '#1a9e92' : '#2ec4b6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 16px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap' as const,
            transition: 'background 0.15s',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy link'}
        </button>
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
        Your referral code: <span style={{ color: '#2ec4b6', fontWeight: 700, fontFamily: 'monospace' }}>{referralCode}</span>
      </div>
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

  const SUGGESTIONS = ['Times tables', 'Fractions', 'Reading comprehension', 'Spelling', 'Division', 'Decimals', 'Word problems', 'Te Reo Māori', 'Descriptive writing', 'Telling time', 'Saving', 'Spending', 'Budgeting', 'Giving', 'Goals', 'Needs vs wants']
  const unusedSuggestions = SUGGESTIONS.filter(s => !areas.includes(s))

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, color: '#0d2b28', marginBottom: '4px' }}>
        Focus areas for {childName}
      </h3>
      <p style={{ fontSize: '12px', color: '#5a8a84', marginTop: '4px', marginBottom: '12px' }}>
        Earni will prioritise these topics in your child&apos;s lessons and session content.
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
