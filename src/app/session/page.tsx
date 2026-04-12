'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Phase = 'warmup' | 'lesson' | 'financial' | 'closing' | 'reward'

interface SessionState {
  phase: Phase
  phaseLabel: string
  earniSays: string
  question: string | null
  options: string[]
  answer: string
  hint: string | null
  starsEarned: number
  correctCount: number
  totalQuestions: number
  streakCount: number
  personalBest: number
  selectedAnswer: string | null
  isCorrect: boolean | null
  loading: boolean
  sessionStarted: boolean
  showJars: boolean
  jarSave: number
  jarSpend: number
  jarGive: number
  elapsedMinutes: number
}

const PHASE_LABELS: Record<Phase, string> = {
  warmup: '⚡ Rapid Fire — Warm Up',
  lesson: '📚 Main Lesson',
  financial: '💰 Money Smarts',
  closing: '⚡ Rapid Fire — Lock It In',
  reward: '⭐ Stars & Jars',
}

const PHASE_TIMES: Record<Phase, number> = {
  warmup: 4,
  lesson: 15,
  financial: 5,
  closing: 5,
  reward: 3,
}

export default function SessionPage() {
  const childName = typeof window !== 'undefined' ? localStorage.getItem('learni_child_name') || 'Student' : 'Student'
  const yearLevel = typeof window !== 'undefined' ? parseInt(localStorage.getItem('learni_year_level') || '5') : 5
  const subject = typeof window !== 'undefined' ? localStorage.getItem('learni_subject') || 'Maths' : 'Maths'

  const [state, setState] = useState<SessionState>({
    phase: 'warmup',
    phaseLabel: PHASE_LABELS.warmup,
    earniSays: '',
    question: null,
    options: [],
    answer: '',
    hint: null,
    starsEarned: 0,
    correctCount: 0,
    totalQuestions: 0,
    streakCount: 0,
    personalBest: 0,
    selectedAnswer: null,
    isCorrect: null,
    loading: true,
    sessionStarted: false,
    showJars: false,
    jarSave: 50,
    jarSpend: 30,
    jarGive: 20,
    elapsedMinutes: 0,
  })

  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const phaseStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchQuestion = useCallback(async (
    phase: Phase,
    answer?: string,
    currentQuestion?: string,
    currentCorrectAnswer?: string,
  ) => {
    setState(s => ({ ...s, loading: true, selectedAnswer: null, isCorrect: null }))

    try {
      const res = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName,
          yearLevel,
          subject,
          phase,
          drillTopics: phase === 'warmup' ? ['times tables', 'number bonds'] : [subject],
          history: historyRef.current.slice(-8),
          answer,
          currentQuestion,
          currentCorrectAnswer,
          sessionStats: {
            correctCount: state.correctCount,
            totalQuestions: state.totalQuestions,
            streakCount: state.streakCount,
            personalBest: state.personalBest,
            starsEarned: state.starsEarned,
          },
        }),
      })

      const data = await res.json()

      if (data.earniSays) {
        historyRef.current.push({ role: 'assistant', content: JSON.stringify(data) })
      }

      setState(s => ({
        ...s,
        phase,
        phaseLabel: PHASE_LABELS[phase],
        earniSays: data.earniSays || '',
        question: data.question || null,
        options: data.options || [],
        answer: data.answer || '',
        hint: data.hint || null,
        loading: false,
        sessionStarted: true,
        showJars: phase === 'reward',
      }))
    } catch {
      setState(s => ({
        ...s,
        earniSays: "Hmm, I had a hiccup. Let me try that again.",
        loading: false,
      }))
    }
  }, [childName, yearLevel, subject, state.correctCount, state.totalQuestions, state.streakCount, state.personalBest, state.starsEarned])

  // Start session
  useEffect(() => {
    if (!state.sessionStarted) {
      fetchQuestion('warmup')
      phaseStartRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, elapsedMinutes: Math.floor((Date.now() - phaseStartRef.current) / 60000) }))
      }, 10000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Phase transition based on time
  useEffect(() => {
    const phaseElapsed = (Date.now() - phaseStartRef.current) / 60000
    const limit = PHASE_TIMES[state.phase]

    if (phaseElapsed >= limit && state.phase !== 'reward' && !state.loading) {
      const nextPhase: Record<Phase, Phase> = {
        warmup: 'lesson',
        lesson: 'financial',
        financial: 'closing',
        closing: 'reward',
        reward: 'reward',
      }
      const next = nextPhase[state.phase]
      phaseStartRef.current = Date.now()
      historyRef.current = []
      fetchQuestion(next)
    }
  }, [state.elapsedMinutes, state.phase, state.loading, fetchQuestion])

  function handleAnswer(selected: string) {
    if (state.loading || state.selectedAnswer) return

    const isCorrect = selected.toLowerCase().trim() === state.answer.toLowerCase().trim()
    const newStreak = isCorrect ? state.streakCount + 1 : 0
    const newPB = Math.max(state.personalBest, newStreak)
    const newStars = isCorrect ? state.starsEarned + 4 : state.starsEarned

    // Sound effect
    playSound(isCorrect)

    setState(s => ({
      ...s,
      selectedAnswer: selected,
      isCorrect,
      correctCount: isCorrect ? s.correctCount + 1 : s.correctCount,
      totalQuestions: s.totalQuestions + 1,
      streakCount: newStreak,
      personalBest: newPB,
      starsEarned: newStars,
    }))

    // In rapid fire, auto-advance quickly
    const delay = (state.phase === 'warmup' || state.phase === 'closing') ? 800 : 2000

    setTimeout(() => {
      fetchQuestion(state.phase, selected, state.question || '', state.answer)
    }, delay)
  }

  function playSound(correct: boolean) {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (correct) {
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime)
        osc.frequency.setValueAtTime(277, ctx.currentTime + 0.15)
      }
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch { /* Audio not available */ }
  }

  async function handleJarSubmit() {
    // Save session to Supabase
    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: localStorage.getItem('learni_child_id'),
          starsEarned: state.starsEarned,
          correctCount: state.correctCount,
          totalQuestions: state.totalQuestions,
          subjects: [subject],
          duration: Math.floor((Date.now() - phaseStartRef.current) / 1000),
          jarAllocation: { save: state.jarSave, spend: state.jarSpend, give: state.jarGive },
        }),
      })
    } catch { /* Will retry later */ }

    // Redirect to hub or home
    window.location.href = '/dashboard'
  }

  const isRapidFire = state.phase === 'warmup' || state.phase === 'closing'

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>
            {state.phaseLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isRapidFire && state.streakCount > 0 && (
            <span style={{
              background: 'rgba(245,166,35,0.15)',
              border: '1px solid rgba(245,166,35,0.3)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              color: '#f5a623',
            }}>
              🔥 {state.streakCount} in a row
            </span>
          )}
          <span style={{
            background: 'rgba(46,196,182,0.12)',
            border: '1px solid rgba(46,196,182,0.2)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '13px',
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            color: '#2ec4b6',
          }}>
            ⭐ {state.starsEarned}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '24px',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Earni avatar + speech */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 16px',
            boxShadow: '0 0 0 6px rgba(46,196,182,0.1)',
          }}>
            🤖
          </div>
          {state.earniSays && (
            <div style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '14px 20px',
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.55,
              maxWidth: '400px',
              margin: '0 auto',
              fontFamily: "'Nunito', sans-serif",
            }}>
              {state.earniSays}
            </div>
          )}
        </div>

        {/* Question */}
        {state.question && !state.showJars && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: isRapidFire ? '28px' : '22px',
              fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              marginBottom: '20px',
              lineHeight: 1.3,
            }}>
              {state.question}
            </div>

            {/* Answer options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {state.options.map((opt, i) => {
                const isSelected = state.selectedAnswer === opt
                const isCorrectAnswer = opt.toLowerCase().trim() === state.answer.toLowerCase().trim()
                const showResult = state.selectedAnswer !== null

                let bg = 'rgba(255,255,255,0.05)'
                let border = '1.5px solid rgba(255,255,255,0.08)'
                if (showResult && isCorrectAnswer) {
                  bg = 'rgba(46,196,182,0.15)'
                  border = '1.5px solid #2ec4b6'
                } else if (showResult && isSelected && !state.isCorrect) {
                  bg = 'rgba(239,68,68,0.15)'
                  border = '1.5px solid #ef4444'
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={state.loading || state.selectedAnswer !== null}
                    style={{
                      background: bg,
                      border,
                      borderRadius: '14px',
                      padding: '16px 20px',
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: "'Nunito', sans-serif",
                      color: 'white',
                      cursor: state.selectedAnswer ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {opt}
                    {showResult && isCorrectAnswer && <span>✓</span>}
                    {showResult && isSelected && !state.isCorrect && <span>✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Hint */}
            {state.hint && state.selectedAnswer && !state.isCorrect && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#f5a623',
              }}>
                💡 {state.hint}
              </div>
            )}
          </div>
        )}

        {/* Jar allocation (reward phase) */}
        {state.showJars && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '36px',
              fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              color: '#f5a623',
            }}>
              ⭐ {state.starsEarned} stars earned!
            </div>

            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '20px' }}>
              How do you want to split your stars?
            </div>

            {[
              { label: '🐷 Save', key: 'jarSave' as const, color: '#4ade80' },
              { label: '🛍️ Spend', key: 'jarSpend' as const, color: '#ff9080' },
              { label: '💙 Give', key: 'jarGive' as const, color: '#93c5fd' },
            ].map(jar => (
              <div key={jar.key} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: jar.color }}>{jar.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{state[jar.key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state[jar.key]}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    const others = 100 - val
                    if (jar.key === 'jarSave') setState(s => ({ ...s, jarSave: val, jarSpend: Math.round(others * s.jarSpend / (s.jarSpend + s.jarGive || 1)), jarGive: others - Math.round(others * s.jarSpend / (s.jarSpend + s.jarGive || 1)) }))
                    if (jar.key === 'jarSpend') setState(s => ({ ...s, jarSpend: val, jarSave: Math.round(others * s.jarSave / (s.jarSave + s.jarGive || 1)), jarGive: others - Math.round(others * s.jarSave / (s.jarSave + s.jarGive || 1)) }))
                    if (jar.key === 'jarGive') setState(s => ({ ...s, jarGive: val, jarSave: Math.round(others * s.jarSave / (s.jarSave + s.jarSpend || 1)), jarSpend: others - Math.round(others * s.jarSave / (s.jarSave + s.jarSpend || 1)) }))
                  }}
                  style={{ width: '100%', accentColor: jar.color }}
                />
              </div>
            ))}

            <button
              onClick={handleJarSubmit}
              style={{
                width: '100%',
                padding: '16px',
                background: '#2ec4b6',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '18px',
                fontWeight: 900,
                cursor: 'pointer',
                marginTop: '12px',
              }}
            >
              Save & finish session →
            </button>
          </div>
        )}

        {/* Loading state */}
        {state.loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '14px',
          }}>
            <div style={{
              display: 'flex',
              gap: '3px',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '4px',
                  height: '16px',
                  background: '#2ec4b6',
                  borderRadius: '2px',
                  animation: `pulse${i} 1s ease-in-out infinite`,
                }} />
              ))}
            </div>
            Earni is thinking...
          </div>
        )}

        {/* Personal best notification */}
        {isRapidFire && state.streakCount > 0 && state.streakCount === state.personalBest && state.streakCount > 3 && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(245,166,35,0.9)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 4px 20px rgba(245,166,35,0.4)',
            zIndex: 100,
          }}>
            🏆 NEW PERSONAL BEST — {state.streakCount} in a row!
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        @keyframes pulse0 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.3)} }
        @keyframes pulse1 { 0%,100%{transform:scaleY(1)} 60%{transform:scaleY(0.3)} }
        @keyframes pulse2 { 0%,100%{transform:scaleY(1)} 70%{transform:scaleY(0.3)} }
      `}</style>
    </div>
  )
}
