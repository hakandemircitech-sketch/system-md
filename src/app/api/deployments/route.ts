import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@/types/database'

// GET /api/deployments — kullanıcının deployment listesini döndür
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const projectName = searchParams.get('project')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  let query = supabase
    .from('deployments')
    .select('id, user_id, project_name, platform, branch, region, status, platform_deploy_id, deploy_url, error_message, duration_ms, queued_at, started_at, completed_at, blueprint_id, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  const validStatuses = ['queued', 'building', 'success', 'failed', 'cancelled'] as const
  type ValidStatus = typeof validStatuses[number]
  if (status && status !== 'all' && (validStatuses as readonly string[]).includes(status)) {
    query = query.eq('status', status as ValidStatus)
  }
  if (projectName) {
    query = query.eq('project_name', projectName)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // İstatistikler
  const { data: stats } = await supabase
    .from('deployments')
    .select('status, duration_ms')
    .eq('user_id', user.id)

  const statsSummary = {
    total: stats?.length ?? 0,
    success: stats?.filter(d => d.status === 'success').length ?? 0,
    building: stats?.filter(d => d.status === 'building').length ?? 0,
    failed: stats?.filter(d => d.status === 'failed').length ?? 0,
    queued: stats?.filter(d => d.status === 'queued').length ?? 0,
    avg_duration_ms: (() => {
      const finished = stats?.filter(d => d.duration_ms != null) ?? []
      if (!finished.length) return null
      return Math.round(finished.reduce((sum, d) => sum + (d.duration_ms ?? 0), 0) / finished.length)
    })(),
  }

  return NextResponse.json({ deployments: data ?? [], stats: statsSummary })
}

// POST /api/deployments — yeni deployment oluştur
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    project_name: string
    blueprint_id?: string
    platform?: 'vercel' | 'railway' | 'fly' | 'custom'
    branch?: string
    region?: string
  }

  if (!body.project_name?.trim()) {
    return NextResponse.json({ error: 'project_name gerekli' }, { status: 400 })
  }

  const deploymentId = `dep-${Math.floor(Math.random() * 9000) + 1000}`
  const commitHash = Math.random().toString(36).slice(2, 9)

  const insert: TablesInsert<'deployments'> = {
    user_id: user.id,
    blueprint_id: body.blueprint_id ?? null,
    project_name: body.project_name.trim(),
    platform: body.platform ?? 'vercel',
    branch: body.branch ?? 'main',
    region: body.region ?? 'fra1',
    status: 'queued',
    platform_deploy_id: `${deploymentId}@${commitHash}`,
    queued_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('deployments')
    .insert(insert)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kullanıcı deployment sayısını artır (mevcut değeri oku sonra güncelle)
  const { data: userData } = await supabase.from('users').select('deployment_count').eq('id', user.id).single()
  await supabase
    .from('users')
    .update({ deployment_count: (userData?.deployment_count ?? 0) + 1 })
    .eq('id', user.id)

  return NextResponse.json({ deployment: data }, { status: 201 })
}
