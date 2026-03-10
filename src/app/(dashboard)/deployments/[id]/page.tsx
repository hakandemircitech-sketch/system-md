'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import Link from 'next/link'
import type { DbDeployment } from '@/types/database'

// ─── Tipler ──────────────────────────────────────────────────────────────────

type LogLevel = 'default' | 'success' | 'error' | 'warn' | 'info' | 'accent' | 'white'

interface LogLine {
  time: string
  message: string
  level: LogLevel
  done?: boolean
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function formatMs(ms: number | null): string {
  if (!ms) return '—'
  const secs = Math.floor(ms / 1000)
  const mins = Math.floor(secs / 60)
  const s = secs % 60
  if (mins > 0) return `${mins}m ${s}s`
  return `${s}s`
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: enUS })
  } catch {
    return '—'
  }
}

function logLevelClass(level: LogLevel): string {
  switch (level) {
    case 'success': return 'text-[var(--green)]'
    case 'error':   return 'text-[var(--red)]'
    case 'warn':    return 'text-[var(--yellow)]'
    case 'info':    return 'text-[var(--blue)]'
    case 'accent':  return 'text-[var(--accent)]'
    case 'white':   return 'text-[var(--text)]'
    default:        return 'text-[var(--text-3)]'
  }
}

function statusConfig(status: DbDeployment['status']) {
  switch (status) {
    case 'success':   return { color: 'var(--green)',   label: '● Live',       bg: 'bg-[rgba(34,197,94,0.1)] text-[var(--green)]'  }
    case 'building':  return { color: 'var(--yellow)',  label: '● Building',   bg: 'bg-[rgba(234,179,8,0.1)] text-[var(--yellow)]' }
    case 'failed':    return { color: 'var(--red)',     label: '✗ Failed',     bg: 'bg-[rgba(239,68,68,0.1)] text-[var(--red)]'    }
    case 'queued':    return { color: 'var(--text-3)',  label: '◷ Queued',     bg: 'bg-[var(--bg-4)] text-[var(--text-3)]'          }
    case 'cancelled': return { color: 'var(--text-4)',  label: '○ Cancelled',  bg: 'bg-[var(--bg-4)] text-[var(--text-4)]'          }
  }
}

