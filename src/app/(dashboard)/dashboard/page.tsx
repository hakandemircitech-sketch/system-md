'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAnalyticsOverview } from '@/hooks/useAnalytics'

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }

function timeAgo(s: string) {
  try { return formatDistanceToNow(new Date(s), { addSuffix: true }) } catch { return s }
}

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
function Skeleton({ w, h, className }: { w: number | string; h: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: w, height: h, borderRadius: 8,
        background: 'linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <Skeleton w={280} h={48} className="mb-3" />
      <Skeleton w={220} h={15} className="mb-10" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {[1,2,3].map(i => <Skeleton key={i} w="100%" h={110} />)}
      </div>
      <Skeleton w="100%" h={280} />
    </div>
  )
}

/* ── Status dot ───────────────────────────────────────────────────────────── */
function StatusDot({ status }: { status: string }) {
  const m: Record<string, { c: string; l: string }> = {
    complete: { c: '#22c55e', l: 'Ready' },
    generating: { c: '#eab308', l: 'Building' },
    failed: { c: '#ef4444', l: 'Failed' },
  }
  const s = m[status] ?? { c: 'var(--text-4)', l: 'Draft' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-2)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.c, flexShrink: 0, display: 'inline-block' }} />
      {s.l}
    </span>
  )
}

/* ── Score chip ───────────────────────────────────────────────────────────── */
function Score({ n }: { n: number }) {
  const c = n >= 85 ? '#22c55e' : n >= 70 ? '#eab308' : '#ef4444'
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: c, background: c + '18', padding: '2px 8px', borderRadius: 5 }}>
      {n}
    </span>
  )
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '20px 22px',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent ?? 'var(--text)', lineHeight: 1, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

/* ── Steps (for onboarding) ───────────────────────────────────────────────── */
const STEPS = [
  {
    num: '01', title: 'Describe',
    body: 'One sentence — what does it do and for whom? Industry, stage, focus area.',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M2 3.5h12M2 6.5h8M2 9.5h10M2 12.5h6"/></svg>,
  },
  {
    num: '02', title: 'Generate',
    body: 'Claude builds architecture, DB schema, revenue model and Cursor rules in ~60s.',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M9 1.5L4.5 8.5H8L7 14.5L12 7H8.5L9 1.5Z"/></svg>,
  },
  {
    num: '03', title: 'Ship',
    body: 'Download .cursorrules, build.md, schema.sql — open in Cursor and start coding.',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M8 2v9M5 8l3 3 3-3M2 13h12"/></svg>,
  },
]

/* ── Onboarding (first visit) ─────────────────────────────────────────────── */
function OnboardingView({ name, timeLabel }: { name: string | null; timeLabel: string }) {
  return (
    <div style={{ animation: 'fadeUp 0.45s ease' }}>

      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 14 }}>
          {timeLabel}
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--text)', marginBottom: 16 }}>
          {name ? <>Welcome back,{' '}<em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{name}.</em></> : <>Your workspace<br />is ready.</>}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 480 }}>
          Describe a startup idea — AI builds architecture, DB schema, and a Cursor build kit in under 60 seconds.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {STEPS.map(({ num, title, body, icon }) => (
          <div key={num} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 22px', transition: 'border-color 200ms, box-shadow 200ms', cursor: 'default' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent-border)'; el.style.boxShadow = '0 4px 24px rgba(99,102,241,0.08)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                {icon}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.08em' }}>{num}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{body}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, borderRadius: 10, textDecoration: 'none', boxShadow: '0 2px 16px rgba(99,102,241,0.28)', transition: 'all 130ms ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v10M3 8h10"/></svg>
          Generate first blueprint
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>free · no card required</span>
      </div>

      {/* Tip */}
      <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
          tip — press{' '}
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-3)', border: '1px solid var(--border-2)', color: 'var(--text-3)' }}>⌘K</kbd>
          {' '}to search blueprints from anywhere
        </p>
      </div>
    </div>
  )
}

