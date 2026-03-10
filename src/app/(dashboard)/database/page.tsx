'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TableInfo, ColumnInfo } from '@/app/api/database/schema/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RowsResponse {
  columns: string[]
  rows: (string | null)[][]
  totalCount: number
  totalPages: number
  page: number
}

interface QueryResult {
  columns: string[]
  rows: (string | null)[][]
  rowCount: number
  duration: number
  error?: string
  setupRequired?: boolean
  setupSql?: string
}

type DataTab = 'data' | 'schema'
type QueryStatus = 'idle' | 'running' | 'ok' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function typeToClass(type: string, isPk: boolean): string {
  if (isPk) return 'text-[var(--accent)]'
  const t = type.toLowerCase()
  if (t.includes('bool')) return 'text-[var(--green)]'
  if (t.includes('int') || t.includes('numeric') || t.includes('float') || t.includes('double') || t.includes('decimal'))
    return 'text-[var(--yellow)]'
  if (t.includes('timestamp') || t.includes('date') || t.includes('time'))
    return 'text-[var(--text-3)]'
  return 'text-[var(--text-2)]'
}

function getBoolClass(val: string): string {
  return val === 'true' || val === 't' || val === '1'
    ? 'text-[var(--green)]'
    : 'text-[var(--red)]'
}

const TABLE_ICON_COLORS = ['blue', 'green', 'yellow', 'accent'] as const
type IconColor = (typeof TABLE_ICON_COLORS)[number]

const ICON_CLASS: Record<IconColor, string> = {
  blue: 'bg-[var(--blue-dim)] text-[var(--blue)]',
  green: 'bg-[var(--green-dim)] text-[var(--green)]',
  yellow: 'bg-[var(--yellow-dim)] text-[var(--yellow)]',
  accent: 'bg-[var(--accent-dim)] text-[var(--accent)]',
}

function tableIconColor(name: string, idx: number): IconColor {
  const seed = name.charCodeAt(0) + idx
  return TABLE_ICON_COLORS[seed % TABLE_ICON_COLORS.length]
}

