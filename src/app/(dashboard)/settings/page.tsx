'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { ErrorState } from '@/components/ui/ErrorState'

import { ProfileSection } from '@/components/settings/ProfileSection'
import { SecuritySection } from '@/components/settings/SecuritySection'
import { NotificationsSection } from '@/components/settings/NotificationsSection'
import { APISection } from '@/components/settings/APISection'

import type { UserProfile, NotificationPrefs, AIPrefs } from '@/components/settings/settings-shared'

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'ai'
  | 'api'
  | 'integrations'
  | 'shortcuts'
  | 'danger'

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  blueprint_generated: true,
  deployment_complete: true,
  usage_warnings: true,
  weekly_digest: false,
  product_updates: true,
  realtime_alerts: true,
  sound_effects: false,
}

const DEFAULT_AI: AIPrefs = {
  model: 'claude-sonnet-4-6',
  streaming: true,
  auto_save: true,
  include_market_data: false,
  default_industry: 'No default',
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-[36px] h-[20px] rounded-[10px] border relative cursor-pointer transition-all duration-200 shrink-0 ${
        on
          ? 'bg-[var(--accent)] border-[var(--accent)]'
          : 'bg-[var(--bg-4)] border-[var(--border-2)]'
      }`}
    >
      <span
        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-200 ${
          on ? 'left-[18px] bg-white' : 'left-[2px] bg-[var(--text-3)]'
        }`}
      />
    </button>
  )
}

// ─── Settings Card ────────────────────────────────────────────────────────────

function SettingsCard({
  children,
  danger = false,
}: {
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div
      className={`bg-[var(--bg-2)] border rounded-[8px] overflow-hidden mb-4 ${
        danger ? 'border-[rgba(239,68,68,0.2)]' : 'border-[var(--border)]'
      }`}
    >
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-semibold text-[var(--text)] px-5 pt-4 mb-4">{children}</div>
  )
}

function SettingRow({
  label,
  desc,
  children,
  align = 'center',
}: {
  label: React.ReactNode
  desc?: React.ReactNode
  children: React.ReactNode
  align?: 'center' | 'top'
}) {
  return (
    <div
      className={`flex justify-between gap-6 px-5 py-[14px] border-b border-[var(--border)] last:border-b-0 ${
        align === 'top' ? 'items-start' : 'items-center'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[var(--text)] mb-[3px]">{label}</div>
        {desc && <div className="text-[12px] text-[var(--text-2)] leading-[1.5]">{desc}</div>}
      </div>
      {children}
    </div>
  )
}

function FieldSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 pr-8 bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[12px] font-sans text-[var(--text)] outline-none cursor-pointer w-[160px] appearance-none focus:border-[var(--accent)] transition-colors"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6l4 4 4-4' stroke='%2352525b' stroke-width='1.5'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[var(--bg-3)]">
          {o}
        </option>
      ))}
    </select>
  )
}

function Badge({
  variant,
  children,
}: {
  variant: 'green' | 'yellow' | 'indigo' | 'neutral' | 'red'
  children: React.ReactNode
}) {
  const styles = {
    green: 'bg-[var(--green-dim)] text-[var(--green)]',
    yellow: 'bg-[var(--yellow-dim)] text-[var(--yellow)]',
    indigo: 'bg-[var(--accent-dim)] text-[var(--accent)]',
    neutral: 'bg-[var(--bg-4)] text-[var(--text-3)]',
    red: 'bg-[var(--red-dim)] text-[var(--red)]',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-[20px] font-mono text-[10px] ${styles[variant]}`}
    >
      {children}
    </span>
  )
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────

function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (!open) setConfirmText('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[var(--bg-2)] border border-[rgba(239,68,68,0.3)] rounded-[10px] shadow-[0_24px_48px_rgba(0,0,0,0.5)] animate-[fadeUp_0.25s_ease]">
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--red)" strokeWidth="1.5">
                <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" />
              </svg>
              <h2 className="text-[15px] font-semibold text-[var(--text)]">Delete Account</h2>
            </div>
            <p className="text-[12px] text-[var(--text-3)]">
              This action cannot be undone. All blueprints and data will be permanently deleted.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[5px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-3)] transition-all ml-4 shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="p-3 bg-[var(--red-dim)] border border-[rgba(239,68,68,0.2)] rounded-[6px] text-[12px] text-[var(--red)]">
            To confirm, type{' '}
            <span className="font-mono font-semibold">DELETE</span> below.
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] font-mono text-[var(--text)] outline-none focus:border-[var(--red)] transition-colors placeholder:text-[var(--text-4)]"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--bg-3)] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={confirmText !== 'DELETE' || loading}
              className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--red)] border border-[rgba(239,68,68,0.3)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--red-dim)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9" />
                </svg>
              )}
              Permanently Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AI Model Section (workspace-only, stays in page) ─────────────────────────

