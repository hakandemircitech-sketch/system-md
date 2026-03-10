import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays, format } from 'date-fns'

export interface RevenueResponse {
  labels: string[]
  mrr: number[]
  once: number[]
}

// Deterministik sahte trend — gerçek abonelik agregatları için
// subscriptions tablosunda admin erişimi gerekir; FAZ 6'da güncellenir
function seedRevenue(days: number): RevenueResponse {
  const base = 300
  const labels: string[] = []
  const mrr: number[] = []
  const once: number[] = []

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), days - 1 - i)
    const label = days <= 30 ? String(i + 1) : format(date, 'MMM d')
    labels.push(label)

    const trend = base + (i / days) * 250
    const wave = Math.sin(i * 1.7) * 20 + Math.cos(i * 0.8) * 15
    mrr.push(Math.round(trend + wave))

    const spikes = Math.abs(Math.sin(i * 2.3 + 0.4)) * 85 + 25
    once.push(Math.round(spikes))
  }

  return { labels, mrr, once }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = req.nextUrl.searchParams.get('range') ?? '30d'
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30

  // Kullanıcının planına göre gelir ölçeklendirilir
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const planMrr = profile?.plan === 'team' ? 1949 : profile?.plan === 'pro' ? 629 : 0
  const data = seedRevenue(days)

  if (planMrr > 0) {
    // Gerçek plan varsa datayı ölçeklendir
    const scale = planMrr / (data.mrr.at(-1) ?? 1)
    data.mrr = data.mrr.map((v) => Math.round(v * scale * 0.85))
    data.once = data.once.map((v) => Math.round(v * scale * 0.2))
  }

  return NextResponse.json<RevenueResponse>(data)
}
