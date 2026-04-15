import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: account } = await supabase
    .from('accounts')
    .select('stripe_customer_id, email')
    .eq('user_id', user.id)
    .single()

  // No Stripe customer yet — send them to checkout instead
  if (!account?.stripe_customer_id) {
    const stripe = getStripe()
    const standardPrice = process.env.STRIPE_PRICE_STANDARD
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: account?.email || user.email || '',
      line_items: [{ price: standardPrice, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      allow_promotion_codes: true,
      success_url: `${req.nextUrl.origin}/dashboard`,
      cancel_url: `${req.nextUrl.origin}/account`,
    } as Parameters<typeof stripe.checkout.sessions.create>[0])
    return NextResponse.json({ url: session.url })
  }

  // Has Stripe customer — open the billing portal
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripe_customer_id,
    return_url: `${req.nextUrl.origin}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
