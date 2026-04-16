'use client'

interface Visual {
  type: string
  rows?: number
  cols?: number
  start?: number
  end?: number
  marks?: number[]
  highlight?: number[]
  numerator?: number
  denominator?: number
  tens?: number
  ones?: number
  equation?: string
  left?: string
  right?: string
  equal?: boolean
}

export default function MathsVisual({ visual }: { visual: Visual }) {
  if (!visual || !visual.type) return null

  switch (visual.type) {
    case 'dots':
      return <DotArray rows={visual.rows || 3} cols={visual.cols || 4} />
    case 'numberline':
      return <NumberLine start={visual.start || 0} end={visual.end || 20} marks={visual.marks || []} highlight={visual.highlight || []} />
    case 'fraction':
      return <FractionVisual numerator={visual.numerator || 1} denominator={visual.denominator || 4} />
    case 'blocks':
      return <PlaceValueBlocks tens={visual.tens || 0} ones={visual.ones || 0} />
    case 'equation':
      return <EquationSteps equation={typeof visual.equation === 'string' ? visual.equation : ''} />
    case 'comparison':
      return <Comparison left={visual.left || ''} right={visual.right || ''} equal={visual.equal ?? true} />
    default:
      return null
  }
}

function DotArray({ rows, cols }: { rows: number; cols: number }) {
  // NOTE: Never show the answer (= rows*cols) here — this is a support visual, not an answer reveal
  // Showing the answer while the child is trying to work it out teaches nothing
  return (
    <div style={{
      background: 'rgba(46,196,182,0.06)',
      border: '1px solid rgba(46,196,182,0.15)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>
        Count the dots →
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '10px' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#2ec4b6',
              boxShadow: '0 0 6px rgba(46,196,182,0.3)',
            }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function NumberLine({ start, end, marks, highlight }: { start: number; end: number; marks: number[]; highlight: number[] }) {
  const range = end - start
  return (
    <div style={{
      background: 'rgba(46,196,182,0.06)',
      border: '1px solid rgba(46,196,182,0.15)',
      borderRadius: '16px',
      padding: '24px 20px',
    }}>
      <svg viewBox={`0 0 300 60`} width="100%" height="60">
        {/* Line */}
        <line x1="20" y1="30" x2="280" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        {/* Start/end labels */}
        <text x="20" y="50" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">{start}</text>
        <text x="280" y="50" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">{end}</text>
        {/* Marks */}
        {marks.map(m => {
          const x = 20 + ((m - start) / range) * 260
          const isHighlighted = highlight.includes(m)
          return (
            <g key={m}>
              <line x1={x} y1="24" x2={x} y2="36" stroke={isHighlighted ? '#2ec4b6' : 'rgba(255,255,255,0.3)'} strokeWidth={isHighlighted ? 3 : 1.5} />
              <text x={x} y={isHighlighted ? 16 : 50} fill={isHighlighted ? '#2ec4b6' : 'rgba(255,255,255,0.4)'} fontSize={isHighlighted ? 12 : 10} textAnchor="middle" fontWeight={isHighlighted ? 800 : 400}>{m}</text>
              {isHighlighted && <circle cx={x} cy="30" r="5" fill="#2ec4b6" />}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function FractionVisual({ numerator, denominator }: { numerator: number; denominator: number }) {
  const segments = Array.from({ length: denominator }).map((_, i) => i < numerator)
  return (
    <div style={{
      background: 'rgba(46,196,182,0.06)',
      border: '1px solid rgba(46,196,182,0.15)',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
        <svg viewBox="0 0 100 100" width="80" height="80">
          {segments.map((filled, i) => {
            const angle = (i / denominator) * 360
            const nextAngle = ((i + 1) / denominator) * 360
            const startRad = (angle - 90) * Math.PI / 180
            const endRad = (nextAngle - 90) * Math.PI / 180
            const largeArc = nextAngle - angle > 180 ? 1 : 0
            const x1 = 50 + 40 * Math.cos(startRad)
            const y1 = 50 + 40 * Math.sin(startRad)
            const x2 = 50 + 40 * Math.cos(endRad)
            const y2 = 50 + 40 * Math.sin(endRad)
            return (
              <path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={filled ? '#2ec4b6' : 'rgba(255,255,255,0.08)'}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            )
          })}
        </svg>
      </div>
      <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: '#2ec4b6' }}>
        <span>{numerator}</span>
        <span style={{ margin: '0 2px', color: 'rgba(255,255,255,0.3)' }}>/</span>
        <span>{denominator}</span>
      </div>
    </div>
  )
}

function PlaceValueBlocks({ tens, ones }: { tens: number; ones: number }) {
  return (
    <div style={{
      background: 'rgba(46,196,182,0.06)',
      border: '1px solid rgba(46,196,182,0.15)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      alignItems: 'flex-end',
    }}>
      {/* Tens */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '120px' }}>
          {Array.from({ length: tens }).map((_, i) => (
            <div key={i} style={{
              width: '12px', height: '48px', background: '#2ec4b6',
              borderRadius: '3px', boxShadow: '0 0 4px rgba(46,196,182,0.2)',
            }} />
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>tens ({tens}0)</div>
      </div>
      {/* Ones */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '80px' }}>
          {Array.from({ length: ones }).map((_, i) => (
            <div key={i} style={{
              width: '12px', height: '12px', background: '#f5a623',
              borderRadius: '3px', boxShadow: '0 0 4px rgba(245,166,35,0.2)',
            }} />
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>ones ({ones})</div>
      </div>
      <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', fontFamily: "'Nunito', sans-serif" }}>
        = {tens * 10 + ones}
      </div>
    </div>
  )
}

function EquationSteps({ equation }: { equation: string }) {
  const steps = equation.split('=').map(s => s.trim())
  return (
    <div style={{
      background: 'rgba(46,196,182,0.06)',
      border: '1px solid rgba(46,196,182,0.15)',
      borderRadius: '16px',
      padding: '16px 20px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {steps.map((step, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>=</span>}
            <span style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: i === steps.length - 1 ? '24px' : '16px',
              fontWeight: i === steps.length - 1 ? 900 : 600,
              color: i === steps.length - 1 ? '#2ec4b6' : 'rgba(255,255,255,0.7)',
            }}>{step}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Comparison({ left, right, equal }: { left: string; right: string; equal: boolean }) {
  return (
    <div style={{
      background: 'rgba(46,196,182,0.06)',
      border: '1px solid rgba(46,196,182,0.15)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: 'white' }}>{left}</span>
      <span style={{ fontSize: '24px', color: equal ? '#2ec4b6' : '#f5a623', fontWeight: 900 }}>{equal ? '=' : '≠'}</span>
      <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: 'white' }}>{right}</span>
    </div>
  )
}
