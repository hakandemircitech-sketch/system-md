'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0d0d10',
          color: '#e5e7eb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2l6 12H2L8 2z" />
              <path d="M8 7v3M8 12v.5" />
            </svg>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Critical Error
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6, marginBottom: 8 }}>
            The application encountered an unexpected error.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#6b7280', marginBottom: 24 }}>
              Error ID: {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '9px 20px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              style={{
                padding: '9px 20px',
                background: 'transparent',
                color: '#9ca3af',
                border: '1px solid #374151',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
