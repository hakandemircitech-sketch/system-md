import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  pro:  30,
  team: 150,
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('plan, blueprint_count')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const plan = (profile.plan ?? 'free') as string
    const used = profile.blueprint_count ?? 0
    const limit = PLAN_LIMITS[plan] ?? 10
    const remaining = Math.max(0, limit - used)

    return NextResponse.json({
      plan,
      used,
      limit,
      remaining,
      isAtLimit: remaining === 0,
    })
  } catch (err) {
    console.error('[usage] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
