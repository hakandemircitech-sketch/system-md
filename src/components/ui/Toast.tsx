'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { clsx } from 'clsx'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Kullanım kolaylığı için yardımcı fonksiyonlar
export const toast = {
  success: (message: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'success', message, duration }),
  error: (message: string, duration = 5000) =>
    useToastStore.getState().add({ type: 'error', message, duration }),
  warning: (message: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'warning', message, duration }),
  info: (message: string, duration = 3500) =>
    useToastStore.getState().add({ type: 'info', message, duration }),
}

const typeConfig: Record<ToastType, { icon: React.ReactNode; color: string; border: string }> = {
  success: {
    color: 'text-[var(--green)]',
    border: 'border-[var(--green)]/25 bg-[rgba(34,197,94,0.06)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
      </svg>
    ),
  },
  error: {
    color: 'text-[var(--red)]',
    border: 'border-[var(--red)]/25 bg-[rgba(239,68,68,0.06)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    ),
  },
  warning: {
    color: 'text-[var(--yellow)]',
    border: 'border-[var(--yellow)]/25 bg-[rgba(234,179,8,0.06)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" />
      </svg>
    ),
  },
  info: {
    color: 'text-[var(--blue)]',
    border: 'border-[var(--blue)]/25 bg-[rgba(59,130,246,0.06)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    ),
  },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const cfg = typeConfig[toast.type]

  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [toast.duration, onRemove])

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 rounded-[8px] border shadow-[var(--shadow-lg)] min-w-[280px] max-w-[380px] animate-[fadeUp_0.2s_ease]',
        cfg.border,
      )}
    >
      <span className={clsx('mt-0.5 shrink-0', cfg.color)}>{cfg.icon}</span>
      <span className="text-[12px] text-[var(--text-2)] flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={onRemove}
        className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors shrink-0 mt-0.5"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  )
}
