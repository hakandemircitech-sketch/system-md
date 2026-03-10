import { Link, Section, Text } from '@react-email/components'
import {
  EmailLayout,
  EmailHeading,
  EmailParagraph,
  EmailButton,
  EmailCallout,
} from './components/EmailLayout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://system-md.com'

interface WelcomeEmailProps {
  userName: string
}

export default function WelcomeEmail({ userName = 'there' }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to SystemMD, ${userName}! Your first blueprint awaits.`}>
      <EmailHeading>Welcome, {userName}.</EmailHeading>

      <EmailParagraph>
        Thanks for joining SystemMD Blueprint Platform. You&apos;re ready to turn startup ideas
        into complete architecture packages — in minutes.
      </EmailParagraph>

      <EmailCallout variant="info">
        🎯 Your <strong style={{ color: '#fafafa' }}>Free plan</strong> includes{' '}
        <strong style={{ color: '#fafafa' }}>20 blueprints</strong> per month. Upgrade anytime
        to unlock more.
      </EmailCallout>

      <Text style={styles.stepsTitle}>Get started:</Text>

      <Section style={styles.stepsList}>
        {[
          { num: '1', text: 'Go to the dashboard and create your first blueprint' },
          { num: '2', text: 'Enter your idea, industry, and stage' },
          { num: '3', text: 'Get your complete architecture kit in 60 seconds' },
        ].map((step) => (
          <Section key={step.num} style={styles.step}>
            <Text style={styles.stepNum}>{step.num}</Text>
            <Text style={styles.stepText}>{step.text}</Text>
          </Section>
        ))}
      </Section>

      <EmailButton href={`${APP_URL}/generate`}>
        create my first blueprint →
      </EmailButton>

      <EmailParagraph>
        If you run into any issues, just reply to this email. We&apos;re here to help.
      </EmailParagraph>

      <Text style={styles.signature}>
        — The SystemMD Team
      </Text>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  stepsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4d4d8',
    margin: '24px 0 12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  stepsList: {
    margin: '0 0 8px',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    margin: '0 0 12px',
  },
  stepNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: '24px',
    margin: '0 12px 0 0',
    display: 'inline-block',
    flexShrink: 0,
  },
  stepText: {
    fontSize: '14px',
    color: '#a1a1aa',
    margin: '0',
    lineHeight: '1.5',
    display: 'inline-block',
  },
  signature: {
    fontSize: '14px',
    color: '#71717a',
    margin: '24px 0 0',
    fontStyle: 'italic',
  },
}
