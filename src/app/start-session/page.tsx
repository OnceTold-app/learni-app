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
    ],
  },
  {
    id: 'spelling',
    emoji: '🔤',
    label: 'Grammar & Spelling',
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
          { id: 'spelling-year-level', label: 'Year level words', desc: 'Words I should know at my level' },
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
          { id: 'grammar-sentences', label: 'Sentence types', desc: 'Simple, compound, complex' },
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
      {
        id: 'money-earning',
        emoji: '💼',
        title: 'Earning & working',
        desc: 'How people earn money',
        options: [
          { id: 'money-jobs', label: 'Jobs & careers', desc: 'How people earn a living' },
          { id: 'money-hourly', label: 'Hourly rates', desc: 'Calculate earnings from hours worked' },
          { id: 'money-business', label: 'Starting a business', desc: 'Revenue, costs, and profit' },
        ],
      },
      {
        id: 'money-budgeting',
        emoji: '📋',
        title: 'Budgeting',
        desc: 'Plan, track, and control your money',
        options: [
          { id: 'budget-pocket-money', label: 'Pocket money planner', desc: 'Make $10 last all week' },
          { id: 'budget-plan-event', label: 'Plan a party on a budget', desc: 'Food, decorations, games — $50 max' },
          { id: 'budget-weekly', label: 'Weekly budget challenge', desc: 'Income vs expenses — can you save?' },
          { id: 'budget-real-life', label: 'Real life budget', desc: 'Rent, food, transport — adulting practice' },
          { id: 'budget-track', label: 'Track your spending', desc: 'Where does your money actually go?' },
        ],
      },
      {
        id: 'money-investing',
        emoji: '📈',
        title: 'Investing',
        desc: 'Make your money work for you',
        options: [
          { id: 'invest-what', label: 'What is investing?', desc: 'Planting seeds that grow into trees' },
          { id: 'invest-compound', label: 'Compound interest magic', desc: 'How $1/day becomes $10,000' },
          { id: 'invest-types', label: 'Types of investments', desc: 'Savings, shares, property, business' },
          { id: 'invest-risk', label: 'Risk vs reward', desc: 'Why some investments pay more' },
          { id: 'invest-kiwisaver', label: 'KiwiSaver deep dive', desc: 'NZ\'s retirement savings plan' },
          { id: 'invest-shares', label: 'The sharemarket', desc: 'What happens when you buy a share' },
          { id: 'invest-first', label: 'Your first $100', desc: 'Where to put your first savings' },
        ],
      },
      {
        id: 'money-goals',
        emoji: '🎯',
        title: 'Goals & dreams',
        desc: 'Who do you want to be?',
        options: [
          { id: 'goals-short', label: '🟢 Short-term goals', desc: 'This week or this term — what are you working toward?' },
          { id: 'goals-medium', label: '🟡 Medium-term goals', desc: 'This year — what do you want to achieve?' },
          { id: 'goals-long', label: '🔵 Long-term goals', desc: '5+ years — who do you want to become?' },
          { id: 'goals-review', label: '🔄 Review my goals', desc: 'Check in — have your goals changed? That\'s okay!' },
          { id: 'goals-dream-job', label: '🚀 Dream job explorer', desc: 'What do you want to be? Let\'s research it' },
          { id: 'goals-saving-for', label: '💰 Savings goal planner', desc: 'Pick something you want and build a plan' },
          { id: 'goals-role-models', label: '⭐ Role models', desc: 'Who inspires you and why?' },
        ],
      },
      {
        id: 'money-smart',
        emoji: '🧠',
        title: 'Smart money',
        desc: 'Tax, debt, and real-world skills',
        options: [
          { id: 'money-tax', label: 'Tax basics (NZ)', desc: 'Why your pay is less than your wage' },
          { id: 'money-debt', label: 'Debt & credit cards', desc: 'Why borrowing costs more' },
          { id: 'money-scams', label: 'Spotting scams', desc: 'If it sounds too good to be true...' },
          { id: 'money-shopping', label: 'Smart shopping', desc: 'Comparing prices and discounts' },
          { id: 'money-inflation', label: 'Inflation', desc: 'Why things cost more every year' },
          { id: 'money-insurance', label: 'Insurance basics', desc: 'Protecting what matters' },
          { id: 'money-income-types', label: '4 ways to earn', desc: 'Employee, self-employed, business owner, investor' },
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
