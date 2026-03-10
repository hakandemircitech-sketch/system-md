import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    _anthropic = new Anthropic({ apiKey: key })
  }
  return _anthropic
}

export const AI_MODELS = {
  standard: 'claude-sonnet-4-6',
  power: 'claude-opus-4-6',
} as const

export type AiModel = keyof typeof AI_MODELS
