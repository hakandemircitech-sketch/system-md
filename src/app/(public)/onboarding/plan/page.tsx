'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLAN_LIMITS: Record<string, { generates: number; label: string }> = {
  free:  { generates: 10,  label: 'Free'   },
  pro:   { generates: 30,  label: 'Pro'    },
  team:  { generates: 150, label: 'Studio' },
}

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    period: '',
    description: 'For builders who want to try it out.',
    features: [
      '10 generates per month',
      'Full ZIP output',
      'Standard blueprint output',
      'Email verified access',
    ],
    cta: 'Start Free',
    accent: false,
    recommended: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For builders who need consistent monthly blueprint generation.',
    features: [
      '30 generates per month',
      'Full ZIP output',
      'Priority generation',
      'Email support',
    ],
    cta: 'Choose Pro',
    accent: true,
    recommended: true,
  },
  {
    id: 'team' as const,
    name: 'Studio',
    price: '$49',
    period: '/month',
    description: 'For heavier workflow volume and faster support.',
    features: [
      '150 generates per month',
      'Full ZIP output',
      'Higher monthly limit',
      'Priority support',
    ],
    cta: 'Choose Studio',
    accent: false,
    recommended: false,
  },
]

function PaymentComingSoonModal({
  plan,
  onClose,
}: {
  plan: 'pro' | 'team'
  onClose: () => void
}) {
  const label = PLAN_LIMITS[plan].label
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '36px 32px', maxWidth: '400px', width: '100%', textAlign: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(99,102,241,0.08)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <rect x="1" y="4" width="14" height="10" rx="2" />
            <path d="M1 8h14" />
            <path d="M5 12h2M9 12h2" />
          </svg>
        </div>
        <p style={{ fontFamily: "'Geist Mono',monospace", fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
          {label} plan
        </p>
        <h3 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: '22px', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '10px' }}>
          Payment coming soon.
        </h3>
        <p style={{ fontFamily: "'Geist',system-ui,sans-serif", fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.65, marginBottom: '28px' }}>
          We&apos;re setting up our payment system. Start with the Free plan now — your {label} upgrade will be ready shortly and we&apos;ll notify you.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '11px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontFamily: "'Geist Mono',monospace", cursor: 'pointer', transition: 'opacity 150ms ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlanSelectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [paymentModal, setPaymentModal] = useState<'pro' | 'team' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelectPlan(planId: 'free' | 'pro' | 'team') {
    setError(null)
    setLoading(planId)

    try {
      const res = await fetch('/api/onboarding/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(null)
        return
      }

      if (data.requiresPayment) {
        setLoading(null)
        setPaymentModal(planId as 'pro' | 'team')
        return
      }

      router.push(data.redirect || '/dashboard')
    } catch {
      setError('Network error. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div
      data-theme="light"
      style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Header */}
      <header style={{ padding: '18px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Geist Mono',monospace", fontSize: '13px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text)', textDecoration: 'none' }}>
          System<span style={{ color: 'var(--accent)' }}>MD</span>
          <span style={{ color: 'var(--accent)' }}>_</span>
        </Link>
        <span style={{ fontFamily: "'Geist Mono',monospace", fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          step 1 of 1 — choose your plan
        </span>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{ fontFamily: "'Geist Mono',monospace", fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
            welcome to systemmd
          </p>
          <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '12px' }}>
            Choose your plan.
          </h1>
          <p style={{ fontFamily: "'Geist',system-ui,sans-serif", fontSize: '14px', color: 'var(--text-3)', lineHeight: 1.65 }}>
            Start free. Upgrade when you&apos;re ready. No credit card required for Free.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ maxWidth: '480px', margin: '0 auto 24px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: "'Geist Mono',monospace", fontSize: '11px', color: 'var(--red)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', alignItems: 'stretch', paddingTop: '16px' }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'var(--bg-2)',
                border: `1px solid ${plan.accent ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {plan.recommended && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', fontFamily: "'Geist Mono',monospace", fontSize: '10px', padding: '4px 14px', borderRadius: '99px', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
                  RECOMMENDED
                </div>
              )}

              <p style={{ fontFamily: "'Geist Mono',monospace", fontSize: '10px', color: plan.accent ? 'var(--accent)' : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
                {plan.name}
              </p>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: '48px', fontWeight: 400, color: 'var(--text)', lineHeight: 1 }}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span style={{ fontFamily: "'Geist',system-ui,sans-serif", fontSize: '13px', color: 'var(--text-3)', marginBottom: '6px' }}>
                    {plan.period}
                  </span>
                )}
              </div>

              <p style={{ fontFamily: "'Geist',system-ui,sans-serif", fontSize: '13px', color: 'var(--text-3)', marginBottom: '24px', lineHeight: 1.5 }}>
                {plan.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', flex: 1 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ color: plan.accent ? 'var(--accent)' : plan.id === 'team' ? 'var(--green)' : 'var(--text-4)', fontFamily: "'Geist Mono',monospace", fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>
                      {plan.id === 'free' ? '—' : '✓'}
                    </span>
                    <span style={{ fontFamily: "'Geist',system-ui,sans-serif", fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: plan.accent ? 'var(--accent)' : 'transparent',
                  color: plan.accent ? 'white' : 'var(--text)',
                  border: plan.accent ? 'none' : '1px solid var(--border-2)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: "'Geist Mono',monospace",
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null && loading !== plan.id ? 0.5 : 1,
                  transition: 'all 140ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading === plan.id ? (
                  <>
                    <span style={{ width: 12, height: 12, border: `1.5px solid ${plan.accent ? 'rgba(255,255,255,0.4)' : 'var(--text-4)'}`, borderTopColor: plan.accent ? 'white' : 'var(--text)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    {plan.id === 'free' ? 'activating...' : 'loading...'}
                  </>
                ) : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Skip link */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontFamily: "'Geist Mono',monospace", fontSize: '11px', color: 'var(--text-4)' }}>
          Already set up?{' '}
          <Link href="/dashboard" style={{ color: 'var(--accent)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Go to dashboard →
          </Link>
        </p>
      </div>

      {/* Payment coming soon modal */}
      {paymentModal && (
        <PaymentComingSoonModal
          plan={paymentModal}
          onClose={() => setPaymentModal(null)}
        />
      )}
    </div>
  )
}
