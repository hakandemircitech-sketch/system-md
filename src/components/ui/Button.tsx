import { forwardRef } from 'react'
import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white border border-[var(--accent)] hover:bg-[#5558e8] hover:border-[#5558e8] active:scale-[0.98]',
  secondary:
    'bg-transparent text-[var(--text-2)] border border-[var(--border-2)] hover:bg-[var(--bg-3)] hover:text-[var(--text)] hover:border-[var(--border-2)]',
  ghost:
    'bg-transparent text-[var(--text-2)] border border-transparent hover:bg-[var(--bg-3)] hover:text-[var(--text)]',
  danger:
    'bg-transparent text-[var(--red)] border border-[var(--red)]/30 hover:bg-[var(--red)]/10 hover:border-[var(--red)]/50',
}

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1 rounded-[5px]',
  sm: 'h-7 px-3 text-[11px] gap-1.5 rounded-[6px]',
  md: 'h-8 px-[14px] text-[12px] gap-1.5 rounded-[6px]',
  lg: 'h-10 px-4 text-[13px] gap-2 rounded-[6px]',
  xl: 'h-12 px-6 text-[14px] gap-2 rounded-[8px]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium font-sans whitespace-nowrap transition-all duration-[120ms] cursor-pointer select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          iconPosition === 'left' && icon
        )}
        {children}
        {!loading && iconPosition === 'right' && icon}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
