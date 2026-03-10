import React from 'react'
import Link from 'next/link'

interface EmptyStateAction {
  label: string
  /** If href is provided, renders a Link; otherwise renders a button */
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  /** Title (default: 'Nothing here yet') */
  title?: string
  /** Description text */
  description?: string
  /** CTA button or link */
  action?: EmptyStateAction
  /** Optional additional CSS class */
  className?: string
  /** Icon — default: document icon */
  icon?: React.ReactNode
  /** Height mode: 'full' → py-20, 'inline' → py-12 */
  variant?: 'full' | 'inline'
}

const DefaultIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 3h12M2 8h8M2 13h10" />
  </svg>
)

export function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
  className = '',
  icon,
  variant = 'full',
}: EmptyStateProps) {
  const wrapClass =
    variant === 'full'
      ? 'flex flex-col items-center justify-center py-20 text-center'
      : 'flex flex-col items-center justify-center py-12 text-center'

  return (
    <div className={`${wrapClass} ${className}`}>
      <div className="w-11 h-11 rounded-[10px] bg-[var(--bg-4)] border border-[var(--border-2)] flex items-center justify-center mb-4 text-[var(--text-3)]">
        {icon ?? <DefaultIcon />}
      </div>
      <p className="text-[14px] font-medium text-[var(--text)] mb-1.5">{title}</p>
      {description && (
        <p className="text-[12px] text-[var(--text-3)] max-w-[280px] leading-relaxed mb-5">
          {description}
        </p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-medium hover:bg-[#5558e8] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition-all duration-[150ms] active:translate-y-0"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v10M3 8h10" />
              </svg>
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[6px] text-[12px] font-medium hover:bg-[#5558e8] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition-all duration-[150ms] active:translate-y-0"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v10M3 8h10" />
              </svg>
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default EmptyState
