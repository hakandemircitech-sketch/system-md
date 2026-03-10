import { Section, Text } from '@react-email/components'
import {
  EmailLayout,
  EmailHeading,
  EmailParagraph,
  EmailButton,
  EmailCallout,
} from './components/EmailLayout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://system-md.com'

interface UsageLimitEmailProps {
  userName: string
  usedCount: number
  totalLimit: number
  percentage: 80 | 100
}

export default function UsageLimitEmail({
  userName = 'there',
  usedCount = 16,
  totalLimit = 20,
  percentage = 80,
}: UsageLimitEmailProps) {
  const isMaxed = percentage === 100

  return (
    <EmailLayout
      preview={
        isMaxed
          ? `You've reached your blueprint limit — upgrade your plan`
          : `Your blueprint usage is ${percentage}% full (${usedCount}/${totalLimit})`
      }
    >
      <EmailHeading>
        {isMaxed ? '🔴 Limit reached.' : '🟡 Approaching your limit.'}
      </EmailHeading>

      <EmailParagraph>
        Hi {userName},{' '}
        {isMaxed
          ? `you've used all ${totalLimit} of your monthly blueprints.`
          : `you've used ${percentage}% of your ${totalLimit} monthly blueprints.`}
      </EmailParagraph>

      {/* Progress Bar */}
      <Section style={styles.progressContainer}>
        <Section style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Usage</Text>
          <Text style={styles.progressCount}>
            {usedCount} / {totalLimit} blueprint
          </Text>
        </Section>
        <Section style={styles.progressTrack}>
          <Section
            style={{
              ...styles.progressFill,
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isMaxed ? '#ef4444' : '#f59e0b',
            }}
          />
        </Section>
        <Text style={{ ...styles.progressPercent, color: isMaxed ? '#ef4444' : '#f59e0b' }}>
          {percentage}% used
        </Text>
      </Section>

      <EmailCallout variant={isMaxed ? 'danger' : 'warning'}>
        {isMaxed ? (
          <>
            ⚠️ <strong style={{ color: '#fafafa' }}>You can&apos;t create new blueprints.</strong>
            <br />
            Upgrade your plan to unlock unlimited blueprint generation.
          </>
        ) : (
          <>
            💡 You have only{' '}
            <strong style={{ color: '#fafafa' }}>{totalLimit - usedCount} blueprints</strong>{' '}
            remaining this month. Consider upgrading before you run out.
          </>
        )}
      </EmailCallout>

      {/* Plan Comparison */}
      <Section style={styles.plans}>
        <Section style={styles.plan}>
          <Text style={styles.planName}>Solo</Text>
          <Text style={styles.planPrice}>$19<span style={styles.planPeriod}>/mo</span></Text>
          <Text style={styles.planFeature}>Unlimited blueprints</Text>
          <Text style={styles.planFeature}>Priority access</Text>
          <Text style={styles.planFeature}>All models</Text>
        </Section>
        <Section style={{ ...styles.plan, ...styles.planFeatured }}>
          <Text style={styles.planBadge}>Recommended</Text>
          <Text style={{ ...styles.planName, color: '#fafafa' }}>Agency</Text>
          <Text style={styles.planPrice}>$59<span style={styles.planPeriod}>/mo</span></Text>
          <Text style={styles.planFeature}>Unlimited blueprints</Text>
          <Text style={styles.planFeature}>Team sharing</Text>
          <Text style={styles.planFeature}>White-label export</Text>
        </Section>
      </Section>

      <EmailButton href={`${APP_URL}/billing`}>
        upgrade plan →
      </EmailButton>

      <EmailParagraph>
        If you&apos;d rather wait, your limit resets at the start of next month.
        Monthly reset date: the 1st of every month.
      </EmailParagraph>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  progressContainer: {
    margin: '24px 0',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '13px',
    color: '#71717a',
    margin: '0 0 8px',
    fontWeight: '600',
  },
  progressCount: {
    fontSize: '13px',
    color: '#a1a1aa',
    margin: '0 0 8px',
    textAlign: 'right' as const,
  },
  progressTrack: {
    backgroundColor: '#27272a',
    borderRadius: '999px',
    height: '8px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '8px',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  },
  progressPercent: {
    fontSize: '13px',
    fontWeight: '600',
    margin: '8px 0 0',
    textAlign: 'right' as const,
  },
  plans: {
    display: 'flex',
    gap: '12px',
    margin: '24px 0',
  },
  plan: {
    flex: 1,
    backgroundColor: '#09090b',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #27272a',
  },
  planFeatured: {
    borderColor: '#6366f1',
    position: 'relative',
  },
  planBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '0 0 8px',
  },
  planName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#d4d4d8',
    margin: '0 0 4px',
  },
  planPrice: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#6366f1',
    margin: '4px 0 12px',
  },
  planPeriod: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#71717a',
  },
  planFeature: {
    fontSize: '13px',
    color: '#71717a',
    margin: '0 0 4px',
    lineHeight: '1.4',
  },
}
