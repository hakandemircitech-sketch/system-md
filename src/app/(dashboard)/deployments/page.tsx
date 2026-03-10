'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import Modal from '@/components/ui/Modal'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DbDeployment } from '@/types/database'

// ─── Tipler ──────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'success' | 'building' | 'failed' | 'queued' | 'cancelled'

type LogLevel = 'default' | 'success' | 'error' | 'warn' | 'info' | 'accent' | 'white'

interface LogLine {
  time: string
  message: string
  level: LogLevel
  done?: boolean
}

interface DeploymentStats {
  total: number
  success: number
  building: number
  failed: number
  queued: number
  avg_duration_ms: number | null
}

interface DeploymentsResponse {
  deployments: DbDeployment[]
  stats: DeploymentStats
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

function statusConfig(status: DbDeployment['status']) {
  switch (status) {
    case 'success':   return { stripe: 'bg-[var(--green)]', badge: 'green',   label: 'Success',  pulse: false }
    case 'building':  return { stripe: 'bg-[var(--yellow)] animate-[stripe-pulse_1.5s_ease_infinite]', badge: 'yellow', label: 'Building', pulse: true }
    case 'failed':    return { stripe: 'bg-[var(--red)]',   badge: 'red',     label: 'Failed',   pulse: false }
    case 'queued':    return { stripe: 'bg-[var(--text-3)]', badge: 'neutral', label: 'Queued',   pulse: false }
    case 'cancelled': return { stripe: 'bg-[var(--text-4)]', badge: 'neutral', label: 'Cancelled',pulse: false }
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

// Pipeline adımları — hangi adımın tamamlandığını deployment status'undan hesapla
function getPipelineSteps(status: DbDeployment['status']) {
  const steps = ['Queued', 'Build', 'Deploy', 'Live'] as const
  let completedCount = 0
  let activeStep = -1

  switch (status) {
    case 'queued':
      completedCount = 0
      activeStep = 0
      break
    case 'building':
      completedCount = 1  // Queued tamamlandı
      activeStep = 1      // Build aktif
      break
    case 'success':
      completedCount = 4
      break
    case 'failed':
      completedCount = 1  // Queued tamamlandı
      activeStep = -1
      break
    case 'cancelled':
      completedCount = 0
      break
  }

  return steps.map((label, i) => ({
    label,
    done: i < completedCount,
    active: i === activeStep && status !== 'success' && status !== 'failed',
    error: status === 'failed' && i === 1,
  }))
}

// ─── Alt Bileşenler ───────────────────────────────────────────────────────────

function PipelineDot({
  done, active, error,
}: { done: boolean; active: boolean; error: boolean }) {
  if (error) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[var(--red-dim)] border-[1.5px] border-[rgba(239,68,68,0.3)]">
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="var(--red)" strokeWidth="2">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </div>
    )
  }
  if (done) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[var(--green-dim)] border-[1.5px] border-[rgba(34,197,94,0.3)]">
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="var(--green)" strokeWidth="2">
          <path d="M2 6l3 3 5-4" />
        </svg>
      </div>
    )
  }
  if (active) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-[var(--yellow-dim)] border-[1.5px] border-[rgba(234,179,8,0.3)] animate-[dot-pulse_1.4s_infinite]">
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="var(--yellow)" strokeWidth="1.5" className="animate-spin">
          <path d="M6 1a5 5 0 1 0 5 5" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full shrink-0 bg-[var(--bg-4)] border-[1.5px] border-[var(--border-2)]" />
  )
}