/* ── Workspace (has blueprints) ───────────────────────────────────────────── */
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
  const count = data?.stats.blueprints ?? 0
  const plan = (data?.userMeta?.plan ?? 'free') as string
  const limit = PLAN_LIMITS[plan] ?? 10
  const remaining = Math.max(0, limit - count)
  const pct = Math.min((count / limit) * 100, 100)
  const barC = pct >= 90 ? '#ef4444' : pct >= 70 ? '#eab308' : '#6366f1'
  const name = data?.userMeta?.name ? data.userMeta.name.split(' ')[0] : null
  const readyCount = data?.recentBlueprints.filter(b => b.status === 'complete').length ?? 0
  const avgScore = data?.recentBlueprints.filter(b => b.score_total !== null).length
    ? Math.round((data?.recentBlueprints.filter(b => b.score_total !== null).reduce((a, b) => a + (b.score_total ?? 0), 0) ?? 0) / (data?.recentBlueprints.filter(b => b.score_total !== null).length ?? 1))
    : null

  return (
    <div style={{ animation: 'fadeUp 0.35s ease' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-4)', marginBottom: 12 }}>
          {timeLabel}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--text)' }}>
            {name ? <>{name}&apos;s workspace</> : <>Your workspace</>}
          </h1>
          <Link href="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 20px', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, borderRadius: 10, textDecoration: 'none', boxShadow: '0 2px 12px rgba(99,102,241,0.22)', transition: 'all 130ms ease', flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v10M3 8h10"/></svg>
            New Blueprint
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard label="Total Blueprints" value={count} sub={`${remaining} of ${limit} remaining`} />
          <StatCard label="Ready to Ship" value={readyCount} sub={count > 0 ? `${Math.round((readyCount / count) * 100)}% success rate` : 'No blueprints yet'} accent={readyCount > 0 ? '#22c55e' : undefined} />
          <StatCard label="Avg Score" value={avgScore !== null ? avgScore : '—'} sub={avgScore !== null ? (avgScore >= 85 ? 'Excellent quality' : avgScore >= 70 ? 'Good quality' : 'Needs improvement') : 'Generate to see scores'} accent={avgScore !== null ? (avgScore >= 85 ? '#22c55e' : avgScore >= 70 ? '#eab308' : '#ef4444') : undefined} />
        </div>
      )}

      {/* Usage bar */}
      {!loading && (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 5, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)', flexShrink: 0 }}>{plan}</span>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ height: 4, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: barC, borderRadius: 99, transition: 'width 0.7s' }} />
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: barC, flexShrink: 0 }}>{count}/{limit}</span>
          <Link href="/billing" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}>Upgrade →</Link>
        </div>
      )}

      {/* Blueprints table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 52, background: 'var(--bg-2)', borderRadius: 8, animation: 'pulse 1.5s ease infinite' }} />)}
        </div>
      ) : data && data.recentBlueprints.length > 0 ? (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Recent blueprints</span>
            <Link href="/library" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '8px 1fr 100px 68px 90px 90px', padding: '6px 22px', borderBottom: '1px solid var(--border)' }}>
            {['', 'project', 'industry', 'score', 'status', 'created'].map(h => (
              <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>
          {data.recentBlueprints.slice(0, 7).map((bp, i) => (
            <div key={bp.id} onClick={() => router.push(`/generate/${bp.id}`)}
              style={{ display: 'grid', gridTemplateColumns: '8px 1fr 100px 68px 90px 90px', padding: '13px 22px', borderBottom: i < 6 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 80ms', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: bp.status === 'complete' ? '#22c55e' : bp.status === 'generating' ? '#eab308' : bp.status === 'failed' ? '#ef4444' : 'var(--text-4)' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{bp.title}</span>
              <span style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 5, padding: '2px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{bp.industry ?? 'SaaS'}</span>
              <span>{bp.score_total !== null ? <Score n={bp.score_total} /> : <span style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>}</span>
              <StatusDot status={bp.status} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{timeAgo(bp.created_at)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>{data.stats.blueprints} total · {readyCount} ready</span>
            <Link href="/generate" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textDecoration: 'none' }}>+ new blueprint</Link>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16 }}>No blueprints yet.</p>
          <Link href="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, borderRadius: 9, textDecoration: 'none' }}>Generate first blueprint</Link>
        </div>
      )}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data, isLoading: loading, error: queryError, refetch } = useAnalyticsOverview()
  const router = useRouter()
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null
  const fetchOverview = useCallback(() => { refetch() }, [refetch])

  const now = new Date()
  const timeLabel = `${now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()} ${now.toLocaleDateString('en-US', { day: '2-digit' })} ${now.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()} · ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`

  if (error) return <ErrorState message={error} onRetry={fetchOverview} />
  if (loading) return <DashboardSkeleton />
  if (data && data.recentBlueprints.length === 0) {
    return <OnboardingView name={data.userMeta?.name ? data.userMeta.name.split(' ')[0] : null} timeLabel={timeLabel} />
  }
  return <WorkspaceView data={data} loading={loading} router={router} timeLabel={timeLabel} />
}
