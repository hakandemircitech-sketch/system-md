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

export default function InputPanel({
  onGenerate,
  isGenerating,
  tokenUsagePercent = 0,
  tokenUsageLabel = '0% / 100k',
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
    setFocus((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    )
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
    <div className="border-r border-[var(--border)] flex flex-col overflow-hidden bg-[var(--bg-2)]" style={{ width: 380, minWidth: 380 }}>

      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-[7px]">
          <div className="w-[5px] h-[5px] rounded-full bg-[var(--accent)]" />
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
            input
          </span>
        </div>
        <button
          onClick={handleClear}
          disabled={isGenerating}
          className="disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-[120ms] hover:bg-[var(--bg-3)] hover:text-[var(--text-2)]"
          style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', color: 'var(--text-3)', border: '1px solid var(--border-2)', borderRadius: '6px', background: 'transparent', padding: '2px 8px', cursor: 'pointer' }}
        >
          clear
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">

        {/* Idea */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.12em] uppercase">
            idea *
          </label>
          <input
            type="text"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. AI invoicing tool for freelancers"
            disabled={isGenerating}
            className={clsx(
              'w-full px-3 py-[10px] bg-[var(--bg-3)] border rounded-[8px] text-[13px] font-sans text-[var(--text)] outline-none transition-all duration-[140ms] placeholder:text-[var(--text-4)] disabled:opacity-50',
              ideaError
                ? 'border-[var(--red)] shadow-[0_0_0_3px_var(--red-dim)]'
                : 'border-[var(--border-2)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)]'
            )}
          />
          <span className="text-[11px] text-[var(--text-3)] leading-[1.5]">
            Describe what your startup does in one clear sentence.
          </span>
        </div>

        {/* Context */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.12em] uppercase">
            context
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="target market, problem, revenue ideas..."
            disabled={isGenerating}
            rows={3}
            className="w-full px-3 py-[10px] bg-[var(--bg-3)] border border-[var(--border-2)] rounded-[8px] text-[13px] font-sans text-[var(--text)] outline-none resize-none transition-all duration-[140ms] placeholder:text-[var(--text-4)] leading-[1.65] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] disabled:opacity-50"
          />
        </div>

        {/* Industry */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.12em] uppercase">
            industry
          </label>
          <div className="relative">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-[10px] pr-8 bg-[var(--bg-3)] border border-[var(--border-2)] rounded-[8px] text-[13px] font-sans text-[var(--text)] outline-none cursor-pointer appearance-none transition-all duration-[140ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] disabled:opacity-50"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value} className="bg-[var(--bg-3)]">
                  {ind.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)]"
              width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* Stage */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.12em] uppercase">
            stage
          </label>
          <div className="flex flex-wrap gap-[6px]">
            {STAGES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStage(s.value)}
                disabled={isGenerating}
                className={clsx(
                  'inline-flex items-center gap-[5px] px-[10px] py-1 rounded-[20px] text-[11px] border cursor-pointer transition-all duration-[120ms] font-mono disabled:opacity-50 disabled:cursor-not-allowed',
                  stage === s.value
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border-2)] text-[var(--text-3)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)]'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Focus */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.12em] uppercase">
            focus
          </label>
          <div className="flex flex-wrap gap-[6px]">
            {FOCUS_OPTIONS.map((item) => (
              <button
                key={item}
                onClick={() => toggleFocus(item)}
                disabled={isGenerating}
                className={clsx(
                  'inline-flex items-center gap-[5px] px-[10px] py-1 rounded-[20px] text-[11px] border cursor-pointer transition-all duration-[120ms] font-mono disabled:opacity-50 disabled:cursor-not-allowed',
                  focus.includes(item)
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border-2)] text-[var(--text-3)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-dim)]'
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[var(--text-3)] leading-[1.5]">
            Select sections to include in the blueprint.
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)] -mx-5" />

        {/* AI Model */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-mono text-[9px] font-medium text-[var(--text-3)] tracking-[0.12em] uppercase">
            model
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as 'standard' | 'power')}
              disabled={isGenerating}
              className="w-full px-3 py-[10px] pr-8 bg-[var(--bg-3)] border border-[var(--border-2)] rounded-[8px] text-[13px] font-sans text-[var(--text)] outline-none cursor-pointer appearance-none transition-all duration-[140ms] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-dim)] disabled:opacity-50"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} className="bg-[var(--bg-3)]">
                  {m.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-3)]"
              width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      <div className="px-5 py-4 border-t border-[var(--border)] flex-shrink-0 flex flex-col gap-[10px]">
        {/* Token Usage */}
        <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-3)]">
          <span>token usage</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-[3px] bg-[var(--border-2)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(tokenUsagePercent, 100)}%` }}
              />
            </div>
            <span>{tokenUsageLabel}</span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          className={clsx(
            'w-full py-[12px] px-4 rounded-[8px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-[140ms]',
            isGenerating
              ? 'bg-[var(--bg-4)] text-[var(--text-3)] border border-[var(--border-2)] cursor-not-allowed'
              : 'bg-[var(--accent)] text-white border-none cursor-pointer hover:bg-[#5558e8] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(99,102,241,0.3)] active:translate-y-0'
          )}
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          {isGenerating ? (
            <>
              <span className="w-3 h-3 border-[1.5px] border-[var(--text-4)] border-t-[var(--text-2)] rounded-full animate-spin" />
              generating...
            </>
          ) : (
            'generate blueprint →'
          )}
        </button>
      </div>
    </div>
  )
}
