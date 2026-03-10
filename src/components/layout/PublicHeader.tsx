'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function PublicHeader() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme]           = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Tema değişince en yakın [data-theme] wrapper'ı güncelle
  useEffect(() => {
    const wrapper = document.querySelector('[data-theme]')
    if (wrapper) wrapper.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  const close = () => setMobileOpen(false)

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'var(--header-bg)',
          borderBottom: `1px solid ${scrolled ? 'var(--surface-line-strong)' : 'var(--surface-line)'}`,
          transition: 'border-color 200ms ease',
        }}
      >
        <Logo />

        {/* Desktop nav */}
        <nav
          className="hidden md:flex"
          style={{ alignItems: 'center', gap: '12px' }}
        >
          <GhostLink href="#pricing">pricing</GhostLink>
          <GhostLink href="/auth/login">sign in</GhostLink>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <FilledLink href="/auth/signup">start building →</FilledLink>
        </nav>

        {/* Mobile: tema toggle + hamburger */}
        <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menüyü aç"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: '1px solid var(--surface-line-strong)',
              borderRadius: '6px',
              background: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4h12M2 8h12M2 12h12"
                stroke="var(--foreground)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Overlay top bar */}
          <div
            style={{
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              flexShrink: 0,
            }}
          >
            <Logo onClick={close} />
            <button
              onClick={close}
              aria-label="Menüyü kapat"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                border: '1px solid var(--surface-line-strong)',
                borderRadius: '6px',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="var(--foreground)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Overlay nav links */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
            }}
          >
            <MobileLink href="#pricing" onClick={close}>pricing</MobileLink>
            <MobileLink href="/auth/login" onClick={close}>sign in</MobileLink>
            <MobileLink href="/auth/signup" onClick={close} accent>
              start building →
            </MobileLink>
          </div>
        </div>
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
    >
      <Image
        src="/logo-yatay.png"
        alt="System-md"
        width={1024}
        height={571}
        priority
        style={{
          height: '28px',
          width: 'auto',
          objectFit: 'contain',
          mixBlendMode: 'multiply',
        }}
      />
    </Link>
  )
}

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '52px',
        height: '26px',
        borderRadius: '999px',
        border: '1px solid var(--surface-line-strong)',
        background: isDark ? '#1a1a2e' : '#e8e6e0',
        cursor: 'pointer',
        padding: '3px',
        transition: 'background 300ms ease, border-color 300ms ease',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      {/* Track icons */}
      <span style={{
        position: 'absolute',
        left: '7px',
        fontSize: '10px',
        lineHeight: 1,
        opacity: isDark ? 0 : 1,
        transition: 'opacity 200ms ease',
        pointerEvents: 'none',
      }}>☀️</span>
      <span style={{
        position: 'absolute',
        right: '7px',
        fontSize: '10px',
        lineHeight: 1,
        opacity: isDark ? 1 : 0,
        transition: 'opacity 200ms ease',
        pointerEvents: 'none',
      }}>🌙</span>
      {/* Thumb */}
      <span style={{
        display: 'block',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: isDark ? '#6366f1' : '#ffffff',
        boxShadow: isDark
          ? '0 0 6px rgba(99,102,241,0.6)'
          : '0 1px 4px rgba(0,0,0,0.18)',
        transform: isDark ? 'translateX(26px)' : 'translateX(0)',
        transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1), background 300ms ease, box-shadow 300ms ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }} />
    </button>
  )
}

function GhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: '12px',
        color: 'var(--muted)',
        textDecoration: 'none',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
    >
      {children}
    </Link>
  )
}

function FilledLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: '12px',
        backgroundColor: 'var(--foreground)',
        color: 'var(--background)',
        padding: '6px 12px',
        borderRadius: '4px',
        textDecoration: 'none',
        transition: 'opacity 150ms ease, transform 150ms ease',
        display: 'inline-block',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.85'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </Link>
  )
}

function MobileLink({
  href,
  children,
  onClick,
  accent = false,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: '20px',
        color: accent ? 'var(--accent)' : 'var(--foreground)',
        textDecoration: 'none',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = accent ? 'var(--foreground)' : 'var(--accent)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = accent ? 'var(--accent)' : 'var(--foreground)')
      }
    >
      {children}
    </Link>
  )
}
