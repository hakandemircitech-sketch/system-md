'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import type { BlueprintContent } from '@/types/blueprint'

interface SectionAccordionProps {
  content: BlueprintContent
  defaultOpen?: string[]
}

type SectionColor = 'indigo' | 'green' | 'yellow' | 'blue' | 'purple' | 'pink' | 'orange' | 'teal'

interface SectionConfig {
  id: string
  title: string
  meta: string
  color: SectionColor
  icon: React.ReactNode
  render: (content: BlueprintContent) => React.ReactNode
}

const COLOR_MAP: Record<SectionColor, { bg: string; text: string }> = {
  indigo: { bg: 'var(--accent-dim)', text: 'var(--accent)' },
  green: { bg: 'var(--green-dim)', text: 'var(--green)' },
  yellow: { bg: 'var(--yellow-dim)', text: 'var(--yellow)' },
  blue: { bg: 'var(--blue-dim)', text: 'var(--blue)' },
  purple: { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6' },
  pink: { bg: 'rgba(236,72,153,0.12)', text: '#ec4899' },
  orange: { bg: 'rgba(249,115,22,0.12)', text: '#f97316' },
  teal: { bg: 'rgba(20,184,166,0.12)', text: '#14b8a6' },
}

/* ── Yardımcı bileşenler ── */
function KVGrid({ rows }: { rows: { key: string; value: React.ReactNode }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-[0.06em] min-w-[100px] pt-[1px]">
            {row.key}
          </span>
          <span className="text-[13px] text-[var(--text-2)] leading-[1.6] flex-1">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function Chip({ children, accent, green }: { children: React.ReactNode; accent?: boolean; green?: boolean }) {
  return (
    <span
      className="font-mono text-[10px] rounded-[4px] px-2 py-[3px]"
      style={
        accent
          ? { color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }
          : green
          ? { color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.2)' }
          : { color: 'var(--text-2)', background: 'var(--bg-4)', border: '1px solid var(--border-2)' }
      }
    >
      {children}
    </span>
  )
}

function ChipRow({ items, accentFirst }: { items: string[]; accentFirst?: boolean }) {
  return (
    <div className="flex flex-wrap gap-[6px]">
      {items.map((item, i) => (
        <Chip key={i} accent={accentFirst && i === 0}>
          {item}
        </Chip>
      ))}
    </div>
  )
}

function StackItem({ name, role, badge, dotColor }: { name: string; role: string; badge?: string; dotColor: string }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-[9px] rounded-[5px] border"
      style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <div>
          <div className="text-[12px] text-[var(--text)] font-medium">{name}</div>
          <div className="font-mono text-[10px] text-[var(--text-3)]">{role}</div>
        </div>
      </div>
      {badge && (
        <span className="font-mono text-[9px] text-[var(--accent)] bg-[var(--accent-dim)] rounded-[4px] px-[6px] py-[2px]">
          {badge}
        </span>
      )}
    </div>
  )
}

function BulletList({ items, color }: { items: string[]; color?: string }) {
  return (
    <ul className="flex flex-col gap-[6px]">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-2)] leading-[1.6]">
          <span className="mt-[6px] w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: color ?? 'var(--text-3)' }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function SectionTag({ text, type }: { text: string; type?: 'success' | 'warning' | 'danger' | 'info' }) {
  const styles = {
    success: { color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.2)' },
    warning: { color: 'var(--yellow)', background: 'var(--yellow-dim)', border: '1px solid rgba(234,179,8,0.2)' },
    danger: { color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' },
    info: { color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' },
  }
  return (
    <span className="font-mono text-[9px] rounded-[4px] px-2 py-[2px]" style={type ? styles[type] : {}}>
      {text}
    </span>
  )
}

/* ── Section configs ── */
function buildSections(content: BlueprintContent): SectionConfig[] {
  return [
    {
      id: 'concept',
      title: 'Concept',
      meta: 'Vision, positioning, problem definition',
      color: 'indigo',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="6" r="3" /><path d="M2 13c0-2.2 2.7-4 6-4s6 1.8 6 4" />
        </svg>
      ),
      render: (c) => (
        <KVGrid
          rows={[
            { key: 'Title', value: <span className="text-[var(--text)] font-medium">{c.baslik}</span> },
            { key: 'Problem', value: c.problem.tanim },
            { key: 'User', value: c.problem.kullanici },
            { key: 'Current Solution', value: c.problem.mevcut_cozum },
            { key: 'Why Inadequate', value: c.problem.neden_yetersiz },
            { key: 'Value Proposition', value: c.deger_onerisi.tek_cumle },
          ]}
        />
      ),
    },
    {
      id: 'market',
      title: 'Market',
      meta: 'TAM, SAM, competitive analysis',
      color: 'green',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12L5 7l3 3 3-5 3 2" />
        </svg>
      ),
      render: (c) => (
        <KVGrid
          rows={[
            { key: 'TAM', value: c.problem.tam_adreslenebilir_pazar },
            { key: 'Target Audience', value: c.deger_onerisi.hedef_kitle },
            { key: 'Differentiator', value: c.deger_onerisi.fark },
          ]}
        />
      ),
    },
    {
      id: 'mvp',
      title: 'MVP Scope',
      meta: 'Features, out of scope, MVP question',
      color: 'yellow',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M5 8l2 2 4-4" />
        </svg>
      ),
      render: (c) => (
        <div className="flex flex-col gap-4">
          <div>
            <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-2">features</div>
            <BulletList items={c.mvp_kapsam.ozellikler} color="var(--green)" />
          </div>
          {c.mvp_kapsam.kapsam_disi.length > 0 && (
            <div>
              <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-2">out of scope</div>
              <BulletList items={c.mvp_kapsam.kapsam_disi} color="var(--text-4)" />
            </div>
          )}
          {c.mvp_kapsam.mvp_sorusu && (
            <div
              className="px-3 py-2 rounded-[5px] border text-[12px] text-[var(--text-2)] italic leading-[1.6]"
              style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}
            >
              &ldquo;{c.mvp_kapsam.mvp_sorusu}&rdquo;
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'revenue',
      title: 'Revenue Model',
      meta: 'Pricing, projections, monetization',
      color: 'blue',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 7h12M5 7v6" />
        </svg>
      ),
      render: (c) => (
        <div className="flex flex-col gap-3">
          <KVGrid
            rows={[
              { key: 'Model', value: <Chip accent>{c.gelir_modeli.model_turu}</Chip> },
              { key: 'Target MRR (3mo)', value: <span className="text-[var(--green)]">{c.gelir_modeli.hedef_mrr_3ay}</span> },
              { key: 'Target MRR (12mo)', value: <span className="text-[var(--green)]">{c.gelir_modeli.hedef_mrr_12ay}</span> },
            ]}
          />
          <div className="flex flex-col gap-2 mt-1">
            {c.gelir_modeli.planlar.map((plan, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-[5px] border"
                style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}
              >
                <div>
                  <span className="text-[12px] font-medium text-[var(--text)]">{plan.ad}</span>
                  <span className="text-[11px] text-[var(--text-3)] ml-2">— {plan.hedef}</span>
                </div>
                <span className="font-mono text-[11px] text-[var(--accent)]">
                  ${plan.fiyat_aylik}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'tech',
      title: 'Tech Stack',
      meta: `${Object.values(content.tech_stack).flat().filter(Boolean).length} technologies selected`,
      color: 'purple',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      ),
      render: (c) => (
        <div className="flex flex-col gap-2">
          {[
            { name: c.tech_stack.frontend, role: 'Frontend', color: '#38bdf8', badge: 'App Router' },
            { name: c.tech_stack.backend, role: 'Backend', color: '#4ade80', badge: undefined },
            { name: c.tech_stack.veritabani, role: 'Database', color: '#3ecf8e', badge: 'PostgreSQL' },
            { name: c.tech_stack.auth, role: 'Auth', color: '#a78bfa', badge: undefined },
            { name: c.tech_stack.ai, role: 'AI / ML', color: 'var(--accent)', badge: undefined },
            { name: c.tech_stack.email, role: 'Email', color: '#f97316', badge: undefined },
            { name: c.tech_stack.odeme, role: 'Payments', color: '#7c3aed', badge: undefined },
            { name: c.tech_stack.hosting, role: 'Hosting', color: '#64748b', badge: undefined },
          ]
            .filter((item) => item.name)
            .map((item, i) => (
              <StackItem key={i} name={item.name} role={item.role} badge={item.badge} dotColor={item.color} />
            ))}
          {c.tech_stack.ek_servisler?.length > 0 && (
            <div className="mt-1">
              <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-2">additional services</div>
              <ChipRow items={c.tech_stack.ek_servisler} />
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'db',
      title: 'Database Schema',
      meta: `${content.db_semasi.tablolar.length} tables`,
      color: 'teal',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="8" cy="5" rx="6" ry="2.5" />
          <path d="M2 5v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5" />
          <path d="M2 8c0 1.4 2.7 2.5 6 2.5S14 9.4 14 8" />
        </svg>
      ),
      render: (c) => (
        <div className="flex flex-col gap-3">
          {c.db_semasi.tablolar.map((tablo, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--accent)] font-medium">{tablo.ad}</span>
                <span className="text-[11px] text-[var(--text-3)]">— {tablo.aciklama}</span>
              </div>
              <ChipRow items={tablo.alanlar} />
            </div>
          ))}
          {c.db_semasi.sql && (
            <div className="mt-1">
              <div className="font-mono text-[9px] text-[var(--text-3)] uppercase tracking-[0.1em] mb-2">SQL preview</div>
              <div
                className="font-mono text-[11px] text-[var(--text-3)] p-3 rounded-[5px] border overflow-auto max-h-40 leading-[1.8]"
                style={{ background: 'var(--bg-4)', borderColor: 'var(--border)' }}
              >
                <pre className="whitespace-pre-wrap break-all">{c.db_semasi.sql.substring(0, 600)}{c.db_semasi.sql.length > 600 ? '\n-- ...' : ''}</pre>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API Design',
      meta: `${content.api_tasarim.endpointler.length} endpoints`,
      color: 'orange',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8h12M8 2l6 6-6 6" />
        </svg>
      ),
      render: (c) => (
        <div className="flex flex-col gap-2">
          {c.api_tasarim.endpointler.map((ep, i) => (
            <div
              key={i}
              className="p-3 rounded-[5px] border flex flex-col gap-[6px]"
              style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] px-[6px] py-[2px] rounded-[3px] font-medium"
                  style={{
                    color: ep.method === 'GET' ? 'var(--green)' : ep.method === 'POST' ? 'var(--accent)' : ep.method === 'DELETE' ? 'var(--red)' : 'var(--yellow)',
                    background: ep.method === 'GET' ? 'var(--green-dim)' : ep.method === 'POST' ? 'var(--accent-dim)' : ep.method === 'DELETE' ? 'var(--red-dim)' : 'var(--yellow-dim)',
                  }}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-[11px] text-[var(--text)]">{ep.yol}</span>
              </div>
              <span className="text-[12px] text-[var(--text-2)]">{ep.aciklama}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'feedback',
      title: 'AI Feedback',
      meta: 'Strengths, improvements, risks',
      color: 'pink',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2h12v9H9l-4 3v-3H2z" />
        </svg>
      ),
      render: (c) => (
        <div className="flex flex-col gap-4">
          <div>
            <div className="font-mono text-[9px] text-[var(--green)] uppercase tracking-[0.1em] mb-2 flex items-center gap-1">
              <SectionTag text="Strengths" type="success" />
            </div>
            <BulletList items={c.geri_bildirim.guclu_yonler} color="var(--green)" />
          </div>
          <div>
            <div className="font-mono text-[9px] text-[var(--yellow)] uppercase tracking-[0.1em] mb-2">
              <SectionTag text="Improvements" type="warning" />
            </div>
            <BulletList items={c.geri_bildirim.iyilestirmeler} color="var(--yellow)" />
          </div>
          {c.geri_bildirim.kritik_riskler?.length > 0 && (
            <div>
              <div className="font-mono text-[9px] text-[var(--red)] uppercase tracking-[0.1em] mb-2">
                <SectionTag text="Critical Risks" type="danger" />
              </div>
              <BulletList items={c.geri_bildirim.kritik_riskler} color="var(--red)" />
            </div>
          )}
          {c.geri_bildirim.ilk_hafta_aksiyonlari?.length > 0 && (
            <div>
              <div className="font-mono text-[9px] text-[var(--accent)] uppercase tracking-[0.1em] mb-2">
                <SectionTag text="This Week" type="info" />
              </div>
              <ol className="flex flex-col gap-[6px]">
                {c.geri_bildirim.ilk_hafta_aksiyonlari.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--text-2)] leading-[1.6]">
                    <span className="font-mono text-[10px] text-[var(--accent)] mt-[1px] flex-shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ),
    },
  ]
}

/* ── CopyButton ── */
function CopyButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-3)] bg-[var(--bg-4)] border border-[var(--border)] rounded-[4px] px-2 py-[3px] hover:text-[var(--text)] hover:border-[var(--border-2)] transition-all duration-[120ms]"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3H2v9h2" />
      </svg>
      copy
    </button>
  )
}

/* ── Main Component ── */
export default function SectionAccordion({ content, defaultOpen = ['concept'] }: SectionAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(defaultOpen))
  const sections = buildSections(content)

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopy = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation()
    const sec = sections.find((s) => s.id === sectionId)
    if (!sec) return
    navigator.clipboard.writeText(JSON.stringify(content, null, 2)).catch(() => {})
  }

  return (
    <div className="flex flex-col gap-[10px]">
      {sections.map((sec) => {
        const isOpen = openSections.has(sec.id)
        const colors = COLOR_MAP[sec.color]
        return (
          <div
            key={sec.id}
            className="rounded-[8px] border overflow-hidden transition-colors duration-[150ms]"
            style={{
              background: 'var(--bg-2)',
              borderColor: isOpen ? 'var(--border-2)' : 'var(--border)',
            }}
          >
            {/* Trigger */}
            <button
              onClick={() => toggle(sec.id)}
              className="w-full flex items-center justify-between px-4 py-[13px] cursor-pointer text-left transition-colors duration-[120ms] hover:bg-[var(--bg-3)]"
            >
              <div className="flex items-center gap-[10px]">
                <div
                  className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center flex-shrink-0"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {sec.icon}
                </div>
                <div>
                  <div className="text-[12px] font-medium text-[var(--text)] tracking-[-0.01em]">{sec.title}</div>
                  <div className="font-mono text-[10px] text-[var(--text-4)] mt-[1px]" style={{ letterSpacing: '0.04em' }}>{sec.meta}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton onClick={(e) => handleCopy(e, sec.id)} />
                <svg
                  className="text-[var(--text-3)] flex-shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </button>

            {/* Body */}
            {isOpen && (
              <div
                className="border-t px-4 py-4 flex flex-col gap-[10px]"
                style={{ borderColor: 'var(--border)' }}
              >
                {sec.render(content)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
