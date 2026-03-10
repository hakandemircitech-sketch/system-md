'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton, SkeletonRow } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAnalyticsOverview } from '@/hooks/useAnalytics'

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return dateStr
  }
}

function barColor(pct: number): string {
  if (pct >= 80) return 'var(--red)'
  if (pct >= 60) return 'var(--yellow)'
  return 'var(--accent)'
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'var(--accent)' : score >= 70 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-[var(--text)]">{score}</span>
      <div className="w-12 h-[3px] bg-[var(--border-2)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case 'complete':
      return { variant: 'green' as const, label: 'Ready' }
    case 'generating':
      return { variant: 'yellow' as const, label: 'Building', pulse: true }
    case 'failed':
      return { variant: 'red' as const, label: 'Failed' }
    default:
      return { variant: 'neutral' as const, label: 'Draft' }
  }
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton width={220} height={28} className="mb-2" />
        <Skeleton width={140} height={11} />
      </div>
      {/* Steps skeleton */}
      <div className="flex gap-3 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] p-5">
            <Skeleton width={32} height={32} className="rounded-[8px] mb-4" />
            <Skeleton width={80} height={12} className="mb-2" />
            <Skeleton width="100%" height={10} />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <Skeleton width={140} height={12} />
          <Skeleton width={60} height={10} />
        </div>
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}

// ── State A — First visit onboarding ─────────────────────────────────────────

