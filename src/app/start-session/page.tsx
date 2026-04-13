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
    id: 'reading',
    emoji: '📖',
    label: 'Reading',
    categories: [
      {
        id: 'reading-comprehension',
        emoji: '🔍',
        title: 'Comprehension',
        desc: 'Read a passage and answer questions',
        options: [
          { id: 'reading-passage-fiction', label: 'Fiction story', desc: 'Characters, plot, setting' },
          { id: 'reading-passage-nonfiction', label: 'Non-fiction', desc: 'Facts, information texts' },
          { id: 'reading-passage-poetry', label: 'Poetry', desc: 'Poems and language patterns' },
        ],
      },
      {
        id: 'reading-inference',
        emoji: '🧠',
        title: 'Inference & Analysis',
        desc: 'Read between the lines',
        options: [
          { id: 'reading-inference-basic', label: 'Basic inference', desc: 'What the text suggests' },
          { id: 'reading-inference-author', label: 'Author\'s purpose', desc: 'Why the author wrote this' },
          { id: 'reading-inference-theme', label: 'Theme & message', desc: 'The big ideas in a text' },
        ],
      },
      {
        id: 'reading-vocabulary',
        emoji: '💬',
        title: 'Vocabulary',
        desc: 'Build word knowledge and meaning',
        options: [
          { id: 'vocab-context', label: 'Words in context', desc: 'Meaning from surrounding text' },
          { id: 'vocab-synonyms', label: 'Synonyms & antonyms', desc: 'Same and opposite meanings' },
          { id: 'vocab-prefixes', label: 'Prefixes & suffixes', desc: 'Word-building skills' },
        ],
      },
    ],
  },
  {
    id: 'writing',
    emoji: '✏️',
    label: 'Writing',
    categories: [
      {
        id: 'writing-descriptive',
        emoji: '🌅',
        title: 'Descriptive writing',
        desc: 'Paint pictures with words',
        options: [
          { id: 'writing-describe-place', label: 'Describe a place', desc: 'Settings and atmosphere' },
          { id: 'writing-describe-person', label: 'Describe a person', desc: 'Character descriptions' },
          { id: 'writing-sensory', label: 'Sensory details', desc: 'Sight, sound, smell, touch, taste' },
        ],
      },
      {
        id: 'writing-creative',
        emoji: '🌟',
        title: 'Creative writing',
        desc: 'Stories, ideas, imagination',
        options: [
          { id: 'writing-story-starter', label: 'Story starter', desc: 'Continue a story prompt' },
          { id: 'writing-character', label: 'Character creation', desc: 'Build a character' },
          { id: 'writing-dialogue', label: 'Dialogue', desc: 'Write a conversation' },
        ],
      },
      {
        id: 'writing-persuasive',
        emoji: '📣',
        title: 'Persuasive writing',
        desc: 'Argue a point with evidence',
        options: [
          { id: 'writing-argument', label: 'Argument structure', desc: 'Point, evidence, explain' },
          { id: 'writing-opinion', label: 'Opinion piece', desc: 'Express a view clearly' },
          { id: 'writing-advertisement', label: 'Advertisement', desc: 'Persuade and hook' },
        ],
      },
      {
        id: 'writing-spelling',
        emoji: '🔤',
        title: 'Spelling',
        desc: 'Master tricky words and patterns',
        options: [
          { id: 'spelling-common', label: 'Common words', desc: 'High-frequency word lists' },
          { id: 'spelling-patterns', label: 'Spelling patterns', desc: 'Rules and exceptions' },
          { id: 'spelling-homophones', label: 'Homophones', desc: 'There/their/they\'re and more' },
        ],
      },
    ],
  },
  {
    id: 'science',
    emoji: '🔬',
    label: 'Science',
    categories: [
      {
        id: 'science-living',
        emoji: '🌿',
        title: 'Living world',
        desc: 'Plants, animals, ecosystems',
        options: [
          { id: 'science-plants', label: 'Plants & photosynthesis', desc: 'How plants grow and make food' },
          { id: 'science-animals', label: 'Animals & habitats', desc: 'Adaptations and ecosystems' },
          { id: 'science-human-body', label: 'Human body', desc: 'Systems and how they work' },
        ],
      },
      {
        id: 'science-physical',
        emoji: '⚡',
        title: 'Physical world',
        desc: 'Forces, electricity, energy',
        options: [
          { id: 'science-forces', label: 'Forces & motion', desc: 'Gravity, friction, push and pull' },
          { id: 'science-electricity', label: 'Electricity & circuits', desc: 'How circuits work' },
          { id: 'science-light-sound', label: 'Light & sound', desc: 'Waves and how we perceive them' },
        ],
      },
      {
        id: 'science-material',
        emoji: '🧪',
        title: 'Material world',
        desc: 'States of matter, chemistry',
        options: [
          { id: 'science-states', label: 'States of matter', desc: 'Solid, liquid, gas' },
          { id: 'science-changes', label: 'Physical vs chemical change', desc: 'What changes and what stays the same' },
          { id: 'science-elements', label: 'Elements & materials', desc: 'Building blocks of matter' },
        ],
      },
      {
        id: 'science-earth',
        emoji: '🌍',
        title: 'Earth & beyond',
        desc: 'Our planet and the universe',
        options: [
          { id: 'science-earth-systems', label: 'Earth systems', desc: 'Weather, water cycle, climate' },
          { id: 'science-solar-system', label: 'Solar system', desc: 'Planets, stars, space' },
          { id: 'science-environment', label: 'Environment & sustainability', desc: 'Caring for our planet' },
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
        ],
      },
    ],
  },
  {
    id: 'te-reo',
    emoji: '🌿',
    label: 'Te Reo Māori',
    categories: [
      {
        id: 'tereo-greetings',
        emoji: '👋',
        title: 'Greetings & phrases',
        desc: 'Kia ora! Learn everyday expressions',
        options: [
          { id: 'tereo-basic-greetings', label: 'Basic greetings', desc: 'Kia ora, Tēnā koe, Mōrena' },
          { id: 'tereo-introductions', label: 'Introductions', desc: 'Ko au, my name is...' },
          { id: 'tereo-feelings', label: 'How are you?', desc: 'Kei te pēhea koe' },
        ],
      },
      {
        id: 'tereo-numbers',
        emoji: '🔢',
        title: 'Numbers (Ngā tau)',
        desc: 'Count in Te Reo Māori',
        options: [
          { id: 'tereo-numbers-1-10', label: 'Tahi to tekau (1-10)', desc: 'Count to ten' },
          { id: 'tereo-numbers-10-100', label: '10 to 100', desc: 'Tekau and beyond' },
          { id: 'tereo-ordinals', label: 'Ordinal numbers', desc: 'First, second, third...' },
        ],
      },
      {
        id: 'tereo-colours',
        emoji: '🎨',
        title: 'Colours (Ngā tae)',
        desc: 'Learn colours in Te Reo',
        options: [
          { id: 'tereo-basic-colours', label: 'Basic colours', desc: 'Red, blue, green and more' },
          { id: 'tereo-colours-context', label: 'Colours in sentences', desc: 'The red kete...' },
        ],
      },
      {
        id: 'tereo-conversation',
        emoji: '💬',
        title: 'Conversation',
        desc: 'Simple everyday kōrero',
        options: [
          { id: 'tereo-classroom', label: 'In the classroom', desc: 'School vocab and phrases' },
          { id: 'tereo-family', label: 'Whānau (family)', desc: 'Family members and relationships' },
          { id: 'tereo-days', label: 'Days & time', desc: 'Days of the week, telling time' },
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
