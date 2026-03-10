import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
  Img,
} from '@react-email/components'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://system-md.com'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>SystemMD</Text>
            <Text style={styles.logoSub}>Blueprint Platform</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              SystemMD Blueprint Platform •{' '}
              <Link href={APP_URL} style={styles.footerLink}>
                system-md.com
              </Link>
            </Text>
            <Text style={styles.footerText}>
              Don&apos;t want to receive these emails?{' '}
              <Link href={`${APP_URL}/settings`} style={styles.footerLink}>
                Update
              </Link>{' '}
              your notification settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Ortak Bileşenler ────────────────────────────────────────────────────────

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>
}

export function EmailParagraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>
}

export function EmailButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Section style={styles.buttonSection}>
      <Link href={href} style={styles.button}>
        {children}
      </Link>
    </Section>
  )
}

export function EmailCallout({
  children,
  variant = 'info',
}: {
  children: React.ReactNode
  variant?: 'info' | 'warning' | 'success' | 'danger'
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    info: { backgroundColor: '#1e1b4b', borderLeft: '4px solid #6366f1' },
    warning: { backgroundColor: '#1c1408', borderLeft: '4px solid #f59e0b' },
    success: { backgroundColor: '#052e16', borderLeft: '4px solid #22c55e' },
    danger: { backgroundColor: '#1c0606', borderLeft: '4px solid #ef4444' },
  }
  return (
    <Section style={{ ...styles.callout, ...variantStyles[variant] }}>
      <Text style={styles.calloutText}>{children}</Text>
    </Section>
  )
}

// ─── Stiller ────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#09090b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
  },
  header: {
    textAlign: 'center' as const,
    paddingBottom: '32px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#6366f1',
    margin: '0',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: '13px',
    color: '#71717a',
    margin: '4px 0 0',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  content: {
    backgroundColor: '#18181b',
    borderRadius: '12px',
    padding: '40px',
    border: '1px solid #27272a',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#fafafa',
    margin: '0 0 16px',
    lineHeight: '1.3',
  },
  paragraph: {
    fontSize: '15px',
    color: '#a1a1aa',
    lineHeight: '1.6',
    margin: '0 0 16px',
  },
  buttonSection: {
    textAlign: 'center' as const,
    margin: '28px 0',
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  callout: {
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '20px 0',
  },
  calloutText: {
    fontSize: '14px',
    color: '#d4d4d8',
    margin: '0',
    lineHeight: '1.5',
  },
  hr: {
    borderColor: '#27272a',
    margin: '32px 0',
  },
  footer: {
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '13px',
    color: '#52525b',
    margin: '4px 0',
    lineHeight: '1.5',
  },
  footerLink: {
    color: '#6366f1',
    textDecoration: 'none',
  },
}
