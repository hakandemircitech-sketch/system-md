'use client'

import { create } from 'zustand'
import type { Blueprint, BlueprintContent, SseEvent } from '@/types/blueprint'

interface BlueprintStore {
  // Durum
  blueprints: Blueprint[]
  activeBlueprint: Blueprint | null
  isGenerating: boolean
  generationProgress: number
  generationLog: string[]
  lastTokensUsed: number
  error: string | null

  // Blueprint listesi aksiyonları
  setBlueprints: (blueprints: Blueprint[]) => void
  addBlueprint: (blueprint: Blueprint) => void
  updateBlueprint: (id: string, updates: Partial<Blueprint>) => void
  removeBlueprint: (id: string) => void

  // Aktif blueprint
  setActiveBlueprint: (blueprint: Blueprint | null) => void
  updateActiveContent: (content: BlueprintContent) => void

  // Üretim aksiyonları
  setIsGenerating: (isGenerating: boolean) => void
  setGenerationProgress: (progress: number) => void
  appendLog: (line: string) => void
  clearLog: () => void
  setError: (error: string | null) => void

  // SSE event işleyici — generate sayfasında kullanılır
  handleSseEvent: (event: SseEvent) => void

  // Tüm üretim durumunu sıfırla
  resetGeneration: () => void
}

export const useBlueprintStore = create<BlueprintStore>((set, get) => ({
  blueprints: [],
  activeBlueprint: null,
  isGenerating: false,
  generationProgress: 0,
  generationLog: [],
  lastTokensUsed: 0,
  error: null,

  // ── Blueprint listesi ──────────────────────────────────────────────────────
  setBlueprints: (blueprints) => set({ blueprints }),

  addBlueprint: (blueprint) =>
    set((state) => ({ blueprints: [blueprint, ...state.blueprints] })),

  updateBlueprint: (id, updates) =>
    set((state) => ({
      blueprints: state.blueprints.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
      activeBlueprint:
        state.activeBlueprint?.id === id
          ? { ...state.activeBlueprint, ...updates }
          : state.activeBlueprint,
    })),

  removeBlueprint: (id) =>
    set((state) => ({
      blueprints: state.blueprints.filter((b) => b.id !== id),
      activeBlueprint:
        state.activeBlueprint?.id === id ? null : state.activeBlueprint,
    })),

  // ── Aktif blueprint ────────────────────────────────────────────────────────
  setActiveBlueprint: (blueprint) => set({ activeBlueprint: blueprint }),

  updateActiveContent: (content) =>
    set((state) => ({
      activeBlueprint: state.activeBlueprint
        ? { ...state.activeBlueprint, content }
        : null,
    })),

  // ── Üretim durumu ──────────────────────────────────────────────────────────
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  appendLog: (line) =>
    set((state) => ({ generationLog: [...state.generationLog, line] })),
  clearLog: () => set({ generationLog: [], generationProgress: 0 }),
  setError: (error) => set({ error }),

  // ── SSE event işleyici ─────────────────────────────────────────────────────
  handleSseEvent: (event: SseEvent) => {
    const state = get()

    switch (event.type) {
      case 'status':
        set({ isGenerating: true, error: null })
        if (event.message) {
          state.appendLog(`▸ ${event.message}`)
        }
        break

      case 'chunk':
        // Chunk'ları biriktir — terminal satırlarına böl
        if (event.content) {
          const lines = event.content.split('\n')
          lines.forEach((line) => {
            if (line.trim()) state.appendLog(line)
          })
        }
        break

      case 'progress':
        if (event.value !== undefined) {
          set({ generationProgress: event.value })
        }
        break

      case 'complete':
        set({
          isGenerating: false,
          generationProgress: 100,
          error: null,
          lastTokensUsed: event.tokens_used ?? 0,
        })
        if (event.tokens_used) {
          state.appendLog(`✓ Tamamlandı — ${event.tokens_used.toLocaleString()} token kullanıldı`)
        }
        break

      case 'error':
        set({
          isGenerating: false,
          error: event.message ?? 'Bilinmeyen hata oluştu.',
        })
        if (event.message) {
          state.appendLog(`✗ Hata: ${event.message}`)
        }
        break
    }
  },

  // ── Üretim sıfırla ─────────────────────────────────────────────────────────
  resetGeneration: () =>
    set({
      isGenerating: false,
      generationProgress: 0,
      generationLog: [],
      lastTokensUsed: 0,
      error: null,
    }),
}))
