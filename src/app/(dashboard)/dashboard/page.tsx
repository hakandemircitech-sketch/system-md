'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAnalyticsOverview } from '@/hooks/useAnalytics'

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }

function timeAgo(dateStr: string): string {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) }
  catch { return dateStr }
}

function DashboardSkeleton() {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease', maxWidth: 760 }}>
      <Skeleton width={260} height={44} className="mb-3" />
      <Skeleton width={200} height={14} className="mb-12" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <Skeleton width={36} height={36} className="mb-5" />
            <Skeleton width={70} height={13} className="mb-2" />
            <Skeleton width="90%" height={11} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Status dot ────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    complete:   { color: '#22c55e', label: 'Ready' },
    generating: { color: '#eab308', label: 'Building' },
    failed:     { color: '#ef4444', label: 'Failed' },
  }
  const s = map[status] ?? { color: 'var(--text-4)', label: 'Draft' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

// ── Score chip ────────────────────────────────────────────────────────────────
function ScoreChip({ score }: { score: number }) {
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 11, fontWeight: 600,
      color, background: color + '18',
      padding: '2px 7px', borderRadius: 5,
    }}>
      {score}
    </span>
  )
}

// ── Step cards helper ─────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Describe',
    body: 'One sentence. What does it do, who is it for, what problem does it solve.',
    icon: (
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M2 3.5h12M2 6.5h8M2 9.5h10M2 12.5h6" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Generate',
    body: 'Claude builds architecture, DB schema, revenue model and Cursor rules in ~60s.',
    icon: (
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M9 1.5L4.5 8.5H8L7 14.5L12 7H8.5L9 1.5Z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Ship',
    body: 'Download .cursorrules, build.md, and schema.sql — open in Cursor and start coding.',
    icon: (
      <svg width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M8 2v9M5 8l3 3 3-3M2 13h12" />
      </svg>
    ),
  },
]

// ── State A — first visit ─────────────────────────────────────────────────────
function OnboardingView({ name, timeLabel }: { name: string | null; timeLabel: string }) {
  return (
    <div style={{ animation: 'fadeUp 0.45s ease', maxWidth: 720 }}>

      {/* Hero */}
      <div style={{ marginBottom: 52 }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.14em',
          color: 'var(--text-4)', marginBottom: 14,
        }}>
          {timeLabel}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 42, fontWeight: 400,
          lineHeight: 1.08, letterSpacing: '-0.02em',
          color: 'var(--text)', marginBottom: 16,
        }}>
          {name ? (
            <>Welcome back,{' '}<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{name}.</em></>
          ) : (
            <>Your workspace<br />is ready.</>
          )}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-3)', lineHeight: 1.75, maxWidth: 440 }}>
          Describe a startup idea — AI builds architecture, DB schema,
          and a Cursor build kit in under 60 seconds.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {STEPS.map(({ num, title, body, icon }) => (
          <div
            key={num}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '22px 20px',
              transition: 'border-color 200ms, box-shadow 200ms',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--accent-border)'
              el.style.boxShadow = '0 4px 24px rgba(99,102,241,0.07)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--border)'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)',
              }}>
                {icon}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.08em' }}>
                {num}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65 }}>
              {body}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link
          href="/generate"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px',
            background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 500,
            borderRadius: 9,
            textDecoration: 'none',
            boxShadow: '0 2px 16px rgba(99,102,241,0.28)',
            transition: 'all 130ms ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(99,102,241,0.36)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
            ;(e.currentTarget as HTMLElement).style.transform = 'none'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(99,102,241,0.28)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Generate first blueprint
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-4)' }}>
          free · no card required
        </span>
      </div>

      {/* Tip */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.02em' }}>
          tip — press{' '}
          <kbd style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            padding: '2px 6px', borderRadius: 4,
            background: 'var(--bg-3)', border: '1px solid var(--border-2)',
            color: 'var(--text-3)',
          }}>⌘K</kbd>
          {' '}to search blueprints from anywhere
        </p>
      </div>

    </div>
  )
}

