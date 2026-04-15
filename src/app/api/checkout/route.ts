import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const { email, childCount = 1 } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const standardPrice = process.env.STRIPE_PRICE_STANDARD
    const addonPrice = process.env.STRIPE_PRICE_ADDON

    // Build line items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = [
      { price: standardPrice, quantity: 1 },
    ]

    if (childCount > 1 && addonPrice) {
      lineItems.push({ price: addonPrice, quantity: childCount - 1 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      subscription_data: {
        trial_period_days: 7,
      },
      allow_promotion_codes: true,
      success_url: `${req.nextUrl.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/subscribe`,
      metadata: {
        product: 'learni',
        child_count: String(childCount),
      },
    } as Parameters<typeof stripe.checkout.sessions.create>[0])

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
