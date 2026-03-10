'use client'

import { toast } from '@/components/ui/Toast'
import { Badge, fmtDate, type BadgeVariant } from './CurrentPlanCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  stripe_invoice_id: string
  amount_usd: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  description: string | null
  invoice_pdf_url: string | null
  period_start: string | null
  period_end: string | null
  paid_at: string | null
  created_at: string
}

// ─── Mock invoices ────────────────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
  { id: '8', stripe_invoice_id: 'INV-2024-008', amount_usd: 0,     currency: 'usd', status: 'paid',          description: 'SystemMD Free Plan',             invoice_pdf_url: '#', period_start: '2024-11-01', period_end: '2024-12-01', paid_at: '2024-11-01', created_at: '2024-11-01' },
  { id: '7', stripe_invoice_id: 'INV-2024-007', amount_usd: 19,    currency: 'usd', status: 'paid',          description: 'SystemMD Solo Plan',             invoice_pdf_url: '#', period_start: '2024-10-01', period_end: '2024-11-01', paid_at: '2024-10-01', created_at: '2024-10-01' },
  { id: '6', stripe_invoice_id: 'INV-2024-006', amount_usd: 19,    currency: 'usd', status: 'paid',          description: 'SystemMD Solo Plan',             invoice_pdf_url: '#', period_start: '2024-09-01', period_end: '2024-10-01', paid_at: '2024-09-01', created_at: '2024-09-01' },
  { id: '5', stripe_invoice_id: 'INV-2024-005', amount_usd: 59,    currency: 'usd', status: 'paid',          description: 'SystemMD Agency Plan',           invoice_pdf_url: '#', period_start: '2024-08-01', period_end: '2024-09-01', paid_at: '2024-08-01', created_at: '2024-08-01' },
  { id: '4', stripe_invoice_id: 'INV-2024-004', amount_usd: 59,    currency: 'usd', status: 'void',          description: 'SystemMD Agency Plan',           invoice_pdf_url: '#', period_start: '2024-07-01', period_end: '2024-08-01', paid_at: null,          created_at: '2024-07-01' },
  { id: '3', stripe_invoice_id: 'INV-2024-003', amount_usd: 19,    currency: 'usd', status: 'paid',          description: 'SystemMD Solo Plan',             invoice_pdf_url: '#', period_start: '2024-06-01', period_end: '2024-07-01', paid_at: '2024-06-01', created_at: '2024-06-01' },
  { id: '2', stripe_invoice_id: 'INV-2024-002', amount_usd: 4.80,  currency: 'usd', status: 'uncollectible', description: 'SystemMD Solo Plan — overage',    invoice_pdf_url: '#', period_start: '2024-05-03', period_end: '2024-06-01', paid_at: null,          created_at: '2024-05-03' },
  { id: '1', stripe_invoice_id: 'INV-2024-001', amount_usd: 19,    currency: 'usd', status: 'paid',          description: 'SystemMD Solo Plan',             invoice_pdf_url: '#', period_start: '2024-05-01', period_end: '2024-06-01', paid_at: '2024-05-01', created_at: '2024-05-01' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}

// ─── Invoice Status Badge ─────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const config: Record<Invoice['status'], { variant: BadgeVariant; label: string }> = {
    paid:          { variant: 'green',   label: 'Paid' },
    open:          { variant: 'yellow',  label: 'Open' },
    draft:         { variant: 'neutral', label: 'Draft' },
    uncollectible: { variant: 'red',     label: 'Failed' },
    void:          { variant: 'yellow',  label: 'Refunded' },
  }
  const { variant, label } = config[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

// ─── BillingHistoryTable ──────────────────────────────────────────────────────

interface BillingHistoryTableProps {
  invoices: Invoice[]
  loading: boolean
}

export default function BillingHistoryTable({ invoices, loading }: BillingHistoryTableProps) {
  function handleDownload(inv: Invoice) {
    if (inv.invoice_pdf_url && inv.invoice_pdf_url !== '#') {
      window.open(inv.invoice_pdf_url, '_blank')
    } else {
      toast.info('PDF not available yet')
    }
  }

  return (
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-[8px] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-[14px] border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text)]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.5">
            <path d="M2 3h12M2 8h8M2 13h10" />
          </svg>
          All invoices
        </div>
        <span className="font-mono text-[10px] text-[var(--text-3)]">{invoices.length} total</span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-[13px] border-b border-[var(--border)] last:border-b-0">
              <div className="h-4 w-28 bg-[var(--border-2)] rounded animate-pulse" />
              <div className="h-4 w-20 bg-[var(--border-2)] rounded animate-pulse" />
              <div className="flex-1 h-4 bg-[var(--border-2)] rounded animate-pulse" />
              <div className="h-4 w-14 bg-[var(--border-2)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="var(--text-4)" strokeWidth="1">
            <path d="M2 3h12M2 8h8M2 13h10" />
          </svg>
          <div className="text-[13px] text-[var(--text-3)]">No invoices yet</div>
          <div className="text-[12px] text-[var(--text-4)] mt-1">Invoices will appear here after your first payment</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-3)]">
                {['Invoice ID', 'Date', 'Description', 'Amount', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-[9px] text-left font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.08em] font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-[var(--border)] last:border-b-0 hover:[&_td]:bg-[var(--bg-3)] transition-colors"
                >
                  <td className="px-4 py-[13px] font-mono text-[11px] text-[var(--accent)]">
                    {inv.stripe_invoice_id}
                  </td>
                  <td className="px-4 py-[13px] text-[12px] text-[var(--text-2)]">
                    {fmtDate(inv.created_at)}
                  </td>
                  <td className="px-4 py-[13px] text-[12px] text-[var(--text-2)]">
                    {inv.description ?? '—'}
                  </td>
                  <td className="px-4 py-[13px] font-mono text-[12px] text-[var(--text)] font-medium">
                    {fmtUsd(Number(inv.amount_usd))}
                  </td>
                  <td className="px-4 py-[13px]">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-[13px]">
                    <button
                      onClick={() => handleDownload(inv)}
                      className="inline-flex items-center gap-[5px] px-[10px] py-1 bg-[var(--bg-4)] border border-[var(--border-2)] rounded-[4px] font-mono text-[10px] text-[var(--text-3)] cursor-pointer hover:text-[var(--text)] hover:bg-[var(--bg-3)] transition-all"
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 2v8M5 7l3 3 3-3M2 13h12" />
                      </svg>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
