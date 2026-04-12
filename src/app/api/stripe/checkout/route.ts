import { NextResponse } from 'next/server'
import { stripe, PRICE_IDS, type PlanKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // 1. Verify authentication — never trust the request body for identity
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // 2. Parse and validate plan
  const body = await req.json()
  const plan = body.plan as PlanKey

  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // 3. Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,   // links Stripe customer back to Supabase user
    subscription_data: {
      trial_period_days: 14,
      metadata: { supabase_user_id: user.id, plan },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/hub?signup=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?cancelled=true`,
    currency: 'nzd',
  })

  return NextResponse.json({ url: session.url })
}
