import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface ProfileUpdatePayload {
  full_name?: string
  username?: string
  timezone?: string
  language?: string
  avatar_url?: string
}

export interface ProfileResponse {
  ok: boolean
  error?: string
}

export async function PATCH(req: Request): Promise<NextResponse<ProfileResponse>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = (await req.json()) as ProfileUpdatePayload

    const updatePayload: Record<string, string> = {}
    if (body.full_name !== undefined) updatePayload['full_name'] = body.full_name
    if (body.username !== undefined) updatePayload['username'] = body.username
    if (body.timezone !== undefined) updatePayload['timezone'] = body.timezone
    if (body.language !== undefined) updatePayload['language'] = body.language
    if (body.avatar_url !== undefined) updatePayload['avatar_url'] = body.avatar_url

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ ok: true })
    }

    const { error } = await supabase
      .from('users')
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: false, error: 'Bu kullanıcı adı zaten kullanılıyor' }, { status: 409 })
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    // Email update handled via Supabase auth
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
