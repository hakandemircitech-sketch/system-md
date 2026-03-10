'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { createClient } from '@/lib/supabase/client'
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
  return '/' + (pathname.split('/')[1] ?? '')
}

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }

export default function Topbar({ user }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleMobileSidebar } = useUiStore()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchVal, setSearchVal] = useState('')
  const [usage, setUsage] = useState<{ remaining: number; plan: string } | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const basePath = getBasePath(pathname)
  const pageName = BREADCRUMBS[basePath] ?? ''

  const planLimit = PLAN_LIMITS[user.plan] ?? 10
  const usedCount = user.blueprint_count ?? 0
  const remaining = usage?.remaining ?? Math.max(0, planLimit - usedCount)
  const usagePct = Math.min(Math.round(((planLimit - remaining) / planLimit) * 100), 100)
  const usageColor = usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#eab308' : '#6366f1'
  const planLabel = ({ free: 'FREE', pro: 'PRO', team: 'TEAM' } as Record<string, string>)[user.plan] ?? user.plan.toUpperCase()

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => { if (!d.error) setUsage(d) })
      .catch(() => {})
  }, [])

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

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header style={{
      height: 52,
      minHeight: 52,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-2)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      flexShrink: 0,
      zIndex: 9,
    }}>

      {/* Mobile hamburger */}
      <button
        onClick={toggleMobileSidebar}
        className="md:hidden"
        style={{
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 7,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-3)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        aria-label="Toggle navigation"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" />
        </svg>
      </button>

      {/* Breadcrumb */}
      {pageName && (
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.05em' }}>
            SMD
          </span>
          <span style={{ color: 'var(--border-2)', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
            {pageName}
          </span>
        </div>
      )}

      {/* Search */}
      <form
        onSubmit={handleSearchSubmit}
        style={{ position: 'relative', flex: 1, maxWidth: 220 }}
        className="ml-0 md:ml-2"
      >
        <svg
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}
          width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10l3.5 3.5" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search blueprints..."
          style={{
            width: '100%',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '5px 36px 5px 30px',
            fontSize: 12,
            color: 'var(--text)',
            outline: 'none',
          }}
          className="placeholder:text-[var(--text-4)] focus:border-[var(--border-2)]"
        />
        <kbd style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-4)', background: 'var(--bg-4)',
          border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px',
          pointerEvents: 'none',
        }}>
          ⌘K
        </kbd>
      </form>

      {/* Right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Usage pill */}
        <Link
          href="/billing"
          className="hidden sm:flex"
          style={{
            alignItems: 'center',
            gap: 7,
            padding: '4px 10px',
            borderRadius: 99,
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            textDecoration: 'none',
            transition: 'border-color 100ms',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.06em' }}>
            {planLabel}
          </span>
          <div style={{ width: 28, height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${usagePct}%`, background: usageColor, borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: usageColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {remaining} left
          </span>
        </Link>

        {/* New Blueprint */}
        <Link
          href="/generate"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all 120ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
            ;(e.currentTarget as HTMLElement).style.transform = 'none'
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M8 3v10M3 8h10" />
          </svg>
          <span className="hidden sm:inline">New Blueprint</span>
        </Link>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title="Çıkış yap"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            background: 'transparent',
            color: 'var(--text-4)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            opacity: signingOut ? 0.5 : 1,
            transition: 'all 120ms ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (!signingOut) {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--red)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--red)'
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-4)'
          }}
        >
          {signingOut ? (
            <span style={{ width: 10, height: 10, border: '1.5px solid var(--text-4)', borderTopColor: 'var(--text-2)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M6.5 5.5L10 8l-3.5 2.5M1 8h9" />
            </svg>
          )}
          <span className="hidden sm:inline">{signingOut ? 'Çıkılıyor...' : 'Çıkış'}</span>
        </button>

      </div>
    </header>
  )
}
