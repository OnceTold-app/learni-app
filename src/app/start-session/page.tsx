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

interface SubjectGroup {
  id: string
  emoji: string
  label: string
  categories: Category[]
}

const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    id: 'maths',
    emoji: '🔢',
    label: 'Maths',
    categories: [
      {
        id: 'homework',
        emoji: '📸',
        title: 'Homework help',
        desc: 'Take a photo — Earni helps you understand',
        action: '/homework',
      },
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
          { id: 'counting-in-2s', label: 'Counting in 2s', desc: 'Skip counting by 2' },
          { id: 'counting-in-5s', label: 'Counting in 5s', desc: 'Skip counting by 5' },
          { id: 'counting-in-10s', label: 'Counting in 10s', desc: 'Skip counting by 10' },
          { id: 'counting-in-3s', label: 'Counting in 3s', desc: 'Skip counting by 3' },
          { id: 'counting-in-4s', label: 'Counting in 4s', desc: 'Skip counting by 4' },
          { id: 'counting-in-6s', label: 'Counting in 6s', desc: 'Skip counting by 6' },
          { id: 'counting-in-7s', label: 'Counting in 7s', desc: 'Skip counting by 7' },
          { id: 'counting-in-8s', label: 'Counting in 8s', desc: 'Skip counting by 8' },
          { id: 'counting-in-9s', label: 'Counting in 9s', desc: 'Skip counting by 9' },
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
        ],
      },
      {
        id: 'full',
        emoji: '🚀',
        title: 'Full session',
        desc: 'Warm up → Lesson → Money smarts → Recap → Stars',
        action: '/session',
      },

    ],
  },
  {
    id: 'spelling',
    emoji: '✏️',
    label: 'Reading & Writing',
    categories: [
      {
        id: 'spelling-main',
        emoji: '🔤',
        title: 'Spelling',
        desc: 'Master tricky words and patterns',
        options: [
          { id: 'spelling-common', label: 'Common words', desc: 'High-frequency word lists' },
          { id: 'spelling-patterns', label: 'Spelling patterns', desc: 'Rules and exceptions' },
          { id: 'spelling-homophones', label: 'Homophones', desc: 'There/their/they\'re and more' },
        ],
      },
      {
        id: 'grammar-main',
        emoji: '📝',
        title: 'Grammar',
        desc: 'Nouns, verbs, punctuation and more',
        options: [
          { id: 'grammar-nouns-verbs', label: 'Nouns & verbs', desc: 'The building blocks of sentences' },
          { id: 'grammar-adjectives', label: 'Adjectives & adverbs', desc: 'Describing words' },
          { id: 'grammar-punctuation', label: 'Punctuation', desc: 'Full stops, commas, apostrophes' },
          { id: 'grammar-tense', label: 'Tense', desc: 'Past, present, future' },
        ],
      },
    ],
  },
  {
    id: 'money',
    emoji: '💰',
    label: 'Money & Life',
    categories: [
      {
        id: 'money-basics',
        emoji: '🪙',
        title: 'Money basics',
        desc: 'Coins, notes, counting money',
        options: [
          { id: 'money-coins', label: 'Coins & notes', desc: 'Recognise NZ money' },
          { id: 'money-counting', label: 'Counting money', desc: 'Adding up coins and notes' },
          { id: 'money-change', label: 'Making change', desc: 'How much change do I get?' },
        ],
      },
      {
        id: 'money-saving',
        emoji: '🐷',
        title: 'Saving & budgeting',
        desc: 'The 3-jar system and saving goals',
        options: [
          { id: 'money-3jars', label: 'The 3-jar system', desc: 'Save, Spend, Give' },
          { id: 'money-goals', label: 'Saving goals', desc: 'Save up for something you want' },
          { id: 'money-budget', label: 'My first budget', desc: 'Plan how to spend $20' },
          { id: 'money-wants-needs', label: 'Wants vs needs', desc: 'What do you really need?' },
        ],
      },
    ],
  },
]

// Flatten all categories for backwards compatibility
const CATEGORIES: Category[] = SUBJECT_GROUPS.flatMap(g => g.categories)

