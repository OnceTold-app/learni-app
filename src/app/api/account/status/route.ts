import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  // Also accept childId for kid-side checks
  const childId = req.nextUrl.searchParams.get('childId')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  let account = null

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await supabase
        .from('accounts')
        .select('id, plan, trial_ends_at, subscription_status, referral_code, referral_free_month, full_name, email')
        .eq('user_id', user.id)
        .single()
      account = data as any
    }
  } else if (childId) {
    // Get account via child
    const { data: learner } = await supabase
      .from('learners')
      .select('account_id')
      .eq('id', childId)
      .single()

    if (learner) {
      const { data } = await supabase
        .from('accounts')
        .select('id, plan, trial_ends_at, subscription_status')
        .eq('id', learner.account_id)
        .single()
      account = data
    }
  }

  if (!account) {
    return NextResponse.json({ canAccess: true, reason: 'no_account' }) // Allow if no account found (edge case)
  }

  // Check access
  const now = new Date()
  const trialEnd = account.trial_ends_at ? new Date(account.trial_ends_at) : null
  const isTrialing = trialEnd && trialEnd > now
  const isActive = account.subscription_status === 'active'
  const isPastDue = account.subscription_status === 'past_due'

  const canAccess = isActive || isTrialing || isPastDue // Allow past_due a grace period
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0

  return NextResponse.json({
    canAccess,
    isTrialing,
    isActive,
    daysLeft,
    plan: account.plan || 'trial',
    subscriptionStatus: account.subscription_status,
    subscription_status: account.subscription_status,
    trial_ends_at: account.trial_ends_at || null,
    name: (account as any).full_name || null,
    email: (account as any).email || null,
    referralCode: (account as any).referral_code || null,
    referralFreeMonth: (account as any).referral_free_month || false,
  })
}
