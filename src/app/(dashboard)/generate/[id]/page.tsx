'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import ScoreRing from '@/components/blueprint/ScoreRing'
import ScoreBars from '@/components/blueprint/ScoreBars'
import SectionAccordion from '@/components/blueprint/SectionAccordion'
import BuildKitPanel from '@/components/blueprint/BuildKitPanel'
import { Skeleton } from '@/components/ui/Skeleton'
import type { BlueprintContent } from '@/types/blueprint'

interface BlueprintDetail {
  id: string
  title: string
  idea_text: string
  industry: string | null
  stage: string | null
  status: string
  score_total: number | null
  tokens_used: number
  model_used: string
  created_at: string
  content: BlueprintContent | null
  build_kit: {
    cursorrules: string | null
    build_md: string | null
    schema_sql: string | null
    env_example: string | null
    readme_md: string | null
  } | null
}

/* ── Loading Skeleton ── */
function BlueprintSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Skeleton width={300} height={24} className="mb-2" />
        <Skeleton width={200} height={12} />
      </div>
      <div className="mb-4">
        <Skeleton className="w-full h-16 rounded-[6px]" />
      </div>
      <div className="mb-4">
        <Skeleton className="w-full h-24 rounded-[6px]" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="mb-3 rounded-[8px] animate-[shimmer_1.5s_infinite]"
          style={{
            height: 60,
            background: 'linear-gradient(90deg, var(--bg-3) 25%, var(--bg-4) 50%, var(--bg-3) 75%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  )
}

/* ── Empty/Error State ── */
function EmptyState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div
        className="w-10 h-10 rounded-[8px] flex items-center justify-center"
        style={{ background: 'var(--red-dim)', color: 'var(--red)' }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" />
        </svg>
      </div>
      <div>
        <p className="text-[13px] font-medium text-[var(--text)] mb-1">Blueprint Not Found</p>
        <p className="text-[12px] text-[var(--text-3)] max-w-[280px] leading-[1.6]">{message}</p>
      </div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-[120ms]"
      >
        Go back
      </button>
    </div>
  )
}

/* ── Skor Badge'i ── */
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? 'var(--green)' : score >= 65 ? 'var(--accent)' : score >= 45 ? 'var(--yellow)' : 'var(--red)'
  const bg = score >= 85 ? 'var(--green-dim)' : score >= 65 ? 'var(--accent-dim)' : score >= 45 ? 'var(--yellow-dim)' : 'var(--red-dim)'
  return (
    <span
      className="font-mono text-[10px] px-2 py-[3px] rounded-[4px]"
      style={{ color, background: bg }}
    >
      {score}<span style={{ color: 'var(--text-4)', fontSize: '9px' }}>/100</span>
    </span>
  )
}

/* ── Meta Chip ── */
function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-[6px] rounded-[6px] border"
      style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}
    >
      <span className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.08em]">{label}</span>
      <span className="text-[11px] text-[var(--text-2)]">{value}</span>
    </div>
  )
}

