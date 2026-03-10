'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Blueprint } from '@/types/blueprint'
import type { BlueprintContent } from '@/types/blueprint'
import { useBlueprints, useDeleteBlueprint } from '@/hooks/useBlueprint'
import { ErrorState } from '@/components/ui/ErrorState'
// ─── Tipler ──────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list'
type IndustryFilter = 'all' | 'saas' | 'fintech' | 'healthtech' | 'edtech' | 'ai' | 'other'
type SortMode = 'newest' | 'score' | 'name'

interface BlueprintWithContent extends Blueprint {
  blueprint_sections?: Array<{ section_type: string; content: BlueprintContent }>
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: IndustryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'saas', label: 'SaaS' },
  { key: 'fintech', label: 'FinTech' },
  { key: 'healthtech', label: 'HealthTech' },
  { key: 'edtech', label: 'EdTech' },
  { key: 'ai', label: 'AI Tools' },
  { key: 'other', label: 'Other' },
]

const INDUSTRY_MAP: Record<string, IndustryFilter> = {
  saas: 'saas',
  fintech: 'fintech',
  'financial technology': 'fintech',
  healthtech: 'healthtech',
  healthcare: 'healthtech',
  edtech: 'edtech',
  education: 'edtech',
  'ai tools': 'ai',
  'artificial intelligence': 'ai',
  ai: 'ai',
}

type CategoryStyle = {
  badge: string
  bar: string
  label: string
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  saas: {
    badge: 'bg-[var(--accent-dim)] text-[var(--accent)]',
    bar: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
    label: 'SaaS',
  },
  fintech: {
    badge: 'bg-[var(--yellow-dim)] text-[var(--yellow)]',
    bar: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    label: 'FinTech',
  },
  healthtech: {
    badge: 'bg-[var(--blue-dim)] text-[var(--blue)]',
    bar: 'linear-gradient(90deg,#3b82f6,#06b6d4)',
    label: 'HealthTech',
  },
  edtech: {
    badge: 'bg-[var(--green-dim)] text-[var(--green)]',
    bar: 'linear-gradient(90deg,#22c55e,#10b981)',
    label: 'EdTech',
  },
  ai: {
    badge: 'bg-[var(--purple-dim)] text-[var(--purple)]',
    bar: 'linear-gradient(90deg,#8b5cf6,#ec4899)',
    label: 'AI Tools',
  },
  other: {
    badge: 'bg-[var(--bg-4)] text-[var(--text-3)]',
    bar: 'linear-gradient(90deg,#14b8a6,#3b82f6)',
    label: 'Other',
  },
}

function getCategoryStyle(industry: string | null): CategoryStyle {
  if (!industry) return CATEGORY_STYLES.other
  const key = INDUSTRY_MAP[industry.toLowerCase()] ?? 'other'
  return CATEGORY_STYLES[key]
}

function getIndustryFilter(industry: string | null): IndustryFilter {
  if (!industry) return 'other'
  return INDUSTRY_MAP[industry.toLowerCase()] ?? 'other'
}

function getScoreClass(score: number | null): string {
  if (!score) return 'bg-[var(--bg-4)] text-[var(--text-3)] border border-[var(--border-2)]'
  if (score >= 90) return 'bg-[var(--green-dim)] text-[var(--green)] border border-[rgba(34,197,94,0.2)]'
  if (score >= 75) return 'bg-[var(--yellow-dim)] text-[var(--yellow)] border border-[rgba(234,179,8,0.2)]'
  return 'bg-[var(--red-dim)] text-[var(--red)] border border-[rgba(239,68,68,0.2)]'
}

function getScoreLabel(score: number | null): string {
  if (!score) return 'N/A'
  if (score >= 90) return 'EXCEPTIONAL'
  if (score >= 75) return 'STRONG'
  return 'FAIR'
}

