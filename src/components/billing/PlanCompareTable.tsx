'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Badge, type BadgeVariant, type Plan } from './CurrentPlanCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BillingPeriod = 'monthly' | 'yearly'

// ─── Constants ────────────────────────────────────────────────────────────────

export const PRICES = {
  monthly: { pro: 19, team: 49 },
  yearly:  { pro: 15, team: 39 },
}

interface PlanConfig {
  id: Plan
  name: string
  desc: string
  features: { text: string; included: boolean }[]
  badge?: { label: string; variant: BadgeVariant }
  nameColor?: string
}

export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    desc: 'For solo experimenters and early-stage ideas.',
    features: [
      { text: '10 blueprints / mo', included: true },
      { text: '100k API tokens',    included: true },
      { text: '5 deployments',      included: true },
      { text: 'Claude Sonnet 4.6',  included: true },
      { text: 'Team seats',         included: false },
      { text: 'Custom domain',      included: false },
    ],
    badge: { label: 'Current', variant: 'neutral' },
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'For builders shipping real products.',
    nameColor: '#8b5cf6',
    features: [
      { text: 'Unlimited blueprints',    included: true },
      { text: '1M API tokens',           included: true },
      { text: 'Unlimited deployments',   included: true },
      { text: 'Claude Opus 4.6',         included: true },
      { text: '1 seat (solo)',            included: true },
      { text: 'Custom domain',           included: false },
    ],
    badge: { label: 'Most popular', variant: 'purple' },
  },
  {
    id: 'team',
    name: 'Team',
    desc: 'For teams building multiple products at once.',
    features: [
      { text: 'Unlimited everything',   included: true },
      { text: '5M API tokens',          included: true },
      { text: 'Priority build queue',   included: true },
      { text: 'Claude Opus 4.6',        included: true },
      { text: '10 team seats',          included: true },
      { text: 'Custom domain',          included: true },
    ],
  },
]

// ─── Period Toggle ────────────────────────────────────────────────────────────

export function PeriodToggle({ period, onChange }: { period: BillingPeriod; onChange: (p: BillingPeriod) => void }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center gap-1 bg-[var(--bg-3)] border border-[var(--border)] rounded-[20px] p-1">
        {(['monthly', 'yearly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`font-mono text-[11px] px-[14px] py-[5px] rounded-[16px] cursor-pointer transition-all border-none ${
              period === p
                ? 'bg-[var(--bg-2)] text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.3)]'
                : 'bg-transparent text-[var(--text-3)] hover:text-[var(--text-2)]'
            }`}
          >
            {p === 'monthly' ? 'Monthly' : 'Yearly'}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {period === 'yearly' && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-[9px] text-[var(--green)] bg-[var(--green-dim)] border border-[rgba(34,197,94,0.2)] rounded-[20px] px-[7px] py-[2px]"
          >
            Save 20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PlanCompareTable ─────────────────────────────────────────────────────────

interface PlanCompareTableProps {
  currentPlan: Plan
  period: BillingPeriod
  onPeriodChange: (p: BillingPeriod) => void
  onUpgrade: (plan: Plan) => void
}

export default function PlanCompareTable({ currentPlan, period, onPeriodChange, onUpgrade }: PlanCompareTableProps) {
  return (
    <>
      <PeriodToggle period={period} onChange={onPeriodChange} />
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PLAN_CONFIGS.map((cfg) => {
          const isCurrent = cfg.id === currentPlan
          const price =
            cfg.id === 'free' ? 0 :
            cfg.id === 'pro' ? PRICES[period].pro :
            PRICES[period].team

          return (
            <div
              key={cfg.id}
              className={`rounded-[10px] border relative flex flex-col overflow-hidden transition-all duration-150 hover:-translate-y-[2px] ${
                isCurrent
                  ? 'border-[var(--accent-border)] bg-[var(--accent-dim)]'
                  : cfg.id === 'pro'
                  ? 'border-[rgba(139,92,246,0.3)] bg-[var(--bg-2)]'
                  : 'border-[var(--border)] bg-[var(--bg-2)]'
              }`}
            >
              {/* Badge */}
              {cfg.badge && (
                <div className="absolute top-3 right-3">
                  <Badge variant={cfg.badge.variant}>{cfg.badge.label}</Badge>
                </div>
              )}

              {/* Header */}
              <div className="px-5 pt-5 pb-0">
                <div
                  className="text-[11px] font-semibold font-mono uppercase tracking-[0.06em] mb-3"
                  style={{ color: cfg.nameColor ?? 'var(--text-2)' }}
                >
                  {cfg.name}
                </div>
                <div className="flex items-baseline gap-1 mb-[6px]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${cfg.id}-${period}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="text-[32px] font-semibold text-[var(--text)] tracking-[-0.04em]"
                    >
                      ${price}
                    </motion.span>
                  </AnimatePresence>
                  <span className="font-mono text-[11px] text-[var(--text-3)]">/ mo</span>
                </div>
                <div className="text-[12px] text-[var(--text-3)] mb-5 leading-[1.5]">{cfg.desc}</div>
              </div>

              {/* Features */}
              <div className="flex-1 flex flex-col gap-[9px] px-5 pb-5">
                {cfg.features.map((f) => (
                  <div
                    key={f.text}
                    className={`flex items-center gap-[9px] text-[12px] ${f.included ? 'text-[var(--text-2)]' : 'text-[var(--text-4)]'}`}
                  >
                    {f.included ? (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--green)" strokeWidth="2">
                        <path d="M2 8l4 4 8-8" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--text-4)" strokeWidth="2">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    )}
                    {f.text}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-[9px] rounded-[var(--radius)] text-[12px] font-medium bg-[var(--bg-4)] text-[var(--text-3)] border border-[var(--border-2)] cursor-default"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    disabled
                    onClick={() => onUpgrade(cfg.id)}
                    title="Coming soon"
                    className={`w-full py-[9px] rounded-[var(--radius)] text-[12px] font-medium flex items-center justify-center gap-[6px] transition-all duration-150 opacity-50 cursor-not-allowed ${
                      cfg.id === 'pro'
                        ? 'bg-[var(--accent)] text-white border border-[var(--accent)]'
                        : 'bg-transparent text-[var(--text-2)] border border-[var(--border-2)]'
                    }`}
                  >
                    Upgrade to {cfg.name}
                    {cfg.id === 'pro' && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    )}
                  </button>
                )}
                {!isCurrent && (
                  <p className="text-center font-mono text-[9px] text-[var(--text-4)] mt-[6px]">
                    Coming soon
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
