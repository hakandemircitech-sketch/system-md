import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const oauthError = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (oauthError) {
    console.error('[auth/callback] OAuth error:', oauthError, searchParams.get('error_description'))
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(oauthError)}`,
    )
  }

  if (code) {
    const safePath = next.startsWith('/') ? next : '/dashboard'

    // Redirect response'u ÖNCE oluştur — cookie'ler buna yazılacak
    const response = NextResponse.redirect(`${appUrl}${safePath}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Gelen cookie'leri request'ten oku
          getAll() {
            return request.cookies.getAll()
          },
          // Session cookie'lerini direkt redirect response'a yaz
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            )
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // response artık Set-Cookie header'larını taşıyor
      return response
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.status)
  } else {
    console.error('[auth/callback] No authorization code in callback URL')
  }

  return NextResponse.redirect(`${appUrl}/auth/login?error=callback`)
}
