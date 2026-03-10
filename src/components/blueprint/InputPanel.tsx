'use client'

import { useState } from 'react'

export interface GenerateFormData {
  idea_text: string
  description: string
  industry: string
  stage: 'idea' | 'mvp' | 'growth' | 'scale'
  focus: string[]
  model: 'standard' | 'power'
}

interface InputPanelProps {
  onGenerate: (data: GenerateFormData) => void
  isGenerating: boolean
  tokenUsagePercent?: number
  tokenUsageLabel?: string
  onClear?: () => void
}

const INDUSTRIES = [
  { value: '', label: 'Select industry...' },
  { value: 'saas', label: 'SaaS / B2B Software' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'ai', label: 'AI / ML Tools' },
  { value: 'devtools', label: 'Developer Tools' },
  { value: 'other', label: 'Other' },
]

const STAGES: { value: GenerateFormData['stage']; label: string; desc: string }[] = [
  { value: 'idea', label: 'Idea', desc: 'Concept stage' },
  { value: 'mvp', label: 'MVP', desc: 'Building v1' },
  { value: 'growth', label: 'Growth', desc: 'Scaling up' },
  { value: 'scale', label: 'Scale', desc: 'Enterprise' },
]

const FOCUS_OPTIONS = [
  { key: 'architecture', label: 'Architecture' },
  { key: 'database', label: 'Database' },
  { key: 'business', label: 'Business' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'brand', label: 'Brand' },
]

const MODELS = [
  { value: 'standard', label: 'Claude Sonnet 4.6', badge: 'recommended' },
  { value: 'power', label: 'Claude Opus 4', badge: 'powerful' },
]

