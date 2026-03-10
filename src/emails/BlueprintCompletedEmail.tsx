import { Section, Text } from '@react-email/components'
import {
  EmailLayout,
  EmailHeading,
  EmailParagraph,
  EmailButton,
  EmailCallout,
} from './components/EmailLayout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://system-md.com'

interface BlueprintCompletedEmailProps {
  userName: string
  blueprintTitle: string
  blueprintScore: number
  blueprintId: string
}

export default function BlueprintCompletedEmail({
  userName = 'there',
  blueprintTitle = 'AI-Powered E-Commerce Platform',
  blueprintScore = 87,
  blueprintId = 'bp_123',
}: BlueprintCompletedEmailProps) {
  const scoreColor = blueprintScore >= 80 ? '#22c55e' : blueprintScore >= 60 ? '#f59e0b' : '#ef4444'
  const scoreLabel = blueprintScore >= 80 ? 'Strong idea!' : blueprintScore >= 60 ? 'Promising' : 'Needs work'

  return (
    <EmailLayout
      preview={`Blueprint ready: ${blueprintTitle} — Score: ${blueprintScore}/100`}
    >
      <EmailHeading>Blueprint ready.</EmailHeading>

      <EmailParagraph>
        Hi {userName}, your blueprint for{' '}
        <strong style={{ color: '#fafafa' }}>{blueprintTitle}</strong>{' '}
        is complete. Ready to explore your full architecture package?
      </EmailParagraph>

      {/* Score Card */}
      <Section style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Total Score</Text>
        <Text style={{ ...styles.scoreValue, color: scoreColor }}>
          {blueprintScore}
          <span style={styles.scoreMax}>/100</span>
        </Text>
        <Text style={{ ...styles.scoreStatus, color: scoreColor }}>
          {scoreLabel}
        </Text>
      </Section>

      <EmailCallout variant="success">
        📦 <strong style={{ color: '#fafafa' }}>Your blueprint package includes:</strong>
        <br />
        Tech stack • DB schema • API design • UI architecture • Revenue model • Cursor-ready build kit
      </EmailCallout>

      <EmailButton href={`${APP_URL}/library?id=${blueprintId}`}>
        view blueprint →
      </EmailButton>

      <Section style={styles.actionsRow}>
        <Text style={styles.actionsTitle}>Next steps:</Text>
        <Text style={styles.actionItem}>
          🔨 Download your build kit from <strong style={{ color: '#d4d4d8' }}>Build Center</strong>
        </Text>
        <Text style={styles.actionItem}>
          🚀 Deploy your project from <strong style={{ color: '#d4d4d8' }}>Deployments</strong>
        </Text>
        <Text style={styles.actionItem}>
          📊 Track your progress in <strong style={{ color: '#d4d4d8' }}>Analytics</strong>
        </Text>
      </Section>
    </EmailLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  scoreCard: {
    backgroundColor: '#09090b',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    margin: '24px 0',
    border: '1px solid #27272a',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#71717a',
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: '56px',
    fontWeight: '800',
    margin: '0',
    lineHeight: '1',
  },
  scoreMax: {
    fontSize: '24px',
    fontWeight: '400',
    color: '#52525b',
  },
  scoreStatus: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '8px 0 0',
  },
  actionsRow: {
    margin: '8px 0 0',
  },
  actionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d4d4d8',
    margin: '0 0 12px',
  },
  actionItem: {
    fontSize: '14px',
    color: '#a1a1aa',
    margin: '0 0 8px',
    lineHeight: '1.5',
  },
}
