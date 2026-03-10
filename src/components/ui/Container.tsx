import { clsx } from 'clsx'

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ContainerProps {
  children: React.ReactNode
  maxWidth?: MaxWidth
  className?: string
}

const maxWidthMap: Record<MaxWidth, string> = {
  sm:   'max-w-[640px]',
  md:   'max-w-[768px]',
  lg:   'max-w-[1024px]',
  xl:   'max-w-[1280px]',
  full: 'max-w-full',
}

export function Container({ children, maxWidth = 'lg', className }: ContainerProps) {
  return (
    <div className={clsx('mx-auto w-full px-6 md:px-8', maxWidthMap[maxWidth], className)}>
      {children}
    </div>
  )
}
