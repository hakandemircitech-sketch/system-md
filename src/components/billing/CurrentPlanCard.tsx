'use client'

import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro' | 'team'

export interface Subscription {
  id: string
  plan: Plan
  billing_period: 'monthly' | 'yearly' | null
  status: 'active' | 'past_due' | 'cancelled' | 'trialing' | 'incomplete'
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  plan: Plan
  blueprint_count: number
  api_tokens_used: number
  deployment_count: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<Plan, { blueprints: number; tokens: number; deployments: number; seats: number }> = {
  free: { blueprints: 10,   tokens: 100_000,   deployments: 5,   seats: 1 },
  pro:  { blueprints: 9999, tokens: 1_000_000,  deployments: 999, seats: 1 },
  team: { blueprints: 9999, tokens: 5_000_000,  deployments: 999, seats: 10 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try { return format(new Date(iso), 'd MMM yyyy') }
  catch { return iso }
}

// ─── Badge (shared) ───────────────────────────────────────────────────────────

export type BadgeVariant = 'green' | 'yellow' | 'red' | 'indigo' | 'neutral' | 'purple'

export function Badge({ variant, dot, children }: { variant: BadgeVariant; dot?: boolean; children: React.ReactNode }) {
  const styles: Record<BadgeVariant, string> = {
    green:   'bg-[var(--green-dim)] text-[var(--green)]',
    yellow:  'bg-[var(--yellow-dim)] text-[var(--yellow)]',
    red:     'bg-[var(--red-dim)] text-[var(--red)]',
    indigo:  'bg-[var(--accent-dim)] text-[var(--accent)]',
    neutral: 'bg-[var(--bg-4)] text-[var(--text-3)]',
    purple:  'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6]',
  }
  const dotColors: Record<BadgeVariant, string> = {
    green:   'bg-[var(--green)]',
    yellow:  'bg-[var(--yellow)]',
    red:     'bg-[var(--red)]',
    indigo:  'bg-[var(--accent)]',
    neutral: 'bg-[var(--text-3)]',
    purple:  'bg-[#8b5cf6]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-[20px] font-mono text-[10px] ${styles[variant]}`}>
      {dot && <span className={`w-[5px] h-[5px] rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}

// ─── CurrentPlanCard ──────────────────────────────────────────────────────────

interface CurrentPlanCardProps {
  user: UserProfile
  subscription: Subscription | null
}

export default function CurrentPlanCard({ user, subscription }: CurrentPlanCardProps) {
  const plan = user.plan
  const limits = PLAN_LIMITS[plan]

  const bpPct = Math.min((user.blueprint_count / (limits.blueprints === 9999 ? 9999 : limits.blueprints)) * 100, 100)
  const tokenPct = Math.min((user.api_tokens_used / limits.tokens) * 100, 100)
  const depPct = Math.min((user.deployment_count / (limits.deployments === 999 ? 999 : limits.deployments)) * 100, 100)
  const seatPct = 100 / limits.seats

  function barColor(pct: number) {
    if (pct >= 90) return 'var(--red)'
    if (pct >= 70) return 'var(--yellow)'
    return 'var(--accent)'
  }

  const planLabels: Record<Plan, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    team: 'Team Plan',
  }

  const price = plan === 'free' ? '$0' : plan === 'pro'
    ? (subscription?.billing_period === 'yearly' ? '$15' : '$19')
    : (subscription?.billing_period === 'yearly' ? '$39' : '$49')

  const period = plan === 'free' ? null : subscription?.billing_period === 'yearly' ? 'year' : 'month'

  const renewsAt = subscription?.current_period_end
    ? fmtDate(subscription.current_period_end)
    : null

  return (
    <div className="rounded-[10px] border border-[var(--border)] overflow-hidden mb-8 relative bg-[var(--bg-2)]">
      {/* Top glow bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, var(--accent), #8b5cf6, var(--accent))',
          backgroundSize: '200% 100%',
          animation: 'shimmer-banner 3s linear infinite',
        }}
      />

      {/* Header row */}
      <div className="flex items-center gap-6 px-7 py-6">
        <div className="w-12 h-12 rounded-[12px] flex items-center justify-center bg-[var(--accent-dim)] border border-[var(--accent-border)] shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18M7 15h3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[18px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-[3px]">
            {planLabels[plan]}
            <Badge variant="neutral">Current</Badge>
            {subscription?.status === 'past_due' && (
              <Badge variant="red">Past due</Badge>
            )}
            {subscription?.cancel_at_period_end && subscription?.status !== 'past_due' && (
              <Badge variant="yellow">Cancels soon</Badge>
            )}
          </div>
          <div className="text-[13px] text-[var(--text-3)]">
            {plan === 'free'
              ? "You're on the free tier · upgrade to unlock more blueprints, deployments and AI power."
              : `Active ${subscription?.billing_period ?? 'monthly'} subscription`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[28px] font-semibold text-[var(--text)] tracking-[-0.04em]">{price}</div>
          {period && (
            <div className="font-mono text-[11px] text-[var(--text-3)]">/ {period}</div>
          )}
          <div className="font-mono text-[10px] text-[var(--text-4)] mt-1" style={{ letterSpacing: '0.04em' }}>
            {plan === 'free' ? 'No renewal' : renewsAt ? `Renews ${renewsAt}` : '—'}
          </div>
        </div>
      </div>

      {/* Usage bars */}
      <div className="flex border-t border-[var(--border)]">
        {[
          { label: 'Blueprints',   used: user.blueprint_count,                    limit: limits.blueprints === 9999 ? '∞' : limits.blueprints, pct: bpPct,    color: 'var(--accent)' },
          { label: 'API Calls',    used: Math.round(user.api_tokens_used / 1000), limit: `${Math.round(limits.tokens / 1000)}k`,              pct: tokenPct,  color: 'var(--green)'  },
          { label: 'Deployments',  used: user.deployment_count,                   limit: limits.deployments === 999 ? '∞' : limits.deployments, pct: depPct,   color: 'var(--yellow)' },
          { label: 'Team seats',   used: 1,                                       limit: limits.seats,                                         pct: seatPct,   color: 'var(--red)'    },
        ].map((item, i, arr) => (
          <div
            key={item.label}
            className={`flex-1 px-6 py-4 ${i < arr.length - 1 ? 'border-r border-[var(--border)]' : ''}`}
          >
            <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-2">{item.label}</div>
            <div className="h-[3px] bg-[var(--border-2)] rounded-[2px] overflow-hidden mb-[6px]">
              <div
                className="h-full rounded-[2px] transition-[width] duration-1000"
                style={{ width: `${item.pct}%`, background: barColor(item.pct) }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[var(--text-3)]">
              <span><strong className="text-[var(--text)]">{item.used}</strong> used</span>
              <span>{typeof item.limit === 'number' ? item.limit : item.limit} limit</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
