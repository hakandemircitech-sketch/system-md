'use client'

import { useState } from 'react'

const TEMPLATES = [
  { id: 'welcome', label: 'Welcome Email', icon: '👋' },
  { id: 'blueprint-completed', label: 'Blueprint Completed', icon: '✅' },
  { id: 'usage-limit-80', label: 'Usage Limit 80%', icon: '🟡' },
  { id: 'usage-limit-100', label: 'Usage Limit 100%', icon: '🔴' },
  { id: 'plan-upgraded-solo', label: 'Plan Upgraded — Solo', icon: '⚡' },
  { id: 'plan-upgraded-agency', label: 'Plan Upgraded — Agency', icon: '🏢' },
  { id: 'payment-failed', label: 'Payment Failed', icon: '💳' },
]

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState(TEMPLATES[0].id)
  const [format, setFormat] = useState<'html' | 'text'>('html')

  const previewUrl = `/api/email-preview?template=${selected}&format=${format}`

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#09090b',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Sol Panel — Şablon Listesi */}
      <div
        style={{
          width: '280px',
          flexShrink: 0,
          borderRight: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #27272a',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1' }}>
            SystemMD
          </div>
          <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
            Email Preview
          </div>
        </div>

        {/* Format Toggle */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            gap: '8px',
          }}
        >
          {(['html', 'text'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: format === f ? '#6366f1' : '#18181b',
                color: format === f ? '#ffffff' : '#71717a',
                transition: 'all 0.15s',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Template List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: selected === t.id ? '#1e1b4b' : 'transparent',
                marginBottom: '2px',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{t.icon}</span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: selected === t.id ? '600' : '400',
                  color: selected === t.id ? '#a5b4fc' : '#a1a1aa',
                  lineHeight: '1.3',
                }}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom info */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #27272a',
            fontSize: '11px',
            color: '#52525b',
            lineHeight: '1.5',
          }}
        >
          Only accessible in development environment.
          <br />
          <code style={{ color: '#6366f1', fontSize: '10px' }}>
            /api/email-preview?template=…
          </code>
        </div>
      </div>

      {/* Sağ Panel — Önizleme */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div
          style={{
            height: '49px',
            borderBottom: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#71717a' }}>Preview:</span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#fafafa',
            }}
          >
            {TEMPLATES.find((t) => t.id === selected)?.label}
          </span>
          <div style={{ flex: 1 }} />
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '12px',
              color: '#6366f1',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #3730a3',
              backgroundColor: '#1e1b4b',
            }}
          >
            Open in new tab ↗
          </a>
        </div>

        {/* iFrame Preview */}
        {format === 'html' ? (
          <iframe
            key={`${selected}-${format}`}
            src={previewUrl}
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: '#ffffff',
            }}
            title={`Email Preview: ${selected}`}
          />
        ) : (
          <iframe
            key={`${selected}-${format}`}
            src={previewUrl}
            style={{
              flex: 1,
              border: 'none',
              backgroundColor: '#09090b',
              color: '#a1a1aa',
              fontFamily: 'monospace',
              padding: '20px',
            }}
            title={`Email Text Preview: ${selected}`}
          />
        )}
      </div>
    </div>
  )
}