function DeploymentCard({
  deployment,
  selected,
  onClick,
  onCancel,
  onRetry,
}: {
  deployment: DbDeployment
  selected: boolean
  onClick: () => void
  onCancel: (id: string) => void
  onRetry: (id: string) => void
}) {
  const cfg = statusConfig(deployment.status)
  const pipeline = getPipelineSteps(deployment.status)
  const isBuilding = deployment.status === 'building'
  const isFailed = deployment.status === 'failed'
  const isSuccess = deployment.status === 'success'
  const isQueued = deployment.status === 'queued'

  const shortRef = deployment.platform_deploy_id
    ? deployment.platform_deploy_id.split('@')[1]?.slice(0, 7) ?? ''
    : ''

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg-2)] border rounded-[10px] overflow-hidden cursor-pointer transition-all duration-150 ${
        selected
          ? 'border-[rgba(99,102,241,0.25)] shadow-[0_0_0_1px_rgba(99,102,241,0.25)]'
          : 'border-[var(--border)] hover:border-[var(--border-2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
      }`}
    >
      <div className="flex">
        {/* Sol renkli şerit */}
        <div className={`w-[3px] shrink-0 ${cfg.stripe}`} />

        <div className="flex-1 p-[14px_16px] min-w-0">
          {/* Başlık satırı */}
          <div className="flex items-start justify-between mb-[10px]">
            <div>
              <div className="text-[13px] font-semibold text-[var(--text)] tracking-[-0.01em]">
                {deployment.project_name}
              </div>
              <div className="font-mono text-[10px] text-[var(--text-3)] mt-[2px]">
                #{deployment.platform_deploy_id?.split('@')[0] ?? deployment.id.slice(0, 8)} · {deployment.branch}
                {shortRef ? `@${shortRef}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Durum badge */}
              <span className={`inline-flex items-center gap-[5px] px-2 py-[2px] rounded-full font-mono text-[10px] ${
                deployment.status === 'success'
                  ? 'bg-[rgba(34,197,94,0.1)] text-[var(--green)]'
                  : deployment.status === 'building'
                  ? 'bg-[rgba(234,179,8,0.1)] text-[var(--yellow)]'
                  : deployment.status === 'failed'
                  ? 'bg-[rgba(239,68,68,0.1)] text-[var(--red)]'
                  : 'bg-[var(--bg-4)] text-[var(--text-3)]'
              }`}>
                <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${
                  deployment.status === 'success' ? 'bg-[var(--green)]'
                  : deployment.status === 'building' ? 'bg-[var(--yellow)] animate-[dot-pulse_1.4s_infinite]'
                  : deployment.status === 'failed' ? 'bg-[var(--red)]'
                  : 'bg-[var(--text-4)]'
                }`} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Building: indeterminate progress */}
          {isBuilding && (
            <div className="mb-[8px]">
              <div className="flex justify-between mb-[4px] font-mono text-[10px] text-[var(--text-3)]">
                <span>Building...</span>
                <span className="text-[var(--yellow)]">In progress</span>
              </div>
              <div className="h-[2px] bg-[var(--border-2)] rounded-[1px] overflow-hidden relative">
                <div
                  className="h-full w-[40%] rounded-[1px] absolute"
                  style={{
                    background: 'linear-gradient(90deg, var(--yellow), var(--accent))',
                    animation: 'indeterminate 1.6s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          )}

          {/* Failed: hata mesajı */}
          {isFailed && deployment.error_message && (
            <div className="px-[10px] py-[7px] bg-[var(--red-dim)] border border-[rgba(239,68,68,0.15)] rounded-[5px] mb-[8px] font-mono text-[10px] text-[var(--red)]">
              ✗ {deployment.error_message}
            </div>
          )}

          {/* Pipeline */}
          <div className="flex items-center mb-[10px]">
            {pipeline.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex items-center gap-[5px] font-mono text-[10px]">
                  <PipelineDot done={step.done} active={step.active} error={step.error} />
                  <span className={
                    step.done ? 'text-[var(--text-2)]'
                    : step.active ? 'text-[var(--yellow)]'
                    : step.error ? 'text-[var(--red)]'
                    : 'text-[var(--text-3)]'
                  }>
                    {step.label}
                  </span>
                </div>
                {i < pipeline.length - 1 && (
                  <div className={`flex-1 h-[1px] mx-[5px] min-w-[10px] ${
                    step.done ? 'bg-[var(--green)] opacity-40' : 'bg-[var(--border)]'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <span className="font-mono text-[10px] text-[var(--text-3)] flex items-center gap-[4px]">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1" />
                </svg>
                {formatMs(deployment.duration_ms)}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-3)]">
                {relativeTime(deployment.queued_at)}
              </span>
              {isSuccess && (
                <span className="font-mono text-[10px] text-[var(--green)]">● Live</span>
              )}
              {isQueued && (
                <span className="font-mono text-[10px] text-[var(--yellow)]">Waiting...</span>
              )}
            </div>
            <div className="flex gap-[4px]">
              {isSuccess && deployment.deploy_url && (
                <a
                  href={deployment.deploy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="px-[9px] py-[5px] font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] rounded-[var(--radius)] transition-all duration-100"
                >
                  Visit →
                </a>
              )}
              {isFailed && (
                <button
                  onClick={e => { e.stopPropagation(); onRetry(deployment.id) }}
                  className="px-[9px] py-[5px] font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] rounded-[var(--radius)] transition-all duration-100"
                >
                  Retry
                </button>
              )}
              {isQueued && (
                <button
                  onClick={e => { e.stopPropagation(); onCancel(deployment.id) }}
                  className="px-[9px] py-[5px] font-mono text-[11px] text-[var(--red)] hover:bg-[var(--red-dim)] rounded-[var(--radius)] transition-all duration-100"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onClick() }}
                className="px-[9px] py-[5px] font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] rounded-[var(--radius)] transition-all duration-100"
              >
                Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Deploy New Modal ─────────────────────────────────────────────────────────

function DeployModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: { project_name: string; platform: string; branch: string }) => Promise<void>
}) {
  const [projectName, setProjectName] = useState('')
  const [platform, setPlatform] = useState<'vercel' | 'railway' | 'fly' | 'custom'>('vercel')
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    setLoading(true)
    try {
      await onSubmit({ project_name: projectName.trim(), platform, branch: branch.trim() || 'main' })
      setProjectName('')
      setBranch('main')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deploy New" description="Start a new deployment" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-medium text-[var(--text-2)] mb-[6px]">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="MyProject — v1.0.0"
            autoFocus
            className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-2)] mb-[6px]">Platform</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value as typeof platform)}
              className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] text-[var(--text)] font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="vercel">Vercel</option>
              <option value="railway">Railway</option>
              <option value="fly">Fly.io</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-2)] mb-[6px]">Branch</label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-3 py-[9px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] font-mono focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-[9px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[var(--radius)] text-[13px] font-medium hover:bg-[var(--bg-3)] transition-all duration-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!projectName.trim() || loading}
            className="flex-1 px-4 py-[9px] bg-[var(--accent)] text-white rounded-[var(--radius)] text-[13px] font-medium hover:bg-[#5558e8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
                  <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2l6 12H2L8 2z" />
                </svg>
                Deploy
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Log Terminal (sağ panel) ─────────────────────────────────────────────────