function getScoreLabelStyle(score: number | null): string {
  if (!score) return 'bg-[var(--bg-4)] text-[var(--text-3)] border border-[var(--border-2)]'
  if (score >= 90) return 'bg-[var(--green-dim)] text-[var(--green)] border border-[rgba(34,197,94,0.2)]'
  if (score >= 75) return 'bg-[var(--yellow-dim)] text-[var(--yellow)] border border-[rgba(234,179,8,0.2)]'
  return 'bg-[var(--red-dim)] text-[var(--red)] border border-[rgba(239,68,68,0.2)]'
}

type StatusStyle = { badge: string; dot: string; label: string }

function getStatusStyle(status: Blueprint['status']): StatusStyle {
  switch (status) {
    case 'complete':
      return { badge: 'bg-[var(--green-dim)] text-[var(--green)]', dot: 'bg-[var(--green)]', label: 'Ready' }
    case 'generating':
      return { badge: 'bg-[var(--yellow-dim)] text-[var(--yellow)]', dot: 'bg-[var(--yellow)] animate-pulse', label: 'Building' }
    case 'failed':
      return { badge: 'bg-[var(--red-dim)] text-[var(--red)]', dot: 'bg-[var(--red)]', label: 'Failed' }
  }
}

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: false })
  } catch {
    return '—'
  }
}

// ─── Skeleton / Error / Empty export componentleri ────────────────────────────

export function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function LibraryError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      message="Could not load blueprints. Server error or network issue."
      onRetry={onRetry}
      variant="full"
    />
  )
}

export function LibraryEmpty({ hasSearch }: { hasSearch: boolean }) {
  return <EmptyStateWrapper hasSearch={hasSearch} />
}

