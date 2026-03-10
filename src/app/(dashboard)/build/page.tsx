'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { DbBlueprint, DbBuildKit } from '@/types/database'

// ─── Tipler ──────────────────────────────────────────────────────────────────

type TabKey = 'cursorrules' | 'build_md' | 'schema_sql' | 'env_example' | 'readme_md'
type BuildState = 'idle' | 'building' | 'done'
type StackKey = 'nextjs-supabase' | 'react-node' | 'remix-planetscale'
type TokenType = 'comment' | 'keyword' | 'string' | 'number' | 'fn' | 'dim' | 'green' | 'accent' | 'plain'

interface Token {
  type: TokenType
  text: string
}

interface BlueprintWithKit extends DbBlueprint {
  build_kits: DbBuildKit[] | null
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; color: string; field: keyof DbBuildKit }[] = [
  { key: 'cursorrules',  label: '.cursorrules',  color: '#6366f1', field: 'cursorrules'  },
  { key: 'build_md',     label: 'build.md',      color: '#22c55e', field: 'build_md'     },
  { key: 'schema_sql',   label: 'schema.sql',    color: '#3b82f6', field: 'schema_sql'   },
  { key: 'env_example',  label: '.env.example',  color: '#eab308', field: 'env_example'  },
  { key: 'readme_md',    label: 'README.md',     color: '#a855f7', field: 'readme_md'    },
]

const STACKS: { key: StackKey; name: string; desc: string; color: string }[] = [
  { key: 'nextjs-supabase',   name: 'Next.js 14 + Supabase',          desc: 'Recommended for this blueprint',   color: '#38bdf8' },
  { key: 'react-node',        name: 'React + Node.js + PostgreSQL',   desc: 'Full-stack custom setup',          color: '#61dafb' },
  { key: 'remix-planetscale', name: 'Remix + PlanetScale',            desc: 'Edge-first, optimised for speed',  color: '#ff4785' },
]

const BUILD_STEPS = [
  { name: 'Validate blueprint',   meta: 'Check schema integrity',     duration: 600  },
  { name: 'Generate .cursorrules', meta: 'Agent instructions file',   duration: 900  },
  { name: 'Generate build.md',    meta: 'Project structure docs',     duration: 800  },
  { name: 'Generate schema.sql',  meta: 'Database schema + seeds',    duration: 1100 },
  { name: 'Package build kit',    meta: 'Compress & finalise ZIP',    duration: 700  },
]

const ICON_PALETTE = [
  { bg: 'var(--accent-dim)',           color: 'var(--accent)'  },
  { bg: 'var(--blue-dim)',             color: 'var(--blue)'    },
  { bg: 'var(--yellow-dim)',           color: 'var(--yellow)'  },
  { bg: 'var(--green-dim)',            color: 'var(--green)'   },
  { bg: 'rgba(139,92,246,0.12)',       color: '#8b5cf6'        },
]

const FILE_ICON_PALETTE = [
  { bg: 'var(--accent-dim)',           color: 'var(--accent)'  },
  { bg: 'var(--green-dim)',            color: 'var(--green)'   },
  { bg: 'var(--blue-dim)',             color: 'var(--blue)'    },
  { bg: 'var(--yellow-dim)',           color: 'var(--yellow)'  },
  { bg: 'rgba(168,85,247,0.1)',        color: '#a855f7'        },
]

const TOKEN_COLORS: Record<TokenType, string> = {
  comment : 'var(--text-4)',
  keyword : '#7aa2f7',
  string  : '#9ece6a',
  number  : '#ff9e64',
  fn      : '#7dcfff',
  dim     : 'var(--text-3)',
  green   : 'var(--green)',
  accent  : 'var(--accent)',
  plain   : 'var(--text)',
}

// ─── Syntax tokenizer ────────────────────────────────────────────────────────

