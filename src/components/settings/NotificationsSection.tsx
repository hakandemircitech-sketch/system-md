'use client'

import {
  NotificationPrefs,
  SettingsCard,
  CardTitle,
  SettingRow,
  Toggle,
  SaveButton,
  SectionSkeleton,
} from './settings-shared'

interface NotificationsSectionProps {
  prefs: NotificationPrefs
  loading?: boolean
  onChange: (prefs: NotificationPrefs) => void
  onSave: () => Promise<void>
  saving: boolean
}

export function NotificationsSection({
  prefs,
  loading = false,
  onChange,
  onSave,
  saving,
}: NotificationsSectionProps) {
  if (loading) return <SectionSkeleton />

  function toggle(key: keyof NotificationPrefs) {
    onChange({ ...prefs, [key]: !prefs[key] })
  }

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">Notifications</div>
      <div className="text-[13px] text-[var(--text-3)] mb-7">Choose what you&apos;re notified about and how.</div>

      <SettingsCard>
        <CardTitle>Email Notifications</CardTitle>
        <SettingRow label="Blueprint completed" desc="When a new blueprint is ready.">
          <Toggle on={prefs.blueprint_generated} onChange={() => toggle('blueprint_generated')} />
        </SettingRow>
        <SettingRow label="Deployment finished" desc="When a deployment completes or fails.">
          <Toggle on={prefs.deployment_complete} onChange={() => toggle('deployment_complete')} />
        </SettingRow>
        <SettingRow label="Usage limit alerts" desc="When you reach 80% of your plan limits.">
          <Toggle on={prefs.usage_warnings} onChange={() => toggle('usage_warnings')} />
        </SettingRow>
        <SettingRow label="Weekly digest" desc="Summary of workspace activity.">
          <Toggle on={prefs.weekly_digest} onChange={() => toggle('weekly_digest')} />
        </SettingRow>
        <SettingRow label="Product updates" desc="New features and changelog announcements.">
          <Toggle on={prefs.product_updates} onChange={() => toggle('product_updates')} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard>
        <CardTitle>In-App Notifications</CardTitle>
        <SettingRow label="Real-time alerts" desc="Build and deployment status inside the app.">
          <Toggle on={prefs.realtime_alerts} onChange={() => toggle('realtime_alerts')} />
        </SettingRow>
        <SettingRow label="Sound effects" desc="Audio alerts for completed actions.">
          <Toggle on={prefs.sound_effects} onChange={() => toggle('sound_effects')} />
        </SettingRow>
      </SettingsCard>

      <div className="flex justify-end">
        <SaveButton saving={saving} onClick={() => void onSave()} label="Save Preferences" />
      </div>
    </div>
  )
}
