import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const PAGE_SIZE = 10

export async function GET(req: NextRequest) {
  const auth = await createAuthClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('search') ?? ''

  if (!table) {
    return NextResponse.json({ error: 'table param required' }, { status: 400 })
  }

  // Validate table name — only alphanumeric + underscore
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createClient<any>(supabaseUrl, serviceKey)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  try {
    let query = admin.from(table).select('*', { count: 'exact' }).range(from, to)

    // Text search: apply ilike filter on the first text-like column
    // Full multi-column search requires knowing column types from schema,
    // so we use a simple cast approach via PostgREST's ::text cast
    if (search.trim()) {
      // Use PostgREST "or" filter with ilike on id and any text column
      // We cast to text using ::text suffix in column name
      query = query.or(`id::text.ilike.%${search.trim()}%`)
    }

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const rows = (data ?? []) as Record<string, unknown>[]
    const totalCount = count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

    // Get columns from first row, or from a schema probe if rows is empty
    let columns = rows.length > 0 ? Object.keys(rows[0]) : []
    if (columns.length === 0 && totalCount === 0) {
      // Table is empty — probe columns from the table schema via information_schema
      try {
        const { data: colData } = await admin
          .from('information_schema.columns' as string)
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', table)
          .order('ordinal_position')
        if (colData && Array.isArray(colData)) {
          columns = colData.map((c: { column_name: string }) => c.column_name)
        }
      } catch { /* ignore schema probe failure */ }
    }

    // Serialize rows to string arrays for uniform display
    const serialized = rows.map((row) =>
      columns.map((col) => {
        const val = row[col]
        if (val === null || val === undefined) return null
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val)
      }),
    )

    return NextResponse.json({
      columns,
      rows: serialized,
      totalCount,
      totalPages,
      page,
    })
  } catch (e) {
    console.error('[database/rows]', e)
    return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 })
  }
}
