'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import MathsVisual from '@/components/maths-visual'

type Phase = 'warmup' | 'lesson' | 'financial' | 'closing' | 'reward'

interface SessionState {
  phase: Phase
  phaseLabel: string
  earniSays: string
  question: string | null
  visual: Record<string, unknown> | null
  checkIn: string[]
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
  warmup: '⚡ Rapid Fire - Warm Up',
  lesson: '📚 Main Lesson',
  financial: '💰 Money Smarts',
  closing: '⚡ Rapid Fire - Lock It In',
  reward: '⭐ Stars & Jars',
}

const PHASE_TIMES: Record<Phase, number> = {
  warmup: 3,
  lesson: 12,
  financial: 5,
  closing: 5,
  reward: 3,
}

export default function SessionPage() {
  const childName = typeof window !== 'undefined' ? localStorage.getItem('learni_child_name') || 'Student' : 'Student'
  const yearLevel = typeof window !== 'undefined' ? parseInt(localStorage.getItem('learni_year_level') || '5') : 5
  const subject = typeof window !== 'undefined' ? localStorage.getItem('learni_subject') || 'Maths' : 'Maths'
  const sessionMode = typeof window !== 'undefined' ? localStorage.getItem('learni_session_mode') || 'full' : 'full'
  const sessionTopic = typeof window !== 'undefined' ? localStorage.getItem('learni_session_topic') || '' : ''
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [weakTopics, setWeakTopics] = useState<string[]>([])
  const [reviewTopics, setReviewTopics] = useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [childProfile, setChildProfile] = useState<any>({})
  const masteryResultsRef = useRef<Array<{ topic: string; correct: boolean }>>([])
  const [audioChecked, setAudioChecked] = useState(false)
  const [audioCheckPlaying, setAudioCheckPlaying] = useState(false)
  const [accessBlocked, setAccessBlocked] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [questionsInPhase, setQuestionsInPhase] = useState(0)

  const [state, setState] = useState<SessionState>({
    phase: (typeof window !== 'undefined' && localStorage.getItem('learni_session_mode') === 'practice' ? 'lesson' :
            typeof window !== 'undefined' && localStorage.getItem('learni_session_mode') === 'challenge' ? 'warmup' :
            'warmup') as Phase,
    phaseLabel: PHASE_LABELS[typeof window !== 'undefined' && localStorage.getItem('learni_session_mode') === 'practice' ? 'lesson' : 'warmup'],
    earniSays: '',
    question: null,
    visual: null,
    checkIn: [],
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
  const sessionStartRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef(Date.now())
  const pausedTimeRef = useRef(0)
  const [paused, setPaused] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceSpeed, setVoiceSpeed] = useState(1.0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [listening, setListening] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Speech-to-text — listen to the kid
  function startListening() {
    if (!micEnabled || speaking) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* */ }
    }
    
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-NZ'
    
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim()
      if (transcript) {
        lastActivityRef.current = Date.now()
        const lower = transcript.toLowerCase()
        
        // Check if it sounds like a help request
        const helpWords = ['help', 'hint', 'don\'t know', 'stuck', 'confused', 'what does', 'how do', 'i don\'t get', 'explain', 'don\'t understand', 'can you help']
        const isHelp = helpWords.some(w => lower.includes(w))
        
        // Check if it sounds like "move on" / "got it"
        const moveOnWords = ['got it', 'okay', 'ok', 'next', 'yes', 'yeah', 'yep', 'ready', 'i understand', 'makes sense', 'continue']
        const isMoveOn = moveOnWords.some(w => lower.includes(w))
        
        if (isHelp) {
          // Kid is asking for help verbally
          const context = state.question ? `with "${state.question}"` : 'with what Earni just explained'
          historyRef.current.push({ role: 'user', content: `${childName} said out loud: "${transcript}". They need help ${context}. Be warm, patient and give a hint or re-explain differently.` })
          fetchQuestion(state.phase)
        } else if (!state.question && isMoveOn) {
          // During teaching, kid says they understand — move on
          historyRef.current.push({ role: 'user', content: 'Got it, I understand. Continue.' })
          fetchQuestion(state.phase)
        } else if (state.question && !state.selectedAnswer) {
          // Treat as an answer attempt
          handleAnswer(transcript)
        } else if (!state.question) {
          // During teaching, kid said something — treat as a question/comment
          historyRef.current.push({ role: 'user', content: `${childName} said: "${transcript}". Respond naturally and helpfully. If it's a question, answer it. Then continue the lesson.` })
          fetchQuestion(state.phase)
        }
      }
    }
    
    recognitionRef.current = recognition
    recognition.start()
  }

  // Auto-listen after Earni finishes speaking — ALWAYS when mic is on
  useEffect(() => {
    if (!speaking && micEnabled && !paused && state.sessionStarted && !state.showJars) {
      const timer = setTimeout(() => startListening(), 500)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking, micEnabled, paused, state.sessionStarted, state.showJars, state.earniSays])
  const [showHintOffer, setShowHintOffer] = useState(false)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [celebration, setCelebration] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [shake, setShake] = useState(false)
  const [apiError, setApiError] = useState(false)
  const [, setRetryCount] = useState(0)

  // Speak function - calls ElevenLabs TTS
  async function speak(text: string) {
    if (!voiceEnabled || !text) return
    // Cancel any current speech
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(true)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.playbackRate = voiceSpeed
      audioRef.current = audio
      audio.onended = () => { setSpeaking(false); audioRef.current = null }
      audio.onerror = () => { setSpeaking(false); audioRef.current = null }
      await audio.play()
    } catch {
      setSpeaking(false)
    }
  }

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
          drillTopics: phase === 'warmup'
            ? (weakTopics.length > 0 ? weakTopics : focusAreas.length > 0 ? focusAreas : ['times tables', 'number bonds'])
            : [subject],
          focusAreas,
          weakTopics,
          reviewTopics,
          baselineLevel: typeof window !== 'undefined' ? localStorage.getItem('learni_baseline_level') : null,
          childProfile,
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

      const earniText = data.earniSays || ''
      setState(s => ({
        ...s,
        phase,
        phaseLabel: PHASE_LABELS[phase],
        earniSays: earniText,
        question: data.question || null,
        visual: data.visual || null,
        checkIn: data.checkIn || [],
        options: data.options || [],
        answer: data.answer || '',
        hint: data.hint || null,
        loading: false,
        sessionStarted: true,
        showJars: phase === 'reward',
      }))
      // Speak Earni's words — question waits until speech finishes
      if (earniText) {
        speak(earniText)
      }
      // Reset hint timer
      setShowHintOffer(false)
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    } catch {
      setState(s => ({
        ...s,
        loading: false,
      }))
      setApiError(true)
    }
  }, [childName, yearLevel, subject, state.correctCount, state.totalQuestions, state.streakCount, state.personalBest, state.starsEarned])

  // Auto-save on tab close / navigate away
  useEffect(() => {
    function saveOnExit() {
      const childId = localStorage.getItem('learni_child_id')
      if (childId && state.totalQuestions > 0) {
        navigator.sendBeacon('/api/session/complete', JSON.stringify({
          childId,
          starsEarned: state.starsEarned,
          correctCount: state.correctCount,
          totalQuestions: state.totalQuestions,
          subjects: [subject],
          duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
          jarAllocation: { save: state.jarSave, spend: state.jarSpend, give: state.jarGive },
        }))
      }
    }
    window.addEventListener('beforeunload', saveOnExit)
    return () => window.removeEventListener('beforeunload', saveOnExit)
  })

  // Check account access
  useEffect(() => {
    const childId = typeof window !== 'undefined' ? localStorage.getItem('learni_child_id') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('learni_parent_token') : null
    const params = new URLSearchParams()
    if (childId) params.set('childId', childId)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(`/api/account/status?${params}`, { headers })
      .then(r => r.json())
      .then(d => {
        if (!d.canAccess) setAccessBlocked(true)
        if (d.isTrialing && d.daysLeft <= 3) setTrialDaysLeft(d.daysLeft)
      })
      .catch(() => {})
  }, [])

  // Load focus areas + mastery data
  useEffect(() => {
    const childId = typeof window !== 'undefined' ? localStorage.getItem('learni_child_id') : null
    if (childId) {
      fetch(`/api/parent/focus?childId=${childId}`)
        .then(r => r.json())
        .then(d => setFocusAreas(d.focusAreas || []))
        .catch(() => {})
      fetch(`/api/kid/mastery?childId=${childId}`)
        .then(r => r.json())
        .then(d => {
          setWeakTopics(d.weakTopics || [])
          setReviewTopics(d.reviewTopics || [])
        })
        .catch(() => {})
      fetch(`/api/kid/stats?childId=${childId}`)
        .then(r => r.json())
        .then(d => {
          if (d.childProfile) setChildProfile(d.childProfile)
        })
        .catch(() => {})
    }
  }, [])

  // Start session — only after audio check
  useEffect(() => {
    if (!state.sessionStarted && audioChecked) {
      fetchQuestion('warmup')
      phaseStartRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, elapsedMinutes: Math.floor((Date.now() - phaseStartRef.current) / 60000) }))
      }, 10000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioChecked])

  // Inactivity detection - pause after 45 seconds of no interaction
  useEffect(() => {
    const inactivityCheck = setInterval(() => {
      if (paused) return
      const idle = Date.now() - lastActivityRef.current
      if (idle > 45000 && !state.loading && state.sessionStarted) {
        setPaused(true)
        pausedTimeRef.current = Date.now()
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false) }
        if (recognitionRef.current) { try { recognitionRef.current.stop() } catch { /* */ } }
      }
    }, 5000)
    return () => clearInterval(inactivityCheck)
  }, [paused, state.loading, state.sessionStarted])

  // Also pause on visibility change (tab switch, screen lock)
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && !paused && state.sessionStarted) {
        setPaused(true)
        pausedTimeRef.current = Date.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [paused, state.sessionStarted])

  function resumeSession() {
    // Adjust phase start time by the paused duration so timer doesn't skip ahead
    const pausedDuration = Date.now() - pausedTimeRef.current
    phaseStartRef.current += pausedDuration
    lastActivityRef.current = Date.now()
    setPaused(false)
  }

  // Phase transition based on time - check every 3 seconds
  useEffect(() => {
    const phaseCheck = setInterval(() => {
      if (paused) return
      const phaseElapsed = (Date.now() - phaseStartRef.current) / 60000
      const limit = PHASE_TIMES[state.phase]

      if (phaseElapsed >= limit && state.phase !== 'reward' && !state.loading) {
        const fullFlow: Record<Phase, Phase> = { warmup: 'lesson', lesson: 'financial', financial: 'closing', closing: 'reward', reward: 'reward' }
        const shortFlow: Record<Phase, Phase> = { warmup: 'reward', lesson: 'reward', financial: 'reward', closing: 'reward', reward: 'reward' }
        const flow = (sessionMode === 'practice' || sessionMode === 'challenge' || sessionMode === 'learn') ? shortFlow : fullFlow
        const next = flow[state.phase]
        phaseStartRef.current = Date.now()
        historyRef.current = []
        setQuestionsInPhase(0)
        fetchQuestion(next)
      }
    }, 3000)
    return () => clearInterval(phaseCheck)
  }, [state.phase, state.loading, fetchQuestion, paused])

  function handleAnswer(selected: string) {
    if (state.loading || state.selectedAnswer) return
    lastActivityRef.current = Date.now()
    setShowHintOffer(false)
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current)

    // Check if kid is asking for help instead of answering
    const helpWords = ['help', 'hint', 'idk', 'stuck', 'confused', "don't know", 'dont know', 'what', 'how do', 'explain', '?']
    const isHelp = helpWords.some(w => selected.toLowerCase().includes(w))
    if (isHelp && (state.phase === 'lesson' || state.phase === 'financial')) {
      // Send to Claude as a help request, not a wrong answer
      fetchQuestion(state.phase, selected, state.question || '', state.answer)
      return
    }

    const isCorrect = selected.toLowerCase().trim() === state.answer.toLowerCase().trim()
    const newStreak = isCorrect ? state.streakCount + 1 : 0
    const newPB = Math.max(state.personalBest, newStreak)
    const newStars = isCorrect ? state.starsEarned + 4 : state.starsEarned

    // Track mastery + question count
    if (state.question) {
      masteryResultsRef.current.push({ topic: subject, correct: isCorrect })
      setQuestionsInPhase(q => q + 1)
    }

    // Sound effect
    playSound(isCorrect)

    // Celebration effects
    if (isCorrect) {
      const celebrations = ['🎉', '⭐', '🔥', '💪', '🚀', '✨', '👏', '💥']
      const streakCelebrations = ['🔥🔥🔥', '🚀 ON FIRE!', '⭐ UNSTOPPABLE!', '💪 BEAST MODE!']
      if (newStreak >= 5 && newStreak % 5 === 0) {
        setCelebration(streakCelebrations[Math.floor(Math.random() * streakCelebrations.length)])
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 2000)
      } else {
        setCelebration(celebrations[Math.floor(Math.random() * celebrations.length)])
      }
      setTimeout(() => setCelebration(null), 1200)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }

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

    // Show result briefly, then advance — don't wait for voice to finish
    const minDelay = (state.phase === 'warmup' || state.phase === 'closing') ? 800 : 1500
    setTimeout(() => {
      fetchQuestion(state.phase, selected, state.question || '', state.answer)
    }, minDelay)
  }

  function playSound(correct: boolean) {
    try {
      const ctx = new AudioContext()
      if (correct) {
        // Happy ascending chime
        const notes = [523, 659, 784, 1047]
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3)
          osc.start(ctx.currentTime + i * 0.08)
          osc.stop(ctx.currentTime + i * 0.08 + 0.3)
        })
      } else {
        // Gentle low tone (not harsh)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(280, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3)
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
      }
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
          duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
          jarAllocation: { save: state.jarSave, spend: state.jarSpend, give: state.jarGive },
        }),
      })
    } catch (err) {
      console.error('Session save failed:', err)
    }

    // Save mastery data
    try {
      if (masteryResultsRef.current.length > 0) {
        await fetch('/api/kid/mastery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId: localStorage.getItem('learni_child_id'), results: masteryResultsRef.current }),
        })
      }
    } catch { /* best effort */ }

    // Redirect to kid hub or parent dashboard
    const childId = localStorage.getItem('learni_child_id')
    window.location.href = childId ? '/kid-hub' : '/dashboard'
  }

  const [typedAnswer, setTypedAnswer] = useState('')
  const isRapidFire = state.phase === 'warmup' || state.phase === 'closing'
  const isTeaching = !state.question && state.earniSays && !state.showJars && !state.loading
  const isTypeIn = state.question && state.options.length === 0 && !state.showJars

  function handleTypedSubmit() {
    if (!typedAnswer.trim() || state.loading || state.selectedAnswer) return
    handleAnswer(typedAnswer.trim())
    setTypedAnswer('')
  }

  async function handleAudioCheck() {
    setAudioCheckPlaying(true)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Hey ${childName}! Can you hear me? If you can, we're all set. Let's do this!` }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => setAudioCheckPlaying(false)
        audio.onerror = () => setAudioCheckPlaying(false)
        await audio.play()
      } else {
        setAudioCheckPlaying(false)
      }
    } catch {
      setAudioCheckPlaying(false)
    }
  }

  // Trial expired paywall
  if (accessBlocked) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0d2b28', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px',
      }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏰</div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '26px', fontWeight: 900, color: 'white', marginBottom: '8px' }}>
            Your free trial has ended
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '28px', lineHeight: 1.6 }}>
            {childName} was doing great! Subscribe to keep learning with Earni.
          </p>
          <a href="/subscribe" style={{
            display: 'block', padding: '18px', background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
            color: 'white', borderRadius: '30px', fontFamily: "'Nunito', sans-serif",
            fontSize: '18px', fontWeight: 900, textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(46,196,182,0.3)', marginBottom: '12px',
          }}>
            Subscribe — $49/month →
          </a>
          <a href="/kid-hub" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textDecoration: 'none' }}>Back to Hub</a>
        </div>
      </div>
    )
  }

  // Audio check screen
  if (!audioChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d2b28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: '24px',
      }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '50px',
            margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(46,196,182,0.2)',
          }}>🤖</div>

          <h1 style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '26px',
            fontWeight: 900,
            color: 'white',
            marginBottom: '8px',
          }}>
            Before we start, {childName}...
          </h1>

          <div style={{
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🔊</div>
            <p style={{ color: '#f5a623', fontSize: '15px', fontWeight: 600, margin: 0 }}>
              Turn your volume up! Earni talks to you during the session.
            </p>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>
            Tap the button below to check your sound is working.
          </p>

          <button
            onClick={handleAudioCheck}
            disabled={audioCheckPlaying}
            style={{
              width: '100%',
              padding: '16px',
              background: audioCheckPlaying ? 'rgba(46,196,182,0.3)' : 'rgba(46,196,182,0.15)',
              border: '1.5px solid rgba(46,196,182,0.3)',
              borderRadius: '30px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '16px',
              fontWeight: 900,
              color: '#2ec4b6',
              cursor: audioCheckPlaying ? 'default' : 'pointer',
              marginBottom: '12px',
            }}
          >
            {audioCheckPlaying ? '🗣️ Earni is talking...' : '🔊 Test my sound'}
          </button>

          {/* Mic option */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>🎤 Let Earni listen</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Answer questions by speaking</div>
            </div>
            <button
              onClick={() => setMicEnabled(m => !m)}
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: micEnabled ? '#2ec4b6' : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: micEnabled ? '23px' : '3px',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          <button
            onClick={() => setAudioChecked(true)}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '18px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
            }}
          >
            {micEnabled ? "Let's go! →" : "I can hear Earni — let's go! →"}
          </button>

          <button
            onClick={() => { setVoiceEnabled(false); setAudioChecked(true) }}
            style={{
              marginTop: '12px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.25)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Continue without sound
          </button>
        </div>
      </div>
    )
  }

  // API error overlay
  if (apiError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d2b28',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '40px 32px',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>😅</div>
          <h2 style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '22px',
            color: 'white',
            margin: '0 0 10px',
          }}>Earni had a moment</h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}>
            Something went wrong connecting to Earni. Your progress is safe — let&apos;s try again.
          </p>
          <button
            onClick={() => {
              setApiError(false)
              setRetryCount(c => c + 1)
              fetchQuestion(state.phase)
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 900,
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '12px',
              boxShadow: '0 4px 20px rgba(46,196,182,0.3)',
            }}
          >
            Try again →
          </button>
          <button
            onClick={() => { window.location.href = '/kid-hub' }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Go back to Hub
          </button>
        </div>
      </div>
    )
  }

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
          <button
            onClick={async () => {
              if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false) }
              if (recognitionRef.current) { try { recognitionRef.current.stop() } catch { /* */ } }
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
                    duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
                    jarAllocation: { save: state.jarSave, spend: state.jarSpend, give: state.jarGive },
                  }),
                })
              } catch { /* */ }
              window.location.href = '/kid-hub'
            }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
          >
            ← Leave
          </button>
          <button
            onClick={() => { setPaused(true); pausedTimeRef.current = Date.now(); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false) } }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
          >
            ⏸
          </button>
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
          <button
            onClick={() => {
              setVoiceEnabled(v => !v)
              if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setSpeaking(false) }
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '13px',
              cursor: 'pointer',
              color: voiceEnabled ? '#2ec4b6' : 'rgba(255,255,255,0.3)',
            }}
          >
            {voiceEnabled ? (speaking ? '🗣️' : '🔊') : '🔇'}
          </button>
          {micEnabled && (
            <span style={{
              background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${listening ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '13px',
              color: listening ? '#ef4444' : 'rgba(255,255,255,0.3)',
              animation: listening ? 'pulse 1.5s infinite' : 'none',
            }}>
              {listening ? '🎤' : '🎤'}
            </span>
          )}
          {voiceEnabled && (
            <button
              onClick={() => setVoiceSpeed(s => s >= 1.25 ? 0.75 : s + 0.25)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {voiceSpeed}x
            </button>
          )}
          <span style={{
            background: celebration ? 'rgba(245,166,35,0.2)' : 'rgba(46,196,182,0.12)',
            border: `1px solid ${celebration ? 'rgba(245,166,35,0.4)' : 'rgba(46,196,182,0.2)'}`,
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '13px',
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            color: celebration ? '#f5a623' : '#2ec4b6',
            transition: 'all 0.3s',
            transform: celebration ? 'scale(1.15)' : 'scale(1)',
          }}>
            ⭐ {state.starsEarned}
          </span>
        </div>
      </div>

      {/* Session timeline */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {(['warmup', 'lesson', 'financial', 'closing', 'reward'] as Phase[]).map((p, i) => {
          const isCurrent = state.phase === p
          const isPast = ['warmup', 'lesson', 'financial', 'closing', 'reward'].indexOf(state.phase) > i
          const labels: Record<Phase, string> = { warmup: '⚡ Warm Up', lesson: '📚 Lesson', financial: '💰 Money', closing: '⚡ Recap', reward: '⭐ Stars' }
          const phaseMins: Record<Phase, number> = { warmup: 3, lesson: 12, financial: 5, closing: 5, reward: 0 }
          const elapsed = isCurrent ? Math.min((Date.now() - phaseStartRef.current) / 60000 / (phaseMins[p] || 1), 1) : 0

          return (
            <div key={p} style={{
              flex: p === 'lesson' ? 3 : p === 'reward' ? 0.5 : 1,
              position: 'relative',
              padding: '8px 0',
            }}>
              {/* Progress fill */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: isPast ? '100%' : isCurrent ? `${elapsed * 100}%` : '0%',
                background: isPast ? 'rgba(46,196,182,0.15)' : isCurrent ? 'rgba(46,196,182,0.1)' : 'transparent',
                transition: 'width 3s linear',
              }} />
              <div style={{
                position: 'relative',
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: isCurrent ? 800 : 600,
                color: isPast ? '#2ec4b6' : isCurrent ? 'white' : 'rgba(255,255,255,0.2)',
                fontFamily: "'Nunito', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}>
                {labels[p]}
                {isCurrent && p !== 'reward' && (
                  <span style={{ marginLeft: '4px', fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                    Q{questionsInPhase + 1}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main content — full width layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'auto',
      }}>
        {/* Earni speech bar — full width */}
        {state.earniSays && (
          <div style={{
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: speaking ? 'linear-gradient(145deg, #1ab5a8, #2ec4b6)' : 'linear-gradient(145deg, #2ec4b6, #1a9e92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: speaking ? '0 0 16px rgba(46,196,182,0.4)' : 'none',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}>
              🤖
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: 1.6,
              fontFamily: "'Nunito', sans-serif",
              color: 'rgba(255,255,255,0.9)',
              flex: 1,
              paddingTop: '6px',
            }}>
              {state.earniSays}
            </div>
          </div>
        )}

        {/* Content area — visuals + questions side by side on desktop */}
        <div className="session-content" style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          padding: '24px 32px',
          flexWrap: 'wrap',
        }}>

        {/* Visual maths aid */}
        {state.visual && (
          <div style={{ flex: '1 1 300px', maxWidth: '440px', minWidth: '280px' }}>
            <MathsVisual visual={state.visual as { type: string; [key: string]: unknown }} />
          </div>
        )}

        {/* Teaching — check-in response buttons */}
        {isTeaching && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {state.checkIn && state.checkIn.length > 0 ? (
              state.checkIn.map((option: string, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    lastActivityRef.current = Date.now()
                    historyRef.current.push({ role: 'user', content: `${childName} responded: "${option}"` })
                    fetchQuestion(state.phase)
                  }}
                  style={{
                    background: i === 0 ? 'rgba(46,196,182,0.15)' : 'rgba(255,255,255,0.06)',
                    border: i === 0 ? '1px solid rgba(46,196,182,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '30px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    color: i === 0 ? '#2ec4b6' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  {option}
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => {
                    lastActivityRef.current = Date.now()
                    historyRef.current.push({ role: 'user', content: `${childName} says they understand. Move to the next step or give a practice question.` })
                    fetchQuestion(state.phase)
                  }}
                  style={{
                    background: 'rgba(46,196,182,0.15)',
                    border: '1px solid rgba(46,196,182,0.3)',
                    borderRadius: '30px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    color: '#2ec4b6',
                    cursor: 'pointer',
                  }}
                >
                  Makes sense! →
                </button>
                <button
                  onClick={() => {
                    lastActivityRef.current = Date.now()
                    historyRef.current.push({ role: 'user', content: `${childName} is confused and needs a different explanation. Try a completely different approach — use a story, analogy, or different visual.` })
                    fetchQuestion(state.phase)
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '30px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                  }}
                >
                  Explain differently
                </button>
              </>
            )}
          </div>
        )}

        {/* Type-in answer */}
        {isTypeIn && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px 32px',
            flex: '1 1 340px',
            maxWidth: '500px',
            minWidth: '280px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              marginBottom: '20px',
              lineHeight: 1.3,
            }}>
              {state.question}
            </div>

            {state.selectedAnswer === null ? (
              <form onSubmit={(e) => { e.preventDefault(); handleTypedSubmit() }} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={e => setTypedAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    borderRadius: '14px',
                    fontSize: '20px',
                    fontWeight: 800,
                    fontFamily: "'Nunito', sans-serif",
                    color: 'white',
                    outline: 'none',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={!typedAnswer.trim()}
                  style={{
                    padding: '14px 24px',
                    background: typedAnswer.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.3)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: typedAnswer.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Go
                </button>
              </form>
            ) : (
              <div style={{
                padding: '14px 18px',
                background: state.isCorrect ? 'rgba(46,196,182,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1.5px solid ${state.isCorrect ? '#2ec4b6' : '#ef4444'}`,
                borderRadius: '14px',
                fontSize: '20px',
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                color: 'white',
                textAlign: 'center',
              }}>
                {state.selectedAnswer} {state.isCorrect ? '✓' : `✗ → ${state.answer}`}
              </div>
            )}

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

            {/* Help button — always visible during lesson/financial */}
            {!state.selectedAnswer && !isRapidFire && (
              <button
                onClick={() => {
                  setShowHintOffer(false)
                  if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
                  lastActivityRef.current = Date.now()
                  historyRef.current.push({ role: 'user', content: `${childName} pressed the help button for "${state.question}". Give a warm, encouraging hint WITHOUT giving the answer. Guide them step by step.` })
                  fetchQuestion(state.phase)
                }}
                style={{
                  marginTop: '14px',
                  padding: '10px 20px',
                  background: 'rgba(245,166,35,0.1)',
                  border: '1px solid rgba(245,166,35,0.2)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#f5a623',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '14px auto 0',
                }}
              >
                💡 I need help
              </button>
            )}
          </div>
        )}

        {/* Multiple choice question */}
        {state.question && state.options.length > 0 && !state.showJars && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px 32px',
            flex: '1 1 340px',
            maxWidth: '500px',
            minWidth: '280px',
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

            {/* Help button — always visible during lesson/financial */}
            {!state.selectedAnswer && !isRapidFire && (
              <button
                onClick={() => {
                  setShowHintOffer(false)
                  if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
                  lastActivityRef.current = Date.now()
                  historyRef.current.push({ role: 'user', content: `${childName} pressed the help button for "${state.question}". Give a warm, encouraging hint WITHOUT giving the answer. Guide them step by step.` })
                  fetchQuestion(state.phase)
                }}
                style={{
                  marginTop: '14px',
                  padding: '10px 20px',
                  background: 'rgba(245,166,35,0.1)',
                  border: '1px solid rgba(245,166,35,0.2)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#f5a623',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '14px auto 0',
                }}
              >
                💡 I need help
              </button>
            )}
          </div>
        )}

        </div>{/* end session-content */}

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

        {/* Floating help button — always visible during lesson/financial when question is showing */}
        {state.question && !state.selectedAnswer && !isRapidFire && !state.showJars && !state.loading && (
          <button
            onClick={() => {
              lastActivityRef.current = Date.now()
              historyRef.current.push({ role: 'user', content: `${childName} pressed the help button for "${state.question}". Give a warm, encouraging hint WITHOUT giving the answer. Guide them step by step.` })
              fetchQuestion(state.phase)
            }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              padding: '12px 20px',
              background: 'rgba(245,166,35,0.9)',
              border: 'none',
              borderRadius: '30px',
              fontSize: '15px',
              fontWeight: 800,
              fontFamily: "'Nunito', sans-serif",
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(245,166,35,0.3)',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            💡 Help
          </button>
        )}

        {/* Celebration popup */}
        {celebration && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '72px',
            zIndex: 150,
            animation: 'celebPop 1s ease-out forwards',
            pointerEvents: 'none',
          }}>
            {celebration}
          </div>
        )}

        {/* Confetti */}
        {showConfetti && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 140, overflow: 'hidden' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '-10px',
                left: `${Math.random() * 100}%`,
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                background: ['#2ec4b6', '#f5a623', '#ff6b6b', '#a78bfa', '#4ade80', '#ff9080'][Math.floor(Math.random() * 6)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: `confettiFall ${1.5 + Math.random() * 1.5}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }} />
            ))}
          </div>
        )}

        {/* Pause overlay */}
        {paused && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,43,40,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏸️</div>
              <h2 style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: '28px',
                fontWeight: 900,
                color: 'white',
                marginBottom: '8px',
              }}>Session paused</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.5 }}>
                Earni noticed you stepped away. No worries - your progress is saved. Ready to jump back in?
              </p>
              <button
                onClick={resumeSession}
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '18px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
                }}
              >
                I&apos;m back! →
              </button>
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={async () => {
                    // Save session before leaving
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
                          duration: Math.floor((Date.now() - sessionStartRef.current) / 1000),
                          jarAllocation: { save: state.jarSave, spend: state.jarSpend, give: state.jarGive },
                        }),
                      })
                    } catch { /* best effort */ }
                    window.location.href = '/kid-hub'
                  }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '13px', cursor: 'pointer', textDecoration: 'none' }}
                >
                  End session
                </button>
              </div>
            </div>
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
            🏆 NEW PERSONAL BEST - {state.streakCount} in a row!
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');
        @keyframes pulse0 { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.3)} }
        @keyframes pulse1 { 0%,100%{transform:scaleY(1)} 60%{transform:scaleY(0.3)} }
        @keyframes pulse2 { 0%,100%{transform:scaleY(1)} 70%{transform:scaleY(0.3)} }
        @keyframes celebPop {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -80%) scale(1); opacity: 0; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes shakeIt {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .session-content {
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }
        @media (max-width: 480px) {
          .session-content {
            padding: 16px !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