function LogTerminal({ deployment }: { deployment: DbDeployment | null }) {
  const termRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchLogs = useCallback(async (dep: DbDeployment) => {
    // Önceki stream'i iptal et
    abortRef.current?.abort()
    setLogs([])

    if (dep.status === 'building') {
      // SSE stream
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
      // Normal fetch
      const res = await fetch(`/api/deployments/${dep.id}/logs`)
      if (res.ok) {
        const json = await res.json() as { logs: LogLine[] }
        setLogs(json.logs ?? [])
      }
    }
  }, [])

  useEffect(() => {
    if (!deployment) { setLogs([]); return }
    fetchLogs(deployment)
    return () => { abortRef.current?.abort() }
  }, [deployment, fetchLogs])

  // Otomatik scroll
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [logs])

  const dotColor = !deployment ? 'var(--text-4)'
    : deployment.status === 'success'   ? 'var(--green)'
    : deployment.status === 'building'  ? 'var(--yellow)'
    : deployment.status === 'failed'    ? 'var(--red)'
    : 'var(--text-3)'

  const statusLabel = !deployment ? 'No selection'
    : deployment.status === 'success'   ? '● Live'
    : deployment.status === 'building'  ? '● Building'
    : deployment.status === 'failed'    ? '✗ Failed'
    : deployment.status === 'queued'    ? '◷ Queued'
    : '● Cancelled'

  const statusColor = !deployment ? 'var(--text-4)'
    : deployment.status === 'success'   ? 'var(--green)'
    : deployment.status === 'building'  ? 'var(--yellow)'
    : deployment.status === 'failed'    ? 'var(--red)'
    : 'var(--text-3)'

  function downloadLogs() {
    if (!logs.length) return
    const header = `# Deployment Logs — ${deployment?.project_name ?? 'unknown'}\n# Branch: ${deployment?.branch ?? '—'} | Status: ${deployment?.status ?? '—'}\n# Generated: ${new Date().toISOString()}\n\n`
    const text = header + logs.map(l => `[${l.time}] ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deployment-logs-${deployment?.id?.slice(0, 8) ?? 'unknown'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyLogs() {
    const text = logs.map(l => `[${l.time}] ${l.message}`).join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <>
      {/* Panel header */}
      <div className="px-[18px] py-[14px] border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-[7px] text-[12px] font-semibold text-[var(--text)]">
          <div
            className="w-[6px] h-[6px] rounded-full"
            style={{
              background: dotColor,
              animation: deployment?.status === 'building' ? 'dot-pulse 1.4s infinite' : undefined,
            }}
          />
          Build Logs
        </div>
        <div className="flex gap-[6px]">
          <button
            onClick={() => setLogs([])}
            className="px-[9px] py-[5px] font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] rounded-[var(--radius)] transition-all duration-100"
          >
            Clear
          </button>
          <button
            onClick={downloadLogs}
            disabled={!logs.length}
            className="px-[9px] py-[5px] font-mono text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] rounded-[var(--radius)] transition-all duration-100 flex items-center gap-[5px] disabled:opacity-40"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Log meta */}
      <div className="px-[18px] py-[14px] border-b border-[var(--border)] shrink-0 bg-[var(--bg-3)]">
        <div className="text-[14px] font-semibold text-[var(--text)] tracking-[-0.01em] mb-[8px]">
          {deployment?.project_name ?? 'No deployment selected'}
        </div>
        <div className="flex flex-wrap gap-[8px]">
          <span className="font-mono text-[10px] text-[var(--text-3)] flex items-center gap-[4px]">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1" />
            </svg>
            {formatMs(deployment?.duration_ms ?? null)}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-3)] flex items-center gap-[4px]">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10M8 3l5 5-5 5" />
            </svg>
            {deployment
              ? `${deployment.branch}${deployment.platform_deploy_id?.includes('@') ? `@${deployment.platform_deploy_id.split('@')[1]?.slice(0, 7)}` : ''}`
              : '—'
            }
          </span>
          <span className="font-mono text-[10px]" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={termRef}
        className="flex-1 overflow-y-auto bg-[var(--bg)] font-mono text-[11px] leading-[1.9] px-[16px] py-[14px] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]"
      >
        {logs.length === 0 ? (
          <div className="text-[var(--text-4)]">
            {deployment ? 'Loading logs...' : 'Select a deployment'}
          </div>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="flex gap-[10px]">
              <span className="text-[var(--text-4)] shrink-0 select-none">{line.time}</span>
              <span className={logLevelClass(line.level)}>{line.message || '\u00a0'}</span>
            </div>
          ))
        )}
        {streaming && (
          <div className="flex gap-[10px]">
            <span className="text-[var(--text-4)] select-none">&nbsp;</span>
            <span className="text-[var(--text-3)]">
              <span className="inline-block w-[6px] h-[12px] bg-[var(--text-3)] ml-[2px] align-middle animate-[blink_1.1s_step-end_infinite]" />
            </span>
          </div>
        )}
      </div>

      {/* Log footer */}
      <div className="px-[16px] py-[10px] border-t border-[var(--border)] flex items-center gap-[8px] shrink-0 bg-[var(--bg-2)]">
        <button
          onClick={downloadLogs}
          disabled={!logs.length}
          className="flex-1 px-3 py-[6px] text-[var(--text-2)] border border-[var(--border-2)] rounded-[var(--radius)] text-[11px] flex items-center justify-center gap-[6px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-100 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
          </svg>
          Download Logs
        </button>
        <button
          onClick={copyLogs}
          disabled={!logs.length}
          className="px-3 py-[6px] text-[var(--text-2)] border border-[var(--border-2)] rounded-[var(--radius)] text-[11px] flex items-center justify-center hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-100 disabled:opacity-40"
          title="Copy to clipboard"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3H2v9h2" />
          </svg>
        </button>
      </div>
    </>
  )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'success',   label: 'Success'   },
  { key: 'building',  label: 'Building'  },
  { key: 'failed',    label: 'Failed'    },
  { key: 'queued',    label: 'Queued'    },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function DeploymentsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Deploymentları çek
  const { data, isLoading, isError } = useQuery<DeploymentsResponse>({
    queryKey: ['deployments'],
    queryFn: async () => {
      const res = await fetch('/api/deployments')
      if (!res.ok) throw new Error('Fetch error')
      return res.json() as Promise<DeploymentsResponse>
    },
    refetchInterval: 8000, // Her 8s yenile (building durumu için)
  })

  const deployments = data?.deployments ?? []
  const stats = data?.stats

  // Filtreli liste
  const filtered = filter === 'all'
    ? deployments
    : deployments.filter(d => d.status === filter)

  // Seçili deployment
  const selectedDeployment = deployments.find(d => d.id === selectedId) ?? null

  // İlk deployment'ı otomatik seç
  useEffect(() => {
    if (!selectedId && deployments.length > 0) {
      setSelectedId(deployments[0].id)
    }
  }, [deployments, selectedId])

  // Yeni deployment oluştur
  const createMutation = useMutation({
    mutationFn: async (payload: { project_name: string; platform: string; branch: string }) => {
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Create failed')
      return res.json() as Promise<{ deployment: DbDeployment }>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
      setSelectedId(result.deployment.id)
    },
  })

  // İptal et
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/deployments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Cancel failed')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deployments'] }),
  })

  // Yeniden dene
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const dep = deployments.find(d => d.id === id)
      if (!dep) throw new Error('Not found')
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: dep.project_name,
          platform: dep.platform,
          branch: dep.branch,
        }),
      })
      if (!res.ok) throw new Error('Retry failed')
      return res.json() as Promise<{ deployment: DbDeployment }>
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
      setSelectedId(result.deployment.id)
    },
  })

  return (
    <div data-full-bleed className="overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Platform notice banner */}
      <div className="flex items-center gap-2 px-5 py-[7px] bg-[var(--bg-3)] border-b border-[var(--border)] shrink-0">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--yellow)" strokeWidth="1.5" className="shrink-0">
          <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12h.01" />
        </svg>
        <span className="font-mono text-[10px] text-[var(--text-3)]">
          Platform deployment pipeline (Vercel / Railway / Fly) is not yet connected. Deployments are tracked and logged locally.
        </span>
      </div>
      <div className="flex-1 overflow-hidden flex border-t border-[var(--border)]">

        {/* ═══ SOL: Deployment Listesi ═══════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[var(--border)] min-w-0">

          {/* İstatistik Şeridi */}
          <div className="flex border-b border-[var(--border)] shrink-0">
            {[
              { label: 'Total',    value: stats?.total ?? '—',    color: undefined },
              { label: 'Success',  value: stats?.success ?? '—',  color: 'var(--green)' },
              { label: 'Building', value: stats?.building ?? '—', color: 'var(--yellow)' },
              { label: 'Failed',   value: stats?.failed ?? '—',   color: 'var(--red)' },
              { label: 'Avg Time', value: formatMs(stats?.avg_duration_ms ?? null), color: undefined },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                className={`flex-1 px-4 py-[14px] text-center ${i < arr.length - 1 ? 'border-r border-[var(--border)]' : ''}`}
              >
                <span
                  className="block font-mono text-[20px] font-medium tracking-[-0.03em]"
                  style={{ color: item.color ?? 'var(--text)' }}
                >
                  {isLoading ? '—' : String(item.value)}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.08em] mt-[2px] block">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Filtre Bar */}
          <div className="flex items-center gap-[6px] px-5 py-[10px] border-b border-[var(--border)] shrink-0 bg-[var(--bg-2)]">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`font-mono text-[10px] px-[10px] py-[4px] rounded-[20px] cursor-pointer transition-all duration-100 border ${
                  filter === f.key
                    ? 'text-[var(--text)] bg-[var(--bg-4)] border-[var(--border-2)]'
                    : 'text-[var(--text-3)] bg-transparent border-transparent hover:text-[var(--text-2)]'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[var(--radius)] text-[12px] font-medium hover:bg-[#5558e8] transition-all duration-100"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2l6 12H2L8 2z" />
                </svg>
                Deploy New
              </button>
            </div>
          </div>

          {/* Deployment Listesi */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
            {isLoading ? (
              <div className="p-5 flex flex-col gap-[10px]">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] h-[120px] animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <ErrorState
                message="Could not load data."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['deployments'] })}
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                title={filter === 'all' ? 'No deployments yet' : `No deployments with status: ${filter}`}
                description={
                  filter === 'all'
                    ? 'Start your first deployment with "Deploy New"'
                    : 'Change the filter or start a new deployment'
                }
                action={filter === 'all' ? { label: 'Deploy New', onClick: () => setModalOpen(true) } : undefined}
              />
            ) : (
              <div className="p-[16px_20px] flex flex-col gap-[10px]">
                {filtered.map(dep => (
                  <DeploymentCard
                    key={dep.id}
                    deployment={dep}
                    selected={dep.id === selectedId}
                    onClick={() => setSelectedId(dep.id)}
                    onCancel={id => cancelMutation.mutate(id)}
                    onRetry={id => retryMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ SAĞ: Build Logs Paneli ════════════════════════════════════ */}
        <div className="w-[360px] min-w-[360px] flex flex-col overflow-hidden bg-[var(--bg-2)]">
          <LogTerminal deployment={selectedDeployment} />
        </div>

      </div>

      {/* Deploy New Modal */}
      <DeployModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data)
        }}
      />
    </div>
  )
}
