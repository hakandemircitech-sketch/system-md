import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface DangerResponse {
  ok: boolean
  error?: string
}

// DELETE /api/settings/danger?action=delete-account|clear-library|revoke-keys
export async function DELETE(req: Request): Promise<NextResponse<DangerResponse>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'clear-library') {
      const { error } = await supabase
        .from('blueprints')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
      }

      // Reset blueprint count
      await supabase
        .from('users')
        .update({ blueprint_count: 0, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      return NextResponse.json({ ok: true })
    }

    if (action === 'delete-account') {
      // Delete all user data first
      await supabase.from('blueprints').delete().eq('user_id', user.id)
      await supabase.from('users').delete().eq('id', user.id)

      // Sign out
      await supabase.auth.signOut()

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Geçersiz işlem' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
