'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { OverviewResponse } from '@/app/api/analytics/overview/route'
import type { RevenueResponse } from '@/app/api/analytics/revenue/route'
import type { SignupsResponse } from '@/app/api/analytics/signups/route'
import type { CategoriesResponse } from '@/app/api/analytics/categories/route'
import type { FunnelResponse } from '@/app/api/analytics/funnel/route'
import type { HeatmapResponse } from '@/app/api/analytics/heatmap/route'
import StatsOverview from '@/components/analytics/StatsOverview'
import ActivityTable from '@/components/analytics/ActivityTable'

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ h = 220 }: { h?: number }) {
  return (
    <div className="p-5 animate-pulse">
      <div className="rounded-[6px] bg-[var(--bg-3)]" style={{ height: h }} />
    </div>
  )
}

// ─── Dynamic Imports ──────────────────────────────────────────────────────────

const RevenueChart = dynamic(() => import('@/components/analytics/RevenueChart'), {
  loading: () => <SkeletonCard />,
  ssr: false,
})

const UsageChart = dynamic(() => import('@/components/analytics/UsageChart'), {
  loading: () => <SkeletonCard />,
  ssr: false,
})

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useAnalytics(range: Range) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null)
  const [signups, setSignups] = useState<SignupsResponse | null>(null)
  const [categories, setCategories] = useState<CategoriesResponse | null>(null)
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null)

  const fetchData = useCallback(
    async (r: Range) => {
      setLoading(true)
      setError(null)
      try {
        const [ov, rev, sigs, cats, fn, hm] = await Promise.all([
          fetch(`/api/analytics/overview`).then((res) => res.json()) as Promise<OverviewResponse>,
          fetch(`/api/analytics/revenue?range=${r}`).then((res) => res.json()) as Promise<RevenueResponse>,
          fetch(`/api/analytics/signups?range=${r}`).then((res) => res.json()) as Promise<SignupsResponse>,
          fetch(`/api/analytics/categories?range=${r}`).then((res) => res.json()) as Promise<CategoriesResponse>,
          fetch(`/api/analytics/funnel`).then((res) => res.json()) as Promise<FunnelResponse>,
          fetch(`/api/analytics/heatmap`).then((res) => res.json()) as Promise<HeatmapResponse>,
        ])
        setOverview(ov)
        setRevenue(rev)
        setSignups(sigs)
        setCategories(cats)
        setFunnel(fn)
        setHeatmap(hm)
      } catch {
        setError('Could not load data. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void fetchData(range)
  }, [range, fetchData])

  return { loading, error, overview, revenue, signups, categories, funnel, heatmap, refetch: fetchData }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')
  const { loading, error, overview, revenue, signups, categories, funnel, heatmap, refetch } = useAnalytics(range)

  const RANGES: { label: string; value: Range }[] = [
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: '90d', value: '90d' },
  ]

  function handleExport() {
    if (!revenue) return
    const rows = ['Day,MRR,One-time', ...revenue.labels.map((l, i) => `${l},${revenue.mrr[i]},${revenue.once[i]}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Data scope notice */}
      <div className="flex items-center gap-2 mb-5 px-4 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-md)] text-[11px]">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--blue)" strokeWidth="1.5" className="shrink-0">
          <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5h.01" />
        </svg>
        <span className="text-[var(--text-3)]">
          <span className="text-[var(--text-2)] font-medium">Your workspace data</span>
          {' · '}Blueprint counts and token usage are real. MRR, platform user counts, and plan distribution are illustrative — payment integration pending.
        </span>
      </div>

      {/* Range selector + Export */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.01em]">
            Analytics
          </h1>
          <p className="font-mono text-[11px] text-[var(--text-3)] mt-[2px]">
            Platform growth metrics and user behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-[2px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[20px] p-[3px]">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`font-mono text-[11px] px-[10px] py-[5px] rounded-[20px] cursor-pointer border transition-all ${
                  range === r.value
                    ? 'text-[var(--text)] bg-[var(--bg-4)] border-[var(--border-2)]'
                    : 'text-[var(--text-3)] bg-transparent border-transparent hover:text-[var(--text-2)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={!revenue}
            className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[var(--radius,6px)] text-[12px] cursor-pointer hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-4 bg-[var(--red-dim)] border border-[rgba(239,68,68,0.2)] rounded-lg">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] text-[var(--red)]">{error}</p>
            <button
              onClick={() => void refetch(range)}
              className="font-mono text-[10px] text-[var(--red)] underline underline-offset-2 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <StatsOverview stats={overview?.stats} />

      {/* Revenue + Plan Distribution (lazy) */}
      <RevenueChart revenue={revenue} overview={overview} loading={loading} />

      {/* Signups + Categories + Funnel (lazy) */}
      <UsageChart
        signups={signups}
        categories={categories}
        funnel={funnel}
        loading={loading}
        range={range}
      />

      {/* Top Blueprints + Activity Heatmap */}
      <ActivityTable overview={overview} heatmap={heatmap} loading={loading} />
    </div>
  )
}
