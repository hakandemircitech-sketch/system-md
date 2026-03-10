'use client'

import { motion } from 'framer-motion'

interface FeatureCardProps {
  tag: string
  title: string
  description: string
}

export default function FeatureCard({ tag, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--surface-line-strong)',
        borderRadius: '8px',
        padding: '24px',
        cursor: 'default',
      }}
    >
      <p
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--accent)',
          marginBottom: '12px',
        }}
      >
        {tag}
      </p>
      <h3
        style={{
          fontFamily: "'Geist', system-ui, sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--foreground)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "'Geist', system-ui, sans-serif",
          fontSize: '14px',
          color: 'var(--muted)',
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {description}
      </p>
    </motion.div>
  )
}