async function fetchBlueprintSections(blueprintId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('blueprint_sections')
    .select('section_type, content')
    .eq('blueprint_id', blueprintId)
    .order('order_index')
  return data ?? []
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden">
      <div className="h-[3px] w-full bg-[var(--border-2)] animate-pulse" />
      <div className="p-[18px] space-y-3">
        <div className="flex justify-between items-start">
          <div className="h-5 w-16 bg-[var(--border-2)] rounded animate-pulse" />
          <div className="w-6 h-6 bg-[var(--border-2)] rounded animate-pulse" />
        </div>
        <div className="h-4 w-3/4 bg-[var(--border-2)] rounded animate-pulse" />
        <div className="h-3 w-full bg-[var(--border-2)] rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-[var(--border-2)] rounded animate-pulse" />
        <div className="pt-3 border-t border-[var(--border)] flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[var(--border-2)] animate-pulse" />
          <div className="h-4 w-12 bg-[var(--border-2)] rounded-full animate-pulse" />
          <div className="ml-auto h-3 w-12 bg-[var(--border-2)] rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyStateWrapper({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-3)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--text-3)' }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" />
          </svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>No results found</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 260, lineHeight: 1.65 }}>
          No blueprints match your search criteria. Try adjusting your filters.
        </p>
      </div>
    )
  }
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
      {/* Decorative grid of placeholder cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 88px)', gap: 8, marginBottom: 28, opacity: 0.4 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 60, borderRadius: 8, background: 'var(--bg-3)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: ['#6366f1','#22c55e','#eab308','#ec4899','#3b82f6','#14b8a6'][i] }} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.2, marginBottom: 8 }}>
          Your library is empty
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 300, lineHeight: 1.7, margin: '0 auto' }}>
          Generate your first blueprint — AI will build architecture, DB schema, and a full build kit in under 60 seconds.
        </p>
      </div>
      <Link
        href="/generate"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--accent)', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none', boxShadow: '0 2px 12px rgba(99,102,241,0.3)', marginTop: 4, transition: 'all 150ms' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(99,102,241,0.3)' }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3v10M3 8h10" />
        </svg>
        Generate First Blueprint
      </Link>
    </div>
  )
}

// ─── Blueprint Card ───────────────────────────────────────────────────────────

interface BlueprintCardProps {
  blueprint: Blueprint
  index: number
  viewMode: ViewMode
  onOpen: (bp: Blueprint) => void
  onDelete: (id: string) => void
}

function BlueprintCard({ blueprint, index, viewMode, onOpen, onDelete }: BlueprintCardProps) {
  const cat = getCategoryStyle(blueprint.industry)
  const status = getStatusStyle(blueprint.status)
  const scoreClass = getScoreClass(blueprint.score_total)

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        onClick={() => onOpen(blueprint)}
        className="group bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden cursor-pointer hover:border-[var(--border-2)] transition-all duration-150 flex items-center gap-4 px-5 py-4"
      >
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: cat.bar }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center font-mono text-[10px] px-2 py-[3px] rounded-[4px] ${cat.badge}`}>
              {cat.label}
            </span>
            <span className={`inline-flex items-center gap-[5px] font-mono text-[10px] px-2 py-[2px] rounded-full ${status.badge}`}>
              <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="text-[14px] font-semibold text-[var(--text)] truncate">{blueprint.title}</div>
          <div className="text-[12px] text-[var(--text-3)] truncate mt-0.5">{blueprint.idea_text}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${scoreClass}`}>
            {blueprint.score_total ?? '—'}
          </div>
          <span className="font-mono text-[10px] text-[var(--text-4)]">{formatDate(blueprint.created_at)}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/generate/${blueprint.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-[5px] px-3 py-[5px] bg-[var(--accent)] text-white rounded-[6px] text-[11px] font-mono hover:bg-[#5558e8] transition-colors"
          >
            open →
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(blueprint.id) }}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[var(--text-3)] hover:bg-[var(--red-dim)] hover:text-[var(--red)] transition-colors"
            title="Delete"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" />
            </svg>
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      onClick={() => onOpen(blueprint)}
      className="group bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden cursor-pointer hover:border-[var(--border-2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-150 flex flex-col"
    >
      {/* Color bar */}
      <div className="h-[3px] w-full flex-shrink-0" style={{ background: cat.bar }} />

      <div className="p-[18px] pb-[14px] flex-1 flex flex-col">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center font-mono text-[10px] px-2 py-[3px] rounded-[4px] ${cat.badge}`}>
            {cat.label}
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-6 h-6 flex items-center justify-center rounded-[4px] border border-transparent text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:border-[var(--border)] hover:text-[var(--text-2)] transition-all flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="3" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="8" cy="13" r="1" />
            </svg>
          </button>
        </div>

        <div className="text-[15px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1.5 leading-[1.3]">
          {blueprint.title}
        </div>
        <div className="text-[12px] text-[var(--text-3)] leading-[1.6] flex-1 mb-4 line-clamp-2">
          {blueprint.idea_text}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2.5 pt-3.5 border-t border-[var(--border)]">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-medium flex-shrink-0 ${scoreClass}`}>
            {blueprint.score_total ?? '—'}
          </div>
          <span className={`inline-flex items-center gap-[5px] font-mono text-[10px] px-2 py-[2px] rounded-full ${status.badge}`}>
            <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${status.dot}`} />
            {status.label}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-4)] ml-auto">
            {formatDate(blueprint.created_at)}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex gap-1.5 px-[18px] py-3 border-t border-[var(--border)] bg-[var(--bg-3)] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Link
          href={`/generate/${blueprint.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-[5px] py-[6px] px-2 bg-[var(--accent)] text-white rounded-[6px] text-[11px] font-mono hover:bg-[#5558e8] transition-colors"
        >
          open →
        </Link>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center gap-[5px] py-[6px] px-2 bg-[var(--bg-4)] text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] font-mono hover:bg-[var(--bg-2)] hover:text-[var(--text)] transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
          </svg>
          Download
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(blueprint.id) }}
          className="flex items-center justify-center py-[6px] px-[6px] bg-transparent text-[var(--text-3)] border border-transparent rounded-[6px] text-[11px] hover:bg-[var(--red-dim)] hover:text-[var(--red)] hover:border-[rgba(239,68,68,0.2)] transition-colors"
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  blueprint: Blueprint | null
  isOpen: boolean
  onClose: () => void
}

