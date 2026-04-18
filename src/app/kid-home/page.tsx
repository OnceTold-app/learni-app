'use client'
import { useState, useEffect } from 'react'

export default function KidHomePage() {
  const [childName, setChildName] = useState('')
  const [totalStars, setTotalStars] = useState(0)
  const [starsPerDollar, setStarsPerDollar] = useState(20)
  const [yearLevel, setYearLevel] = useState(5)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    const name = localStorage.getItem('learni_child_name') || ''
    const yl = parseInt(localStorage.getItem('learni_year_level') || '5')
    setChildName(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
    setYearLevel(yl)
    
    // Fetch stars
    const childId = localStorage.getItem('learni_child_id')
    if (childId) {
      fetch(`/api/kid/stats?childId=${childId}`)
        .then(r => r.json())
        .then(d => {
          setTotalStars(d.totalStars || parseInt(localStorage.getItem('learni_cached_stars') || '0'))
        })
        .catch(() => {
          setTotalStars(parseInt(localStorage.getItem('learni_cached_stars') || '0'))
        })
      
      // Get reward rate
      const parentToken = localStorage.getItem('learni_parent_token')
      if (parentToken) {
        fetch(`/api/parent/reward-settings?childId=${childId}`, {
          headers: { 'Authorization': `Bearer ${parentToken}` }
        }).then(r => r.json()).then(d => {
          if (d.starsPerDollar > 0) setStarsPerDollar(d.starsPerDollar)
        }).catch(() => {})
      }
    }
  }, [])

  const dollars = (totalStars / starsPerDollar).toFixed(2)
  const greeting = yearLevel <= 6 ? `Hey ${childName}! 👋` : `Hey ${childName}.`

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d2b28 0%, #143330 100%)', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: 'white', margin: 0 }}>
            {greeting}
          </h1>
          <div style={{ fontSize: '15px', color: '#2ec4b6', fontWeight: 700, marginTop: '4px' }}>
            ⭐ {totalStars.toLocaleString()} = ${dollars}
          </div>
        </div>
        <a href="/kid-avatar" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', textDecoration: 'none' }}>
          🧑
        </a>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 20px 0' }}>
        
        {/* Primary action — Start with Earni */}
        <a
          href="/kid-checkin"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #2ec4b6, #1a9e92)',
            borderRadius: '24px',
            padding: '28px 32px',
            textDecoration: 'none',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(46,196,182,0.35)',
          }}
        >
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 900, color: '#0d2b28', marginBottom: '6px' }}>
            Start with Earni →
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(13,43,40,0.7)', fontWeight: 600 }}>
            Earni picks what to work on with you
          </div>
        </a>

        {/* Secondary actions — 2 tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
          <a
            href="/kid-hub"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '20px',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📸</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Homework help</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Tell Earni what you&apos;re working on</div>
          </a>
          
          <a
            href="/kid-hub"
            onClick={() => { localStorage.setItem('learni_start_mode', 'practice') }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '20px',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>💪</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Practice a skill</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Pick something from your skills</div>
          </a>
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
            <span style={{ fontSize: '10px', fontWeight: 600, color: activeTab === tab.id ? '#2ec4b6' : 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif" }}>{tab.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
