import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
  circle?: boolean
}

export function Skeleton({ className, width, height, rounded, circle }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-[var(--bg-4)] animate-pulse',
        circle ? 'rounded-full' : rounded ? 'rounded-full' : 'rounded-[4px]',
        className,
      )}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={80} height={10} />
        <Skeleton width={28} height={28} circle />
      </div>
      <Skeleton width={60} height={28} className="mb-2" />
      <Skeleton width={120} height={10} />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border)]">
      <Skeleton width={120} height={12} />
      <Skeleton width={60} height={18} rounded />
      <Skeleton width={80} height={10} />
      <Skeleton width={60} height={18} rounded />
      <Skeleton width={50} height={10} className="ml-auto" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={10}
          width={i === lines - 1 ? '60%' : '100%'}
          className="rounded-[4px]"
        />
      ))}
    </div>
  )
}
