import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/deployments/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('deployments')
    .select('id, user_id, project_name, platform, branch, region, status, platform_deploy_id, deploy_url, error_message, duration_ms, queued_at, started_at, completed_at, blueprint_id, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ deployment: data })
}

// PATCH /api/deployments/[id] — durum güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    status?: 'queued' | 'building' | 'success' | 'failed' | 'cancelled'
    deploy_url?: string
    error_message?: string
    duration_ms?: number
  }

  const updates: Record<string, unknown> = {}
  if (body.status) updates.status = body.status
  if (body.deploy_url !== undefined) updates.deploy_url = body.deploy_url
  if (body.error_message !== undefined) updates.error_message = body.error_message
  if (body.duration_ms !== undefined) updates.duration_ms = body.duration_ms

  if (body.status === 'building') updates.started_at = new Date().toISOString()
  if (body.status === 'success' || body.status === 'failed' || body.status === 'cancelled') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('deployments')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deployment: data })
}

// DELETE /api/deployments/[id] — iptal et
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('deployments')
    .update({ status: 'cancelled', completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .in('status', ['queued', 'building'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
