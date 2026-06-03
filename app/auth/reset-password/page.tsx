'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { createClient }        from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [done,         setDone]         = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  // Callback route already exchanged the code — we just verify the session exists
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      } else {
        setError('This reset link has expired or already been used. Please request a new one.')
      }
    }
    checkSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) { setError(error.message); setLoading(false); return }

    setDone(true)

    // Redirect to their dashboard after 2s
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: roleData } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).single()
      setTimeout(() => router.push(`/dashboard/${roleData?.role ?? 'student'}`), 2000)
    }
  }

  // ── Loading (checking session) ────────────────────────────────────────────
  if (!sessionReady && !error) {
    return (
      <div style={{
        minHeight: '100vh', background: '#060B16',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#8BA4C8', fontSize: '0.875rem' }}>Verifying reset link…</p>
      </div>
    )
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

          {done ? (
            /* ── Success ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"
                  stroke="#10B981" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.2rem',
                fontWeight: 700, color: '#EEF4FF', marginBottom: '0.5rem',
              }}>
                Password updated!
              </h1>
              <p style={{ color: '#8BA4C8', fontSize: '0.875rem' }}>
                Taking you to your dashboard…
              </p>
            </div>

          ) : !sessionReady ? (
            /* ── Expired link ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"
                  stroke="#EF4444" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.2rem',
                fontWeight: 700, color: '#EEF4FF', marginBottom: '0.5rem',
              }}>
                Link expired
              </h1>
              <p style={{ color: '#8BA4C8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {error}
              </p>
              <a href="/auth/forgot-password" style={{
                display: 'inline-block', marginTop: '1.25rem',
                color: '#3B82F6', fontSize: '0.875rem', textDecoration: 'none',
              }}>
                Request a new link →
              </a>
            </div>

          ) : (
            /* ── Password form ── */
            <>
              <h1 style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.3rem',
                fontWeight: 700, color: '#EEF4FF', marginBottom: '0.375rem',
              }}>
                Set new password
              </h1>
              <p style={{
                color: '#8BA4C8', fontSize: '0.875rem',
                marginBottom: '1.75rem', lineHeight: 1.5,
              }}>
                Choose a strong password for your account.
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
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#060B16', border: '1px solid #1E2D4A',
                      borderRadius: 10, padding: '0.7rem 1rem',
                      color: '#EEF4FF', fontSize: '0.9rem', outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 500,
                    color: '#8BA4C8', marginBottom: '0.4rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                  }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
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
                  disabled={loading || !password || !confirm}
                  style={{
                    background: loading ? 'rgba(59,130,246,0.6)' : '#3B82F6',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '0.75rem', fontSize: '0.9rem', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms ease',
                  }}
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}