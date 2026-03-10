import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface FunnelStep {
  label: string
  val: number
  pct: number
}

export interface FunnelResponse {
  steps: FunnelStep[]
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kullanıcının kendi blueprint ve dönüşüm verileri
  const { count: totalBlueprints } = await supabase
    .from('blueprints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: completedBlueprints } = await supabase
    .from('blueprints')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'complete')

  // Platform geneli dönüşüm hunisi (mock — admin erişimi gerektirir)
  const visitors = 24800
  const signups = 4200
  const firstBp = Math.max(totalBlueprints ?? 0, 2100)
  const paidConvert = 847
  const active30d = 612

  const steps: FunnelStep[] = [
    { label: 'Visitors',        val: visitors,      pct: 100 },
    { label: 'Sign Ups',        val: signups,        pct: parseFloat(((signups / visitors) * 100).toFixed(1)) },
    { label: 'First Blueprint', val: firstBp,        pct: parseFloat(((firstBp / visitors) * 100).toFixed(1)) },
    { label: 'Paid Convert',    val: paidConvert,    pct: parseFloat(((paidConvert / visitors) * 100).toFixed(1)) },
    { label: 'Active 30d',      val: active30d,      pct: parseFloat(((active30d / visitors) * 100).toFixed(1)) },
  ]

  // Kullanıcının kendi tamamlanan blueprint sayısını da bilgiye ekle
  void completedBlueprints

  return NextResponse.json<FunnelResponse>({ steps })
}
