'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/Toast'
import {
  SettingsCard,
  CardTitle,
  SettingRow,
  FieldInput,
  Toggle,
  Badge,
  SaveButton,
  SectionSkeleton,
} from './settings-shared'

interface SecuritySectionProps {
  loading?: boolean
  onPasswordChange: (cur: string, newP: string) => Promise<void>
}

export function SecuritySection({ loading = false, onPasswordChange }: SecuritySectionProps) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [lengthError, setLengthError] = useState('')

  if (loading) return <SectionSkeleton />

  const dirty = currentPw !== '' || newPw !== '' || confirmPw !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      toast.error('Passwords do not match')
      return
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    await onPasswordChange(currentPw, newPw)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setLengthError('')
    setConfirmError('')
    setSaving(false)
  }

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">Security</div>
      <div className="text-[13px] text-[var(--text-3)] mb-7">Manage your password, two-factor authentication, and active sessions.</div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <SettingsCard>
          <CardTitle>Password</CardTitle>
          <SettingRow label="Current password" align="top">
            <FieldInput type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" />
          </SettingRow>
          <SettingRow label="New password" desc="Minimum 8 characters." align="top">
            <div className="flex flex-col">
              <FieldInput
                type="password"
                value={newPw}
                onChange={(v) => { setNewPw(v); setConfirmError('') }}
                placeholder="••••••••"
                onBlur={() => {
                  if (newPw && newPw.length < 8) setLengthError('Must be at least 8 characters')
                  else setLengthError('')
                }}
              />
              {lengthError && (
                <p className="font-mono text-[10px] text-[var(--red)] mt-[4px]">{lengthError}</p>
              )}
            </div>
          </SettingRow>
          <SettingRow label="Confirm password" align="top">
            <div className="flex flex-col">
              <FieldInput
                type="password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="••••••••"
                onBlur={() => {
                  if (confirmPw && newPw !== confirmPw) setConfirmError('Passwords do not match')
                  else setConfirmError('')
                }}
              />
              {confirmError && (
                <p className="font-mono text-[10px] text-[var(--red)] mt-[4px]">{confirmError}</p>
              )}
            </div>
          </SettingRow>
        </SettingsCard>

        {dirty && (
          <div className="flex justify-end mb-4">
            <SaveButton saving={saving} type="submit" label="Update Password" />
          </div>
        )}
      </form>

      <SettingsCard>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <SettingRow label="Authenticator app" desc="Use an app like Authy or 1Password to generate codes.">
          <div className="flex items-center gap-[10px]">
            <Badge variant="neutral">Not enabled</Badge>
            <button className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] text-[11px] cursor-pointer hover:bg-[var(--bg-3)] transition-all">
              Enable
            </button>
          </div>
        </SettingRow>
        <SettingRow label="SMS backup" desc="Backup verification via phone number.">
          <Toggle on={smsEnabled} onChange={setSmsEnabled} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard>
        <CardTitle>Active Sessions</CardTitle>
        <SettingRow
          label="Current device"
          desc={`Chrome · Istanbul, Turkey · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
        >
          <div className="flex items-center gap-[10px]">
            <Badge variant="green">
              <span className="w-[5px] h-[5px] rounded-full bg-current" />
              Active
            </Badge>
            <button disabled className="inline-flex items-center gap-[6px] px-3 py-[6px] bg-transparent text-[var(--red)] border border-[rgba(239,68,68,0.3)] rounded-[6px] text-[11px] opacity-40 cursor-not-allowed">
              Revoke
            </button>
          </div>
        </SettingRow>
        <SettingRow label="MacBook Pro" desc="Safari · Istanbul, Turkey · Nov 15, 2024">
          <span className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent-dim)] px-2 py-1 rounded-full">
            current
          </span>
        </SettingRow>
        <SettingRow label="iPhone 15" desc="Mobile Safari · Istanbul, Turkey · Nov 12, 2024">
          <span className="font-mono text-[10px] text-[var(--text-3)]">
            session mgmt coming soon
          </span>
        </SettingRow>
      </SettingsCard>
    </div>
  )
}
