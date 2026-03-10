'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InputPanel, { type GenerateFormData } from '@/components/blueprint/InputPanel'
import TerminalPanel from '@/components/blueprint/TerminalPanel'
import SectionAccordion from '@/components/blueprint/SectionAccordion'
import BuildKitPanel from '@/components/blueprint/BuildKitPanel'
import { useBlueprintStore } from '@/stores/blueprintStore'
import type { BlueprintContent, SseEvent } from '@/types/blueprint'

// Blueprint API response type
interface BlueprintApiResult {
  id: string
  title: string
  content: BlueprintContent | null
  build_kit: {
    cursorrules: string | null
    build_md: string | null
    schema_sql: string | null
    env_example: string | null
    readme_md: string | null
  } | null
}

type Phase = 'idle' | 'generating' | 'complete'

/* ── Idle state ── */
function IdleState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 py-16">
      {/* Terminal preview */}
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '11px',
          lineHeight: '2',
          color: 'var(--text-4)',
          backgroundColor: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px',
          width: '100%',
          maxWidth: '380px',
          marginBottom: '24px',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-4)' }}>$ </span>
          <span style={{ color: 'var(--text-3)' }}>smd generate --streaming</span>
        </div>
        <div style={{ color: 'var(--text-4)' }}>{'  // waiting for input...'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--text-4)' }}>$ </span>
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '12px',
              backgroundColor: 'var(--text-3)',
              animation: 'blink 1.1s step-end infinite',
            }}
          />
        </div>
      </div>

      <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', marginBottom: '4px' }}>
        Ready to generate
      </p>
      <p style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.6', maxWidth: '280px', textAlign: 'center' }}>
        Enter your startup idea on the left and hit generate.
      </p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ── Hata durumu ── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-10 py-16 gap-4">
      <div
        className="w-10 h-10 rounded-[8px] flex items-center justify-center"
        style={{ background: 'var(--red-dim)', color: 'var(--red)' }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" />
        </svg>
      </div>
      <div>
        <p className="text-[13px] font-medium text-[var(--text)] mb-1">generation failed</p>
        <p className="text-[12px] text-[var(--text-3)] leading-[1.6] max-w-[320px]">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-[var(--text-2)] border border-[var(--border-2)] rounded-[8px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-[140ms]"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8a6 6 0 1112 0" /><path d="M14 4v4h-4" />
        </svg>
        try again
      </button>
    </div>
  )
}

