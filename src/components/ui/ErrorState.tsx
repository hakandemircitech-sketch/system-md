import React from 'react'

interface ErrorStateProps {
  /** Error message shown to the user */
  message?: string
  /** Called when retry button is clicked */
  onRetry?: () => void
  /** Retry button label (default: 'Try again') */
  retryLabel?: string
  /** Optional additional CSS class */
  className?: string
  /** Height mode: 'full' → h-64 flex center, 'inline' → py-12 */
  variant?: 'full' | 'inline'
}

export function ErrorState({
  message = 'Could not load data.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
  variant = 'full',
}: ErrorStateProps) {
  const wrapClass =
    variant === 'full'
      ? 'flex flex-col items-center justify-center h-64 gap-4 text-center'
      : 'flex flex-col items-center justify-center py-12 gap-3 text-center'

  return (
    <div className={`${wrapClass} ${className}`}>
      <div className="w-10 h-10 rounded-[8px] bg-[var(--red-dim)] text-[var(--red)] flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2l6 12H2L8 2z" />
          <path d="M8 7v3M8 12v.5" />
        </svg>
      </div>
      <p className="text-[13px] text-[var(--text-2)] max-w-[320px] leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--border-2)] text-[var(--text-2)] text-[12px] rounded-[6px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all duration-[120ms]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8a6 6 0 1112 0" />
            <path d="M14 4v4h-4" />
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  )
}

export default ErrorState
