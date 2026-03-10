import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/components'
import { createElement } from 'react'
import WelcomeEmail from '@/emails/WelcomeEmail'
import BlueprintCompletedEmail from '@/emails/BlueprintCompletedEmail'
import UsageLimitEmail from '@/emails/UsageLimitEmail'
import PlanUpgradedEmail from '@/emails/PlanUpgradedEmail'
import PaymentFailedEmail from '@/emails/PaymentFailedEmail'

// Yalnızca development ortamında çalışır
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') ?? 'welcome'
  const format = searchParams.get('format') ?? 'html'

  let emailComponent: React.ReactElement

  switch (template) {
    case 'welcome':
      emailComponent = createElement(WelcomeEmail, {
        userName: 'Mehmet',
      })
      break

    case 'blueprint-completed':
      emailComponent = createElement(BlueprintCompletedEmail, {
        userName: 'Ayşe',
        blueprintTitle: 'AI Destekli Restoran Rezervasyon Sistemi',
        blueprintScore: 87,
        blueprintId: 'bp_preview_123',
      })
      break

    case 'usage-limit-80':
      emailComponent = createElement(UsageLimitEmail, {
        userName: 'Can',
        usedCount: 16,
        totalLimit: 20,
        percentage: 80,
      })
      break

    case 'usage-limit-100':
      emailComponent = createElement(UsageLimitEmail, {
        userName: 'Zeynep',
        usedCount: 20,
        totalLimit: 20,
        percentage: 100,
      })
      break

    case 'plan-upgraded-solo':
      emailComponent = createElement(PlanUpgradedEmail, {
        userName: 'Ali',
        newPlan: 'solo',
        billingCycle: 'monthly',
      })
      break

    case 'plan-upgraded-agency':
      emailComponent = createElement(PlanUpgradedEmail, {
        userName: 'Elif',
        newPlan: 'agency',
        billingCycle: 'yearly',
      })
      break

    case 'payment-failed':
      emailComponent = createElement(PaymentFailedEmail, {
        userName: 'Burak',
        planName: 'Solo',
        nextRetryDate: '13 Mart 2026',
      })
      break

    default:
      return NextResponse.json(
        { error: `Bilinmeyen şablon: "${template}"`, available: TEMPLATES.map((t) => t.id) },
        { status: 400 }
      )
  }

  if (format === 'text') {
    const text = await render(emailComponent, { plainText: true })
    return new NextResponse(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const html = await render(emailComponent)
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// ─── Şablon Listesi (/api/email-preview/list) ────────────────────────────────

const TEMPLATES = [
  { id: 'welcome', label: 'Hoş Geldin Emaili' },
  { id: 'blueprint-completed', label: 'Blueprint Tamamlandı' },
  { id: 'usage-limit-80', label: 'Kullanım Limiti %80' },
  { id: 'usage-limit-100', label: 'Kullanım Limiti %100 (Doldu)' },
  { id: 'plan-upgraded-solo', label: 'Plan Yükseltildi — Solo (Aylık)' },
  { id: 'plan-upgraded-agency', label: 'Plan Yükseltildi — Agency (Yıllık)' },
  { id: 'payment-failed', label: 'Ödeme Başarısız' },
]
