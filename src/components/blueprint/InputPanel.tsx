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
  { value: '', label: 'Industry...' },
  { value: 'saas', label: 'SaaS / B2B' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'ai', label: 'AI / ML' },
  { value: 'devtools', label: 'Dev Tools' },
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
  { value: 'standard', label: 'Sonnet 4.6' },
  { value: 'power', label: 'Opus 4' },
]

const selectBase: React.CSSProperties = {
  background: 'var(--bg-3)',
  border: '1px solid var(--border-2)',
  borderRadius: 8,
  padding: '0 30px 0 10px',
  height: 36,
  fontSize: 12,
  color: 'var(--text)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 140ms',
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
  const [expanded, setExpanded] = useState(false)

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

  return (
    <div style={{
      flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-2)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Row 1: Main input bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 20px',
        borderBottom: expanded ? '1px solid var(--border)' : 'none',
      }}>

        {/* Idea input — takes remaining space */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={ideaText}
            onChange={e => setIdeaText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Describe your startup idea — e.g. AI invoicing tool for freelancers"
            disabled={isGenerating}
            style={{
              width: '100%',
              height: 38,
              background: ideaError ? 'rgba(239,68,68,0.04)' : 'var(--bg-3)',
              border: `1px solid ${ideaError ? 'var(--red)' : 'var(--border-2)'}`,
              borderRadius: 9,
              padding: '0 14px',
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 140ms, box-shadow 140ms',
              boxShadow: ideaError ? '0 0 0 3px var(--red-dim)' : 'none',
            }}
            className="focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] placeholder:text-[var(--text-4)] disabled:opacity-50"
          />
        </div>

        {/* Industry */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            disabled={isGenerating}
            style={{ ...selectBase, width: 120 }}
            className="focus:border-[var(--accent)] disabled:opacity-50"
          >
            {INDUSTRIES.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
            width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>

        {/* Stage pills */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {STAGES.map(s => (
            <button
              key={s.value}
              onClick={() => setStage(s.value)}
              disabled={isGenerating}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                border: '1px solid',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 100ms',
                background: stage === s.value ? 'var(--accent-dim)' : 'transparent',
                borderColor: stage === s.value ? 'var(--accent)' : 'var(--border-2)',
                color: stage === s.value ? 'var(--accent)' : 'var(--text-3)',
                opacity: isGenerating ? 0.5 : 1,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Model */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={model}
            onChange={e => setModel(e.target.value as 'standard' | 'power')}
            disabled={isGenerating}
            style={{ ...selectBase, width: 100 }}
            className="focus:border-[var(--accent)] disabled:opacity-50"
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
            width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(p => !p)}
          title="More options"
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: `1px solid ${expanded ? 'var(--accent-border)' : 'var(--border-2)'}`,
            background: expanded ? 'var(--accent-dim)' : 'transparent',
            color: expanded ? 'var(--accent)' : 'var(--text-3)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 120ms',
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="4" cy="8" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        {/* Clear */}
        {ideaText && (
          <button
            onClick={handleClear}
            disabled={isGenerating}
            title="Clear"
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-3)',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: isGenerating ? 0.4 : 1,
              transition: 'all 120ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isGenerating) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        )}

        {/* Generate button */}
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          style={{
            height: 38,
            padding: '0 20px',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'all 140ms ease',
            border: 'none',
            background: isGenerating ? 'var(--bg-4)' : 'var(--accent)',
            color: isGenerating ? 'var(--text-3)' : 'white',
            boxShadow: isGenerating ? 'none' : '0 2px 12px rgba(99,102,241,0.25)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
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
                width: 12, height: 12,
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
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 1.5L4.5 8.5H8L7 14.5L12 7H8.5L9 1.5Z" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>

      {/* ── Row 2: Expanded options (Context + Focus + token bar) ── */}
      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'start',
          gap: 16,
          padding: '14px 20px',
        }}>

          {/* Context textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
              Context (optional)
            </span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Target market, core problem, revenue ideas..."
              disabled={isGenerating}
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-3)',
                border: '1px solid var(--border-2)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: 'var(--text)',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                transition: 'border-color 140ms',
              }}
              className="focus:border-[var(--accent)] placeholder:text-[var(--text-4)] disabled:opacity-50"
            />
          </div>

          {/* Focus chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
              Focus sections
            </span>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', maxWidth: 240 }}>
              {FOCUS_OPTIONS.map(item => (
                <button
                  key={item}
                  onClick={() => toggleFocus(item)}
                  disabled={isGenerating}
                  style={{
                    height: 26,
                    padding: '0 10px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    transition: 'all 100ms',
                    background: focus.includes(item) ? 'var(--accent-dim)' : 'transparent',
                    borderColor: focus.includes(item) ? 'var(--accent)' : 'var(--border-2)',
                    color: focus.includes(item) ? 'var(--accent)' : 'var(--text-3)',
                    opacity: isGenerating ? 0.5 : 1,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Token usage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
              Token usage
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 80, height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(tokenUsagePercent, 100)}%`,
                  background: 'var(--accent)',
                  borderRadius: 99,
                  transition: 'width 300ms',
                }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                {tokenUsageLabel}
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
