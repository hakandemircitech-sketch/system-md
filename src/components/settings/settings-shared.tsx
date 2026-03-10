'use client'

import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  plan: 'free' | 'solo' | 'agency'
  timezone: string | null
  language: string | null
  blueprint_count: number
  api_tokens_used: number
  deployment_count: number
}

export interface NotificationPrefs {
  blueprint_generated: boolean
  deployment_complete: boolean
  usage_warnings: boolean
  weekly_digest: boolean
  product_updates: boolean
  realtime_alerts: boolean
  sound_effects: boolean
}

export interface AIPrefs {
  model: string
  streaming: boolean
  auto_save: boolean
  include_market_data: boolean
  default_industry: string
}

export interface ApiKey {
  id: string
  provider: 'anthropic' | 'openai' | 'stripe' | 'resend'
  label: string
  desc: string
  value: string
  connected: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return name.trim()[0]?.toUpperCase() ?? '?'
  }
  return (email[0] ?? '?').toUpperCase()
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
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

export function SettingsCard({
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

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-semibold text-[var(--text)] px-5 pt-4 mb-4">{children}</div>
  )
}

export function SettingRow({
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
        {desc && <div className="text-[12px] text-[var(--text-3)] leading-[1.5]">{desc}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export function FieldInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  className,
  onBlur,
}: {
  type?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  onBlur?: () => void
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      className={`px-3 py-2 bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[13px] font-sans text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-4)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] ${readOnly ? 'opacity-70 cursor-not-allowed' : ''} ${className ?? 'w-[220px]'}`}
    />
  )
}

export function FieldSelect({
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

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
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

// ─── Save Button ──────────────────────────────────────────────────────────────

export function SaveButton({
  saving,
  onClick,
  label = 'Save Changes',
  type = 'button',
}: {
  saving: boolean
  onClick?: () => void
  label?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
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
      {label}
    </button>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function SectionSkeleton() {
  return (
    <div className="max-w-[640px] flex flex-col gap-4">
      <div className="h-6 w-32 bg-[var(--bg-2)] border border-[var(--border)] rounded-[4px] animate-pulse" />
      <div className="h-4 w-64 bg-[var(--bg-2)] border border-[var(--border)] rounded-[4px] animate-pulse mb-3" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[120px] bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] animate-pulse" />
      ))}
    </div>
  )
}
