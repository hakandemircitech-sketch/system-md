import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('waitlist')
      .upsert(
        { email: email.toLowerCase().trim(), blueprint_count: 0 },
        { onConflict: 'email' }
      )

    if (upsertError) {
      console.error('Waitlist upsert error:', JSON.stringify(upsertError))
      return NextResponse.json({ error: 'Failed to register email', detail: upsertError.message }, { status: 500 })
    }

    // Send verification email via Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const verifyToken = Buffer.from(`${email.toLowerCase().trim()}:${Date.now()}`).toString('base64url')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: tokenError } = await (supabase as any)
      .from('waitlist')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          verify_token: verifyToken,
          verified: false,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'email' }
      )

    if (tokenError) {
      console.error('Token save error:', JSON.stringify(tokenError))
      return NextResponse.json({ error: 'Failed to save email', detail: tokenError.message }, { status: 500 })
    }

    await resend.emails.send({
      from: 'SystemMD <onboarding@resend.dev>',
      to: email.trim(),
      subject: 'Verify your email — SystemMD',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#09090b;color:#ededed;font-family:monospace;padding:40px;margin:0">
  <div style="max-width:480px;margin:0 auto">
    <p style="color:#6366f1;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px">SYSTEMMD - EMAIL VERIFICATION</p>
    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;margin-bottom:16px;color:#ededed">Confirm your email.</h2>
    <p style="font-size:13px;color:#a1a1aa;line-height:1.6;margin-bottom:28px">Click the button below to verify your email and unlock your blueprint generation.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verifyToken}"
       style="display:inline-block;padding:12px 28px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-family:monospace">
      verify email
    </a>
    <p style="font-size:11px;color:#3f3f46;margin-top:32px">systemmd.com - This link expires in 24 hours.</p>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({ ok: true, requiresVerification: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
