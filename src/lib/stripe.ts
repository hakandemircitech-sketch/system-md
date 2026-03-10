import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

export const STRIPE_PRICES = {
  solo: {
    monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_SOLO_YEARLY!,
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY!,
  },
} as const

export const PLAN_PRICES = {
  solo: { monthly: 19, yearly: 15 },
  agency: { monthly: 59, yearly: 47 },
} as const
