'use client'

import { useState, useEffect, useRef } from 'react'

export default function KidAvatarPage() {
  const [childName, setChildName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showCreator, setShowCreator] = useState(true)
  const [saving, setSaving] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setChildName(localStorage.getItem('learni_child_name') || '')

    // Listen for Ready Player Me events
    function handleMessage(event: MessageEvent) {
      // RPM sends from their domain
      if (!event.data || typeof event.data !== 'string') return

      try {
        const data = JSON.parse(event.data)

        // Avatar exported — we get the .glb URL
        if (data.eventName === 'v1.avatar.exported') {
          const glbUrl = data.data?.url
          if (glbUrl) {
            // Convert .glb to .png for 2D render
            const pngUrl = glbUrl.replace('.glb', '.png') + '?scene=fullbody-portrait-v1&blendShapes[Wolf3D_Head][mouthSmile]=0.3'
            setAvatarUrl(pngUrl)
            setShowCreator(false)
          }
        }

        // User closed the creator
        if (data.eventName === 'v1.frame.ready') {
          // Frame is loaded and ready
        }
      } catch {
        // Not JSON, ignore
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  async function handleSave() {
    if (!avatarUrl) return
    setSaving(true)
    try {
      const childId = localStorage.getItem('learni_child_id')
      await fetch('/api/kid/save-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, avatar: { url: avatarUrl, provider: 'readyplayerme' } }),
      })
      localStorage.setItem('learni_avatar_url', avatarUrl)
      window.location.href = '/kid-hub'
    } catch {
      setSaving(false)
    }
  }

  function handleRetry() {
    setAvatarUrl('')
    setShowCreator(true)
  }

  // RPM iframe URL with config
  const rpmUrl = 'https://learni.readyplayer.me/avatar?frameApi&clearCache'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2b28, #143330)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {showCreator ? (
        // Full-screen RPM creator
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}>
            <a href="/kid-hub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Back</a>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '16px', fontWeight: 900, color: 'white' }}>
              Create your avatar{childName ? `, ${childName}` : ''}
            </span>
            <span style={{ width: '40px' }} />
          </div>
          <iframe
            ref={iframeRef}
            src={rpmUrl}
            style={{
              flex: 1,
              width: '100%',
              border: 'none',
              background: '#1a1a2e',
            }}
            allow="camera *; microphone *; clipboard-write"
          />
        </div>
      ) : (
        // Confirmation screen
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '28px',
              fontWeight: 900,
              color: 'white',
              marginBottom: '8px',
            }}>
              Looking good! 🔥
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '32px' }}>
              This is your avatar, {childName}
            </p>

            {/* Avatar preview */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '24px',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt="Your avatar"
                width={250}
                height={250}
                style={{
                  borderRadius: '20px',
                  display: 'block',
                  margin: '0 auto',
                  background: 'rgba(255,255,255,0.02)',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  boxShadow: '0 8px 32px rgba(46,196,182,0.3)',
                }}
              >
                {saving ? 'Saving...' : "That's me! Let's go →"}
              </button>
              <button
                onClick={handleRetry}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '30px',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
