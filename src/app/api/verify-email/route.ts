import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function htmlPage(content: string) {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SystemMD</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #09090b; color: #ededed; font-family: 'Courier New', monospace; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 420px; width: 100%; background: #0f0f12; border: 1px solid #1f1f27; border-radius: 12px; padding: 40px; }
    .label { font-size: 10px; color: #6366f1; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 20px; }
    .title { font-family: Georgia, serif; font-size: 26px; font-weight: 400; color: #ededed; margin-bottom: 12px; letter-spacing: -0.02em; }
    .subtitle { font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-family: 'Courier New', monospace; }
    .btn-ghost { display: inline-block; padding: 12px 24px; background: transparent; color: #a1a1aa; text-decoration: none; border-radius: 8px; font-size: 13px; font-family: 'Courier New', monospace; border: 1px solid #27272f; }
    .error { color: #ef4444; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #1f1f27; font-size: 11px; color: #3f3f46; }
  </style>
</head>
<body>
  <div class="card">${content}</div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return htmlPage(`
      <div class="label">systemmd</div>
      <div class="title error">Invalid link.</div>
      <div class="subtitle">This verification link is not valid.</div>
      <a href="/" class="btn-ghost">back to systemmd</a>
    `)
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('waitlist')
    .update({ verified: true, verify_token: null })
    .eq('verify_token', token)
    .select('email')
    .single()

  if (error || !data) {
    return htmlPage(`
      <div class="label">systemmd</div>
      <div class="title error">Link expired or already used.</div>
      <div class="subtitle">This link may have already been used. Go back and try again with your email.</div>
      <a href="/" class="btn-ghost">back to systemmd</a>
      <div class="footer">systemmd.com</div>
    `)
  }

  return htmlPage(`
    <div class="label">systemmd - verified</div>
    <div class="title">Email verified.</div>
    <div class="subtitle">Your email <strong style="color:#ededed">${data.email}</strong> has been confirmed. Go back and generate your blueprint.</div>
    <a href="/" class="btn">back to systemmd</a>
    <div class="footer">systemmd.com - Welcome to the build.</div>
  `)
}
