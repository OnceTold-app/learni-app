'use client'

import { useState, useEffect } from 'react'
import EarniFAB from '@/components/earni-fab'

interface Category {
  id: string
  emoji: string
  title: string
  desc: string
  options?: SubOption[]
  pillGroups?: PillGroup[]
  action?: string // direct route
}

interface SubOption {
  id: string
  label: string
  desc?: string
}

interface PillGroup {
  label: string
  elite?: boolean
  chips: Array<{ id: string; label: string }>
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
        id: 'practice',
        emoji: '💪',
        title: 'Practice',
        desc: 'Drill what you already know',
        pillGroups: [
          {
            label: 'COUNTING',
            chips: [
              { id: 'counting-2s', label: '2s' },
              { id: 'counting-5s', label: '5s' },
              { id: 'counting-10s', label: '10s' },
              { id: 'counting-3s', label: '3s' },
              { id: 'counting-4s', label: '4s' },
              { id: 'counting-6s', label: '6s' },
              { id: 'counting-7s', label: '7s' },
              { id: 'counting-8s', label: '8s' },
              { id: 'counting-9s', label: '9s' },
            ],
          },
          {
            label: 'ADDITION',
            chips: [
              { id: 'addition-1-10', label: '1-10' },
              { id: 'addition-11-20', label: '11-20' },
              { id: 'addition-21-50', label: '21-50' },
              { id: 'addition-51-100', label: '51-100' },
              { id: 'addition-101-500', label: '101-500' },
              { id: 'addition-501-1000', label: '501-1K' },
            ],
          },
          {
            label: 'SUBTRACTION',
            chips: [
              { id: 'subtraction-1-10', label: '1-10' },
              { id: 'subtraction-11-20', label: '11-20' },
              { id: 'subtraction-21-50', label: '21-50' },
              { id: 'subtraction-51-100', label: '51-100' },
              { id: 'subtraction-101-500', label: '101-500' },
              { id: 'subtraction-501-1000', label: '501-1K' },
            ],
          },
          {
            label: 'TIMES TABLES',
            chips: [
              { id: 'times-2', label: '×2' },
              { id: 'times-3', label: '×3' },
              { id: 'times-4', label: '×4' },
              { id: 'times-5', label: '×5' },
              { id: 'times-6', label: '×6' },
              { id: 'times-7', label: '×7' },
              { id: 'times-8', label: '×8' },
              { id: 'times-9', label: '×9' },
              { id: 'times-10', label: '×10' },
              { id: 'times-11', label: '×11' },
              { id: 'times-12', label: '×12' },
            ],
          },
          {
            label: 'DIVISION',
            chips: [
              { id: 'division-2', label: '÷2' },
              { id: 'division-3', label: '÷3' },
              { id: 'division-4', label: '÷4' },
              { id: 'division-5', label: '÷5' },
              { id: 'division-6', label: '÷6' },
              { id: 'division-7', label: '÷7' },
              { id: 'division-8', label: '÷8' },
              { id: 'division-9', label: '÷9' },
              { id: 'division-10', label: '÷10' },
              { id: 'division-11', label: '÷11' },
              { id: 'division-12', label: '÷12' },
            ],
          },
          {
            label: '⭐ ELITE',
            elite: true,
            chips: [
              { id: 'addition-1001-10000', label: '1K-10K' },
              { id: 'addition-10001-100000', label: '11K-100K' },
              { id: 'addition-100001-1000000', label: '100K-1M' },
            ],
          },
        ],
      },

      {
        id: 'full',
        emoji: '',
        title: 'Start with Earni',
        desc: 'Earni checks in with you first, then teaches.',
        action: '/kid-checkin',
      },

    ],
  },
  {
    id: 'spelling',
    emoji: '✏️',
    label: 'Reading & Writing',
    categories: [
      {
        id: 'practice',
        emoji: '💪',
        title: 'Practice',
        desc: 'Drill comprehension, writing & spelling',
        pillGroups: [
          {
            label: 'COMPREHENSION',
            chips: [
              { id: 'reading-inference', label: 'Story inference' },
              { id: 'reading-main-idea', label: 'Main idea' },
              { id: 'reading-vocabulary', label: 'Vocabulary in context' },
              { id: 'reading-authors-purpose', label: "Author's purpose" },
            ],
          },
          {
            label: 'WRITING',
            chips: [
              { id: 'writing-descriptive', label: 'Descriptive' },
              { id: 'writing-creative', label: 'Creative' },
              { id: 'writing-persuasive', label: 'Persuasive' },
              { id: 'writing-narrative', label: 'Narrative' },
            ],
          },
          {
            label: 'SPELLING',
            chips: [
              { id: 'spelling-yr1-2', label: 'Year 1-2 words' },
              { id: 'spelling-yr3-4', label: 'Year 3-4 words' },
              { id: 'spelling-yr5-6', label: 'Year 5-6 words' },
              { id: 'spelling-yr7-8', label: 'Year 7-8 words' },
              { id: 'spelling-yr9-10', label: 'Year 9-10 words' },
            ],
          },
        ],
      },
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
        id: 'practice',
        emoji: '💪',
        title: 'Practice',
        desc: 'Vault lessons — Save, Give, and Goal jars',
        pillGroups: [
          {
            label: 'MONEY BASICS',
            chips: [
              { id: 'what-is-saving', label: 'What is Saving?' },
              { id: 'spending-wisely', label: 'Spending Wisely' },
              { id: 'setting-a-goal', label: 'Setting a Goal' },
              { id: 'giving-and-why', label: 'Giving and Why It Matters' },
            ],
          },
        ],
      },
      {
        id: 'money-vault',
        emoji: '🏛️',
        title: 'Money Vault lessons',
        desc: 'Unlock your vault — Save, Give, and Goal jars',
        options: [
          { id: 'what-is-saving', label: 'What is Saving?', desc: 'Unlock your Save jar' },
          { id: 'spending-wisely', label: 'Spending Wisely', desc: 'Part 1 of unlocking your Goal jar' },
          { id: 'setting-a-goal', label: 'Setting a Goal', desc: 'Unlock your Goal jar' },
          { id: 'giving-and-why', label: 'Giving and Why It Matters', desc: 'Unlock your Give impact page' },
        ],
      },
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
  const [yearLevel, setYearLevel] = useState(5)
  const [activeSubject, setActiveSubject] = useState<string>('maths')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const [foundationsExpanded, setFoundationsExpanded] = useState(false)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || 'Student')
    setYearLevel(parseInt(localStorage.getItem('learni_year_level') || '5'))
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
                {(cat.options || cat.pillGroups) && (
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

            <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>
              {selectedCategory.emoji} {selectedCategory.title}
            </h2>

            {/* Pill/chip layout for practice categories */}
            {selectedCategory.pillGroups ? (
              <div style={{ paddingBottom: '8px' }}>
                {activeSubject === 'maths' && yearLevel >= 7 ? (
                  /* Year 7+ special ordering: advanced content first, foundations collapsed */
                  <>
                    <div style={{
                      fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                      padding: '10px 14px', marginBottom: '8px', marginTop: '8px',
                      fontFamily: "'Nunito', sans-serif",
                    }}>
                      For algebra, statistics, and geometry — use &lsquo;Start with Earni&rsquo;
                    </div>
                    {selectedCategory.pillGroups
                      .filter(g => !g.label.includes('COUNTING'))
                      .map(group => {
                        // Filter to tier 2 only for ADDITION and SUBTRACTION
                        const tier2Ids = [
                          'addition-101-500', 'addition-501-1000',
                          'subtraction-101-500', 'subtraction-501-1000',
                        ]
                        const chips = (group.label === 'ADDITION' || group.label === 'SUBTRACTION')
                          ? group.chips.filter(c => tier2Ids.includes(c.id))
                          : group.chips
                        if (chips.length === 0) return null
                        return (
                          <div key={group.label}>
                            <div style={{
                              fontSize: '11px', fontWeight: 800,
                              color: group.elite ? 'rgba(245,166,35,0.6)' : 'rgba(255,255,255,0.35)',
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                              marginBottom: '8px', marginTop: '16px',
                            }}>{group.label}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {chips.map(chip => (
                                <button key={chip.id}
                                  onClick={() => startSession(chip.id, 'practice', `${activeGroup.label} — ${chip.label}`)}
                                  style={{
                                    padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                                    background: group.elite ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.06)',
                                    border: group.elite ? '1.5px solid rgba(245,166,35,0.3)' : '1.5px solid rgba(255,255,255,0.12)',
                                    color: group.elite ? '#f5a623' : 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                                  }}
                                >{chip.label}</button>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    }
                    {/* Foundations expandable — tier 1 addition & subtraction */}
                    <div style={{ marginTop: '20px' }}>
                      <button
                        onClick={() => setFoundationsExpanded(f => !f)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px', padding: '8px 14px',
                          fontSize: '12px', fontWeight: 700,
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}
                      >
                        Foundations {foundationsExpanded ? '▲' : '▼'}
                      </button>
                      {foundationsExpanded && (
                        <>
                          {['ADDITION', 'SUBTRACTION'].map(label => {
                            const group = selectedCategory.pillGroups!.find(g => g.label === label)
                            if (!group) return null
                            const tier1Ids = [
                              'addition-1-10', 'addition-11-20', 'addition-21-50', 'addition-51-100',
                              'subtraction-1-10', 'subtraction-11-20', 'subtraction-21-50', 'subtraction-51-100',
                            ]
                            const tier1Chips = group.chips.filter(c => tier1Ids.includes(c.id))
                            return (
                              <div key={label}>
                                <div style={{
                                  fontSize: '11px', fontWeight: 800,
                                  color: 'rgba(255,255,255,0.25)',
                                  textTransform: 'uppercase', letterSpacing: '0.08em',
                                  marginBottom: '8px', marginTop: '12px',
                                }}>{label}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {tier1Chips.map(chip => (
                                    <button key={chip.id}
                                      onClick={() => startSession(chip.id, 'practice', `${activeGroup.label} — ${chip.label}`)}
                                      style={{
                                        padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1.5px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                                      }}
                                    >{chip.label}</button>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  /* Standard ordering for Year 1-6 */
                  selectedCategory.pillGroups.map(group => (
                    <div key={group.label}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '8px',
                        marginTop: '16px',
                      }}>
                        {group.label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {group.chips.map(chip => (
                          <button
                            key={chip.id}
                            onClick={() => startSession(chip.id, 'practice', `${activeGroup.label} — ${chip.label}`)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 700,
                              background: group.elite ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.06)',
                              border: group.elite ? '1.5px solid rgba(245,166,35,0.3)' : '1.5px solid rgba(255,255,255,0.12)',
                              color: group.elite ? '#f5a623' : 'rgba(255,255,255,0.7)',
                              cursor: 'pointer',
                              fontFamily: "'Nunito', sans-serif",
                            }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Flat list layout for non-practice categories */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
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
            )}
          </div>
        )}
      </div>
      <EarniFAB context="child_portal" size="child" />
    </div>
  )
}

