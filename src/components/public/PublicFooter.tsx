'use client'

import Link from 'next/link'
import { FOOTER } from '@/lib/content/public'

export default function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        backgroundColor: 'var(--background)',
        borderTop: '1px solid var(--surface-line)',
        paddingTop: '32px',
        paddingBottom: '32px',
      }}
    >
      <div
        style={{
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '0 32px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left */}
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '12px',
            color: 'var(--muted)',
          }}
        >
          System<span style={{ color: 'var(--accent)' }}>MD</span>
          {' · '}{FOOTER.tagline}{' · '}{year}
        </span>

        {/* Center */}
        <div
          className="absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5"
          style={{
            border: '1px solid var(--surface-line-strong)',
            backgroundColor: 'var(--bg-2)',
            borderRadius: '9999px',
            padding: '4px 12px',
          }}
        >
          <span
            className="animate-pulse"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              display: 'inline-block',
              animationDuration: '2.5s',
            }}
          />
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '11px',
              color: 'var(--muted)',
            }}
          >
            built with SystemMD
          </span>
        </div>

        {/* Right */}
        <div
          className="flex items-center gap-4"
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '11px',
          }}
        >
          {FOOTER.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
