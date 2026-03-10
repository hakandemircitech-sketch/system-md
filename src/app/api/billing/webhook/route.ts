import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'İmza eksik' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[billing/webhook] İmza doğrulama hatası:', err)
    return NextResponse.json({ error: 'Webhook imzası geçersiz' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan
        const customerId = session.customer as string

        if (!userId || !plan) break

        const validPlan = (plan === 'pro' || plan === 'team') ? plan : 'free'

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: session.subscription as string,
            stripe_price_id: session.metadata?.priceId ?? null,
            plan: validPlan,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

        await supabase
          .from('users')
          .update({ plan: validPlan, updated_at: new Date().toISOString() })
          .eq('id', userId)

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!sub) break

        await supabase.from('invoices').insert({
          user_id: sub.user_id,
          stripe_invoice_id: invoice.id,
          amount_usd: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: 'paid',
          description: invoice.description,
          paid_at: new Date().toISOString(),
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId)

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const { data: subRecord } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!subRecord) break

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId)

        await supabase
          .from('users')
          .update({ plan: 'free', plan_expires_at: null, updated_at: new Date().toISOString() })
          .eq('id', subRecord.user_id)

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[billing/webhook] İşlem hatası:', error)
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 })
  }
}
