import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays } from 'date-fns'

export interface CategoriesResponse {
  labels: string[]
  values: number[]
  colors: string[]
}

const CATEGORIES = ['SaaS', 'FinTech', 'AI Tools', 'EdTech', 'Health', 'Logistics', 'Other']
const COLORS = ['#6366f1', '#eab308', '#8b5cf6', '#22c55e', '#3b82f6', '#f97316', '#52525b']

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
  const since = subDays(new Date(), days).toISOString()

  // Kullanıcının blueprint'lerini sektöre göre say
  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('industry')
    .eq('user_id', user.id)
    .gte('created_at', since)

  // Gerçek veriler varsa kullan
  if (blueprints && blueprints.length > 0) {
    const counts: Record<string, number> = {}
    blueprints.forEach((b) => {
      const key = b.industry ?? 'Other'
      counts[key] = (counts[key] ?? 0) + 1
    })
    const total = blueprints.length

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)

    const labels = sorted.map(([k]) => k)
    const values = sorted.map(([, v]) => Math.round((v / total) * 100))

    return NextResponse.json<CategoriesResponse>({ labels, values, colors: COLORS.slice(0, labels.length) })
  }

  // Mock — platform geneli dağılım
  return NextResponse.json<CategoriesResponse>({
    labels: CATEGORIES,
    values: [38, 22, 18, 10, 6, 4, 2],
    colors: COLORS,
  })
}
