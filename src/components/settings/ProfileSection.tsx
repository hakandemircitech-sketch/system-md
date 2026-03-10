'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  UserProfile,
  SettingsCard,
  CardTitle,
  SettingRow,
  FieldInput,
  FieldSelect,
  SaveButton,
  SectionSkeleton,
  initials,
} from './settings-shared'

function UsageBar({
  label, used, limit, suffix = '', pct, color,
}: {
  label: string; used: number; limit: number; suffix?: string; pct: number; color: string
}) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] text-[var(--text-3)] mb-[5px]">
        <span>{label}</span>
        <span style={{ color: 'var(--text)' }}>{used}{suffix} / {limit}{suffix}</span>
      </div>
      <div className="h-[4px] bg-[var(--border-2)] rounded-[2px] overflow-hidden">
        <div
          className="h-full rounded-[2px] transition-[width] duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

interface ProfileSectionProps {
  user: UserProfile | null
  loading?: boolean
  onSave: (data: Partial<UserProfile>) => Promise<void>
}

export function ProfileSection({ user, loading = false, onSave }: ProfileSectionProps) {
  const [name, setName] = useState(user?.full_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC+3 Istanbul')
  const [language, setLanguage] = useState(user?.language ?? 'English')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  if (loading || !user) return <SectionSkeleton />

  const planLimits = {
    free: { blueprints: 20, tokens: 100000, deployments: 5 },
    solo: { blueprints: 999, tokens: 1000000, deployments: 20 },
    agency: { blueprints: 9999, tokens: 10000000, deployments: 100 },
  }[user.plan]

  const bpPct = Math.min((user.blueprint_count / planLimits.blueprints) * 100, 100)
  const tokenPct = Math.min((user.api_tokens_used / planLimits.tokens) * 100, 100)
  const depPct = Math.min((user.deployment_count / planLimits.deployments) * 100, 100)
  const overallPct = Math.round((bpPct + tokenPct + depPct) / 3)

  const circumference = 2 * Math.PI * 22
  const strokeDashoffset = circumference - (overallPct / 100) * circumference

  async function handleSave() {
    setSaving(true)
    await onSave({ full_name: name, username, timezone, language })
    setSaving(false)
    setDirty(false)
  }

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">Profile</div>
      <div className="text-[13px] text-[var(--text-3)] mb-7">Manage your personal information and display preferences.</div>

      {/* Avatar card */}
      <SettingsCard>
        <div className="flex items-center gap-4 p-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] flex items-center justify-center text-[20px] font-semibold text-white shrink-0 relative group cursor-pointer">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt="Avatar"
                fill
                sizes="56px"
                className="rounded-full object-cover"
              />
            ) : (
              initials(user.full_name, user.email)
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M10 2l4 4-8 8H2v-4L10 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold text-[var(--text)] mb-[3px]">
              {user.full_name ?? 'User'}
            </div>
            <div className="font-mono text-[11px] text-[var(--text-3)]">{user.email}</div>
          </div>
          <button className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] cursor-pointer hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all">
            Change photo
          </button>
        </div>
      </SettingsCard>

      {/* Personal info */}
      <SettingsCard>
        <CardTitle>Personal Info</CardTitle>
        <SettingRow label="Full name" desc="Displayed in your workspace." align="top">
          <FieldInput
            value={name}
            onChange={(v) => { setName(v); setDirty(true) }}
          />
        </SettingRow>
        <SettingRow label="Email" desc="Used for login and notifications." align="top">
          <FieldInput value={user.email} readOnly />
        </SettingRow>
        <SettingRow label="Username" desc="Your unique identity on SystemMD." align="top">
          <FieldInput
            value={username}
            onChange={(v) => { setUsername(v); setDirty(true) }}
            placeholder="username"
          />
        </SettingRow>
        <SettingRow label="Timezone" desc="Used for scheduling and timestamps." align="top">
          <FieldSelect
            value={timezone}
            onChange={(v) => { setTimezone(v); setDirty(true) }}
            options={['UTC+3 Istanbul', 'UTC+0 London', 'UTC−5 New York', 'UTC−8 San Francisco', 'UTC+1 Berlin', 'UTC+9 Tokyo']}
          />
        </SettingRow>
        <SettingRow label="Language" desc="Interface language." align="top">
          <FieldSelect
            value={language}
            onChange={(v) => { setLanguage(v); setDirty(true) }}
            options={['English', 'Turkish', 'German', 'French', 'Spanish']}
          />
        </SettingRow>
      </SettingsCard>

      {/* Usage */}
      <SettingsCard>
        <CardTitle>Usage</CardTitle>
        <div className="flex items-center gap-5 px-5 pb-4">
          <div className="shrink-0">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="22" fill="none" stroke="var(--border-2)" strokeWidth="6" />
              <circle
                cx="30" cy="30" r="22" fill="none"
                stroke="var(--accent)" strokeWidth="6"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 30 30)"
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="30" y="35" textAnchor="middle" fill="var(--text)" fontFamily="var(--font-mono)" fontSize="11" fontWeight="500">
                {overallPct}%
              </text>
            </svg>
          </div>
          <div className="flex-1 flex flex-col gap-[10px]">
            <UsageBar
              label="Blueprints"
              used={user.blueprint_count}
              limit={planLimits.blueprints}
              pct={bpPct}
              color="var(--accent)"
            />
            <UsageBar
              label="API calls"
              used={Math.round(user.api_tokens_used / 1000)}
              limit={Math.round(planLimits.tokens / 1000)}
              suffix="k"
              pct={tokenPct}
              color="var(--green)"
            />
            <UsageBar
              label="Deployments"
              used={user.deployment_count}
              limit={planLimits.deployments}
              pct={depPct}
              color="var(--yellow)"
            />
          </div>
        </div>
        {user.plan === 'free' && (
          <div className="px-5 pb-4">
            <button className="inline-flex items-center justify-center gap-[6px] w-full px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] cursor-pointer hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8h10" />
              </svg>
              Upgrade to Solo — $19/mo
            </button>
          </div>
        )}
      </SettingsCard>

      {dirty && (
        <div className="flex justify-end">
          <SaveButton saving={saving} onClick={() => void handleSave()} />
        </div>
      )}
    </div>
  )
}
