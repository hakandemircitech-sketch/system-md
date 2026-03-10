import { NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
  isPk: boolean
  isFk: boolean
}

export interface TableInfo {
  name: string
  rowCount: number
  columns: ColumnInfo[]
}

export async function GET() {
  const auth = await createAuthClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const infoHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Accept-Profile': 'information_schema',
    Accept: 'application/json',
  }

  try {
    const [tablesRes, columnsRes, keyUsageRes, constraintsRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/tables?table_schema=eq.public&table_type=eq.BASE TABLE&select=table_name`,
        { headers: infoHeaders },
      ),
      fetch(
        `${supabaseUrl}/rest/v1/columns?table_schema=eq.public&select=table_name,column_name,data_type,is_nullable,column_default&order=table_name,ordinal_position`,
        { headers: infoHeaders },
      ),
      fetch(
        `${supabaseUrl}/rest/v1/key_column_usage?constraint_schema=eq.public&select=table_name,column_name,constraint_name`,
        { headers: infoHeaders },
      ),
      fetch(
        `${supabaseUrl}/rest/v1/table_constraints?constraint_schema=eq.public&select=table_name,constraint_name,constraint_type`,
        { headers: infoHeaders },
      ),
    ])

    const tables: { table_name: string }[] = tablesRes.ok ? await tablesRes.json() : []

    const columns: {
      table_name: string
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
    }[] = columnsRes.ok ? await columnsRes.json() : []

    const keyUsage: {
      table_name: string
      column_name: string
      constraint_name: string
    }[] = keyUsageRes.ok ? await keyUsageRes.json() : []

    const constraints: {
      table_name: string
      constraint_name: string
      constraint_type: string
    }[] = constraintsRes.ok ? await constraintsRes.json() : []

    const pkNames = new Set(
      constraints.filter((c) => c.constraint_type === 'PRIMARY KEY').map((c) => c.constraint_name),
    )
    const fkNames = new Set(
      constraints.filter((c) => c.constraint_type === 'FOREIGN KEY').map((c) => c.constraint_name),
    )
    const pkCols = new Set(
      keyUsage
        .filter((k) => pkNames.has(k.constraint_name))
        .map((k) => `${k.table_name}.${k.column_name}`),
    )
    const fkCols = new Set(
      keyUsage
        .filter((k) => fkNames.has(k.constraint_name))
        .map((k) => `${k.table_name}.${k.column_name}`),
    )

    // Service role client for row counts (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createClient<any>(supabaseUrl, serviceKey)

    const tableData: TableInfo[] = await Promise.all(
      tables.map(async (t) => {
        const { count } = await admin
          .from(t.table_name)
          .select('*', { count: 'exact', head: true })

        const cols: ColumnInfo[] = columns
          .filter((c) => c.table_name === t.table_name)
          .map((c) => ({
            name: c.column_name,
            type: c.data_type,
            nullable: c.is_nullable === 'YES',
            default: c.column_default,
            isPk: pkCols.has(`${t.table_name}.${c.column_name}`),
            isFk: fkCols.has(`${t.table_name}.${c.column_name}`),
          }))

        return { name: t.table_name, rowCount: count ?? 0, columns: cols }
      }),
    )

    return NextResponse.json({ tables: tableData })
  } catch (e) {
    console.error('[database/schema]', e)
    return NextResponse.json({ error: 'Schema fetch failed' }, { status: 500 })
  }
}
