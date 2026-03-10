import { clsx } from 'clsx'

type SectionSize   = 'sm' | 'md' | 'lg' | 'xl'
type SectionBorder = 'top' | 'bottom' | 'both' | 'none'

interface SectionProps {
  children: React.ReactNode
  size?: SectionSize
  background?: string
  border?: SectionBorder
  className?: string
}

const sizeMap: Record<SectionSize, string> = {
  sm: 'py-12',
  md: 'py-16',
  lg: 'py-24',
  xl: 'py-32',
}

const borderMap: Record<SectionBorder, string> = {
  top:    'border-t border-[var(--border)]',
  bottom: 'border-b border-[var(--border)]',
  both:   'border-y border-[var(--border)]',
  none:   '',
}

export function Section({
  children,
  size = 'lg',
  background,
  border = 'none',
  className,
}: SectionProps) {
  return (
    <section
      className={clsx(sizeMap[size], borderMap[border], className)}
      style={background ? { backgroundColor: background } : undefined}
    >
      {children}
    </section>
  )
}
