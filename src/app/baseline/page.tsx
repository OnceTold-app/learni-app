'use client'

import { useState, useEffect, useRef } from 'react'
import MathsVisual from '@/components/maths-visual'

interface BaselineState {
  earniSays: string
  question: string | null
  answer: string
  options: string[]
  inputType: string
  level: number
  levelName: string
  questionNumber: number
  totalAtLevel: number
  visual: Record<string, unknown> | null
  complete: boolean
  results: {
    solidAt: number
    solidName: string
    ceilingAt: number
    ceilingName: string
    startTeachingAt: number
    startTeachingName: string
    strengths: string[]
    gaps: string[]
  } | null
}

export default function BaselinePage() {
  const childName = typeof window !== 'undefined' ? localStorage.getItem('learni_child_name') || 'Student' : 'Student'
  const yearLevel = typeof window !== 'undefined' ? parseInt(localStorage.getItem('learni_year_level') || '5') : 5

  const [state, setState] = useState<BaselineState>({
    earniSays: '', question: null, answer: '', options: [], inputType: 'text',
    level: 0, levelName: '', questionNumber: 0, totalAtLevel: 0, visual: null,
    complete: false, results: null,
  })
  const [typedAnswer, setTypedAnswer] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [wrongAtLevel, setWrongAtLevel] = useState(0)
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  async function fetchQuestion(answer?: string, currentQuestion?: string, currentAnswer?: string, currentLevel?: number, currentWrongAtLevel?: number) {
    setLoading(true)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setTypedAnswer('')

    try {
      const res = await fetch('/api/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName, yearLevel,
          history: historyRef.current.slice(-12),
          answer, currentQuestion, currentAnswer, currentLevel,
          wrongAtLevel: currentWrongAtLevel || 0,
        }),
      })
      const data = await res.json()

      if (data.earniSays) {
        historyRef.current.push({ role: 'assistant', content: JSON.stringify(data) })
      }

      // Reset wrong count when level changes
      if (data.level && data.level !== state.level) setWrongAtLevel(0)
      setState({
        earniSays: data.earniSays || '',
        question: data.question || null,
        answer: data.answer || '',
        options: data.options || [],
        inputType: data.inputType || 'text',
        level: data.level || 0,
        levelName: data.levelName || '',
        questionNumber: data.questionNumber || 0,
        totalAtLevel: data.totalAtLevel || 0,
        visual: data.visual || null,
        complete: data.complete || false,
        results: data.results || null,
      })
      // Speak Earni's response
      if (data.earniSays) {
        speakText(data.earniSays)
      }
    } catch {
      setState(s => ({ ...s, earniSays: "Hmm, let me try that again." }))
    }
    setLoading(false)
  }

  async function speakText(text: string) {
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play().catch(() => {})
    } catch { /* non-fatal */ }
  }

  useEffect(() => { fetchQuestion() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save and redirect when complete
  useEffect(() => {
    if (state.complete && state.results) {
      saveResults()
    }
  }, [state.complete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAnswer(ans: string) {
    if (loading || selectedAnswer) return
    setTypedAnswer('') // clear input immediately
    const correct = ans.toLowerCase().trim() === state.answer.toLowerCase().trim()
    const newWrongAtLevel = correct ? 0 : wrongAtLevel + 1
    setWrongAtLevel(correct ? wrongAtLevel : wrongAtLevel + 1) // reset on level change happens in fetchQuestion response
    setSelectedAnswer(ans)
    setIsCorrect(correct)
    setTotalCount(t => t + 1)
    if (correct) setCorrectCount(c => c + 1)

    setTimeout(() => {
      fetchQuestion(ans, state.question || '', state.answer, state.level)
    }, 1200)
  }

  async function saveResults() {
    if (!state.results) return
    const childId = localStorage.getItem('learni_child_id')
    // Save baseline results to learner profile
    try {
      const token = localStorage.getItem('learni_parent_token')
      // Save to localStorage for kid hub to display immediately
      localStorage.setItem('learni_baseline_level', String(state.results.startTeachingAt))
      localStorage.setItem('learni_baseline_level_name', state.results.startTeachingName)
      localStorage.setItem('learni_baseline_strengths', state.results.strengths.join(', '))
      localStorage.setItem('learni_baseline_gaps', state.results.gaps.join(', '))

      await fetch('/api/parent/update-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          childId,
          updates: {
            baselineResults: state.results,
            baselineLevel: state.results.startTeachingAt,
            baselineLevelName: state.results.startTeachingName,
            baselineDate: new Date().toISOString(),
          }
        }),
      })
    } catch { /* best effort */ }
    window.location.href = '/kid-hub'
  }

  // Progress bar
  const progressPct = state.complete ? 100 : Math.min(((state.level - 1) * 8 + state.questionNumber * 2), 100)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d2b28',
      color: 'white',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>
          🎯 Baseline Assessment
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {state.levelName && (
            <span style={{
              background: 'rgba(46,196,182,0.12)',
              border: '1px solid rgba(46,196,182,0.2)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#2ec4b6',
            }}>
              Level {state.level}: {state.levelName}
            </span>
          )}
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {correctCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', background: '#2ec4b6', width: `${progressPct}%`, transition: 'width 0.5s' }} />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        gap: '24px',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Complete screen */}
        {state.complete && state.results ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>
              All done, {childName}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '28px' }}>
              {state.earniSays}
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '20px',
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Solid foundation</div>
                <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#22c55e' }}>
                  ✅ {state.results.solidName}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>We&apos;ll start teaching from</div>
                <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#2ec4b6' }}>
                  📚 {state.results.startTeachingName}
                </div>
              </div>
              {state.results.strengths.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '6px' }}>Strengths</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {state.results.strengths.map(s => (
                      <span key={s} style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {state.results.gaps.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: '6px' }}>Areas to build</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {state.results.gaps.map(g => (
                      <span key={g} style={{ padding: '4px 10px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '12px', fontSize: '12px', color: '#f5a623', fontWeight: 600 }}>{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={saveResults} style={{
              width: '100%', padding: '18px', background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white', border: 'none', borderRadius: '30px', fontFamily: "'Nunito', sans-serif",
              fontSize: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
            }}>
              Let&apos;s start learning! →
            </button>
          </div>
        ) : (
          <>
            {/* Earni speech */}
            {state.earniSays && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0,
                }}>🤖</div>
                <div style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '14px 18px', fontSize: '16px',
                  fontWeight: 600, lineHeight: 1.5, fontFamily: "'Nunito', sans-serif", flex: 1,
                }}>
                  {state.earniSays}
                </div>
              </div>
            )}

            {/* Visual */}
            {state.visual && (
              <div style={{ width: '100%', maxWidth: '400px' }}>
                <MathsVisual visual={state.visual as { type: string; [key: string]: unknown }} />
              </div>
            )}

            {/* Question */}
            {state.question && (
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '28px', width: '100%', textAlign: 'center',
              }}>
                <div style={{ fontSize: '26px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", marginBottom: '20px' }}>
                  {state.question}
                </div>

                {state.options.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {state.options.map((opt, i) => {
                      const isSelected = selectedAnswer === opt
                      const isCorrectOpt = opt.toLowerCase().trim() === state.answer.toLowerCase().trim()
                      const show = selectedAnswer !== null
                      return (
                        <button key={i} onClick={() => handleAnswer(opt)} disabled={loading || selectedAnswer !== null}
                          style={{
                            background: show && isCorrectOpt ? 'rgba(46,196,182,0.15)' : show && isSelected && !isCorrect ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                            border: show && isCorrectOpt ? '1.5px solid #2ec4b6' : show && isSelected && !isCorrect ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px', padding: '16px 20px', fontSize: '18px', fontWeight: 900,
                            fontFamily: "'Nunito', sans-serif", color: 'white', cursor: selectedAnswer ? 'default' : 'pointer',
                            textAlign: 'left',
                          }}>
                          {opt} {show && isCorrectOpt && '✓'} {show && isSelected && !isCorrect && '✗'}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  selectedAnswer === null ? (
                    <form onSubmit={(e) => { e.preventDefault(); if (typedAnswer.trim()) handleAnswer(typedAnswer.trim()) }} style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" value={typedAnswer} onChange={e => setTypedAnswer(e.target.value)} placeholder="Type your answer..." autoFocus
                        style={{
                          flex: 1, padding: '14px 18px', background: 'rgba(255,255,255,0.08)',
                          border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '14px',
                          fontSize: '20px', fontWeight: 800, fontFamily: "'Nunito', sans-serif",
                          color: 'white', outline: 'none', textAlign: 'center', boxSizing: 'border-box',
                        }} />
                      <button type="submit" disabled={!typedAnswer.trim()}
                        style={{
                          padding: '14px 24px', background: typedAnswer.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.3)',
                          color: 'white', border: 'none', borderRadius: '14px', fontFamily: "'Nunito', sans-serif",
                          fontSize: '16px', fontWeight: 900, cursor: typedAnswer.trim() ? 'pointer' : 'not-allowed',
                        }}>Go</button>
                    </form>
                  ) : (
                    <div style={{
                      padding: '14px 18px',
                      background: isCorrect ? 'rgba(46,196,182,0.15)' : 'rgba(239,68,68,0.15)',
                      border: `1.5px solid ${isCorrect ? '#2ec4b6' : '#ef4444'}`,
                      borderRadius: '14px', fontSize: '20px', fontWeight: 800,
                      fontFamily: "'Nunito', sans-serif", textAlign: 'center',
                    }}>
                      {selectedAnswer} {isCorrect ? '✓' : `✗ → ${state.answer}`}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Skip / I don't know button */}
            {state.question && !selectedAnswer && !loading && (
              <button
                onClick={() => handleAnswer('I don\'t know')}
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                }}
              >
                I don&apos;t know this yet — skip
              </button>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                Earni is thinking...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
