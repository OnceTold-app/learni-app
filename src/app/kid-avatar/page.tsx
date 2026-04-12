'use client'

import { useState, useEffect } from 'react'

// DiceBear Avataaars options — kid-friendly only
const SKIN_TONES = ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335']
const HAIR_STYLES = [
  'shortFlat', 'shortRound', 'shortWaved', 'shortCurly',
  'bob', 'bun', 'curly', 'curvy', 'bigHair',
  'dreads', 'dreads01', 'dreads02', 'fro', 'froBand',
  'longButNotTooLong', 'shavedSides', 'straight01', 'straight02',
  'straightAndStrand', 'shaggy', 'shaggyMullet', 'frizzle',
  'sides', 'theCaesar', 'theCaesarAndSidePart',
]
const HAIR_COLORS = ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370', 'e8e1e1', 'f59797', 'ecdcbf']
const EYES = ['default', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky']
const EYEBROWS = ['default', 'defaultNatural', 'flatNatural', 'raisedExcited', 'raisedExcitedNatural', 'upDown', 'upDownNatural']
const MOUTHS = ['default', 'smile', 'twinkle', 'tongue', 'eating', 'grimace']
const CLOTHING = ['hoodie', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck', 'collarAndSweater', 'graphicShirt', 'overall']
const CLOTHES_COLORS = ['2ec4b6', '3c4f5c', '65c9ff', '262e33', '5199e4', '929598', 'a7ffc4', 'ff5c5c', 'ff488e', 'ffafb9', 'ffdeb5', 'e6e6e6']
const CLOTHING_GRAPHICS = ['bear', 'diamond', 'hola', 'pizza', 'bat', 'deer', 'cumbia']
const ACCESSORIES = ['none', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers', 'kurt']
const ACCESSORY_COLORS = ['2ec4b6', '262e33', '65c9ff', 'ff5c5c', 'ff488e', 'e6e6e6', 'ffdeb5']

// Human-readable labels
const HAIR_LABELS: Record<string, string> = {
  shortFlat: 'Short Flat', shortRound: 'Short Round', shortWaved: 'Short Wavy', shortCurly: 'Short Curly',
  bob: 'Bob', bun: 'Bun', curly: 'Curly', curvy: 'Curvy', bigHair: 'Big Hair',
  dreads: 'Dreads', dreads01: 'Dreads 2', dreads02: 'Dreads 3', fro: 'Afro', froBand: 'Afro Band',
  longButNotTooLong: 'Medium Long', shavedSides: 'Shaved Sides', straight01: 'Straight', straight02: 'Straight 2',
  straightAndStrand: 'Strand', shaggy: 'Shaggy', shaggyMullet: 'Mullet', frizzle: 'Frizzle',
  sides: 'Sides', theCaesar: 'Caesar', theCaesarAndSidePart: 'Caesar Part',
}
const EYE_LABELS: Record<string, string> = {
  default: 'Normal', happy: 'Happy', hearts: 'Hearts ❤️', side: 'Side Look',
  squint: 'Squint', surprised: 'Surprised', wink: 'Wink 😉', winkWacky: 'Wacky Wink',
}
const MOUTH_LABELS: Record<string, string> = {
  default: 'Normal', smile: 'Smile', twinkle: 'Grin', tongue: 'Tongue 😛', eating: 'Eating', grimace: 'Grimace',
}
const CLOTHING_LABELS: Record<string, string> = {
  hoodie: 'Hoodie', shirtCrewNeck: 'T-Shirt', shirtScoopNeck: 'Scoop Neck',
  shirtVNeck: 'V-Neck', collarAndSweater: 'Sweater', graphicShirt: 'Graphic Tee', overall: 'Overalls',
}
const ACC_LABELS: Record<string, string> = {
  none: 'None', prescription01: 'Glasses', prescription02: 'Round Glasses',
  round: 'Circle Glasses', sunglasses: 'Sunglasses 😎', wayfarers: 'Wayfarers', kurt: 'Kurt',
}
const GRAPHIC_LABELS: Record<string, string> = {
  bear: '🐻 Bear', diamond: '💎 Diamond', hola: '👋 Hola', pizza: '🍕 Pizza',
  bat: '🦇 Bat', deer: '🦌 Deer', cumbia: '🎵 Music',
}

function buildAvatarUrl(opts: Record<string, string>, size = 200) {
  const params = new URLSearchParams()
  params.set('size', String(size))
  params.set('style', 'circle')
  params.set('facialHairProbability', '0')
  if (opts.skinColor) params.set('skinColor', opts.skinColor)
  if (opts.top) params.set('top', opts.top)
  if (opts.hairColor) params.set('hairColor', opts.hairColor)
  if (opts.eyes) params.set('eyes', opts.eyes)
  if (opts.eyebrows) params.set('eyebrows', opts.eyebrows)
  if (opts.mouth) params.set('mouth', opts.mouth)
  if (opts.clothing) params.set('clothing', opts.clothing)
  if (opts.clothesColor) params.set('clothesColor', opts.clothesColor)
  if (opts.clothingGraphic && opts.clothing === 'graphicShirt') params.set('clothingGraphic', opts.clothingGraphic)
  if (opts.accessories && opts.accessories !== 'none') {
    params.set('accessories', opts.accessories)
    params.set('accessoriesProbability', '100')
    if (opts.accessoriesColor) params.set('accessoriesColor', opts.accessoriesColor)
  } else {
    params.set('accessoriesProbability', '0')
  }
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`
}

export default function KidAvatarPage() {
  const [childName, setChildName] = useState('')
  const [opts, setOpts] = useState({
    skinColor: SKIN_TONES[0],
    top: 'shortFlat',
    hairColor: HAIR_COLORS[0],
    eyes: 'default',
    eyebrows: 'defaultNatural',
    mouth: 'smile',
    clothing: 'hoodie',
    clothesColor: CLOTHES_COLORS[0],
    clothingGraphic: 'bear',
    accessories: 'none',
    accessoriesColor: ACCESSORY_COLORS[0],
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('skin')

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || '')
  }, [])

  function set(key: string, val: string) {
    setOpts(o => ({ ...o, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const childId = localStorage.getItem('learni_child_id')
      const avatarUrl = buildAvatarUrl(opts, 400)
      await fetch('/api/kid/save-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, avatar: { ...opts, url: avatarUrl } }),
      })
      localStorage.setItem('learni_avatar_url', avatarUrl)
      window.location.href = '/kid-hub'
    } catch { setSaving(false) }
  }

  const avatarUrl = buildAvatarUrl(opts, 400)

  const TABS = [
    { id: 'skin', label: '👤', title: 'Skin' },
    { id: 'hair', label: '💇', title: 'Hair' },
    { id: 'face', label: '👀', title: 'Face' },
    { id: 'clothes', label: '👕', title: 'Clothes' },
    { id: 'extras', label: '✨', title: 'Extras' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28, #143330)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        gap: '32px',
        minHeight: '100vh',
      }}>
        {/* LEFT: Controls */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: '100px' }}>
          <a href="/kid-hub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>← Back</a>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '24px', fontWeight: 900, color: 'white', marginTop: '12px', marginBottom: '20px' }}>
            Design your look{childName ? `, ${childName}` : ''}!
          </h1>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: '10px 4px', borderRadius: '10px', border: 'none',
                background: activeTab === tab.id ? 'rgba(46,196,182,0.2)' : 'transparent',
                color: activeTab === tab.id ? '#2ec4b6' : 'rgba(255,255,255,0.4)',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              }}>
                <span style={{ fontSize: '18px' }}>{tab.label}</span>
                {tab.title}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeTab === 'skin' && (
              <Section title="Skin tone">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {SKIN_TONES.map(c => <ColorCircle key={c} color={`#${c}`} selected={opts.skinColor === c} onClick={() => set('skinColor', c)} />)}
                </div>
              </Section>
            )}

            {activeTab === 'hair' && (<>
              <Section title="Hair style">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {HAIR_STYLES.map(s => <Pill key={s} label={HAIR_LABELS[s] || s} selected={opts.top === s} onClick={() => set('top', s)} />)}
                </div>
              </Section>
              <Section title="Hair colour">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {HAIR_COLORS.map(c => <ColorCircle key={c} color={`#${c}`} selected={opts.hairColor === c} onClick={() => set('hairColor', c)} />)}
                </div>
              </Section>
            </>)}

            {activeTab === 'face' && (<>
              <Section title="Eyes">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {EYES.map(e => <Pill key={e} label={EYE_LABELS[e] || e} selected={opts.eyes === e} onClick={() => set('eyes', e)} />)}
                </div>
              </Section>
              <Section title="Eyebrows">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {EYEBROWS.map(e => <Pill key={e} label={e.replace(/([A-Z])/g, ' $1').trim()} selected={opts.eyebrows === e} onClick={() => set('eyebrows', e)} />)}
                </div>
              </Section>
              <Section title="Mouth">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {MOUTHS.map(m => <Pill key={m} label={MOUTH_LABELS[m] || m} selected={opts.mouth === m} onClick={() => set('mouth', m)} />)}
                </div>
              </Section>
            </>)}

            {activeTab === 'clothes' && (<>
              <Section title="Clothing">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CLOTHING.map(c => <Pill key={c} label={CLOTHING_LABELS[c] || c} selected={opts.clothing === c} onClick={() => set('clothing', c)} />)}
                </div>
              </Section>
              <Section title="Colour">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CLOTHES_COLORS.map(c => <ColorCircle key={c} color={`#${c}`} selected={opts.clothesColor === c} onClick={() => set('clothesColor', c)} />)}
                </div>
              </Section>
              {opts.clothing === 'graphicShirt' && (
                <Section title="Graphic">
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CLOTHING_GRAPHICS.map(g => <Pill key={g} label={GRAPHIC_LABELS[g] || g} selected={opts.clothingGraphic === g} onClick={() => set('clothingGraphic', g)} />)}
                  </div>
                </Section>
              )}
            </>)}

            {activeTab === 'extras' && (<>
              <Section title="Accessories">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ACCESSORIES.map(a => <Pill key={a} label={ACC_LABELS[a] || a} selected={opts.accessories === a} onClick={() => set('accessories', a)} />)}
                </div>
              </Section>
              {opts.accessories !== 'none' && (
                <Section title="Accessory colour">
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ACCESSORY_COLORS.map(c => <ColorCircle key={c} color={`#${c}`} selected={opts.accessoriesColor === c} onClick={() => set('accessoriesColor', c)} />)}
                  </div>
                </Section>
              )}
            </>)}
          </div>

          {/* Mobile save */}
          <div className="mobile-save" style={{ marginTop: '24px' }}>
            <button onClick={handleSave} disabled={saving} style={saveButtonStyle(saving)}>
              {saving ? 'Saving...' : "That's me! Let's go →"}
            </button>
          </div>
        </div>

        {/* RIGHT: Sticky avatar */}
        <div style={{
          width: '300px', flexShrink: 0, position: 'sticky',
          top: '76px', height: 'fit-content',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
        }} className="avatar-panel">
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px', padding: '24px', textAlign: 'center', width: '100%', boxSizing: 'border-box',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Your avatar"
              width={220}
              height={220}
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'block', margin: '0 auto 12px' }}
            />
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900, color: 'white' }}>
              {childName || 'You'}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Looking good! 🔥</div>
          </div>
          <button onClick={handleSave} disabled={saving} className="desktop-save" style={saveButtonStyle(saving)}>
            {saving ? 'Saving...' : "That's me! →"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 700px) {
          .avatar-panel {
            position: fixed !important; top: auto !important; bottom: 0 !important;
            left: 0 !important; right: 0 !important; width: 100% !important;
            flex-direction: row !important;
            background: rgba(13,43,40,0.95) !important;
            backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            padding: 12px 20px !important; z-index: 100 !important; gap: 12px !important; box-sizing: border-box !important;
          }
          .avatar-panel > div:first-child {
            padding: 4px !important; width: 60px !important; height: 60px !important;
            border-radius: 50% !important; flex-shrink: 0 !important; overflow: hidden !important;
          }
          .avatar-panel > div:first-child img { width: 60px !important; height: 60px !important; margin: 0 !important; }
          .avatar-panel > div:first-child > div:nth-child(2),
          .avatar-panel > div:first-child > div:nth-child(3) { display: none !important; }
          .avatar-panel .desktop-save { flex: 1 !important; padding: 14px 20px !important; font-size: 16px !important; }
          .mobile-save { display: none !important; }
        }
        @media (min-width: 701px) { .mobile-save { display: none !important; } }
      `}</style>
    </div>
  )
}

function saveButtonStyle(saving: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '16px',
    background: saving ? 'rgba(46,196,182,0.4)' : 'linear-gradient(135deg, #2ec4b6, #1ab5a8)',
    color: 'white', border: 'none', borderRadius: '30px',
    fontFamily: "'Nunito', sans-serif", fontSize: '18px', fontWeight: 900,
    cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px 16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      {children}
    </div>
  )
}

function ColorCircle({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '38px', height: '38px', borderRadius: '50%', background: color,
      border: selected ? '3px solid #2ec4b6' : '3px solid transparent',
      boxShadow: selected ? '0 0 0 2px rgba(46,196,182,0.4)' : 'none',
      cursor: 'pointer', transition: 'all 0.15s',
    }} />
  )
}

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 12px', borderRadius: '20px',
      background: selected ? 'rgba(46,196,182,0.2)' : 'rgba(255,255,255,0.05)',
      border: selected ? '1.5px solid #2ec4b6' : '1.5px solid rgba(255,255,255,0.08)',
      color: selected ? '#2ec4b6' : 'rgba(255,255,255,0.6)',
      fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  )
}
