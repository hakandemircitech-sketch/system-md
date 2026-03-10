'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { ErrorState } from '@/components/ui/ErrorState'

import CurrentPlanCard, { type UserProfile, type Subscription, type Plan } from '@/components/billing/CurrentPlanCard'
import PlanCompareTable, { type BillingPeriod } from '@/components/billing/PlanCompareTable'
import BillingHistoryTable, { type Invoice, MOCK_INVOICES } from '@/components/billing/BillingHistoryTable'
import UpgradeModal from '@/components/billing/UpgradeModal'

// ─── Mock payment methods ─────────────────────────────────────────────────────

interface PaymentMethod {
  id: string
  brand: 'visa' | 'mc'
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm_1', brand: 'visa', last4: '4242', expMonth: 8, expYear: 2027, isDefault: true },
  { id: 'pm_2', brand: 'mc',   last4: '8833', expMonth: 2, expYear: 2026, isDefault: false },
]

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-[36px] h-[20px] rounded-[10px] border relative cursor-pointer transition-all duration-200 shrink-0 ${
        on ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--bg-4)] border-[var(--border-2)]'
      }`}
    >
      <span
        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-200 ${
          on ? 'left-[18px] bg-white' : 'left-[2px] bg-[var(--text-3)]'
        }`}
      />
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-8">
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ─── Payment Methods Panel ────────────────────────────────────────────────────