// ── State B — has blueprints ──────────────────────────────────────────────────
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
  const usedPct = Math.min((blueprintCount / planLimit) * 100, 100)
  const barColor = usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#eab308' : '#6366f1'
  const name = data?.userMeta?.name ? data.userMeta.name.split(' ')[0] : null

  return (
    <div style={{ animation: 'fadeUp 0.35s ease', maxWidth: 760 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'var(--text-4)', marginBottom: 10,
          }}>
            {timeLabel}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 34, fontWeight: 400,
            lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}>
            {name ? (
              <>{name}&apos;s workspace</>
            ) : (
              <>Your workspace</>
            )}
          </h1>
        </div>
        <Link
          href="/generate"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 18px',
            background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 500, borderRadius: 9,
            textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(99,102,241,0.22)',
            transition: 'all 130ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
            ;(e.currentTarget as HTMLElement).style.transform = 'none'
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New Blueprint
        </Link>
      </div>

      {/* Usage card */}
      {!loading && (
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '18px 22px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}>
          {/* Plan badge */}
          <div style={{ flexShrink: 0 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}>
              {plan}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Generates
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: barColor }}>
                {blueprintCount}<span style={{ color: 'var(--text-4)', fontWeight: 400 }}>/{planLimit}</span>
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPct}%`, background: barColor, borderRadius: 99, transition: 'width 0.7s ease' }} />
            </div>
          </div>

          {/* Remaining / upgrade */}
          <div style={{ flexShrink: 0 }}>
            {remaining === 0 ? (
              <Link href="/billing" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444', textDecoration: 'none', fontWeight: 500 }}>
                Limit reached · Upgrade →
              </Link>
            ) : (
              <Link href="/billing" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', textDecoration: 'none' }}>
                {remaining} left · <span style={{ color: 'var(--accent)' }}>Upgrade →</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent blueprints */}
      {loading ? (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <Skeleton width="40%" height={13} />
              <Skeleton width="15%" height={13} />
              <Skeleton width="10%" height={13} />
              <Skeleton width="12%" height={13} />
            </div>
          ))}
        </div>
      ) : data && data.recentBlueprints.length > 0 ? (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Recent blueprints
            </span>
            <Link href="/library" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 72px 90px 90px',
            padding: '6px 22px',
            borderBottom: '1px solid var(--border)',
          }}>
            {['project', 'industry', 'score', 'status', 'created'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {data.recentBlueprints.slice(0, 7).map((bp, i) => (
            <div
              key={bp.id}
              onClick={() => router.push(`/generate/${bp.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 72px 90px 90px',
                padding: '13px 22px',
                borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                transition: 'background 80ms',
                alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {bp.title}
              </span>
              <span style={{
                display: 'inline-block',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--accent)', background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 5, padding: '2px 8px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 90,
              }}>
                {bp.industry ?? 'SaaS'}
              </span>
              <span>
                {bp.score_total !== null ? <ScoreChip score={bp.score_total} /> : <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>}
              </span>
              <StatusDot status={bp.status} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
                {timeAgo(bp.created_at)}
              </span>
            </div>
          ))}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 22px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-3)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
              {data.stats.blueprints} total · {data.recentBlueprints.filter(b => b.status === 'complete').length} ready
            </span>
            <Link href="/generate" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textDecoration: 'none' }}>
              + new blueprint
            </Link>
          </div>

        </div>
      ) : (
        <div style={{
          background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16 }}>No blueprints yet.</p>
          <Link href="/generate" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 500, borderRadius: 8, textDecoration: 'none',
          }}>
            Generate first blueprint
          </Link>
        </div>
      )}

    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  if (error) return <ErrorState message={error} onRetry={fetchOverview} />
  if (loading) return <DashboardSkeleton />

  if (data && data.recentBlueprints.length === 0) {
    const name = data.userMeta?.name ? data.userMeta.name.split(' ')[0] : null
    return <OnboardingView name={name} timeLabel={timeLabel} />
  }

  return <WorkspaceView data={data} loading={loading} router={router} timeLabel={timeLabel} />
}
