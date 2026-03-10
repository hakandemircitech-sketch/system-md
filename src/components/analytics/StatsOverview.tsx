'use client'

import { useState, useEffect } from 'react'
import type { OverviewResponse } from '@/app/api/analytics/overview/route'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }
    setValue(0)
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(tick)
      else setValue(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return value
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  isFloat = false,
  prefix = '',
  suffix = '',
  changeLabel,
  isPositive,
  iconColor,
  icon,
  delay,
}: {
  label: string
  value: number
  isFloat?: boolean
  prefix?: string
  suffix?: string
  changeLabel: string
  isPositive: boolean
  iconColor: 'green' | 'indigo' | 'yellow' | 'blue'
  icon: React.ReactNode
  delay: number
}) {
  const count = useCountUp(isFloat ? 0 : value)

  const colorMap: Record<string, string> = {
    green: 'bg-[var(--green-dim)] text-[var(--green)]',
    indigo: 'bg-[var(--accent-dim)] text-[var(--accent)]',
    yellow: 'bg-[var(--yellow-dim)] text-[var(--yellow)]',
    blue: 'bg-[var(--blue-dim)] text-[var(--blue)]',
  }

  const displayVal = isFloat
    ? `${prefix}${value.toFixed(1)}${suffix}`
    : count >= 1000
      ? prefix === '$'
        ? `$${(count / 1000).toFixed(1)}k`
        : count.toLocaleString()
      : `${prefix}${count}${suffix}`

  return (
    <div
      className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg p-5 relative overflow-hidden hover:border-[var(--border-2)] transition-colors"
      style={{ animation: `fadeUp 0.3s ease ${delay}s both` }}
    >
      <div className="flex items-center justify-between mb-[14px]">
        <span className="font-mono text-[10px] text-[var(--text-3)] tracking-[0.08em] uppercase">
          {label}
        </span>
        <div
          className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${colorMap[iconColor]}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-[28px] font-semibold text-[var(--text)] leading-none tracking-[-0.04em] mb-2">
        {displayVal}
      </div>
      <div
        className={`flex items-center gap-1 font-mono text-[11px] ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {isPositive ? (
            <path d="M4 12L8 4l4 8" />
          ) : (
            <path d="M4 4L8 12l4-8" />
          )}
        </svg>
        {changeLabel}
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsOverviewProps {
  stats: OverviewResponse['stats'] | undefined
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      <StatCard
        label="Total Revenue"
        value={stats?.mrr ?? 0}
        prefix="$"
        changeLabel={`+${stats?.mrrChange ?? 0}% vs prev period`}
        isPositive
        iconColor="green"
        delay={0}
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="12" height="9" rx="1.5" />
            <path d="M2 8h12M5 11h3" />
          </svg>
        }
      />
      <StatCard
        label="New Users"
        value={stats?.users ?? 0}
        changeLabel={`+${stats?.usersChange ?? 0}% vs prev period`}
        isPositive
        iconColor="indigo"
        delay={0.06}
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="6" r="3" />
            <path d="M2 13c0-2.2 2.7-4 6-4s6 1.8 6 4" />
          </svg>
        }
      />
      <StatCard
        label="Blueprints Generated"
        value={stats?.blueprints ?? 0}
        changeLabel={`+${stats?.blueprintsChange ?? 0}% vs prev period`}
        isPositive
        iconColor="yellow"
        delay={0.12}
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h12M2 8h8M2 13h10" />
          </svg>
        }
      />
      <StatCard
        label="Churn Rate"
        value={stats?.churn ?? 0}
        isFloat
        suffix="%"
        changeLabel={`${Math.abs(stats?.churnChange ?? 0)}% improvement`}
        isPositive={true}
        iconColor="blue"
        delay={0.18}
        icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12L5 7l3 3 3-5 3 2" />
          </svg>
        }
      />
    </div>
  )
}
