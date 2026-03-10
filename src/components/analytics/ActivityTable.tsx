'use client'

import type { OverviewResponse } from '@/app/api/analytics/overview/route'
import type { HeatmapResponse } from '@/app/api/analytics/heatmap/route'

// ─── Top Blueprints Table ─────────────────────────────────────────────────────

const ACCENT_COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#3b82f6', '#eab308']

function TopBlueprintsTable({ blueprints }: {
  blueprints: Array<{ id: string; title: string; industry: string | null; score_total: number | null; status: string; created_at: string }>
}) {
  if (!blueprints.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-[12px] text-[var(--text-3)]">No blueprints yet</p>
      </div>
    )
  }

  const maxScore = Math.max(...blueprints.map(b => b.score_total ?? 0), 1)

  return (
    <div>
      {blueprints.map((bp, i) => {
        const score = bp.score_total ?? 0
        const pct = Math.round((score / maxScore) * 100)
        const color = ACCENT_COLORS[i % ACCENT_COLORS.length] ?? '#6366f1'
        return (
          <div
            key={bp.id}
            className="flex items-center gap-3 px-5 py-[11px] border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-3)] transition-colors cursor-pointer"
          >
            <span className="font-mono text-[11px] text-[var(--text-4)] min-w-[20px]">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[var(--text)] truncate">{bp.title}</div>
              <div className="font-mono text-[10px] text-[var(--text-3)]">
                {bp.industry ?? 'SaaS'} {score > 0 ? `· ${score}` : ''}
              </div>
            </div>
            <div className="w-[80px]">
              <div className="h-[3px] bg-[var(--border-2)] rounded-[2px] overflow-hidden">
                <div
                  className="h-full rounded-[2px]"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
            <span className="font-mono text-[11px] text-[var(--text)] min-w-[36px] text-right">
              {score > 0 ? score : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────

function ActivityHeatmap({ data }: { data: HeatmapResponse }) {
  function getColor(v: number): string {
    const intensity = v / 100
    if (intensity < 0.1) return 'var(--bg-4)'
    if (intensity < 0.3) return 'rgba(99,102,241,0.2)'
    if (intensity < 0.6) return 'rgba(99,102,241,0.45)'
    if (intensity < 0.85) return 'rgba(99,102,241,0.7)'
    return '#6366f1'
  }

  return (
    <div className="px-5 pb-5 pt-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data.months.length}, 1fr)` }}>
        {data.values.map((v, i) => (
          <div
            key={i}
            className="aspect-square rounded-[3px] cursor-pointer hover:opacity-70 transition-opacity"
            style={{ background: getColor(v) }}
            title={`${data.months[i]}: ${v} blueprints`}
          />
        ))}
      </div>
      <div
        className="grid gap-1 mt-[6px]"
        style={{ gridTemplateColumns: `repeat(${data.months.length}, 1fr)` }}
      >
        {data.months.map((m, i) => (
          <div key={i} className="font-mono text-[9px] text-[var(--text-3)] text-center">
            {m}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-[6px] mt-[10px]">
        <span className="font-mono text-[9px] text-[var(--text-4)]">Less</span>
        <div className="flex gap-[3px]">
          {[
            'var(--bg-4)',
            'rgba(99,102,241,0.2)',
            'rgba(99,102,241,0.45)',
            'rgba(99,102,241,0.7)',
            '#6366f1',
          ].map((bg, i) => (
            <div key={i} className="w-[10px] h-[10px] rounded-[2px]" style={{ background: bg }} />
          ))}
        </div>
        <span className="font-mono text-[9px] text-[var(--text-4)]">More</span>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ h = 220 }: { h?: number }) {
  return (
    <div className="p-5 animate-pulse">
      <div className="rounded-[6px] bg-[var(--bg-3)]" style={{ height: h }} />
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActivityTableProps {
  overview: OverviewResponse | null
  heatmap: HeatmapResponse | null
  loading: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityTable({ overview, heatmap, loading }: ActivityTableProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Top Blueprints */}
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
        style={{ animation: 'fadeUp 0.3s ease 0.46s both' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text)]">Top Blueprints</div>
            <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">by score · your library</div>
          </div>
        </div>
        {loading || !overview ? (
          <SkeletonCard h={200} />
        ) : (
          <TopBlueprintsTable blueprints={overview.recentBlueprints} />
        )}
      </div>

      {/* Activity Heatmap */}
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
        style={{ animation: 'fadeUp 0.3s ease 0.5s both' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text)]">Activity Heatmap</div>
            <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
              blueprints generated · past 12 months
            </div>
          </div>
        </div>
        {loading || !heatmap ? (
          <SkeletonCard h={140} />
        ) : (
          <ActivityHeatmap data={heatmap} />
        )}
      </div>
    </div>
  )
}
