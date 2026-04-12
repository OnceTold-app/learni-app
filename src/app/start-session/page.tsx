'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  emoji: string
  title: string
  desc: string
  options?: SubOption[]
  action?: string // direct route
}

interface SubOption {
  id: string
  label: string
  desc?: string
}

const CATEGORIES: Category[] = [
  {
    id: 'baseline',
    emoji: '🎯',
    title: 'Find my level',
    desc: 'Quick test to see where you\'re at',
    action: '/baseline',
  },
  {
    id: 'practice',
    emoji: '💪',
    title: 'Practice',
    desc: 'Drill what you already know',
    options: [
      { id: 'addition-1-10', label: 'Addition (1-10)', desc: 'Number bonds to 10' },
      { id: 'addition-1-20', label: 'Addition (1-20)', desc: 'Number bonds to 20' },
      { id: 'addition-1-100', label: 'Addition (1-100)', desc: 'Adding bigger numbers' },
      { id: 'subtraction-1-10', label: 'Subtraction (1-10)' },
      { id: 'subtraction-1-20', label: 'Subtraction (1-20)' },
      { id: 'subtraction-1-100', label: 'Subtraction (1-100)' },
      { id: 'times-2-5-10', label: 'Times tables (2, 5, 10)' },
      { id: 'times-3-4-6', label: 'Times tables (3, 4, 6)' },
      { id: 'times-7-8-9', label: 'Times tables (7, 8, 9)' },
      { id: 'times-all', label: 'All times tables (1-12)' },
      { id: 'division-basic', label: 'Division basics' },
      { id: 'fractions-basic', label: 'Fractions (halves, quarters)' },
      { id: 'fractions-add', label: 'Adding fractions' },
      { id: 'decimals', label: 'Decimals' },
      { id: 'percentages', label: 'Percentages' },
    ],
  },
  {
    id: 'learn',
    emoji: '📚',
    title: 'Learn something new',
    desc: 'Earni teaches a new concept step by step',
    options: [
      { id: 'learn-addition', label: 'Addition', desc: 'How to add numbers' },
      { id: 'learn-subtraction', label: 'Subtraction', desc: 'How to take away' },
      { id: 'learn-multiplication', label: 'Multiplication', desc: 'What times tables really mean' },
      { id: 'learn-division', label: 'Division', desc: 'Sharing and grouping' },
      { id: 'learn-fractions', label: 'Fractions', desc: 'Parts of a whole' },
      { id: 'learn-decimals', label: 'Decimals', desc: 'Numbers between numbers' },
      { id: 'learn-percentages', label: 'Percentages', desc: 'Out of 100' },
      { id: 'learn-algebra', label: 'Algebra', desc: 'Finding the unknown' },
      { id: 'learn-geometry', label: 'Shapes & Measurement', desc: 'Area, perimeter, angles' },
      { id: 'learn-statistics', label: 'Statistics', desc: 'Graphs, averages, probability' },
      { id: 'learn-money', label: 'Money & Finance', desc: 'Real-world money skills' },
    ],
  },
  {
    id: 'full',
    emoji: '🚀',
    title: 'Full session',
    desc: 'Warm up → Lesson → Money smarts → Recap → Stars',
    action: '/session',
  },
  {
    id: 'challenge',
    emoji: '⚡',
    title: 'Quick challenge',
    desc: '5-minute rapid fire speed round',
    options: [
      { id: 'challenge-times', label: 'Times tables speed run' },
      { id: 'challenge-mixed', label: 'Mixed maths blitz' },
      { id: 'challenge-mental', label: 'Mental maths challenge' },
    ],
  },
]

export default function StartSessionPage() {
  const [childName, setChildName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
  }, [])

  function startSession(topicId: string, mode: string) {
    // Store session config
    localStorage.setItem('learni_session_mode', mode)
    localStorage.setItem('learni_session_topic', topicId)
    localStorage.setItem('learni_subject', topicId.replace('learn-', '').replace('challenge-', '').replace(/-/g, ' '))
    window.location.href = '/session'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28 0%, #143330 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
      paddingBottom: '80px',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <a href="/kid-hub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Back</a>

        <h1 style={{
          fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900,
          color: 'white', marginTop: '12px', marginBottom: '4px',
        }}>
          What do you want to do, {childName}?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginBottom: '24px' }}>
          Pick an activity and let&apos;s go!
        </p>

        {!selectedCategory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.action) {
                    if (cat.id === 'full') {
                      localStorage.setItem('learni_session_mode', 'full')
                      localStorage.setItem('learni_subject', 'Maths')
                    }
                    window.location.href = cat.action
                  } else {
                    setSelectedCategory(cat)
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '18px 20px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '32px', flexShrink: 0 }}>{cat.emoji}</span>
                <div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: 'white' }}>{cat.title}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{cat.desc}</div>
                </div>
                {cat.options && (
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>→</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}
            >
              ← Back to activities
            </button>

            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '16px' }}>
              {selectedCategory.emoji} {selectedCategory.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCategory.options?.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => startSession(opt.id, selectedCategory.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '14px 18px',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{opt.label}</div>
                    {opt.desc && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{opt.desc}</div>}
                  </div>
                  <span style={{ color: '#2ec4b6', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>Start →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
