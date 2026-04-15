'use client'

import { useState } from 'react'

export interface FactMasteryData {
  factor_a: number
  factor_b: number
  correct_streak: number
  total_correct: number
  total_attempts?: number
}

interface TimesTableHeatmapProps {
  masteryData: FactMasteryData[]
  onCellTap?: (a: number, b: number) => void
}

function getCellColor(data: FactMasteryData | undefined): string {
  if (!data || data.total_attempts === 0 || (data.total_correct === 0 && data.correct_streak === 0)) {
    return '#2a3a38' // not attempted — grey
  }
  if (data.correct_streak >= 10) {
    return '#1a9e92' // really solid — darker green
  }
  if (data.correct_streak >= 3) {
    return '#2ec4b6' // mastered — green
  }
  // attempted but not yet at streak 3 — orange 60% opacity
  return 'rgba(245,166,35,0.6)'
}

function getCellBorder(data: FactMasteryData | undefined): string {
  if (!data || data.total_attempts === 0) return '1px solid rgba(255,255,255,0.04)'
  if (data.correct_streak >= 10) return '1px solid #1a9e92'
  if (data.correct_streak >= 3) return '1px solid #2ec4b6'
  return '1px solid rgba(245,166,35,0.4)'
}

export default function TimesTableHeatmap({ masteryData, onCellTap }: TimesTableHeatmapProps) {
  const [tappedCell, setTappedCell] = useState<{ a: number; b: number } | null>(null)

  // Build a lookup map for O(1) access
  const masteryMap = new Map<string, FactMasteryData>()
  for (const d of masteryData) {
    masteryMap.set(`${d.factor_a}-${d.factor_b}`, d)
    // Also store the reverse (3×4 and 4×3 share the same fact)
    masteryMap.set(`${d.factor_b}-${d.factor_a}`, d)
  }

  function handleCellTap(a: number, b: number) {
    setTappedCell(prev => (prev?.a === a && prev?.b === b ? null : { a, b }))
    onCellTap?.(a, b)
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(12, 1fr)', gap: '2px', marginBottom: '2px' }}>
        <div />
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
          <div key={n} style={{
            textAlign: 'center',
            fontSize: '9px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Nunito', sans-serif",
            paddingBottom: '2px',
          }}>
            {n}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {Array.from({ length: 12 }, (_, rowIdx) => rowIdx + 1).map(a => (
        <div
          key={a}
          style={{ display: 'grid', gridTemplateColumns: '24px repeat(12, 1fr)', gap: '2px', marginBottom: '2px' }}
        >
          {/* Row header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Nunito', sans-serif",
          }}>
            {a}
          </div>

          {/* Cells */}
          {Array.from({ length: 12 }, (_, colIdx) => colIdx + 1).map(b => {
            const data = masteryMap.get(`${a}-${b}`)
            const isTapped = tappedCell?.a === a && tappedCell?.b === b
            const product = a * b

            return (
              <button
                key={b}
                onClick={() => handleCellTap(a, b)}
                title={`${a} × ${b} = ${product}`}
                style={{
                  aspectRatio: '1',
                  background: getCellColor(data),
                  border: getCellBorder(data),
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: '1px',
                  position: 'relative',
                  transition: 'transform 0.1s, opacity 0.1s',
                  transform: isTapped ? 'scale(1.15)' : 'scale(1)',
                  outline: 'none',
                  minWidth: 0,
                }}
              >
                {isTapped ? (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    color: 'white',
                    fontFamily: "'Nunito', sans-serif",
                    lineHeight: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}>
                    {product}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '7px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: "'Nunito', sans-serif",
                    lineHeight: 1,
                  }}>
                    {a}×{b}
                  </span>
                )}
                {/* Streak badge for solid mastery */}
                {data && data.correct_streak >= 10 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#f5a623',
                    borderRadius: '50%',
                    width: '8px',
                    height: '8px',
                    fontSize: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 900,
                  }}>⭐</span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { color: '#2a3a38', label: 'Not tried', border: '1px solid rgba(255,255,255,0.08)' },
          { color: 'rgba(245,166,35,0.6)', label: 'In progress', border: '1px solid rgba(245,166,35,0.4)' },
          { color: '#2ec4b6', label: 'Mastered (3+ streak)', border: '1px solid #2ec4b6' },
          { color: '#1a9e92', label: 'Solid (10+ streak)', border: '1px solid #1a9e92' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              background: item.color,
              border: item.border,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tap hint */}
      <p style={{
        textAlign: 'center',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.2)',
        marginTop: '6px',
        fontWeight: 600,
      }}>
        Tap a cell to see the answer
      </p>
    </div>
  )
}
