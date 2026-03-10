import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

export interface HeatmapResponse {
  months: string[]
  values: number[]
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const months: string[] = []
  const values: number[] = []

  // Son 12 ay için aylık blueprint sayısı
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    months.push(MONTH_ABBR[monthDate.getMonth()])

    const from = startOfMonth(monthDate).toISOString()
    const to = endOfMonth(monthDate).toISOString()

    const { count } = await supabase
      .from('blueprints')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', from)
      .lte('created_at', to)

    values.push(count ?? 0)
  }

  // Eğer tüm değerler 0 ise (yeni kullanıcı), görsel için seed data
  const allZero = values.every((v) => v === 0)
  if (allZero) {
    const seeded = values.map((_, i) => {
      return Math.round(Math.abs(Math.sin(i * 1.3 + 0.7)) * 85 + 5)
    })
    return NextResponse.json<HeatmapResponse>({ months, values: seeded })
  }

  // Normalize: max değeri 100'e ölçeklendir
  const max = Math.max(...values, 1)
  const normalized = values.map((v) => Math.round((v / max) * 100))

  void format(now, 'yyyy')

  return NextResponse.json<HeatmapResponse>({ months, values: normalized })
}
