'use client'

import { useState } from 'react'

const YEAR_LEVELS = Array.from({ length: 13 }, (_, i) => i + 1)

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'mi', label: 'Te Reo Māori' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'zh', label: 'Mandarin' },
  { value: 'hi', label: 'Hindi' },
  { value: 'sm', label: 'Samoan' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
]

const INTERESTS = [
  '⚽ Sports', '🎮 Gaming', '🎨 Art & Drawing', '📖 Reading',
  '🎵 Music', '🐾 Animals', '🍕 Cooking', '🧪 Science',
  '🏗️ Building/Lego', '💃 Dance', '🌿 Nature', '🚀 Space',
]

const PERSONALITIES = [
  { value: 'confident', label: '😎 Confident — charges ahead, likes a challenge' },
  { value: 'careful', label: '🤔 Careful — thinks things through, likes to be sure' },
  { value: 'shy', label: '🦋 Quiet — needs encouragement, takes time to open up' },
  { value: 'energetic', label: '⚡ Energetic — fast-paced, gets bored easily' },
  { value: 'creative', label: '🎨 Creative — loves stories, pictures, different ways of learning' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [pin, setPin] = useState('')
  const [language, setLanguage] = useState('en')
  const [sessionLanguage, setSessionLanguage] = useState('en')
  const [school, setSchool] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [personality, setPersonality] = useState('')
  const [challenges, setChallenges] = useState('')
  const [parentGoals, setParentGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalSteps = 4

  function toggleInterest(interest: string) {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('learni_parent_token')
      if (!token) { window.location.href = '/login'; return }

      const res = await fetch('/api/parent/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name, age: age ? parseInt(age) : null, yearLevel: parseInt(yearLevel),
          pin: pin || '0000', language, sessionLanguage,
          school, interests: selectedInterests, personality, challenges, parentGoals,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add child')

      localStorage.setItem('learni_child_id', data.child.id)
      localStorage.setItem('learni_child_name', data.child.name)
      localStorage.setItem('learni_year_level', String(data.child.year_level))

      window.location.href = '/dashboard'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1.5px solid rgba(13,43,40,0.12)',
    borderRadius: '12px', fontSize: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box' as const, background: 'white',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f7fafa', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: 'clamp(24px, 6vw, 48px)',
        maxWidth: '520px', width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a href="/dashboard" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '20px', fontWeight: 900, color: '#0d2b28', textDecoration: 'none' }}>
            learni<span style={{ color: '#2ec4b6' }}>.</span>
          </a>
          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{
                width: i + 1 === step ? '24px' : '8px', height: '8px',
                borderRadius: '4px', background: i + 1 <= step ? '#2ec4b6' : 'rgba(13,43,40,0.08)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Step 1: The basics */}
        {step === 1 && (
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px', textAlign: 'center' }}>
              Tell us about your child
            </h1>
            <p style={{ color: '#5a8a84', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              Earni uses this to personalise every session
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Child&apos;s first name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lia" required style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Age</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 9" min="4" max="18" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Year level *</label>
                  <select value={yearLevel} onChange={e => setYearLevel(e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select</option>
                    {YEAR_LEVELS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>School <span style={{ color: '#8abfba', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g. Orewa Primary" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>4-digit PIN <span style={{ color: '#8abfba', fontWeight: 400 }}>(for child login)</span></label>
                <input type="text" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="0000" maxLength={4} inputMode="numeric"
                  style={{ ...inputStyle, letterSpacing: '8px', textAlign: 'center', fontSize: '24px', fontFamily: "'Nunito', sans-serif", fontWeight: 900 }} />
              </div>
            </div>

            <button onClick={() => { if (name && yearLevel) setStep(2); else setError('Name and year level are required') }}
              style={nextBtnStyle}>Next →</button>
          </div>
        )}

        {/* Step 2: Language & interests */}
        {step === 2 && (
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px', textAlign: 'center' }}>
              What does {name} love?
            </h1>
            <p style={{ color: '#5a8a84', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              Earni uses interests to make examples relatable
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Language at home</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Earni teaches in</label>
                  <select value={sessionLanguage} onChange={e => setSessionLanguage(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Interests <span style={{ color: '#8abfba', fontWeight: 400 }}>(pick as many as you like)</span></label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {INTERESTS.map(interest => (
                    <button key={interest} onClick={() => toggleInterest(interest)} type="button"
                      style={{
                        padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                        background: selectedInterests.includes(interest) ? 'rgba(46,196,182,0.12)' : '#f7fafa',
                        border: selectedInterests.includes(interest) ? '1.5px solid #2ec4b6' : '1.5px solid rgba(13,43,40,0.06)',
                        color: selectedInterests.includes(interest) ? '#1a9e92' : '#5a8a84',
                        cursor: 'pointer',
                      }}>
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
              <button onClick={() => setStep(3)} style={{ ...nextBtnStyle, flex: 1 }}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 3: How they learn */}
        {step === 3 && (
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px', textAlign: 'center' }}>
              How does {name} learn?
            </h1>
            <p style={{ color: '#5a8a84', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              This helps Earni adapt their teaching style
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Best describes {name}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PERSONALITIES.map(p => (
                    <button key={p.value} onClick={() => setPersonality(p.value)} type="button"
                      style={{
                        padding: '12px 16px', borderRadius: '12px', textAlign: 'left', fontSize: '14px',
                        background: personality === p.value ? 'rgba(46,196,182,0.08)' : 'white',
                        border: personality === p.value ? '1.5px solid #2ec4b6' : '1.5px solid rgba(13,43,40,0.08)',
                        color: '#0d2b28', cursor: 'pointer', fontWeight: personality === p.value ? 600 : 400,
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Any learning challenges? <span style={{ color: '#8abfba', fontWeight: 400 }}>(optional, confidential)</span></label>
                <select value={challenges} onChange={e => setChallenges(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">None / prefer not to say</option>
                  <option value="dyslexia">Dyslexia</option>
                  <option value="dyscalculia">Dyscalculia</option>
                  <option value="adhd">ADHD</option>
                  <option value="asd">Autism spectrum</option>
                  <option value="anxiety">Maths/test anxiety</option>
                  <option value="esl">English as second language</option>
                  <option value="other">Other</option>
                </select>
                <p style={{ fontSize: '11px', color: '#8abfba', marginTop: '4px' }}>Earni adapts pacing, visuals, and encouragement for neurodiverse learners.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
              <button onClick={() => setStep(4)} style={{ ...nextBtnStyle, flex: 1 }}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 4: Parent goals */}
        {step === 4 && (
          <div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: '#0d2b28', marginBottom: '4px', textAlign: 'center' }}>
              What matters to you?
            </h1>
            <p style={{ color: '#5a8a84', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
              What do you want Earni to help {name} with?
            </p>

            <div>
              <label style={labelStyle}>Your goal for {name} <span style={{ color: '#8abfba', fontWeight: 400 }}>(optional)</span></label>
              <textarea value={parentGoals} onChange={e => setParentGoals(e.target.value)}
                placeholder={`e.g. "Lia struggles with fractions and needs to build confidence in maths before high school" or "I want Demi to enjoy learning — she says she hates school"`}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontSize: '14px', lineHeight: 1.6 }} />
            </div>

            <div style={{
              background: '#f7fafa', borderRadius: '14px', padding: '16px', marginTop: '20px',
              border: '1px solid rgba(13,43,40,0.04)',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d2b28', marginBottom: '8px' }}>Here&apos;s what happens next:</div>
              <ol style={{ paddingLeft: '18px', fontSize: '13px', color: '#5a8a84', lineHeight: 1.8, margin: 0 }}>
                <li>{name} picks a username and designs their avatar</li>
                <li>A quick baseline test finds their exact level (5 min)</li>
                <li>Earni starts teaching from where they are — not too easy, not too hard</li>
              </ol>
            </div>

            {error && <p style={{ color: '#e53e3e', fontSize: '14px', margin: '12px 0 0' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
              <button onClick={handleSubmit} disabled={loading} style={{ ...nextBtnStyle, flex: 1 }}>
                {loading ? 'Setting up...' : `Add ${name} & go to Hub →`}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#8abfba' }}>
          Step {step} of {totalSteps} · All information is private and never shared
        </p>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600 as const, color: '#0d2b28', marginBottom: '6px' }
const nextBtnStyle: React.CSSProperties = {
  width: '100%', padding: '16px', background: '#2ec4b6', color: 'white', border: 'none',
  borderRadius: '30px', fontFamily: "'Nunito', sans-serif", fontSize: '17px', fontWeight: 900,
  cursor: 'pointer', marginTop: '24px', boxShadow: '0 6px 20px rgba(46,196,182,0.3)',
}
const backBtnStyle: React.CSSProperties = {
  padding: '16px 20px', background: '#f7fafa', color: '#5a8a84', border: '1px solid rgba(13,43,40,0.06)',
  borderRadius: '30px', fontFamily: "'Nunito', sans-serif", fontSize: '15px', fontWeight: 700,
  cursor: 'pointer', marginTop: '24px',
}
