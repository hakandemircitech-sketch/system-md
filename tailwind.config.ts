// ============================================================
// SystemMD BLUEPRINT PLATFORM — tailwind.config.ts
// ============================================================

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-geist-mono)', 'monospace'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        bg:         'var(--bg)',
        'bg-2':     'var(--bg-2)',
        'bg-3':     'var(--bg-3)',
        'bg-4':     'var(--bg-4)',
        border:     'var(--border)',
        'border-2': 'var(--border-2)',
        text:       'var(--text)',
        'text-2':   'var(--text-2)',
        'text-3':   'var(--text-3)',
        'text-4':   'var(--text-4)',
        accent:     'var(--accent)',
        green:      'var(--green)',
        yellow:     'var(--yellow)',
        red:        'var(--red)',
        purple:     'var(--purple)',
        blue:       'var(--blue)',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4' }],
        xs:    ['11px', { lineHeight: '1.4' }],
        sm:    ['12px', { lineHeight: '1.5' }],
        base:  ['13px', { lineHeight: '1.6' }],
        md:    ['14px', { lineHeight: '1.6' }],
        lg:    ['16px', { lineHeight: '1.7' }],
        xl:    ['18px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['32px', { lineHeight: '1.2' }],
        '4xl': ['48px', { lineHeight: '1.1' }],
        '5xl': ['64px', { lineHeight: '1.05' }],
        hero:  ['88px', { lineHeight: '1.0' }],
      },
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
        '22':  '88px',
        '26':  '104px',
        '30':  '120px',
      },
      borderRadius: {
        none:    '0',
        sm:      '4px',
        DEFAULT: '6px',
        md:      '8px',
        lg:      '10px',
        xl:      '12px',
        '2xl':   '16px',
        full:    '9999px',
      },
      boxShadow: {
        sm:     '0 1px 4px rgba(0, 0, 0, 0.3)',
        DEFAULT:'0 4px 16px rgba(0, 0, 0, 0.4)',
        md:     '0 4px 16px rgba(0, 0, 0, 0.4)',
        lg:     '0 8px 32px rgba(0, 0, 0, 0.5)',
        xl:     '0 24px 60px rgba(0, 0, 0, 0.6)',
        accent: '0 8px 32px rgba(99, 102, 241, 0.3)',
        green:  '0 4px 16px rgba(34, 197, 94, 0.25)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        pulseDot: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '50%':       { boxShadow: '0 0 0 6px transparent' },
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease both',
        'fade-in':   'fadeIn 0.4s ease both',
        'slide-in':  'slideIn 0.4s ease both',
        'blink':     'blink 1.1s step-end infinite',
        'shimmer':   'shimmer 1.5s infinite',
        'ticker':    'ticker 22s linear infinite',
        'pulse-dot': 'pulseDot 2s ease infinite',
      },
      screens: {
        xs:   '480px',
        sm:   '640px',
        md:   '768px',
        lg:   '1024px',
        xl:   '1280px',
        '2xl':'1536px',
      },
    },
  },
  plugins: [],
}

export default config
