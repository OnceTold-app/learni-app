'use client'

import { useState, useEffect } from 'react'

const SKIN_TONES = ['#FFDBB4', '#E8B98D', '#C68642', '#8D5524', '#5C3317', '#3B1E08']
const HAIR_COLORS = ['#2C1B0E', '#4A2912', '#8B4513', '#D2691E', '#DAA520', '#F5DEB3', '#DC143C', '#4169E1', '#9B59B6', '#2ECC71']
const HAIR_STYLES = ['short', 'long', 'curly', 'spiky', 'braids', 'bun', 'mohawk', 'afro']
const EYE_COLORS = ['#4A2912', '#2E86C1', '#27AE60', '#8E44AD', '#2C3E50']
const ACCESSORIES = ['none', 'glasses', 'sunglasses', 'headband', 'cap', 'beanie']

const HAIR_EMOJIS: Record<string, string> = {
  short: '✂️', long: '💇', curly: '🌀', spiky: '⚡', braids: '🎀', bun: '🍡', mohawk: '🔥', afro: '✊'
}
const ACC_EMOJIS: Record<string, string> = {
  none: '❌', glasses: '👓', sunglasses: '😎', headband: '🎽', cap: '🧢', beanie: '🧶'
}

export default function KidAvatarPage() {
  const [childName, setChildName] = useState('')
  const [skinTone, setSkinTone] = useState(SKIN_TONES[0])
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0])
  const [hairStyle, setHairStyle] = useState('short')
  const [eyeColor, setEyeColor] = useState(EYE_COLORS[0])
  const [accessory, setAccessory] = useState('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem('learni_child_name') || ''
    setChildName(name)
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const childId = localStorage.getItem('learni_child_id')
      const res = await fetch('/api/kid/save-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, avatar: { skinTone, hairColor, hairStyle, eyeColor, accessory } }),
      })
      if (!res.ok) throw new Error('Failed to save')
      window.location.href = '/kid-hub'
    } catch {
      setSaving(false)
    }
  }

  // Render avatar preview
  function AvatarPreview() {
    const hairPath = (() => {
      switch (hairStyle) {
        case 'short': return <ellipse cx="60" cy="28" rx="32" ry="18" fill={hairColor} />
        case 'long': return <><ellipse cx="60" cy="28" rx="34" ry="18" fill={hairColor} /><rect x="26" y="35" width="12" height="40" rx="6" fill={hairColor} /><rect x="82" y="35" width="12" height="40" rx="6" fill={hairColor} /></>
        case 'curly': return <><ellipse cx="60" cy="28" rx="36" ry="20" fill={hairColor} />{[0,1,2,3,4].map(i => <circle key={i} cx={30 + i * 15} cy={18} r={8} fill={hairColor} />)}</>
        case 'spiky': return <>{[-20,-10,0,10,20].map((x,i) => <polygon key={i} points={`${60+x},5 ${55+x},30 ${65+x},30`} fill={hairColor} />)}</>
        case 'braids': return <><ellipse cx="60" cy="28" rx="32" ry="18" fill={hairColor} /><rect x="24" y="35" width="8" height="50" rx="4" fill={hairColor} /><rect x="88" y="35" width="8" height="50" rx="4" fill={hairColor} /></>
        case 'bun': return <><ellipse cx="60" cy="28" rx="32" ry="18" fill={hairColor} /><circle cx="60" cy="10" r="14" fill={hairColor} /></>
        case 'mohawk': return <rect x="50" y="2" width="20" height="30" rx="8" fill={hairColor} />
        case 'afro': return <ellipse cx="60" cy="30" rx="45" ry="38" fill={hairColor} />
        default: return <ellipse cx="60" cy="28" rx="32" ry="18" fill={hairColor} />
      }
    })()

    const accElement = (() => {
      switch (accessory) {
        case 'glasses': return <><rect x="37" y="48" width="16" height="12" rx="3" fill="none" stroke="#333" strokeWidth="2" /><rect x="67" y="48" width="16" height="12" rx="3" fill="none" stroke="#333" strokeWidth="2" /><line x1="53" y1="54" x2="67" y2="54" stroke="#333" strokeWidth="2" /></>
        case 'sunglasses': return <><rect x="36" y="47" width="18" height="14" rx="4" fill="#1a1a1a" /><rect x="66" y="47" width="18" height="14" rx="4" fill="#1a1a1a" /><line x1="54" y1="54" x2="66" y2="54" stroke="#1a1a1a" strokeWidth="2.5" /></>
        case 'headband': return <rect x="26" y="32" width="68" height="6" rx="3" fill="#2ec4b6" />
        case 'cap': return <><ellipse cx="60" cy="28" rx="38" ry="14" fill="#2ec4b6" /><rect x="22" y="24" width="76" height="8" rx="2" fill="#1a9e92" /></>
        case 'beanie': return <><ellipse cx="60" cy="24" rx="36" ry="22" fill="#2ec4b6" /><rect x="24" y="32" width="72" height="6" rx="3" fill="#1a9e92" /><circle cx="60" cy="6" r="5" fill="#2ec4b6" /></>
        default: return null
      }
    })()

    return (
      <svg viewBox="0 0 120 120" width="160" height="160">
        {/* Hair behind head */}
        {hairStyle === 'afro' && hairPath}
        {/* Head */}
        <ellipse cx="60" cy="55" rx="30" ry="35" fill={skinTone} />
        {/* Hair */}
        {hairStyle !== 'afro' && hairPath}
        {/* Eyes */}
        <circle cx="47" cy="52" r="5" fill="white" />
        <circle cx="73" cy="52" r="5" fill="white" />
        <circle cx="47" cy="52" r="3" fill={eyeColor} />
        <circle cx="73" cy="52" r="3" fill={eyeColor} />
        <circle cx="48" cy="51" r="1" fill="white" />
        <circle cx="74" cy="51" r="1" fill="white" />
        {/* Smile */}
        <path d="M 48 68 Q 60 78 72 68" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        {/* Accessory */}
        {accElement}
      </svg>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28, #143330)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '16px' }}>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '26px', fontWeight: 900, color: 'white', marginBottom: '6px' }}>
            Design your look, {childName}!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>This is how Earni sees you</p>
        </div>

        {/* Preview */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '28px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            padding: '20px',
            boxShadow: '0 0 40px rgba(46,196,182,0.1)',
          }}>
            <AvatarPreview />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Skin tone */}
          <Section title="Skin tone">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SKIN_TONES.map(tone => (
                <ColorCircle key={tone} color={tone} selected={skinTone === tone} onClick={() => setSkinTone(tone)} />
              ))}
            </div>
          </Section>

          {/* Hair color */}
          <Section title="Hair colour">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {HAIR_COLORS.map(color => (
                <ColorCircle key={color} color={color} selected={hairColor === color} onClick={() => setHairColor(color)} />
              ))}
            </div>
          </Section>

          {/* Hair style */}
          <Section title="Hair style">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {HAIR_STYLES.map(style => (
                <PillButton key={style} label={`${HAIR_EMOJIS[style]} ${style}`} selected={hairStyle === style} onClick={() => setHairStyle(style)} />
              ))}
            </div>
          </Section>

          {/* Eye color */}
          <Section title="Eye colour">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EYE_COLORS.map(color => (
                <ColorCircle key={color} color={color} selected={eyeColor === color} onClick={() => setEyeColor(color)} />
              ))}
            </div>
          </Section>

          {/* Accessories */}
          <Section title="Accessories">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ACCESSORIES.map(acc => (
                <PillButton key={acc} label={`${ACC_EMOJIS[acc]} ${acc}`} selected={accessory === acc} onClick={() => setAccessory(acc)} />
              ))}
            </div>
          </Section>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '18px',
            background: saving ? 'rgba(46,196,182,0.4)' : 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '18px',
            fontWeight: 900,
            cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: '28px',
            marginBottom: '40px',
            boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
          }}
        >
          {saving ? 'Saving...' : "That's me! Let's go →"}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      {children}
    </div>
  )
}

function ColorCircle({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      background: color,
      border: selected ? '3px solid #2ec4b6' : '3px solid transparent',
      boxShadow: selected ? '0 0 0 2px rgba(46,196,182,0.4)' : 'none',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }} />
  )
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px',
      borderRadius: '20px',
      background: selected ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.05)',
      border: selected ? '1.5px solid #2ec4b6' : '1.5px solid rgba(255,255,255,0.08)',
      color: selected ? '#2ec4b6' : 'rgba(255,255,255,0.6)',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
      textTransform: 'capitalize',
      transition: 'all 0.15s',
    }}>{label}</button>
  )
}
