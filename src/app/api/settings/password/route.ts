import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface PasswordPayload {
  current_password: string
  new_password: string
}

export interface PasswordResponse {
  ok: boolean
  error?: string
}

export async function POST(req: Request): Promise<NextResponse<PasswordResponse>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = (await req.json()) as PasswordPayload

    if (!body.current_password) {
      return NextResponse.json({ ok: false, error: 'Mevcut şifre gerekli' }, { status: 400 })
    }

    if (!body.new_password || body.new_password.length < 8) {
      return NextResponse.json({ ok: false, error: 'Yeni şifre en az 8 karakter olmalı' }, { status: 400 })
    }

    if (body.current_password === body.new_password) {
      return NextResponse.json({ ok: false, error: 'Yeni şifre mevcut şifreden farklı olmalı' }, { status: 400 })
    }

    // Verify current password via re-authentication
    const email = user.email
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Kullanıcı e-postası bulunamadı' }, { status: 400 })
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: body.current_password,
    })

    if (signInError) {
      return NextResponse.json({ ok: false, error: 'Mevcut şifre yanlış' }, { status: 400 })
    }

    const { error } = await supabase.auth.updateUser({
      password: body.new_password,
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
