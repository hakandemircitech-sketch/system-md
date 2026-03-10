'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { HERO } from '@/lib/content/public'

export default function HeroSection() {
  const titleRef = useRef(null)
  const isInView = useInView(titleRef, { once: true, margin: '-100px' })

  const handleScrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      style={{
        backgroundColor: 'var(--background)',
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(var(--land-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--land-border) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ paddingTop: '128px', paddingBottom: '96px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          style={{ marginBottom: '32px' }}
        >
          <div
            className="inline-flex items-center gap-2"
            style={{
              border: '1px solid var(--surface-line-strong)',
              backgroundColor: 'var(--surface)',
              borderRadius: '9999px',
              padding: '4px 12px',
            }}
          >
            <span
            className="animate-pulse"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--term-green)',
              display: 'inline-block',
              animationDuration: '2.5s',
            }}
            />
            <span
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '11px',
                color: 'var(--muted)',
              }}
            >
              {HERO.eyebrow}
            </span>
          </div>
        </motion.div>

        {/* Title — word-by-word reveal */}
        <h1
          ref={titleRef}
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: 400,
            letterSpacing: '-0.03em',
            maxWidth: '672px',
            lineHeight: 1.1,
          }}
          className="text-[36px] md:text-[60px]"
        >
          {HERO.title.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{
                display: 'inline-block',
                marginRight: '0.3em',
                color: i === HERO.title.length - 1 ? 'var(--accent)' : 'var(--foreground)',
              }}
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: HERO.title.length * 0.08, duration: 0.4 }}
            style={{ color: 'var(--land-text-2)', display: 'inline-block' }}
          >
            .
          </motion.span>
        </h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            fontFamily: "'Geist', system-ui, sans-serif",
            fontSize: '16px',
            color: 'var(--muted)',
            maxWidth: '448px',
            textAlign: 'center',
            lineHeight: '1.7',
            marginTop: '24px',
          }}
        >
          {HERO.description}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center gap-3 justify-center"
          style={{ marginTop: '32px' }}
        >
          <button
            onClick={handleScrollToDemo}
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 120ms ease, transform 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {HERO.primaryCta}
          </button>
          <Link
            href="/auth/login"
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '13px',
              color: 'var(--muted)',
              border: '1px solid var(--surface-line-strong)',
              padding: '8px 16px',
              borderRadius: '4px',
              textDecoration: 'none',
              transition: 'color 120ms ease, transform 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {HERO.secondaryCta}
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '11px',
            color: 'var(--muted)',
            opacity: 0.6,
            marginTop: '64px',
          }}
        >
          {HERO.socialProof}
        </motion.p>
      </div>
    </section>
  )
}
