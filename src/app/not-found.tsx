import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6">
      <div className="text-center max-w-[440px]">
        {/* Terminal-style 404 */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px]">
          <span className="font-mono text-[var(--text-4)] text-[11px]">$</span>
          <span className="font-mono text-[11px] text-[var(--text-3)]">
            GET /this-page{' '}
            <span className="text-[var(--red)]">404 Not Found</span>
          </span>
        </div>

        <h1 className="text-[72px] font-semibold text-[var(--text)] tracking-[-0.06em] leading-none mb-4">
          404
        </h1>
        <p className="text-[15px] text-[var(--text-2)] mb-2">
          Page not found
        </p>
        <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-8">
          The page you&apos;re looking for may have been moved, deleted, or never existed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-[18px] py-[9px] bg-[var(--accent)] text-white text-[13px] font-medium rounded-[8px] hover:bg-[#5558e8] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
            Back to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-[18px] py-[9px] bg-[var(--bg-2)] border border-[var(--border-2)] text-[var(--text-2)] text-[13px] font-medium rounded-[8px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
