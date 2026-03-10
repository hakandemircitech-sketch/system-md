'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { STORY } from '@/lib/content/public'

const TERMINAL_LINES: { text: string; color: string }[] = [
  { text: '$ ', color: 'var(--term-dim)' },
  { text: 'smd init "systemmd-platform"', color: 'var(--term-text)' },
  { text: '', color: '' },
  { text: '  Analyzing market fit...', color: 'var(--term-dim)' },
  { text: '  ✓ Validated (score: 91/100)', color: 'var(--term-green)' },
  { text: '', color: '' },
  { text: '  Generating architecture...', color: 'var(--term-dim)' },
  { text: '  → Next.js 16 + Supabase + Anthropic SDK', color: 'var(--term-blue)' },
  { text: '', color: '' },
  { text: '  Writing .cursorrules...', color: 'var(--term-dim)' },
  { text: '  Writing schema.sql...', color: 'var(--term-dim)' },
  { text: '  Writing BUILD.md...', color: 'var(--term-dim)' },
  { text: '  ✓ Build kit ready', color: 'var(--term-green)' },
  { text: '', color: '' },
  { text: '$ ', color: 'var(--term-dim)' },
  { text: 'smd build --follow-blueprint', color: 'var(--term-text)' },
  { text: '', color: '' },
  { text: '  Building SystemMD with SystemMD...', color: 'var(--term-yellow)' },
  { text: '  ✓ systemmd.com deployed', color: 'var(--term-green)' },
]

function StoryTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [done, setDone] = useState(false)
  const termRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!isInView) return
    let idx = 0
    const interval = setInterval(() => {
      idx++
      setVisibleLines(idx)
      if (termRef.current) {
        termRef.current.scrollTop = termRef.current.scrollHeight
      }
      if (idx >= TERMINAL_LINES.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, 80)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: 'var(--term-bg)',
        borderRadius: '8px',
        border: '1px solid var(--term-border)',
        overflow: 'hidden',
      }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--term-border)', padding: '12px 16px' }}
      >
        <div className="flex items-center gap-1.5">
          {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, i) => (
            <span
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: c,
                display: 'inline-block',
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '11px',
            color: 'var(--term-dim)',
          }}
        >
          {STORY.terminalTitle}
        </span>
      </div>

      {/* Terminal body */}
      <div
        ref={termRef}
        style={{
          padding: '20px',
          fontFamily: "'Geist Mono', monospace",
          fontSize: '13px',
          lineHeight: '1.9',
          maxHeight: '380px',
          overflowY: 'auto',
        }}
      >
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => {
          if (i === 0 && visibleLines > 1) {
            return (
              <div key={i} style={{ display: 'flex' }}>
                <span style={{ color: 'var(--term-dim)' }}>$ </span>
                <span style={{ color: 'var(--term-text)' }}>{TERMINAL_LINES[1].text}</span>
              </div>
            )
          }
          if (i === 1) return null
          if (i === 14 && visibleLines > 15) {
            return (
              <div key={i} style={{ display: 'flex' }}>
                <span style={{ color: 'var(--term-dim)' }}>$ </span>
                <span style={{ color: 'var(--term-text)' }}>{TERMINAL_LINES[15].text}</span>
              </div>
            )
          }
          if (i === 15) return null
          if (line.text === '') return <div key={i} style={{ height: '4px' }} />
          return (
            <div key={i} style={{ color: line.color }}>
              {line.text}
            </div>
          )
        })}
        {done && (
          <div style={{ display: 'flex' }}>
            <span style={{ color: 'var(--term-dim)' }}>$ </span>
            <span className="cursor-blink" style={{ color: 'var(--term-cursor)' }}>▋</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StorySection() {
  const titleLines = STORY.title.split('\n')

  return (
    <section
      style={{
        backgroundColor: 'var(--background)',
        paddingTop: '96px',
        paddingBottom: '96px',
      }}
    >
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 32px' }}>
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-16">
          {/* Left column */}
          <div className="md:sticky md:top-24 md:self-start">
            <p
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '11px',
                color: 'var(--accent)',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {STORY.eyebrow}
            </p>
            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '32px',
                color: 'var(--foreground)',
                lineHeight: '1.2',
                letterSpacing: '-0.02em',
                marginBottom: '24px',
                fontWeight: 400,
              }}
            >
              {titleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h2>
            <div
              style={{
                fontFamily: "'Geist', system-ui, sans-serif",
                fontSize: '14px',
                color: 'var(--muted)',
                lineHeight: '1.75',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {STORY.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* Right column — terminal */}
          <StoryTerminal />
        </div>
      </div>
    </section>
  )
}
