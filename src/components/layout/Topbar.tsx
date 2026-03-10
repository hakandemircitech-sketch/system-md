'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useUiStore } from '@/stores/uiStore'
import type { DbUser } from '@/types/database'

interface TopbarProps {
  user: DbUser
}

const BREADCRUMBS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/generate':  'Generate',
  '/library':   'My Blueprints',
  '/settings':  'Settings',
  '/billing':   'Plan & Billing',
}

function getBasePath(pathname: string): string {
  const parts = pathname.split('/')
  return '/' + (parts[1] ?? '')
}

function NewBlueprintButton() {
  return (
    <Link
      href="/generate"
      className="inline-flex items-center gap-1.5 px-3.5 py-[6px] bg-[var(--accent)] text-white border border-[var(--accent)] rounded-[var(--radius)] text-[12px] font-medium hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)] transition-all duration-[100ms] whitespace-nowrap"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M8 3v10M3 8h10" />
      </svg>
      <span className="hidden sm:inline">New Blueprint</span>
    </Link>
  )
}

const PAGE_ACTIONS: Record<string, React.ReactNode> = {
  '/generate':  <NewBlueprintButton />,
  '/dashboard': <NewBlueprintButton />,
  '/library':   <NewBlueprintButton />,
}

export default function Topbar({ user }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleMobileSidebar } = useUiStore()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchVal, setSearchVal] = useState('')
  const [usage, setUsage] = useState<{ remaining: number; limit: number; plan: string } | null>(null)

  const basePath = getBasePath(pathname)
  const pageName = BREADCRUMBS[basePath] ?? ''
  const action = PAGE_ACTIONS[basePath]

  const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }
  const planLimit = PLAN_LIMITS[user.plan] ?? 10
  const usedCount = user.blueprint_count ?? 0
  const remaining = usage?.remaining ?? Math.max(0, planLimit - usedCount)
  const usagePct = Math.min(Math.round(((planLimit - remaining) / planLimit) * 100), 100)
  const usageColor = usagePct >= 90 ? 'var(--red)' : usagePct >= 70 ? 'var(--yellow)' : 'var(--accent)'
  const planLabel = ({ free: 'FREE', pro: 'PRO', team: 'TEAM' } as Record<string, string>)[user.plan] ?? user.plan.toUpperCase()

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => { if (!d.error) setUsage(d) })
      .catch(() => {})
  }, [])

  // ⌘K / Ctrl+K focuses the search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current?.blur()
        setSearchVal('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = searchVal.trim()
    if (q) {
      router.push(`/library?q=${encodeURIComponent(q)}`)
      setSearchVal('')
      searchRef.current?.blur()
    }
  }

  return (
    <header
      className="h-14 min-h-14 border-b border-[var(--border)] flex items-center px-4 md:px-5 gap-3 shrink-0 z-[9]"
      style={{ backgroundColor: 'var(--panel)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileSidebar}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-2)] transition-all shrink-0"
        aria-label="Toggle navigation menu"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>

      {/* Breadcrumb */}
      {pageName ? (
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-4)',
              letterSpacing: '0.04em',
            }}
          >
            SMD
          </span>
          <span style={{ color: 'var(--text-4)', fontSize: '11px' }}>/</span>
          <span
            style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--text-2)',
            }}
          >
            {pageName}
          </span>
        </div>
      ) : null}

      {/* Search */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative ml-0 md:ml-3 flex-1 max-w-[180px] sm:max-w-[240px]"
      >
        <svg
          className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[var(--text-4)] pointer-events-none"
          width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10l3.5 3.5" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search blueprints..."
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '5px 48px 5px 30px',
            fontSize: '12px',
            color: 'var(--text)',
            outline: 'none',
            transition: 'all 150ms ease',
          }}
          className="placeholder:text-[var(--text-4)] focus:border-[var(--border-2)] focus:bg-[var(--bg-4)]"
        />
        <kbd
          className="absolute right-[8px] top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '9px',
            color: 'var(--text-4)',
            backgroundColor: 'var(--bg-4)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            padding: '2px 5px',
          }}
        >
          ⌘K
        </kbd>
      </form>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Generates remaining pill */}
        <Link
          href="/billing"
          className="hidden sm:flex items-center gap-1.5 font-mono bg-[var(--bg-3)] border border-[var(--border)] rounded-full px-3 py-1 no-underline hover:border-[var(--border-2)] transition-all duration-100"
          style={{ fontSize: '9px' }}
          title={`${remaining} generates remaining on ${planLabel} plan`}
        >
          <span style={{ color: 'var(--text-4)' }}>{planLabel}</span>
          <div className="w-8 h-[3px] bg-[var(--border-2)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${usagePct}%`, background: usageColor }}
            />
          </div>
          <span style={{ color: usageColor }}>{remaining} left</span>
        </Link>

        {/* Notifications */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text-2)] hover:border-[var(--border-2)] transition-all duration-[100ms]"
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
          aria-label="Notifications"
          title="Notifications"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2a4.5 4.5 0 014.5 4.5c0 2.3.55 3.8 1.3 4.7H2.2c.75-.9 1.3-2.4 1.3-4.7A4.5 4.5 0 018 2z" />
            <path d="M6.5 12.5a1.5 1.5 0 003 0" />
          </svg>
        </button>

        {/* Page action */}
        {action}
      </div>
    </header>
  )
}
