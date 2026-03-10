import { Section, Text } from '@react-email/components'
import {
  EmailLayout,
  EmailHeading,
  EmailParagraph,
  EmailButton,
  EmailCallout,
} from './components/EmailLayout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://system-md.com'

interface PlanUpgradedEmailProps {
  userName: string
  newPlan: 'solo' | 'agency'
  billingCycle: 'monthly' | 'yearly'
}

const PLAN_DETAILS = {
  solo: {
    name: 'Solo',
    price: { monthly: '$19', yearly: '$15' },
    emoji: '⚡',
    features: [
      'Unlimited blueprint generation',
      'Claude Sonnet access',
      'All export formats',
      'Priority support',
      'API access',
    ],
  },
  agency: {
    name: 'Agency',
    price: { monthly: '$59', yearly: '$47' },
    emoji: '🏢',
    features: [
      'Everything in Solo',
      '10 team members',
      'White-label export',
      'Custom brand colors',
      'Advanced analytics',
      'Dedicated support',
    ],
  },
}

export default function PlanUpgradedEmail({
  userName = 'there',
  newPlan = 'solo',
  billingCycle = 'monthly',
}: PlanUpgradedEmailProps) {
  const plan = PLAN_DETAILS[newPlan]
  const price = plan.price[billingCycle]

  return (
    <EmailLayout
      preview={`Plan upgraded: ${plan.name} ${plan.emoji} — Welcome, ${userName}!`}
    >
      <EmailHeading>
        Plan upgraded. {plan.emoji}
      </EmailHeading>

      <EmailParagraph>
        Congratulations, {userName}! You&apos;ve successfully upgraded to the{' '}
        <strong style={{ color: '#fafafa' }}>{plan.name}</strong>{' '}
        plan. You now have access to all premium features.
      </EmailParagraph>

      {/* Plan Card */}
      <Section style={styles.planCard}>
        <Section style={styles.planHeader}>
          <Text style={styles.planEmoji}>{plan.emoji}</Text>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planBilling}>
            {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing
          </Text>
          <Text style={styles.planPrice}>
            {price}
            <span style={styles.planPeriod}>/mo</span>
          </Text>
        </Section>
        <Section style={styles.divider} />
        <Text style={styles.featuresTitle}>Included features:</Text>
        {plan.features.map((feature) => (
          <Text key={feature} style={styles.featureItem}>
            ✓ {feature}
          </Text>
        ))}
      </Section>

      <EmailCallout variant="success">
        🎉 Your plan upgrade is now active. Start generating unlimited blueprints right away!
      </EmailCallout>

      <EmailButton href={`${APP_URL}/generate`}>
        start generating blueprints →
      </EmailButton>

      {billingCycle === 'yearly' && (
        <EmailParagraph>
          💰 By choosing the yearly plan, you&apos;re saving{' '}
          <strong style={{ color: '#22c55e' }}>
            {newPlan === 'solo' ? '$48' : '$144'}
          </strong>{' '}
          compared to monthly billing!
        </EmailParagraph>
      )}

      <EmailParagraph>
        Manage your billing and subscription details on the{' '}
        <a href={`${APP_URL}/billing`} style={styles.link}>
          billing page
        </a>
        .
      </EmailParagraph>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  planCard: {
    backgroundColor: '#09090b',
    borderRadius: '12px',
    padding: '28px',
    border: '1px solid #6366f1',
    margin: '24px 0',
  },
  planHeader: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  planEmoji: {
    fontSize: '40px',
    margin: '0 0 8px',
    lineHeight: '1',
  },
  planName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#fafafa',
    margin: '0 0 4px',
  },
  planBilling: {
    fontSize: '13px',
    color: '#71717a',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  planPrice: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#6366f1',
    margin: '0',
  },
  planPeriod: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#71717a',
  },
  divider: {
    borderTop: '1px solid #27272a',
    margin: '20px 0',
  },
  featuresTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#71717a',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  featureItem: {
    fontSize: '14px',
    color: '#22c55e',
    margin: '0 0 8px',
    lineHeight: '1.4',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
  },
}
