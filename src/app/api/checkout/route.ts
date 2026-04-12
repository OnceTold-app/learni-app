import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion })

export async function POST(req: NextRequest) {
  try {
    const { email, priceId, childCount = 1 } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const standardPrice = priceId || process.env.STRIPE_PRICE_STANDARD
    const addonPrice = process.env.STRIPE_PRICE_ADDON

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: standardPrice, quantity: 1 },
    ]

    // Add extra children if more than 1
    if (childCount > 1 && addonPrice) {
      lineItems.push({ price: addonPrice, quantity: childCount - 1 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      subscription_data: {
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
      success_url: `${req.nextUrl.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/subscribe`,
      metadata: {
        product: 'learni',
        child_count: String(childCount),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
