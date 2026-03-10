'use client'

import { useEffect, useState } from 'react'
import type { BlueprintSkor } from '@/types/blueprint'

interface ScoreRingProps {
  skor: BlueprintSkor
  animate?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'var(--green)'
  if (score >= 65) return 'var(--accent)'
  if (score >= 45) return 'var(--yellow)'
  return 'var(--red)'
}

function getScoreBgColor(score: number): string {
  if (score >= 85) return 'var(--green-dim)'
  if (score >= 65) return 'var(--accent-dim)'
  if (score >= 45) return 'var(--yellow-dim)'
  return 'var(--red-dim)'
}

function getScoreBorderColor(score: number): string {
  if (score >= 85) return 'rgba(34,197,94,0.2)'
  if (score >= 65) return 'var(--accent-border)'
  if (score >= 45) return 'rgba(234,179,8,0.2)'
  return 'rgba(239,68,68,0.2)'
}

const SCORE_LABELS: Record<string, string> = {
  ZAYIF: 'WEAK',
  ORTA: 'FAIR',
  'GÜÇLÜ': 'STRONG',
  'İSTİSNAİ': 'EXCEPTIONAL',
}

export default function ScoreRing({ skor, animate = true }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : skor.toplam)

  useEffect(() => {
    if (!animate) {
      setDisplayScore(skor.toplam)
      return
    }
    let current = 0
    const target = skor.toplam
    const step = Math.ceil(target / 40)
    const interval = setInterval(() => {
      current = Math.min(current + step, target)
      setDisplayScore(current)
      if (current >= target) clearInterval(interval)
    }, 25)
    return () => clearInterval(interval)
  }, [skor.toplam, animate])

  const color = getScoreColor(skor.toplam)
  const bgColor = getScoreBgColor(skor.toplam)
  const borderColor = getScoreBorderColor(skor.toplam)
  const label = SCORE_LABELS[skor.etiket] ?? skor.etiket

  return (
    <div
      className="flex items-center gap-3 px-[14px] py-3 rounded-[6px] border"
      style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}
    >
      <div>
        <div
          className="text-[32px] font-semibold leading-none tracking-[-0.04em] tabular-nums"
          style={{ color: 'var(--text)' }}
        >
          {displayScore}
        </div>
        <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
          BLUEPRINT SCORE
        </div>
      </div>

      {/* Progress track */}
      <div
        className="flex-1 h-1 rounded-full overflow-hidden ml-2"
        style={{ background: 'var(--border-2)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${displayScore}%`,
            background: `linear-gradient(90deg, var(--accent), ${color})`,
          }}
        />
      </div>

      {/* Score label badge */}
      <div
        className="font-mono text-[9px] font-medium rounded-[4px] px-2 py-[3px] flex-shrink-0"
        style={{ color, background: bgColor, border: `1px solid ${borderColor}` }}
      >
        {label}
      </div>
    </div>
  )
}