export default function StartSessionPage() {
  const [childName, setChildName] = useState('')
  const [activeSubject, setActiveSubject] = useState<string>('maths')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
  }, [])

  function startSession(topicId: string, mode: string, subjectLabel: string) {
    localStorage.setItem('learni_session_mode', mode)
    localStorage.setItem('learni_session_topic', topicId)
    localStorage.setItem('learni_subject', subjectLabel)
    window.location.href = '/session'
  }

  const activeGroup = SUBJECT_GROUPS.find(g => g.id === activeSubject) || SUBJECT_GROUPS[0]

  // Sort practice options by year-level relevance
  function sortPracticeOptions(options: Array<{id: string, label: string, desc?: string}>) {
    const yr = typeof window !== 'undefined' ? parseInt(localStorage.getItem('learni_year_level') || '5') : 5
    // Define approximate year level for each topic
    const topicYearLevel: Record<string, number> = {
      'counting-in-2s': 1, 'counting-in-5s': 1, 'counting-in-10s': 1,
      'addition-1-10': 1, 'subtraction-1-10': 1,
      'counting-in-3s': 2, 'counting-in-4s': 2, 'counting-in-6s': 2,
      'counting-in-7s': 2, 'counting-in-8s': 2, 'counting-in-9s': 2,
      'addition-1-20': 2, 'subtraction-1-20': 2,
      'addition-1-100': 3, 'subtraction-1-100': 3,
      'times-2-5-10': 3, 'times-3-4-6': 4, 'times-7-8-9': 4, 'times-all': 4,
      'division-basic': 5, 'fractions-basic': 4, 'fractions-add': 6,
      'decimals': 6, 'percentages': 7,
    }
    return [...options].sort((a, b) => {
      const aYr = topicYearLevel[a.id] || 5
      const bYr = topicYearLevel[b.id] || 5
      // Show closest to child's year level first
      return Math.abs(aYr - yr) - Math.abs(bYr - yr)
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28 0%, #143330 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '16px 16px 80px',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <a href="/kid-hub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Back</a>

        <h1 style={{
          fontFamily: "'Nunito', sans-serif", fontSize: '22px', fontWeight: 900,
          color: 'white', marginTop: '12px', marginBottom: '4px',
        }}>
          What do you want to do, {childName}?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '20px' }}>
          Pick a subject, then choose your activity.
        </p>

        {/* Subject tabs */}
        <div className="hide-scrollbar" style={{
          display: 'flex', gap: '8px', marginBottom: '20px',
          overflowX: 'auto', paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}>
          {SUBJECT_GROUPS.map(group => (
            <button
              key={group.id}
              onClick={() => { setActiveSubject(group.id); setSelectedCategory(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '30px', border: 'none',
                cursor: 'pointer', flexShrink: 0, fontSize: '13px', fontWeight: 700,
                background: activeSubject === group.id ? '#2ec4b6' : 'rgba(255,255,255,0.07)',
                color: activeSubject === group.id ? 'white' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              <span>{group.emoji}</span> {group.label}
            </button>
          ))}
        </div>

        {!selectedCategory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeGroup.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.action) {
                    if (cat.id === 'full') {
                      localStorage.setItem('learni_session_mode', 'full')
                      localStorage.setItem('learni_subject', activeGroup.label)
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
                  borderRadius: '16px', padding: '16px 18px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s', width: '100%',
                }}
              >
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{cat.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 900, color: 'white' }}>{cat.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{cat.desc}</div>
                </div>
                {cat.options && (
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '16px', flexShrink: 0 }}>→</span>
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
              ← Back
            </button>

            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: 'white', marginBottom: '14px' }}>
              {selectedCategory.emoji} {selectedCategory.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCategory.options?.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => startSession(opt.id, selectedCategory.id, `${activeGroup.label} — ${opt.label}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '14px 16px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{opt.label}</div>
                    {opt.desc && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{opt.desc}</div>}
                  </div>
                  <span style={{ color: '#2ec4b6', fontSize: '13px', fontWeight: 800, flexShrink: 0, marginLeft: '8px' }}>Start →</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