const SQL_KW =
  /\b(CREATE TABLE|CREATE INDEX|CREATE UNIQUE INDEX|CREATE OR REPLACE|INSERT INTO|ALTER TABLE|DROP TABLE|SELECT|FROM|WHERE|REFERENCES|PRIMARY KEY|UNIQUE|NOT NULL|DEFAULT|ON DELETE|CASCADE|UUID|TEXT|BIGINT|INTEGER|BOOLEAN|TIMESTAMPTZ|NUMERIC|JSONB|DATE|gen_random_uuid|now|CREATE|TABLE|INDEX|INSERT|INTO|ALTER)\b/gi

function tokenizeLine(line: string, fileType: TabKey): Token[] {
  const trim = line.trimStart()

  if (fileType === 'schema_sql') {
    if (trim.startsWith('--')) return [{ type: 'comment', text: line }]
    const tokens: Token[] = []
    let lastIndex = 0
    SQL_KW.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = SQL_KW.exec(line)) !== null) {
      if (m.index > lastIndex) tokens.push({ type: 'dim', text: line.slice(lastIndex, m.index) })
      tokens.push({ type: 'keyword', text: m[0] })
      lastIndex = m.index + m[0].length
    }
    if (lastIndex < line.length) {
      // highlight string literals
      const rest = line.slice(lastIndex)
      const strMatch = rest.match(/('[^']*')/)
      if (strMatch && strMatch.index !== undefined) {
        const before = rest.slice(0, strMatch.index)
        if (before) tokens.push({ type: 'dim', text: before })
        tokens.push({ type: 'string', text: strMatch[0] })
        const after = rest.slice(strMatch.index + strMatch[0].length)
        if (after) tokens.push({ type: 'dim', text: after })
      } else {
        tokens.push({ type: 'dim', text: rest })
      }
    }
    return tokens.length ? tokens : [{ type: 'dim', text: line }]
  }

  if (fileType === 'env_example') {
    if (trim.startsWith('#')) return [{ type: 'comment', text: line }]
    if (line.includes('=')) {
      const eq = line.indexOf('=')
      return [
        { type: 'keyword', text: line.slice(0, eq) },
        { type: 'dim',     text: '='                },
        { type: 'string',  text: line.slice(eq + 1) },
      ]
    }
    return [{ type: 'plain', text: line }]
  }

  if (fileType === 'build_md' || fileType === 'readme_md') {
    if (trim.startsWith('### ')) return [{ type: 'accent', text: line }]
    if (trim.startsWith('## '))  return [{ type: 'fn',     text: line }]
    if (trim.startsWith('# '))   return [{ type: 'green',  text: line }]
    if (trim.startsWith('```'))  return [{ type: 'dim',    text: line }]
    if (trim.startsWith('-') || trim.startsWith('*')) return [{ type: 'dim', text: line }]
    return [{ type: 'plain', text: line }]
  }

  // .cursorrules (default)
  if (trim.startsWith('#')) return [{ type: 'comment', text: line }]
  if (line.includes('=')) {
    const eq = line.indexOf('=')
    const key = line.slice(0, eq)
    const val = line.slice(eq + 1)
    return [
      { type: /^[A-Z_\s]+$/.test(key.trim()) ? 'keyword' : 'plain', text: key },
      { type: 'dim',    text: '='  },
      { type: 'string', text: val  },
    ]
  }
  return [{ type: 'dim', text: line }]
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function getInitials(title: string): string {
  return title.split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function getScoreColor(score: number | null): string {
  if (!score) return 'var(--text-3)'
  if (score >= 85) return 'var(--green)'
  if (score >= 70) return 'var(--yellow)'
  return 'var(--red)'
}

function formatBytes(str: string): string {
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes}b`
  return `${(bytes / 1024).toFixed(1)}kb`
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export default function BuildCenterPage() {
  const supabase = createClient()

  const [selectedId,     setSelectedId]     = useState<string | null>(null)
  const [activeTab,      setActiveTab]       = useState<TabKey>('cursorrules')
  const [selectedStack,  setSelectedStack]   = useState<StackKey>('nextjs-supabase')
  const [featureToggles, setFeatureToggles]  = useState<Record<TabKey, boolean>>({
    cursorrules: true, build_md: true, schema_sql: true, env_example: true, readme_md: false,
  })
  const [buildState,   setBuildState]   = useState<BuildState>('idle')
  const [buildStep,    setBuildStep]    = useState(-1)
  const [buildProgress, setBuildProgress] = useState(0)
  const [copiedTab,    setCopiedTab]    = useState<TabKey | null>(null)

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimeoutsRef     = useRef<ReturnType<typeof setTimeout>[]>([])
  const buildStartRef       = useRef(0)

  // ── Veri çekme ──────────────────────────────────────────────────────────────

  const { data: blueprints, isLoading } = useQuery({
    queryKey: ['blueprints-build-kits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blueprints')
        .select('*, build_kits (*)')
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as BlueprintWithKit[]
    },
  })

  useEffect(() => {
    if (blueprints && blueprints.length > 0 && !selectedId) {
      setSelectedId(blueprints[0].id)
    }
  }, [blueprints, selectedId])

  const selectedBlueprint = blueprints?.find(b => b.id === selectedId) ?? null
  const buildKit          = selectedBlueprint?.build_kits?.[0] ?? null

  // ── Dosya içeriği ────────────────────────────────────────────────────────────

  const getFileContent = useCallback((tab: TabKey): string => {
    if (!buildKit) return ''
    const field = TABS.find(t => t.key === tab)?.field
    if (!field) return ''
    const val = buildKit[field]
    return typeof val === 'string' ? val : ''
  }, [buildKit])

  // ── Kopyala ──────────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async (tab: TabKey) => {
    const content = getFileContent(tab)
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopiedTab(tab)
    setTimeout(() => setCopiedTab(null), 2000)
  }, [getFileContent])

  // ── İndir (tek dosya) ────────────────────────────────────────────────────────

  const handleDownload = useCallback((tab: TabKey) => {
    const content = getFileContent(tab)
    if (!content) return
    const label = TABS.find(t => t.key === tab)?.label ?? tab
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = label; a.click()
    URL.revokeObjectURL(url)
  }, [getFileContent])

  // ── İndir (tüm kit) — bundled text archive format ───────────────────────────

  const handleDownloadKit = useCallback(() => {
    if (!selectedBlueprint) return

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const slug = selectedBlueprint.title.toLowerCase().replace(/\s+/g, '-')

    const sections = TABS
      .filter(t => featureToggles[t.key])
      .map(t => {
        const content = getFileContent(t.key)
        if (!content) return null
        const border = '─'.repeat(60)
        return `${border}\n  FILE: ${t.label}\n${border}\n\n${content}`
      })
      .filter(Boolean)

    if (!sections.length) return

    const header = [
      '╔══════════════════════════════════════════════════════════╗',
      '  SystemMD Build Kit',
      `  Project : ${selectedBlueprint.title}`,
      `  Created : ${new Date().toISOString()}`,
      `  Stack   : ${selectedStack}`,
      '  Format  : Text bundle (extract each FILE section manually)',
      '╚══════════════════════════════════════════════════════════╝',
      '',
    ].join('\n')

    const blob = new Blob([header + sections.join('\n\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${slug}-build-kit-${timestamp}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedBlueprint, featureToggles, getFileContent, selectedStack])

  // ── Build simülasyonu ────────────────────────────────────────────────────────

  const resetBuild = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    stepTimeoutsRef.current.forEach(clearTimeout)
    stepTimeoutsRef.current = []
    setBuildState('idle')
    setBuildStep(-1)
    setBuildProgress(0)
  }, [])

  const startBuild = useCallback(() => {
    if (buildState === 'building') return
    resetBuild()

    setBuildState('building')
    setBuildStep(0)
    setBuildProgress(0)
    buildStartRef.current = Date.now()

    const totalDuration = BUILD_STEPS.reduce((sum, s) => sum + s.duration, 0)

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - buildStartRef.current
      const pct = Math.min(Math.round((elapsed / totalDuration) * 100), 99)
      setBuildProgress(pct)
    }, 80)

    let cumulative = 0
    BUILD_STEPS.forEach((_, idx) => {
      cumulative += BUILD_STEPS[idx].duration
      const t = setTimeout(() => {
        setBuildStep(idx + 1)
        if (idx === BUILD_STEPS.length - 1) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
          setBuildProgress(100)
          setBuildState('done')
        }
      }, cumulative)
      stepTimeoutsRef.current.push(t)
    })
  }, [buildState, resetBuild])

  const handleSelectBlueprint = useCallback((id: string) => {
    setSelectedId(id)
    resetBuild()
  }, [resetBuild])

  // ── Render ───────────────────────────────────────────────────────────────────

  const activeContent = getFileContent(activeTab)
  const activeLines   = activeContent ? activeContent.split('\n') : []

  const selectedIdx = blueprints?.findIndex(b => b.id === selectedId) ?? 0

  const progressLabel =
    buildState === 'idle'     ? 'Ready to build' :
    buildState === 'done'     ? 'Build complete' :
    buildStep >= 0 && buildStep < BUILD_STEPS.length
      ? `${BUILD_STEPS[buildStep].name}...`
      : 'Building...'

  const kitSubText =
    buildState === 'done' && selectedBlueprint
      ? `${selectedBlueprint.title.toLowerCase().replace(/\s+/g, '-')}-build-kit.txt — ready`
      : selectedBlueprint
      ? 'Prepare files then download'
      : 'Select a blueprint first'

  return (
    /* Full-bleed IDE layout — removes dashboard padding via data attribute */
    <div
      data-full-bleed
      className="overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* ── Three column grid ─────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-hidden grid border-t border-[var(--border)]"
        style={{ gridTemplateColumns: '300px 1fr 320px' }}
      >

        {/* ═══ LEFT: Blueprint seçici ═══════════════════════════════════ */}
        <div className="flex flex-col overflow-hidden border-r border-[var(--border)]">

          {/* Panel header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0 bg-[var(--bg-2)]">
            <div className="flex items-center gap-[7px] text-xs font-semibold text-[var(--text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Select Project
            </div>
            <span className="font-mono text-[10px] text-[var(--text-3)]">
              {blueprints?.length ?? 0} total
            </span>
          </div>

          {/* Blueprint listesi */}
          <div className="flex-1 overflow-y-auto bg-[var(--bg)] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
            {isLoading ? (
              <div className="p-[10px] flex flex-col gap-0.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[58px] rounded-[var(--radius)] bg-[var(--bg-3)] animate-pulse" />
                ))}
              </div>
            ) : !blueprints || blueprints.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--text-4)" strokeWidth="1.5">
                    <rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V1.5M11 3V1.5M2 7h12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[var(--text-2)]">No blueprints yet</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-1">Create a blueprint first</p>
                </div>
              </div>
            ) : (
              <div className="p-[10px] flex flex-col gap-0.5">
                {blueprints.map((bp, idx) => {
                  const icon   = ICON_PALETTE[idx % ICON_PALETTE.length]
                  const active = selectedId === bp.id
                  return (
                    <div
                      key={bp.id}
                      onClick={() => handleSelectBlueprint(bp.id)}
                      className={`flex items-center gap-[10px] px-3 py-[10px] rounded-[var(--radius)] cursor-pointer transition-all duration-[120ms] border ${
                        active
                          ? 'bg-[var(--accent-dim)] border-[var(--accent-border)]'
                          : 'border-transparent hover:bg-[var(--bg-3)]'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-[7px] flex-shrink-0 flex items-center justify-center font-mono text-[11px] font-medium"
                        style={{ background: icon.bg, color: icon.color }}
                      >
                        {getInitials(bp.title)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-[var(--text)] truncate">{bp.title}</div>
                        <div className="font-mono text-[10px] text-[var(--text-3)] mt-px">
                          {bp.industry ?? 'General'} · {formatDistanceToNow(new Date(bp.created_at))} ago
                        </div>
                      </div>
                      <div
                        className="font-mono text-[11px] font-medium flex-shrink-0"
                        style={{ color: getScoreColor(bp.score_total) }}
                      >
                        {bp.score_total ?? '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ CENTER: Build workspace ══════════════════════════════════ */}
        <div className="flex flex-col overflow-hidden border-r border-[var(--border)]">
          {selectedBlueprint ? (
            <>
              {/* Project header */}
              <div className="px-6 py-5 pb-4 border-b border-[var(--border)] flex-shrink-0 flex items-center gap-[14px] bg-[var(--bg-2)]">
                <div
                  className="w-10 h-10 rounded-[9px] flex-shrink-0 flex items-center justify-center font-mono text-sm font-medium"
                  style={{
                    background: ICON_PALETTE[selectedIdx % ICON_PALETTE.length].bg,
                    color:      ICON_PALETTE[selectedIdx % ICON_PALETTE.length].color,
                  }}
                >
                  {getInitials(selectedBlueprint.title)}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[var(--text)] tracking-[-0.02em]">
                    {selectedBlueprint.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-3)] mt-0.5">
                    {selectedBlueprint.industry ?? 'General'} · Score {selectedBlueprint.score_total ?? '—'}/100
                  </div>
                </div>
                <div className="flex gap-1.5 ml-auto">
                  <span className="inline-flex items-center gap-[5px] px-2 py-0.5 rounded-full font-mono text-[10px] bg-[var(--green-dim)] text-[var(--green)]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" />
                    Ready
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] bg-[var(--accent-dim)] text-[var(--accent)]">
                    {selectedBlueprint.industry ?? 'General'}
                  </span>
                </div>
              </div>

              {/* File tabs */}
              <div className="flex border-b border-[var(--border)] bg-[var(--bg-2)] flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-[10px] font-mono text-[11px] cursor-pointer border-b-2 transition-all duration-[120ms] whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-[var(--text)] border-[var(--accent)]'
                        : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-2)]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tab.color }} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code preview — flex-1, scrollable */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--bg)]">
                {/* Code header */}
                <div className="flex items-center justify-between px-4 py-[10px] border-b border-[var(--border)] bg-[var(--bg-2)] flex-shrink-0">
                  <span className="font-mono text-[11px] text-[var(--text-3)]">
                    {TABS.find(t => t.key === activeTab)?.label}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(activeTab)}
                      className="inline-flex items-center gap-[5px] px-[10px] py-[5px] rounded-[var(--radius)] text-[11px] font-mono cursor-pointer transition-all duration-[120ms] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)]"
                    >
                      {copiedTab === activeTab ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M2 6l3 3 5-4"/></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3H2v9h2"/></svg>
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(activeTab)}
                      className="inline-flex items-center gap-[5px] px-[10px] py-[5px] rounded-[var(--radius)] text-[11px] font-mono cursor-pointer transition-all duration-[120ms] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)]"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M5 7l3 3 3-3M2 13h12"/></svg>
                      Download
                    </button>
                  </div>
                </div>

                {/* Code body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 bg-[var(--bg)] font-mono text-[12px] leading-[1.9] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
                  {activeContent ? (
                    activeLines.map((line, i) => (
                      <div key={i} className="flex min-w-0">
                        <span className="w-7 text-right mr-4 text-[11px] text-[var(--text-4)] select-none flex-shrink-0 leading-[1.9]">
                          {i + 1}
                        </span>
                        <span className="min-w-0 break-all">
                          {tokenizeLine(line, activeTab).map((tok, j) => (
                            <span key={j} style={{ color: TOKEN_COLORS[tok.type] }}>
                              {tok.text || '\u00A0'}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[11px] text-[var(--text-3)] text-center">
                        {buildKit
                          ? 'This file has not been generated yet.'
                          : 'No build kit yet. Click "Build Kit" first.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stack override — note: preview mode, stack selection is logged but does not regenerate content in the current version */}
              <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--bg-2)] flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="font-mono text-[9px] text-[var(--text-3)] tracking-[0.12em] uppercase">Stack Override</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="font-mono text-[9px] text-[var(--text-4)] italic">preview</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {STACKS.map(stack => (
                    <div
                      key={stack.key}
                      onClick={() => setSelectedStack(stack.key)}
                      className={`flex items-center gap-3 px-[14px] py-[10px] border rounded-[var(--radius)] cursor-pointer transition-all duration-[120ms] ${
                        selectedStack === stack.key
                          ? 'border-[var(--accent-border)] bg-[var(--accent-dim)]'
                          : 'border-[var(--border)] bg-[var(--bg-2)] hover:border-[var(--border-2)] hover:bg-[var(--bg-3)]'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stack.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-[var(--text)]">{stack.name}</div>
                        <div className="text-[11px] text-[var(--text-3)]">{stack.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-[120ms] ${
                          selectedStack === stack.key
                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                            : 'border-[var(--border-2)]'
                        }`}
                      >
                        {selectedStack === stack.key && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                            <path d="M2 6l3 3 5-5"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Include in kit */}
              <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--bg-2)] flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="font-mono text-[9px] text-[var(--text-3)] tracking-[0.12em] uppercase">Include in Kit</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TABS.map(tab => (
                    <div
                      key={tab.key}
                      onClick={() => setFeatureToggles(p => ({ ...p, [tab.key]: !p[tab.key] }))}
                      className={`flex items-center justify-between px-3 py-[9px] border rounded-[var(--radius)] cursor-pointer transition-all duration-[120ms] ${
                        featureToggles[tab.key]
                          ? 'border-[var(--accent-border)] bg-[var(--accent-dim)]'
                          : 'border-[var(--border)] bg-[var(--bg-2)] hover:border-[var(--border-2)]'
                      }`}
                    >
                      <span className={`text-[11px] ${featureToggles[tab.key] ? 'text-[var(--text)]' : 'text-[var(--text-2)]'}`}>
                        {tab.label}
                      </span>
                      <div
                        className={`w-7 h-4 rounded-full border relative flex-shrink-0 transition-all duration-200 ${
                          featureToggles[tab.key]
                            ? 'bg-[var(--accent)] border-[var(--accent)]'
                            : 'bg-[var(--bg-4)] border-[var(--border-2)]'
                        }`}
                      >
                        <span
                          className={`absolute top-[2px] w-[10px] h-[10px] rounded-full transition-all duration-200 ${
                            featureToggles[tab.key]
                              ? 'left-[14px] bg-white'
                              : 'left-[2px] bg-[var(--text-3)]'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Build button */}
              <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--bg-2)] flex-shrink-0">
                <button
                  onClick={buildState === 'done' ? resetBuild : startBuild}
                  disabled={buildState === 'building'}
                  className={`w-full px-4 py-[11px] rounded-[var(--radius)] text-[13px] font-medium flex items-center justify-center gap-2 transition-all duration-150 ${
                    buildState === 'building'
                      ? 'bg-[var(--bg-4)] text-[var(--text-3)] border border-[var(--border-2)] cursor-not-allowed'
                      : buildState === 'done'
                      ? 'bg-[var(--green)] text-white hover:bg-[#16a34a]'
                      : 'bg-[var(--accent)] text-white hover:bg-[#5558e8] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(99,102,241,0.3)]'
                  }`}
                >
                  {buildState === 'building' ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
                        <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round"/>
                      </svg>
                      Building...
                    </>
                  ) : buildState === 'done' ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 8l4 4 6-8"/>
                      </svg>
                      Rebuild
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V1.5M11 3V1.5M2 7h12"/>
                      </svg>
                      Prepare Kit
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Seçilmemiş durumu */
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="var(--text-4)" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V1.5M11 3V1.5M2 7h12"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--text-2)]">Select a blueprint</p>
                <p className="text-[11px] text-[var(--text-3)] mt-1">Select from the left to view build files</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Build Status ══════════════════════════════════════ */}
        <div className="flex flex-col overflow-hidden bg-[var(--bg-2)]">

          {/* Panel header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-[7px] text-xs font-semibold text-[var(--text)]">
              <span
                className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                style={{
                  background:
                    buildState === 'building' ? 'var(--yellow)' :
                    buildState === 'done'     ? 'var(--green)'  :
                    'var(--text-3)',
                }}
              />
              Build Status
            </div>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[9px] transition-all duration-300"
              style={{
                background:
                  buildState === 'building' ? 'var(--yellow-dim)' :
                  buildState === 'done'     ? 'var(--green-dim)'  :
                  'var(--bg-4)',
                color:
                  buildState === 'building' ? 'var(--yellow)' :
                  buildState === 'done'     ? 'var(--green)'  :
                  'var(--text-3)',
              }}
            >
              {buildState === 'building' ? 'BUILDING' : buildState === 'done' ? 'DONE' : 'IDLE'}
            </span>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">

            {/* Progress bar */}
            <div className="mx-4 mt-4 mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-[10px] text-[var(--text-3)]">{progressLabel}</span>
                <strong className="font-mono text-[10px] text-[var(--text)]">{buildProgress}%</strong>
              </div>
              <div className="h-[3px] bg-[var(--border-2)] rounded-sm overflow-hidden">
                <div
                  className="h-full rounded-sm transition-[width] duration-500"
                  style={{
                    width: `${buildProgress}%`,
                    background: 'linear-gradient(90deg, var(--accent), var(--green))',
                  }}
                />
              </div>
            </div>

            {/* Build steps card */}
            <div className="mx-4 mb-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-3)]">
              <div className="flex items-center justify-between mb-[14px]">
                <span className="text-[12px] font-semibold text-[var(--text)]">Build Steps</span>
                <span className="font-mono text-[10px] text-[var(--text-3)]">
                  {buildState === 'idle'
                    ? '—'
                    : `${(BUILD_STEPS.slice(0, Math.max(buildStep, 0)).reduce((s, st) => s + st.duration, 0) / 1000).toFixed(1)}s`}
                </span>
              </div>
              <div className="flex flex-col">
                {BUILD_STEPS.map((step, idx) => {
                  const isDone   = buildState === 'done' || (buildState === 'building' && idx < buildStep)
                  const isActive = buildState === 'building' && idx === buildStep

                  return (
                    <div key={idx} className="flex items-start gap-[10px] py-[10px] relative">
                      {/* Connector line */}
                      {idx < BUILD_STEPS.length - 1 && (
                        <span
                          className="absolute left-[9px] top-7 bottom-[-2px] w-px"
                          style={{
                            background: isDone   ? 'rgba(34,197,94,0.4)'    :
                                        isActive ? 'rgba(99,102,241,0.3)'   :
                                        'var(--border)',
                          }}
                        />
                      )}
                      {/* Step icon */}
                      <div
                        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-[1.5px] mt-px ${
                          isDone   ? 'bg-[var(--green-dim)] border-[rgba(34,197,94,0.3)]' :
                          isActive ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] animate-pulse' :
                          'bg-[var(--bg-4)] border-[var(--border)]'
                        }`}
                      >
                        {isDone ? (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="2">
                            <path d="M2 6l3 3 5-4"/>
                          </svg>
                        ) : isActive ? (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="animate-spin">
                            <path d="M6 1a5 5 0 1 0 5 5" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--text-4)" strokeWidth="1.5">
                            <circle cx="6" cy="6" r="4"/>
                          </svg>
                        )}
                      </div>
                      {/* Step content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[12px] font-medium"
                          style={{ color: isDone || isActive ? 'var(--text)' : 'var(--text-3)' }}
                        >
                          {step.name}
                        </div>
                        <div
                          className="font-mono text-[10px] mt-0.5"
                          style={{ color: isDone ? 'var(--green)' : 'var(--text-3)' }}
                        >
                          {isDone ? `✓ ${step.meta}` : step.meta}
                        </div>
                      </div>
                      {/* Time */}
                      <div className="font-mono text-[10px] text-[var(--text-3)] flex-shrink-0 self-start mt-0.5">
                        {isDone
                          ? `${(BUILD_STEPS.slice(0, idx + 1).reduce((s, st) => s + st.duration, 0) / 1000).toFixed(1)}s`
                          : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Generated files */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="font-mono text-[9px] text-[var(--text-3)] tracking-[0.12em] uppercase">Generated Files</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <div className="flex flex-col gap-1">
                {TABS.map((tab, idx) => {
                  const content   = getFileContent(tab.key)
                  const hasContent = !!content
                  const isFileDone = (buildState === 'done' || hasContent)
                  const fileIcon   = FILE_ICON_PALETTE[idx % FILE_ICON_PALETTE.length]
                  const isActive   = activeTab === tab.key && hasContent

                  return (
                    <div
                      key={tab.key}
                      onClick={() => { if (hasContent) setActiveTab(tab.key) }}
                      className={`flex items-center gap-[10px] px-3 py-[9px] border rounded-[var(--radius)] bg-[var(--bg-3)] transition-all duration-[120ms] ${
                        !isFileDone ? 'opacity-30' :
                        isActive    ? 'border-[var(--accent-border)] bg-[var(--accent-dim)] cursor-pointer' :
                        hasContent  ? 'border-[var(--border)] hover:border-[var(--border-2)] hover:bg-[var(--bg-4)] cursor-pointer' :
                        'border-[var(--border)] cursor-default'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-[5px] flex-shrink-0 flex items-center justify-center"
                        style={{ background: fileIcon.bg, color: fileIcon.color }}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="1" width="10" height="14" rx="1.5"/><path d="M5 5h6M5 8h4"/>
                        </svg>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--text)] flex-1">{tab.label}</span>
                      <span className="font-mono text-[10px] text-[var(--text-3)]">
                        {hasContent ? formatBytes(content) : '—'}
                      </span>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                        {hasContent ? (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="2">
                            <path d="M2 6l3 3 5-4"/>
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--text-4)" strokeWidth="1.5">
                            <circle cx="6" cy="6" r="4"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Download kit button */}
            <button
              onClick={buildState === 'done' ? handleDownloadKit : undefined}
              disabled={buildState !== 'done'}
              className={`mx-4 mb-4 w-[calc(100%-32px)] px-4 py-[11px] bg-[var(--bg-3)] border border-[var(--border-2)] rounded-[var(--radius)] flex items-center gap-[10px] transition-all duration-150 ${
                buildState === 'done'
                  ? 'cursor-pointer hover:bg-[var(--bg-4)] hover:-translate-y-px'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <div className="w-8 h-8 rounded-[7px] bg-[var(--accent-dim)] border border-[var(--accent-border)] flex items-center justify-center flex-shrink-0 text-[var(--accent)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v8M5 7l3 3 3-3M2 13h12"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--text)]">Download Build Kit</div>
                <div className="font-mono text-[10px] text-[var(--text-3)] mt-px truncate">{kitSubText}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.5">
                <path d="M6 4l4 4-4 4"/>
              </svg>
            </button>

          </div>
        </div>

      </div>
    </div>
  )
}
