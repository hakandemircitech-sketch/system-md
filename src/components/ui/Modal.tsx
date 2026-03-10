'use client'

import { useEffect } from 'react'
import { clsx } from 'clsx'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: ModalSize
  className?: string
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: ModalProps) {
  // ESC tuşuyla kapat
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Açıkken scroll kilitle
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] shadow-[var(--shadow-xl)] animate-[fadeUp_0.25s_ease]',
          sizes[size],
          className,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
            <div>
              {title && (
                <h2 className="text-[15px] font-semibold text-[var(--text)] tracking-[-0.01em]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[12px] text-[var(--text-3)]">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[5px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-3)] transition-all duration-100 ml-4 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
