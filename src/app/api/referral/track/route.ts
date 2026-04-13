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
      .select('id, email, full_name, referral_free_month')
      .eq('referral_code', referral_code.toUpperCase())
      .single()

    if (refError || !referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    // Flag the referrer for a free month (if not already flagged)
    if (!referrer.referral_free_month) {
      await supabase
        .from('accounts')
        .update({ referral_free_month: true })
        .eq('id', referrer.id)
    }

    // Also flag the new user if we can find their account
    if (new_user_email) {
      await supabase
        .from('accounts')
        .update({ referral_free_month: true })
        .eq('email', new_user_email)
    }

    return NextResponse.json({
      success: true,
      referrer_email: referrer.email,
      message: 'Both accounts flagged for free month — will apply Stripe coupon on next billing cycle.',
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
