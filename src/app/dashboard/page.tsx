'use client'

import { useState, useEffect } from 'react'
import { SkeletonLight, SkeletonStyles } from '@/components/ui/skeleton'
import { track } from '@/lib/posthog'

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
  const [childrenError, setChildrenError] = useState(false)
  const [parentName, setParentName] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralCopied, setReferralCopied] = useState(false)
  const [rewardSettings, setRewardSettings] = useState({ starsPerDollar: 20, weeklyStarCap: 200, rewardsPaused: false })
  const [rewardSettingsDraft, setRewardSettingsDraft] = useState({ starsPerDollar: 20, weeklyStarCap: 200, rewardsPaused: false })
  const [rewardSaving, setRewardSaving] = useState(false)
  const [rewardSaved, setRewardSaved] = useState(false)

  useEffect(() => {
    // Check auth
    const name = localStorage.getItem('learni_parent_name')
    if (!name) {
      window.location.href = '/login'
      return
    }
    setParentName(name)

    // Fetch account status (includes referral code)
    fetch('/api/account/status', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}` }
    })
      .then(r => r.json())
      .then(d => { if (d.referralCode) setReferralCode(d.referralCode) })
      .catch(() => {})

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
    } catch {
      setChildrenError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedChild) {
      fetchSessions(selectedChild)
      fetchRewardSettings(selectedChild)
    }
  }, [selectedChild])

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

  async function saveRewardSettings() {
    if (!selectedChild) return
    setRewardSaving(true)
    try {
      await fetch('/api/parent/reward-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('learni_parent_token')}`,
        },
        body: JSON.stringify({ childId: selectedChild, ...rewardSettingsDraft }),
      })
      setRewardSettings(rewardSettingsDraft)
      setRewardSaved(true)
      setTimeout(() => setRewardSaved(false), 2500)
    } catch { /* */ }
    setRewardSaving(false)
  }

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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
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
                    placeholder="No cap"
                    value={rewardSettingsDraft.weeklyStarCap || ''}
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
                }}
              >
                {rewardSaved ? '✓ Saved!' : rewardSaving ? 'Saving…' : 'Save settings'}
              </button>

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
