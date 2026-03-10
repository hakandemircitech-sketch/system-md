import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface PreferencesPayload {
  notifications?: {
    blueprint_generated: boolean
    deployment_complete: boolean
    usage_warnings: boolean
    weekly_digest: boolean
    product_updates: boolean
    realtime_alerts: boolean
    sound_effects: boolean
  }
  ai?: {
    model: string
    streaming: boolean
    auto_save: boolean
    include_market_data: boolean
    default_industry: string
  }
}

export interface PreferencesResponse {
  ok: boolean
  error?: string
}

export async function PATCH(req: Request): Promise<NextResponse<PreferencesResponse>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = (await req.json()) as PreferencesPayload

    // Store preferences in Supabase auth user metadata
    const currentMeta = (user.user_metadata ?? {}) as Record<string, unknown>
    const updatedMeta: Record<string, unknown> = { ...currentMeta }

    if (body.notifications) {
      updatedMeta['notifications'] = body.notifications
    }
    if (body.ai) {
      updatedMeta['ai_preferences'] = body.ai
    }

    const { error } = await supabase.auth.updateUser({
      data: updatedMeta,
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
