'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUiStore } from '@/stores/uiStore'
import type { DbUser } from '@/types/database'

interface SidebarProps {
  user: DbUser
}

const NAV_MAIN = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" />
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" />
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" />
        <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/generate',
    label: 'Generate',
    badge: 'NEW',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <path d="M9 2L11.5 7H14L10 10.5L11.5 14L8 11.5L4.5 14L6 10.5L2 7H4.5L7 2H9Z" />
      </svg>
    ),
  },
  {
    href: '/library',
    label: 'My Blueprints',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M5 6h6M5 9h4" />
      </svg>
    ),
  },
]

const NAV_WORKSPACE = [
  {
    href: '/billing',
    label: 'Plan & Billing',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
        <path d="M1.5 7h13M4.5 10.5h3" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
      </svg>
    ),
  },
]

// Plan badge stilleri
const PLAN_LABELS: Record<string, string> = {
  free:   'Free',
  solo:   'Solo',
  pro:    'Pro',
  scale:  'Scale',
  agency: 'Agency',
}

type PlanStyle = { color: string; background: string; border: string }

const PLAN_BADGE_STYLES: Record<string, PlanStyle> = {
  free: {
    color:      'var(--text-4)',
    background: 'var(--bg-4)',
    border:     'var(--border)',
  },
  solo: {
    color:      'var(--accent)',
    background: 'var(--accent-dim)',
    border:     'var(--accent-border)',
  },
  pro: {
    color:      'var(--accent)',
    background: 'var(--accent-dim)',
    border:     'var(--accent-border)',
  },
  scale: {
    color:      'var(--purple)',
    background: 'rgba(139,92,246,0.10)',
    border:     'rgba(139,92,246,0.25)',
  },
  agency: {
    color:      'var(--purple)',
    background: 'rgba(139,92,246,0.10)',
    border:     'rgba(139,92,246,0.25)',
  },
}

const DEFAULT_PLAN_STYLE: PlanStyle = {
  color:      'var(--text-4)',
  background: 'var(--bg-4)',
  border:     'var(--border)',
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div style={{ paddingLeft: '8px', marginTop: '16px', marginBottom: '4px' }}>
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '9px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-3)',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function NavItem({
  href,
  label,
  icon,
  badge,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'group relative flex items-center gap-2.5 py-[6px] rounded-[var(--radius)] text-[13px] mb-[1px] whitespace-nowrap transition-all duration-[120ms] no-underline leading-none',
        // active item: borderLeft 2px olduğu için pl-[10px] (12-2=10), inactive: pl-3
        active
          ? 'pr-3 pl-[10px] bg-[var(--accent-dim)] text-[var(--accent)] font-medium border-l-2 border-l-[var(--accent)]'
          : 'px-3 text-[var(--text-3)] hover:bg-[var(--bg-3)] hover:text-[var(--text)]',
      ].join(' ')}
    >
      <span className={[
        'shrink-0 transition-all duration-[120ms]',
        active ? 'text-[var(--accent)]' : 'text-[var(--text-4)] group-hover:text-[var(--text-3)]',
      ].join(' ')}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto font-mono text-[9px] bg-[var(--accent-dim)] text-[var(--accent)] rounded-full px-1.5 py-[1px] shrink-0">
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore()
  const [usage, setUsage] = React.useState<{ used: number; limit: number; remaining: number } | null>(null)

  React.useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => { if (!d.error) setUsage(d) })
      .catch(() => {})
  }, [])

  const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }
  const planLimit = PLAN_LIMITS[user.plan] ?? 10
  const usedCount = user.blueprint_count ?? 0
  const remaining = Math.max(0, (usage?.remaining ?? (planLimit - usedCount)))
  const usagePct = Math.min(Math.round(((planLimit - remaining) / planLimit) * 100), 100)
  const usageBarColor = usagePct >= 90 ? 'var(--red)' : usagePct >= 70 ? 'var(--yellow)' : 'var(--accent)'

  const displayName = user.full_name ?? user.email.split('@')[0] ?? 'User'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  function handleNavClick() {
    setMobileSidebarOpen(false)
  }

  const planStyle = PLAN_BADGE_STYLES[user.plan] ?? DEFAULT_PLAN_STYLE

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--border)] shrink-0">
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}
        >
          System<span style={{ color: 'var(--accent)' }}>MD</span>
        </span>
        <span
          className="ml-auto"
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '9px',
            color: 'var(--text-4)',
            backgroundColor: 'var(--bg-4)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 5px',
          }}
        >
          beta
        </span>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-2 py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        onClick={handleNavClick}
      >
        {NAV_MAIN.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={handleNavClick} />
        ))}

        <NavSection title="Workspace">
          {NAV_WORKSPACE.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} onClick={handleNavClick} />
          ))}
        </NavSection>
      </nav>

      {/* Usage Widget */}
      <div style={{
        margin: '0 8px 8px',
        padding: '10px 12px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
            Generates
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: usageBarColor }}>
            {remaining}/{planLimit}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-4)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${usagePct}%`,
            background: usageBarColor,
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ marginTop: 6, fontSize: '10px', color: 'var(--text-3)' }}>
          {remaining === 0 ? (
            <Link href="/billing" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Upgrade for more →
            </Link>
          ) : (
            <span>{remaining} left on <span style={{ textTransform: 'capitalize' }}>{user.plan}</span> plan</span>
          )}
        </div>
      </div>

      {/* User + Sign out */}
      <div className="border-t border-[var(--border)] shrink-0">
        <div className="px-3 py-2.5 flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--purple)] flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
            {initials}
          </div>

          {/* Name + plan badge */}
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[var(--text)] truncate leading-tight">
              {displayName}
            </div>
            <div className="mt-[2px]">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  color: planStyle.color,
                  backgroundColor: planStyle.background,
                  border: `1px solid ${planStyle.border}`,
                }}
              >
                {PLAN_LABELS[user.plan] ?? user.plan}
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="w-6 h-6 flex items-center justify-center rounded-[4px] text-[var(--text-4)] hover:bg-[var(--bg-4)] hover:text-[var(--text-3)] transition-all duration-[100ms] shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M6.5 5.5L10 8l-3.5 2.5M1 8h9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] min-w-[220px] h-screen bg-[var(--bg-2)] border-r border-[var(--border)] flex-col overflow-hidden shrink-0 z-10">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 bottom-0 w-[260px] bg-[var(--bg-2)] border-r border-[var(--border)] flex flex-col overflow-hidden z-50 transition-transform duration-300 ease-in-out',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
