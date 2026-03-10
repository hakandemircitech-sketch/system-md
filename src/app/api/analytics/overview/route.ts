import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays, format } from 'date-fns'

export interface OverviewStats {
  mrr: number
  mrrChange: number
  users: number
  usersChange: number
  blueprints: number
  blueprintsChange: number
  churn: number
  churnChange: number
}

export interface ChartPoint {
  month: string
  value: number
}

export interface PlanSlice {
  plan: string
  count: number
  percentage: number
  color: string
}

export interface RecentBlueprint {
  id: string
  title: string
  industry: string | null
  score_total: number | null
  status: string
  created_at: string
}

export interface OverviewResponse {
  stats: OverviewStats
  revenueChart: ChartPoint[]
  planDistribution: PlanSlice[]
  recentBlueprints: RecentBlueprint[]
  userMeta: {
    name: string
    plan: string
    apiTokensUsed: number
    deploymentCount: number
    blueprintCount: number
  }
}

// Plan başına aylık gelir (₺ → FAZ 6'da İyzipay ile güncellenir)
const PLAN_MRR: Record<string, number> = {
  free: 0,
  solo: 629,    // ~$19 → ~629₺
  agency: 1949, // ~$59 → ~1949₺
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Kullanıcı profili ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('plan, blueprint_count, api_tokens_used, deployment_count, created_at, full_name, email')
    .eq('id', user.id)
    .single()

  // ── Blueprint istatistikleri ───────────────────────────────────────────────
  const sevenDaysAgo = subDays(new Date(), 7).toISOString()
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString()

  const { count: totalBlueprints } = await supabase
    .from('blueprints')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: lastWeekBlueprints } = await supabase
    .from('blueprints')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo)

  const { count: prevWeekBlueprints } = await supabase
    .from('blueprints')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', fourteenDaysAgo)
    .lt('created_at', sevenDaysAgo)

  // ── Son blueprintler ───────────────────────────────────────────────────────
  const { data: recentBlueprints } = await supabase
    .from('blueprints')
    .select('id, title, industry, score_total, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // ── Gelir grafiği (son 7 ay) ───────────────────────────────────────────────
  // Her ay için kullanıcının planına göre sabit gelir (gerçek senaryoda
  // subscriptions tablosundan SUM alınır)
  const planMrr = PLAN_MRR[profile?.plan ?? 'free'] ?? 0
  const revenueChart: ChartPoint[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), (6 - i) * 30)
    const isCurrentMonth = i === 6
    return {
      month: format(date, 'MMM'),
      // Geriye dönük mock trend: planı olan kullanıcı için giderek artan gelir
      value: planMrr > 0
        ? Math.round(planMrr * (0.6 + i * 0.07) * (isCurrentMonth ? 1 : 0.95))
        : 0,
    }
  })

  // ── Plan dağılımı ──────────────────────────────────────────────────────────
  // Gerçek senaryoda tüm kullanıcılar plan bazında gruplandırılır.
  // RLS nedeniyle sadece kendi planımızı görebiliriz; mock dağılım sağlanır.
  const planDistribution: PlanSlice[] = [
    { plan: 'Free', count: 68, percentage: 68, color: '#52525b' },
    { plan: 'Solo', count: 24, percentage: 24, color: '#6366f1' },
    { plan: 'Agency', count: 8, percentage: 8, color: '#22c55e' },
  ]

  // ── İstatistik hesaplama ───────────────────────────────────────────────────
  const bpCount = totalBlueprints ?? profile?.blueprint_count ?? 0
  const bpLast = lastWeekBlueprints ?? 0
  const bpPrev = prevWeekBlueprints ?? 0
  const bpChange = bpPrev > 0 ? Math.round(((bpLast - bpPrev) / bpPrev) * 100) : 0

  const stats: OverviewStats = {
    mrr: planMrr,
    mrrChange: planMrr > 0 ? 12 : 0, // mock — gerçek hesap subscriptions tablosundan
    users: 124,          // mock — RLS olmadan SELECT COUNT(*) FROM users
    usersChange: 8,
    blueprints: bpCount,
    blueprintsChange: bpChange,
    churn: 3.2,          // mock — iptal edilen / toplam aktif abonelik
    churnChange: -0.4,
  }

  return NextResponse.json<OverviewResponse>({
    stats,
    revenueChart,
    planDistribution,
    recentBlueprints: (recentBlueprints ?? []) as RecentBlueprint[],
    userMeta: {
      name: profile?.full_name ?? (profile as { email?: string } | null)?.email?.split('@')[0] ?? '',
      plan: profile?.plan ?? 'free',
      apiTokensUsed: profile?.api_tokens_used ?? 0,
      deploymentCount: profile?.deployment_count ?? 0,
      blueprintCount: bpCount,
    },
  })
}