function PaymentMethods({
  methods,
  onAddCard,
  onRemove,
  onSetDefault,
}: {
  methods: PaymentMethod[]
  onAddCard: () => void
  onRemove: (id: string) => void
  onSetDefault: (id: string) => void
}) {
  return (
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] overflow-hidden mb-3">
      <div className="flex items-center justify-between px-5 py-[14px] border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text)]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <rect x="2" y="4" width="12" height="9" rx="1.5" /><path d="M2 8h12" />
          </svg>
          Saved cards
        </div>
        <button
          disabled
          onClick={onAddCard}
          title="Coming soon"
          className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] opacity-50 cursor-not-allowed transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add card
        </button>
      </div>

      {methods.map((pm) => (
        <div
          key={pm.id}
          className="flex items-center gap-[14px] px-5 py-4 border-b border-[var(--border)] last:border-b-0"
        >
          <div
            className={`w-11 h-[30px] rounded-[5px] flex items-center justify-center font-mono text-[9px] font-semibold border shrink-0 ${
              pm.brand === 'visa'
                ? 'text-[#1a1aff] border-[#1a1aff30]'
                : 'text-[var(--text-2)] border-[var(--border-2)]'
            }`}
            style={{
              background: pm.brand === 'visa'
                ? 'linear-gradient(135deg, #0a0a3a, #1a1a6a)'
                : 'linear-gradient(135deg, #1a0a0a, #3a0a0a)',
            }}
          >
            {pm.brand === 'visa' ? 'VISA' : 'MC'}
          </div>

          <div className="flex-1">
            <div className="text-[13px] font-medium text-[var(--text)]">
              {pm.brand === 'visa' ? 'Visa' : 'Mastercard'} ending in {pm.last4}
            </div>
            <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
              Expires {String(pm.expMonth).padStart(2, '0')} / {pm.expYear}
              {pm.isDefault ? ' · Default' : ''}
            </div>
          </div>

          <div className="flex items-center gap-[6px]">
            {pm.isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[20px] font-mono text-[10px] bg-[var(--green-dim)] text-[var(--green)]">
                <span className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" />
                Default
              </span>
            )}
            {!pm.isDefault && (
              <button
                disabled
                onClick={() => onSetDefault(pm.id)}
                title="Coming soon"
                className="inline-flex items-center gap-[6px] px-[10px] py-1 bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] opacity-50 cursor-not-allowed transition-all"
              >
                Set default
              </button>
            )}
            <button
              disabled
              onClick={() => onRemove(pm.id)}
              title="Coming soon"
              className="inline-flex items-center gap-[6px] px-[10px] py-1 bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] opacity-50 cursor-not-allowed transition-all"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Billing Settings Panel ───────────────────────────────────────────────────

function BillingSettings({
  autoRenew,
  emailReceipts,
  vatId,
  onAutoRenewChange,
  onEmailReceiptsChange,
  onVatChange,
}: {
  autoRenew: boolean
  emailReceipts: boolean
  vatId: string
  onAutoRenewChange: (v: boolean) => void
  onEmailReceiptsChange: (v: boolean) => void
  onVatChange: (v: string) => void
}) {
  return (
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] overflow-hidden mb-3">
      <div className="flex items-center justify-between gap-6 px-5 py-[14px] border-b border-[var(--border)]">
        <div>
          <div className="text-[13px] font-medium text-[var(--text)] mb-[3px]">Auto-renew</div>
          <div className="text-[12px] text-[var(--text-2)] leading-[1.5]">
            Automatically renew your subscription each billing cycle.
          </div>
        </div>
        <Toggle on={autoRenew} onChange={onAutoRenewChange} />
      </div>

      <div className="flex items-center justify-between gap-6 px-5 py-[14px] border-b border-[var(--border)]">
        <div>
          <div className="text-[13px] font-medium text-[var(--text)] mb-[3px]">Email receipts</div>
          <div className="text-[12px] text-[var(--text-2)] leading-[1.5]">
            Send invoice copies to your account email.
          </div>
        </div>
        <Toggle on={emailReceipts} onChange={onEmailReceiptsChange} />
      </div>

      <div className="flex items-center justify-between gap-6 px-5 py-[14px]">
        <div>
          <div className="text-[13px] font-medium text-[var(--text)] mb-[3px]">VAT / Tax ID</div>
          <div className="text-[12px] text-[var(--text-2)] leading-[1.5]">
            Add a VAT number for EU tax compliance.
          </div>
        </div>
        <input
          type="text"
          value={vatId}
          onChange={(e) => onVatChange(e.target.value)}
          placeholder="TR0000000000"
          className="px-[10px] py-[6px] w-[180px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[12px] font-mono text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)]"
        />
      </div>
    </div>
  )
}

// ─── Add Card Modal ───────────────────────────────────────────────────────────

function AddCardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  useEffect(() => {
    if (!open) { setCardNumber(''); setCardName(''); setExpiry(''); setCvc('') }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function formatCard(v: string) {
    const digits = v.replace(/\D/g, '').substring(0, 16)
    return digits.match(/.{1,4}/g)?.join(' ') ?? digits
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative w-[440px] bg-[var(--bg-2)] border border-[var(--border-2)] rounded-[12px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="text-[14px] font-semibold text-[var(--text)]">Add payment method</div>
          <button onClick={onClose} className="w-[26px] h-[26px] flex items-center justify-center rounded-[5px] bg-[var(--bg-3)] border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer transition-all">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          <div>
            <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-[5px]">Card number</div>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[12px] font-mono text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] tracking-[0.06em]"
            />
          </div>
          <div>
            <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-[5px]">Cardholder name</div>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Full name on card"
              className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] font-sans text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)]"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-[5px]">Expiry</div>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM / YY"
                maxLength={7}
                className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[12px] font-mono text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)]"
              />
            </div>
            <div className="flex-1">
              <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-[5px]">CVC</div>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="•••"
                maxLength={4}
                className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[12px] font-mono text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)]"
              />
            </div>
          </div>
          <p className="font-mono text-[10px] text-[var(--text-4)] mt-1">
            Payment infrastructure coming in a future release.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--bg-3)] transition-all">
            Cancel
          </button>
          <button
            disabled
            title="Coming soon"
            className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-medium opacity-50 cursor-not-allowed"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add card
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function BillingSkeleton() {
  return (
    <div className="max-w-[860px] mx-auto">
      <div className="h-[200px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] animate-pulse mb-8" />
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[320px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] animate-pulse" />
        ))}
      </div>
      <div className="h-[120px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] animate-pulse mb-3" />
      <div className="h-[120px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] animate-pulse mb-3" />
      <div className="h-[280px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] animate-pulse" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  const [period, setPeriod] = useState<BillingPeriod>('monthly')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS)

  const [autoRenew, setAutoRenew] = useState(true)
  const [emailReceipts, setEmailReceipts] = useState(true)
  const [vatId, setVatId] = useState('')

  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; plan: Plan | null }>({ open: false, plan: null })
  const [addCardModal, setAddCardModal] = useState(false)

  const loadData = useCallback(async () => {
    setLoadError(null)
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase
        .from('users')
        .select('id, email, full_name, plan, blueprint_count, api_tokens_used, deployment_count')
        .eq('id', authUser.id)
        .single()

      const p: UserProfile = (profile as UserProfile | null) ?? {
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: (authUser.user_metadata?.full_name as string | null) ?? null,
        plan: 'free',
        blueprint_count: 0,
        api_tokens_used: 0,
        deployment_count: 0,
      }
      setUser(p)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, plan, billing_period, status, current_period_end, cancel_at_period_end')
        .eq('user_id', authUser.id)
        .single()

      if (sub) {
        setSubscription(sub as Subscription)
        if ((sub as Subscription).billing_period) {
          setPeriod((sub as Subscription).billing_period as BillingPeriod)
        }
      }

      setLoading(false)

      setInvoicesLoading(true)
      const { data: invData } = await supabase
        .from('invoices')
        .select('id, stripe_invoice_id, amount_usd, currency, status, description, invoice_pdf_url, period_start, period_end, paid_at, created_at')
        .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (invData && invData.length > 0) {
      setInvoices(invData as Invoice[])
    } else {
      setInvoices(MOCK_INVOICES)
    }
    setInvoicesLoading(false)
    } catch {
      setLoadError('Could not load billing information.')
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  function handleUpgrade(plan: Plan) {
    setUpgradeModal({ open: true, plan })
  }

  function handleRemoveCard(id: string) {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id))
    toast.success('Card removed')
  }

  function handleSetDefault(id: string) {
    setPaymentMethods((prev) => prev.map((pm) => ({ ...pm, isDefault: pm.id === id })))
    toast.success('Default card updated')
  }

  function handleDownloadAll() {
    toast.success('Downloading all invoices…')
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 40px' }}>
      <style>{`
        @keyframes shimmer-banner {
          0%   { background-position: 0% 0% }
          100% { background-position: 200% 0% }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>

      {loadError && (
        <ErrorState
          message={loadError}
          onRetry={() => void loadData()}
          className="mb-6"
        />
      )}

      {loading ? (
        <BillingSkeleton />
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 10 }}>
                account
              </p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--text)' }}>
                Plan &amp; Billing
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
                Manage your plan, payments, and invoices.
              </p>
            </div>
            <button
              onClick={handleDownloadAll}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'all 120ms', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
              </svg>
              Download All
            </button>
          </div>

          {user && <CurrentPlanCard user={user} subscription={subscription} />}

          <div className="mb-8" style={{ animation: 'fadeUp 0.3s ease 0.08s both' }}>
            <SectionTitle>Upgrade your plan</SectionTitle>
            <PlanCompareTable
              currentPlan={user?.plan ?? 'free'}
              period={period}
              onPeriodChange={setPeriod}
              onUpgrade={handleUpgrade}
            />
          </div>

          <div style={{ animation: 'fadeUp 0.3s ease 0.14s both' }}>
            <SectionTitle>Payment Methods</SectionTitle>
            <PaymentMethods
              methods={paymentMethods}
              onAddCard={() => setAddCardModal(true)}
              onRemove={handleRemoveCard}
              onSetDefault={handleSetDefault}
            />
          </div>

          <div style={{ animation: 'fadeUp 0.3s ease 0.18s both' }}>
            <SectionTitle>Billing Settings</SectionTitle>
            <BillingSettings
              autoRenew={autoRenew}
              emailReceipts={emailReceipts}
              vatId={vatId}
              onAutoRenewChange={setAutoRenew}
              onEmailReceiptsChange={setEmailReceipts}
              onVatChange={setVatId}
            />
          </div>

          <div style={{ animation: 'fadeUp 0.3s ease 0.22s both' }}>
            <SectionTitle>Invoice History</SectionTitle>
            <BillingHistoryTable invoices={invoices} loading={invoicesLoading} />
          </div>

        </div>
      )}

      <AnimatePresence>
        {upgradeModal.open && (
          <UpgradeModal
            open={upgradeModal.open}
            plan={upgradeModal.plan}
            period={period}
            onClose={() => setUpgradeModal({ open: false, plan: null })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addCardModal && (
          <AddCardModal
            open={addCardModal}
            onClose={() => setAddCardModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
