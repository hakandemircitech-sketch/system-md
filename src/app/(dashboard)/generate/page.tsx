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
    <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '40px 24px' }}>
      {/* Terminal preview */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        lineHeight: 2,
        color: 'var(--text-4)',
        backgroundColor: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 20px',
        width: '100%',
        maxWidth: 400,
        marginBottom: 20,
      }}>
        <div><span style={{ color: 'var(--text-4)' }}>$ </span><span style={{ color: 'var(--text-3)' }}>smd generate --streaming</span></div>
        <div style={{ color: 'var(--text-4)' }}>{'  // waiting for input...'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--text-4)' }}>$ </span>
          <span style={{ display: 'inline-block', width: 6, height: 12, backgroundColor: 'var(--text-3)', animation: 'blink 1.1s step-end infinite' }} />
        </div>
      </div>

      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6, textAlign: 'center' }}>
        Ready to generate
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.65, maxWidth: 320, textAlign: 'center' }}>
        Type your startup idea above and hit <strong style={{ color: 'var(--text-2)' }}>Generate</strong> — AI will build a complete blueprint in under 60 seconds.
      </p>

      {/* Feature chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20, justifyContent: 'center', maxWidth: 400 }}>
        {['Architecture', 'DB Schema', 'API Design', 'Revenue Model', 'Build Kit', 'AI Feedback'].map(label => (
          <span key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border-2)', color: 'var(--text-4)', background: 'var(--bg-3)' }}>
            {label}
          </span>
        ))}
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* ── Score bar ── */}
      <div style={{
        flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '10px 24px',
      }}>
        {/* Project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {result.title}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', flexShrink: 0 }} />

        {/* Score number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {content.skor.toplam}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ width: 100, height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${content.skor.toplam}%`, background: scoreColor, borderRadius: 99 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: scoreColor }}>
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', flexShrink: 0 }} />

        {/* Sub scores inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          {SUB_SCORES.map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</span>
              <div style={{ width: 48, height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${content.skor[key]}%`, background: color, borderRadius: 99 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color, minWidth: 20 }}>{content.skor[key]}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>
          <Link
            href={`/generate/${result.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 7, textDecoration: 'none', transition: 'all 120ms', background: 'transparent', whiteSpace: 'nowrap' }}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', transition: 'all 120ms', background: 'transparent', whiteSpace: 'nowrap' }}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', fontSize: 11, fontWeight: 600, color: 'white', background: 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer', transition: 'all 120ms', boxShadow: '0 2px 8px rgba(99,102,241,0.25)', whiteSpace: 'nowrap' }}
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

      {/* ── Content: two column accordion + build kit ── */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'var(--bg)' }}
        className="[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 1200, margin: '0 auto' }}>
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionAccordion content={content} defaultOpen={['concept']} />
          </div>
          {/* Right col: build kit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          </div>
        </div>
        <div style={{ height: 32 }} />
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

      {/* Top: input bar */}
      <InputPanel
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        tokenUsagePercent={tokenUsagePercent}
        tokenUsageLabel={tokenUsageLabel}
        onClear={handleRetry}
      />

      {/* Bottom: output — flex-1, full width */}
      <div
        className="flex flex-col flex-1 overflow-hidden min-h-0 relative"
        style={{ background: 'var(--bg)' }}
      >
        {/* Error */}
        {error && phase === 'idle' && (
          <>
            <div className="px-6 py-4 border-b flex items-center gap-[7px] flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--red)' }} />
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>error</span>
            </div>
            <ErrorState message={error} onRetry={handleRetry} />
          </>
        )}

        {/* Idle */}
        {!error && phase === 'idle' && <IdleState />}

        {/* Generating */}
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
            <div className="px-6 py-4 border-b flex items-center gap-[7px] flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="w-[5px] h-[5px] rounded-full bg-[var(--yellow)] animate-pulse" />
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>loading blueprint...</span>
            </div>
            <ResultSkeleton />
          </>
        )}

        {/* Complete */}
        {phase === 'complete' && blueprintResult && !loadingResult && (
          <ResultView
            result={blueprintResult}
            onRegenerateClick={handleRetry}
            onSaveToLibrary={handleSaveToLibrary}
          />
        )}
      </div>
    </div>
  )
}
