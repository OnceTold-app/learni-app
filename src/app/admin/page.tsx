'use client'

import { useState, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Report = any

export default function AdminPage() {
  const [report, setReport] = useState<Report>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('learni_parent_token')
        const res = await fetch('/api/admin/report?secret=momentum2026', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('Unauthorized')
        setReport(await res.json())
      } catch {
        setError('Access denied. Admin only.')
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={pageStyle}><div style={cardStyle}>Loading report...</div></div>
  if (error) return <div style={pageStyle}><div style={cardStyle}>{error}</div></div>
  if (!report) return null

  const { overview, sessions, stars, revenue, learners, accounts } = report

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px' }}>
              Learni Admin Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: '#5a8a84' }}>
              Generated: {new Date(report.generated).toLocaleString('en-NZ')}
            </p>
          </div>
          <a href="/dashboard" style={{ fontSize: '13px', color: '#2ec4b6', textDecoration: 'none' }}>← Parent Hub</a>
        </div>

        {/* Overview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <MetricCard label="Total Accounts" value={overview.totalAccounts} color="#0d2b28" />
          <MetricCard label="Active Subscribers" value={overview.activeSubscribers} color="#22c55e" />
          <MetricCard label="Trialing" value={overview.trialing} color="#f5a623" />
          <MetricCard label="Trial Expired" value={overview.trialExpired} color="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <MetricCard label="Total Learners" value={overview.totalLearners} color="#2ec4b6" />
          <MetricCard label="Active This Week" value={overview.activeLearners} color="#8b5cf6" />
          <MetricCard label="New This Week" value={overview.newThisWeek} color="#3b82f6" />
          <MetricCard label="New This Month" value={overview.newThisMonth} color="#0d2b28" />
        </div>

        {/* Session metrics */}
        <h2 style={h2Style}>Sessions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <MetricCard label="Today" value={sessions.today} sub={`${sessions.minutesToday} min`} color="#2ec4b6" />
          <MetricCard label="This Week" value={sessions.thisWeek} sub={`${sessions.minutesThisWeek} min`} color="#3b82f6" />
          <MetricCard label="All Time" value={sessions.allTime} color="#0d2b28" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <MetricCard label="Avg Accuracy" value={sessions.avgAccuracyWeek} color="#22c55e" />
          <MetricCard label="Total Stars" value={stars.totalEarned} color="#f5a623" />
          <MetricCard label="Trial Conversion" value={revenue.trialConversionRate} color="#8b5cf6" />
        </div>

        {/* Revenue */}
        <h2 style={h2Style}>Revenue</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <MetricCard label="Active Subscribers" value={revenue.activeSubscribers} color="#22c55e" />
          <MetricCard label="Est. MRR" value={revenue.estimatedMRR} color="#2ec4b6" />
          <MetricCard label="Conversion Rate" value={revenue.trialConversionRate} color="#8b5cf6" />
        </div>

        {/* Learner breakdown */}
        <h2 style={h2Style}>Learners</h2>
        <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f7fafa', textAlign: 'left' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Year</th>
                <th style={thStyle}>Sessions (week)</th>
                <th style={thStyle}>Stars (week)</th>
                <th style={thStyle}>Topics</th>
                <th style={thStyle}>Mastered</th>
                <th style={thStyle}>Baseline</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((l: Report) => (
                <tr key={l.name} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={tdStyle}>{l.name}</td>
                  <td style={tdStyle}>Y{l.yearLevel}</td>
                  <td style={tdStyle}>{l.sessionsThisWeek}</td>
                  <td style={tdStyle}>⭐ {l.starsThisWeek}</td>
                  <td style={tdStyle}>{l.topicsAttempted}</td>
                  <td style={tdStyle}>{l.topicsMastered}</td>
                  <td style={tdStyle}>{l.hasBaseline ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Accounts */}
        <h2 style={h2Style}>Accounts</h2>
        <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f7fafa', textAlign: 'left' }}>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Trial Ends</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: Report) => (
                <tr key={a.email} style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                  <td style={tdStyle}>{a.email}</td>
                  <td style={tdStyle}>{a.name || '—'}</td>
                  <td style={tdStyle}><span style={{
                    padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                    background: a.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,166,35,0.1)',
                    color: a.status === 'active' ? '#22c55e' : '#f5a623',
                  }}>{a.plan}</span></td>
                  <td style={tdStyle}>{a.status}</td>
                  <td style={tdStyle}>{a.trialEnds ? new Date(a.trialEnds).toLocaleDateString('en-NZ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* API endpoint note */}
        <div style={{ fontSize: '12px', color: '#8abfba', textAlign: 'center', marginTop: '20px' }}>
          API: <code>/api/admin/report?secret=momentum2026</code> — use for automated reporting
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: '14px', padding: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a8a84', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#8abfba', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#f7fafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }
const cardStyle: React.CSSProperties = { maxWidth: '500px', margin: '100px auto', padding: '40px', background: 'white', borderRadius: '20px', textAlign: 'center', fontSize: '16px', color: '#5a8a84' }
const h2Style: React.CSSProperties = { fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: '#0d2b28', marginBottom: '12px' }
const thStyle: React.CSSProperties = { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#5a8a84', textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle: React.CSSProperties = { padding: '10px 14px', color: '#0d2b28' }
