'use client'

import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'

interface TerminalLine {
  text: string
  type?: 'default' | 'success' | 'error' | 'info' | 'dim'
}

interface TerminalPanelProps {
  lines: string[]
  progress: number
  isGenerating: boolean
  blueprintTitle?: string
}

function classifyLine(text: string): TerminalLine['type'] {
  if (text.startsWith('✓') || text.startsWith('✔')) return 'success'
  if (text.startsWith('✗') || text.startsWith('✘')) return 'error'
  if (text.startsWith('▸') || text.startsWith('→')) return 'info'
  if (text.startsWith('//') || text.startsWith('#')) return 'dim'
  return 'default'
}

export default function TerminalPanel({
  lines,
  progress,
  isGenerating,
  blueprintTitle,
}: TerminalPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const headerLabel = blueprintTitle ? blueprintTitle : 'generating...'

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg)]">

      {/* Terminal Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <div className="w-[5px] h-[5px] rounded-full bg-[var(--yellow)] animate-pulse" />
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
            {headerLabel}
          </span>
        </div>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', color: 'var(--accent)' }}>
          {progress}%
        </span>
      </div>

      {/* Progress Bar — 1px */}
      <div className="h-[1px] bg-[var(--border)] flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--green)] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 font-mono text-[12px] leading-[2] bg-[var(--bg)] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
        {lines.length === 0 ? (
          <div className="text-[var(--text-4)]">
            <span className="text-[var(--text-4)]">$ </span>
            <span className="text-[var(--text-3)]">smd generate --streaming</span>
          </div>
        ) : (
          lines.map((line, i) => {
            const type = classifyLine(line)
            return (
              <div
                key={i}
                className={clsx('whitespace-pre-wrap break-all', {
                  'text-[var(--green)]': type === 'success',
                  'text-[var(--red)]': type === 'error',
                  'text-[var(--accent)]': type === 'info',
                  'text-[var(--text-4)]': type === 'dim',
                  'text-[var(--text-3)]': type === 'default',
                })}
              >
                {line}
              </div>
            )
          })
        )}

        {/* Blinking cursor while generating */}
        {isGenerating && (
          <div className="flex items-center gap-[2px] mt-1">
            <span className="text-[var(--text-4)]">$ </span>
            <span
              className="inline-block w-[6px] h-[13px] bg-[var(--text-3)] ml-[2px] align-middle"
              style={{ animation: 'blink 1.1s step-end infinite' }}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-3 border-t border-[var(--border)] flex-shrink-0 flex items-center gap-3 bg-[var(--bg-2)]">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-3)]">
          <span className={clsx('w-1.5 h-1.5 rounded-full', isGenerating ? 'bg-[var(--yellow)] animate-pulse' : 'bg-[var(--text-4)]')} />
          {isGenerating ? 'claude api connected' : 'idle'}
        </div>
        <div className="ml-auto text-[10px] font-mono text-[var(--text-3)]">
          {lines.length} lines
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
