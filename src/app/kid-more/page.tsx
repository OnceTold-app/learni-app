'use client'
import { useState, useEffect } from 'react'
import EarniFAB from '@/components/earni-fab'

interface LedgerEntry {
  id: string
  type: string
  stars: number
  dollar_value: number | null
  note: string | null
  created_at: string
  session_id: string | null
}

export default function KidMorePage() {
  const [childName, setChildName] = useState('')
  const [username, setUsername] = useState('')
  const [childId, setChildId] = useState('')
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [earningsExpanded, setEarningsExpanded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [starsPerDollar, setStarsPerDollar] = useState(20)
  const [showHelp, setShowHelp] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('learni_child_id')
    const name = localStorage.getItem('learni_child_name') || ''
    const uname = localStorage.getItem('learni_child_username') || ''
    const audio = localStorage.getItem('learni_audio_enabled')
    if (!id || !name) { window.location.href = '/login'; return }
    setChildId(id)
    setChildName(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
    setUsername(uname || name)
    setAudioEnabled(audio !== 'false')
    fetchLedger(id)

    // Get reward rate
    const parentToken = localStorage.getItem('learni_parent_token')
    if (parentToken) {
      fetch(`/api/parent/reward-settings?childId=${id}`, {
        headers: { 'Authorization': `Bearer ${parentToken}` },
      }).then(r => r.json()).then(d => {
        if (d.starsPerDollar > 0) setStarsPerDollar(d.starsPerDollar)
      }).catch(() => {})
    }
  }, [])

  async function fetchLedger(id: string) {
    try {
      const res = await fetch(`/api/kid/ledger?childId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setLedger((data.ledger || []).slice(0, 10))
      }
    } catch { /* best effort */ }
    setLoading(false)
  }

  function toggleAudio() {
    const next = !audioEnabled
    setAudioEnabled(next)
    localStorage.setItem('learni_audio_enabled', next ? 'true' : 'false')
  }

  const starsToDollars = (stars: number) => (stars / starsPerDollar).toFixed(2)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28 0%, #143330 50%, #1a3d39 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: '100px',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <a href="/kid-home" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '14px' }}>← Back</a>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: 'white', fontSize: '16px' }}>More</span>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 1. Achievements Card */}
        <a
          href="/kid-hub"
          style={{
            display: 'block',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '20px',
            textDecoration: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🏆</span>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: 'white' }}>Achievements</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Badges, skills &amp; progress</div>
              </div>
            </div>
            <span style={{ fontSize: '18px', color: '#2ec4b6' }}>→</span>
          </div>
        </a>

        {/* 2. Earnings History Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setEarningsExpanded(x => !x)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>💰</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900 }}>Earnings History</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Last 10 star entries</div>
              </div>
            </div>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{earningsExpanded ? '▲' : '▼'}</span>
          </button>

          {earningsExpanded && (
            <div style={{ padding: '0 20px 20px' }}>
              {loading ? (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>Loading…</div>
              ) : ledger.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>No earnings yet. Start a session!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ledger.map((entry, i) => (
                    <div key={entry.id || i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '12px',
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

        {/* 3. Settings Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '28px' }}>⚙️</span>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: 'white' }}>Settings</div>
          </div>

          {/* Username row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '12px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Username</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>@{username || childName}</div>
            </div>
            <a
              href="/kid-welcome"
              style={{
                fontSize: '12px',
                color: '#2ec4b6',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(46,196,182,0.3)',
              }}
            >
              Edit
            </a>
          </div>

          {/* Audio toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>🔊 Earni voice</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {audioEnabled ? 'Earni speaks to you' : 'Silent mode'}
              </div>
            </div>
            <button
              onClick={toggleAudio}
              style={{
                width: '52px',
                height: '30px',
                borderRadius: '15px',
                background: audioEnabled ? '#2ec4b6' : 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: audioEnabled ? '25px' : '3px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        {/* 4. Help Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>💬</span>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: 'white' }}>Help</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Ask Earni anything</div>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              border: 'none',
              borderRadius: '16px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '15px',
              fontWeight: 900,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            💬 Chat with Earni
          </button>
        </div>

      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: '#0d2b28',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        padding: '8px 0 12px',
        zIndex: 100,
      }}>
        {[
          { id: 'home', emoji: '🏠', label: 'Home', href: '/kid-home' },
          { id: 'skills', emoji: '⭐', label: 'Skills', href: '/kid-hub' },
          { id: 'money', emoji: '💰', label: 'Money', href: '/kid-hub' },
          { id: 'more', emoji: '•••', label: 'More', href: '/kid-more' },
        ].map(tab => (
          <a key={tab.id} href={tab.href} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            textDecoration: 'none',
            padding: '6px 0',
          }}>
            <span style={{ fontSize: '22px' }}>{tab.emoji}</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: tab.id === 'more' ? '#2ec4b6' : 'rgba(255,255,255,0.35)',
              fontFamily: "'Nunito', sans-serif",
            }}>{tab.label}</span>
          </a>
        ))}
      </div>

      {showHelp && <EarniFAB context="child_portal" size="child" />}
    </div>
  )
}
