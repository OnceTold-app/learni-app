'use client'

import { useState, useEffect } from 'react'

interface AccountStatus {
  name?: string
  email?: string
  plan?: string
  subscription_status?: string
  trial_ends_at?: string
}

interface Child {
  id: string
  name: string
  year_level: number
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountStatus>({})
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)

  // Editable profile fields
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('learni_parent_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    Promise.all([
      fetch('/api/account/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
      fetch('/api/parent/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
    ]).then(([accountData, childrenData]) => {
      setAccount(accountData || {})
      setEditName(accountData?.name || '')
      setEditEmail(accountData?.email || '')
      setChildren(childrenData.children || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile() {
    setProfileSaving(true)
    setProfileError('')
    try {
      const token = localStorage.getItem('learni_parent_token')
      const res = await fetch('/api/account/update', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName, email: editEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setAccount(prev => ({ ...prev, name: editName }))
        localStorage.setItem('learni_parent_name', editName)
        setProfileSaved(true)
        if (editEmail !== account.email) {
          setProfileError('Name saved. A confirmation link has been sent to ' + editEmail + ' — click it to confirm your new login email.')
        } else {
          setTimeout(() => setProfileSaved(false), 3000)
        }
      } else {
        setProfileError(data.error || 'Failed to save. Please try again.')
      }
    } catch {
      setProfileError('Something went wrong. Please try again.')
    }
    setProfileSaving(false)
  }

  async function handleManageBilling() {
    setBillingLoading(true)
    try {
      const token = localStorage.getItem('learni_parent_token')
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not open billing portal. Please try again.')
      }
    } catch {
      alert('Could not open billing portal. Please try again.')
    }
    setBillingLoading(false)
  }

  function handleDeleteConfirm() {
    if (deleteInput === 'DELETE') {
      setDeleteSuccess(true)
    }
  }

  function formatTrialDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Nunito', sans-serif",
    fontSize: '18px',
    fontWeight: 800,
    color: '#0d2b28',
    marginBottom: '16px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#5a8a84',
    marginBottom: '4px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid rgba(13,43,40,0.12)',
    borderRadius: '10px',
    fontSize: '15px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#0d2b28',
    background: '#fafefe',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '14px',
  }

  const noteStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#5a8a84',
    marginTop: '12px',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0faf9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#5a8a84', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0faf9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header bar */}
      <div style={{
        background: '#0d2b28',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>← Back to Hub</a>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Account Settings</span>
        <span style={{ width: '80px' }} />
      </div>

      <div className="account-content" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Section 1 — Your Account */}
        <div style={cardStyle}>
          <div style={headingStyle}>Your Account</div>

          <div style={labelStyle}>Name</div>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            style={inputStyle}
            placeholder="Your name"
          />

          <div style={labelStyle}>Email</div>
          <input
            type="email"
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
            style={inputStyle}
            placeholder="your@email.com"
          />

          {profileError && (
            <div style={{ color: '#c0392b', fontSize: '13px', marginBottom: '10px' }}>{profileError}</div>
          )}
          {profileMessage && (
            <div style={{ color: '#0d2b28', background: '#e8f5f3', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '10px', lineHeight: 1.6 }}>{profileMessage}</div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            style={{
              background: profileSaved ? '#27ae60' : '#2ec4b6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: profileSaving ? 'not-allowed' : 'pointer',
              opacity: profileSaving ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {profileSaved ? '✓ Saved!' : profileSaving ? 'Saving…' : 'Save changes'}
          </button>

          <div style={noteStyle}>To change your password, go to the login page and use Forgot password.</div>
        </div>

        {/* Section 2 — Billing & Subscription */}
        <div style={cardStyle}>
          <div style={headingStyle}>Billing & Subscription</div>
          <div style={labelStyle}>Plan</div>
          <div style={{ fontSize: '15px', color: '#0d2b28', marginBottom: '16px' }}>
            {account.subscription_status === 'trialing' && account.trial_ends_at
              ? `Trial ends ${formatTrialDate(account.trial_ends_at)}`
              : account.subscription_status === 'active'
              ? 'Active — $49/month'
              : account.plan || 'Free'}
          </div>
          <button
            onClick={handleManageBilling}
            disabled={billingLoading}
            style={{
              background: '#2ec4b6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: billingLoading ? 'not-allowed' : 'pointer',
              opacity: billingLoading ? 0.7 : 1,
            }}
          >
            {billingLoading ? 'Opening…' : 'Manage billing →'}
          </button>
          <div style={noteStyle}>Update card, view invoices, or cancel your subscription.</div>
        </div>

        {/* Section 3 — Children */}
        <div style={cardStyle}>
          <div style={headingStyle}>Children</div>
          {children.length === 0 ? (
            <div style={{ color: '#5a8a84', fontSize: '14px', marginBottom: '16px' }}>No children added yet.</div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              {children.map(child => (
                <div key={child.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0faf9',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0d2b28', fontSize: '15px' }}>{child.name}</div>
                    <div style={{ fontSize: '13px', color: '#5a8a84' }}>Year {child.year_level}</div>
                  </div>
                  <a href={`/manage-child?id=${child.id}`} style={{ fontSize: '13px', color: '#2ec4b6', fontWeight: 600, textDecoration: 'none' }}>Edit</a>
                </div>
              ))}
            </div>
          )}
          <a href="/onboarding" style={{
            display: 'inline-block',
            background: '#f0faf9',
            color: '#0d2b28',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
          }}>Add another child →</a>
        </div>

        {/* Section 4 — Danger Zone */}
        <div style={{ ...cardStyle, border: '2px solid #fee2e2', background: '#fff5f5' }}>
          <div style={{ ...headingStyle, color: '#c0392b' }}>Danger Zone</div>
          {deleteSuccess ? (
            <div style={{ fontSize: '14px', color: '#0d2b28', lineHeight: 1.6 }}>
              Please email <strong>hello@learniapp.co</strong> to complete deletion. We will process it within 5 business days.
            </div>
          ) : !deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{
                background: 'white',
                color: '#c0392b',
                border: '1.5px solid #fca5a5',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Delete my account
            </button>
          ) : (
            <div>
              <div style={{ fontSize: '14px', color: '#0d2b28', marginBottom: '12px', lineHeight: 1.6 }}>
                This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.
              </div>
              <input
                type="text"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #fca5a5', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteInput !== 'DELETE'}
                  style={{ background: deleteInput === 'DELETE' ? '#c0392b' : '#fca5a5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed' }}
                >
                  Confirm delete
                </button>
                <button
                  onClick={() => { setDeleteConfirm(false); setDeleteInput('') }}
                  style={{ background: 'white', color: '#5a8a84', border: '1.5px solid #d1d5db', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Log out */}
        <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
          <a
            href="/login"
            onClick={() => localStorage.clear()}
            style={{ fontSize: '13px', color: '#5a8a84', textDecoration: 'none' }}
          >
            Log out
          </a>
        </div>

      </div>
      <style jsx global>{`
        @media (min-width: 768px) {
          .account-content { max-width: 740px !important; }
        }
      `}</style>
    </div>
  )
}
