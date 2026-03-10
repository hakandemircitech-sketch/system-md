import { clsx } from 'clsx'

type Orientation = 'horizontal' | 'vertical'

interface DividerProps {
  orientation?: Orientation
  label?: string
  className?: string
}

export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={clsx('self-stretch w-px bg-[var(--border)]', className)}
        role="separator"
        aria-orientation="vertical"
      />
    )
  }

  if (label) {
    return (
      <div
        className={clsx('flex items-center gap-3', className)}
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[11px] text-[var(--text-3)] font-mono whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
    )
  }

  return (
    <hr
      className={clsx('border-none h-px bg-[var(--border)]', className)}
      role="separator"
    />
  )
}
