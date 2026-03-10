import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { message, email } = await req.json()

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const senderLabel = email && typeof email === 'string' && email.includes('@')
      ? email.trim()
      : 'Anonymous'

    const { error } = await resend.emails.send({
      from: 'SystemMD <onboarding@resend.dev>',
      to: 'hakandemircitech@gmail.com',
      subject: `SystemMD — New message from ${senderLabel}`,
      html: `
        <div style="font-family: monospace; max-width: 600px; padding: 32px; background: #09090b; color: #ededed; border-radius: 8px;">
          <p style="color: #6366f1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
            systemmd · new message
          </p>
          <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 8px;">from</p>
          <p style="font-size: 15px; color: #ededed; margin-bottom: 24px;">${senderLabel}</p>
          <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 8px;">message</p>
          <p style="font-size: 15px; color: #ededed; line-height: 1.7; white-space: pre-wrap;">${message.trim()}</p>
          <hr style="border: none; border-top: 1px solid #1f1f27; margin: 32px 0;" />
          <p style="font-size: 11px; color: #3f3f46;">systemmd.com · ${new Date().toISOString()}</p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
