import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconPosition = 'left', className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[12px] font-medium text-[var(--text-2)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full h-10 rounded-[6px] bg-[var(--bg-3)] border text-[13px] text-[var(--text)] placeholder:text-[var(--text-4)] outline-none transition-all duration-150',
              error
                ? 'border-[var(--red)]/50 focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]/30'
                : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20',
              icon && iconPosition === 'left' ? 'pl-9 pr-3' : 'px-3',
              icon && iconPosition === 'right' && 'pl-3 pr-9',
              className,
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none">
              {icon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-[11px] text-[var(--red)]">{error}</span>
        )}
        {hint && !error && (
          <span className="text-[11px] text-[var(--text-3)]">{hint}</span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