/* ════════ Main Component ════════ */
export default function BlueprintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [blueprint, setBlueprint] = useState<BlueprintDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlueprint = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/blueprint/${id}`)
      if (res.status === 404) throw new Error('This blueprint does not exist or does not belong to you.')
      if (!res.ok) throw new Error('Could not load blueprint.')
      const data: BlueprintDetail = await res.json()
      setBlueprint(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBlueprint()
  }, [fetchBlueprint])

  const timeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return date
    }
  }

  if (loading) {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/generate"
            className="flex items-center gap-1 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L6 8l4 4" />
            </svg>
            Idea Generator
          </Link>
          <span className="text-[var(--text-4)]">/</span>
          <Skeleton width={200} height={12} />
        </div>
        <BlueprintSkeleton />
      </div>
    )
  }

  if (error || !blueprint) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/generate"
            className="flex items-center gap-1 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L6 8l4 4" />
            </svg>
            Idea Generator
          </Link>
        </div>
        <EmptyState message={error ?? 'Blueprint not found.'} onBack={() => router.push('/generate')} />
      </div>
    )
  }

  const content = blueprint.content

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-5 text-[12px]">
        <Link
          href="/generate"
          className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4L6 8l4 4" />
          </svg>
          Idea Generator
        </Link>
        <span className="text-[var(--text-4)]">/</span>
        <span className="text-[var(--text-2)] truncate max-w-[300px]">{blueprint.title}</span>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1 leading-tight">
            {blueprint.title}
          </h1>
          <p className="text-[13px] text-[var(--text-3)] leading-[1.6] max-w-xl">
            {blueprint.idea_text}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {blueprint.score_total !== null && (
            <ScoreBadge score={blueprint.score_total} />
          )}
          <Link
            href="/generate"
            className="flex items-center gap-[6px] px-[14px] py-[6px] text-[12px] font-medium text-white bg-[var(--accent)] rounded-[6px] border border-[var(--accent)] hover:bg-[#5558e8] transition-all duration-[120ms]"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M3 8h10" />
            </svg>
            New Blueprint
          </Link>
        </div>
      </div>

      {/* ── Meta Bilgiler ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {blueprint.industry && <MetaChip label="industry" value={blueprint.industry} />}
        {blueprint.stage && <MetaChip label="stage" value={blueprint.stage} />}
        <MetaChip label="model" value={blueprint.model_used.includes('opus') ? 'Claude Opus' : 'Claude Sonnet'} />
        <MetaChip label="tokens" value={blueprint.tokens_used.toLocaleString()} />
        <MetaChip label="created" value={timeAgo(blueprint.created_at)} />
        {/* Status badge */}
        <span
          className="font-mono text-[9px] px-2 py-[5px] rounded-[4px] flex items-center gap-1"
          style={{
            color: blueprint.status === 'complete' ? 'var(--green)' : blueprint.status === 'failed' ? 'var(--red)' : 'var(--yellow)',
            background: blueprint.status === 'complete' ? 'var(--green-dim)' : blueprint.status === 'failed' ? 'var(--red-dim)' : 'var(--yellow-dim)',
          }}
        >
          {blueprint.status === 'complete' && (
            <span className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" />
          )}
          {blueprint.status === 'complete' ? 'COMPLETE' : blueprint.status === 'failed' ? 'FAILED' : 'GENERATING'}
        </span>
      </div>

      {/* ── No Content ── */}
      {!content && (
        <div
          className="rounded-[8px] border p-8 text-center"
          style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
        >
          <p className="text-[13px] text-[var(--text-3)]">
            {blueprint.status === 'generating'
              ? 'Blueprint is being generated, please wait...'
              : 'Blueprint content is not available yet.'}
          </p>
          {blueprint.status === 'generating' && (
            <button
              onClick={fetchBlueprint}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] hover:bg-[var(--bg-3)] transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      )}

      {/* ── Skor ── */}
      {content && (
        <div className="flex flex-col gap-4">
          <ScoreRing skor={content.skor} animate={false} />
          <ScoreBars skor={content.skor} animate={false} />

          {/* ── Sections ── */}
          <SectionAccordion
            content={content}
            defaultOpen={['concept', 'market', 'mvp']}
          />

          {/* ── Build Kit ── */}
          {blueprint.build_kit && (
            <BuildKitPanel
              blueprintId={blueprint.id}
              cursorrules={blueprint.build_kit.cursorrules ?? undefined}
              buildMd={blueprint.build_kit.build_md ?? undefined}
              schemaSql={blueprint.build_kit.schema_sql ?? undefined}
              envExample={blueprint.build_kit.env_example ?? undefined}
              readmeMd={blueprint.build_kit.readme_md ?? undefined}
            />
          )}

          {/* ── Alt Butonlar ── */}
          <div className="flex items-center justify-between pt-2 pb-6">
            <Link
              href="/library"
              className="flex items-center gap-[6px] px-[14px] py-[7px] text-[12px] text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-[120ms]"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h12M2 8h8M2 13h10" />
              </svg>
              View in Library
            </Link>
            <Link
              href="/generate"
              className="flex items-center gap-[6px] px-[14px] py-[7px] text-[12px] font-medium text-white bg-[var(--accent)] rounded-[6px] border border-[var(--accent)] hover:bg-[#5558e8] transition-all duration-[120ms]"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8h10" />
              </svg>
              New Blueprint
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
