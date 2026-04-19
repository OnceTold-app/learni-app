'use client'

import { useEffect, useState } from 'react'

// Lightweight confetti particle
interface Particle {
  id: number
  x: number
  color: string
  size: number
  duration: number
  delay: number
  shape: 'circle' | 'rect'
}

function generateParticles(count: number): Particle[] {
  const colors = ['#2ec4b6', '#f5a623', '#a78bfa', '#fb7185', '#34d399', '#60a5fa', '#fbbf24']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 6,
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 1.5,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }))
}

export default function SubscribeSuccessPage() {
  const [particles] = useState<Particle[]>(() => generateParticles(60))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0d2b28 0%, #143330 60%, #1a3d39 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Confetti particles */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-20px',
            width: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.6}px`,
            height: p.shape === 'circle' ? `${p.size}px` : `${p.size}px`,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0,
            transform: 'rotate(0deg)',
          }}
        />
      ))}

      {/* Content card */}
      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '28px',
          fontWeight: 900,
          color: 'white',
          letterSpacing: '-0.5px',
          marginBottom: '32px',
        }}>
          learni<span style={{ color: '#2ec4b6' }}>.</span>
        </div>

        {/* Trophy */}
        <div style={{
          fontSize: '72px',
          marginBottom: '24px',
          animation: 'bounce 0.6s ease 0.3s both',
          display: 'block',
        }}>
          🎉
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '36px',
          fontWeight: 900,
          color: 'white',
          margin: '0 0 12px',
          lineHeight: 1.15,
        }}>
          Welcome to Learni!
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.65)',
          margin: '0 0 32px',
          lineHeight: 1.5,
        }}>
          Your subscription is confirmed. Time to learn, earn, and grow! ✨
        </p>

        {/* Success badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(46,196,182,0.12)',
          border: '1.5px solid rgba(46,196,182,0.25)',
          borderRadius: '100px',
          padding: '10px 20px',
          marginBottom: '40px',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#2ec4b6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            flexShrink: 0,
          }}>✓</div>
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#2ec4b6',
          }}>
            Subscription confirmed
          </span>
        </div>

        {/* What's next */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'left',
        }}>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 16px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
          }}>
            Here&apos;s what to do next
          </p>
          {[
            { emoji: '👤', text: 'Go to your Hub and add your first child' },
            { emoji: '🎯', text: 'Run the baseline assessment to find their level' },
            { emoji: '⭐', text: 'Start earning stars — they convert to real pocket money' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: i < 2 ? '12px' : 0,
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{item.emoji}</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="/dashboard"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
            color: 'white',
            padding: '18px 32px',
            borderRadius: '100px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '18px',
            textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(46,196,182,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            marginBottom: '16px',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = '0 12px 40px rgba(46,196,182,0.45)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = '0 8px 32px rgba(46,196,182,0.35)'
          }}
        >
          Go to my Hub →
        </a>

        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.25)',
          margin: 0,
        }}>
          Check your email for a welcome message from Earni
        </p>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(110vh) rotate(720deg);
          }
        }

        @keyframes bounce {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          80% { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
