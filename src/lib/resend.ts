import { Resend } from 'resend'
import { createElement } from 'react'
import WelcomeEmail from '@/emails/WelcomeEmail'
import BlueprintCompletedEmail from '@/emails/BlueprintCompletedEmail'
import UsageLimitEmail from '@/emails/UsageLimitEmail'
import PlanUpgradedEmail from '@/emails/PlanUpgradedEmail'
import PaymentFailedEmail from '@/emails/PaymentFailedEmail'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export const EMAIL_CONFIG = {
  from: `${process.env.RESEND_FROM_NAME ?? 'SystemMD Blueprint'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@system-md.com'}>`,
  replyTo: process.env.RESEND_FROM_EMAIL ?? 'noreply@system-md.com',
} as const

// ─── Email Gönderme Yardımcıları ───────────────────────────────────────────

export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string
  userName: string
}) {
  return getResend().emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: 'Welcome to SystemMD! 🚀',
    react: createElement(WelcomeEmail, { userName }),
  })
}

export async function sendBlueprintCompletedEmail({
  to,
  userName,
  blueprintTitle,
  blueprintScore,
  blueprintId,
}: {
  to: string
  userName: string
  blueprintTitle: string
  blueprintScore: number
  blueprintId: string
}) {
  return getResend().emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Blueprint ready: ${blueprintTitle}`,
    react: createElement(BlueprintCompletedEmail, {
      userName,
      blueprintTitle,
      blueprintScore,
      blueprintId,
    }),
  })
}

export async function sendUsageLimitEmail({
  to,
  userName,
  usedCount,
  totalLimit,
  percentage,
}: {
  to: string
  userName: string
  usedCount: number
  totalLimit: number
  percentage: 80 | 100
}) {
  const isMaxed = percentage === 100
  return getResend().emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: isMaxed
      ? 'Blueprint limit reached — Upgrade your plan'
      : `Blueprint usage at ${percentage}%`,
    react: createElement(UsageLimitEmail, {
      userName,
      usedCount,
      totalLimit,
      percentage,
    }),
  })
}

export async function sendPlanUpgradedEmail({
  to,
  userName,
  newPlan,
  billingCycle,
}: {
  to: string
  userName: string
  newPlan: 'solo' | 'agency'
  billingCycle: 'monthly' | 'yearly'
}) {
  return getResend().emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `Plan upgraded: ${newPlan === 'solo' ? 'Solo' : 'Agency'} 🎉`,
    react: createElement(PlanUpgradedEmail, {
      userName,
      newPlan,
      billingCycle,
    }),
  })
}

export async function sendPaymentFailedEmail({
  to,
  userName,
  planName,
  nextRetryDate,
}: {
  to: string
  userName: string
  planName: string
  nextRetryDate: string
}) {
  return getResend().emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: 'Payment failed — Update your billing info',
    react: createElement(PaymentFailedEmail, {
      userName,
      planName,
      nextRetryDate,
    }),
  })
}