/* ── Result loading skeleton ── */
function ResultSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-[8px] animate-[shimmer_1.5s_infinite]"
          style={{
            background: 'linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  )
}

/* ── Result view ── */
function ResultView({
  result,
  onRegenerateClick,
  onSaveToLibrary,
}: {
  result: BlueprintApiResult
  onRegenerateClick: () => void
  onSaveToLibrary: () => void
}) {
  const content = result.content
  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-3)] text-[13px]">
        Blueprint content not found.
      </div>
    )
  }

  const scoreColor = content.skor.toplam >= 85 ? '#22c55e' : content.skor.toplam >= 65 ? '#6366f1' : content.skor.toplam >= 45 ? '#eab308' : '#ef4444'
  const scoreLabel = ({ 'ZAYIF': 'WEAK', 'ORTA': 'FAIR', 'GÜÇLÜ': 'STRONG', 'İSTİSNAİ': 'EXCEPTIONAL' } as Record<string, string>)[content.skor.etiket] ?? content.skor.etiket

  const SUB_SCORES = [
    { key: 'pazar' as const, label: 'Market', color: '#22c55e' },
    { key: 'teknoloji' as const, label: 'Tech', color: '#6366f1' },
    { key: 'gelir' as const, label: 'Revenue', color: '#eab308' },
    { key: 'marka' as const, label: 'Brand', color: '#ec4899' },
  ]

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* ── Left sidebar: score + actions ── */}
      <div style={{
        width: 200,
        minWidth: 200,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        background: 'var(--bg-2)',
        flexShrink: 0,
      }}>
        {/* Score hero */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 10 }}>
            Blueprint Score
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 700, lineHeight: 1, color: scoreColor, letterSpacing: '-0.04em' }}>
              {content.skor.toplam}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-4)' }}>/100</span>
          </div>
          <div style={{ height: 4, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${content.skor.toplam}%`, background: scoreColor, borderRadius: 99 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 5, background: scoreColor + '18', color: scoreColor }}>
            {scoreLabel}
          </span>
        </div>

        {/* Sub scores */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 12 }}>
            Sub Scores
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SUB_SCORES.map(({ key, label, color }) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color }}>{content.skor[key]}</span>
                </div>
                <div style={{ height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${content.skor[key]}%`, background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blueprint title */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Project</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{result.title}</span>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Link
            href={`/generate/${result.id}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 7, textDecoration: 'none', transition: 'all 120ms', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9M10 2h4v4M6 10l8-8" />
            </svg>
            Full page
          </Link>
          <button
            onClick={onRegenerateClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', transition: 'all 120ms', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 8a6 6 0 1112 0" /><path d="M14 4v4h-4" />
            </svg>
            Regenerate
          </button>
          <button
            onClick={onSaveToLibrary}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'white', background: 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer', transition: 'all 120ms', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 2h8l3 3v9H2V2zM6 2v5h5" />
            </svg>
            Save to Library
          </button>
        </div>
      </div>

      {/* ── Right: accordion sections + build kit ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--bg)',
      }}
        className="[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <SectionAccordion content={content} defaultOpen={['concept']} />
        {result.build_kit && (
          <BuildKitPanel
            blueprintId={result.id}
            cursorrules={result.build_kit.cursorrules ?? undefined}
            buildMd={result.build_kit.build_md ?? undefined}
            schemaSql={result.build_kit.schema_sql ?? undefined}
            envExample={result.build_kit.env_example ?? undefined}
            readmeMd={result.build_kit.readme_md ?? undefined}
          />
        )}
        {/* Bottom padding */}
        <div style={{ height: 20 }} />
      </div>

    </div>
  )
}

/* ════════ Main Component ════════ */
export default function GeneratePage() {
  const router = useRouter()
  const {
    isGenerating,
    generationProgress,
    generationLog,
    lastTokensUsed,
    error,
    handleSseEvent,
    resetGeneration,
    setError,
  } = useBlueprintStore()

  const [phase, setPhase] = useState<Phase>('idle')
  const [blueprintResult, setBlueprintResult] = useState<BlueprintApiResult | null>(null)
  const [loadingResult, setLoadingResult] = useState(false)
  const [blueprintTitle, setBlueprintTitle] = useState<string>()
  const abortRef = useRef<AbortController | null>(null)

  // Usage state
  const [usage, setUsage] = useState<{ plan: string; used: number; limit: number; remaining: number; isAtLimit: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(data => { if (!data.error) setUsage(data) })
      .catch(() => {})
  }, [phase]) // refetch after each generation

  // Reset on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const fetchBlueprintResult = useCallback(async (id: string) => {
    setLoadingResult(true)
    try {
      const res = await fetch(`/api/blueprint/${id}`)
      if (!res.ok) throw new Error('Could not load blueprint.')
      const data: BlueprintApiResult = await res.json()
      setBlueprintResult(data)
      setPhase('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load blueprint.')
      setPhase('idle')
    } finally {
      setLoadingResult(false)
    }
  }, [setError])

  const handleGenerate = useCallback(async (formData: GenerateFormData) => {
    // Abort any ongoing request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    resetGeneration()
    setPhase('generating')
    setBlueprintTitle(formData.idea_text)
    setBlueprintResult(null)

    try {
      const res = await fetch('/api/blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea_text: formData.idea_text,
          industry: formData.industry || undefined,
          stage: formData.stage,
          target_users: formData.description || undefined,
          model: formData.model,
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error('Could not reach server.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let completedBlueprintId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event: SseEvent = JSON.parse(jsonStr)
            handleSseEvent(event)

            if (event.type === 'complete' && event.blueprint_id) {
              completedBlueprintId = event.blueprint_id
            }

            if (event.type === 'error') {
              setPhase('idle')
              return
            }
          } catch {
            // JSON parse error — continue
          }
        }
      }

      if (completedBlueprintId) {
        await fetchBlueprintResult(completedBlueprintId)
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const rawMsg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      // Ortam değişkeni eksikse daha anlaşılır mesaj göster
      const msg = rawMsg.includes('ANTHROPIC_API_KEY')
        ? 'AI service is not configured. Please add ANTHROPIC_API_KEY to your environment variables.'
        : rawMsg
      setError(msg)
      setPhase('idle')
    }
  }, [handleSseEvent, resetGeneration, setError, fetchBlueprintResult])

  const handleRetry = () => {
    resetGeneration()
    setPhase('idle')
    setBlueprintResult(null)
  }

  const handleSaveToLibrary = () => {
    if (blueprintResult) {
      router.push('/library')
    }
  }

  // Token usage: proportional to progress during generation, real value when complete
  const FREE_PLAN_LIMIT = 100_000
  const tokenUsagePercent = phase === 'complete' && lastTokensUsed > 0
    ? Math.min((lastTokensUsed / FREE_PLAN_LIMIT) * 100, 100)
    : Math.min(generationProgress * 0.5, 50) // max 50% during generation
  const tokenUsageLabel = phase === 'complete' && lastTokensUsed > 0
    ? `${lastTokensUsed.toLocaleString()} tokens`
    : phase === 'generating' ? 'generating...' : `${Math.round(tokenUsagePercent)}% / 100k`

  return (
    /* Full-bleed IDE layout — layout padding'ini iptal et */
    <div
      className="flex flex-col overflow-hidden"
      style={{ margin: '-32px -40px', height: 'calc(100vh - 52px)' }}
    >
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 28px 16px',
        flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-2)',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--text)',
          }}>
            Idea Generator
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>
            Describe your startup idea — AI builds a complete blueprint.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {usage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 12px',
              borderRadius: 99,
              border: `1px solid ${usage.isAtLimit ? 'var(--red)' : 'var(--border)'}`,
              background: 'var(--bg-3)',
              fontFamily: 'var(--font-mono)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: usage.isAtLimit ? 'var(--red)' : usage.remaining <= 3 ? 'var(--yellow)' : 'var(--green)',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {usage.plan}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: usage.isAtLimit ? 'var(--red)' : usage.remaining <= 3 ? 'var(--yellow)' : 'var(--text)' }}>
                {usage.remaining}/{usage.limit}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>left</span>
            </div>
          )}
          {blueprintResult && (
            <Link
              href="/library"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                fontSize: 12, fontWeight: 500,
                color: 'var(--text-2)',
                border: '1px solid var(--border-2)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 120ms',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h12M2 8h8M2 13h10" />
              </svg>
              View Library
            </Link>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div
        className="flex flex-1 overflow-hidden min-h-0"
        style={{ borderTop: 'none' }}
      >
        {/* ── Left panel: input ── */}
        <InputPanel
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          tokenUsagePercent={tokenUsagePercent}
          tokenUsageLabel={tokenUsageLabel}
          onClear={handleRetry}
        />

        {/* ── Right panel: output ── */}
        <div
          className="flex flex-col flex-1 overflow-hidden min-w-0 relative"
          style={{ background: 'var(--bg)' }}
        >
          {/* Hata durumu */}
          {error && phase === 'idle' && (
            <>
              <div
                className="px-6 py-4 border-b flex items-center gap-[7px] flex-shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--red)' }} />
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>error</span>
              </div>
              <ErrorState message={error} onRetry={handleRetry} />
            </>
          )}

          {/* Idle state */}
          {!error && phase === 'idle' && (
            <>
              <div
                className="px-6 py-4 border-b flex items-center gap-[7px] flex-shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--text-4)' }} />
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>output</span>
              </div>
              <IdleState />
            </>
          )}

          {/* Generation terminal */}
          {phase === 'generating' && (
            <TerminalPanel
              lines={generationLog}
              progress={generationProgress}
              isGenerating={isGenerating}
              blueprintTitle={blueprintTitle}
            />
          )}

          {/* Loading result */}
          {loadingResult && (
            <>
              <div
                className="px-6 py-4 border-b flex items-center gap-[7px] flex-shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-[5px] h-[5px] rounded-full bg-[var(--yellow)] animate-pulse" />
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>loading blueprint...</span>
              </div>
              <ResultSkeleton />
            </>
          )}

          {/* Complete — result */}
          {phase === 'complete' && blueprintResult && !loadingResult && (
            <ResultView
              result={blueprintResult}
              onRegenerateClick={handleRetry}
              onSaveToLibrary={handleSaveToLibrary}
            />
          )}
        </div>
      </div>
    </div>
  )
}