function AIModelSection({
  prefs,
  onChange,
  onSave,
  saving,
}: {
  prefs: AIPrefs
  onChange: (prefs: AIPrefs) => void
  onSave: () => Promise<void>
  saving: boolean
}) {
  const models = [
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      desc: 'Best for fast ideation — low latency, low cost',
      badge: { variant: 'neutral' as const, label: 'Fast' },
    },
    {
      id: 'claude-sonnet-4-6',
      name: 'Claude Sonnet 4.6',
      desc: 'Best balance of speed and output quality',
      badge: { variant: 'indigo' as const, label: 'Recommended' },
    },
    {
      id: 'claude-opus-4-6',
      name: 'Claude Opus 4.6',
      desc: 'Maximum depth — slower, higher token cost',
      badge: { variant: 'yellow' as const, label: 'Powerful' },
    },
  ]

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">AI Model</div>
      <div className="text-[13px] text-[var(--text-3)] mb-7">Select the default AI model for blueprint generation.</div>

      <SettingsCard>
        <CardTitle>Default Model</CardTitle>
        <div className="flex flex-col gap-[6px] px-5 pb-4">
          {models.map((m) => {
            const selected = prefs.model === m.id
            return (
              <div
                key={m.id}
                onClick={() => onChange({ ...prefs, model: m.id })}
                className={`flex items-center gap-3 px-[14px] py-3 border rounded-[var(--radius)] cursor-pointer transition-all ${
                  selected
                    ? 'border-[var(--accent-border)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border)] bg-[var(--bg-3)] hover:border-[var(--border-2)]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                    selected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border-2)]'
                  }`}
                >
                  {selected && <span className="w-[6px] h-[6px] rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-[6px]">
                    <span className="text-[12px] font-medium text-[var(--text)]">{m.name}</span>
                    <Badge variant={m.badge.variant}>{m.badge.label}</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--text-3)] mt-[2px]">{m.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard>
        <CardTitle>Generation Preferences</CardTitle>
        <SettingRow label="Streaming output" desc="Show blueprint as it is being generated in real time.">
          <Toggle on={prefs.streaming} onChange={(v) => onChange({ ...prefs, streaming: v })} />
        </SettingRow>
        <SettingRow label="Auto-save" desc="Automatically save to library after generation.">
          <Toggle on={prefs.auto_save} onChange={(v) => onChange({ ...prefs, auto_save: v })} />
        </SettingRow>
        <SettingRow label="Include market data" desc="Pull live data for TAM/SAM estimates.">
          <Toggle on={prefs.include_market_data} onChange={(v) => onChange({ ...prefs, include_market_data: v })} />
        </SettingRow>
        <SettingRow label="Default industry" desc="Pre-select when opening Idea Generator." align="top">
          <FieldSelect
            value={prefs.default_industry}
            onChange={(v) => onChange({ ...prefs, default_industry: v })}
            options={['No default', 'SaaS / B2B', 'FinTech', 'HealthTech', 'EdTech', 'AI Tools']}
          />
        </SettingRow>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          onClick={() => void onSave()}
          disabled={saving}
          className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-medium cursor-pointer hover:bg-[#5558e8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 2h8l3 3v9H2V2zM6 2v5h5" />
            </svg>
          )}
          Save Changes
        </button>
      </div>
    </div>
  )
}

// ─── Integrations Section ─────────────────────────────────────────────────────