function OnboardingView({ name, timeLabel }: { name: string | null; timeLabel: string }) {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>

      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-[10px] text-[var(--text-4)] mb-3 uppercase tracking-[0.12em]">
          {timeLabel}
        </p>
        <h1
          className="text-[32px] text-[var(--text)] leading-[1.1] tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-instrument-serif, Georgia, serif)', fontWeight: 400 }}
        >
          {name ? (
            <>Welcome, <em style={{ fontStyle: 'italic' }}>{name}.</em></>
          ) : (
            <>Your workspace<br />awaits.</>
          )}
        </h1>
        <p className="text-[13px] text-[var(--text-3)] mt-3 leading-[1.7] max-w-[440px]">
          Describe a startup idea — AI builds architecture, DB schema, and Cursor build kit in under 60 seconds.
        </p>
      </div>

      {/* 3-step flow */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-[680px]">
        {[
          {
            step: '01',
            label: 'Describe',
            desc: 'Write your idea in one sentence. Industry, stage, focus area.',
            icon: (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 4h12M2 7h8M2 10h10M2 13h6" />
              </svg>
            ),
          },
          {
            step: '02',
            label: 'Generate',
            desc: 'Claude builds a full blueprint — architecture, schema, revenue model.',
            icon: (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M9 2L4 9h4l-1 5 5-7H8l1-5z"/>
              </svg>
            ),
          },
          {
            step: '03',
            label: 'Ship',
            desc: 'Get your Cursor rules, build.md and schema.sql — start coding immediately.',
            icon: (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
              </svg>
            ),
          },
        ].map(({ step, label, desc, icon }) => (
          <div
            key={step}
            className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] p-5 hover:border-[var(--border-2)] transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-8 h-8 rounded-[7px] bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent-dim)] group-hover:border-[var(--accent-border)] transition-all duration-200">
                {icon}
              </div>
              <span className="font-mono text-[10px] text-[var(--text-4)] tracking-[0.08em]">{step}</span>
            </div>
            <div className="text-[12px] font-semibold text-[var(--text)] mb-1 tracking-[-0.01em]">{label}</div>
            <div className="text-[11px] text-[var(--text-3)] leading-[1.6]">{desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 px-5 py-[9px] bg-[var(--accent)] text-white text-[13px] font-medium rounded-[7px] hover:bg-[var(--accent-hover)] transition-all duration-[100ms] shadow-[0_2px_12px_rgba(99,102,241,0.25)]"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Generate first blueprint
        </Link>
        <span className="font-mono text-[11px] text-[var(--text-4)]">free · no credit card</span>
      </div>

      {/* Subtle divider + tip */}
      <div className="mt-10 pt-6 border-t border-[var(--border)]">
        <p className="font-mono text-[10px] text-[var(--text-4)] tracking-[0.04em]">
          tip — use <kbd className="font-mono text-[9px] px-[5px] py-[2px] rounded-[3px] bg-[var(--bg-3)] border border-[var(--border-2)] text-[var(--text-3)]">⌘K</kbd> to search blueprints from anywhere
        </p>
      </div>
    </div>
  )
}

// ── State B — Has blueprints ──────────────────────────────────────────────────

function WorkspaceView({
  data,
  loading,
  router,
  timeLabel,
}: {
  data: ReturnType<typeof useAnalyticsOverview>['data']
  loading: boolean
  router: ReturnType<typeof useRouter>
  timeLabel: string
}) {
  const blueprintCount = data?.stats.blueprints ?? 0
  const plan = (data?.userMeta?.plan ?? 'free') as string
  const planLimit = PLAN_LIMITS[plan] ?? 10
  const remaining = Math.max(0, planLimit - blueprintCount)
  const blueprintPct = Math.min((blueprintCount / planLimit) * 100, 100)
  const name = data?.userMeta?.name ? data.userMeta.name.split(' ')[0] : null

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>

      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="font-mono text-[10px] text-[var(--text-4)] mb-2 uppercase tracking-[0.12em]">
            {timeLabel}
          </p>
          <h1
            className="text-[26px] text-[var(--text)] leading-[1.1] tracking-[-0.025em]"
            style={{ fontFamily: 'var(--font-instrument-serif, Georgia, serif)', fontWeight: 400 }}
          >
            {name ? `${name}'s workspace` : 'your workspace'}
          </h1>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 px-4 py-[7px] bg-[var(--accent)] text-white text-[12px] font-medium rounded-[7px] hover:bg-[var(--accent-hover)] transition-all duration-[100ms] shrink-0"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New Blueprint
        </Link>
      </div>

      {/* Plan usage bar */}
      {loading ? (
        <div className="h-[52px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] animate-pulse mb-5" />
      ) : (
        <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] px-5 py-3.5 mb-5 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[140px]">
            <span className="font-mono text-[9px] text-[var(--text-4)] uppercase tracking-[0.1em] shrink-0">
              Generates
            </span>
            <div className="flex-1 h-[2px] bg-[var(--border-2)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${blueprintPct}%`, background: barColor(blueprintPct) }}
              />
            </div>
            <span className="font-mono text-[10px] text-[var(--text)] shrink-0">
              {blueprintCount}<span className="text-[var(--text-4)]">/{planLimit}</span>
            </span>
          </div>
          <div className="w-px h-3 bg-[var(--border-2)] shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[9px] px-2 py-[2px] rounded-[3px] bg-[var(--bg-4)] border border-[var(--border-2)] text-[var(--text-4)] uppercase tracking-[0.08em]">
              {plan}
            </span>
            {remaining === 0 ? (
              <Link
                href="/billing"
                className="font-mono text-[10px] text-[var(--red)] hover:opacity-70 transition-opacity"
              >
                Limit reached · Upgrade →
              </Link>
            ) : (
              <Link
                href="/billing"
                className="font-mono text-[10px] text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                {remaining} left · Upgrade →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent blueprints */}
      {loading ? (
        <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <Skeleton width={140} height={12} />
            <Skeleton width={60} height={10} />
          </div>
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : data && data.recentBlueprints.length > 0 ? (
        <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <span className="text-[12px] font-semibold text-[var(--text)] tracking-[-0.01em]">Recent blueprints</span>
            <Link
              href="/library"
              className="font-mono text-[10px] text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['project', 'industry', 'score', 'status', 'created'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2 text-left font-mono text-[9px] font-normal text-[var(--text-4)] uppercase tracking-[0.1em] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentBlueprints.slice(0, 6).map((bp) => {
                  const { variant, label, pulse } = statusBadge(bp.status)
                  return (
                    <tr
                      key={bp.id}
                      onClick={() => router.push(`/generate/${bp.id}`)}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-3)] cursor-pointer transition-colors duration-[80ms] group"
                    >
                      <td className="px-5 py-3">
                        <span className="text-[13px] font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors duration-[80ms]">
                          {bp.title}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge variant="indigo">{bp.industry ?? 'SaaS'}</Badge>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {bp.score_total !== null ? (
                          <ScoreBar score={bp.score_total} />
                        ) : (
                          <span className="text-[var(--text-4)] font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge variant={variant} pulse={pulse}>{label}</Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-4)] whitespace-nowrap">
                        {timeAgo(bp.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="font-mono text-[10px] text-[var(--text-4)]">
              {data.stats.blueprints} total · {data.recentBlueprints.filter(b => b.status === 'complete').length} ready
            </span>
            <Link
              href="/generate"
              className="font-mono text-[10px] text-[var(--text-3)] hover:text-[var(--accent)] transition-colors"
            >
              + new blueprint
            </Link>
          </div>
        </div>
      ) : (
        /* Empty within State B — shouldn't happen but fallback */
        <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] px-5 py-10 text-center">
          <p className="text-[13px] text-[var(--text-3)] mb-3">No blueprints yet.</p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-white text-[12px] font-medium rounded-[6px] hover:bg-[var(--accent-hover)] transition-colors"
          >
            Generate first
          </Link>
        </div>
      )}

    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading: loading, error: queryError, refetch } = useAnalyticsOverview()
  const router = useRouter()
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null
  const fetchOverview = useCallback(() => { refetch() }, [refetch])

  const now = new Date()
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
  const day = now.toLocaleDateString('en-US', { day: '2-digit' })
  const month = now.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const timeLabel = `${weekday} ${day} ${month} · ${time}`

  if (error) {
    return <ErrorState message={error} onRetry={fetchOverview} />
  }

  // Loading — show skeleton
  if (loading) {
    return <DashboardSkeleton />
  }

  // State A — first visit, no blueprints
  if (data && data.recentBlueprints.length === 0) {
    const name = data.userMeta?.name ? data.userMeta.name.split(' ')[0] : null
    return <OnboardingView name={name} timeLabel={timeLabel} />
  }

  // State B — has blueprints
  return <WorkspaceView data={data} loading={loading} router={router} timeLabel={timeLabel} />
}
