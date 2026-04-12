import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// Price IDs — set in Stripe dashboard, stored as env vars
export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  family:  process.env.STRIPE_PRICE_FAMILY!,
} as const

export type PlanKey = keyof typeof PRICE_IDS
