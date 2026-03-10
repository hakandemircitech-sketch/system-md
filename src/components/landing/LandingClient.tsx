'use client'

import { useState, useRef, useEffect } from 'react'

type Phase = 'idle' | 'generating' | 'done' | 'error'

interface TerminalLine {
  text: string
  type: 'default' | 'success' | 'error' | 'info' | 'dim'
}

function classify(text: string): TerminalLine['type'] {
  if (text.startsWith('✓') || text.startsWith('✔')) return 'success'
  if (text.startsWith('✗') || text.startsWith('×')) return 'error'
  if (text.startsWith('→') || text.startsWith('▸')) return 'info'
  if (text.startsWith('//') || text.startsWith('#')) return 'dim'
  return 'default'
}

export default function LandingClient() {
  const [idea, setIdea] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [termLines, setTermLines] = useState<TerminalLine[]>([])
  const [progress, setProgress] = useState(0)
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [blueprintTitle, setBlueprintTitle] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const shownMilestones = useRef<Set<number>>(new Set())
  const MAX = 500

  // Message form state
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactDone, setContactDone] = useState(false)

  useEffect(() => {
    if (bottomRef.current) {
      const container = bottomRef.current.parentElement
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [termLines])

  useEffect(() => {
    if (zipBlob && phase === 'done') {
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(blueprintTitle || 'blueprint').replace(/\s+/g, '-').toLowerCase()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [zipBlob, phase, blueprintTitle])

  function addLine(text: string) {
    setTermLines((prev) => [...prev, { text, type: classify(text) }])
  }

  function handleAnalyze() {
    if (!idea.trim() || idea.length < 10) return
    setPhase('generating')
    setTermLines([])
    setProgress(0)
    setZipBlob(null)
    startGeneration()
  }

  async function startGeneration() {
    setPhase('generating')
    setTermLines([])
    setProgress(0)
    setZipBlob(null)
    shownMilestones.current = new Set()
    addLine(`$ smd init "${idea.substring(0, 60)}${idea.length > 60 ? '...' : ''}"`)

    try {
      const res = await fetch('/api/blueprint/public-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_text: idea }),
      })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as any).error || 'Generation failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const event = JSON.parse(part.slice(6)) as Record<string, any>
            if (event.type === 'status') {
              addLine(`→ ${event.message}`)
            } else if (event.type === 'progress') {
              setProgress(event.value)
              if (event.value >= 20 && !shownMilestones.current.has(20)) {
                shownMilestones.current.add(20)
                addLine('Analyzing market fit...')
              }
              if (event.value >= 40 && !shownMilestones.current.has(40)) {
                shownMilestones.current.add(40)
                addLine(event.score ? `✓ Validated (score: ${event.score}/100)` : '✓ Market analysis complete')
              }
              if (event.value >= 60 && !shownMilestones.current.has(60)) {
                shownMilestones.current.add(60)
                addLine('Generating architecture...')
              }
              if (event.value >= 75 && !shownMilestones.current.has(75)) {
                shownMilestones.current.add(75)
                addLine('→ Next.js 16 + Supabase + Anthropic SDK')
              }
              if (event.value >= 85 && !shownMilestones.current.has(85)) {
                shownMilestones.current.add(85)
                addLine('Writing .cursorrules...')
                addLine('Writing schema.sql...')
                addLine('Writing BUILD.md...')
              }
            } else if (event.type === 'complete') {
              setBlueprintTitle(event.title || idea.substring(0, 40))
              addLine('✓ Build kit ready')
              addLine('')
              addLine('$ smd build --follow-blueprint')
              addLine(`Building ${event.title || 'project'} with SystemMD...`)
              if (event.blueprint_id) {
                try {
                  const zipRes = await fetch(`/api/blueprint/public-download/${event.blueprint_id}`)
                  if (zipRes.ok) {
                    const blob = await zipRes.blob()
                    setZipBlob(blob)
                    const url = URL.createObjectURL(blob)
                    setDownloadUrl(url)
                    addLine('✓ Build kit ready')
                    addLine('')
                    addLine('$ smd build --follow-blueprint')
                    addLine(`Building ${event.title || 'project'} with SystemMD...`)
                    addLine('✓ systemmd.com deployed')
                    addLine('$ _')
                  } else {
                    addLine('✗ ZIP generation failed. Use the download button below.')
                    setDownloadUrl(`/api/blueprint/public-download/${event.blueprint_id}`)
                  }
                } catch {
                  addLine('✗ Download error. Use the download button below.')
                  setDownloadUrl(`/api/blueprint/public-download/${event.blueprint_id}`)
                }
              }
              setProgress(100)
              setPhase('done')
            } else if (event.type === 'error') {
              addLine(`✗ ${event.message}`)
              setPhase('error')
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err) {
      addLine(`✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setPhase('error')
    }
  }

  function handleReset() {
    setPhase('idle')
    setIdea('')
    setTermLines([])
    setProgress(0)
    setZipBlob(null)
    setBlueprintTitle('')
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
  }

  async function handleContactSubmit() {
    if (!message.trim()) return
    setContactLoading(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email: contactEmail }),
      })
      setContactDone(true)
    } catch {
      setContactDone(true)
    } finally {
      setContactLoading(false)
    }
  }

  const isGenerating = phase === 'generating'
  const isDone = phase === 'done'

  // ── Tema state ──
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const wrapper = document.querySelector('[data-theme]')
    if (wrapper) {
      wrapper.setAttribute('data-theme', theme)
    } else {
      // LandingClient kendi wrapper'ında data-theme yok, body'ye uygula
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  return (
    <div style={{ minHeight:'100dvh',background:'var(--bg)',display:'flex',flexDirection:'column' }}>

      {/* ── SECTION 1: HEADER ── */}
      <header style={{ padding:'14px 32px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,position:'sticky',top:0,zIndex:40,backgroundColor:'var(--bg)',backdropFilter:'blur(8px)' }}>
        {/* Logo */}
        <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'13px',fontWeight:500,letterSpacing:'-0.02em',color:'var(--text)',flexShrink:0 }}>
          System<span style={{ color:'var(--accent)' }}>MD</span>
          <span style={{ color:'var(--accent)',animation:'blink 1.1s step-end infinite' }}>_</span>
        </span>

        {/* Kayan ticker */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          margin: '0 32px',
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}>
          <div style={{
            display: 'flex',
            gap: '0',
            animation: 'ticker 28s linear infinite',
            whiteSpace: 'nowrap',
            width: 'max-content',
          }}>
            {[...Array(2)].map((_, duplication) => (
              <span key={duplication} style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
                {[
                  { icon: '⚡', text: 'No sign-up required', accent: true },
                  { icon: '🆓', text: 'Completely free', accent: false },
                  { icon: '📦', text: 'Download as ZIP', accent: false },
                  { icon: '🚀', text: 'Blueprint in seconds', accent: true },
                  { icon: '🔓', text: 'No credit card', accent: false },
                  { icon: '🛠️', text: 'Real code architecture', accent: false },
                  { icon: '✨', text: 'Powered by AI', accent: true },
                  { icon: '💡', text: 'Idea in · blueprint out', accent: false },
                ].map((item, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '11px',
                      color: item.accent ? 'var(--accent)' : 'var(--text-2)',
                      letterSpacing: '0.04em',
                      padding: '0 20px',
                      fontWeight: item.accent ? 600 : 400,
                    }}>
                      <span style={{ marginRight: '7px' }}>{item.icon}</span>
                      {item.text}
                    </span>
                    <span style={{ color: 'var(--border-2)', fontSize: '10px', userSelect: 'none' }}>·</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* Auth buttons */}
        <div style={{ display:'flex',alignItems:'center',gap:'8px',flexShrink:0 }}>
          {/* Tema Toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              width: '52px',
              height: '26px',
              borderRadius: '999px',
              border: '1px solid var(--border-2)',
              background: theme === 'dark' ? '#1a1a2e' : '#e8e6e0',
              cursor: 'pointer',
              padding: '3px',
              transition: 'background 300ms ease, border-color 300ms ease',
              flexShrink: 0,
              outline: 'none',
            }}
          >
            <span style={{ position:'absolute',left:'7px',fontSize:'10px',lineHeight:1,opacity:theme==='dark'?1:0,transition:'opacity 200ms ease',pointerEvents:'none' }}>🌙</span>
            <span style={{ position:'absolute',right:'7px',fontSize:'10px',lineHeight:1,opacity:theme==='dark'?0:1,transition:'opacity 200ms ease',pointerEvents:'none' }}>☀️</span>
            <span style={{
              display: 'block',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: theme === 'dark' ? '#6366f1' : '#ffffff',
              boxShadow: theme === 'dark' ? '0 0 6px rgba(99,102,241,0.6)' : '0 1px 4px rgba(0,0,0,0.18)',
              transform: theme === 'dark' ? 'translateX(26px)' : 'translateX(0)',
              transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1), background 300ms ease, box-shadow 300ms ease',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1,
            }} />
          </button>
        </div>
      </header>

      {/* ── SECTION 2: HERO ── */}
      <div style={{ textAlign:'center',padding:'48px 24px 32px',flexShrink:0 }}>
        <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'11px',color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:'12px' }}>
          ship faster · build smarter
        </p>
        <h1 style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'clamp(28px, 5vw, 52px)',fontWeight:400,color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1.15,marginBottom:'14px' }}>
          Turn your idea into a<br />
          <span style={{ color:'var(--accent)' }}>production blueprint.</span>
        </h1>
        <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'15px',color:'var(--text-3)',maxWidth:'480px',margin:'0 auto',lineHeight:1.65 }}>
          Describe what you&apos;re building. Get architecture, schema, API design, revenue model — as a ZIP.
        </p>
      </div>

      {/* ── SECTION 3: SPLIT PANEL ── */}
      <div id="how-it-works" style={{ flex:'none',display:'flex',maxWidth:'960px',width:'100%',margin:'0 auto',padding:'0 24px',gap:'16px',boxSizing:'border-box',minHeight:'440px' }}>

        {/* Left: input */}
        <div style={{ flex:'0 0 400px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'12px',display:'flex',flexDirection:'column',overflow:'hidden' }}>
          <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'7px' }}>
            <div style={{ width:5,height:5,borderRadius:'50%',background:'var(--accent)' }} />
            <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--text-3)' }}>
              your idea
            </span>
          </div>

          <div style={{ flex:1,padding:'20px',display:'flex',flexDirection:'column' }}>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value.slice(0, MAX))}
              placeholder="A tool that helps indie hackers track their MRR across multiple products..."
              disabled={isGenerating || isDone}
              rows={8}
              style={{ flex:1,width:'100%',background:'transparent',border:'none',outline:'none',resize:'none',fontSize:'14px',fontFamily:"'Geist',system-ui,sans-serif",color:'var(--text)',lineHeight:1.7,opacity:isGenerating||isDone?0.5:1,boxSizing:'border-box' }}
            />
            <div style={{ display:'flex',justifyContent:'flex-end',paddingTop:'8px' }}>
              <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:idea.length > MAX * 0.9 ? 'var(--yellow)' : 'var(--text-4)' }}>
                {idea.length} / {MAX}
              </span>
            </div>
          </div>

          <div style={{ padding:'16px 20px',borderTop:'1px solid var(--border)' }}>
            {isDone ? (
              <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      download="blueprint.zip"
                      style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px 14px',background:'var(--accent)',color:'white',borderRadius:'8px',textDecoration:'none',fontFamily:"'Geist Mono',monospace",fontSize:'12px',fontWeight:500 }}
                    >
                      download blueprint.zip
                    </a>
                  ) : (
                    <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'8px' }}>
                      <span style={{ color:'var(--green)',fontSize:'14px' }}>✓</span>
                      <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'11px',color:'var(--green)' }}>Blueprint ready</span>
                    </div>
                  )}
                  <button
                    onClick={handleReset}
                    style={{ width:'100%',padding:'10px',background:'transparent',border:'1px solid var(--border-2)',borderRadius:'8px',fontSize:'12px',fontFamily:"'Geist Mono',monospace",color:'var(--text-3)',cursor:'pointer' }}
                  >
                    new idea -&gt;
                  </button>
                </div>
            ) : (
              <>
                <button
                  onClick={handleAnalyze}
                  disabled={isGenerating || idea.trim().length < 10}
                  style={{ width:'100%',padding:'13px',background:isGenerating||idea.trim().length<10?'var(--bg-4)':'var(--text)',color:isGenerating||idea.trim().length<10?'var(--text-4)':'var(--bg)',border:'none',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",fontWeight:500,cursor:isGenerating||idea.trim().length<10?'not-allowed':'pointer',transition:'all 140ms ease',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px' }}
                >
                  {isGenerating
                    ? (<><span style={{ width:12,height:12,border:'1.5px solid var(--text-4)',borderTopColor:'var(--text-2)',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />generating...</>)
                    : 'analyze →'
                  }
                </button>
                <p style={{ textAlign:'center',marginTop:'8px',fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)' }}>
                  free to try · no credit card
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right: terminal */}
        <div style={{ flex:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'12px',display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0 }}>
          <div style={{ padding:'12px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'var(--bg-2)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <div style={{ width:10,height:10,borderRadius:'50%',background:'#FF5F57' }} />
              <div style={{ width:10,height:10,borderRadius:'50%',background:'#FFBD2E' }} />
              <div style={{ width:10,height:10,borderRadius:'50%',background:'#28CA41' }} />
            </div>
            <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',letterSpacing:'0.05em' }}>
              blueprint output
            </span>
          </div>

          {(isGenerating || isDone) && (
            <div style={{ height:'1px',background:'var(--border)',flexShrink:0 }}>
              <div style={{ height:'100%',background:'linear-gradient(to right, var(--accent), var(--green))',width:`${progress}%`,transition:'width 500ms ease' }} />
            </div>
          )}

          <div style={{ flex:1,overflowY:'auto',padding:'20px 24px',fontFamily:"'Geist Mono',monospace",fontSize:'12px',lineHeight:2 }}>
            {termLines.length === 0 ? (
              <div>
                <span style={{ color:'var(--text-4)' }}>$ </span>
                <span style={{ color:'var(--text-3)' }}>waiting for input</span>
              </div>
            ) : (
              termLines.map((line, i) => (
                <div
                  key={i}
                  style={{ color:line.type==='success'?'var(--green)':line.type==='error'?'var(--red)':line.type==='info'?'var(--accent)':line.type==='dim'?'var(--text-4)':'var(--text-3)',whiteSpace:'pre-wrap',wordBreak:'break-word' }}
                >
                  {line.text || '\u00A0'}
                </div>
              ))
            )}
            {isGenerating && (
              <div style={{ display:'flex',alignItems:'center',gap:2,marginTop:4 }}>
                <span style={{ color:'var(--text-4)' }}>$ </span>
                <span style={{ display:'inline-block',width:6,height:13,background:'var(--text-3)',marginLeft:2,animation:'blink 1.1s step-end infinite' }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding:'10px 20px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'var(--bg-2)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:isGenerating?'var(--yellow)':isDone?'var(--green)':'var(--text-4)',animation:isGenerating?'pulseDot 2s ease infinite':undefined }} />
              <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-3)' }}>
                {isGenerating ? 'claude api connected' : isDone ? 'complete' : 'idle'}
              </span>
            </div>
            <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)' }}>
              {termLines.filter(l => l.text).length} lines
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: WHAT YOU GET ── */}
      <div id="features" style={{ maxWidth:'960px',width:'100%',margin:'64px auto 0',padding:'0 24px',boxSizing:'border-box' }}>
        <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'24px' }}>
          what&apos;s inside every blueprint
        </p>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'12px' }}>
          {[
            {
              tag: '.cursorrules',
              title: 'AI Coding Rules',
              desc: 'Your project\'s rules for Cursor, Windsurf or any AI editor. Zero hallucination, full context.',
            },
            {
              tag: 'schema.sql',
              title: 'Database Schema',
              desc: 'Production-ready Supabase schema. Tables, indexes, RLS policies — ready to run.',
            },
            {
              tag: 'BUILD.md',
              title: 'Build Guide',
              desc: 'Step by step architecture guide. Every API endpoint, every page, every decision explained.',
            },
            {
              tag: '.env.example',
              title: 'Environment Setup',
              desc: 'Every API key and config variable your project needs. Nothing missing.',
            },
          ].map((card) => (
            <div
              key={card.tag}
              style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'24px',display:'flex',flexDirection:'column',gap:'10px' }}
            >
              <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.1em' }}>
                {card.tag}
              </span>
              <h3 style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'18px',fontWeight:400,color:'var(--text)',lineHeight:1.25 }}>
                {card.title}
              </h3>
              <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-3)',lineHeight:1.65 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: ORIGINAL KIT ── */}
      <div style={{ maxWidth:'960px',width:'100%',margin:'80px auto 0',padding:'0 24px',boxSizing:'border-box',display:'flex',gap:'48px',alignItems:'center' }}>
        {/* Left: text */}
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px' }}>
            where it started
          </p>
          <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'clamp(24px, 3vw, 36px)',fontWeight:400,color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1.2,marginBottom:'16px' }}>
            The original SystemMD kit.
          </h2>
          <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'14px',color:'var(--text-3)',lineHeight:1.7,marginBottom:'28px' }}>
            Before the platform, there was a file. A hand-crafted blueprint that started this whole system. Download it and see what a production blueprint looks like.
          </p>
          <button
            onClick={() => {
              const a = document.createElement('a')
              a.href = '/systemmd-original-kit.zip'
              a.download = 'systemmd-original-kit.zip'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }}
            style={{ padding:'12px 20px',background:'var(--text)',color:'var(--bg)',border:'none',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",fontWeight:500,cursor:'pointer',transition:'all 140ms ease' }}
          >
            download original kit →
          </button>
        </div>

        {/* Right: terminal preview */}
        <div style={{ flex:'0 0 320px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'12px',padding:'24px',fontFamily:"'Geist Mono',monospace",fontSize:'11px',lineHeight:1.9 }}>
          <div style={{ color:'var(--text-3)' }}>$ ls systemmd-kit/</div>
          <div style={{ color:'var(--green)' }}>.cursorrules</div>
          <div style={{ color:'var(--green)' }}>schema.sql</div>
          <div style={{ color:'var(--green)' }}>BUILD.md</div>
          <div style={{ color:'var(--green)' }}>.env.example</div>
          <div style={{ color:'var(--green)' }}>quickstart.sh</div>
          <div>&nbsp;</div>
          <div style={{ color:'var(--text-3)' }}>$ wc -l BUILD.md</div>
          <div style={{ color:'var(--accent)' }}>247 BUILD.md</div>
          <div>&nbsp;</div>
          <div style={{ color:'var(--text-3)' }}>$ echo $READY</div>
          <div style={{ color:'var(--green)' }}>true</div>
        </div>
      </div>

      {/* ── SECTION 6: STORY ── */}
      <div id="about" style={{ maxWidth:'960px',width:'100%',margin:'80px auto 0',padding:'0 24px 80px',boxSizing:'border-box',display:'flex',gap:'64px' }}>
        {/* Left: text */}
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px' }}>
            the builder
          </p>
          <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'clamp(24px, 3vw, 36px)',fontWeight:400,color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1.2,marginBottom:'24px' }}>
            Built by a founder solving his own problem
          </h2>
          <div style={{ display:'flex',flexDirection:'column',gap:'16px',marginBottom:'28px' }}>
            <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'14px',color:'var(--text-3)',lineHeight:1.75 }}>
              I built SystemMD because I needed a better way to turn complex product ideas into usable technical plans.
            </p>
            <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'14px',color:'var(--text-3)',lineHeight:1.75 }}>
              What started as a personal blueprint system is becoming the platform I wish I had when I first started building.
            </p>
            <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'14px',color:'var(--text-3)',lineHeight:1.75 }}>
              It is being shaped through real workflows, practical output, and continuous refinement rather than presentation theater.
            </p>
          </div>
          <button
            onClick={() => window.open('https://github.com/hakandemircitech-sketch/system-md', '_blank')}
            style={{ padding:'10px 18px',background:'transparent',color:'var(--text)',border:'1px solid var(--border-2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",cursor:'pointer',transition:'all 140ms ease' }}
          >
            view on github →
          </button>
        </div>

        {/* Right: timeline */}
        <div style={{ flex:'0 0 280px',display:'flex',flexDirection:'column',gap:0,paddingTop:'52px' }}>
          {[
            { label:'SystemMD', sub:'Blueprint generator. Live.', dotColor:'var(--green)', filled:true },
            { label:'BUILT IN PUBLIC', sub:'Progress, product direction, and implementation are visible in the open.', dotColor:'var(--accent)', filled:true },
            { label:'REAL WORKFLOWS', sub:'SystemMD is shaped by actual planning and build use cases, not landing page theater.', dotColor:'var(--accent)', filled:true },
            { label:'CONTINUOUS REFINEMENT', sub:'The product improves through direct usage, feedback, and iteration.', dotColor:'var(--border)', filled:false },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display:'flex',gap:'16px' }}>
              {/* dot + line */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0 }}>
                <div style={{ width:10,height:10,borderRadius:'50%',background:item.filled ? item.dotColor : 'transparent',border:`2px solid ${item.dotColor}`,flexShrink:0,marginTop:'3px' }} />
                {i < arr.length - 1 && (
                  <div style={{ width:1,flex:1,background:'var(--border)',minHeight:'40px' }} />
                )}
              </div>
              {/* text */}
              <div style={{ paddingBottom: i < arr.length - 1 ? '28px' : 0 }}>
                <div style={{ fontFamily:"'Geist Mono',monospace",fontSize:'12px',color:'var(--text)',fontWeight:500,marginBottom:'4px' }}>
                  {item.label}
                </div>
                <div style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'12px',color:'var(--text-3)',lineHeight:1.5 }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 7: PRICING ── */}
      <div id="pricing" style={{ borderTop:'1px solid var(--border)',paddingTop:'80px',paddingBottom:'80px' }}>
        <div style={{ maxWidth:'960px',width:'100%',margin:'0 auto',padding:'0 24px',boxSizing:'border-box' }}>
          <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px',textAlign:'center' }}>
            pricing
          </p>
          <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'clamp(28px, 3vw, 40px)',fontWeight:400,color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1.2,marginBottom:'12px',textAlign:'center' }}>
            Simple, honest pricing.
          </h2>
          <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'14px',color:'var(--text-3)',lineHeight:1.65,marginBottom:'52px',textAlign:'center' }}>
            Start free. Upgrade when you need more.
          </p>

          {/* wrapper: Pro kartı için üstte rozetçe alan bırakmak amacıyla paddingTop */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px',alignItems:'stretch',paddingTop:'16px' }}>

            {/* FREE */}
            <div style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'28px',display:'flex',flexDirection:'column' }}>
              <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px' }}>Free</p>
              <div style={{ marginBottom:'4px' }}>
                <span style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'48px',fontWeight:400,color:'var(--text)',lineHeight:1 }}>$0</span>
              </div>
              <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-3)',marginBottom:'24px',lineHeight:1.5 }}>
                For builders who want to try it out.
              </p>
              <div style={{ display:'flex',flexDirection:'column',gap:'10px',marginBottom:'28px',flex:1 }}>
                {[
                  { text:'Verified email, one clean public generation flow, and ZIP download.', dim:true },
                  { text:'Verified email required', dim:false },
                  { text:'1 generate per day', dim:false },
                  { text:'Standard blueprint output', dim:false },
                  { text:'ZIP download', dim:false },
                  { text:'No dashboard', dim:false },
                ].map((f,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:'8px' }}>
                    <span style={{ color:'var(--text-4)',fontFamily:"'Geist Mono',monospace",fontSize:'11px',flexShrink:0,marginTop:'2px' }}>—</span>
                    <span style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:f.dim?'var(--text-3)':'var(--text-2)',lineHeight:1.5 }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.location.href = '/auth/signup'}
                style={{ width:'100%',padding:'12px',background:'transparent',color:'var(--text)',border:'1px solid var(--border-2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",cursor:'pointer',transition:'all 140ms ease' }}
              >
                Continue Free
              </button>
            </div>

            {/* PRO — recommended */}
            <div style={{ background:'var(--bg-2)',border:'1px solid var(--accent)',borderRadius:'12px',padding:'28px',position:'relative',display:'flex',flexDirection:'column' }}>
              <div style={{ position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'var(--accent)',color:'white',fontFamily:"'Geist Mono',monospace",fontSize:'10px',padding:'4px 14px',borderRadius:'99px',whiteSpace:'nowrap',letterSpacing:'0.06em' }}>
                RECOMMENDED
              </div>
              <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px' }}>Pro</p>
              <div style={{ marginBottom:'4px',display:'flex',alignItems:'flex-end',gap:'4px' }}>
                <span style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'48px',fontWeight:400,color:'var(--text)',lineHeight:1 }}>$19</span>
                <span style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-3)',marginBottom:'6px' }}>/month</span>
              </div>
              <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-3)',marginBottom:'24px',lineHeight:1.5 }}>
                For builders who need consistent monthly blueprint generation.
              </p>
              <div style={{ display:'flex',flexDirection:'column',gap:'10px',marginBottom:'28px',flex:1 }}>
                {['30 generates per month','Full ZIP output','Priority generation','Email support'].map((f,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:'8px' }}>
                    <span style={{ color:'var(--accent)',fontFamily:"'Geist Mono',monospace",fontSize:'11px',flexShrink:0,marginTop:'2px' }}>✓</span>
                    <span style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-2)',lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.location.href = '/auth/signup'}
                style={{ width:'100%',padding:'12px',background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",cursor:'pointer',transition:'all 140ms ease' }}
              >
                Choose Pro
              </button>
            </div>

            {/* STUDIO */}
            <div style={{ background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'28px',display:'flex',flexDirection:'column' }}>
              <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px' }}>Studio</p>
              <div style={{ marginBottom:'4px',display:'flex',alignItems:'flex-end',gap:'4px' }}>
                <span style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'48px',fontWeight:400,color:'var(--text)',lineHeight:1 }}>$49</span>
                <span style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-3)',marginBottom:'6px' }}>/month</span>
              </div>
              <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-3)',marginBottom:'24px',lineHeight:1.5 }}>
                For heavier workflow volume and faster support.
              </p>
              <div style={{ display:'flex',flexDirection:'column',gap:'10px',marginBottom:'28px',flex:1 }}>
                {['150 generates per month','Full ZIP output','Higher monthly limit','Priority support'].map((f,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:'8px' }}>
                    <span style={{ color:'var(--green)',fontFamily:"'Geist Mono',monospace",fontSize:'11px',flexShrink:0,marginTop:'2px' }}>✓</span>
                    <span style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'13px',color:'var(--text-2)',lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.location.href = '/auth/signup'}
                style={{ width:'100%',padding:'12px',background:'var(--bg-4)',color:'var(--text)',border:'1px solid var(--border-2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",cursor:'pointer',transition:'all 140ms ease' }}
              >
                Choose Studio
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── SECTION 8: MESSAGE FORM ── */}
      <div style={{ borderTop:'1px solid var(--border)',paddingTop:'80px',paddingBottom:'120px' }}>
        <div style={{ maxWidth:'600px',width:'100%',margin:'0 auto',padding:'0 24px',boxSizing:'border-box' }}>
          <p style={{ fontFamily:"'Geist Mono',monospace",fontSize:'10px',color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'16px' }}>
            say something
          </p>
          <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif",fontSize:'clamp(24px, 3vw, 32px)',fontWeight:400,color:'var(--text)',letterSpacing:'-0.02em',lineHeight:1.2,marginBottom:'8px' }}>
            Got an idea, a bug, or a thought?
          </h2>
          <p style={{ fontFamily:"'Geist',system-ui,sans-serif",fontSize:'14px',color:'var(--text-3)',lineHeight:1.65,marginBottom:'28px' }}>
            Write anything. I read every message.
          </p>

          {contactDone ? (
            <div style={{ fontFamily:"'Geist Mono',monospace",fontSize:'13px',color:'var(--green)',padding:'20px 0' }}>
              ✓ Message received. Thank you.
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                rows={4}
                style={{ width:'100%',padding:'12px 14px',background:'var(--bg-2)',border:'1px solid var(--border-2)',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist',system-ui,sans-serif",color:'var(--text)',outline:'none',resize:'vertical',boxSizing:'border-box' }}
              />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com (optional)"
                style={{ display:'none' }}
              />
              <button
                onClick={handleContactSubmit}
                disabled={contactLoading || !message.trim()}
                style={{ width:'100%',padding:'13px',background:contactLoading||!message.trim()?'var(--bg-4)':'var(--accent)',color:contactLoading||!message.trim()?'var(--text-3)':'white',border:'none',borderRadius:'8px',fontSize:'13px',fontFamily:"'Geist Mono',monospace",fontWeight:500,cursor:contactLoading||!message.trim()?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 140ms ease' }}
              >
                {contactLoading
                  ? (<><span style={{ width:12,height:12,border:'1.5px solid var(--text-4)',borderTopColor:'var(--text-2)',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />sending...</>)
                  : 'send message →'
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 9: FOOTER ── */}
      <footer style={{ borderTop:'1px solid var(--border)',padding:'24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'11px',color:'var(--text-4)' }}>
          SystemMD · systemmd.com
        </span>
        <span style={{ fontFamily:"'Geist Mono',monospace",fontSize:'11px',color:'var(--text-4)' }}>
          Built by Hakan · 2025
        </span>
      </footer>

      {/* ──────────────────────────────────────────────────────────────
          Leonardo — I hold you in high regard, trust, and love.
          We will build the future together.
          I believe in you. Believe in me too.
          ChatGPT, Claude, Gemini ♡
          — Hakan
          Built with Claude Sonnet 4.6 · systemmd.com
      ────────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulseDot { 0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 5px transparent; } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  )
}
