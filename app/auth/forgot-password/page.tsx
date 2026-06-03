'use client'

import { useState } from 'react'
import Link         from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const origin   = window.location.origin

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    })

    setLoading(false)
    if (error) { setError(error.message) } else { setSent(true) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#060B16',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.5rem',
            fontWeight: 800, color: 'var(--color-tx)',
          }}>
            Attach<span style={{ color: '#3B82F6' }}>Hub</span>
          </p>
        </div>

        <div style={{
          background: '#101A2E', borderRadius: 16,
          border: '1px solid #1E2D4A', padding: '2rem',
        }}>
          {sent ? (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"
                  stroke="#3B82F6" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.2rem',
                fontWeight: 700, color: '#EEF4FF', marginBottom: '0.5rem',
              }}>
                Check your inbox
              </h1>
              <p style={{ color: '#8BA4C8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                We sent a reset link to{' '}
                <strong style={{ color: '#EEF4FF' }}>{email}</strong>.
                The link expires in 1 hour.
              </p>
              <p style={{ color: '#8BA4C8', fontSize: '0.8rem', marginTop: '1rem' }}>
                Didn`t receive it?{' '}
                <button onClick={() => { setSent(false); setError(null) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#3B82F6', fontSize: '0.8rem', padding: 0,
                  }}>
                  Try again
                </button>
              </p>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.3rem',
                fontWeight: 700, color: '#EEF4FF', marginBottom: '0.375rem',
              }}>
                Reset your password
              </h1>
              <p style={{
                color: '#8BA4C8', fontSize: '0.875rem',
                marginBottom: '1.75rem', lineHeight: 1.5,
              }}>
                Enter your account email and we`ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div>
                  <label style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 500,
                    color: '#8BA4C8', marginBottom: '0.4rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#060B16', border: '1px solid #1E2D4A',
                      borderRadius: 10, padding: '0.7rem 1rem',
                      color: '#EEF4FF', fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                </div>

                {error && (
                  <p style={{
                    color: '#EF4444', fontSize: '0.8rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 8, padding: '0.6rem 0.875rem',
                  }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  style={{
                    background: loading ? 'rgba(59,130,246,0.6)' : '#3B82F6',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms ease',
                  }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <div style={{
            borderTop: '1px solid #1E2D4A',
            marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center',
          }}>
            <Link href="/auth/login"
              style={{ color: '#8BA4C8', fontSize: '0.85rem', textDecoration: 'none' }}>
              ← Back to login
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}