function IntegrationsSection() {
  const integrations: { id: string; name: string; desc: string; icon: React.ReactNode; status: 'planned' | 'active' }[] = [
    {
      id: 'github',
      name: 'GitHub',
      desc: 'Push build kits directly to repositories',
      status: 'planned',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M6 11.5c-3.5 1-3.5-2-5-2.5M11 14v-2.7a2.4 2.4 0 00-.7-1.8c2.3-.3 4.7-1.1 4.7-5A3.9 3.9 0 0014 2a3.5 3.5 0 00-.1 2.7S12.7 5 11 5c-1.7 0-2.9-.3-2.9-.3A3.5 3.5 0 008 2a3.9 3.9 0 00-1 2.8c0 3.9 2.4 4.7 4.7 5a2.4 2.4 0 00-.7 1.8V14" />
        </svg>
      ),
    },
    {
      id: 'deploy',
      name: 'Cloud Deploy',
      desc: 'One-click deploy from the Deployments page',
      status: 'planned',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M8 10V4M5.5 6.5L8 4l2.5 2.5" />
          <path d="M3 10.5a3 3 0 01.5-5.8A4 4 0 0111.5 6a2.5 2.5 0 010 5H3z" />
        </svg>
      ),
    },
    {
      id: 'supabase',
      name: 'Supabase',
      desc: 'Your database is already powered by Supabase',
      status: 'active',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <ellipse cx="8" cy="5" rx="5" ry="2" />
          <path d="M3 5v6c0 1.1 2.2 2 5 2s5-.9 5-2V5" />
          <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />
        </svg>
      ),
    },
    {
      id: 'slack',
      name: 'Slack',
      desc: 'Get build and deployment notifications in Slack',
      status: 'planned',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'linear',
      name: 'Linear',
      desc: 'Auto-create issues from blueprint roadmap',
      status: 'planned',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M2 5h12M2 8h8M2 11h10" />
        </svg>
      ),
    },
  ]

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">Integrations</div>
      <div className="text-[13px] text-[var(--text-3)] mb-5">Connect SystemMD to your tools and services.</div>

      <div className="flex items-start gap-2 mb-5 px-4 py-[10px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-md)] text-[11px]">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--blue)" strokeWidth="1.5" className="shrink-0 mt-[1px]">
          <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5h.01" />
        </svg>
        <span className="text-[var(--text-3)]">
          OAuth integrations are currently in development. Supabase is already active as your backend. Other integrations will be available in an upcoming release.
        </span>
      </div>

      <SettingsCard>
        {integrations.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-5 py-[14px] border-b border-[var(--border)] last:border-b-0"
          >
            <div
              className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-2)] border border-[var(--border-2)] bg-[var(--bg-3)] shrink-0"
            >
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-[var(--text)]">{item.name}</div>
              <div className="text-[11px] text-[var(--text-3)] mt-[1px]">{item.desc}</div>
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'active' ? (
                <Badge variant="green">Active</Badge>
              ) : (
                <Badge variant="neutral">Coming soon</Badge>
              )}
              {item.status !== 'active' && (
                <button
                  disabled
                  className="inline-flex items-center gap-[6px] px-3 py-[6px] rounded-[6px] text-[11px] border opacity-40 cursor-not-allowed border-[var(--border-2)] text-[var(--text-3)]"
                  title="Integration not yet available"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </SettingsCard>
    </div>
  )
}

// ─── Shortcuts Section ────────────────────────────────────────────────────────

