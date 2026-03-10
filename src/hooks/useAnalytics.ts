'use client'

import { useQuery } from '@tanstack/react-query'
import type { OverviewResponse } from '@/app/api/analytics/overview/route'

async function fetchOverview(): Promise<OverviewResponse> {
  const res = await fetch('/api/analytics/overview')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Analitik verileri alınamadı')
  }
  return res.json()
}

export interface RevenueData {
  month: string
  revenue: number
  users: number
}

async function fetchRevenue(): Promise<RevenueData[]> {
  const res = await fetch('/api/analytics/revenue')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Gelir verileri alınamadı')
  }
  return res.json()
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: fetchOverview,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60_000,
  })
}

export function useAnalyticsRevenue() {
  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: fetchRevenue,
    staleTime: 10 * 60 * 1000,
  })
}
