'use client'

import { useQuery } from '@tanstack/react-query'

export interface DeploymentLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}

export interface Deployment {
  id: string
  user_id: string
  blueprint_id: string | null
  project_name: string
  platform: 'vercel' | 'railway' | 'fly' | 'custom'
  branch: string
  region: string
  status: 'queued' | 'building' | 'success' | 'failed' | 'cancelled'
  deploy_url: string | null
  error_message: string | null
  queued_at: string
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  created_at: string
}

async function fetchDeployments(): Promise<Deployment[]> {
  const res = await fetch('/api/deployments')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Deployment listesi alınamadı')
  }
  return res.json()
}

async function fetchDeployment(id: string): Promise<Deployment> {
  const res = await fetch(`/api/deployments/${id}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Deployment bulunamadı')
  }
  return res.json()
}

async function fetchDeploymentLogs(id: string): Promise<DeploymentLog[]> {
  const res = await fetch(`/api/deployments/${id}/logs`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Loglar alınamadı')
  }
  return res.json()
}

export function useDeployments() {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: fetchDeployments,
  })
}

export function useDeployment(id: string | null) {
  return useQuery({
    queryKey: ['deployment', id],
    queryFn: () => fetchDeployment(id!),
    enabled: !!id,
  })
}

export function useDeploymentLogs(id: string | null, enabled = false) {
  return useQuery({
    queryKey: ['deployment-logs', id],
    queryFn: () => fetchDeploymentLogs(id!),
    enabled: !!id && enabled,
    refetchInterval: enabled ? 3000 : false,
  })
}
