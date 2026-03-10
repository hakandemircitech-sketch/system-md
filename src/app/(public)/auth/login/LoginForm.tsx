'use client'

import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Shared style helpers ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--background)',
  border: '1px solid var(--surface-line-strong)',
  borderRadius: '6px',
  padding: '9px 12px',
  fontSize: '13px',
  fontFamily: "'Geist', system-ui, sans-serif",
  color: 'var(--foreground)',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--accent)' : 'var(--surface-line-strong)',
        boxShadow: focused ? '0 0 0 3px var(--accent-dim)' : 'none',
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
    />
  )
}

function OAuthButton({
  onClick,
  disabled,
  loading,
  icon,
  children,
}: {
  onClick: () => void
  disabled: boolean
  loading: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        height: '38px',
        padding: '0 16px',
        backgroundColor: 'var(--background)',
        border: '1px solid var(--surface-line-strong)',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: "'Geist', system-ui, sans-serif",
        color: 'var(--foreground)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 150ms ease, background-color 150ms ease',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'var(--bg-2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)' }}
    >
      {loading
        ? <span style={{ width: 14, height: 14, border: '1.5px solid var(--muted)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
        : icon}
      {children}
    </button>
  )
}

// ── Form ───────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [magicSent, setMagicSent]       = useState(false)
  const [emailError, setEmailError]     = useState('')

// Supabase client — lazy init: only created when handler is called (SSR-safe)
  const supabaseRef = useRef<SupabaseClient | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : error.message)
      setLoading(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://system-md.com/auth/callback?next=${redirectTo}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  async function handleGithubLogin() {
    setGithubLoading(true)
    setError(null)
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    })
    if (error) { setError(error.message); setGithubLoading(false) }
  }

  async function handleMagicLink() {
    if (!email) { setError('Enter your email address to send a magic link.'); return }
    setMagicLoading(true)
    setError(null)
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    })
    if (error) { setError(error.message) } else { setMagicSent(true) }
    setMagicLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Logo */}
      <Link href="/" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '13px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--foreground)', marginBottom: '40px', display: 'block', textDecoration: 'none', textAlign: 'center' }}>
        System<span style={{ color: 'var(--accent)' }}>MD</span>
        <span className="cursor-blink" style={{ color: 'var(--accent)' }}>_</span>
      </Link>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-line-strong)', borderRadius: '10px', padding: '32px' }}>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '24px', fontWeight: 400, color: 'var(--foreground)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Welcome back.
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.5 }}>
          Sign in to your SystemMD account.
        </p>

        {/* OAuth buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <OAuthButton onClick={handleGoogleLogin} disabled={googleLoading || githubLoading} loading={googleLoading}
            icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" fill="#4285F4"/></svg>}
          >Google</OAuthButton>
          <OAuthButton onClick={handleGithubLogin} disabled={githubLoading || googleLoading} loading={githubLoading}
            icon={<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>}
          >GitHub</OAuthButton>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-line-strong)' }} />
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', color: 'var(--muted)' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--surface-line-strong)' }} />
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', marginBottom: '16px' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
            </svg>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: 'var(--danger)', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Magic link sent */}
        {magicSent && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '16px' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--green)" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
            </svg>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: 'var(--green)', lineHeight: 1.5 }}>
              Magic link sent. Check your inbox.
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', fontWeight: 500, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
              Email
            </label>
            <AuthInput
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
              onBlur={() => {
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setEmailError('Enter a valid email address')
                } else {
                  setEmailError('')
                }
              }}
              placeholder="you@company.com"
              required
            />
            {emailError && (
              <p className="font-mono text-[10px] text-[var(--red)] mt-[4px]">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', fontWeight: 500, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={magicLoading}
                style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', opacity: magicLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
              >
                {magicLoading && <span style={{ width: 10, height: 10, border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                {magicLoading ? 'Sending…' : 'Magic link →'}
              </button>
            </div>
            <AuthInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', backgroundColor: 'var(--foreground)', color: 'var(--background)', fontFamily: "'Geist Mono', monospace", fontSize: '13px', fontWeight: 500, padding: '10px', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'opacity 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.8' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = loading ? '0.5' : '1' }}
          >
            {loading
              ? <><span style={{ width: 12, height: 12, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />signing in...</>
              : 'sign in →'
            }
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: 'var(--muted)', marginTop: '20px', textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" style={{ color: 'var(--accent)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Start building →
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
