'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DemoState = 'idle' | 'loading' | 'complete'

interface DemoResult {
  score: number
  verdict: string
  market_insight: string
  risk_insight: string
}

function getLogColor(text: string): string {
  if (text.includes('✓')) return 'var(--term-green)'
  if (text.includes('→')) return 'var(--term-blue)'
  if (text.toLowerCase().includes('error')) return '#f87171'
  return 'var(--term-dim)'
}

export default function DemoSection() {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [state, setState] = useState<DemoState>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<DemoResult | null>(null)
  const termBodyRef = useRef<HTMLDivElement>(null)

  const scrollTerm = useCallback(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollTerm()
  }, [logs, scrollTerm])

  const handleAnalyze = async () => {
    if (!idea.trim()) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    setState('loading')
    setLogs([])
    setResult(null)

    try {
      const res = await fetch('/api/blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_text: idea }),
      })

      if (!res.ok || !res.body) {
        setLogs((p) => [...p, 'Error: Request failed'])
        setState('idle')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw || raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.type === 'log' && parsed.message) {
              setLogs((p) => [...p, parsed.message])
            } else if (parsed.type === 'complete' && parsed.blueprint) {
              const bp = parsed.blueprint
              const content = bp.content ?? bp
              setResult({
                score: content.market_fit_score ?? bp.score ?? 0,
                verdict: content.verdict ?? bp.verdict ?? '',
                market_insight:
                  content.market_fit_analysis?.summary ?? content.market_insight ?? '',
                risk_insight:
                  content.risks?.[0]?.description ?? content.key_risk ?? '',
              })
              setState('complete')
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      if (state === 'loading') setState('idle')
    } catch {
      setLogs((p) => [...p, 'Error: Connection failed'])
      setState('idle')
    }
  }

  return (
    <section
      id="demo"
      style={{
        backgroundColor: 'var(--bg-2)',
        paddingTop: '96px',
        paddingBottom: '96px',
        borderTop: '1px solid var(--surface-line)',
        borderBottom: '1px solid var(--surface-line)',
      }}
    >
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 32px' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <p
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '11px',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            live demo
          </p>
          <h2
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '40px',
              color: 'var(--foreground)',
              fontWeight: 400,
            }}
          >
            What will you build?
          </h2>
          <p
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontSize: '14px',
              color: 'var(--muted)',
              marginTop: '8px',
            }}
          >
            Type an idea. Watch the AI work. Get a real blueprint.
          </p>
        </div>

        {/* Two-panel */}
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--surface-line-strong)',
          }}
        >
          {/* Left — input */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              padding: '24px',
              borderRight: '1px solid var(--surface-line)',
            }}
          >
            <p
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '11px',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px',
              }}
            >
              your idea
            </p>
            <textarea
              rows={6}
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, 500))}
              placeholder="A tool that helps indie hackers track their MRR across multiple products..."
              style={{
                backgroundColor: 'var(--bg-2)',
                border: '1px solid var(--surface-line)',
                borderRadius: '6px',
                width: '100%',
                padding: '12px',
                fontFamily: "'Geist', system-ui, sans-serif",
                fontSize: '14px',
                color: 'var(--foreground)',
                resize: 'none',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid var(--accent)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid var(--land-border-2)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <p
              className="text-right"
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '11px',
                color: 'var(--muted)',
                opacity: 0.6,
                marginTop: '4px',
              }}
            >
              {idea.length} / 500
            </p>
            <button
              onClick={handleAnalyze}
              disabled={state === 'loading'}
              style={{
                marginTop: '16px',
                width: '100%',
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                fontFamily: "'Geist Mono', monospace",
                fontSize: '13px',
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                opacity: state === 'loading' ? 0.7 : 1,
                transition: 'opacity 150ms ease, transform 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (state !== 'loading') {
                  e.currentTarget.style.opacity = '0.8'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                if (state !== 'loading') {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {state === 'loading' ? (
                <>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '1.5px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  analyzing...
                </>
              ) : (
                'analyze →'
              )}
            </button>
            <p
              className="text-center"
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '11px',
                color: 'var(--muted)',
                opacity: 0.6,
                marginTop: '12px',
              }}
            >
              free to try · no credit card
            </p>
          </div>

          {/* Right — terminal output */}
          <div
            style={{
              backgroundColor: 'var(--term-bg)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center justify-between"
              style={{ padding: '12px 16px', borderBottom: '1px solid var(--term-border)' }}
            >
              <div className="flex items-center gap-1.5">
                {['#ff5f56', '#ffbd2e', '#27c93f'].map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
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
                blueprint output
              </span>
            </div>

            {/* Terminal body */}
            <div
              ref={termBodyRef}
              style={{
                flex: 1,
                padding: '16px',
                fontFamily: "'Geist Mono', monospace",
                fontSize: '12px',
                minHeight: '280px',
                overflowY: 'auto',
                lineHeight: '1.7',
              }}
            >
              {state === 'idle' && logs.length === 0 && (
                <span style={{ color: 'var(--term-dim)' }}>
                  $ waiting for input
                  <span className="cursor-blink" style={{ color: 'var(--term-cursor)' }}>▋</span>
                </span>
              )}

              {(state === 'loading' || (state !== 'idle' && logs.length > 0)) &&
                logs.map((line, i) => (
                  <div key={i} style={{ color: getLogColor(line) }}>
                    {line}
                  </div>
                ))}

              {state === 'complete' && result && (
                <>
                  <div style={{ borderTop: '1px solid var(--term-border)', margin: '12px 0' }} />
                  <div style={{ color: 'var(--term-green)' }}>Blueprint complete</div>
                  <div style={{ borderTop: '1px solid var(--term-border)', margin: '8px 0' }} />
                  <div style={{ color: 'var(--term-text)' }}>
                    Score:{' '}
                    <span style={{ color: 'var(--term-green)' }}>{result.score}/100</span>
                  </div>
                  <div style={{ color: 'var(--term-dim)' }}>
                    Verdict:{' '}
                    <span style={{ color: 'var(--term-text)' }}>{result.verdict}</span>
                  </div>
                  <div style={{ height: '8px' }} />
                  <div style={{ color: 'var(--term-accent)' }}>→ market_fit:</div>
                  <div style={{ color: 'var(--term-text)', paddingLeft: '8px' }}>
                    {result.market_insight}
                  </div>
                  <div style={{ color: 'var(--term-accent)' }}>→ key_risk:</div>
                  <div style={{ color: 'var(--term-text)', paddingLeft: '8px' }}>
                    {result.risk_insight}
                  </div>
                  <div style={{ height: '8px' }} />
                  <div style={{ color: 'var(--term-dim)' }}>full blueprint saved to library</div>
                  <div style={{ color: 'var(--term-dim)' }}>
                    ${' '}
                    <span className="cursor-blink" style={{ color: 'var(--term-cursor)' }}>▋</span>
                  </div>
                </>
              )}
            </div>

            {/* Bottom link */}
            {state === 'complete' && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--term-border)' }}>
                <Link
                  href="/library"
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '11px',
                    color: 'var(--term-accent)',
                    transition: 'opacity 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  view in library →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