const SQL_SNIPPETS: Record<string, (table: string) => string> = {
  SELECT: (t) => `SELECT *\nFROM ${t}\nORDER BY created_at DESC\nLIMIT 10;`,
  INSERT: () =>
    `INSERT INTO table_name (col1, col2)\nVALUES ('value1', 'value2');`,
  UPDATE: () => `UPDATE table_name\nSET column = 'value'\nWHERE id = '';`,
  DELETE: () => `DELETE FROM table_name\nWHERE id = '';`,
  JOIN: (t) =>
    `SELECT a.*, b.id AS b_id\nFROM ${t} a\nJOIN related_table b ON b.ref_id = a.id\nLIMIT 20;`,
  COUNT: (t) =>
    `SELECT\n  COUNT(*) AS total\nFROM ${t};`,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TableIcon({ color }: { color: IconColor }) {
  return (
    <div
      className={`w-[22px] h-[22px] rounded-[4px] flex items-center justify-center shrink-0 ${ICON_CLASS[color]}`}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="3" width="12" height="10" rx="1.5" />
        <path d="M2 7h12M6 7v6" />
      </svg>
    </div>
  )
}

function ColFlagBadge({ label, variant }: { label: string; variant: 'pk' | 'fk' | 'nn' | 'default' }) {
  const cls = {
    pk: 'text-[var(--yellow)] bg-[var(--yellow-dim)] border-[rgba(234,179,8,0.2)]',
    fk: 'text-[var(--blue)] bg-[var(--blue-dim)] border-[rgba(59,130,246,0.2)]',
    nn: 'text-[var(--text-3)] bg-[var(--bg-4)] border-[var(--border-2)]',
    default: 'text-[var(--text-3)] bg-[var(--bg-4)] border-[var(--border-2)]',
  }[variant]
  return (
    <span
      className={`font-mono text-[9px] border rounded-[3px] px-[6px] py-[1px] ${cls}`}
    >
      {label}
    </span>
  )
}

// ─── Schema View ──────────────────────────────────────────────────────────────

function SchemaView({ columns }: { columns: ColumnInfo[] }) {
  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[11px] text-[var(--text-4)]">No table selected</p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
      {columns.map((col) => (
        <div
          key={col.name}
          className="flex items-center gap-[10px] p-[9px_12px] border border-[var(--border)] rounded-[5px] bg-[var(--bg-3)] hover:border-[var(--border-2)] transition-colors"
        >
          <span className="font-mono text-[12px] text-[var(--text)] font-medium min-w-[120px]">
            {col.name}
          </span>
          <span className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent-dim)] rounded-[4px] px-[7px] py-[2px]">
            {col.type}
          </span>
          <div className="flex gap-[5px] ml-auto">
            {col.isPk && <ColFlagBadge label="PK" variant="pk" />}
            {col.isFk && <ColFlagBadge label="FK" variant="fk" />}
            {!col.nullable && <ColFlagBadge label="NN" variant="nn" />}
            {col.default !== null && (
              <ColFlagBadge label={`default: ${col.default.slice(0, 12)}`} variant="default" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Data Table View ──────────────────────────────────────────────────────────

function DataView({
  tableName,
  columns,
  colInfo,
  loading,
  error,
  rows,
  totalCount,
  totalPages,
  page,
  rowFilter,
  onFilterChange,
  onPageChange,
}: {
  tableName: string | null
  columns: string[]
  colInfo: ColumnInfo[]
  loading: boolean
  error: string | null
  rows: (string | null)[][]
  totalCount: number
  totalPages: number
  page: number
  rowFilter: string
  onFilterChange: (v: string) => void
  onPageChange: (p: number) => void
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [allChecked, setAllChecked] = useState(false)
  const [sortCol, setSortCol] = useState<number>(0)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Reset selection when table changes
  useEffect(() => {
    setSelected(new Set())
    setAllChecked(false)
  }, [tableName])

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
      setAllChecked(false)
    } else {
      setSelected(new Set(rows.map((_, i) => i)))
      setAllChecked(true)
    }
  }

  function toggleRow(i: number) {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelected(next)
    setAllChecked(next.size === rows.length)
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(colIdx)
      setSortDir('asc')
    }
  }

  // Client-side sort on visible rows
  const sortedRows = [...rows].sort((a, b) => {
    const va = a[sortCol] ?? ''
    const vb = b[sortCol] ?? ''
    const cmp = va.localeCompare(vb, undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  // Filter locally
  const filteredRows = rowFilter.trim()
    ? sortedRows.filter((row) =>
        row.some((cell) => String(cell ?? '').toLowerCase().includes(rowFilter.toLowerCase())),
      )
    : sortedRows

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3 px-6 text-center">
        <div className="w-9 h-9 rounded-[var(--radius)] bg-[var(--red-dim)] text-[var(--red)] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" />
          </svg>
        </div>
        <p className="text-[12px] text-[var(--text-2)] font-medium">Failed to load rows</p>
        <p className="font-mono text-[10px] text-[var(--red)]">{error}</p>
      </div>
    )
  }

  if (!tableName) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <svg
          width="32"
          height="32"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--text-4)"
          strokeWidth="1.5"
        >
          <ellipse cx="8" cy="5" rx="6" ry="2.5" />
          <path d="M2 5v6c0 1.4 2.7 2.5 6 2.5S14 12.4 14 11V5" />
          <path d="M2 8c0 1.4 2.7 2.5 6 2.5S14 9.4 14 8" />
        </svg>
        <p className="font-mono text-[11px] text-[var(--text-4)]">Select a table</p>
      </div>
    )
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-[10px] border-b border-[var(--border)] bg-[var(--bg-2)] shrink-0">
        <div className="flex items-center gap-[6px] px-[10px] py-[5px] bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="1.5"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3 3" />
          </svg>
          <input
            type="text"
            value={rowFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter rows..."
            className="bg-transparent border-none outline-none text-[11px] font-mono text-[var(--text)] placeholder:text-[var(--text-4)] w-[160px]"
          />
        </div>
        <span className="font-mono text-[11px] text-[var(--text-3)]">
          {loading ? '...' : `${fmtCount(totalCount)} rows`}
        </span>
        <div className="ml-auto flex items-center gap-[6px]">
          {selected.size > 0 && (
            <span className="font-mono text-[10px] text-[var(--red)]">
              {selected.size} selected
            </span>
          )}
          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-[26px] h-[26px] rounded-[4px] border border-[var(--border)] bg-[var(--bg-3)] text-[var(--text-3)] flex items-center justify-center hover:text-[var(--text)] hover:border-[var(--border-2)] transition-all disabled:opacity-40"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10 4l-4 4 4 4" />
              </svg>
            </button>
            <span className="font-mono text-[10px] text-[var(--text-3)] px-[6px]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="w-[26px] h-[26px] rounded-[4px] border border-[var(--border)] bg-[var(--bg-3)] text-[var(--text-3)] flex items-center justify-center hover:text-[var(--text)] hover:border-[var(--border-2)] transition-all disabled:opacity-40"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar]:h-[4px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-[2px]">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              className="animate-spin"
            >
              <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-[11px] text-[var(--text-3)]">Loading...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="font-mono text-[11px] text-[var(--text-4)]">No rows found</p>
          </div>
        ) : (
          <table className="w-full border-collapse font-mono text-[11px]">
            <thead className="sticky top-0 z-[2]">
              <tr className="bg-[var(--bg-3)] border-b border-[var(--border)]">
                <th className="w-8 px-[14px] py-[9px] text-left">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="w-[14px] h-[14px] rounded-[3px] cursor-pointer accent-[var(--accent)]"
                  />
                </th>
                {columns.map((col, i) => {
                  const info = colInfo.find((c) => c.name === col)
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(i)}
                      className={`px-[14px] py-[9px] text-left text-[10px] font-normal text-[var(--text-3)] whitespace-nowrap uppercase tracking-[0.06em] cursor-pointer hover:text-[var(--text-2)] transition-colors select-none ${
                        sortCol === i ? 'text-[var(--accent)]!' : ''
                      }`}
                    >
                      {col}
                      {info && (
                        <span className="ml-1 text-[var(--text-4)] font-mono text-[9px] normal-case tracking-normal">
                          {info.type}
                        </span>
                      )}
                      <span className="ml-1 opacity-40 inline-block">
                        {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, ri) => {
                const isSelected = selected.has(ri)
                return (
                  <tr
                    key={ri}
                    onClick={() => toggleRow(ri)}
                    className={`border-b border-[var(--border)] cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent-dim)]'
                        : 'hover:bg-[var(--bg-3)]'
                    }`}
                  >
                    <td className="px-[14px] py-[9px]">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(ri)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-[14px] h-[14px] rounded-[3px] cursor-pointer accent-[var(--accent)]"
                      />
                    </td>
                    {row.map((cell, ci) => {
                      const info = colInfo[ci]
                      const type = info?.type?.toLowerCase() ?? ''
                      const isBool =
                        type.includes('bool') ||
                        cell === 'true' ||
                        cell === 'false'

                      if (cell === null) {
                        return (
                          <td
                            key={ci}
                            className="px-[14px] py-[9px] text-[var(--text-4)] italic"
                          >
                            NULL
                          </td>
                        )
                      }
                      return (
                        <td
                          key={ci}
                          className={`px-[14px] py-[9px] whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis ${
                            isBool
                              ? getBoolClass(cell)
                              : typeToClass(info?.type ?? '', info?.isPk ?? false)
                          } ${
                            type.includes('int') ||
                            type.includes('numeric') ||
                            type.includes('float')
                              ? 'text-right'
                              : ''
                          }`}
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// ─── SQL Results Panel ────────────────────────────────────────────────────────

function SqlResults({ result }: { result: QueryResult | null }) {
  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[11px] text-[var(--text-4)] px-4 text-center">
          Run a query to see results
        </p>
      </div>
    )
  }

  if (result.setupRequired) {
    return (
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
        <div className="p-3 bg-[var(--yellow-dim)] border border-[rgba(234,179,8,0.2)] rounded-[5px] mb-3">
          <p className="font-mono text-[10px] text-[var(--yellow)] mb-2 font-medium">
            ⚠ Setup Required
          </p>
          <p className="font-mono text-[10px] text-[var(--text-2)]">
            Create the following function in Supabase SQL Editor:
          </p>
        </div>
        <pre className="font-mono text-[10px] text-[var(--text-2)] bg-[var(--bg-3)] border border-[var(--border)] rounded-[5px] p-3 overflow-x-auto whitespace-pre-wrap break-all text-[var(--green)]">
          {result.error}
        </pre>
      </div>
    )
  }

  if (result.error) {
    return (
      <div className="flex-1 p-4">
        <div className="p-3 bg-[var(--red-dim)] border border-[rgba(239,68,68,0.2)] rounded-[5px]">
          <p className="font-mono text-[10px] text-[var(--red)] font-medium mb-1">✗ SQL Error</p>
          <p className="font-mono text-[10px] text-[var(--text-2)]">{result.error}</p>
        </div>
      </div>
    )
  }

  if (result.columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[11px] text-[var(--green)]">
          ✓ Query executed ({result.duration}ms)
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
      {/* Header row */}
      <div className="flex items-stretch border-b border-[var(--border)] sticky top-0 bg-[var(--bg-3)]">
        {result.columns.map((col) => (
          <div
            key={col}
            className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.06em] px-[14px] py-[8px] border-r border-[var(--border)] min-w-[100px] last:border-r-0"
          >
            {col}
          </div>
        ))}
      </div>
      {/* Data rows */}
      {result.rows.map((row, ri) => (
        <div
          key={ri}
          className="flex items-stretch border-b border-[var(--border)] hover:bg-[var(--bg-3)] transition-colors last:border-b-0"
        >
          {row.map((cell, ci) => (
            <div
              key={ci}
              className={`font-mono text-[11px] px-[14px] py-[8px] border-r border-[var(--border)] min-w-[100px] last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] ${
                cell === null ? 'text-[var(--text-4)] italic' : 'text-[var(--text-2)]'
              }`}
            >
              {cell === null ? 'NULL' : cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── SQL Editor Column ────────────────────────────────────────────────────────

function SqlEditor({
  currentTable,
  dbName,
  connected,
}: {
  currentTable: string | null
  dbName: string
  connected: boolean
}) {
  const [sql, setSql] = useState(
    'SELECT *\nFROM users\nORDER BY created_at DESC\nLIMIT 10;',
  )
  const [result, setResult] = useState<QueryResult | null>(null)
  const [status, setStatus] = useState<QueryStatus>('idle')
  const [queryTime, setQueryTime] = useState<string>('—')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lineCount = sql.split('\n').length

  // Update SELECT snippet when table changes
  useEffect(() => {
    if (currentTable && status === 'idle') {
      setSql(`SELECT *\nFROM ${currentTable}\nORDER BY created_at DESC\nLIMIT 10;`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTable])

  function insertSnippet(key: string) {
    const table = currentTable ?? 'your_table'
    setSql(SQL_SNIPPETS[key]?.(table) ?? sql)
    textareaRef.current?.focus()
  }

  function clearEditor() {
    setSql('')
    setResult(null)
    setStatus('idle')
    setQueryTime('—')
    textareaRef.current?.focus()
  }

  const runQuery = useCallback(async () => {
    if (!sql.trim() || status === 'running') return
    setStatus('running')
    setResult(null)

    const start = Date.now()
    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      })
      const json = (await res.json()) as {
        columns?: string[]
        rows?: (string | null)[][]
        rowCount?: number
        duration?: number
        error?: string
        message?: string
        sql?: string
      }

      const elapsed = Date.now() - start
      setQueryTime((elapsed / 1000).toFixed(3) + 's')

      if (!res.ok) {
        if (json.error === 'SETUP_REQUIRED') {
          setResult({
            columns: [],
            rows: [],
            rowCount: 0,
            duration: elapsed,
            error: json.sql ?? '',
            setupRequired: true,
          })
          setStatus('error')
        } else {
          setResult({
            columns: [],
            rows: [],
            rowCount: 0,
            duration: elapsed,
            error: json.error ?? 'Unknown error',
          })
          setStatus('error')
        }
      } else {
        setResult({
          columns: json.columns ?? [],
          rows: json.rows ?? [],
          rowCount: json.rowCount ?? 0,
          duration: elapsed,
        })
        setStatus('ok')
        setTimeout(() => setStatus('idle'), 2000)
      }
    } catch {
      const elapsed = Date.now() - start
      setResult({
        columns: [],
        rows: [],
        rowCount: 0,
        duration: elapsed,
        error: 'Network error — cannot reach server',
      })
      setStatus('error')
    }
  }, [sql, status])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void runQuery()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const s = ta.selectionStart
      const newVal = ta.value.substring(0, s) + '  ' + ta.value.substring(ta.selectionEnd)
      setSql(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2
      })
    }
  }

  const hintLabel =
    status === 'running'
      ? 'Running...'
      : status === 'ok'
        ? 'OK'
        : status === 'error'
          ? 'Error'
          : 'Ready'

  const hintColor =
    status === 'running'
      ? 'var(--yellow)'
      : status === 'ok'
        ? 'var(--green)'
        : status === 'error'
          ? 'var(--red)'
          : 'var(--text-3)'

  const resultInfoText =
    result && !result.error
      ? `${result.rowCount} rows · ${(result.duration / 1000).toFixed(3)}s`
      : result?.error && !result.setupRequired
        ? 'Error'
        : '—'

  const resultInfoColor =
    result && !result.error
      ? 'var(--green)'
      : result?.error
        ? 'var(--red)'
        : 'var(--text-3)'

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-[7px] text-[11px] font-semibold text-[var(--text)]">
          <div className="w-[6px] h-[6px] rounded-full bg-[var(--accent)]" />
          SQL Editor
        </div>
        <span className="font-mono text-[9px] text-[var(--text-3)]">⌘ + Enter to run</span>
      </div>

      {/* Snippets */}
      <div className="px-[10px] py-2 border-b border-[var(--border)] flex gap-[5px] flex-wrap shrink-0">
        {Object.keys(SQL_SNIPPETS).map((key) => (
          <button
            key={key}
            onClick={() => insertSnippet(key)}
            className="font-mono text-[9px] text-[var(--text-3)] bg-[var(--bg-3)] border border-[var(--border)] rounded-[4px] px-2 py-[2px] hover:text-[var(--accent)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-dim)] transition-all cursor-pointer"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="relative shrink-0">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-9 bg-[var(--bg-3)] border-r border-[var(--border)] flex flex-col items-center pt-[14px] pointer-events-none">
          {Array.from({ length: Math.max(lineCount, 4) }, (_, i) => (
            <div
              key={i}
              className="font-mono text-[11px] text-[var(--text-4)] leading-[1.7]"
              style={{ height: '18.7px' }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="w-full min-h-[160px] max-h-[160px] bg-[var(--bg-3)] border-none border-b border-[var(--border)] text-[var(--text)] font-mono text-[11px] leading-[1.7] pl-12 pr-[14px] pt-[14px] pb-[14px] resize-none outline-none caret-[var(--accent)] tab-size-2 [&::selection]:bg-[var(--accent-dim)]"
          style={{ borderBottom: '1px solid var(--border)' }}
        />
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-2)] shrink-0">
        <div className="flex gap-[6px]">
          <button
            onClick={() => void runQuery()}
            disabled={status === 'running'}
            className="inline-flex items-center gap-[6px] px-[14px] py-[6px] bg-[var(--green)] text-[#0a1a0f] border-none rounded-[var(--radius)] text-[12px] font-semibold font-mono hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {status === 'running' ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="animate-spin"
              >
                <path d="M8 2a6 6 0 1 0 6 6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 3l9 5-9 5V3z" />
              </svg>
            )}
            Run
          </button>
          <button
            onClick={clearEditor}
            className="inline-flex items-center gap-[5px] px-[10px] py-[5px] bg-transparent text-[var(--text-3)] border-none rounded-[var(--radius)] text-[11px] font-mono hover:text-[var(--text-2)] hover:bg-[var(--bg-3)] transition-all cursor-pointer"
          >
            Clear
          </button>
        </div>
        <span className="font-mono text-[10px]" style={{ color: hintColor }}>
          {hintLabel}
        </span>
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-[10px] border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-3)]">
          <span className="font-mono text-[10px] text-[var(--text-3)]">Results</span>
          <span className="font-mono text-[10px]" style={{ color: resultInfoColor }}>
            {resultInfoText}
          </span>
        </div>
        <SqlResults result={result} />
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-3 bg-[var(--bg-3)] shrink-0">
        <div className="flex items-center gap-[5px] font-mono text-[10px] text-[var(--text-3)]">
          <div
            className={`w-[5px] h-[5px] rounded-full ${
              connected ? 'bg-[var(--green)]' : 'bg-[var(--text-4)]'
            }`}
            style={
              connected
                ? {
                    animation: 'pulse-dot 2s infinite',
                  }
                : undefined
            }
          />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="font-mono text-[10px] text-[var(--text-3)]">{dbName}</div>
        <div className="ml-auto font-mono text-[10px] text-[var(--text-3)]">{queryTime}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaError, setSchemaError] = useState<string | null>(null)

  const [tableFilter, setTableFilter] = useState('')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [dataTab, setDataTab] = useState<DataTab>('data')

  // Row data state
  const [rowsLoading, setRowsLoading] = useState(false)
  const [rowsData, setRowsData] = useState<RowsResponse | null>(null)
  const [rowsError, setRowsError] = useState<string | null>(null)
  const [rowFilter, setRowFilter] = useState('')
  const [page, setPage] = useState(1)

  // Supabase project meta
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'your-project'
  const dbName = `${projectRef}`

  // ── Fetch schema ──
  useEffect(() => {
    setSchemaLoading(true)
    setSchemaError(null)
    fetch('/api/database/schema')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load schema')
        const json = (await res.json()) as { tables: TableInfo[] }
        setTables(json.tables ?? [])
        if (json.tables?.length > 0 && !selectedTable) {
          setSelectedTable(json.tables[0].name)
        }
      })
      .catch((e: Error) => setSchemaError(e.message))
      .finally(() => setSchemaLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch rows when table or page changes ──
  useEffect(() => {
    if (!selectedTable) return
    setRowsLoading(true)
    setRowsError(null)
    fetch(`/api/database/rows?table=${selectedTable}&page=${page}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Could not load rows' })) as { error?: string }
          throw new Error(err.error ?? 'Could not load rows')
        }
        const json = (await res.json()) as RowsResponse
        setRowsData(json)
      })
      .catch((e: Error) => {
        setRowsData(null)
        setRowsError(e.message)
      })
      .finally(() => setRowsLoading(false))
  }, [selectedTable, page])

  function handleSelectTable(name: string) {
    setSelectedTable(name)
    setPage(1)
    setRowFilter('')
    setDataTab('data')
  }

  const selectedTableInfo = tables.find((t) => t.name === selectedTable) ?? null
  const filteredTables = tableFilter.trim()
    ? tables.filter((t) => t.name.toLowerCase().includes(tableFilter.toLowerCase()))
    : tables

  return (
    <div
      data-full-bleed
      className="overflow-hidden flex"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* ══ LEFT: Table List ══════════════════════════════════════════════ */}
      <div className="w-[220px] min-w-[220px] border-r border-[var(--border)] flex flex-col overflow-hidden bg-[var(--bg-2)]">
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-[7px] text-[11px] font-semibold text-[var(--text)]">
            <div className="w-[6px] h-[6px] rounded-full bg-[var(--blue)]" />
            Tables
          </div>
          <span className="font-mono text-[10px] text-[var(--text-3)]">
            {schemaLoading ? '…' : tables.length}
          </span>
        </div>

        {/* Search */}
        <div className="px-[10px] py-2 border-b border-[var(--border)] shrink-0">
          <input
            type="text"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            placeholder="Filter tables..."
            className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-[var(--radius)] px-[10px] py-[5px] text-[11px] font-mono text-[var(--text)] placeholder:text-[var(--text-4)] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Table list */}
        <div className="flex-1 overflow-y-auto p-[6px] [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)]">
          {schemaLoading ? (
            <div className="flex flex-col gap-1 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-[34px] rounded-[5px] bg-[var(--bg-3)] animate-pulse"
                />
              ))}
            </div>
          ) : schemaError ? (
            <div className="px-2 py-4 text-center">
              <p className="font-mono text-[10px] text-[var(--red)]">{schemaError}</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="font-mono text-[10px] text-[var(--text-4)]">No tables found</p>
            </div>
          ) : (
            <>
              <div className="font-mono text-[9px] text-[var(--text-4)] uppercase tracking-[0.1em] px-2 pt-[10px] pb-1">
                public
              </div>
              {filteredTables.map((t, idx) => {
                const color = tableIconColor(t.name, idx)
                const isActive = t.name === selectedTable
                return (
                  <div
                    key={t.name}
                    onClick={() => handleSelectTable(t.name)}
                    className={`flex items-center gap-2 px-2 py-[6px] rounded-[5px] cursor-pointer transition-colors mb-[1px] border ${
                      isActive
                        ? 'bg-[var(--accent-dim)] border-[var(--accent-border)] text-[var(--text)]'
                        : 'border-transparent text-[var(--text-2)] hover:bg-[var(--bg-3)] hover:text-[var(--text)]'
                    }`}
                  >
                    <TableIcon color={color} />
                    <span className="font-mono text-[11px] flex-1 truncate">{t.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-4)]">
                      {fmtCount(t.rowCount)}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ══ CENTER: Data / Schema View ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[var(--border)]">
        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--bg-2)] shrink-0">
          {(['data', 'schema'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDataTab(tab)}
              className={`px-4 py-[10px] font-mono text-[11px] border-b-2 transition-all cursor-pointer capitalize ${
                dataTab === tab
                  ? 'text-[var(--text)] border-[var(--accent)]'
                  : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-2)]'
              }`}
            >
              {tab === 'data' ? 'Data' : 'Schema'}
            </button>
          ))}
          {selectedTableInfo && (
            <div className="ml-auto flex items-center pr-4">
              <span className="font-mono text-[10px] text-[var(--text-3)]">
                {selectedTableInfo.name}
              </span>
            </div>
          )}
        </div>

        {/* Tab content */}
        {dataTab === 'data' ? (
          <DataView
            tableName={selectedTable}
            columns={rowsData?.columns ?? []}
            colInfo={selectedTableInfo?.columns ?? []}
            loading={rowsLoading}
            error={rowsError}
            rows={rowsData?.rows ?? []}
            totalCount={rowsData?.totalCount ?? 0}
            totalPages={rowsData?.totalPages ?? 1}
            page={page}
            rowFilter={rowFilter}
            onFilterChange={setRowFilter}
            onPageChange={setPage}
          />
        ) : (
          <SchemaView columns={selectedTableInfo?.columns ?? []} />
        )}
      </div>

      {/* ══ RIGHT: SQL Editor ════════════════════════════════════════════ */}
      <div className="w-[340px] min-w-[340px] flex flex-col overflow-hidden bg-[var(--bg-2)]">
        <SqlEditor
          currentTable={selectedTable}
          dbName={dbName}
          connected={!schemaError && !schemaLoading}
        />
      </div>

      {/* Pulse dot animation */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 4px transparent; }
        }
      `}</style>
    </div>
  )
}
