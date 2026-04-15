import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { referral_code, new_user_email } = await req.json()

    if (!referral_code) {
      return NextResponse.json({ error: 'referral_code required' }, { status: 400 })
    }

    // Find the account that owns this referral code
    const { data: referrer, error: refError } = await supabase
      .from('accounts')
      .select('id, email, full_name, referral_credit_days')
      .eq('referral_code', referral_code.toUpperCase())
      .single()

    if (refError || !referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    // Give the referrer 7 days credit (accumulates if they refer multiple people)
    const currentCredit = referrer.referral_credit_days || 0
    await supabase
      .from('accounts')
      .update({ referral_credit_days: currentCredit + 7 })
      .eq('id', referrer.id)

    // New user gets nothing extra — standard 7-day trial is enough
    // (do not flag new_user_email for any credit)
    void new_user_email // acknowledged but not used

    return NextResponse.json({
      success: true,
      referrer_email: referrer.email,
      message: 'Referrer credited 7 days. New user gets standard trial only.',
    })
  } catch (err) {
    console.error('Referral track error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: look up a referral code (for landing page personalisation)
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

  const { data, error } = await supabase
    .from('accounts')
    .select('full_name, referral_code')
    .eq('referral_code', code.toUpperCase())
    .single()

  if (error || !data) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true, referrer_name: data.full_name })
}
