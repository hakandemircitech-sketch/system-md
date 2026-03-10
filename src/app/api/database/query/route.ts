import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase'de bu fonksiyonu oluşturmanız gerekiyor:
 *
 * CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
 * RETURNS json
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * DECLARE result json;
 * BEGIN
 *   EXECUTE format(
 *     'SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json) FROM (%s) t',
 *     sql_query
 *   ) INTO result;
 *   RETURN COALESCE(result, '[]'::json);
 * EXCEPTION WHEN OTHERS THEN
 *   RAISE;
 * END;
 * $$;
 *
 * REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
 * GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
 */

export async function POST(req: NextRequest) {
  const auth = await createAuthClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { sql?: string }
  const sql = body.sql?.trim()
  if (!sql) {
    return NextResponse.json({ error: 'sql param required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createClient<any>(supabaseUrl, serviceKey)

  const start = Date.now()

  try {
    const { data, error } = await admin.rpc('exec_sql', { sql_query: sql })
    const duration = Date.now() - start

    if (error) {
      // Distinguish between "function not found" and SQL errors
      if (
        error.message?.includes('function') &&
        error.message?.includes('exec_sql') &&
        error.message?.includes('does not exist')
      ) {
        return NextResponse.json(
          {
            error: 'SETUP_REQUIRED',
            message:
              'exec_sql fonksiyonu bulunamadı. Supabase SQL Editor\'ında şu fonksiyonu oluşturun:',
            sql: `CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result json;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json) FROM (%s) t',
    sql_query
  ) INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION WHEN OTHERS THEN RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;`,
          },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: error.message, duration }, { status: 400 })
    }

    // data is json array from exec_sql
    const rows: Record<string, unknown>[] = Array.isArray(data) ? data : []
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
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
      rowCount: rows.length,
      duration,
    })
  } catch (e) {
    const duration = Date.now() - start
    console.error('[database/query]', e)
    return NextResponse.json({ error: 'Query execution failed', duration }, { status: 500 })
  }
}
