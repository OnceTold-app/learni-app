'use client'

import { useState, useEffect } from 'react'
import { SkeletonLight, SkeletonStyles } from '@/components/ui/skeleton'

interface MasteryTopic {
  topic: string
  correct: number
  total: number
  percentage: number
  lastSeen: string
}

export default function ProgressPage() {
  const [childName, setChildName] = useState('')
  const [yearLevel, setYearLevel] = useState(0)
  const [topics, setTopics] = useState<MasteryTopic[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [totalStars, setTotalStars] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const childId = params.get('childId') || localStorage.getItem('learni_child_id')
    if (!childId) { window.location.href = '/dashboard'; return }

    async function load() {
      // Get mastery data
      const masteryRes = await fetch(`/api/kid/mastery?childId=${childId}`)
      const masteryData = await masteryRes.json()

      // Get stats
      const statsRes = await fetch(`/api/kid/stats?childId=${childId}`)
      const statsData = await statsRes.json()

      // Get child info from localStorage or stats
      setChildName(localStorage.getItem('learni_child_name') || 'Student')
      setYearLevel(parseInt(localStorage.getItem('learni_year_level') || '5'))
      setTotalSessions(statsData.sessionCount || 0)
      setTotalStars(statsData.totalStars || 0)
      setTotalMinutes((statsData.sessions || []).reduce((s: number, r: { duration_seconds: number }) => s + (r.duration_seconds || 0), 0) / 60)

      // Process mastery
      const mastery = masteryData.mastery || {}
      const topicList: MasteryTopic[] = Object.entries(mastery).map(([topic, stats]) => {
        const s = stats as { correct: number; total: number; lastSeen: string }
        return {
          topic,
          correct: s.correct || 0,
          total: s.total || 0,
          percentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
          lastSeen: s.lastSeen || '',
        }
      }).sort((a, b) => b.total - a.total)

      setTopics(topicList)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <SkeletonStyles />
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
          <SkeletonLight width={80} height={13} borderRadius={4} style={{ marginBottom: '20px' }} />
          <SkeletonLight width='55%' height={28} borderRadius={8} style={{ marginBottom: '8px' }} />
          <SkeletonLight width='35%' height={14} borderRadius={4} style={{ marginBottom: '28px' }} />
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                <SkeletonLight width='60%' height={24} borderRadius={6} style={{ margin: '0 auto 8px' }} />
                <SkeletonLight width='70%' height={11} borderRadius={4} style={{ margin: '0 auto' }} />
              </div>
            ))}
          </div>
          {/* Topic rows */}
          <SkeletonLight width='30%' height={18} borderRadius={6} style={{ marginBottom: '16px' }} />
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '14px 18px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <SkeletonLight width='35%' height={14} borderRadius={4} />
                <SkeletonLight width={36} height={14} borderRadius={4} />
              </div>
              <SkeletonLight width='100%' height={6} borderRadius={3} style={{ marginBottom: '6px' }} />
              <SkeletonLight width='45%' height={11} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
        <a href="/dashboard" style={{ fontSize: '13px', color: '#5a8a84', textDecoration: 'none' }}>← Back to Hub</a>

        <div style={{ marginTop: '16px', marginBottom: '28px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px' }}>
            {childName}&apos;s Progress Report
          </h1>
          <p style={{ color: '#5a8a84', fontSize: '14px' }}>Year {yearLevel} · Generated {new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Sessions', value: totalSessions, color: '#2ec4b6' },
            { label: 'Stars', value: totalStars, color: '#f5a623' },
            { label: 'Minutes', value: Math.round(totalMinutes), color: '#a78bfa' },
            { label: 'Topics', value: topics.length, color: '#0d2b28' },
          ].map(card => (
            <div key={card.label} style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '11px', color: '#5a8a84', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Topic mastery */}
        <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: '#0d2b28', marginBottom: '16px' }}>
          Topic Mastery
        </h2>

        {topics.length === 0 ? (
          <p style={{ color: '#5a8a84', fontSize: '14px' }}>No topics tracked yet. Complete some sessions to see progress here.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topics.map(t => (
              <div key={t.topic} style={{
                background: 'white', borderRadius: '12px', padding: '14px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0d2b28', textTransform: 'capitalize' }}>{t.topic}</span>
                  <span style={{
                    fontSize: '13px', fontWeight: 800,
                    color: t.percentage >= 80 ? '#22c55e' : t.percentage >= 60 ? '#f5a623' : '#ef4444',
                  }}>
                    {t.percentage}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${t.percentage}%`, height: '100%', borderRadius: '3px',
                    background: t.percentage >= 80 ? '#22c55e' : t.percentage >= 60 ? '#f5a623' : '#ef4444',
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#8abfba', marginTop: '4px' }}>
                  {t.correct}/{t.total} correct · Last practiced {t.lastSeen ? new Date(t.lastSeen).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) : 'never'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Key */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '11px', color: '#8abfba' }}>
          <span>🟢 80%+ Mastered</span>
          <span>🟡 60-79% Developing</span>
          <span>🔴 &lt;60% Needs practice</span>
        </div>

        {/* Print */}
        <button
          onClick={() => window.print()}
          style={{
            marginTop: '28px', padding: '12px 24px', background: '#0d2b28', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          🖨️ Print this report
        </button>
      </div>
    </div>
  )
}