export default function InputPanel({
  onGenerate,
  isGenerating,
  tokenUsagePercent = 0,
  tokenUsageLabel = '0%',
  onClear,
}: InputPanelProps) {
  const [ideaText, setIdeaText] = useState('')
  const [industry, setIndustry] = useState('')
  const [stage, setStage] = useState<GenerateFormData['stage']>('idea')
  const [focus, setFocus] = useState<string[]>(['architecture', 'database', 'business'])
  const [model, setModel] = useState<'standard' | 'power'>('standard')
  const [ideaError, setIdeaError] = useState(false)

  const wordCount = ideaText.trim().split(/\s+/).filter(Boolean).length

  const toggleFocus = (item: string) => {
    setFocus(prev => prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item])
  }

  const handleClear = () => {
    setIdeaText('')
    setIdeaError(false)
    onClear?.()
  }

  const handleSubmit = () => {
    if (!ideaText.trim()) {
      setIdeaError(true)
      setTimeout(() => setIdeaError(false), 1500)
      return
    }
    onGenerate({ idea_text: ideaText, description: '', industry, stage, focus, model })
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--text-4)',
    marginBottom: 8,
    display: 'block',
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 280px',
      flex: 1,
      overflow: 'hidden',
      minHeight: 0,
      borderBottom: '1px solid var(--border)',
    }}>

      {/* ── LEFT: idea textarea ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--bg-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
              Your Idea
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
              {wordCount} words
            </span>
            {ideaText && (
              <button
                onClick={handleClear}
                disabled={isGenerating}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'transparent',
                  padding: '3px 10px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.4 : 1,
                  transition: 'all 120ms',
                }}
                onMouseEnter={e => { if (!isGenerating) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                clear
              </button>
            )}
          </div>
        </div>

        {/* Textarea — fills remaining height */}
        <textarea
          value={ideaText}
          onChange={e => setIdeaText(e.target.value)}
          placeholder={`Describe your startup idea in detail.\n\nFor example: "An AI-powered invoicing platform for freelancers that automatically tracks billable hours from calendar events, generates professional invoices, and sends payment reminders. Target market is solo developers and designers charging $50–200/hr. Revenue model: $15/mo SaaS."`}
          disabled={isGenerating}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: ideaError ? 'rgba(239,68,68,0.02)' : 'var(--bg)',
            padding: '24px',
            fontSize: 14,
            lineHeight: 1.75,
            color: 'var(--text)',
            fontFamily: 'inherit',
            transition: 'background 200ms',
          }}
          className="placeholder:text-[var(--text-4)] disabled:opacity-50"
        />

        {/* Bottom bar: token usage + generate */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--bg-2)',
        }}>
          {/* Token bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
              token usage
            </span>
            <div style={{ width: 72, height: 2, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(tokenUsagePercent, 100)}%`,
                background: 'var(--accent)',
                borderRadius: 99,
                transition: 'width 300ms',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
              {tokenUsageLabel}
            </span>
          </div>

          {/* Generate button */}
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            style={{
              height: 40,
              padding: '0 28px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 140ms ease',
              border: 'none',
              background: isGenerating ? 'var(--bg-4)' : 'var(--accent)',
              color: isGenerating ? 'var(--text-3)' : 'white',
              boxShadow: isGenerating ? 'none' : '0 2px 14px rgba(99,102,241,0.28)',
            }}
            onMouseEnter={e => {
              if (!isGenerating) {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.38)'
              }
            }}
            onMouseLeave={e => {
              if (!isGenerating) {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.transform = 'none'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 14px rgba(99,102,241,0.28)'
              }
            }}
          >
            {isGenerating ? (
              <>
                <span style={{
                  width: 13, height: 13,
                  borderRadius: '50%',
                  border: '1.5px solid var(--text-4)',
                  borderTopColor: 'var(--text-2)',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                  flexShrink: 0,
                }} />
                Generating...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 1.5L4.5 8.5H8L7 14.5L12 7H8.5L9 1.5Z" />
                </svg>
                Generate Blueprint
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── RIGHT: options panel ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        background: 'var(--bg-2)',
      }}
        className="[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Industry */}
          <div>
            <span style={labelStyle}>Industry</span>
            <div style={{ position: 'relative' }}>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 8,
                  padding: '0 30px 0 11px',
                  height: 36,
                  fontSize: 12,
                  color: 'var(--text)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 140ms',
                }}
                className="focus:border-[var(--accent)] disabled:opacity-50"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
              <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
                width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </div>

          {/* Stage */}
          <div>
            <span style={labelStyle}>Stage</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {STAGES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStage(s.value)}
                  disabled={isGenerating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    transition: 'all 100ms',
                    background: stage === s.value ? 'var(--accent-dim)' : 'transparent',
                    borderColor: stage === s.value ? 'var(--accent)' : 'var(--border-2)',
                    opacity: isGenerating ? 0.5 : 1,
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: stage === s.value ? 'var(--accent)' : 'var(--text)' }}>
                    {s.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: stage === s.value ? 'var(--accent)' : 'var(--text-4)' }}>
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '0 -18px' }} />

          {/* Focus */}
          <div>
            <span style={labelStyle}>Focus sections</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FOCUS_OPTIONS.map(({ key, label }) => {
                const active = focus.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleFocus(key)}
                    disabled={isGenerating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 7,
                      border: '1px solid',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      transition: 'all 100ms',
                      background: active ? 'var(--accent-dim)' : 'transparent',
                      borderColor: active ? 'var(--accent-border)' : 'transparent',
                      opacity: isGenerating ? 0.5 : 1,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (!active && !isGenerating) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
                      background: active ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 100ms',
                    }}>
                      {active && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8">
                          <path d="M2 5l2.5 2.5L8 3" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: active ? 'var(--accent)' : 'var(--text-2)' }}>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '0 -18px' }} />

          {/* AI Model */}
          <div>
            <span style={labelStyle}>AI Model</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {MODELS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setModel(m.value as 'standard' | 'power')}
                  disabled={isGenerating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    transition: 'all 100ms',
                    background: model === m.value ? 'var(--accent-dim)' : 'transparent',
                    borderColor: model === m.value ? 'var(--accent)' : 'var(--border-2)',
                    opacity: isGenerating ? 0.5 : 1,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: model === m.value ? 'var(--accent)' : 'var(--text)' }}>
                    {m.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: model === m.value ? 'rgba(99,102,241,0.15)' : 'var(--bg-4)', color: model === m.value ? 'var(--accent)' : 'var(--text-4)', border: '1px solid', borderColor: model === m.value ? 'var(--accent-border)' : 'var(--border)' }}>
                    {m.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
