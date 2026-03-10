'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

interface BuildKitFile {
  id: string
  filename: string
  description: string
  content: string
  icon: React.ReactNode
  language?: string
}

interface BuildKitPanelProps {
  blueprintId: string
  cursorrules?: string
  buildMd?: string
  schemaSql?: string
  envExample?: string
  readmeMd?: string
}

function DownloadButton({ content, filename }: { content: string; filename: string }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-3)] bg-[var(--bg-4)] border border-[var(--border)] rounded-[4px] px-2 py-[3px] hover:text-[var(--text)] hover:border-[var(--border-2)] transition-all duration-[120ms]"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8v5h10V8M8 2v8M5 7l3 3 3-3" />
      </svg>
      download
    </button>
  )
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'flex items-center gap-1 font-mono text-[10px] bg-[var(--bg-4)] border rounded-[4px] px-2 py-[3px] transition-all duration-[120ms]',
        copied
          ? 'text-[var(--green)] border-[rgba(34,197,94,0.3)]'
          : 'text-[var(--text-3)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-2)]'
      )}
    >
      {copied ? (
        <>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8l4 4 8-8" />
          </svg>
          copied!
        </>
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3H2v9h2" />
          </svg>
          copy
        </>
      )}
    </button>
  )
}

export default function BuildKitPanel({
  blueprintId,
  cursorrules,
  buildMd,
  schemaSql,
  envExample,
  readmeMd,
}: BuildKitPanelProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const files: BuildKitFile[] = [
    cursorrules && {
      id: 'cursorrules',
      filename: '.cursorrules',
      description: 'AI agent coding rules',
      content: cursorrules,
      language: 'markdown',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="5" /><path d="M8 5v3l2 1.5" />
        </svg>
      ),
    },
    buildMd && {
      id: 'build_md',
      filename: 'build.md',
      description: 'Step-by-step build guide',
      content: buildMd,
      language: 'markdown',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 3h12M2 8h8M2 13h10" />
        </svg>
      ),
    },
    schemaSql && {
      id: 'schema_sql',
      filename: 'schema.sql',
      description: 'PostgreSQL database schema',
      content: schemaSql,
      language: 'sql',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="8" cy="5" rx="6" ry="2.5" />
          <path d="M2 5v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5" />
          <path d="M2 8c0 1.4 2.7 2.5 6 2.5S14 9.4 14 8" />
        </svg>
      ),
    },
    envExample && {
      id: 'env_example',
      filename: '.env.example',
      description: 'Environment variables template',
      content: envExample,
      language: 'bash',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" rx="2" /><path d="M6 8h4M8 6v4" />
        </svg>
      ),
    },
    readmeMd && {
      id: 'readme_md',
      filename: 'README.md',
      description: 'Project getting started guide',
      content: readmeMd,
      language: 'markdown',
      icon: (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2h12v12H2zM5 5h6M5 8h6M5 11h4" />
        </svg>
      ),
    },
  ].filter(Boolean) as BuildKitFile[]

  const activeFileData = files.find((f) => f.id === activeFile)

  const handleDownloadAll = () => {
    setDownloadingAll(true)
    files.forEach(({ content, filename }) => {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    })
    setTimeout(() => setDownloadingAll(false), 1000)
  }

  return (
    <div
      className="rounded-[8px] border overflow-hidden"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-[7px]">
          <div
            className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M5 3V1.5M11 3V1.5M2 7h12" />
            </svg>
          </div>
          <div>
            <div className="text-[12px] font-medium text-[var(--text)]">Build Kit</div>
            <div className="font-mono text-[10px] text-[var(--text-3)]">{files.length} files ready</div>
          </div>
        </div>
        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll || files.length === 0}
          className="flex items-center gap-[6px] px-3 py-[6px] text-[11px] font-medium text-white bg-[var(--accent)] rounded-[6px] border border-[var(--accent)] hover:bg-[#5558e8] transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadingAll ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8v5h10V8M8 2v8M5 7l3 3 3-3" />
            </svg>
          )}
          download all
        </button>
      </div>

      {/* File List */}
      <div className="flex flex-col">
        {files.map((file) => (
          <div key={file.id}>
            <button
              onClick={() => setActiveFile(activeFile === file.id ? null : file.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-3)] transition-colors duration-[120ms] text-left border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="text-[var(--text-3)]">{file.icon}</div>
                <div>
                  <div className="font-mono text-[11px] text-[var(--text)] font-medium">{file.filename}</div>
                  <div className="text-[11px] text-[var(--text-3)]">{file.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <CopyButton content={file.content} />
                <DownloadButton content={file.content} filename={file.filename} />
                <svg
                  className="text-[var(--text-3)] transition-transform duration-200 flex-shrink-0"
                  style={{ transform: activeFile === file.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </div>
            </button>

            {/* Preview */}
            {activeFile === file.id && activeFileData && (
              <div
                className="border-b"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <div
                  className="font-mono text-[11px] text-[var(--text-3)] p-4 overflow-auto max-h-64 leading-[1.8]"
                >
                  <pre className="whitespace-pre-wrap break-all">{activeFileData.content.substring(0, 1500)}{activeFileData.content.length > 1500 ? '\n\n-- Content truncated. Click "download" to get the full file.' : ''}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center gap-2">
        <span className="font-mono text-[10px] text-[var(--text-3)]">
          Blueprint ID: <span className="text-[var(--text-4)]">{blueprintId.substring(0, 8)}...</span>
        </span>
      </div>
    </div>
  )
}
