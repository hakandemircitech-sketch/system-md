'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { RevenueResponse } from '@/app/api/analytics/revenue/route'
import type { OverviewResponse } from '@/app/api/analytics/overview/route'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useElementWidthEffect(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(400)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return width
}

// ─── Revenue Line Chart ───────────────────────────────────────────────────────

function RevenueLineChart({ data }: { data: RevenueResponse }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useElementWidthEffect(containerRef)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; i: number } | null>(null)

  const H = 180
  const pad = { top: 16, right: 16, bottom: 28, left: 44 }
  const cW = Math.max(width - pad.left - pad.right, 100)
  const cH = H - pad.top - pad.bottom

  const allVals = [...data.mrr, ...data.once]
  const maxVal = Math.max(...allVals, 1)

  const xScale = (i: number) => pad.left + (i / Math.max(data.labels.length - 1, 1)) * cW
  const yScale = (v: number) => pad.top + cH - (v / maxVal) * cH

  const mkPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')

  const mkArea = (vals: number[]) =>
    `${mkPath(vals)} L${xScale(vals.length - 1).toFixed(1)},${(pad.top + cH).toFixed(1)} L${pad.left.toFixed(1)},${(pad.top + cH).toFixed(1)} Z`

  const n = data.labels.length
  const step = n <= 14 ? 1 : n <= 30 ? 7 : 14
  const xLabelIdxs = data.labels
    .map((_, i) => i)
    .filter((i) => i % step === 0 || i === n - 1)

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, i: number) => {
      const rect = (e.currentTarget.closest('[data-chart-area]') as HTMLElement | null)?.getBoundingClientRect()
      if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, i })
    },
    [],
  )

  return (
    <div ref={containerRef} className="px-5 pb-5 pt-4 relative" data-chart-area>
      {tooltip !== null && (
        <div
          className="absolute z-10 bg-[var(--bg-4)] border border-[var(--border-2)] rounded-[6px] px-3 py-2 pointer-events-none font-mono text-[11px] leading-[1.8] min-w-[128px] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          style={{ left: tooltip.x + 12, top: Math.max(tooltip.y - 20, 4) }}
        >
          <div className="text-[10px] text-[var(--text-3)] mb-1">Day {data.labels[tooltip.i]}</div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-[6px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#6366f1]" />
              <span className="text-[var(--text-2)]">MRR</span>
            </div>
            <span className="text-[var(--text)] font-medium">${data.mrr[tooltip.i]}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-[6px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#22c55e]" />
              <span className="text-[var(--text-2)]">One-time</span>
            </div>
            <span className="text-[var(--text)] font-medium">${data.once[tooltip.i]}</span>
          </div>
        </div>
      )}

      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="grad-mrr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-once" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = pad.top + cH * (1 - p)
          const val = Math.round(p * maxVal)
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={pad.left + cW}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={pad.left - 6}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-3)"
                fontFamily="var(--font-mono)"
                fontSize="9"
              >
                ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          )
        })}

        {xLabelIdxs.map((i) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 4}
            textAnchor="middle"
            fill="var(--text-3)"
            fontFamily="var(--font-mono)"
            fontSize="9"
          >
            {data.labels[i]}
          </text>
        ))}

        <path d={mkArea(data.once)} fill="url(#grad-once)" opacity="0.12" />
        <path d={mkArea(data.mrr)} fill="url(#grad-mrr)" opacity="0.12" />

        <path
          d={mkPath(data.once)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{ animation: 'drawLine 1.2s ease 0.4s forwards' }}
        />
        <path
          d={mkPath(data.mrr)}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          style={{ animation: 'drawLine 1.2s ease 0.2s forwards' }}
        />

        {data.mrr.length <= 30 &&
          data.mrr.map((v, i) => (
            <circle
              key={`mrr-${i}`}
              cx={xScale(i)}
              cy={yScale(v)}
              r="3"
              fill="#6366f1"
              className="cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, i)}
            />
          ))}
        {data.once.length <= 30 &&
          data.once.map((v, i) => (
            <circle
              key={`once-${i}`}
              cx={xScale(i)}
              cy={yScale(v)}
              r="3"
              fill="#22c55e"
              className="cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(e, i)}
            />
          ))}
      </svg>
    </div>
  )
}

// ─── Plan Donut Chart ─────────────────────────────────────────────────────────

function PlanDonutChart({
  data,
}: {
  data: { plan: string; count: number; percentage: number; color: string }[]
}) {
  const r = 38
  const cx = 55
  const cy = 55
  const circ = 2 * Math.PI * r

  let offset = 0
  const arcs = data.map((p) => {
    const dash = (p.percentage / 100) * circ
    const gap = circ - dash
    const arc = { ...p, dash, gap, offset }
    offset += dash
    return arc
  })

  const total = data.reduce((s, p) => s + p.count, 0)

  return (
    <div className="flex items-center gap-6 px-5 py-4">
      <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-2)" strokeWidth="16" />
        {arcs.map((arc) => (
          <circle
            key={arc.plan}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="16"
            strokeDasharray={`${arc.dash.toFixed(2)} ${arc.gap.toFixed(2)}`}
            strokeDashoffset={(-arc.offset).toFixed(2)}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="var(--text)"
          fontFamily="var(--font-mono)"
          fontSize="14"
          fontWeight="600"
        >
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="var(--text-3)" fontFamily="var(--font-mono)" fontSize="9">
          users
        </text>
      </svg>

      <div className="flex flex-col gap-[10px]">
        {data.map((p) => (
          <div key={p.plan} className="flex items-center gap-[10px]">
            <div className="w-[10px] h-[10px] rounded-[2px] shrink-0" style={{ background: p.color }} />
            <span className="text-[12px] text-[var(--text-2)]">{p.plan}</span>
            <span className="font-mono text-[11px] text-[var(--text)] font-medium ml-auto pr-2">{p.count}</span>
            <span className="font-mono text-[10px] text-[var(--text-3)] min-w-[32px] text-right">{p.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Props & Card Helpers ─────────────────────────────────────────────────────

export function SkeletonCard({ h = 220 }: { h?: number }) {
  return (
    <div className="p-5 animate-pulse">
      <div className="rounded-[6px] bg-[var(--bg-3)]" style={{ height: h }} />
    </div>
  )
}

interface RevenueChartProps {
  revenue: RevenueResponse | null
  overview: OverviewResponse | null
  loading: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RevenueChart({ revenue, overview, loading }: RevenueChartProps) {
  return (
    <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: '1fr 340px' }}>
      {/* Revenue Line Chart */}
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
        style={{ animation: 'fadeUp 0.3s ease 0.22s both' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text)]">Revenue over time</div>
            <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
              Illustrative MRR projection · payment integration pending
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            <div className="flex gap-4">
              {[
                { color: '#6366f1', label: 'MRR' },
                { color: '#22c55e', label: 'One-time' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-[6px] font-mono text-[10px] text-[var(--text-3)]">
                  <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        {loading || !revenue ? (
          <SkeletonCard h={200} />
        ) : (
          <RevenueLineChart data={revenue} />
        )}
      </div>

      {/* Plan Donut Chart */}
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
        style={{ animation: 'fadeUp 0.3s ease 0.28s both' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text)]">Plan Distribution</div>
            <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
              Illustrative · platform-level data pending
            </div>
          </div>
        </div>
        {loading || !overview ? (
          <SkeletonCard h={160} />
        ) : (
          <PlanDonutChart data={overview.planDistribution} />
        )}
      </div>
    </div>
  )
}
