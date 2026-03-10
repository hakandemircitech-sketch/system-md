'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useBlueprintStore } from '@/stores/blueprintStore'
import type { Blueprint, SseEvent } from '@/types/blueprint'

const BLUEPRINTS_KEY = ['blueprints'] as const

async function fetchBlueprints(): Promise<Blueprint[]> {
  const res = await fetch('/api/blueprint')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Blueprint listesi alınamadı')
  }
  return res.json()
}

async function fetchBlueprint(id: string): Promise<Blueprint> {
  const res = await fetch(`/api/blueprint/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Blueprint bulunamadı')
  }
  return res.json()
}

async function deleteBlueprint(id: string): Promise<void> {
  const res = await fetch(`/api/blueprint/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Blueprint silinemedi')
  }
}

export function useBlueprints() {
  return useQuery({
    queryKey: BLUEPRINTS_KEY,
    queryFn: fetchBlueprints,
    staleTime: 30_000,
  })
}

export function useBlueprint(id: string | null) {
  return useQuery({
    queryKey: ['blueprint', id],
    queryFn: () => fetchBlueprint(id!),
    enabled: !!id,
  })
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBlueprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLUEPRINTS_KEY })
    },
  })
}

interface GenerateParams {
  idea_text: string
  industry?: string
  stage?: string
  target_users?: string
  model?: string
}

export function useGenerateBlueprint() {
  const store = useBlueprintStore()
  const queryClient = useQueryClient()

  const generate = useCallback(
    async (params: GenerateParams): Promise<string | null> => {
      store.resetGeneration()
      store.setIsGenerating(true)
      store.appendLog('▸ Blueprint oluşturma başlatıldı...')

      try {
        const res = await fetch('/api/blueprint/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? 'Sunucu hatası')
        }

        if (!res.body) throw new Error('SSE stream yok')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let blueprintId: string | null = null
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event: SseEvent = JSON.parse(line.slice(6))
              store.handleSseEvent(event)
              if (event.type === 'complete' && event.blueprint_id) {
                blueprintId = event.blueprint_id
              }
            } catch {
              // JSON parse hatası — geç
            }
          }
        }

        await queryClient.invalidateQueries({ queryKey: BLUEPRINTS_KEY })
        return blueprintId
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
        store.setError(message)
        store.appendLog(`✗ Hata: ${message}`)
        store.setIsGenerating(false)
        return null
      }
    },
    [store, queryClient]
  )

  return {
    generate,
    isGenerating: store.isGenerating,
    progress: store.generationProgress,
    log: store.generationLog,
    error: store.error,
    tokensUsed: store.lastTokensUsed,
    reset: store.resetGeneration,
  }
}
