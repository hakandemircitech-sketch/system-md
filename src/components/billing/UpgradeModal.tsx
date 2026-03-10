'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { type Plan } from './CurrentPlanCard'
import { PRICES, type BillingPeriod } from './PlanCompareTable'

// ─── UpgradeModal ─────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  open: boolean
  plan: Plan | null
  period: BillingPeriod
  onClose: () => void
}

export default function UpgradeModal({ open, plan, period, onClose }: UpgradeModalProps) {
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    if (!open) setAgreed(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !plan) return null

  const price = plan === 'pro' ? PRICES[period].pro : PRICES[period].team
  const planName = plan === 'pro' ? 'Pro' : 'Team'

  // TODO: connect Stripe checkout session here
  async function handleConfirmUpgrade() {
    // TODO: create Stripe checkout session
    // const res = await fetch('/api/billing/checkout', {
    //   method: 'POST',
    //   body: JSON.stringify({ plan, period }),
    // })
    // const { url } = await res.json()
    // window.location.href = url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative w-[440px] bg-[var(--bg-2)] border border-[var(--border-2)] rounded-[12px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="text-[14px] font-semibold text-[var(--text)]">Upgrade to {planName}</div>
          <button
            onClick={onClose}
            className="w-[26px] h-[26px] flex items-center justify-center rounded-[5px] bg-[var(--bg-3)] border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] cursor-pointer transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-[13px] text-[var(--text-3)] leading-[1.6]">
            You&apos;ll be charged{' '}
            <strong className="text-[var(--text)]">${price}.00</strong> today.
            Your subscription renews {period === 'yearly' ? 'yearly' : 'monthly'}.
          </p>

          {/* Default payment method preview */}
          <div className="flex items-center gap-3 px-4 py-[14px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)]">
            <div
              className="w-11 h-[30px] rounded-[5px] flex items-center justify-center font-mono text-[9px] font-semibold border text-[#1a1aff] border-[#1a1aff30] shrink-0"
              style={{ background: 'linear-gradient(135deg, #0a0a3a, #1a1a6a)' }}
            >
              VISA
            </div>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-[var(--text)]">Visa ending in 4242</div>
              <div className="font-mono text-[10px] text-[var(--text-3)]">Default · Expires 08 / 2027</div>
            </div>
            <button
              disabled
              className="inline-flex items-center gap-[6px] px-[10px] py-1 bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] opacity-50 cursor-not-allowed"
            >
              Change
            </button>
          </div>

          <label className="flex items-center gap-2 text-[12px] text-[var(--text-2)] cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-[14px] h-[14px]"
              style={{ accentColor: 'var(--accent)' }}
            />
            I agree to the Terms of Service and Billing Policy
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--bg-3)] transition-all"
          >
            Cancel
          </button>
          <button
            disabled
            onClick={handleConfirmUpgrade}
            title="Coming soon"
            className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-medium opacity-50 cursor-not-allowed"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 8l4 4 8-8" />
            </svg>
            Confirm upgrade
          </button>
        </div>
      </motion.div>
    </div>
  )
}
