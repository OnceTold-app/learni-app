'use client'
import { useState } from 'react'

interface EarniFABProps {
  context: 'parent_portal' | 'child_portal' | 'session_picker' | 'in_session'
  currentQuestion?: string
  currentTopic?: string
  size?: 'parent' | 'child'  // parent = 48px, child = 60px
  sessionStyle?: boolean // true = show as "?" in header, not a FAB
}

export default function EarniFAB({ context, currentQuestion, currentTopic, size = 'child', sessionStyle = false }: EarniFABProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const dim = size === 'parent' ? 48 : 60

  const greetings: Record<string, string> = {
    parent_portal: 'What would you like help with?',
    child_portal: "Hey! Not sure what to do? Tell me what's confusing.",
    session_picker: "Not sure what to pick? Tell me and I'll help.",
    in_session: "No worries — what's confusing? Tell me and we'll sort it out.",
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/earni-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `context:${context}${currentQuestion ? ` question:${currentQuestion}` : ''}${currentTopic ? ` topic:${currentTopic}` : ''}` },
            ...messages,
            { role: 'user', content: userMsg }
          ]
        })
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', content: data.reply || "I'm not sure — try asking again." }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Something went wrong. Try again!" }])
    }
    setLoading(false)
  }

  if (sessionStyle) {
    return (
      <>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: '16px', fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Nunito', sans-serif",
          }}
          aria-label="Get help from Earni"
        >
          ?
        </button>
        {open && <ChatPanel messages={messages} input={input} setInput={setInput} send={send} loading={loading} greeting={greetings[context]} onClose={() => setOpen(false)} context={context} />}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: `${dim}px`, height: `${dim}px`, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2ec4b6, #1a9e92)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(46,196,182,0.4)',
          fontSize: dim === 60 ? '28px' : '22px',
        }}
        aria-label="Chat with Earni"
        aria-expanded={open}
      >
        {open ? '✕' : '🤖'}
      </button>
      {open && <ChatPanel messages={messages} input={input} setInput={setInput} send={send} loading={loading} greeting={greetings[context]} onClose={() => setOpen(false)} context={context} />}
    </>
  )
}

function ChatPanel({ messages, input, setInput, send, loading, greeting, onClose, context }: {
  messages: Array<{role: string, content: string}>
  input: string
  setInput: (v: string) => void
  send: () => void
  loading: boolean
  greeting: string
  onClose: () => void
  context: string
}) {
  const isParent = context === 'parent_portal'
  return (
    <div style={{
      position: 'fixed', bottom: '96px', right: '24px', zIndex: 999,
      width: '320px', maxHeight: '440px',
      background: isParent ? 'white' : '#0d2b28',
      borderRadius: '20px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      border: isParent ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(46,196,182,0.2)',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${isParent ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '24px' }}>🤖</span>
        <div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: '14px', color: isParent ? '#0d2b28' : 'white' }}>Earni</div>
          <div style={{ fontSize: '11px', color: isParent ? '#5a8a84' : 'rgba(255,255,255,0.4)' }}>{greeting}</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: isParent ? '#5a8a84' : 'rgba(255,255,255,0.4)', fontSize: '18px' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ fontSize: '13px', color: isParent ? '#5a8a84' : 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '20px' }}>
            Ask me anything
          </div>
        )}
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#2ec4b6' : (isParent ? '#f0faf9' : 'rgba(255,255,255,0.08)'),
            color: m.role === 'user' ? 'white' : (isParent ? '#0d2b28' : 'white'),
            padding: '10px 14px', borderRadius: '14px', maxWidth: '85%',
            fontSize: '13px', lineHeight: 1.5,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: isParent ? '#5a8a84' : 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Earni is thinking...</div>}
      </div>
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${isParent ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask Earni..."
          aria-label="Ask Earni a question"
          style={{
            flex: 1, padding: '10px 14px',
            background: isParent ? '#f7fafa' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${isParent ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '20px', fontSize: '13px',
            color: isParent ? '#0d2b28' : 'white',
            outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} aria-label="Send message" style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: input.trim() ? '#2ec4b6' : 'rgba(46,196,182,0.3)',
          border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
          color: 'white', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>→</button>
      </div>
    </div>
  )
}
