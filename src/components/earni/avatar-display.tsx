'use client'

import type { EarniProfile } from '@/types'

interface AvatarDisplayProps {
  profile: EarniProfile
  size?: number
  animated?: boolean
}

// Eye shapes mapped from profile.eyes value
const EYES: Record<string, string> = {
  happy:   'M 32 42 Q 38 36 44 42 M 56 42 Q 62 36 68 42',
  cool:    'M 30 42 L 46 42 M 54 42 L 70 42',
  sparkle: 'M 38 42 L 38 42 M 62 42 L 62 42',
  sleepy:  'M 32 44 Q 38 40 44 44 M 56 44 Q 62 40 68 44',
}

// Body shapes
const SHAPES: Record<string, string> = {
  round:  'cx="50" cy="56" rx="36" ry="36"',
  square: 'x="16" y="22" width="68" height="68" rx="16"',
  star:   '',   // rendered separately
  cloud:  '',   // rendered separately
}

// Accessory overlays
function Accessory({ type, colour }: { type: string; colour: string }) {
  if (type === 'cap') {
    return (
      <path
        d="M 20 34 Q 50 10 80 34 L 75 34 Q 50 18 25 34 Z"
        fill={colour}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
    )
  }
  if (type === 'bow') {
    return (
      <g transform="translate(50, 22)">
        <path d="M -16 0 L -6 -8 L 0 0 L -6 8 Z" fill={colour} />
        <path d="M 16 0 L 6 -8 L 0 0 L 6 8 Z" fill={colour} />
        <circle cx="0" cy="0" r="5" fill={colour} />
      </g>
    )
  }
  if (type === 'star') {
    return (
      <text x="50" y="24" textAnchor="middle" fontSize="18" fill={colour}>
        ★
      </text>
    )
  }
  return null
}

export function AvatarDisplay({
  profile,
  size = 120,
  animated = false,
}: AvatarDisplayProps) {
  const { colour, shape, eyes, accessory } = profile

  // Derive a slightly darker shade for the border/shadow
  const borderColour = `${colour}88`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={
        animated
          ? { animation: 'earni-breathe 3.5s ease-in-out infinite' }
          : undefined
      }
    >
      {/* Glow ring */}
      <ellipse
        cx="50" cy="56" rx="42" ry="42"
        fill={colour}
        opacity="0.12"
      />

      {/* Body */}
      {shape === 'round' && (
        <ellipse
          cx="50" cy="56" rx="36" ry="36"
          fill={colour}
          stroke={borderColour}
          strokeWidth="2"
        />
      )}
      {shape === 'square' && (
        <rect
          x="16" y="22" width="68" height="68" rx="16"
          fill={colour}
          stroke={borderColour}
          strokeWidth="2"
        />
      )}
      {shape === 'star' && (
        <text x="50" y="78" textAnchor="middle" fontSize="72">⭐</text>
      )}
      {shape === 'cloud' && (
        <text x="50" y="78" textAnchor="middle" fontSize="72">☁️</text>
      )}

      {/* Eyes */}
      <path
        d={EYES[eyes] || EYES.happy}
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Mouth — always a smile */}
      <path
        d="M 38 64 Q 50 74 62 64"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Accessory */}
      <Accessory type={accessory} colour="white" />
    </svg>
  )
}
