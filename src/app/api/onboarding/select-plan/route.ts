import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()

    if (!['free', 'pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Free plan: activate immediately, no payment needed
    if (plan === 'free') {
      const { error } = await supabase
        .from('users')
        .update({ plan: 'free', updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('[onboarding] plan update error:', error)
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, redirect: '/dashboard' })
    }

    // Pro / Team: payment required — return pending state
    // When payment provider is ready, replace this with checkout session creation
    return NextResponse.json({
      ok: true,
      requiresPayment: true,
      plan,
    })
  } catch (err) {
    console.error('[onboarding] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