function ShortcutsSection() {
  const navShortcuts = [
    { label: 'Open command palette', keys: ['⌘', 'K'] },
    { label: 'Toggle sidebar', keys: ['⌘', 'B'] },
    { label: 'Go to Dashboard', keys: ['G', 'D'] },
    { label: 'Go to Library', keys: ['G', 'L'] },
    { label: 'Go to Build Center', keys: ['G', 'B'] },
  ]
  const actionShortcuts = [
    { label: 'Generate blueprint', keys: ['⌘', '⏎'] },
    { label: 'New blueprint', keys: ['⌘', 'N'] },
    { label: 'Save to library', keys: ['⌘', 'S'] },
    { label: 'Run SQL query', keys: ['⌘', '⏎'] },
    { label: 'Close / Cancel', keys: ['Esc'] },
  ]

  function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
    return (
      <div className="flex items-center justify-between px-5 py-[11px] border-b border-[var(--border)] last:border-b-0">
        <span className="text-[12px] text-[var(--text-2)]">{label}</span>
        <div className="flex gap-1">
          {keys.map((k, i) => (
            <span
              key={i}
              className="font-mono text-[10px] text-[var(--text-2)] bg-[var(--bg-4)] border border-[var(--border-2)] rounded-[4px] px-[7px] py-[2px] min-w-6 text-center"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">Keyboard Shortcuts</div>
      <div className="text-[13px] text-[var(--text-3)] mb-7">Speed up your workflow with these shortcuts.</div>

      <SettingsCard>
        <CardTitle>Navigation</CardTitle>
        {navShortcuts.map((s) => <ShortcutRow key={s.label} {...s} />)}
      </SettingsCard>

      <SettingsCard>
        <CardTitle>Actions</CardTitle>
        {actionShortcuts.map((s) => <ShortcutRow key={s.label} {...s} />)}
      </SettingsCard>
    </div>
  )
}

// ─── Danger Section ───────────────────────────────────────────────────────────

function DangerSection({
  blueprintCount,
  onClearLibrary,
  onDeleteAccount,
}: {
  blueprintCount: number
  onClearLibrary: () => Promise<void>
  onDeleteAccount: () => Promise<void>
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [clearingLibrary, setClearingLibrary] = useState(false)

  async function handleClearLibrary() {
    setClearingLibrary(true)
    await onClearLibrary()
    setClearingLibrary(false)
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    await onDeleteAccount()
    setDeletingAccount(false)
    setDeleteModalOpen(false)
  }

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--red)] tracking-[-0.02em] mb-1">Danger Zone</div>
      <div className="text-[13px] text-[var(--text-3)] mb-7">These actions are irreversible. Proceed with caution.</div>

      <div className="bg-[var(--bg-2)] border border-[rgba(239,68,68,0.2)] rounded-[8px] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-[14px] border-b border-[rgba(239,68,68,0.15)]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--red)" strokeWidth="1.5">
            <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" />
          </svg>
          <span className="text-[12px] font-semibold text-[var(--red)]">Destructive Actions</span>
        </div>

        <SettingRow
          label="Delete all blueprints"
          desc={`Permanently deletes all ${blueprintCount} blueprints in your library.`}
        >
          <button
            onClick={() => void handleClearLibrary()}
            disabled={clearingLibrary || blueprintCount === 0}
            className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--red)] border border-[rgba(239,68,68,0.3)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--red-dim)] hover:border-[var(--red)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {clearingLibrary ? (
              <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : null}
            Clear Library
          </button>
        </SettingRow>

        <SettingRow
          label="Revoke all API keys"
          desc="Immediately invalidate all active API keys."
        >
          <button
            onClick={() => toast.warning('API key management coming soon')}
            className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-3)] border border-[var(--border-2)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--bg-3)] transition-all opacity-60"
            title="Coming soon"
          >
            Revoke All
          </button>
        </SettingRow>

        <SettingRow
          label="Delete account"
          desc="Permanently delete your account and all data. This cannot be undone."
        >
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--red)] border border-[rgba(239,68,68,0.3)] rounded-[6px] text-[12px] cursor-pointer hover:bg-[var(--red-dim)] hover:border-[var(--red)] transition-all"
          >
            Delete Account
          </button>
        </SettingRow>
      </div>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
        loading={deletingAccount}
      />
    </div>
  )
}

// ─── Nav Items ────────────────────────────────────────────────────────────────

