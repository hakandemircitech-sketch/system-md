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

const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-[15px] h-[15px] shrink-0">
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
    badge: 'AI',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-[15px] h-[15px] shrink-0">
        <path d="M9 1.5L4.5 8.5H8L7 14.5L12 7H8.5L9 1.5Z" />
      </svg>
    ),
  },
  {
    href: '/library',
    label: 'My Blueprints',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-[15px] h-[15px] shrink-0">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M5 5.5h6M5 8h4.5M5 10.5h3" />
      </svg>
    ),
  },
]

const NAV_BOTTOM = [
  {
    href: '/billing',
    label: 'Plan & Billing',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-[15px] h-[15px] shrink-0">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
        <path d="M1.5 6.5h13M4.5 10h3" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-[15px] h-[15px] shrink-0">
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
      </svg>
    ),
  },
  {
    href: '/',
    label: 'Ana Sayfa',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-[15px] h-[15px] shrink-0">
        <path d="M1.5 7L8 1.5 14.5 7V14H10V10H6v4H1.5V7z" />
      </svg>
    ),
  },
]

const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 30, team: 150 }

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore()
  const [usage, setUsage] = React.useState<{ remaining: number; limit: number } | null>(null)

  React.useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(d => { if (!d.error) setUsage(d) })
      .catch(() => {})
  }, [])

  const planLimit = PLAN_LIMITS[user.plan] ?? 10
  const usedCount = user.blueprint_count ?? 0
  const remaining = usage?.remaining ?? Math.max(0, planLimit - usedCount)
  const usedCount2 = planLimit - remaining
  const usagePct = Math.min(Math.round((usedCount2 / planLimit) * 100), 100)
  const usageColor = usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#eab308' : '#6366f1'

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

  const planLabel = ({ free: 'Free', pro: 'Pro', team: 'Team' } as Record<string, string>)[user.plan] ?? user.plan

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Logo ───────────────────────────────── */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/logo-square.png"
            alt="SystemMD"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}>
            System<span style={{ color: 'var(--accent)' }}>MD</span>
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-4)',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '2px 6px',
            letterSpacing: '0.04em',
          }}>
            beta
          </span>
        </div>
      </div>

      {/* ── Main Nav ───────────────────────────── */}
      <nav style={{ padding: '12px 10px 0', flexShrink: 0 }} onClick={() => setMobileSidebarOpen(false)}>
        {NAV.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 10px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--accent)' : 'var(--text-3)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                textDecoration: 'none',
                transition: 'all 120ms ease',
                paddingLeft: active ? 8 : 10,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-3)'
                }
              }}
            >
              <span style={{ color: active ? 'var(--accent)' : 'var(--text-4)', flexShrink: 0, transition: 'color 120ms' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 4,
                  padding: '1px 5px',
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Spacer ─────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Usage Widget ───────────────────────── */}
      <div style={{ padding: '0 10px 10px' }}>
        <div style={{
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-4)',
            }}>
              Generates used
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: usageColor }}>
              {usedCount2}<span style={{ color: 'var(--text-4)', fontWeight: 400 }}>/{planLimit}</span>
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: `${usagePct}%`,
              background: usageColor,
              borderRadius: 99,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', lineHeight: 1.4 }}>
            {remaining === 0 ? (
              <Link href="/billing" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                Upgrade plan →
              </Link>
            ) : (
              <span>
                {remaining} remaining on <span style={{ color: 'var(--text-3)', textTransform: 'capitalize' }}>{planLabel}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Nav ─────────────────────────── */}
      <div style={{ padding: '0 10px 8px', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        {NAV_BOTTOM.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 10px',
                borderRadius: 7,
                marginBottom: 1,
                fontSize: 12,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--accent)' : 'var(--text-4)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 100ms ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-3)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-4)'
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* ── User Row ───────────────────────────── */}
      <div style={{
        margin: '0 10px 12px',
        padding: '10px 12px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 30, height: 30,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'white',
          flexShrink: 0, letterSpacing: '-0.01em',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1, fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
            {planLabel} plan
          </div>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-4)',
            cursor: 'pointer',
            transition: 'all 100ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-4)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-3)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-4)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3M6.5 5.5L10 8l-3.5 2.5M1 8h9" />
          </svg>
        </button>
      </div>

    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside style={{
        width: 224,
        minWidth: 224,
        height: '100vh',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'none',
      }} className="md:!flex md:flex-col [&::-webkit-scrollbar]:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 bottom-0 w-[260px] flex flex-col bg-[var(--bg-2)] border-r border-[var(--border)] overflow-y-auto z-50 transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ overflowX: 'hidden' }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
