import { Section, Text } from '@react-email/components'
import {
  EmailLayout,
  EmailHeading,
  EmailParagraph,
  EmailButton,
  EmailCallout,
} from './components/EmailLayout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://system-md.com'

interface PaymentFailedEmailProps {
  userName: string
  planName: string
  nextRetryDate: string
}

export default function PaymentFailedEmail({
  userName = 'there',
  planName = 'Solo',
  nextRetryDate = 'March 13, 2026',
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout
      preview={`Payment failed — action required for your ${planName} plan`}
    >
      <EmailHeading>Payment failed.</EmailHeading>

      <EmailParagraph>
        Hi {userName}, the payment for your{' '}
        <strong style={{ color: '#fafafa' }}>{planName}</strong> plan could not be processed.
        Please update your payment details to keep your subscription active.
      </EmailParagraph>

      <EmailCallout variant="danger">
        ⚠️ <strong style={{ color: '#fafafa' }}>Next automatic retry:</strong>{' '}
        {nextRetryDate}
        <br />
        If your payment details are not updated by then, your subscription will be cancelled
        and you&apos;ll be moved to the Free plan.
      </EmailCallout>

      {/* Common Reasons */}
      <Section style={styles.reasonsBox}>
        <Text style={styles.reasonsTitle}>Common reasons:</Text>
        <Text style={styles.reasonItem}>💳 Insufficient card balance</Text>
        <Text style={styles.reasonItem}>🔒 Card limit exceeded</Text>
        <Text style={styles.reasonItem}>📅 Card expired</Text>
        <Text style={styles.reasonItem}>🏦 Bank declined the transaction</Text>
      </Section>

      <EmailButton href={`${APP_URL}/billing`}>
        update payment details →
      </EmailButton>

      <Section style={styles.stepsSection}>
        <Text style={styles.stepsTitle}>How to update:</Text>
        <Text style={styles.stepItem}>
          1. <strong style={{ color: '#d4d4d8' }}>Go to the billing page</strong>
        </Text>
        <Text style={styles.stepItem}>
          2. Click the <strong style={{ color: '#d4d4d8' }}>&quot;Payment Method&quot;</strong> section
        </Text>
        <Text style={styles.stepItem}>
          3. <strong style={{ color: '#d4d4d8' }}>Enter your new card details</strong>
        </Text>
        <Text style={styles.stepItem}>
          4. <strong style={{ color: '#d4d4d8' }}>Save</strong> — payment will be retried automatically
        </Text>
      </Section>

      <EmailCallout variant="info">
        🔐 Your payment details are encrypted and stored securely by Stripe. SystemMD never
        has access to your card information.
      </EmailCallout>

      <EmailParagraph>
        If you need help, reply to this email or reach out to our support team.
      </EmailParagraph>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  reasonsBox: {
    backgroundColor: '#09090b',
    borderRadius: '10px',
    padding: '20px 24px',
    margin: '20px 0',
    border: '1px solid #27272a',
  },
  reasonsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#71717a',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  reasonItem: {
    fontSize: '14px',
    color: '#a1a1aa',
    margin: '0 0 8px',
    lineHeight: '1.4',
  },
  stepsSection: {
    margin: '8px 0 24px',
  },
  stepsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4d4d8',
    margin: '0 0 12px',
  },
  stepItem: {
    fontSize: '14px',
    color: '#a1a1aa',
    margin: '0 0 8px',
    lineHeight: '1.5',
  },
}