interface NavItem {
  id: Section
  label: string
  group: 'account' | 'workspace' | 'danger'
  icon: React.ReactNode
  danger?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    group: 'account',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="6" r="3" /><path d="M2 13c0-2.2 2.7-4 6-4s6 1.8 6 4" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    group: 'account',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2L3 4.5v4C3 11 5.2 13.3 8 14c2.8-.7 5-3 5-5.5v-4L8 2z" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    group: 'account',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2a4 4 0 014 4c0 2 .5 3 1 4H3c.5-1 1-2 1-4a4 4 0 014-4z" />
        <path d="M6.5 12a1.5 1.5 0 003 0" />
      </svg>
    ),
  },
  {
    id: 'ai',
    label: 'AI Model',
    group: 'workspace',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
      </svg>
    ),
  },
  {
    id: 'api',
    label: 'API Keys',
    group: 'workspace',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6l-3 2 3 2M12 6l3 2-3 2M9 4l-2 8" />
      </svg>
    ),
  },
  {
    id: 'integrations',
    label: 'Integrations',
    group: 'workspace',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" /><path d="M9 11.5h5M11.5 9v5" />
      </svg>
    ),
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    group: 'workspace',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="5" height="4" rx="1" /><rect x="9" y="4" width="5" height="4" rx="1" />
        <rect x="2" y="10" width="5" height="3" rx="1" /><rect x="9" y="10" width="5" height="3" rx="1" />
      </svg>
    ),
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    group: 'danger',
    danger: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" />
      </svg>
    ),
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS)
  const [aiPrefs, setAiPrefs] = useState<AIPrefs>(DEFAULT_AI)
  const [prefsSaving, setPrefsSaving] = useState(false)

  const loadUser = useCallback(async () => {
    setLoadError(null)
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, username, plan, plan_expires_at, timezone, language, blueprint_count, api_tokens_used, deployment_count, created_at, updated_at')
        .eq('id', authUser.id)
        .single()

      const p: UserProfile = (profile as UserProfile | null) ?? {
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: (authUser.user_metadata?.full_name as string | null) ?? null,
        avatar_url: (authUser.user_metadata?.avatar_url as string | null) ?? null,
        username: null,
        plan: 'free',
        timezone: 'UTC+3 Istanbul',
        language: 'English',
        blueprint_count: 0,
        api_tokens_used: 0,
        deployment_count: 0,
      }
      setUser(p)

      const meta = authUser.user_metadata ?? {}
      if (meta.notifications) setNotifications(meta.notifications as NotificationPrefs)
      if (meta.ai_preferences) setAiPrefs(meta.ai_preferences as AIPrefs)

      setLoading(false)
    } catch {
      setLoadError('Could not load settings. Please refresh the page.')
      setLoading(false)
    }
  }, [router])

  useEffect(() => { void loadUser() }, [loadUser])

  async function handleProfileSave(data: Partial<UserProfile>) {
    const res = await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = (await res.json()) as { ok: boolean; error?: string }
    if (json.ok) {
      setUser((prev) => (prev ? { ...prev, ...data } : prev))
      toast.success('Profile saved')
    } else {
      toast.error(json.error ?? 'Could not save profile')
    }
  }

  async function handlePasswordChange(currentPw: string, newPw: string) {
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
    })
    const json = (await res.json()) as { ok: boolean; error?: string }
    if (json.ok) {
      toast.success('Password updated')
    } else {
      toast.error(json.error ?? 'Could not update password')
    }
  }

  async function handlePrefsSave(type: 'notifications' | 'ai') {
    setPrefsSaving(true)
    const payload = type === 'notifications' ? { notifications } : { ai: aiPrefs }
    const res = await fetch('/api/settings/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = (await res.json()) as { ok: boolean; error?: string }
    if (json.ok) {
      toast.success('Preferences saved')
    } else {
      toast.error(json.error ?? 'Could not save preferences')
    }
    setPrefsSaving(false)
  }

  async function handleClearLibrary() {
    const res = await fetch('/api/settings/danger?action=clear-library', { method: 'DELETE' })
    const json = (await res.json()) as { ok: boolean; error?: string }
    if (json.ok) {
      setUser((prev) => (prev ? { ...prev, blueprint_count: 0 } : prev))
      toast.success('Library cleared')
    } else {
      toast.error(json.error ?? 'Could not clear library')
    }
  }

  async function handleDeleteAccount() {
    const res = await fetch('/api/settings/danger?action=delete-account', { method: 'DELETE' })
    const json = (await res.json()) as { ok: boolean; error?: string }
    if (json.ok) {
      toast.success('Account deleted')
      router.push('/')
    } else {
      toast.error(json.error ?? 'Could not delete account')
    }
  }

  const accountItems = NAV_ITEMS.filter((i) => i.group === 'account')
  const workspaceItems = NAV_ITEMS.filter((i) => i.group === 'workspace')
  const dangerItems = NAV_ITEMS.filter((i) => i.group === 'danger')

  return (
    <div style={{ margin: '-32px -40px', height: 'calc(100vh - 52px)', display: 'flex', overflow: 'hidden' }}>
      {/* ── Settings Nav ── */}      <nav className="w-[200px] min-w-[200px] border-r border-[var(--border)] bg-[var(--bg-2)] flex flex-col gap-[2px] p-[10px] overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
        <div className="font-mono text-[9px] text-[var(--text-4)] uppercase tracking-[0.12em] px-2 pt-[10px] pb-1">
          Account
        </div>
        {accountItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-[9px] py-[7px] rounded-[var(--radius)] cursor-pointer text-[12px] transition-all border w-full text-left ${
              activeSection === item.id
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent-border)] font-medium border-l-2 border-l-[var(--accent)] pl-[10px] pr-[10px]'
                : 'text-[var(--text-2)] border-transparent hover:bg-[var(--bg-3)] hover:text-[var(--text)] px-[10px]'
            }`}
          >
            <span className={`shrink-0 ${activeSection === item.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}

        <div className="font-mono text-[9px] text-[var(--text-4)] uppercase tracking-[0.12em] px-2 pt-[10px] pb-1 mt-1">
          Workspace
        </div>
        {workspaceItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-[9px] py-[7px] rounded-[var(--radius)] cursor-pointer text-[12px] transition-all border w-full text-left ${
              activeSection === item.id
                ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent-border)] font-medium border-l-2 border-l-[var(--accent)] pl-[10px] pr-[10px]'
                : 'text-[var(--text-2)] border-transparent hover:bg-[var(--bg-3)] hover:text-[var(--text)] px-[10px]'
            }`}
          >
            <span className={`shrink-0 ${activeSection === item.id ? 'opacity-100' : 'opacity-60'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}

        <div className="font-mono text-[9px] text-[var(--text-4)] uppercase tracking-[0.12em] px-2 pt-[10px] pb-1 mt-1">
          Danger
        </div>
        {dangerItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex items-center gap-[9px] py-[7px] rounded-[var(--radius)] cursor-pointer text-[12px] transition-all border w-full text-left ${
              activeSection === item.id
                ? 'bg-[var(--red-dim)] text-[var(--red)] border-[rgba(239,68,68,0.3)] font-medium border-l-2 border-l-[var(--red)] pl-[10px] pr-[10px]'
                : 'text-[var(--red)] border-transparent hover:bg-[var(--red-dim)] px-[10px]'
            }`}
          >
            <span className="shrink-0 opacity-100">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Settings Main ── */}
      <div className="flex-1 overflow-y-auto px-10 py-8 bg-[var(--bg)] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-full">
        {loadError ? (
          <ErrorState message={loadError} onRetry={() => void loadUser()} />
        ) : (
        <>
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
          {activeSection === 'profile' && (
            <ProfileSection user={user} loading={loading} onSave={handleProfileSave} />
          )}
          {activeSection === 'security' && (
            <SecuritySection loading={loading} onPasswordChange={handlePasswordChange} />
          )}
          {activeSection === 'notifications' && (
            <NotificationsSection
              prefs={notifications}
              loading={loading}
              onChange={setNotifications}
              onSave={() => handlePrefsSave('notifications')}
              saving={prefsSaving}
            />
          )}
          {activeSection === 'ai' && (
            <AIModelSection
              prefs={aiPrefs}
              onChange={setAiPrefs}
              onSave={() => handlePrefsSave('ai')}
              saving={prefsSaving}
            />
          )}
          {activeSection === 'api' && <APISection loading={loading} />}
          {activeSection === 'integrations' && <IntegrationsSection />}
          {activeSection === 'shortcuts' && <ShortcutsSection />}
          {activeSection === 'danger' && user && (
            <DangerSection
              blueprintCount={user.blueprint_count}
              onClearLibrary={handleClearLibrary}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}
