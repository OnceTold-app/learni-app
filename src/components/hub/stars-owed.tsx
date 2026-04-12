'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LearnerSummary } from '@/types'

interface StarsOwedProps {
  learner: LearnerSummary
  starsPerDollar: number
  onPaid: () => void
}

export function StarsOwed({ learner, starsPerDollar, onPaid }: StarsOwedProps) {
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  const dollarsOwed = learner.dollarsOwed
  const hasBalance = dollarsOwed > 0

  async function handleMarkPaid() {
    if (!hasBalance || loading) return
    setLoading(true)

    const supabase = createClient()

    // Insert a negative ledger entry to zero the balance
    const { error } = await supabase.from('star_ledger').insert({
      learner_id: learner.learner.id,
      type: 'paid_out',
      stars: -learner.starsOwedTotal,         // negative = paid out
      dollar_value: -dollarsOwed,
      note: `Paid by parent — ${new Date().toLocaleDateString('en-NZ')}`,
    })

    setLoading(false)

    if (!error) {
      setPaid(true)
      onPaid()
    }
  }

  return (
    <div className="rounded-card bg-ink p-6 text-white">
      <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
        {learner.learner.name} is owed
      </div>

      <div className="font-nunito font-black text-5xl text-turq mb-1">
        ${dollarsOwed.toFixed(2)}
      </div>

      <div className="text-sm text-white/40 mb-6">
        {learner.starsOwedTotal} stars × {starsPerDollar} per dollar
      </div>

      {paid ? (
        <div className="text-sm font-semibold text-turq">
          ✓ Marked as paid
        </div>
      ) : hasBalance ? (
        <button
          onClick={handleMarkPaid}
          disabled={loading}
          className="w-full bg-turq text-white font-nunito font-black text-base rounded-pill py-3.5 hover:bg-turq-deep transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Mark as paid →'}
        </button>
      ) : (
        <div className="text-sm text-white/30">
          All paid up ✓
        </div>
      )}
    </div>
  )
}
