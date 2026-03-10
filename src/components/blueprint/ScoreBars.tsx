'use client'

import { useEffect, useState } from 'react'
import type { BlueprintSkor } from '@/types/blueprint'

interface ScoreBarsProps {
  skor: BlueprintSkor
  animate?: boolean
}

const SUB_SCORES = [
  { key: 'pazar' as const, label: 'market', color: 'var(--green)' },
  { key: 'teknoloji' as const, label: 'tech', color: 'var(--accent)' },
  { key: 'gelir' as const, label: 'revenue', color: 'var(--yellow)' },
  { key: 'marka' as const, label: 'brand', color: '#ec4899' },
]

export default function ScoreBars({ skor, animate = true }: ScoreBarsProps) {
  const [widths, setWidths] = useState<Record<string, number>>(
    animate
      ? { pazar: 0, teknoloji: 0, gelir: 0, marka: 0 }
      : { pazar: skor.pazar, teknoloji: skor.teknoloji, gelir: skor.gelir, marka: skor.marka }
  )

  useEffect(() => {
    if (!animate) {
      setWidths({ pazar: skor.pazar, teknoloji: skor.teknoloji, gelir: skor.gelir, marka: skor.marka })
      return
    }
    const timer = setTimeout(() => {
      setWidths({ pazar: skor.pazar, teknoloji: skor.teknoloji, gelir: skor.gelir, marka: skor.marka })
    }, 200)
    return () => clearTimeout(timer)
  }, [skor, animate])

  return (
    <div
      className="rounded-[8px] border overflow-hidden"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.1em] uppercase">
          sub scores
        </span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-[10px]">
        {SUB_SCORES.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[var(--text-3)] w-20 flex-shrink-0">
              {label}
            </span>
            <div
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ background: 'var(--border-2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${widths[key]}%`, background: color }}
              />
            </div>
            <span
              className="font-mono text-[10px] w-7 text-right flex-shrink-0"
              style={{ color }}
            >
              {skor[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
