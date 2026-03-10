export interface Feature {
  id: string
  tag: string
  title: string
  description: string
}

export const HERO = {
  eyebrow: 'claude-sonnet-4-6 · live',
  title: ['SystemMD', 'was', 'built', 'with', 'SystemMD'],
  description:
    'Startup ideas deserve more than a napkin sketch. SystemMD turns your idea into a complete, Cursor-ready build kit — in under 60 seconds.',
  primaryCta: 'try it now',
  secondaryCta: 'sign in →',
  socialProof: 'built by a human and an AI · first user was the builder',
}

export const STORY = {
  eyebrow: 'origin',
  title: 'Built by a founder\nsolving his own problem',
  paragraphs: [
    'I built SystemMD because I needed a better way to turn complex product ideas into usable technical plans.',
    'What started as a personal blueprint system is becoming the platform I wish I had when I first started building.',
    'It is being shaped through real workflows, practical output, and continuous refinement rather than presentation theater.',
  ],
  terminalTitle: 'systemmd · origin story',
}

export const FEATURES: Feature[] = [
  {
    id: 'blueprint',
    tag: 'GENERATE',
    title: '60 Second Blueprint',
    description:
      'From raw idea to a complete product architecture with market analysis, tech stack, and database schema.',
  },
  {
    id: 'cursor',
    tag: 'BUILD',
    title: 'Cursor-Ready Kit',
    description:
      'Every blueprint ships with .cursorrules, schema.sql, BUILD.md and .env.example — open Cursor and start.',
  },
  {
    id: 'score',
    tag: 'VALIDATE',
    title: 'AI-Validated Score',
    description:
      'Market fit, technical feasibility, revenue model and brand — scored 0–100 with honest risk analysis.',
  },
]

export const FOOTER = {
  tagline: 'built with itself',
  links: [
    { label: 'sign in', href: '/auth/login' },
    { label: 'privacy', href: '#' },
  ],
}
