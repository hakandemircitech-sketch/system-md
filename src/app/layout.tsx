import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: {
    default: 'SystemMD — Turn Ideas into Shippable Products',
    template: '%s | SystemMD',
  },
  description:
    "Turn startup ideas into AI blueprints in 60 seconds. Tech stack, DB schema, Cursor build kit — all included.",
  keywords: ['startup', 'ai', 'blueprint', 'saas', 'claude', 'anthropic', 'systemmd', 'cursor', 'nextjs'],
  metadataBase: new URL('https://system-md.com'),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
    shortcut: '/icon',
  },
  applicationName: 'SystemMD',
  openGraph: {
    title: 'SystemMD — Turn Ideas into Shippable Products',
    description:
      "Turn startup ideas into AI blueprints in 60 seconds. Tech stack, DB schema, Cursor build kit — all included.",
    type: 'website',
    url: 'https://system-md.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SystemMD — Turn Ideas into Shippable Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SystemMD — Turn Ideas into Shippable Products',
    description: "Turn startup ideas into AI blueprints in 60 seconds.",
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ '--font-serif': 'var(--font-instrument-serif)' } as React.CSSProperties}>
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
