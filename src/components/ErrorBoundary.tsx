'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 text-center">
          <div className="w-12 h-12 rounded-[10px] bg-[rgba(239,68,68,0.1)] text-[var(--red)] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2l6 12H2L8 2z" />
              <path d="M8 7v3M8 12v.5" />
            </svg>
          </div>
          <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">
            Something went wrong
          </h2>
          <p className="text-[13px] text-[var(--text-3)] mb-5 max-w-[340px] leading-relaxed">
            {this.state.error?.message ?? 'An unexpected error occurred. Please refresh the page.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-[var(--text-2)] border border-[var(--border-2)] rounded-[6px] hover:bg-[var(--bg-3)] hover:text-[var(--text)] transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8a6 6 0 1112 0" /><path d="M14 4v4h-4" />
              </svg>
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-white bg-[var(--accent)] rounded-[6px] hover:bg-[#5558e8] transition-all"
            >
              Refresh page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
