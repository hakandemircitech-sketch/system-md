'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/Toast'
import {
  ApiKey,
  SettingsCard,
  CardTitle,
  SettingRow,
  FieldInput,
  Badge,
  SectionSkeleton,
} from './settings-shared'

interface APISectionProps {
  loading?: boolean
  initialKeys?: ApiKey[]
}

const DEFAULT_KEYS: ApiKey[] = [
  {
    id: 'anthropic',
    provider: 'anthropic',
    label: 'Anthropic',
    desc: 'Used for all blueprint generation. Configured via ANTHROPIC_API_KEY environment variable.',
    value: '',
    connected: !!process.env.NEXT_PUBLIC_ANTHROPIC_CONFIGURED,
  },
  {
    id: 'openai',
    provider: 'openai',
    label: 'OpenAI',
    desc: 'Optional fallback model provider. Configured via OPENAI_API_KEY environment variable.',
    value: '',
    connected: false,
  },
  {
    id: 'stripe',
    provider: 'stripe',
    label: 'Stripe',
    desc: 'Payment processing and subscriptions. Pending integration (Phase 6).',
    value: '',
    connected: false,
  },
  {
    id: 'resend',
    provider: 'resend',
    label: 'Resend',
    desc: 'Transactional email delivery. Configured via RESEND_API_KEY environment variable.',
    value: '',
    connected: false,
  },
]

export function APISection({ loading = false, initialKeys }: APISectionProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys ?? DEFAULT_KEYS)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  if (loading) return <SectionSkeleton />

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copyKey(value: string) {
    void navigator.clipboard.writeText(value)
    toast.success('API key copied to clipboard')
  }

  function updateKey(id: string, value: string) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, value, connected: value.length > 0 } : k)))
  }

  function deleteKey(id: string) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, value: '', connected: false } : k)))
    toast.success('API key deleted')
  }

  const aiKeys = keys.filter((k) => k.provider === 'anthropic' || k.provider === 'openai')
  const paymentKeys = keys.filter((k) => k.provider === 'stripe' || k.provider === 'resend')

  function renderKeyRow(key: ApiKey) {
    const isRevealed = revealed.has(key.id)
    return (
      <SettingRow
        key={key.id}
        label={
          <span className="flex items-center gap-2">
            {key.label}
            <Badge variant={key.connected ? 'green' : 'neutral'}>
              {key.connected ? 'Connected' : 'Not configured'}
            </Badge>
          </span>
        }
        desc={key.desc}
        align="top"
      >
        {key.connected ? (
          <div className="flex items-center gap-[8px] w-[220px]">
            <input
              type={isRevealed ? 'text' : 'password'}
              value={key.value}
              readOnly
              className="flex-1 px-3 py-2 bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] text-[11px] font-mono text-[var(--text-3)] outline-none tracking-[0.05em]"
            />
            <button
              onClick={() => toggleReveal(key.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-3)] cursor-pointer transition-all ${isRevealed ? 'text-[var(--accent)] border-[var(--accent-border)]' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                {isRevealed ? (
                  <><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /><line x1="1" y1="1" x2="15" y2="15" /></>
                ) : (
                  <><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></>
                )}
              </svg>
            </button>
            <button
              onClick={() => copyKey(key.value)}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-3)] text-[var(--text-3)] cursor-pointer hover:text-[var(--accent)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-dim)] transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3H2v9h2" />
              </svg>
            </button>
            <button
              onClick={() => deleteKey(key.id)}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] border border-[rgba(239,68,68,0.3)] bg-transparent text-[var(--red)] cursor-pointer hover:bg-[var(--red-dim)] transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-[220px]">
            <FieldInput
              value={key.value}
              onChange={(v) => updateKey(key.id, v)}
              placeholder={key.provider === 'anthropic' ? 'sk-ant-...' : key.provider === 'openai' ? 'sk-...' : key.provider === 'stripe' ? 'sk_live_...' : 're_...'}
              className="w-full"
            />
          </div>
        )}
      </SettingRow>
    )
  }

  return (
    <div className="max-w-[640px]">
      <div className="text-[16px] font-semibold text-[var(--text)] tracking-[-0.02em] mb-1">API Keys</div>
      <div className="text-[13px] text-[var(--text-3)] mb-5">API keys are configured via environment variables on the server. Keys shown here are read-only status indicators.</div>

      <div className="flex items-start gap-2 mb-5 px-4 py-[10px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius-md)] text-[11px]">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--yellow)" strokeWidth="1.5" className="shrink-0 mt-[1px]">
          <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12h.01" />
        </svg>
        <span className="text-[var(--text-3)]">
          API keys are stored as server-side environment variables (.env.local), not in the database. To update a key, redeploy with the updated variable.
        </span>
      </div>

      <SettingsCard>
        <CardTitle>AI Providers</CardTitle>
        {aiKeys.map(renderKeyRow)}
      </SettingsCard>

      <SettingsCard>
        <CardTitle>Payment &amp; Email</CardTitle>
        {paymentKeys.map(renderKeyRow)}
      </SettingsCard>
    </div>
  )
}
