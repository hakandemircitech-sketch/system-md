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
    default: 'SystemMD — AI Blueprint Generator for Developers & Indie Hackers',
    template: '%s | SystemMD',
  },
  description:
    'Turn your app idea into a production-ready blueprint in seconds. Get tech stack, database schema, API design, file structure and revenue model — free, no sign-up required. Download as ZIP.',
  keywords: [
    'ai blueprint generator',
    'software architecture generator',
    'ai project planner',
    'generate software architecture from idea',
    'startup tech stack generator',
    'ai tools for developers',
    'indie hacker tools',
    'project blueprint ai',
    'api design generator',
    'database schema generator',
    'cursor ai build kit',
    'nextjs project generator',
    'saas blueprint',
    'free ai developer tool',
    'systemmd',
  ],
  metadataBase: new URL('https://system-md.com'),
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
    shortcut: '/icon',
  },
  applicationName: 'SystemMD',
  authors: [{ name: 'SystemMD', url: 'https://system-md.com' }],
  creator: 'SystemMD',
  publisher: 'SystemMD',
  category: 'Developer Tools',
  openGraph: {
    title: 'SystemMD — AI Blueprint Generator for Developers',
    description:
      'Turn your app idea into a production-ready blueprint in seconds. Tech stack, DB schema, API design, file structure — free, no sign-up. Download as ZIP.',
    type: 'website',
    url: 'https://system-md.com',
    siteName: 'SystemMD',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SystemMD — AI Blueprint Generator for Developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SystemMD — AI Blueprint Generator for Developers',
    description:
      'Turn your app idea into a production-ready blueprint in seconds. Free, no sign-up. Download as ZIP.',
    images: ['/og-image.png'],
    creator: '@systemmd',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://system-md.com',
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
