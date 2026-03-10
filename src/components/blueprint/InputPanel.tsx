'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

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

const STAGES: { value: GenerateFormData['stage']; label: string }[] = [
  { value: 'idea', label: 'idea' },
  { value: 'mvp', label: 'mvp' },
  { value: 'growth', label: 'growth' },
  { value: 'scale', label: 'scale' },
]

const FOCUS_OPTIONS = ['architecture', 'database', 'business', 'marketing', 'brand']

const MODELS = [
  { value: 'standard', label: 'Claude Sonnet 4.6 — recommended' },
  { value: 'power', label: 'Claude Opus 4 — powerful' },
]

/* ── Field label ────────────────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      color: 'var(--text-2)',
    }}>
      {children}
    </label>
  )
}

export default function InputPanel({
  onGenerate,
  isGenerating,
  tokenUsagePercent = 0,
  tokenUsageLabel = '0%',
  onClear,
}: InputPanelProps) {
  const [ideaText, setIdeaText] = useState('')
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [stage, setStage] = useState<GenerateFormData['stage']>('idea')
  const [focus, setFocus] = useState<string[]>(['architecture', 'database', 'business'])
  const [model, setModel] = useState<'standard' | 'power'>('standard')
  const [ideaError, setIdeaError] = useState(false)

  const toggleFocus = (item: string) => {
    setFocus(prev => prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item])
  }

  const handleClear = () => {
    setIdeaText('')
    setDescription('')
    setIndustry('')
    setIdeaError(false)
    onClear?.()
  }

  const handleSubmit = () => {
    if (!ideaText.trim()) {
      setIdeaError(true)
      setTimeout(() => setIdeaError(false), 1500)
      return
    }
    onGenerate({ idea_text: ideaText, description, industry, stage, focus, model })
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-3)',
    border: '1px solid var(--border-2)',
    borderRadius: 9,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 140ms, box-shadow 140ms',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      width: 'clamp(320px, 32%, 420px)',
      minWidth: 320,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-2)',
      flexShrink: 0,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-2)' }}>
            Input
          </span>
        </div>
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
      </div>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>

        {/* Idea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Idea *</Label>
          <input
            type="text"
            value={ideaText}
            onChange={e => setIdeaText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. AI invoicing tool for freelancers"
            disabled={isGenerating}
            style={{
              ...inputBase,
              borderColor: ideaError ? 'var(--red)' : undefined,
              boxShadow: ideaError ? '0 0 0 3px var(--red-dim)' : undefined,
            }}
            className="focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] placeholder:text-[var(--text-4)] disabled:opacity-50"
          />
          <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
            One sentence — what does it do and for whom?
          </span>
        </div>

        {/* Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Context</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Target market, core problem, revenue ideas..."
            disabled={isGenerating}
            rows={3}
            style={{ ...inputBase, resize: 'none', lineHeight: 1.65 }}
            className="focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] placeholder:text-[var(--text-4)] disabled:opacity-50"
          />
        </div>

        {/* Industry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>Industry</Label>
          <div style={{ position: 'relative' }}>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              disabled={isGenerating}
              style={{ ...inputBase, paddingRight: 32, cursor: 'pointer', appearance: 'none' }}
              className="focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] disabled:opacity-50"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind.value} value={ind.value}>{ind.label}</option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
              width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>Stage</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STAGES.map(s => (
              <button
                key={s.value}
                onClick={() => setStage(s.value)}
                disabled={isGenerating}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  border: '1px solid',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 120ms',
                  background: stage === s.value ? 'var(--accent-dim)' : 'transparent',
                  borderColor: stage === s.value ? 'var(--accent)' : 'var(--border-2)',
                  color: stage === s.value ? 'var(--accent)' : 'var(--text-2)',
                  opacity: isGenerating ? 0.5 : 1,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Focus */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>Focus</Label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FOCUS_OPTIONS.map(item => (
              <button
                key={item}
                onClick={() => toggleFocus(item)}
                disabled={isGenerating}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  border: '1px solid',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 120ms',
                  background: focus.includes(item) ? 'var(--accent-dim)' : 'transparent',
                  borderColor: focus.includes(item) ? 'var(--accent)' : 'var(--border-2)',
                  color: focus.includes(item) ? 'var(--accent)' : 'var(--text-2)',
                  opacity: isGenerating ? 0.5 : 1,
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Select sections to include in the blueprint.
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0 -20px' }} />

        {/* AI Model */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label>AI Model</Label>
          <div style={{ position: 'relative' }}>
            <select
              value={model}
              onChange={e => setModel(e.target.value as 'standard' | 'power')}
              disabled={isGenerating}
              style={{ ...inputBase, paddingRight: 32, cursor: 'pointer', appearance: 'none' }}
              className="focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] disabled:opacity-50"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
              width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>

        {/* Token usage bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
            token usage
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 72, height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(tokenUsagePercent, 100)}%`,
                background: 'var(--accent)',
                borderRadius: 99,
                transition: 'width 300ms',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
              {tokenUsageLabel}
            </span>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'all 140ms ease',
            border: 'none',
            background: isGenerating ? 'var(--bg-4)' : 'var(--accent)',
            color: isGenerating ? 'var(--text-3)' : 'white',
            boxShadow: isGenerating ? 'none' : '0 2px 12px rgba(99,102,241,0.25)',
          }}
          onMouseEnter={e => {
            if (!isGenerating) {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)'
            }
          }}
          onMouseLeave={e => {
            if (!isGenerating) {
              (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
              ;(e.currentTarget as HTMLElement).style.transform = 'none'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(99,102,241,0.25)'
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
  )
}
