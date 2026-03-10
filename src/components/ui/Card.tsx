import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  title: string
  action?: React.ReactNode
  className?: string
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, action, className }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between px-5 py-4 border-b border-[var(--border)]',
        className,
      )}
    >
      <span className="text-[13px] font-semibold text-[var(--text)]">{title}</span>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardContent({ children, className, noPadding }: CardContentProps) {
  return (
    <div className={clsx(!noPadding && 'p-5', className)}>
      {children}
    </div>
  )
}
