import Stripe from 'stripe'

// Lazy init — avoids build-time crash when env vars aren't set
let _stripe: Stripe | null = null
export function getStripe() {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

// Price IDs — set in Stripe dashboard, stored as env vars
export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  family:  process.env.STRIPE_PRICE_FAMILY || '',
} as const

export type PlanKey = keyof typeof PRICE_IDS
