import { clsx } from 'clsx'

type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'indigo' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  pulse?: boolean
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, { wrap: string; dot: string }> = {
  green:   { wrap: 'bg-[rgba(34,197,94,0.1)] text-[var(--green)] border border-[rgba(34,197,94,0.2)]',       dot: 'bg-[var(--green)]' },
  yellow:  { wrap: 'bg-[rgba(234,179,8,0.1)] text-[var(--yellow)] border border-[rgba(234,179,8,0.2)]',      dot: 'bg-[var(--yellow)]' },
  red:     { wrap: 'bg-[rgba(239,68,68,0.1)] text-[var(--red)] border border-[rgba(239,68,68,0.2)]',         dot: 'bg-[var(--red)]' },
  blue:    { wrap: 'bg-[rgba(59,130,246,0.1)] text-[var(--blue)] border border-[rgba(59,130,246,0.2)]',      dot: 'bg-[var(--blue)]' },
  indigo:  { wrap: 'bg-[rgba(99,102,241,0.12)] text-[var(--accent)] border border-[var(--accent-border)]',   dot: 'bg-[var(--accent)]' },
  neutral: { wrap: 'bg-[var(--bg-4)] text-[var(--text-3)] border border-[var(--border)]',                    dot: 'bg-[var(--text-4)]' },
}

export default function Badge({
  variant = 'neutral',
  pulse = false,
  dot = true,
  children,
  className,
}: BadgeProps) {
  const v = variants[variant]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-[5px] px-2 py-[2px] rounded-full font-mono text-[10px]',
        v.wrap,
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-[5px] h-[5px] rounded-full shrink-0',
            v.dot,
            pulse && 'animate-[dot-pulse_1.8s_infinite]',
          )}
        />
      )}
      {children}
    </span>
  )
}
