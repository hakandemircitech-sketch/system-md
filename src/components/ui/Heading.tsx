import { clsx } from 'clsx'

type HeadingAs   = 'h1' | 'h2' | 'h3' | 'h4'
type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
type HeadingFont = 'sans' | 'serif' | 'mono'

interface HeadingProps {
  children: React.ReactNode
  as?: HeadingAs
  size?: HeadingSize
  font?: HeadingFont
  gradient?: boolean
  className?: string
}

const sizeMap: Record<HeadingSize, string> = {
  xs:   'text-[14px]',
  sm:   'text-[18px]',
  md:   'text-[24px]',
  lg:   'text-[32px]',
  xl:   'text-[48px]',
  hero: 'text-[64px]',
}

const fontMap: Record<HeadingFont, string> = {
  sans:  'font-sans',
  serif: 'font-serif',
  mono:  'font-mono',
}

export function Heading({
  children,
  as: Tag = 'h2',
  size = 'lg',
  font = 'sans',
  gradient = false,
  className,
}: HeadingProps) {
  return (
    <Tag
      className={clsx(
        'text-[var(--text)] leading-tight tracking-tight',
        sizeMap[size],
        fontMap[font],
        gradient && 'text-gradient',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
