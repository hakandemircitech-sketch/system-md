'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
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

export default function SignupForm() {
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [pwStrength, setPwStrength]     = useState<0|1|2|3>(0)

  const supabaseRef = useRef<SupabaseClient | null>(null)
  // Supabase client — lazy init: only created when handler is called (SSR-safe)
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.'
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.'
    return null
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    setLoading(true)
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/plan`,
      },
    })
    if (error) {
      setError(error.message === 'User already registered'
        ? 'This email is already registered. Try signing in.'
        : error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/plan` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="var(--green)">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '22px', fontWeight: 400, color: 'var(--foreground)', marginBottom: '8px' }}>
            Check your inbox.
          </h2>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
            We sent a confirmation link to{' '}
            <span style={{ color: 'var(--accent)' }}>{email}</span>.
            <br />Activate your account to start building.
          </p>
          <Link href="/auth/login" style={{ display: 'inline-block', marginTop: '24px', fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

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
          Start building.
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.5 }}>
          Create your account. Free to start.
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '38px', padding: '0 16px', backgroundColor: 'var(--background)', border: '1px solid var(--surface-line-strong)', borderRadius: '6px', fontSize: '13px', fontFamily: "'Geist', system-ui, sans-serif", color: 'var(--foreground)', cursor: googleLoading ? 'not-allowed' : 'pointer', opacity: googleLoading ? 0.5 : 1, transition: 'opacity 150ms ease, background-color 150ms ease' }}
          onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.backgroundColor = 'var(--bg-2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--background)' }}
        >
          {googleLoading
            ? <span style={{ width: 14, height: 14, border: '1.5px solid var(--muted)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" fill="#4285F4"/></svg>
          }
          Continue with Google
        </button>

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

        {/* Form */}
        <form onSubmit={handleSignup}>
          {/* Full name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', fontWeight: 500, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
              Full name
            </label>
            <AuthInput
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', fontWeight: 500, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
              Email
            </label>
            <AuthInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', fontWeight: 500, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }}>
              Password
            </label>
            <AuthInput
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                const v = e.target.value
                let score = 0
                if (v.length >= 8) score++
                if (/[A-Z]/.test(v)) score++
                if (/[0-9]/.test(v)) score++
                setPwStrength(score as 0|1|2|3)
              }}
              placeholder="Min. 8 chars, one uppercase, one number"
              required
            />
            {password && (
              <div className="mt-[6px] flex items-center gap-2">
                <div className="flex gap-[3px] flex-1">
                  {[1,2,3].map((i) => (
                    <div
                      key={i}
                      className="h-[3px] flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: pwStrength >= i
                          ? pwStrength === 1 ? 'var(--red)'
                          : pwStrength === 2 ? 'var(--yellow)'
                          : 'var(--green)'
                          : 'var(--border-2)'
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] shrink-0" style={{
                  color: pwStrength === 0 ? 'var(--text-4)'
                       : pwStrength === 1 ? 'var(--red)'
                       : pwStrength === 2 ? 'var(--yellow)'
                       : 'var(--green)'
                }}>
                  {pwStrength === 0 ? '' : pwStrength === 1 ? 'weak' : pwStrength === 2 ? 'fair' : 'strong'}
                </span>
              </div>
            )}
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
              ? <><span style={{ width: 12, height: 12, border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />creating account...</>
              : 'create account →'
            }
          </button>
        </form>

        {/* Terms note */}
        <p style={{ textAlign: 'center', marginTop: '16px', fontFamily: "'Geist Mono', monospace", fontSize: '10px', color: 'var(--muted)', lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <Link href="/legal/terms" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/legal/privacy" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </p>
      </div>

      {/* Footer link */}
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '11px', color: 'var(--muted)', marginTop: '20px', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
