import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('blueprints')
    .select(
      'id, title, idea_text, industry, stage, status, score_total, score_market, score_tech, score_revenue, score_brand, tokens_used, model_used, created_at, target_users, is_public'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/blueprint]', error)
    return NextResponse.json({ error: 'Could not load blueprints.' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
