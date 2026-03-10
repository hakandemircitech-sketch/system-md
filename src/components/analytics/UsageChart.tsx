'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { SignupsResponse } from '@/app/api/analytics/signups/route'
import type { CategoriesResponse } from '@/app/api/analytics/categories/route'
import type { FunnelResponse } from '@/app/api/analytics/funnel/route'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useElementWidth(ref: React.RefObject<HTMLDivElement | null>): number {
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

// ─── Signups Bar Chart ────────────────────────────────────────────────────────

function SignupsBarChart({ data }: { data: SignupsResponse }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(containerRef)

  const H = 160
  const pad = { top: 10, right: 10, bottom: 28, left: 32 }
  const cW = Math.max(width - pad.left - pad.right, 100)
  const cH = H - pad.top - pad.bottom

  const series = [data.free, data.paid]
  const colors = ['#6366f1', '#22c55e']
  const maxVal = Math.max(...series.flat(), 1)
  const groupW = cW / data.labels.length
  const barW = (groupW * 0.68) / series.length
  const gapX = (groupW - barW * series.length) / 2

  const labelStep = data.labels.length <= 14 ? 1 : Math.ceil(data.labels.length / 10)

  return (
    <div ref={containerRef} className="px-5 pb-5 pt-4">
      <svg width={width} height={H} style={{ display: 'block' }}>
        {[0.5, 1].map((p, i) => {
          const y = pad.top + cH * (1 - p)
          const v = Math.round(p * maxVal)
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
                x={pad.left - 4}
                y={y + 3}
                textAnchor="end"
                fill="var(--text-3)"
                fontFamily="var(--font-mono)"
                fontSize="9"
              >
                {v}
              </text>
            </g>
          )
        })}

        {data.labels.map((lbl, li) => {
          return (
            <g key={li}>
              {series.map((s, si) => {
                const v = s[li]
                const x = pad.left + li * groupW + gapX + si * barW
                const barH = (v / maxVal) * cH
                const y = pad.top + cH - barH
                return (
                  <rect
                    key={si}
                    x={x.toFixed(1)}
                    y={y.toFixed(1)}
                    width={barW.toFixed(1)}
                    height={barH.toFixed(1)}
                    fill={colors[si]}
                    rx="2"
                    style={{ animation: `fadeUp 0.4s ease ${li * 0.04}s both` }}
                  />
                )
              })}
              {li % labelStep === 0 && (
                <text
                  x={(pad.left + li * groupW + groupW / 2).toFixed(1)}
                  y={H - 6}
                  textAnchor="middle"
                  fill="var(--text-3)"
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                >
                  {lbl}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Categories Horizontal Bar Chart ─────────────────────────────────────────

function CategoriesHBarChart({ data }: { data: CategoriesResponse }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(containerRef)

  const H = 160
  const labelW = 60
  const barMax = width - labelW - 50

  const maxVal = Math.max(...data.values, 1)
  const rowH = H / data.labels.length
  const barH = rowH * 0.5

  return (
    <div ref={containerRef} className="px-5 pb-5 pt-4">
      <svg width={width} height={H} style={{ display: 'block' }}>
        {data.labels.map((lbl, i) => {
          const v = data.values[i]
          const bW = (v / maxVal) * barMax
          const y = i * rowH + (rowH - barH) / 2
          return (
            <g key={i}>
              <text
                x={labelW - 8}
                y={(y + barH / 2 + 3.5).toFixed(1)}
                textAnchor="end"
                fill="var(--text-3)"
                fontFamily="var(--font-mono)"
                fontSize="9.5"
              >
                {lbl}
              </text>
              <rect
                x={labelW}
                y={y.toFixed(1)}
                width={bW.toFixed(1)}
                height={barH.toFixed(1)}
                fill={data.colors[i] ?? '#6366f1'}
                rx="3"
                opacity="0.85"
                style={{ animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}
              />
              <text
                x={(labelW + bW + 6).toFixed(1)}
                y={(y + barH / 2 + 3.5).toFixed(1)}
                fill="var(--text-3)"
                fontFamily="var(--font-mono)"
                fontSize="9"
              >
                {v}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Conversion Funnel ────────────────────────────────────────────────────────

function ConversionFunnel({ steps }: { steps: FunnelResponse['steps'] }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [steps])

  const base = steps[0]?.val ?? 1
  const COLORS = [
    'hsl(240, 70%, 55%)',
    'hsl(210, 70%, 51%)',
    'hsl(180, 70%, 47%)',
    'hsl(150, 70%, 43%)',
    'hsl(120, 65%, 39%)',
  ]

  return (
    <div className="px-5 py-5 flex flex-col gap-[6px]">
      {steps.map((step, i) => {
        const widthPct = ((step.val / base) * 100).toFixed(1)
        const nextStep = steps[i + 1]
        const convRate = nextStep
          ? `${((nextStep.val / step.val) * 100).toFixed(0)}%`
          : null

        return (
          <div key={i}>
            <div className="flex items-center gap-3">
              <div className="text-[12px] text-[var(--text-2)] min-w-[110px] text-right">
                {step.label}
              </div>
              <div className="flex-1">
                <div className="h-7 bg-[var(--bg-4)] rounded-[4px] overflow-hidden relative">
                  <div
                    className="h-full rounded-[4px] flex items-center pl-[10px] font-mono text-[11px] font-medium text-white/90 whitespace-nowrap overflow-hidden transition-[width] duration-[800ms] ease-out"
                    style={{
                      background: COLORS[i] ?? COLORS[COLORS.length - 1],
                      width: animated ? `${widthPct}%` : '0%',
                      transitionDelay: `${i * 0.12}s`,
                    }}
                  >
                    {step.val.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="font-mono text-[10px] text-[var(--text-3)] min-w-[36px] text-right">
                {step.pct}%
              </div>
            </div>
            {convRate && (
              <div className="font-mono text-[10px] text-[var(--text-4)] pl-[122px] py-[1px]">
                ↓{' '}
                <span className="text-[var(--text-3)]">{convRate}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SkeletonCard({ h = 220 }: { h?: number }) {
  return (
    <div className="p-5 animate-pulse">
      <div className="rounded-[6px] bg-[var(--bg-3)]" style={{ height: h }} />
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsageChartProps {
  signups: SignupsResponse | null
  categories: CategoriesResponse | null
  funnel: FunnelResponse | null
  loading: boolean
  range: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsageChart({ signups, categories, funnel, loading, range }: UsageChartProps) {
  return (
    <>
      {/* New Signups + Blueprint Categories */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div
          className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
          style={{ animation: 'fadeUp 0.3s ease 0.32s both' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <div className="text-[13px] font-semibold text-[var(--text)]">New Signups</div>
              <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
                Daily new users · last {range === '7d' ? '7' : range === '90d' ? '90' : '30'} days
              </div>
            </div>
            <div className="flex items-center gap-[10px]">
              <div className="flex gap-4">
                {[
                  { color: '#6366f1', label: 'Free', circle: true },
                  { color: '#22c55e', label: 'Paid', circle: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-[6px] font-mono text-[10px] text-[var(--text-3)]">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {loading || !signups ? (
            <SkeletonCard h={180} />
          ) : (
            <SignupsBarChart data={signups} />
          )}
        </div>

        <div
          className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
          style={{ animation: 'fadeUp 0.3s ease 0.38s both' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <div className="text-[13px] font-semibold text-[var(--text)]">Blueprints by Category</div>
              <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">Generated this period</div>
            </div>
          </div>
          {loading || !categories ? (
            <SkeletonCard h={180} />
          ) : (
            <CategoriesHBarChart data={categories} />
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div
        className="bg-[var(--bg-2)] border border-[var(--border)] rounded-lg overflow-hidden hover:border-[var(--border-2)] transition-colors"
        style={{ animation: 'fadeUp 0.3s ease 0.42s both' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text)]">Conversion Funnel</div>
          </div>
        </div>
        {loading || !funnel ? (
          <SkeletonCard h={220} />
        ) : (
          <ConversionFunnel steps={funnel.steps} />
        )}
      </div>
    </>
  )
}