function getPipelineSteps(status: DbDeployment['status']) {
  const steps = [
    { label: 'Queued', icon: 'clock' },
    { label: 'Build',  icon: 'build' },
    { label: 'Deploy', icon: 'rocket' },
    { label: 'Live',   icon: 'check' },
  ] as const

  let completedCount = 0
  let activeStep = -1

  switch (status) {
    case 'queued':    activeStep = 0; completedCount = 0; break
    case 'building':  completedCount = 2; activeStep = 2; break
    case 'success':   completedCount = 4; break
    case 'failed':    completedCount = 1; activeStep = 1; break
    case 'cancelled': completedCount = 0; break
  }

  return steps.map((step, i) => ({
    ...step,
    done:   i < completedCount,
    active: i === activeStep && status !== 'success' && status !== 'failed',
    error:  status === 'failed' && i === 1,
  }))
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function DeploymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const termRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [streaming, setStreaming] = useState(false)
  const [copied, setCopied] = useState(false)

  // Deployment verisi
  const { data, isLoading, isError } = useQuery<{ deployment: DbDeployment }>({
    queryKey: ['deployment', id],
    queryFn: async () => {
      const res = await fetch(`/api/deployments/${id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json() as Promise<{ deployment: DbDeployment }>
    },
    refetchInterval: 5000,
  })

  const deployment = data?.deployment

  // Log çek / stream
  const fetchLogs = useCallback(async (dep: DbDeployment) => {
    abortRef.current?.abort()
    setLogs([])

    if (dep.status === 'building') {
      setStreaming(true)
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(`/api/deployments/${dep.id}/logs?stream=1`, { signal: ctrl.signal })
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) return
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as LogLine & { done?: boolean }
                if (data.done) break
                setLogs(prev => [...prev, data])
              } catch { /* skip */ }
            }
          }
        }
      } catch {
        // AbortError — normal
      } finally {
        setStreaming(false)
      }
    } else {
      const res = await fetch(`/api/deployments/${dep.id}/logs`)
      if (res.ok) {
        const json = await res.json() as { logs: LogLine[] }
        setLogs(json.logs ?? [])
      }
    }
  }, [])

  useEffect(() => {
    if (!deployment) return
    fetchLogs(deployment)
    return () => { abortRef.current?.abort() }
  }, [deployment, fetchLogs])

  // Otomatik scroll
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [logs])

  // İptal mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/deployments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Cancel failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment', id] })
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
  })

  // Yeniden dene mutation
  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!deployment) throw new Error('No deployment')
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: deployment.project_name,
          platform: deployment.platform,
          branch: deployment.branch,
        }),
      })
      if (!res.ok) throw new Error('Retry failed')
      return res.json() as Promise<{ deployment: DbDeployment }>
    },
    onSuccess: (result) => {
      router.push(`/deployments/${result.deployment.id}`)
    },
  })

  function copyLogs() {
    const text = logs.map(l => `[${l.time}] ${l.message}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 bg-[var(--bg-2)] border border-[var(--border)] rounded-[var(--radius)] w-48 animate-pulse" />
        <div className="h-64 bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] animate-pulse" />
      </div>
    )
  }

  if (isError || !deployment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="var(--red)" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" />
        </svg>
        <p className="text-[14px] text-[var(--text-2)]">Deployment not found</p>
        <Link href="/deployments" className="text-[12px] text-[var(--accent)] hover:underline">
          ← All deployments
        </Link>
      </div>
    )
  }

  const cfg = statusConfig(deployment.status)
  const pipeline = getPipelineSteps(deployment.status)
  const shortRef = deployment.platform_deploy_id?.split('@')[1]?.slice(0, 7) ?? ''

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* Breadcrumb + Başlık */}
      <div>
        <Link
          href="/deployments"
          className="inline-flex items-center gap-[6px] font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors mb-3"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4L6 8l4 4" />
          </svg>
          All Deployments
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-[-0.02em]">
                {deployment.project_name}
              </h1>
              <span className={`inline-flex items-center gap-[5px] px-[10px] py-[3px] rounded-full font-mono text-[11px] ${cfg.bg}`}>
                <span
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{
                    background: cfg.color,
                    animation: deployment.status === 'building' ? 'dot-pulse 1.4s infinite' : undefined,
                  }}
                />
                {cfg.label}
              </span>
            </div>
            <p className="font-mono text-[12px] text-[var(--text-3)] mt-1">
              #{deployment.platform_deploy_id?.split('@')[0] ?? deployment.id.slice(0, 8)} · {deployment.branch}
              {shortRef ? `@${shortRef}` : ''}
              <span className="ml-3">{relativeTime(deployment.queued_at)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {deployment.status === 'success' && deployment.deploy_url && (
              <a
                href={deployment.deploy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[6px] px-[12px] py-[7px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[var(--radius)] text-[12px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-100"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 3H3v10h10v-3M9 3h4v4M8 8l5-5" />
                </svg>
                Visit Site
              </a>
            )}
            {deployment.status === 'failed' && (
              <button
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="inline-flex items-center gap-[6px] px-[12px] py-[7px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[var(--radius)] text-[12px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-100 disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8a6 6 0 1 0 6-6" strokeLinecap="round" />
                  <path d="M2 4v4h4" />
                </svg>
                {retryMutation.isPending ? 'Restarting...' : 'Retry'}
              </button>
            )}
            {(deployment.status === 'queued' || deployment.status === 'building') && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-[6px] px-[12px] py-[7px] bg-transparent text-[var(--red)] border border-[rgba(239,68,68,0.25)] rounded-[var(--radius)] text-[12px] hover:bg-[var(--red-dim)] transition-all duration-100 disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" /><path d="M10 6L6 10M6 6l4 4" />
                </svg>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meta Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Platform',  value: deployment.platform.charAt(0).toUpperCase() + deployment.platform.slice(1), icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="10" rx="1.5" />
            </svg>
          )},
          { label: 'Region',    value: deployment.region, icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2a8 8 0 0 0 0 12" />
            </svg>
          )},
          { label: 'Duration',   value: formatMs(deployment.duration_ms), icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1" />
            </svg>
          )},
          { label: 'Started',    value: relativeTime(deployment.queued_at), icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M5 3V1.5M11 3V1.5M2 7h12" />
            </svg>
          )},
        ].map(item => (
          <div key={item.label} className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] p-4">
            <div className="flex items-center gap-[6px] text-[var(--text-3)] mb-2">
              {item.icon}
              <span className="font-mono text-[10px] uppercase tracking-[0.08em]">{item.label}</span>
            </div>
            <div className="font-mono text-[14px] font-medium text-[var(--text)]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Görselleştirme */}
      <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] p-5">
        <h3 className="text-[12px] font-semibold text-[var(--text)] mb-4">Pipeline</h3>
        <div className="flex items-center">
          {pipeline.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-[6px]">
                {/* Dot */}
                {step.error ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--red-dim)] border-2 border-[rgba(239,68,68,0.3)]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--red)" strokeWidth="2">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </div>
                ) : step.done ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--green-dim)] border-2 border-[rgba(34,197,94,0.3)]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="2">
                      <path d="M2 6l3 3 5-4" />
                    </svg>
                  </div>
                ) : step.active ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--yellow-dim)] border-2 border-[rgba(234,179,8,0.3)] animate-[dot-pulse_1.4s_infinite]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--yellow)" strokeWidth="1.5" className="animate-spin">
                      <path d="M6 1a5 5 0 1 0 5 5" strokeLinecap="round" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-4)] border-2 border-[var(--border-2)]" />
                )}
                {/* Label */}
                <span className={`font-mono text-[11px] ${
                  step.done ? 'text-[var(--text-2)]'
                  : step.active ? 'text-[var(--yellow)]'
                  : step.error ? 'text-[var(--red)]'
                  : 'text-[var(--text-3)]'
                }`}>
                  {step.label}
                </span>
              </div>
              {/* Bağlantı çizgisi */}
              {i < pipeline.length - 1 && (
                <div className={`flex-1 h-[2px] mx-3 mb-5 ${
                  step.done ? 'bg-[var(--green)] opacity-40' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hata Mesajı */}
      {deployment.status === 'failed' && deployment.error_message && (
        <div className="bg-[var(--red-dim)] border border-[rgba(239,68,68,0.2)] rounded-[10px] p-4">
          <div className="flex items-center gap-[6px] text-[var(--red)] font-semibold text-[12px] mb-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" />
            </svg>
            Build Error
          </div>
          <p className="font-mono text-[12px] text-[var(--red)]">{deployment.error_message}</p>
        </div>
      )}

      {/* Build Log Terminal */}
      <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-5 py-[14px] border-b border-[var(--border)]">
          <div className="flex items-center gap-[7px] text-[12px] font-semibold text-[var(--text)]">
            <div
              className="w-[6px] h-[6px] rounded-full"
              style={{
                background: cfg.color,
                animation: deployment.status === 'building' ? 'dot-pulse 1.4s infinite' : undefined,
              }}
            />
            Build Logs
          </div>
          <div className="flex items-center gap-2">
            {streaming && (
              <span className="font-mono text-[10px] text-[var(--yellow)] animate-[dot-pulse_1.4s_infinite]">
                Live
              </span>
            )}
            <button
              onClick={copyLogs}
              className="inline-flex items-center gap-[5px] px-[10px] py-[5px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] rounded-[var(--radius)] font-mono text-[11px] transition-all duration-100"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3H2v9h2" />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Terminal içerik */}
        <div
          ref={termRef}
          className="font-mono text-[11px] leading-[1.9] px-[16px] py-[14px] bg-[var(--bg)] min-h-[280px] max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]"
        >
          {logs.length === 0 ? (
            <span className="text-[var(--text-4)]">Loading logs...</span>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="flex gap-[10px]">
                <span className="text-[var(--text-4)] shrink-0 select-none w-[60px]">{line.time}</span>
                <span className={logLevelClass(line.level)}>{line.message || '\u00a0'}</span>
              </div>
            ))
          )}
          {streaming && (
            <div className="flex gap-[10px]">
              <span className="text-[var(--text-4)] select-none w-[60px]">&nbsp;</span>
              <span className="text-[var(--text-3)]">
                <span className="inline-block w-[6px] h-[12px] bg-[var(--text-3)] ml-[2px] align-middle animate-[blink_1.1s_step-end_infinite]" />
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