function DetailPanel({ blueprint, isOpen, onClose }: DetailPanelProps) {
  const router = useRouter()

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['blueprint-sections', blueprint?.id],
    queryFn: () => fetchBlueprintSections(blueprint!.id),
    enabled: !!blueprint?.id && isOpen,
  })

  const getSectionContent = useCallback((type: string) => {
    return sections?.find((s) => s.section_type === type)?.content ?? null
  }, [sections])

  const problem = getSectionContent('problem') as BlueprintContent['problem'] | null
  const degerOnerisi = getSectionContent('value_proposition') as BlueprintContent['deger_onerisi'] | null
  const techStack = getSectionContent('tech_stack') as BlueprintContent['tech_stack'] | null
  const gelirModeli = getSectionContent('revenue_model') as BlueprintContent['gelir_modeli'] | null

  const cat = blueprint ? getCategoryStyle(blueprint.industry) : CATEGORY_STYLES.other
  const scoreClass = blueprint ? getScoreClass(blueprint.score_total) : ''
  const scoreLabel = blueprint ? getScoreLabel(blueprint.score_total) : ''
  const scoreLabelStyle = blueprint ? getScoreLabelStyle(blueprint.score_total) : ''
  const statusStyle = blueprint ? getStatusStyle(blueprint.status) : null

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const techStackItems = useMemo(() => {
    if (!techStack) return []
    return [
      techStack.frontend,
      techStack.veritabani,
      techStack.ai,
      techStack.odeme,
      techStack.hosting,
    ].filter(Boolean) as string[]
  }, [techStack])

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && blueprint && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 right-0 bottom-0 w-[480px] bg-[var(--bg-2)] border-l border-[var(--border)] z-[51] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[var(--border)] flex-shrink-0 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1.5">
                  {blueprint.title}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center font-mono text-[10px] px-2 py-[3px] rounded-[4px] ${cat.badge}`}>
                    {cat.label}
                  </span>
                  {statusStyle && (
                    <span className={`inline-flex items-center gap-[5px] font-mono text-[10px] px-2 py-[2px] rounded-full ${statusStyle.badge}`}>
                      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-[var(--text-3)]">
                    {formatDate(blueprint.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--text-3)] border border-[var(--border)] bg-[var(--bg-3)] hover:text-[var(--text)] hover:bg-[var(--bg-4)] transition-all flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Score bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-3)] flex-shrink-0">
              <div>
                <div className="text-[32px] font-semibold tracking-[-0.04em] text-[var(--text)] leading-none">
                  {blueprint.score_total ?? '—'}
                </div>
                <div className="font-mono text-[9px] text-[var(--text-3)] mt-0.5 tracking-widest uppercase">
                  Blueprint Score
                </div>
              </div>
              <div className="flex-1 h-1 bg-[var(--border-2)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${blueprint.score_total ?? 0}%`,
                    background: 'linear-gradient(90deg, var(--accent), var(--green))',
                  }}
                />
              </div>
              <div className={`font-mono text-[10px] px-[10px] py-[3px] rounded-[4px] ${scoreLabelStyle}`}>
                {scoreLabel}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
              {sectionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-20 bg-[var(--border-2)] rounded animate-pulse" />
                      <div className="h-4 w-full bg-[var(--border-2)] rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-[var(--border-2)] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Concept */}
                  <div>
                    <SectionTitle>Concept</SectionTitle>
                    <KVRow label="Tagline" value={degerOnerisi?.tek_cumle ?? blueprint.idea_text.slice(0, 80)} />
                    <KVRow label="Problem" value={problem?.tanim ?? '—'} />
                  </div>

                  {/* Market */}
                  <div>
                    <SectionTitle>Market</SectionTitle>
                    <KVRow label="TAM" value={problem?.tam_adreslenebilir_pazar ?? '—'} />
                    <KVRow label="Target" value={blueprint.target_users ?? '—'} />
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <SectionTitle>Tech Stack</SectionTitle>
                    {techStack ? (
                      <div className="flex flex-wrap gap-[5px]">
                        {techStackItems.map((item, i) => (
                          <span
                            key={item}
                            className={`font-mono text-[10px] px-2 py-[2px] rounded-[4px] border ${
                              i < 2
                                ? 'text-[var(--accent)] bg-[var(--accent-dim)] border-[var(--accent-border)]'
                                : 'text-[var(--text-2)] bg-[var(--bg-4)] border-[var(--border-2)]'
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[var(--text-3)]">—</p>
                    )}
                  </div>

                  {/* Revenue */}
                  <div>
                    <SectionTitle>Revenue</SectionTitle>
                    <KVRow label="Model" value={gelirModeli?.model_turu ?? '—'} />
                    <KVRow
                      label="12mo Target"
                      value={gelirModeli?.hedef_mrr_12ay ?? '—'}
                      valueStyle="text-[var(--green)]"
                    />
                  </div>

                  {/* Sub-scores */}
                  {(blueprint.score_market || blueprint.score_tech) && (
                    <div>
                      <SectionTitle>Sub-scores</SectionTitle>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Market', value: blueprint.score_market },
                          { label: 'Tech', value: blueprint.score_tech },
                          { label: 'Revenue', value: blueprint.score_revenue },
                          { label: 'Brand', value: blueprint.score_brand },
                        ].map(({ label, value }) => value !== null && (
                          <div key={label} className="bg-[var(--bg-3)] rounded-[6px] p-3 border border-[var(--border)]">
                            <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-widest mb-1">{label}</div>
                            <div className={`text-[18px] font-semibold tracking-tight ${getScoreClass(value).split(' ')[1]}`}>
                              {value}
                            </div>
                            <div className="mt-1.5 h-1 bg-[var(--border-2)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex-shrink-0 flex gap-2">
              <Link
                href={`/generate/${blueprint.id}`}
                className="flex-1 flex items-center justify-center gap-[6px] py-[6px] px-4 bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-mono hover:bg-[#5558e8] transition-colors"
              >
                open blueprint →
              </Link>
              <button className="flex items-center gap-[6px] py-[6px] px-3 bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[12px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-colors">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
                </svg>
                Download
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/generate/${blueprint.id}`)
                }}
                className="flex items-center justify-center py-[6px] px-[10px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[12px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-colors"
                title="Copy link"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3H2v9h2" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Helper Components ─────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[9px] text-[var(--text-3)] tracking-[0.12em] uppercase mb-2.5 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-[var(--border)]">
      {children}
    </div>
  )
}

function KVRow({ label, value, valueStyle = '' }: { label: string; value: string; valueStyle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-2">
      <span className="font-mono text-[10px] text-[var(--text-3)] min-w-[80px] pt-px">{label}</span>
      <span className={`text-[12px] text-[var(--text-2)] leading-relaxed flex-1 ${valueStyle}`}>{value}</span>
    </div>
  )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [industryFilter, setIndustryFilter] = useState<IndustryFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Blueprints sorgusu
  const { data: blueprints = [], isLoading, isError, refetch } = useBlueprints()

  // Silme mutation
  const deleteMutation = useDeleteBlueprint()

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...blueprints]

    // Industry filter
    if (industryFilter !== 'all') {
      result = result.filter((bp) => getIndustryFilter(bp.industry) === industryFilter)
    }

    // Arama filtresi
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (bp) =>
          bp.title.toLowerCase().includes(q) ||
          bp.idea_text.toLowerCase().includes(q) ||
          (bp.industry?.toLowerCase().includes(q) ?? false),
      )
    }

    // Sort
    switch (sortMode) {
      case 'score':
        result.sort((a, b) => (b.score_total ?? 0) - (a.score_total ?? 0))
        break
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [blueprints, industryFilter, debouncedSearch, sortMode])

  // Stats
  const stats = useMemo(() => {
    const total = blueprints.length
    const ready = blueprints.filter((bp) => bp.status === 'complete').length
    const avgScore = total > 0
      ? Math.round(blueprints.reduce((sum, bp) => sum + (bp.score_total ?? 0), 0) / total)
      : 0
    const deployed = blueprints.filter((bp) => bp.is_public).length
    return { total, ready, avgScore, deployed }
  }, [blueprints])

  const handleOpenDetail = useCallback((bp: Blueprint) => {
    setSelectedBlueprint(bp)
    setDetailOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id)
    if (selectedBlueprint?.id === id) setDetailOpen(false)
  }, [deleteMutation, selectedBlueprint])

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const hasSearch = debouncedSearch.trim() !== '' || industryFilter !== 'all'

  return (
    // -m-8 to escape layout padding, full height (layout uses py-8 px-8)
    <div style={{ height: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Stats Row */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg)] flex-shrink-0">
        <StatItem value={stats.total} label="total blueprints" />
        <div className="w-px h-4 bg-[var(--border-2)]" />
        <StatItem value={stats.ready} label="ready" />
        <div className="w-px h-4 bg-[var(--border-2)]" />
        <StatItem value={stats.avgScore > 0 ? `avg ${stats.avgScore}` : '—'} label="score" />
        <div className="w-px h-4 bg-[var(--border-2)]" />
        <StatItem value={stats.deployed} label="deployed" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] bg-[var(--bg-2)] flex-shrink-0 gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setIndustryFilter(key)}
              className={`font-mono text-[11px] px-3 py-[5px] rounded-full cursor-pointer transition-all duration-[120ms] border ${
                industryFilter === key
                  ? 'text-[var(--text)] bg-[var(--bg-4)] border-[var(--border-2)]'
                  : 'text-[var(--text-2)] bg-transparent border-transparent hover:text-[var(--text)] hover:bg-[var(--bg-3)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: search + sort + view toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Inline search */}
          <div className="relative">
            <svg
              className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[var(--text-3)]"
              width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            >
              <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="search blueprints... ⌘K"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--bg-3)] border border-[var(--border)] rounded-[6px] py-[5px] pl-[28px] pr-3 text-[11px] font-sans text-[var(--text)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--border-2)] transition-colors w-[160px] focus:w-[220px] transition-[width] duration-200"
            />
          </div>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="font-mono text-[11px] text-[var(--text-3)] bg-[var(--bg-3)] border border-[var(--border)] rounded-[6px] py-[5px] pl-[10px] pr-7 outline-none cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2352525b' stroke-width='1.5'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="score">Highest score</option>
            <option value="name">A → Z</option>
          </select>

          {/* View toggle */}
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`w-8 h-8 flex items-center justify-center rounded-[6px] border transition-all duration-[120ms] ${
              viewMode === 'grid'
                ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]'
                : 'bg-[var(--bg-3)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-4)] hover:text-[var(--text)]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`w-8 h-8 flex items-center justify-center rounded-[6px] border transition-all duration-[120ms] ${
              viewMode === 'list'
                ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--accent)]'
                : 'bg-[var(--bg-3)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-4)] hover:text-[var(--text)]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M3 8h10M3 12h10" />
            </svg>
          </button>

          <Link
            href="/generate"
            className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-medium hover:bg-[#5558e8] transition-colors whitespace-nowrap"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v10M3 8h10" />
            </svg>
            New Blueprint
          </Link>
        </div>
      </div>

      {/* Grid / List Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-full">
        {isError ? (
          <ErrorState
            message="Could not load data. Connection error."
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'flex flex-col gap-2'
          }>
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3' : ''}>
            <EmptyStateWrapper hasSearch={hasSearch} />
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'flex flex-col gap-2'
          }>
            {filtered.map((bp, i) => (
              <BlueprintCard
                key={bp.id}
                blueprint={bp}
                index={i}
                viewMode={viewMode}
                onOpen={handleOpenDetail}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Slide-over Panel */}
      <DetailPanel
        blueprint={selectedBlueprint}
        isOpen={detailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}

// ─── Stats Row Item ───────────────────────────────────────────────────────────

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[13px] font-medium text-[var(--text)]">{value}</span>
      <span className="font-mono text-[10px] text-[var(--text-3)]">{label}</span>
    </div>
  )
}
